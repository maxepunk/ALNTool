const {
  getCharacterJourney,
  getCharacterGaps,
  getAllGaps,
  getSyncStatus,
} = require('../../src/controllers/journeyController');
const JourneyEngine = require('../../src/services/journeyEngine');

// Mock the JourneyEngine and its methods
jest.mock('../../src/services/journeyEngine');

// Mock database getDB, not strictly necessary if JourneyEngine is fully mocked, but good practice
jest.mock('../../src/db/database', () => ({
  getDB: jest.fn(() => ({})), // Returns a mock DB object
}));


describe('Journey Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn(() => mockRes), // Allow chaining res.status().json()
      send: jest.fn(),
    };
    // Reset mocks for JourneyEngine constructor and methods
    JourneyEngine.mockClear();
    // Ensure each method on the prototype is also a mock if not done by jest.mock automatically
    // For instance methods, you might need to mock them on the instance if JourneyEngine is instantiated per request.
    // Since journeyController.js instantiates it once, we mock the prototype methods.
    JourneyEngine.prototype.buildCharacterJourney = jest.fn();
    JourneyEngine.prototype.suggestGapSolutions = jest.fn(); // Though not directly called by controller
    JourneyEngine.prototype.getInteractionWindows = jest.fn(); // Though not directly called by controller

  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCharacterJourney', () => {
    it('should return a journey object for a valid characterId', async () => {
      const characterId = 'char1';
      mockReq.params.characterId = characterId;
      const mockJourney = {
        character_id: characterId,
        character_info: { id: characterId, name: 'Mock Character' },
        segments: [{ start_minute: 0, end_minute: 5, activities: ['Test Activity'] }],
        gaps: [],
      };

      // Mock that buildCharacterJourney is a method of the instance
      JourneyEngine.prototype.buildCharacterJourney.mockResolvedValue(mockJourney);

      await getCharacterJourney(mockReq, mockRes);

      expect(JourneyEngine.prototype.buildCharacterJourney).toHaveBeenCalledTimes(1);
      // Exact data for events, puzzles, elements will be from MOCK_DATA in controller,
      // so this call check is more about the characterId and general structure.
      expect(JourneyEngine.prototype.buildCharacterJourney).toHaveBeenCalledWith(
        characterId,
        expect.any(Object), // Mock character data from controller
        expect.any(Array),  // Mock events data
        expect.any(Array),  // Mock puzzles data
        expect.any(Array)   // Mock elements data
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockJourney);
    });

    it('should return 404 if character is not found in mock data', async () => {
      const characterId = 'unknownChar';
      mockReq.params.characterId = characterId;

      // No need to mock buildCharacterJourney here as controller logic should exit early

      await getCharacterJourney(mockReq, mockRes);

      expect(JourneyEngine.prototype.buildCharacterJourney).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Character not found with mock data.' });
    });

    it('should return 500 if JourneyEngine fails', async () => {
      const characterId = 'char1'; // Valid mock character
      mockReq.params.characterId = characterId;
      const errorMessage = 'Engine Failure';
      JourneyEngine.prototype.buildCharacterJourney.mockRejectedValue(new Error(errorMessage));

      await getCharacterJourney(mockReq, mockRes);

      expect(JourneyEngine.prototype.buildCharacterJourney).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to compute character journey.' });
    });
  });

  describe('getCharacterGaps', () => {
    it('should return only the gaps array for a valid characterId', async () => {
      const characterId = 'char1';
      mockReq.params.characterId = characterId;
      const mockFullJourney = {
        character_id: characterId,
        character_info: { id: characterId, name: 'Mock Character' },
        segments: [],
        gaps: [{ start_minute: 10, end_minute: 15, severity: 'low' }],
      };
      JourneyEngine.prototype.buildCharacterJourney.mockResolvedValue(mockFullJourney);

      await getCharacterGaps(mockReq, mockRes);

      expect(JourneyEngine.prototype.buildCharacterJourney).toHaveBeenCalledTimes(1);
      expect(JourneyEngine.prototype.buildCharacterJourney).toHaveBeenCalledWith(
        characterId,
        expect.any(Object), expect.any(Array), expect.any(Array), expect.any(Array)
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockFullJourney.gaps);
    });

    it('should return 404 if character is not found in mock data for gaps', async () => {
      const characterId = 'unknownChar';
      mockReq.params.characterId = characterId;

      await getCharacterGaps(mockReq, mockRes);

      expect(JourneyEngine.prototype.buildCharacterJourney).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Character not found with mock data.' });
    });

    it('should return 500 if JourneyEngine fails when getting gaps', async () => {
      const characterId = 'char1'; // Valid mock character
      mockReq.params.characterId = characterId;
      JourneyEngine.prototype.buildCharacterJourney.mockRejectedValue(new Error('Engine Failure'));

      await getCharacterGaps(mockReq, mockRes);

      expect(JourneyEngine.prototype.buildCharacterJourney).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to compute character gaps.' });
    });

     it('should return an empty array if journey has no gaps', async () => {
      const characterId = 'char1';
      mockReq.params.characterId = characterId;
      const mockJourneyNoGaps = {
        character_id: characterId,
        character_info: { id: characterId, name: 'Mock Character' },
        segments: [{ start_minute: 0, end_minute: 5, activities: ['Activity'] }],
        gaps: [], // No gaps
      };
      JourneyEngine.prototype.buildCharacterJourney.mockResolvedValue(mockJourneyNoGaps);

      await getCharacterGaps(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });
  });

  describe('getAllGaps', () => {
    it('should return a collection of all gaps from all mock characters', async () => {
      const mockJourneyChar1 = {
        character_id: 'char1', character_info: {}, segments: [],
        gaps: [{ id: 'gap1_1', start_minute: 10, end_minute: 15 }],
      };
      const mockJourneyChar2 = { // Char2 has no gaps in MOCK_DATA by default in controller
        character_id: 'char2', character_info: {}, segments: [],
        gaps: [],
      };
       const mockJourneyChar3 = {
        character_id: 'char3', character_info: {}, segments: [],
        gaps: [{ id: 'gap3_1', start_minute: 20, end_minute: 25 }],
      };

      // Mock buildCharacterJourney to return different values based on characterId
      JourneyEngine.prototype.buildCharacterJourney.mockImplementation(async (charId) => {
        if (charId === 'char1') return mockJourneyChar1;
        if (charId === 'char2') return mockJourneyChar2;
        if (charId === 'char3') return mockJourneyChar3;
        return { character_id: charId, gaps: [] };
      });

      await getAllGaps(mockReq, mockRes);

      // Called for each mock character in MOCK_CHARACTERS (char1, char2, char3)
      expect(JourneyEngine.prototype.buildCharacterJourney).toHaveBeenCalledTimes(3);
      expect(mockRes.json).toHaveBeenCalledWith([...mockJourneyChar1.gaps, ...mockJourneyChar3.gaps]);
    });

    it('should return an empty array if no characters have gaps', async () => {
      JourneyEngine.prototype.buildCharacterJourney.mockResolvedValue({
        character_id: 'anyChar', character_info: {}, segments: [], gaps: [],
      });

      await getAllGaps(mockReq, mockRes);
      expect(JourneyEngine.prototype.buildCharacterJourney).toHaveBeenCalledTimes(3); // For char1, char2, char3
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 if JourneyEngine fails for any character', async () => {
      JourneyEngine.prototype.buildCharacterJourney.mockRejectedValueOnce(new Error('Engine Failure')); // Fails for the first char

      await getAllGaps(mockReq, mockRes);

      expect(JourneyEngine.prototype.buildCharacterJourney).toHaveBeenCalledTimes(1); // Only called once before error
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to compute all gaps.' });
    });
  });

  describe('getSyncStatus', () => {
    it('should return a mock sync status object', async () => {
      await getSyncStatus(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: "foundational_sync_ok",
        pending_changes: 0,
        last_notion_sync: expect.any(String),
        last_local_db_update: expect.any(String),
        database_status: "online",
      }));
      // Check that date strings are valid ISO 8601 dates
      const response = mockRes.json.mock.calls[0][0];
      expect(new Date(response.last_notion_sync).toISOString()).toBe(response.last_notion_sync);
      expect(new Date(response.last_local_db_update).toISOString()).toBe(response.last_local_db_update);
    });

    // Since getSyncStatus currently has no external calls that can fail other than res.json itself,
    // a specific error test for its internal logic isn't strictly necessary unless it grows in complexity.
    // If it were to call another service that could fail:
    /*
    it('should return 500 if an error occurs while fetching sync status', async () => {
      // Mock some internal function call within getSyncStatus to throw an error
      // For example, if it used a service: mockOtherService.getStatus.mockRejectedValue(new Error('Status service failed'));

      // For now, we can simulate an error by making res.json throw an error, though this is a bit artificial
      const criticalError = new Error("Failed to send JSON");
      mockRes.json = jest.fn(() => { throw criticalError; });

      // We expect the global error handler in Express (if any) or Node to catch this.
      // For a unit test, we'd check if it attempts to call a generic error handler or res.status(500).
      // However, the current controller structure doesn't have a try-catch around res.json itself.
      // The provided code has a try-catch, so let's assume it's for future internal logic.
      // For now, this test demonstrates how one might approach it if there were failable internal calls.

      // To test the existing try-catch, we'd need to make something *inside* the try block fail *before* res.json.
      // Since there's nothing like that, this specific error path is hard to unit test directly for getSyncStatus.
      // We will assume the simple res.json call will not fail in a way that its own try-catch would handle.
      // The existing try-catch is more for robustness if logic is added later.

      // A more realistic test for the try-catch block:
      // Suppose getSyncStatus did something like:
      // const dbStatus = await someAsyncDbCheck(); // This could fail
      // res.json({ ... dbStatus ... });

      // For the current simple implementation, a direct error path is not very relevant.
      // The test above for successful response is sufficient.
    });
    */
  });
});
