const request = require('supertest');
const app = require('../../src/index'); // Main Express app
const { getDB, initializeDatabase, closeDB } = require('../../src/db/database');

// Helper function to insert a test character
const insertTestCharacter = (db, { id, name = 'Test Character', type = 'Protagonist', tier = 'Main', logline = 'A test character.' }) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO characters (id, name, type, tier, logline)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, type=excluded.type, tier=excluded.tier, logline=excluded.logline
    `);
    stmt.run(id, name, type, tier, logline);
  } catch (error) {
    console.error("Test setup error inserting character: ", error.message);
    throw error;
  }
};

// Helper function to insert a test gap
const insertTestGap = (db, { id, character_id, start_minute, end_minute, severity, status, resolution_comment, suggested_solutions = '[]' }) => {
  // The 'gaps' table needs to exist with these columns (id, character_id, start_minute, end_minute, severity, suggested_solutions)
  // plus 'status' and 'resolution_comment' for this endpoint's tests.
  // The initial_schema.sql might be missing status and resolution_comment.
  // If they are missing, this insert will fail, highlighting the schema gap.
  try {
    const stmt = db.prepare(`
      INSERT INTO gaps (id, character_id, start_minute, end_minute, severity, suggested_solutions, status, resolution_comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        character_id=excluded.character_id,
        start_minute=excluded.start_minute,
        end_minute=excluded.end_minute,
        severity=excluded.severity,
        suggested_solutions=excluded.suggested_solutions,
        status=excluded.status,
        resolution_comment=excluded.resolution_comment
      RETURNING id`);
    const result = stmt.run(id, character_id, start_minute, end_minute, severity, suggested_solutions, status, resolution_comment);
    return result.lastInsertRowid || id; // lastInsertRowid might not be id if id is TEXT, so return id
  } catch (error) {
    console.error("Test setup error inserting gap: ", error.message);
    // This error often indicates schema mismatch (e.g., missing columns 'status' or 'resolution_comment').
    throw error; // Propagate error to fail tests clearly
  }
};


describe('POST /api/gaps/:gapId/resolve', () => {
  let db;
  const testGapId1 = 'test-gap-resolve-1';
  const testGapId2 = 'test-gap-resolve-2';
  const testGapId3 = 'test-gap-resolve-3';

  beforeAll(async () => {
    // Initialize the database for tests (in-memory is default for NODE_ENV=test)
    // initializeDatabase will run migrations.
    db = initializeDatabase(); // Uses in-memory by default when NODE_ENV=test

    // Insert sample characters first to satisfy FOREIGN KEY constraints
    insertTestCharacter(db, { id: 'char1', name: 'Character One' });
    insertTestCharacter(db, { id: 'char2', name: 'Character Two' });

    // Insert sample gaps
    // This will fail if 'gaps' table doesn't have 'status' and 'resolution_comment' columns from migrations.
    insertTestGap(db, { id: testGapId1, character_id: 'char1', start_minute: 0, end_minute: 5, severity: 'High', status: 'Open', resolution_comment: '' });
    insertTestGap(db, { id: testGapId2, character_id: 'char1', start_minute: 10, end_minute: 15, severity: 'Medium', status: 'Open', resolution_comment: '' });
    insertTestGap(db, { id: testGapId3, character_id: 'char2', start_minute: 20, end_minute: 25, severity: 'Low', status: 'Investigating', resolution_comment: 'Looking into it' });
  });

  afterAll(async () => {
    if (db) {
      // Clean up specific test data
      db.prepare("DELETE FROM gaps WHERE id IN (?, ?, ?)").run(testGapId1, testGapId2, testGapId3);
      db.prepare("DELETE FROM characters WHERE id IN (?, ?)").run('char1', 'char2');
      await closeDB();
    }
  });

  it('should resolve a gap successfully with status and comment', async () => {
    const response = await request(app)
      .post(`/api/gaps/${testGapId1}/resolve`)
      .send({ status: 'Resolved', comment: 'Added new element X.' });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Gap resolved successfully');
    expect(response.body.gap.id).toBe(testGapId1);
    expect(response.body.gap.status).toBe('Resolved');
    expect(response.body.gap.resolution_comment).toBe('Added new element X.');

    // Verify in DB
    const gapInDb = db.prepare("SELECT status, resolution_comment FROM gaps WHERE id = ?").get(testGapId1);
    expect(gapInDb.status).toBe('Resolved');
    expect(gapInDb.resolution_comment).toBe('Added new element X.');
  });

  it('should return 404 if gap not found', async () => {
    const response = await request(app)
      .post('/api/gaps/non-existent-gap-id/resolve')
      .send({ status: 'Resolved', comment: 'Trying to resolve non-existent gap.' });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Gap not found or not updated.');
  });

  it('should return 400 if status is missing in payload', async () => {
    const response = await request(app)
      .post(`/api/gaps/${testGapId2}/resolve`)
      .send({ comment: 'Attempting to resolve without status.' });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Status is required to resolve a gap.');
  });

  it('should resolve a gap successfully with only status (comment is optional)', async () => {
    const response = await request(app)
      .post(`/api/gaps/${testGapId3}/resolve`)
      .send({ status: 'Closed' });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Gap resolved successfully');
    expect(response.body.gap.id).toBe(testGapId3);
    expect(response.body.gap.status).toBe('Closed');
    // The queries.js defaults comment to '' if undefined
    expect(response.body.gap.resolution_comment).toBe('');

    // Verify in DB
    const gapInDb = db.prepare("SELECT status, resolution_comment FROM gaps WHERE id = ?").get(testGapId3);
    expect(gapInDb.status).toBe('Closed');
    expect(gapInDb.resolution_comment).toBe('');
  });
});
