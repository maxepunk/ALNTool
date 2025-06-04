// Constants and helpers copied for isolated testing
const VALUE_MAPPING = { 1: 100, 2: 500, 3: 1000, 4: 5000, 5: 10000 };
const TYPE_MULTIPLIERS = { Personal: 1, Business: 3, Technical: 5 };

const KEYWORDS_TECHNICAL = ["ip", "algorithm", "breakthrough", "neurobiology", "sensory triggers", "ai pattern", "neurochemical catalyst", "validation system", "protocol", "patent", "research", "data model", "encryption"];
const KEYWORDS_BUSINESS = ["deal", "corporate", "funding", "company", "market", "ledger", "investment", "ceo", "board", "acquisition", "merger", "stock", "trade secret", "client list", "supply chain"];
const KEYWORDS_PERSONAL = ["relationship", "emotion", "personal", "secret", "rumor", "affair", "family", "love", "fear", "friendship", "betrayal"];

function inferMemoryCategory(properties) {
  const textToSearch = `${properties?.name || ''} ${properties?.description || ''} ${properties?.notes || ''}`.toLowerCase();
  if (KEYWORDS_TECHNICAL.some(keyword => textToSearch.includes(keyword))) return 'Technical';
  if (KEYWORDS_BUSINESS.some(keyword => textToSearch.includes(keyword))) return 'Business';
  if (KEYWORDS_PERSONAL.some(keyword => textToSearch.includes(keyword))) return 'Personal';
  return 'Personal'; // Default
}

function inferBaseValueLevel(properties) {
  const textToSearch = `${properties?.name || ''} ${properties?.description || ''}`.toLowerCase();
  if (["core technical", "crime evidence", "blackmail", "critical vulnerability"].some(kw => textToSearch.includes(kw))) return 5;
  if (["crucial business", "deep secret", "major exploit", "strategic plan"].some(kw => textToSearch.includes(kw))) return 4;
  if (["personal revelation", "significant interaction", "contract detail"].some(kw => textToSearch.includes(kw))) return 3;
  if (["minor interaction", "rumor", "gossip", "routine report"].some(kw => textToSearch.includes(kw))) return 2;
  if (["mundane observation", "daily log", "casual note"].some(kw => textToSearch.includes(kw))) return 1;

  if (properties?.SF_RFID) {
    const match = properties.SF_RFID.match(/L(\d)/);
    if (match && match[1] && VALUE_MAPPING[parseInt(match[1])]) {
      return parseInt(match[1]);
    }
  }
  // console.warn(`Could not reliably infer base value level for element: ${properties?.name || 'Unknown'}. Defaulting to Level 3.`);
  return 3;
}

describe('MemoryEconomyPage Helper Functions', () => {
  describe('inferMemoryCategory', () => {
    it('should identify Technical category by name', () => {
      expect(inferMemoryCategory({ name: 'AI Pattern Breakthrough' })).toBe('Technical');
    });
    it('should identify Technical category by description', () => {
      expect(inferMemoryCategory({ description: 'Contains protocol details' })).toBe('Technical');
    });
    it('should identify Business category by notes', () => {
      expect(inferMemoryCategory({ notes: 'Crucial corporate deal document' })).toBe('Business');
    });
    it('should prioritize Technical over Business', () => {
      expect(inferMemoryCategory({ name: 'Algorithm Deal', description: 'A corporate merger plan' })).toBe('Technical');
    });
    it('should prioritize Business over Personal', () => {
      expect(inferMemoryCategory({ name: 'Personal Ledger', description: 'A family secret about company funding' })).toBe('Business');
    });
    it('should identify Personal category', () => {
      expect(inferMemoryCategory({ name: 'My Diary', description: 'A personal relationship story' })).toBe('Personal');
    });
    it('should default to Personal for no keywords', () => {
      expect(inferMemoryCategory({ name: 'Neutral Item', description: 'Just a thing.' })).toBe('Personal');
    });
    it('should handle empty properties', () => {
      expect(inferMemoryCategory({})).toBe('Personal');
      expect(inferMemoryCategory(null)).toBe('Personal');
      expect(inferMemoryCategory(undefined)).toBe('Personal');
    });
  });

  describe('inferBaseValueLevel', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => {}); // Suppress console.warn for defaulting
    });
    afterEach(() => {
      console.warn.mockRestore();
    });

    it('should identify Level 5 by keywords', () => {
      expect(inferBaseValueLevel({ description: 'Contains core technical schematics' })).toBe(5);
    });
    it('should identify Level 4 by keywords', () => {
      expect(inferBaseValueLevel({ name: 'Crucial Business Plan' })).toBe(4);
    });
    it('should identify Level 3 by keywords', () => {
      expect(inferBaseValueLevel({ description: 'A personal revelation of sorts' })).toBe(3);
    });
    it('should identify Level 2 by keywords', () => {
      expect(inferBaseValueLevel({ name: 'Office Gossip Log' })).toBe(2);
    });
    it('should identify Level 1 by keywords', () => {
      expect(inferBaseValueLevel({ description: 'A mundane observation about the weather' })).toBe(1);
    });
    it('should parse level from SF_RFID if no keywords match', () => {
      expect(inferBaseValueLevel({ name: 'Generic Item', SF_RFID: 'MEM-L4-XYZ' })).toBe(4);
    });
    it('should default to Level 3 if SF_RFID level is invalid', () => {
      expect(inferBaseValueLevel({ name: 'Generic Item', SF_RFID: 'MEM-L7-XYZ' })).toBe(3);
    });
    it('should default to Level 3 if no keywords or valid SF_RFID', () => {
      expect(inferBaseValueLevel({ name: 'Vague description' })).toBe(3);
    });
     it('should prioritize keywords over SF_RFID', () => {
      expect(inferBaseValueLevel({ description: 'A mundane observation', SF_RFID: 'MEM-L5-ABC' })).toBe(1);
    });
    it('should handle empty properties, defaulting to 3', () => {
      expect(inferBaseValueLevel({})).toBe(3);
    });
  });
});

// Mock data for processedMemoryTokens and filteredAndSortedTokens tests
const mockProcessedTokens = [
  { id: 't1', name: 'Token 1', inferredCategory: 'Technical', baseValueLevel: 5, memorySets: ['Set A', 'Set B'], finalValue: 25000, baseValueAmount: 5000, typeMultiplierValue: 5 },
  { id: 't2', name: 'Token 2', inferredCategory: 'Business', baseValueLevel: 3, memorySets: ['Set A'], finalValue: 3000, baseValueAmount: 1000, typeMultiplierValue: 3 },
  { id: 't3', name: 'Token 3', inferredCategory: 'Personal', baseValueLevel: 1, memorySets: ['Set B'], finalValue: 100, baseValueAmount: 100, typeMultiplierValue: 1 },
  { id: 't4', name: 'Token 4', inferredCategory: 'Technical', baseValueLevel: 3, memorySets: [], finalValue: 5000, baseValueAmount: 1000, typeMultiplierValue: 5 },
];

describe('MemoryEconomyPage Data Processing', () => {
  // Test for the mapping logic similar to what's in processedMemoryTokens
  // This is a simplified version, actual hook uses elements from useQuery
  const calculateTokenData = (elementProperties) => {
    const inferredCategory = inferMemoryCategory(elementProperties);
    const baseValueLevel = inferBaseValueLevel(elementProperties);
    const baseValueAmount = VALUE_MAPPING[baseValueLevel] || 0;
    const typeMultiplierValue = TYPE_MULTIPLIERS[inferredCategory] || 1;
    return {
      inferredCategory,
      baseValueLevel,
      baseValueAmount,
      typeMultiplierValue,
      finalValue: baseValueAmount * typeMultiplierValue,
    };
  };

  it('should correctly calculate final value for a Technical Level 5 token', () => {
    const props = { name: 'Core IP', description: 'core technical breakthrough' };
    const result = calculateTokenData(props);
    expect(result.inferredCategory).toBe('Technical');
    expect(result.baseValueLevel).toBe(5);
    expect(result.baseValueAmount).toBe(10000);
    expect(result.typeMultiplierValue).toBe(5);
    expect(result.finalValue).toBe(50000);
  });

  it('should correctly calculate final value for a Business Level 3 token', () => {
    const props = { name: 'Merger Details', description: 'significant interaction about a corporate merger' };
    const result = calculateTokenData(props);
    expect(result.inferredCategory).toBe('Business');
    expect(result.baseValueLevel).toBe(3); // "significant interaction" or default if no other kw
    expect(result.baseValueAmount).toBe(1000);
    expect(result.typeMultiplierValue).toBe(3);
    expect(result.finalValue).toBe(3000);
  });

  it('should correctly calculate final value for a Personal Level 1 token', () => {
    const props = { name: 'Daily Log', description: 'a mundane observation' };
    const result = calculateTokenData(props);
    expect(result.inferredCategory).toBe('Personal');
    expect(result.baseValueLevel).toBe(1);
    expect(result.baseValueAmount).toBe(100);
    expect(result.typeMultiplierValue).toBe(1);
    expect(result.finalValue).toBe(100);
  });

  // Tests for filtering logic (simulating filteredAndSortedTokens)
  describe('Memory Set Filtering Logic', () => {
    it('should return all tokens when filter is "All"', () => {
      const filtered = mockProcessedTokens.filter(token => true); // Simulate no filter
      expect(filtered.length).toBe(4);
    });

    it('should filter tokens by "Set A"', () => {
      const selectedMemorySetFilter = 'Set A';
      const filtered = mockProcessedTokens.filter(token =>
        token.memorySets && token.memorySets.includes(selectedMemorySetFilter)
      );
      expect(filtered.length).toBe(2);
      expect(filtered.every(token => token.memorySets.includes('Set A'))).toBe(true);
    });

    it('should filter tokens by "Set B"', () => {
      const selectedMemorySetFilter = 'Set B';
      const filtered = mockProcessedTokens.filter(token =>
        token.memorySets && token.memorySets.includes(selectedMemorySetFilter)
      );
      expect(filtered.length).toBe(2);
      expect(filtered.every(token => token.memorySets.includes('Set B'))).toBe(true);
    });

    it('should return empty if no token matches the set', () => {
      const selectedMemorySetFilter = 'Set C';
      const filtered = mockProcessedTokens.filter(token =>
        token.memorySets && token.memorySets.includes(selectedMemorySetFilter)
      );
      expect(filtered.length).toBe(0);
    });
  });
});
