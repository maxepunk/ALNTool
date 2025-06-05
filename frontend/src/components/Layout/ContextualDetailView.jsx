import React from 'react';
import useJourneyStore from '../../stores/journeyStore';

const ContextualDetailView = () => {
  const activeGapDetails = useJourneyStore((state) => state.activeGapDetails);
  const selectedItemId = useJourneyStore((state) => state.selectedItemId);

  // Determine if the selected item is the active gap
  // This is a simple check; a more robust system might involve checking item types or prefixes.
  const isGapSelectedAndActive = activeGapDetails && selectedItemId === activeGapDetails.id;

  if (!isGapSelectedAndActive && !activeGapDetails) { // Show default if no gap is active or if selected item is not the active gap
    return (
      <div style={styles.container}>
        <p style={styles.defaultText}>Select a gap on the timeline to see its details and resolution suggestions here.</p>
        {selectedItemId && <p style={styles.infoText}>Selected Item ID: {selectedItemId}</p>}
      </div>
    );
  }

  // If activeGapDetails is populated, display them
  if (activeGapDetails) {
    return (
      <div style={styles.container}>
        <h3 style={styles.header}>Gap Details ({activeGapDetails.id})</h3>
        <div style={styles.detailSection}>
          <p><strong>Character:</strong> {activeGapDetails.character}</p>
          <p><strong>Time:</strong> {activeGapDetails.time}</p>
          <p><strong>Description:</strong> {activeGapDetails.description}</p>
        </div>

        <div style={styles.suggestionsSection}>
          <h4 style={styles.subHeader}>Smart Suggestions for this Gap</h4>
          <ul style={styles.suggestionList}>
            {/* Mock suggestions */}
            <li>Add a new puzzle involving {activeGapDetails.character}.</li>
            <li>Introduce an interaction with another character.</li>
            <li>Place a discovery item for {activeGapDetails.character} to find.</li>
            <li>Consider a flashback sequence to fill the time.</li>
          </ul>
        </div>
         {selectedItemId && selectedItemId !== activeGapDetails.id &&
            <p style={{...styles.infoText, marginTop: '15px'}}>Currently selected item ({selectedItemId}) is not this gap.</p>
         }
      </div>
    );
  }

  // Fallback, though the first condition should ideally catch all "show default" cases
  return (
    <div style={styles.container}>
      <p style={styles.defaultText}>Contextual details will appear here.</p>
    </div>
  );
};

const styles = {
  container: {
    padding: '15px',
    fontFamily: 'Arial, sans-serif',
    color: '#333', // Default text color for this panel
    height: '100%',
    overflowY: 'auto',
  },
  header: {
    marginTop: 0,
    marginBottom: '15px',
    color: '#1a242f', // Darker header color
    borderBottom: '2px solid #2c3e50',
    paddingBottom: '5px',
  },
  detailSection: {
    marginBottom: '20px',
  },
  suggestionsSection: {
    padding: '10px',
    backgroundColor: '#f9f9f9', // Light background for suggestions
    borderRadius: '4px',
    border: '1px solid #eee',
  },
  subHeader: {
    marginTop: 0,
    marginBottom: '10px',
    color: '#2c3e50',
  },
  suggestionList: {
    listStyleType: 'disc',
    paddingLeft: '20px',
  },
  defaultText: {
    fontSize: '14px',
    color: '#777',
    textAlign: 'center',
    marginTop: '20px',
  },
  infoText: {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
  }
};

export default ContextualDetailView;
