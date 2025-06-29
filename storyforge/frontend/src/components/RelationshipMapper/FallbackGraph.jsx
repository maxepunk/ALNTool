import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Typography, Box, Alert, List, ListItem, ListItemText, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

/**
 * A simple fallback component that renders a basic representation of the relationship data
 * for debugging purposes when the main React Flow component fails
 */
const FallbackGraph = ({ entityType, entityName, relationshipData }) => {
  
  const getRelationLists = () => {
    if (!relationshipData) return [];
    
    const relations = [];
    const addRelation = (label, items, targetType) => {
      if (items && items.length > 0) {
        relations.push({ label, items, targetType });
      }
    };

    switch (entityType) {
      case 'Character':
        addRelation('Owned Elements', relationshipData.ownedElements, 'elements');
        addRelation('Associated Elements', relationshipData.associatedElements, 'elements');
        addRelation('Timeline Events', relationshipData.events, 'timeline');
        addRelation('Puzzles', relationshipData.puzzles, 'puzzles');
        break;
      case 'Element':
        if (relationshipData.owner) addRelation('Owner', [relationshipData.owner], 'characters');
        addRelation('Associated Characters', relationshipData.associatedCharacters, 'characters');
        addRelation('Timeline Events', relationshipData.timelineEvents, 'timeline');
        addRelation('Required For Puzzles', relationshipData.requiredForPuzzle, 'puzzles');
        addRelation('Rewarded By Puzzles', relationshipData.rewardedByPuzzle, 'puzzles');
        if (relationshipData.containerPuzzle) addRelation('Container Puzzle', [relationshipData.containerPuzzle], 'puzzles');
        if (relationshipData.container) addRelation('Container (Inside)', [relationshipData.container], 'elements');
        addRelation('Contents', relationshipData.contents, 'elements');
        break;
      case 'Puzzle':
        if (relationshipData.owner) addRelation('Owner', [relationshipData.owner], 'characters');
        if (relationshipData.lockedItem) addRelation('Locks Item', [relationshipData.lockedItem], 'elements');
        addRelation('Requires Elements', relationshipData.puzzleElements, 'elements');
        addRelation('Rewards Elements', relationshipData.rewards, 'elements');
        if (relationshipData.parentItem) addRelation('Parent Puzzle', [relationshipData.parentItem], 'puzzles');
        addRelation('Sub-Puzzles', relationshipData.subPuzzles, 'puzzles');
        break;
      case 'Timeline':
        addRelation('Characters Involved', relationshipData.charactersInvolved, 'characters');
        addRelation('Memory/Evidence', relationshipData.memoryEvidence, 'elements');
        break;
      default:
        break;
    }
    return relations;
  };
  
  const relationLists = getRelationLists();
  
  return (
    <Paper sx={{ p: 2, maxHeight: '450px', overflowY: 'auto' }} elevation={0}>
      <Alert severity="warning" sx={{ mb: 2 }}>
        Visual map error. Displaying relationships as lists:
      </Alert>
      
      <Typography variant="h6" sx={{ mb: 1 }}>
        {entityName} ({entityType})
      </Typography>
      
      {relationLists.length === 0 && (
        <Alert severity="info" icon={false}>
          No direct relationships found in data for this fallback view.
        </Alert>
      )}

      {relationLists.map((relation, index) => (
        <Box key={index} sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {relation.label} ({relation.items.length})
          </Typography>
          <List dense disablePadding>
            {relation.items.map(item => (
              <ListItem 
                key={item.id}
                button 
                component={RouterLink} 
                to={`/${relation.targetType}/${item.id}`}
                sx={{ pl: 2, borderRadius: 1, '&:hover': { bgcolor: 'action.hover'}}}
              >
                <ListItemText 
                  primary={item.name || item.description || item.puzzle || item.id} 
                  secondary={`ID: ${item.id}`}
                />
              </ListItem>
            ))}
          </List>
          {index < relationLists.length -1 && <Divider sx={{my:1}}/>}
        </Box>
      ))}
    </Paper>
  );
};

FallbackGraph.propTypes = {
  entityType: PropTypes.string.isRequired,
  entityName: PropTypes.string,
  relationshipData: PropTypes.object,
};

export default FallbackGraph; 