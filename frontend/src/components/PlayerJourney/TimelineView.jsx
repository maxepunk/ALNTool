import React, { useState, useMemo, useCallback, useEffect } from 'react';
import useJourneyStore from '../../stores/journeyStore'; // Import Zustand store

// Mock data remains the same for now
const mockData = [
  { type: 'activity', start: 0, end: 10, name: 'Activity 1' },
  { type: 'interaction', start: 15, end: 20, name: 'Interaction 1' },
  { type: 'discovery', start: 25, end: 30, name: 'Discovery 1' },
  { type: 'gap', start: 30, end: 40, name: 'Gap 1' },
  { type: 'activity', start: 45, end: 60, name: 'Activity 2' },
  { type: 'interaction', start: 65, end: 75, name: 'Interaction 2' },
  { type: 'discovery', start: 80, end: 85, name: 'Discovery 2' },
];

const EVENT_TYPES_STYLE = {
  activity: { backgroundColor: 'lightblue', borderColor: '#79bddc' },
  interaction: { backgroundColor: 'lightgreen', borderColor: '#7fbf7f' },
  discovery: { backgroundColor: 'lightcoral', borderColor: '#d47a7a' },
  gap: { backgroundColor: 'lightgray', borderColor: '#a0a0a0' },
};

const TimelineView = () => {
  const TOTAL_PLAY_TIME = 90; // minutes
  const SEGMENT_DURATION = 5; // minutes

  const [viewStartTime, setViewStartTime] = useState(0);
  const [viewEndTime, setViewEndTime] = useState(TOTAL_PLAY_TIME);

  // Zustand store integration
  const selectedTimeRange = useJourneyStore((state) => state.selectedTimeRange);
  const setSelectedTimeRangeInStore = useJourneyStore((state) => state.setSelectedTimeRange);

  // Local filter state, synced with store
  const [filterStartTime, setFilterStartTime] = useState(selectedTimeRange[0]);
  const [filterEndTime, setFilterEndTime] = useState(selectedTimeRange[1]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragInitialViewStart, setDragInitialViewStart] = useState(0);

  // Calculate the current duration visible in the timeline
  const currentVisibleDuration = useMemo(() => viewEndTime - viewStartTime, [viewStartTime, viewEndTime]);

  const handleZoomIn = useCallback(() => {
    const newDuration = Math.max(30, currentVisibleDuration / 1.5);
    const center = (viewStartTime + viewEndTime) / 2;
    setViewStartTime(Math.max(0, center - newDuration / 2));
    setViewEndTime(Math.min(TOTAL_PLAY_TIME, center + newDuration / 2));
  }, [viewStartTime, viewEndTime, currentVisibleDuration]);

  const handleZoomOut = useCallback(() => {
    const newDuration = Math.min(TOTAL_PLAY_TIME, currentVisibleDuration * 1.5);
    const center = (viewStartTime + viewEndTime) / 2;
    setViewStartTime(Math.max(0, center - newDuration / 2));
    setViewEndTime(Math.min(TOTAL_PLAY_TIME, center + newDuration / 2));
  }, [viewStartTime, viewEndTime, currentVisibleDuration]);

  const handleResetZoom = useCallback(() => {
    setViewStartTime(0);
    setViewEndTime(TOTAL_PLAY_TIME);
  }, []);


  const renderSegments = useMemo(() => {
    const segments = [];
    const numSegments = Math.ceil(currentVisibleDuration / SEGMENT_DURATION);

    for (let i = 0; i <= numSegments; i++) {
      const timeMark = viewStartTime + (i * SEGMENT_DURATION);
      if (timeMark > viewEndTime + SEGMENT_DURATION / 2 && timeMark > TOTAL_PLAY_TIME) break;

      const positionPercent = ((timeMark - viewStartTime) / currentVisibleDuration) * 100;

      segments.push(
        <div
          key={`segment-${timeMark}`}
          style={{
            position: 'absolute',
            left: `${positionPercent}%`,
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: (timeMark < filterStartTime || timeMark > filterEndTime) ? '#e0e0e0' : '#ccc', // Gray out if outside filter
            zIndex: 1,
          }}
        >
          <span style={{
            position: 'absolute',
            bottom: '-20px',
            left: '2px',
            fontSize: '10px',
            color: (timeMark < filterStartTime || timeMark > filterEndTime) ? '#aaa' : '#666' // Dim text if outside filter
          }}>
            {timeMark}m
          </span>
        </div>
      );
    }
    return segments;
  }, [viewStartTime, viewEndTime, currentVisibleDuration, filterStartTime, filterEndTime]);


  const filteredEvents = useMemo(() => {
    return mockData.filter(event => event.start < filterEndTime && event.end > filterStartTime);
  }, [filterStartTime, filterEndTime]);


  const renderEvents = useMemo(() => {
    return filteredEvents.map((event, index) => {
      // Adjust event start and end based on the current view window
      const eventStartInView = Math.max(event.start, viewStartTime);
      const eventEndInView = Math.min(event.end, viewEndTime);

      // Calculate position and width relative to the current view window
      const leftPosition = ((eventStartInView - viewStartTime) / currentVisibleDuration) * 100;
      const width = ((eventEndInView - eventStartInView) / currentVisibleDuration) * 100;

      // Skip rendering if the event is completely outside the current view or filter
      if (width <= 0 || event.end <= viewStartTime || event.start >= viewEndTime) {
        return null;
      }

      const style = EVENT_TYPES_STYLE[event.type] || { backgroundColor: '#eee', borderColor: '#ccc' };

      return (
        <div
          key={`event-${index}`}
          style={{
            position: 'absolute',
            left: `${leftPosition}%`,
            width: `${width}%`,
            top: '10%', // Position events a bit lower
            height: '60%', // Make events a bit taller
            backgroundColor: style.backgroundColor,
            border: `1px solid ${style.borderColor}`,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            zIndex: 2,
          }}
          title={`${event.name} (${event.start}m - ${event.end}m)`}
        >
          {event.name}
        </div>
      );
    });
  }, [filteredEvents, viewStartTime, viewEndTime, currentVisibleDuration]);

  const currentVisibleDuration = useMemo(() => viewEndTime - viewStartTime, [viewStartTime, viewEndTime]);

  const handleZoomIn = useCallback(() => {
    const newDuration = Math.max(30, currentVisibleDuration / 1.5);
    const center = (viewStartTime + viewEndTime) / 2;
    setViewStartTime(Math.max(0, center - newDuration / 2));
    setViewEndTime(Math.min(TOTAL_PLAY_TIME, center + newDuration / 2));
  }, [viewStartTime, viewEndTime, currentVisibleDuration]);

  const handleZoomOut = useCallback(() => {
    const newDuration = Math.min(TOTAL_PLAY_TIME, currentVisibleDuration * 1.5);
    const center = (viewStartTime + viewEndTime) / 2;
    setViewStartTime(Math.max(0, center - newDuration / 2));
    setViewEndTime(Math.min(TOTAL_PLAY_TIME, center + newDuration / 2));
  }, [viewStartTime, viewEndTime, currentVisibleDuration]);

  const handleResetZoom = useCallback(() => {
    setViewStartTime(0);
    setViewEndTime(TOTAL_PLAY_TIME);
  }, []);

  const handlePanStart = useCallback((e) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragInitialViewStart(viewStartTime);
    e.target.style.cursor = 'grabbing';
  }, [viewStartTime]);

  const handlePanMove = useCallback((e) => {
    if (!isDragging) return;
    const dragDeltaX = e.clientX - dragStartX;
    // Convert pixel delta to time delta: (pixelDelta / containerWidth) * currentVisibleDuration
    const timeDelta = (dragDeltaX / e.target.clientWidth) * currentVisibleDuration;

    let newViewStartTime = dragInitialViewStart - timeDelta;
    // Clamp newViewStartTime to prevent panning beyond 0 and TOTAL_PLAY_TIME - currentVisibleDuration
    newViewStartTime = Math.max(0, newViewStartTime);
    newViewStartTime = Math.min(TOTAL_PLAY_TIME - currentVisibleDuration, newViewStartTime);

    setViewStartTime(newViewStartTime);
    setViewEndTime(newViewStartTime + currentVisibleDuration);
  }, [isDragging, dragStartX, dragInitialViewStart, currentVisibleDuration, TOTAL_PLAY_TIME]);

  const handlePanEnd = useCallback((e) => {
    setIsDragging(false);
    if (e.target.style) e.target.style.cursor = 'grab';
  }, []);

  const selectedItemId = useJourneyStore((state) => state.selectedItemId);
  const setSelectedItemId = useJourneyStore((state) => state.setSelectedItemId);
  const setActiveGapDetails = useJourneyStore((state) => state.setActiveGapDetails);

  // Update local filter state when store changes
  useEffect(() => {
    setFilterStartTime(selectedTimeRange[0]);
    setFilterEndTime(selectedTimeRange[1]);
  }, [selectedTimeRange]);

  const handleFilterStartChange = (e) => {
    const newStart = parseInt(e.target.value, 10);
    if (!isNaN(newStart)) {
      const validatedStart = Math.max(0, Math.min(newStart, filterEndTime, TOTAL_PLAY_TIME));
      setFilterStartTime(validatedStart);
      setSelectedTimeRangeInStore([validatedStart, filterEndTime]);
    }
  };

  const handleFilterEndChange = (e) => {
    const newEnd = parseInt(e.target.value, 10);
    if (!isNaN(newEnd)) {
      const validatedEnd = Math.min(TOTAL_PLAY_TIME, Math.max(newEnd, filterStartTime, 0));
      setFilterEndTime(validatedEnd);
      setSelectedTimeRangeInStore([filterStartTime, validatedEnd]);
    }
  };


  const renderSegments = useMemo(() => {
    const segments = [];
    const numSegments = Math.ceil(currentVisibleDuration / SEGMENT_DURATION);

    for (let i = 0; i <= numSegments; i++) {
      const timeMark = viewStartTime + (i * SEGMENT_DURATION);
      if (timeMark > viewEndTime + SEGMENT_DURATION / 2 && timeMark > TOTAL_PLAY_TIME) break;

      const positionPercent = ((timeMark - viewStartTime) / currentVisibleDuration) * 100;

      segments.push(
        <div
          key={`segment-${timeMark}`}
          style={{
            position: 'absolute',
            left: `${positionPercent}%`,
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: (timeMark < filterStartTime || timeMark > filterEndTime) ? '#e0e0e0' : '#ccc', // Gray out if outside filter
            zIndex: 1,
          }}
        >
          <span style={{
            position: 'absolute',
            bottom: '-20px',
            left: '2px',
            fontSize: '10px',
            color: (timeMark < filterStartTime || timeMark > filterEndTime) ? '#aaa' : '#666' // Dim text if outside filter
          }}>
            {timeMark}m
          </span>
        </div>
      );
    }
    return segments;
  }, [viewStartTime, viewEndTime, currentVisibleDuration, filterStartTime, filterEndTime]);


  const filteredEvents = useMemo(() => {
    return mockData.filter(event => event.start < filterEndTime && event.end > filterStartTime);
  }, [filterStartTime, filterEndTime]);


  const renderEvents = useMemo(() => {
    return filteredEvents.map((event, index) => {
      // Adjust event start and end based on the current view window
      const eventStartInView = Math.max(event.start, viewStartTime);
      const eventEndInView = Math.min(event.end, viewEndTime);

      // Calculate position and width relative to the current view window
      const leftPosition = ((eventStartInView - viewStartTime) / currentVisibleDuration) * 100;
      const width = ((eventEndInView - eventStartInView) / currentVisibleDuration) * 100;

      // Skip rendering if the event is completely outside the current view or filter
      if (width <= 0 || event.end <= viewStartTime || event.start >= viewEndTime) {
        return null;
      }

      const eventStyle = EVENT_TYPES_STYLE[event.type] || { backgroundColor: '#eee', borderColor: '#ccc' };
      const eventId = `event-${event.type}-${event.name}-${index}`; // More specific ID
      const isSelected = selectedItemId === eventId;

      const handleEventClick = () => {
        setSelectedItemId(eventId);
        if (event.type === 'gap') {
          setActiveGapDetails({
            id: eventId,
            character: 'Character (Mock)', // Replace with actual character data if available
            time: `${event.start}-${event.end}min`,
            description: `This is a ${event.name} for Character (Mock) from ${event.start} to ${event.end} minutes. More details would appear here.`,
            rawEventData: event, // Store the original event data if needed
          });
        } else {
          // If it's not a gap, clear activeGapDetails or set to something else
          setActiveGapDetails(null);
        }
      };

      return (
        <div
          key={eventId}
          onClick={handleEventClick}
          style={{
            position: 'absolute',
            left: `${leftPosition}%`,
            width: `${width}%`,
            top: '10%', // Position events a bit lower
            height: '60%', // Make events a bit taller
            backgroundColor: eventStyle.backgroundColor,
            border: isSelected ? '3px solid #ff4500' : `1px solid ${eventStyle.borderColor}`, // Highlight if selected
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            zIndex: 2,
            userSelect: 'none', // Prevent text selection during drag
            cursor: 'pointer', // Indicate clickable
            opacity: event.type === 'gap' ? 0.85 : 1, // Make gaps slightly more distinct if needed
          }}
          title={`${event.name} (${event.start}m - ${event.end}m) - Click to select ${event.type === 'gap' ? ' (Gap)' : ''}`}
        >
          {event.name} {event.type === 'gap' ? ' (Gap)' : ''}
        </div>
      );
    });
  }, [filteredEvents, viewStartTime, viewEndTime, currentVisibleDuration, selectedItemId, setSelectedItemId, setActiveGapDetails]);


  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Player Journey Timeline</h2>

      {/* Controls Area */}
      <div style={{
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap', // Allow wrapping for smaller screens
          justifyContent: 'space-around', // Better distribution
          alignItems: 'center',
          padding: '15px', // Increased padding
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)' // Subtle shadow
        }}>
        <div style={controlGroupStyle}>
          <span style={{fontWeight: 'bold', marginRight: '10px'}}>Zoom:</span>
          <button onClick={handleZoomIn} style={buttonStyle} title="Zoom In">Zoom In (+)</button>
          <button onClick={handleZoomOut} style={buttonStyle} title="Zoom Out">Zoom Out (-)</button>
          <button onClick={handleResetZoom} style={{...buttonStyle, marginLeft: '5px'}} title="Reset Zoom">Reset Zoom</button>
        </div>
        <div style={controlGroupStyle}>
            <span style={{fontWeight: 'bold', marginRight: '10px'}}>Filter Time (Store Synced):</span>
            <input type="number" value={filterStartTime} onChange={handleFilterStartChange} style={inputStyle} min="0" max={TOTAL_PLAY_TIME} aria-label="Filter start time" />
            <span style={{margin: '0 8px'}}>-</span>
            <input type="number" value={filterEndTime} onChange={handleFilterEndChange} style={inputStyle} min="0" max={TOTAL_PLAY_TIME} aria-label="Filter end time" />
        </div>
      </div>

      {/* Timeline Container */}
      <div
        style={{
          width: '100%',
          height: '120px', // Increased height for better event visibility & segment time
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          position: 'relative',
          overflowX: 'hidden', // Changed from 'auto' to 'hidden' as we use drag panning
          borderRadius: '4px',
          cursor: 'grab', // Indicate draggable
        }}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd} // If mouse leaves container while dragging
      >
        {/* Segments Layer */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          {renderSegments}
        </div>

        {/* Filtered Out Overlay */}
        {viewStartTime < filterStartTime && (
          <div style={{
            position: 'absolute',
            left: `${((Math.max(viewStartTime, 0) - viewStartTime) / currentVisibleDuration) * 100}%`,
            width: `${((Math.min(filterStartTime, viewEndTime) - Math.max(viewStartTime, 0)) / currentVisibleDuration) * 100}%`,
            pointerEvents: 'none',
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(180, 180, 180, 0.3)', // Semi-transparent gray
            zIndex: 0, // Behind segments but above background
          }} />
        )}
        {viewEndTime > filterEndTime && (
          <div style={{
            position: 'absolute',
            left: `${((Math.max(filterEndTime, viewStartTime) - viewStartTime) / currentVisibleDuration) * 100}%`,
            width: `${((Math.min(viewEndTime, TOTAL_PLAY_TIME) - Math.max(filterEndTime, viewStartTime)) / currentVisibleDuration) * 100}%`,
            pointerEvents: 'none',
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(180, 180, 180, 0.3)', // Semi-transparent gray
            zIndex: 0, // Behind segments but above background
          }} />
        )}

        {/* Events Layer */}
        <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>
          {renderEvents}
        </div>
      </div>
      <div style={{marginTop: '25px', fontSize: '12px', textAlign: 'right', color: '#555'}}>
        Viewing: {viewStartTime}m - {viewEndTime}m (Duration: {currentVisibleDuration}m) | Filtering: {filterStartTime}m - {filterEndTime}m
      </div>
      <div style={{marginTop: '10px', fontSize: '12px', color: '#333', backgroundColor: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #eee'}}>
        <strong>TimelineView:</strong> Currently Selected Item ID: {selectedItemId || "None"}
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '8px 12px',
  marginRight: '5px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
};

const inputStyle = {
  padding: '8px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  width: '70px', // Slightly wider
  fontSize: '14px',
  textAlign: 'center',
};

const controlGroupStyle = {
  display: 'flex',
  alignItems: 'center',
  margin: '5px 10px', // Add margin for spacing when wrapped
};

export default TimelineView;
