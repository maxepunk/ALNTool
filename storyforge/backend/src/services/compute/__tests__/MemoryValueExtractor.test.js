const MemoryValueExtractor = require('../MemoryValueExtractor');
const { getDB, initializeDatabase, closeDB } = require('../../../db/database');

describe('MemoryValueExtractor', () => {
    let extractor;
    let db;

    beforeAll(() => {
        initializeDatabase(':memory:');
        db = getDB();
        extractor = new MemoryValueExtractor(db);
    });

    afterAll(() => {
        closeDB();
    });

    describe('SF_ field extraction', () => {
        test('extractRFIDTag', () => {
            expect(extractor.extractRFIDTag('SF_RFID: ABC123 - some description')).toBe('ABC123');
            expect(extractor.extractRFIDTag('sf_rfid: xyz789')).toBe('xyz789');
            expect(extractor.extractRFIDTag('No RFID here')).toBeNull();
            expect(extractor.extractRFIDTag('')).toBeNull();
        });

        test('extractValueRating', () => {
            expect(extractor.extractValueRating('SF_ValueRating: 3')).toBe(3);
            expect(extractor.extractValueRating('sf_valuerating: 5')).toBe(5);
            expect(extractor.extractValueRating('SF_ValueRating: 0')).toBe(0); // Invalid
            expect(extractor.extractValueRating('SF_ValueRating: 6')).toBe(0); // Invalid
            expect(extractor.extractValueRating('No rating here')).toBe(0);
        });

        test('extractMemoryType', () => {
            expect(extractor.extractMemoryType('SF_MemoryType: Personal')).toBe('Personal');
            expect(extractor.extractMemoryType('sf_memorytype: Business')).toBe('Business');
            expect(extractor.extractMemoryType('SF_MemoryType: Technical')).toBe('Technical');
            expect(extractor.extractMemoryType('SF_MemoryType: Invalid')).toBeNull();
            expect(extractor.extractMemoryType('No type here')).toBeNull();
        });

        test('extractMemoryGroup', () => {
            expect(extractor.extractMemoryGroup('SF_Group: Ephemeral Echo (10x)'))
                .toEqual({ group: 'Ephemeral Echo', multiplier: 10.0 });
            expect(extractor.extractMemoryGroup('sf_group: Test Group (2.5x)'))
                .toEqual({ group: 'Test Group', multiplier: 2.5 });
            expect(extractor.extractMemoryGroup('No group here'))
                .toEqual({ group: null, multiplier: 1.0 });
        });
    });

    describe('value calculations', () => {
        test('getBaseValue', () => {
            expect(extractor.getBaseValue(1)).toBe(100);
            expect(extractor.getBaseValue(2)).toBe(500);
            expect(extractor.getBaseValue(3)).toBe(1000);
            expect(extractor.getBaseValue(4)).toBe(5000);
            expect(extractor.getBaseValue(5)).toBe(10000);
            expect(extractor.getBaseValue(0)).toBe(0);
            expect(extractor.getBaseValue(6)).toBe(0);
        });

        test('getTypeMultiplier', () => {
            expect(extractor.getTypeMultiplier('Personal')).toBe(2.0);
            expect(extractor.getTypeMultiplier('Business')).toBe(5.0);
            expect(extractor.getTypeMultiplier('Technical')).toBe(10.0);
            expect(extractor.getTypeMultiplier('Invalid')).toBe(1.0);
            expect(extractor.getTypeMultiplier(null)).toBe(1.0);
        });

        test('calculateIndividualTokenValue', () => {
            // Base cases
            expect(extractor.calculateIndividualTokenValue(3, 'Personal')).toBe(2000); // $1000 * 2
            expect(extractor.calculateIndividualTokenValue(2, 'Business')).toBe(2500); // $500 * 5
            expect(extractor.calculateIndividualTokenValue(1, 'Technical')).toBe(1000); // $100 * 10
            
            // Group multiplier should NOT be applied (that's for completion bonuses)
            expect(extractor.calculateIndividualTokenValue(2, 'Personal', 10)).toBe(1000); // $500 * 2, ignore 10x
            
            // Edge cases
            expect(extractor.calculateIndividualTokenValue(0, 'Personal')).toBe(0);
            expect(extractor.calculateIndividualTokenValue(3, null)).toBe(1000); // $1000 * 1
        });
    });

    describe('comprehensive extraction', () => {
        test('extractMemoryData - complete token', () => {
            const description = `A memory token containing critical information.
                SF_RFID: MEM001
                SF_ValueRating: 4
                SF_MemoryType: Technical
                SF_Group: Ephemeral Echo (10x)
                Additional description here.`;

            const result = extractor.extractMemoryData(description);

            expect(result).toEqual({
                rfidTag: 'MEM001',
                valueRating: 4,
                memoryType: 'Technical',
                memoryGroup: 'Ephemeral Echo',
                groupMultiplier: 10.0,
                calculatedValue: 50000 // $5000 * 10 (Technical)
            });
        });

        test('extractMemoryData - partial token', () => {
            const description = `SF_RFID: ABC123
                SF_ValueRating: 2
                Some other content.`;

            const result = extractor.extractMemoryData(description);

            expect(result).toEqual({
                rfidTag: 'ABC123',
                valueRating: 2,
                memoryType: null,
                memoryGroup: null,
                groupMultiplier: 1.0,
                calculatedValue: 500 // $500 * 1 (no type)
            });
        });

        test('extractMemoryData - no memory data', () => {
            const description = 'Just a regular element with no memory fields.';

            const result = extractor.extractMemoryData(description);

            expect(result).toEqual({
                rfidTag: null,
                valueRating: 0,
                memoryType: null,
                memoryGroup: null,
                groupMultiplier: 1.0,
                calculatedValue: 0
            });
        });

        test('extractMemoryData - empty/null input', () => {
            expect(extractor.extractMemoryData('')).toEqual({
                rfidTag: null,
                valueRating: 0,
                memoryType: null,
                memoryGroup: null,
                groupMultiplier: 1.0,
                calculatedValue: 0
            });

            expect(extractor.extractMemoryData(null)).toEqual({
                rfidTag: null,
                valueRating: 0,
                memoryType: null,
                memoryGroup: null,
                groupMultiplier: 1.0,
                calculatedValue: 0
            });
        });
    });

    describe('database integration', () => {
        beforeEach(() => {
            // Create test elements table
            db.exec(`
                CREATE TABLE IF NOT EXISTS elements (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    description TEXT,
                    rfid_tag TEXT,
                    value_rating INTEGER DEFAULT 0,
                    memory_type TEXT,
                    memory_group TEXT,
                    group_multiplier REAL DEFAULT 1.0,
                    calculated_memory_value INTEGER DEFAULT 0
                )
            `);

            // Insert test data
            db.prepare(`INSERT INTO elements (id, name, description) VALUES (?, ?, ?)`).run(
                'test1',
                'Test Memory Token',
                'SF_RFID: MEM001\nSF_ValueRating: 3\nSF_MemoryType: Business\nSF_Group: Ephemeral Echo (5x)'
            );

            db.prepare(`INSERT INTO elements (id, name, description) VALUES (?, ?, ?)`).run(
                'test2',
                'Regular Element',
                'Just a regular element with no memory data.'
            );
        });

        afterEach(() => {
            db.exec('DROP TABLE IF EXISTS elements');
        });

        test('extractAllMemoryValues updates database correctly', async () => {
            const updatedCount = await extractor.extractAllMemoryValues();

            expect(updatedCount).toBe(1); // Only memory token should be updated

            const memoryToken = db.prepare('SELECT * FROM elements WHERE id = ?').get('test1');
            expect(memoryToken.rfid_tag).toBe('MEM001');
            expect(memoryToken.value_rating).toBe(3);
            expect(memoryToken.memory_type).toBe('Business');
            expect(memoryToken.memory_group).toBe('Ephemeral Echo');
            expect(memoryToken.group_multiplier).toBe(5.0);
            expect(memoryToken.calculated_memory_value).toBe(5000); // $1000 * 5 (Business)

            const regularElement = db.prepare('SELECT * FROM elements WHERE id = ?').get('test2');
            expect(regularElement.rfid_tag).toBeNull();
            expect(regularElement.value_rating).toBe(0);
            expect(regularElement.calculated_memory_value).toBe(0);
        });
    });
});