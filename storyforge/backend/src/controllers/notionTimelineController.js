const notionService = require('../services/notionService');
const logger = require('../utils/logger');
const { notionCache, makeCacheKey } = require('../services/notionService');
const { getDB } = require('../db/database');
const { catchAsync, setCacheHeaders } = require('../utils/controllerUtils');

const getTimelineEvents = catchAsync(async (req, res) => {
  const { search, limit = 50, offset = 0, ...filterParams } = req.query;
  
  const cacheKey = makeCacheKey('timeline-events', filterParams);
  const cached = notionCache.get(cacheKey);
  let events;
  
  if (cached) {
    logger.debug(`[CACHE HIT] ${cacheKey}`);
    events = cached;
  } else {
    events = await notionService.getTimelineEvents(filterParams);
    notionCache.set(cacheKey, events);
    logger.debug(`[CACHE SET] ${cacheKey} - Cached ${events.length} timeline events.`);
  }
  
  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    events = events.filter(event => 
      (event.description && event.description.toLowerCase().includes(searchLower)) ||
      (event.date && event.date.toLowerCase().includes(searchLower)) ||
      (event.act_focus && event.act_focus.toLowerCase().includes(searchLower))
    );
  }
  
  // Apply pagination
  const total = events.length;
  const paginated = events.slice(
    parseInt(offset), 
    parseInt(offset) + parseInt(limit)
  );
  
  setCacheHeaders(res);
  res.json({
    data: paginated,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

const getTimelineEventsList = catchAsync(async (req, res) => {
  const { search, limit = 50, offset = 0 } = req.query;
  const db = getDB();
  
  let events = db.prepare('SELECT * FROM timeline_events ORDER BY act_position').all();
  
  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    events = events.filter(event => 
      (event.description && event.description.toLowerCase().includes(searchLower)) ||
      (event.date && event.date.toLowerCase().includes(searchLower)) ||
      (event.act_focus && event.act_focus.toLowerCase().includes(searchLower))
    );
  }
  
  // Apply pagination
  const total = events.length;
  const paginated = events.slice(
    parseInt(offset), 
    parseInt(offset) + parseInt(limit)
  );
  
  res.json({
    data: paginated,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

const getTimelineEventById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const cacheKey = makeCacheKey('timeline-event', id);
  const cached = notionCache.get(cacheKey);
  if (cached) {
    logger.debug(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }

  const event = await notionService.getTimelineEventById(id);
  if (!event) {
    return res.status(404).json({ error: 'Timeline event not found' });
  }

  notionCache.set(cacheKey, event);
  logger.debug(`[CACHE SET] ${cacheKey}`);
  setCacheHeaders(res);
  res.json(event);
});

const getTimelineGraph = catchAsync(async (req, res) => {
  const { id } = req.params;
  const db = getDB();
  
  // Get timeline event details
  const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(id);
  if (!event) {
    return res.status(404).json({ error: 'Timeline event not found' });
  }
  
  // Get connected characters
  const connectedCharacters = db.prepare(`
    SELECT c.* FROM characters c
    JOIN character_timeline_events cte ON c.id = cte.character_id
    WHERE cte.timeline_event_id = ?
  `).all(id);
  
  // Get other timeline events in the same act
  const relatedEvents = db.prepare(`
    SELECT * FROM timeline_events 
    WHERE act_position = ? AND id != ?
    ORDER BY act_position
  `).all(event.act_position, id);
  
  const nodes = [
    {
      id: event.id,
      data: event,
      type: 'timeline_event',
      x: 0,
      y: 0
    },
    ...connectedCharacters.map((char, i) => ({
      id: char.id,
      data: char,
      type: 'character',
      x: -200,
      y: i * 100 - 50
    })),
    ...relatedEvents.map((evt, i) => ({
      id: evt.id,
      data: evt,
      type: 'timeline_event',
      x: 200,
      y: i * 100 - 50
    }))
  ];
  
  const edges = [
    ...connectedCharacters.map(char => ({
      id: `${char.id}-${event.id}`,
      source: char.id,
      target: event.id,
      label: 'participates in'
    })),
    ...relatedEvents.map(evt => ({
      id: `${event.id}-${evt.id}`,
      source: event.id,
      target: evt.id,
      label: 'same act'
    }))
  ];
  
  setCacheHeaders(res);
  res.json({ nodes, edges });
});

module.exports = {
  getTimelineEvents,
  getTimelineEventsList,
  getTimelineEventById,
  getTimelineGraph
};