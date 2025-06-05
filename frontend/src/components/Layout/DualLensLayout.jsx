import React from 'react';
import useJourneyStore from '../../stores/journeyStore'; // Import Zustand store
import BreadcrumbNavigation from './BreadcrumbNavigation'; // Import BreadcrumbNavigation
import ContextualDetailView from './ContextualDetailView'; // Import ContextualDetailView

const DualLensLayout = ({ journeySpaceContent, systemSpaceContent, contextWorkspaceContent }) => {
  const selectedTimeRange = useJourneyStore((state) => state.selectedTimeRange);
  const setSelectedTimeRange = useJourneyStore((state) => state.setSelectedTimeRange);
  const selectedItemId = useJourneyStore((state) => state.selectedItemId);
  const addBreadcrumb = useJourneyStore((state) => state.addBreadcrumb);
  const removeBreadcrumbAfter = useJourneyStore((state) => state.removeBreadcrumbAfter);
  // const setBreadcrumbs = useJourneyStore((state) => state.setBreadcrumbs); // Not used in this section currently

  // New state for journey loading
  const activeCharacterId = useJourneyStore((state) => state.activeCharacterId);
  const setActiveCharacterId = useJourneyStore((state) => state.setActiveCharacterId);
  const journeyDataMap = useJourneyStore((state) => state.journeyData);
  const gapsMap = useJourneyStore((state) => state.gaps);
  const loadingJourney = useJourneyStore((state) => state.loadingJourney);

  // Temporary controls for store testing
  const handleStoreStartChange = (e) => {
    const newStart = parseInt(e.target.value, 10);
    if (!isNaN(newStart)) {
      setSelectedTimeRange([Math.max(0, Math.min(newStart, selectedTimeRange[1])), selectedTimeRange[1]]);
    }
  };

  const handleStoreEndChange = (e) => {
    const newEnd = parseInt(e.target.value, 10);
    if (!isNaN(newEnd)) {
      setSelectedTimeRange([selectedTimeRange[0], Math.min(90, Math.max(newEnd, selectedTimeRange[0]))]);
    }
  };

  // Demo functions for breadcrumbs
  const handleAddTestCrumb = () => {
    const newCrumbLabel = `TestCrumb ${Date.now() % 1000}`;
    addBreadcrumb({ label: newCrumbLabel, path: `/${newCrumbLabel.toLowerCase()}` });
  };
  const handleGoToRoot = () => {
    // This demonstrates removing breadcrumbs up to a specific path, effectively resetting.
    // Or, for a true "home" or "root", you might use setBreadcrumbs directly.
    removeBreadcrumbAfter("/"); // Go back to the root breadcrumb
    // setBreadcrumbs([{ label: "Game", path: "/" }]); // Alternative for explicit reset
  };


  return (
    <div style={layoutStyle.container}>
      {/* Command Bar */}
      <div style={layoutStyle.commandBar}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap'}}>
            <div>Command Bar Area</div>
            <div style={{display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap'}}>
                <button onClick={handleAddTestCrumb} style={{...buttonStyleSmall, marginRight: '5px'}}>Add Test Crumb</button>
                <button onClick={handleGoToRoot} style={buttonStyleSmall}>Go to Root Crumb</button>
                <button onClick={() => setActiveCharacterId('char1')} style={{...buttonStyleSmall, marginLeft: '10px', backgroundColor: activeCharacterId === 'char1' ? '#76c7c0' : '#555'}} disabled={loadingJourney}>
                  {loadingJourney && activeCharacterId === 'char1' ? 'Loading...' : 'Load Char1 Journey'}
                </button>
                <button onClick={() => setActiveCharacterId('char2')} style={{...buttonStyleSmall, backgroundColor: activeCharacterId === 'char2' ? '#76c7c0' : '#555'}} disabled={loadingJourney}>
                  {loadingJourney && activeCharacterId === 'char2' ? 'Loading...' : 'Load Char2 Journey'}
                </button>
            </div>
        </div>
        <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', paddingTop: '5px', borderTop: '1px solid #4f6a85', flexWrap: 'wrap' }}>
          <label htmlFor="storeStart" style={{color: 'white', fontSize: '12px'}}>Store Time Start:</label>
          <input
            type="number"
            id="storeStart"
            value={selectedTimeRange[0]}
            onChange={handleStoreStartChange}
            style={{...inputStyleSmall, width: '60px'}}
            min="0" max="90"
          />
          <label htmlFor="storeEnd" style={{color: 'white', fontSize: '12px'}}>Store Time End:</label>
          <input
            type="number"
            id="storeEnd"
            value={selectedTimeRange[1]}
            onChange={handleStoreEndChange}
            style={{...inputStyleSmall, width: '60px'}}
            min="0" max="90"
          />
        </div>
      </div>

      {/* Breadcrumb Navigation Area */}
      <BreadcrumbNavigation />

      {/* Main Content Area */}
      <div style={layoutStyle.mainContent}>
        {/* Journey Space (Left Pane) */}
        <div style={layoutStyle.journeySpace}>
          Journey Space (Character-Focused)
          {journeySpaceContent || <p>Default Journey Content</p>}
        </div>

        {/* System Space (Right Pane) */}
        <div style={layoutStyle.systemSpace}>
          System Space (Game-Wide Analytics)
          <p style={{ marginTop: '10px', fontSize: '14px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px' }}>
            Shared Time Range: {selectedTimeRange[0]} min - {selectedTimeRange[1]} min
          </p>
          <p style={{ marginTop: '10px', fontSize: '14px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px' }}>
            Shared Selected Item ID: <strong>{selectedItemId || "None"}</strong>
          </p>
          <div style={{ marginTop: '10px', fontSize: '14px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px' }}>
            <p>Active Character ID: <strong>{activeCharacterId || "None"}</strong></p>
            {loadingJourney && <p><em>Loading journey data...</em></p>}
            {activeCharacterId && journeyDataMap.has(activeCharacterId) && (
              <div>
                <p>Character Name: <strong>{journeyDataMap.get(activeCharacterId)?.name}</strong></p>
                <p>Segments Loaded: {journeyDataMap.get(activeCharacterId)?.segments?.length || 0}</p>
              </div>
            )}
            {activeCharacterId && gapsMap.has(activeCharacterId) && (
              <p>Gaps for {journeyDataMap.get(activeCharacterId)?.name}: {gapsMap.get(activeCharacterId)?.length || 0}</p>
            )}
          </div>
          {systemSpaceContent || <p>Default System Content (No specific prop passed)</p>}
        </div>
      </div>

      {/* Context Workspace (Bottom Panel) */}
      <div style={layoutStyle.contextWorkspace}>
        {/* Render ContextualDetailView directly here, or pass it via prop from App.jsx */}
        {contextWorkspaceContent || <ContextualDetailView />}
      </div>
    </div>
  );
};

const layoutStyle = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f0f2f5', // Light background for the page
  },
  commandBar: {
    backgroundColor: '#2c3e50', // Dark blue/grey
    color: 'white',
    padding: '10px 20px',
    textAlign: 'center',
    flexShrink: 0, // Prevent shrinking
    borderBottom: '2px solid #1a242f',
  },
  mainContent: {
    display: 'flex',
    flexGrow: 1, // Allows this area to take up available space
    overflow: 'hidden', // Prevent content from overflowing viewport
  },
  journeySpace: {
    flexBasis: '50%', // Takes up 50% of the main content width
    backgroundColor: '#e9ebee', // Lighter grey
    padding: '15px',
    borderRight: '2px solid #d1d5da',
    overflowY: 'auto', // Enable scrolling if content overflows
    display: 'flex',
    flexDirection: 'column', // Ensure content within flows top-to-bottom
  },
  systemSpace: {
    flexBasis: '50%', // Takes up 50% of the main content width
    backgroundColor: '#dfe3e7', // Slightly darker grey than journey
    padding: '15px',
    overflowY: 'auto', // Enable scrolling if content overflows
    display: 'flex',
    flexDirection: 'column',
  },
  contextWorkspace: {
    backgroundColor: '#34495e', // Medium dark blue/grey
    color: 'white',
    padding: '15px',
    textAlign: 'center',
    flexShrink: 0, // Prevent shrinking
    minHeight: '100px', // Minimum height
    borderTop: '2px solid #2c3e50',
    overflowY: 'auto',
  },
};

// Small style for temporary inputs in command bar
const inputStyleSmall = {
  padding: '4px 8px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '12px',
  textAlign: 'center',
};

const buttonStyleSmall = {
  padding: '4px 8px',
  border: '1px solid #777',
  borderRadius: '4px',
  fontSize: '12px',
  backgroundColor: '#555',
  color: 'white',
  cursor: 'pointer'
};

export default DualLensLayout;
