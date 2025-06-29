export const MOCK_SIMPLE_GRAPH_DATA_FOR_PARENT_ASSIGNMENT = {
  center: { id: 'puzz-parent', name: 'Parent Puzzle', type: 'Puzzle', /* other props */ },
  nodes: [
    { id: 'puzz-parent', name: 'Parent Puzzle', type: 'Puzzle', /* other props */ },
    { id: 'elem-child-1', name: 'Child Element 1 (Reward)', type: 'Element', /* other props */ },
    { id: 'elem-child-2', name: 'Child Element 2 (Required)', type: 'Element', /* other props */ },
    { id: 'elem-grandchild-1', name: 'Grandchild Element 1 (Contents)', type: 'Element', /* other props */ },
    { id: 'char-unrelated', name: 'Unrelated Character', type: 'Character', /* other props */ },
    { id: 'elem-sibling', name: 'Sibling Element to Parent', type: 'Element', /* other props */ },
  ],
  edges: [
    // Puzzle -> Element (Rewards => parentId: puzz-parent for elem-child-1)
    { source: 'puzz-parent', target: 'elem-child-1', label: 'Rewards Element', data: { shortLabel: 'Rewards' } },
    // Puzzle -> Element (Requires => parentId: puzz-parent for elem-child-2)
    { source: 'puzz-parent', target: 'elem-child-2', label: 'Requires Element', data: { shortLabel: 'Requires' } },
    // Element -> Element (Contains => parentId: elem-child-1 for elem-grandchild-1)
    { source: 'elem-child-1', target: 'elem-grandchild-1', label: 'Contains Element', data: { shortLabel: 'Contains' } },
    // Puzzle -> Character (Associated => NO parentId assignment)
    { source: 'puzz-parent', target: 'char-unrelated', label: 'Associated With', data: { shortLabel: 'Associated' } },
    // Sibling -> Puzzle (No parent relation defined here for default Dagre parent assignment)
    { source: 'elem-sibling', target: 'puzz-parent', label: 'Linked To', data: { shortLabel: 'Linked To' } },
  ],
};

export const MOCK_GRAPH_DATA_NO_PARENT_ASSIGNMENT = {
    center: { id: 'char-center', name: 'Central Character', type: 'Character', /* other props */ },
    nodes: [
        { id: 'char-center', name: 'Central Character', type: 'Character', /* other props */ },
        { id: 'elem-other', name: 'Other Element', type: 'Element', /* other props */ },
    ],
    edges: [
        // Character -> Element (Owns => NO parentId assignment for default Dagre)
        { source: 'char-center', target: 'elem-other', label: 'Owns', data: { shortLabel: 'Owns' } },
    ],
};

// Mock data for testing filtering, SPOC etc. (can be expanded)
export const MOCK_COMPLEX_GRAPH_DATA = {
    center: { id: 'char-main', name: 'Main Character', type: 'Character' },
    nodes: [
        { id: 'char-main', name: 'Main Character', type: 'Character' }, // Center
        { id: 'puzzle-hub', name: 'Key Puzzle Hub', type: 'Puzzle' },
        { id: 'elem-needed', name: 'Needed Element', type: 'Element' },
        { id: 'elem-reward', name: 'Reward Element', type: 'Element' },
        { id: 'event-linked', name: 'Linked Event', type: 'Timeline' },
        { id: 'char-secondary', name: 'Secondary Character', type: 'Character' },
        { id: 'elem-far', name: 'Far Element', type: 'Element' }, // Connected to char-secondary
    ],
    edges: [
        { source: 'char-main', target: 'puzzle-hub', label: 'Owns Puzzle', data: { shortLabel: 'Owns' } }, 
        { source: 'puzzle-hub', target: 'elem-needed', label: 'Requires', data: { shortLabel: 'Requires' } },         // Strong, for grouping
        { source: 'puzzle-hub', target: 'elem-reward', label: 'Rewards', data: { shortLabel: 'Rewards' } },           // Strong, for grouping
        { source: 'char-main', target: 'event-linked', label: 'Participates In', data: { shortLabel: 'Participates' } },
        { source: 'event-linked', target: 'char-secondary', label: 'Involves', data: { shortLabel: 'Involves' } },
        { source: 'char-main', target: 'elem-needed', label: 'Associated With (Weak)', data: { shortLabel: 'Associated' } }, // Weaker direct link, potentially pruned by SPOC if puzzle-hub is intermediary
        { source: 'char-secondary', target: 'elem-far', label: 'Carries', data: { shortLabel: 'Owns' } },
    ],
};

export const DETAILED_MOCK_CHARACTER_GRAPH_DATA = {
  center: {
    id: 'char-alex-reeves',
    name: 'Alex Reeves',
    type: 'Character',
    fullDescription: 'Alex Reeves is a talented software engineer caught in a web of corporate intrigue and a murder mystery. Known for a sharp mind and resourcefulness.',
    descriptionSnippet: 'Alex Reeves is a talented software engineer...',
    tier: 'Core',
    role: 'Player',
    primaryActionSnippet: 'Investigate Marcus Blackwood\'s death...'
  },
  nodes: [
    {
      id: 'char-alex-reeves',
      name: 'Alex Reeves',
      type: 'Character',
      fullDescription: 'Alex Reeves is a talented software engineer caught in a web of corporate intrigue and a murder mystery. Known for a sharp mind and resourcefulness.',
      descriptionSnippet: 'Alex Reeves is a talented software engineer...',
      tier: 'Core',
      role: 'Player',
      primaryActionSnippet: 'Investigate Marcus Blackwood\'s death...'
    },
    {
      id: 'elem-backpack',
      name: 'Alex\'s Backpack',
      type: 'Element',
      fullDescription: 'A worn leather backpack belonging to Alex Reeves. Contains several important items.',
      descriptionSnippet: 'A worn leather backpack belonging to Alex Reeves...',
      basicType: 'Container',
      status: 'Ready for Playtest',
      flowSummary: 'Owner: Alex Reeves. Required for 0 puzzles. Rewarded by 0 puzzles.',
      ownerName: 'Alex Reeves',
      ownerId: 'char-alex-reeves'
    },
    {
      id: 'elem-laptop',
      name: 'Alex\'s Laptop',
      type: 'Element',
      fullDescription: 'A high-end laptop, password protected. Contains encrypted files.',
      descriptionSnippet: 'A high-end laptop, password protected...',
      basicType: 'Digital File', // Or Prop if physical laptop is key
      status: 'In development',
      flowSummary: 'Owner: Alex Reeves. Required for 1 puzzles. Rewarded by 0 puzzles.',
      ownerName: 'Alex Reeves',
      ownerId: 'char-alex-reeves'
    },
    {
      id: 'puzzle-laptop-access',
      name: 'Access Alex\'s Laptop',
      type: 'Puzzle',
      fullDescription: 'Gain access to Alex\'s encrypted laptop to find crucial evidence.',
      descriptionSnippet: 'Gain access to Alex\'s encrypted laptop...',
      timing: 'Act 1',
      statusSummary: 'Requires 1 elements; Rewards 1 elements.',
      storyRevealSnippet: 'Reveals encrypted email correspondence...',
      ownerName: 'Alex Reeves', // Puzzle is associated with Alex
      ownerId: 'char-alex-reeves'
    },
    {
      id: 'event-interrogation',
      name: 'Alex Interrogation',
      type: 'Timeline',
      fullDescription: 'Alex Reeves is interrogated by The Detective about the events of the party and Marcus Blackwood\'s death.',
      descriptionSnippet: 'Alex Reeves is interrogated by The Detective...',
      dateString: '2025-05-13T10:00:00Z',
      participantSummary: 'Involves: 2 Characters, 1 Elements.',
      notesSnippet: 'Key turning point for Alex\'s involvement...'
    }
  ],
  edges: [
    {
      source: 'char-alex-reeves',
      target: 'elem-backpack',
      label: 'Owns', 
      data: {
        sourceNodeName: 'Alex Reeves',
        sourceNodeType: 'Character',
        targetNodeName: 'Alex\'s Backpack',
        targetNodeType: 'Element',
        contextualLabel: 'Character \'Alex Reeves\' owns Element \'Alex\'s Backpack\'',
        shortLabel: 'Owns'
      }
    },
    {
      source: 'elem-backpack', // Backpack (container)
      target: 'elem-laptop',   // Laptop (contents) - assuming laptop is IN backpack for this example
      label: 'Contains',
      data: {
        sourceNodeName: 'Alex\'s Backpack',
        sourceNodeType: 'Element',
        targetNodeName: 'Alex\'s Laptop',
        targetNodeType: 'Element',
        contextualLabel: 'Element \'Alex\'s Backpack\' contains Element \'Alex\'s Laptop\'',
        shortLabel: 'Contains' // This shortLabel is used for parentId assignment
      }
    },
    {
      source: 'char-alex-reeves',
      target: 'puzzle-laptop-access',
      label: 'Associated Puzzle',
      data: {
        sourceNodeName: 'Alex Reeves',
        sourceNodeType: 'Character',
        targetNodeName: 'Access Alex\'s Laptop',
        targetNodeType: 'Puzzle',
        contextualLabel: 'Character \'Alex Reeves\' is associated with Puzzle \'Access Alex\'s Laptop\'',
        shortLabel: 'Owns' // Or 'Associated Puzzle', depends on grouping desired
      }
    },
    {
      source: 'elem-laptop', // Element (laptop)
      target: 'puzzle-laptop-access', // Puzzle (access laptop)
      label: 'Required For',
      data: {
        sourceNodeName: 'Alex\'s Laptop',
        sourceNodeType: 'Element',
        targetNodeName: 'Access Alex\'s Laptop',
        targetNodeType: 'Puzzle',
        contextualLabel: 'Element \'Alex\'s Laptop\' is required for Puzzle \'Access Alex\'s Laptop\'',
        shortLabel: 'Requires' // This shortLabel is used for parentId assignment
      }
    },
    {
      source: 'char-alex-reeves',
      target: 'event-interrogation',
      label: 'Participates In',
      data: {
        sourceNodeName: 'Alex Reeves',
        sourceNodeType: 'Character',
        targetNodeName: 'Alex Interrogation',
        targetNodeType: 'Timeline',
        contextualLabel: 'Character \'Alex Reeves\' participates in Event \'Alex Interrogation\'',
        shortLabel: 'Participates'
      }
    }
  ]
};

export const DETAILED_MOCK_ELEMENT_GRAPH_DATA = {
  center: {
    id: 'elem-secure-briefcase',
    name: 'Secure Briefcase',
    type: 'Element',
    fullDescription: 'A locked, heavy-duty briefcase. Seems to require a specific key or combination.',
    descriptionSnippet: 'A locked, heavy-duty briefcase...',
    basicType: 'Container',
    status: 'Ready for Playtest',
    flowSummary: 'Owner: Victoria Kingsley. Required for 0 puzzles. Rewarded by Puzzle \'Open Briefcase\'. Contains 1 element.',
    ownerName: 'Victoria Kingsley',
    ownerId: 'char-victoria-kingsley'
  },
  nodes: [
    {
      id: 'elem-secure-briefcase',
      name: 'Secure Briefcase',
      type: 'Element',
      fullDescription: 'A locked, heavy-duty briefcase. Seems to require a specific key or combination.',
      descriptionSnippet: 'A locked, heavy-duty briefcase...',
      basicType: 'Container',
      status: 'Ready for Playtest',
      flowSummary: 'Owner: Victoria Kingsley. Required for 0 puzzles. Rewarded by Puzzle \'Open Briefcase\'. Contains 1 element.',
      ownerName: 'Victoria Kingsley',
      ownerId: 'char-victoria-kingsley'
    },
    {
      id: 'char-victoria-kingsley',
      name: 'Victoria Kingsley',
      type: 'Character',
      fullDescription: 'The ambitious COO of the company, known for her ruthless efficiency.',
      descriptionSnippet: 'The ambitious COO of the company...',
      tier: 'Core',
      role: 'NPC',
      primaryActionSnippet: 'Secure the company\'s future, no matter the cost...'
    },
    {
      id: 'elem-research-notes',
      name: 'Incriminating Research Notes',
      type: 'Element',
      fullDescription: 'Notes detailing illegal research, found inside the Secure Briefcase.',
      descriptionSnippet: 'Notes detailing illegal research...',
      basicType: 'Document',
      status: 'Done',
      flowSummary: 'Owner: (Contained). Required for Puzzle \'Decrypt Notes\'. Rewarded by 0 puzzles.',
    },
    {
      id: 'puzzle-open-briefcase',
      name: 'Open The Briefcase',
      type: 'Puzzle',
      fullDescription: 'Find a way to open the Secure Briefcase.',
      descriptionSnippet: 'Find a way to open the Secure Briefcase...',
      timing: 'Act 1',
      statusSummary: 'Requires 1 elements (e.g., a key); Rewards 1 elements (Secure Briefcase itself, now open). Actually rewards the research notes implicitly.',
      storyRevealSnippet: 'Reveals the contents of the briefcase...',
      ownerName: null, // Or associated with a general game state
      ownerId: null
    },
    {
      id: 'event-briefcase-discovery',
      name: 'Briefcase Discovery',
      type: 'Timeline',
      fullDescription: 'The Secure Briefcase is discovered by players.',
      descriptionSnippet: 'The Secure Briefcase is discovered...',
      dateString: '2025-05-13T09:30:00Z',
      participantSummary: 'Involves: Player Characters, 1 Elements.',
      notesSnippet: 'Triggers the start of a major clue trail...'
    }
  ],
  edges: [
    {
      source: 'char-victoria-kingsley',
      target: 'elem-secure-briefcase',
      label: 'Owns',
      data: {
        sourceNodeName: 'Victoria Kingsley',
        sourceNodeType: 'Character',
        targetNodeName: 'Secure Briefcase',
        targetNodeType: 'Element',
        contextualLabel: 'Character \'Victoria Kingsley\' owns Element \'Secure Briefcase\'',
        shortLabel: 'Owns'
      }
    },
    {
      source: 'elem-secure-briefcase',
      target: 'elem-research-notes',
      label: 'Contains',
      data: {
        sourceNodeName: 'Secure Briefcase',
        sourceNodeType: 'Element',
        targetNodeName: 'Incriminating Research Notes',
        targetNodeType: 'Element',
        contextualLabel: 'Element \'Secure Briefcase\' contains Element \'Incriminating Research Notes\'',
        shortLabel: 'Contains'
      }
    },
    {
      source: 'puzzle-open-briefcase',
      target: 'elem-secure-briefcase',
      label: 'Unlocks', // Or "Rewards Access To"
      data: {
        sourceNodeName: 'Open The Briefcase',
        sourceNodeType: 'Puzzle',
        targetNodeName: 'Secure Briefcase',
        targetNodeType: 'Element',
        contextualLabel: 'Puzzle \'Open The Briefcase\' unlocks Element \'Secure Briefcase\'',
        shortLabel: 'Rewards' // For grouping, as it provides the reward (notes implicitly)
      }
    },
    {
      source: 'elem-secure-briefcase',
      target: 'event-briefcase-discovery',
      label: 'Is Key Item In',
      data: {
        sourceNodeName: 'Secure Briefcase',
        sourceNodeType: 'Element',
        targetNodeName: 'Briefcase Discovery',
        targetNodeType: 'Timeline',
        contextualLabel: 'Element \'Secure Briefcase\' is key item in Event \'Briefcase Discovery\'',
        shortLabel: 'Features In'
      }
    }
  ]
};

export const DETAILED_MOCK_PUZZLE_GRAPH_DATA = {
  center: {
    id: 'puzzle-data-heist',
    name: 'The Data Heist',
    type: 'Puzzle',
    fullDescription: 'A multi-stage puzzle requiring players to infiltrate a server and extract data.',
    descriptionSnippet: 'A multi-stage puzzle involving server infiltration...',
    timing: 'Act 2',
    statusSummary: 'Requires 2 elements; Rewards 1 element. Has 1 sub-puzzle.',
    storyRevealSnippet: 'Reveals critical information about the memory drug experiments.',
    ownerName: null, // General game puzzle
    ownerId: null
  },
  nodes: [
    {
      id: 'puzzle-data-heist',
      name: 'The Data Heist',
      type: 'Puzzle',
      fullDescription: 'A multi-stage puzzle requiring players to infiltrate a server and extract data.',
      descriptionSnippet: 'A multi-stage puzzle involving server infiltration...',
      timing: 'Act 2',
      statusSummary: 'Requires 2 elements; Rewards 1 element. Has 1 sub-puzzle.',
      storyRevealSnippet: 'Reveals critical information about the memory drug experiments.',
      ownerName: null,
      ownerId: null
    },
    {
      id: 'elem-access-card',
      name: 'Level 3 Access Card',
      type: 'Element',
      fullDescription: 'A stolen access card granting entry to restricted server rooms.',
      descriptionSnippet: 'A stolen access card...',
      basicType: 'Prop',
      status: 'Done',
      flowSummary: 'Owner: (Found). Required for 1 puzzle. Rewarded by 0 puzzles.'
    },
    {
      id: 'elem-decryption-key',
      name: 'USB Decryption Key',
      type: 'Element',
      fullDescription: 'A USB stick containing software to decrypt the stolen data.',
      descriptionSnippet: 'A USB stick with decryption software...',
      basicType: 'Digital File',
      status: 'Ready for Playtest',
      flowSummary: 'Owner: (Assembled). Required for 1 puzzle. Rewarded by 0 puzzles.'
    },
    {
      id: 'elem-extracted-data',
      name: 'Extracted Research Data',
      type: 'Element',
      fullDescription: 'The successfully extracted and decrypted research data.',
      descriptionSnippet: 'Successfully extracted research data...',
      basicType: 'Digital File',
      status: 'Placeholder',
      flowSummary: 'Owner: (Players). Required for 0 puzzles. Rewarded by 1 puzzle.'
    },
    {
      id: 'puzzle-bypass-security',
      name: 'Bypass Server Security',
      type: 'Puzzle',
      fullDescription: 'A sub-puzzle to disable physical and digital security measures.',
      descriptionSnippet: 'Disable physical and digital security...',
      timing: 'Act 2',
      statusSummary: 'Requires 1 elements; Rewards 0 elements (enables next step).',
      storyRevealSnippet: 'Allows access to server room...',
      ownerName: null,
      ownerId: null
    },
    {
      id: 'char-tech-expert',
      name: 'Jaime \'Glitch\' Robertson',
      type: 'Character',
      fullDescription: 'A tech-savvy NPC who can assist with the data heist.',
      descriptionSnippet: 'A tech-savvy NPC...',
      tier: 'Secondary',
      role: 'NPC',
      primaryActionSnippet: 'Help players navigate complex tech challenges...'
    }
  ],
  edges: [
    {
      source: 'elem-access-card',
      target: 'puzzle-data-heist',
      label: 'Required For',
      data: {
        sourceNodeName: 'Level 3 Access Card',
        sourceNodeType: 'Element',
        targetNodeName: 'The Data Heist',
        targetNodeType: 'Puzzle',
        contextualLabel: 'Element \'Level 3 Access Card\' is required for Puzzle \'The Data Heist\'',
        shortLabel: 'Requires'
      }
    },
    {
      source: 'elem-decryption-key',
      target: 'puzzle-data-heist',
      label: 'Required For',
      data: {
        sourceNodeName: 'USB Decryption Key',
        sourceNodeType: 'Element',
        targetNodeName: 'The Data Heist',
        targetNodeType: 'Puzzle',
        contextualLabel: 'Element \'USB Decryption Key\' is required for Puzzle \'The Data Heist\'',
        shortLabel: 'Requires'
      }
    },
    {
      source: 'puzzle-data-heist',
      target: 'elem-extracted-data',
      label: 'Rewards',
      data: {
        sourceNodeName: 'The Data Heist',
        sourceNodeType: 'Puzzle',
        targetNodeName: 'Extracted Research Data',
        targetNodeType: 'Element',
        contextualLabel: 'Puzzle \'The Data Heist\' rewards Element \'Extracted Research Data\'',
        shortLabel: 'Rewards'
      }
    },
    {
      source: 'puzzle-data-heist',
      target: 'puzzle-bypass-security',
      label: 'Has Sub-Puzzle',
      data: {
        sourceNodeName: 'The Data Heist',
        sourceNodeType: 'Puzzle',
        targetNodeName: 'Bypass Server Security',
        targetNodeType: 'Puzzle',
        contextualLabel: 'Puzzle \'The Data Heist\' has Sub-Puzzle \'Bypass Server Security\'',
        shortLabel: 'Has Sub-Puzzle' // For grouping if parent is puzzle and child is puzzle with this relation
      }
    },
    {
      source: 'puzzle-bypass-security',
      target: 'elem-access-card', // Could also be a different element needed for this sub-puzzle
      label: 'Requires for Sub-Puzzle',
      data: {
        sourceNodeName: 'Bypass Server Security',
        sourceNodeType: 'Puzzle',
        targetNodeName: 'Level 3 Access Card',
        targetNodeType: 'Element',
        contextualLabel: 'Sub-Puzzle \'Bypass Server Security\' requires Element \'Level 3 Access Card\'',
        shortLabel: 'Requires'
      }
    },
    {
      source: 'char-tech-expert',
      target: 'puzzle-data-heist',
      label: 'Assists With',
      data: {
        sourceNodeName: 'Jaime \'Glitch\' Robertson',
        sourceNodeType: 'Character',
        targetNodeName: 'The Data Heist',
        targetNodeType: 'Puzzle',
        contextualLabel: 'Character \'Jaime \'Glitch\' Robertson\' assists with Puzzle \'The Data Heist\'',
        shortLabel: 'Associated'
      }
    }
  ]
};

export const DETAILED_MOCK_TIMELINE_GRAPH_DATA = {
  center: {
    id: 'event-ceo-speech',
    name: 'CEO Marcus Blackwood\'s Final Speech',
    type: 'Timeline',
    fullDescription: 'The last public appearance of CEO Marcus Blackwood before his death, where he made a cryptic announcement.',
    descriptionSnippet: 'The last public appearance of CEO Marcus Blackwood...',
    dateString: '2025-05-12T20:00:00Z',
    participantSummary: 'Involves: 3 Characters, 2 Elements.',
    notesSnippet: 'Key event setting the stage for the entire mystery.'
  },
  nodes: [
    {
      id: 'event-ceo-speech',
      name: 'CEO Marcus Blackwood\'s Final Speech',
      type: 'Timeline',
      fullDescription: 'The last public appearance of CEO Marcus Blackwood before his death, where he made a cryptic announcement.',
      descriptionSnippet: 'The last public appearance of CEO Marcus Blackwood...',
      dateString: '2025-05-12T20:00:00Z',
      participantSummary: 'Involves: 3 Characters, 2 Elements.',
      notesSnippet: 'Key event setting the stage for the entire mystery.'
    },
    {
      id: 'char-marcus-blackwood',
      name: 'Marcus Blackwood (Deceased)',
      type: 'Character',
      fullDescription: 'The CEO whose death is the central mystery.',
      descriptionSnippet: 'The CEO whose death is central...',
      tier: 'Core',
      role: 'NPC',
      primaryActionSnippet: 'Uncover the truth about his company\'s experiments (posthumously).'
    },
    {
      id: 'char-alex-reeves',
      name: 'Alex Reeves',
      type: 'Character',
      fullDescription: 'Alex Reeves was present at the speech.',
      descriptionSnippet: 'Alex Reeves was present...',
      tier: 'Core',
      role: 'Player',
      primaryActionSnippet: 'Investigate Marcus Blackwood\'s death...'
    },
    {
      id: 'char-victoria-kingsley',
      name: 'Victoria Kingsley',
      type: 'Character',
      fullDescription: 'Victoria Kingsley, COO, was also present and visibly agitated.',
      descriptionSnippet: 'Victoria Kingsley was present and agitated...',
      tier: 'Core',
      role: 'NPC',
      primaryActionSnippet: 'Secure the company\'s future...'
    },
    {
      id: 'elem-speech-transcript',
      name: 'Speech Transcript (Digital)',
      type: 'Element',
      fullDescription: 'A digital recording and transcript of Marcus Blackwood\'s speech.',
      descriptionSnippet: 'Digital recording and transcript...',
      basicType: 'Digital File',
      status: 'Done',
      flowSummary: 'Associated with Event: CEO Speech.'
    },
    {
      id: 'elem-strange-artifact',
      name: 'Strange Artifact (Seen at Speech)',
      type: 'Element',
      fullDescription: 'An unusual device Marcus Blackwood was holding during the speech.',
      descriptionSnippet: 'Unusual device seen with Marcus...',
      basicType: 'Prop',
      status: 'Idea/Placeholder',
      flowSummary: 'Associated with Event: CEO Speech.'
    }
  ],
  edges: [
    {
      source: 'event-ceo-speech',
      target: 'char-marcus-blackwood',
      label: 'Features',
      data: {
        sourceNodeName: 'CEO Marcus Blackwood\'s Final Speech',
        sourceNodeType: 'Timeline',
        targetNodeName: 'Marcus Blackwood (Deceased)',
        targetNodeType: 'Character',
        contextualLabel: 'Event \'CEO Marcus Blackwood\'s Final Speech\' features Character \'Marcus Blackwood (Deceased)\'',
        shortLabel: 'Involves'
      }
    },
    {
      source: 'event-ceo-speech',
      target: 'char-alex-reeves',
      label: 'Attended By',
      data: {
        sourceNodeName: 'CEO Marcus Blackwood\'s Final Speech',
        sourceNodeType: 'Timeline',
        targetNodeName: 'Alex Reeves',
        targetNodeType: 'Character',
        contextualLabel: 'Event \'CEO Marcus Blackwood\'s Final Speech\' was attended by Character \'Alex Reeves\'',
        shortLabel: 'Involves'
      }
    },
    {
      source: 'event-ceo-speech',
      target: 'char-victoria-kingsley',
      label: 'Attended By',
      data: {
        sourceNodeName: 'CEO Marcus Blackwood\'s Final Speech',
        sourceNodeType: 'Timeline',
        targetNodeName: 'Victoria Kingsley',
        targetNodeType: 'Character',
        contextualLabel: 'Event \'CEO Marcus Blackwood\'s Final Speech\' was attended by Character \'Victoria Kingsley\'',
        shortLabel: 'Involves'
      }
    },
    {
      source: 'event-ceo-speech',
      target: 'elem-speech-transcript',
      label: 'Key Evidence',
      data: {
        sourceNodeName: 'CEO Marcus Blackwood\'s Final Speech',
        sourceNodeType: 'Timeline',
        targetNodeName: 'Speech Transcript (Digital)',
        targetNodeType: 'Element',
        contextualLabel: 'Event \'CEO Marcus Blackwood\'s Final Speech\' has key evidence Element \'Speech Transcript (Digital)\'',
        shortLabel: 'Evidence'
      }
    },
    {
      source: 'event-ceo-speech',
      target: 'elem-strange-artifact',
      label: 'Features Element',
      data: {
        sourceNodeName: 'CEO Marcus Blackwood\'s Final Speech',
        sourceNodeType: 'Timeline',
        targetNodeName: 'Strange Artifact (Seen at Speech)',
        targetNodeType: 'Element',
        contextualLabel: 'Event \'CEO Marcus Blackwood\'s Final Speech\' features Element \'Strange Artifact (Seen at Speech)\'',
        shortLabel: 'Evidence'
      }
    }
  ]
};

export const MOCK_SPOC_ELEMENT_HUB_DATA = {
  center: { id: 'char-player', name: 'Player Character', type: 'Character' },
  nodes: [
    { id: 'char-player', name: 'Player Character', type: 'Character' },
    { id: 'elem-container-hub', name: 'Backpack (Hub)', type: 'Element', basicType: 'Container' }, // INTERMEDIARY_HUB_TYPE
    { id: 'elem-inside-item', name: 'Key Item Inside', type: 'Element' },
    { id: 'elem-other-item', name: 'Other Item', type: 'Element' },
  ],
  edges: [
    // Path via Element Hub: Player -> Backpack -> KeyItem
    { source: 'char-player', target: 'elem-container-hub', label: 'Owns Container', data: { shortLabel: 'Owns' } }, // Strong-ish link to hub
    { source: 'elem-container-hub', target: 'elem-inside-item', label: 'Contains Item', data: { shortLabel: 'Contains' } }, // Strong relationship for grouping

    // Weak direct link from Player to KeyItem (should be pruned by SPOC)
    { source: 'char-player', target: 'elem-inside-item', label: 'Knows About (Weak)', data: { shortLabel: 'Associated' } },
    
    // Another item owned directly, should remain
    { source: 'char-player', target: 'elem-other-item', label: 'Owns Other', data: { shortLabel: 'Owns' } },
  ],
}; 