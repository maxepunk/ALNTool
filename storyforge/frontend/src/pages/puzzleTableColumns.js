export const puzzleTableColumns = [
  { 
    id: 'puzzle', 
    label: 'Puzzle Name', 
    sortable: true, 
    width: '25%' 
  },
  {
    id: 'properties.actFocus', 
    label: 'Act Focus', 
    sortable: true, 
    width: '10%',
    format: (value, row) => row.properties?.actFocus || row.timing || 'N/A'
  },
  {
    id: 'properties.themes', 
    label: 'Themes', 
    sortable: false, 
    width: '20%',
    format: (value, row) => row.properties?.themes?.join(', ') || 'No themes'
  },
  { 
    id: 'owner', 
    label: 'Owner(s)', 
    sortable: false, 
    width: '15%',
    format: (value, row) => row.owner?.join(', ') || 'Unassigned'
  },
  { 
    id: 'rewards', 
    label: 'Rewards (Count)', 
    sortable: false, 
    align: 'center', 
    width: '10%',
    format: (value, row) => row.rewards?.length || 0
  },
  {
    id: 'narrativeThreads', 
    label: 'Narrative Threads', 
    sortable: false, 
    width: '20%',
    format: (value, row) => row.narrativeThreads?.join(', ') || 'No threads'
  },
];