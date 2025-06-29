import React from 'react';
import logger from '../../utils/logger';
import { 
  Paper, 
  Typography, 
  Box, 
  Chip, 
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Stack
} from '@mui/material';
import useJourneyStore from '../../stores/journeyStore';
import { useNavigate } from 'react-router-dom';
// Icons for node types
import PuzzleIcon from '@mui/icons-material/Extension';
import ElementIcon from '@mui/icons-material/Inventory';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LaunchIcon from '@mui/icons-material/Launch';

const ContextWorkspace = () => {
  const selectedNode = useJourneyStore(state => state.selectedNode);
  const navigate = useNavigate();

  // Get node type from the node id prefix or type field
  const getNodeType = (node) => {
    if (!node) return null;
    if (node.type) return node.type;
    
    // Parse from ID prefix
    const idPrefix = node.id.split('-')[0];
    switch (idPrefix) {
      case 'puzzle': return 'activityNode';
      case 'element': return 'discoveryNode';
      case 'event': return 'loreNode';
      default: return 'unknown';
    }
  };

  // Get icon for node type
  const getNodeIcon = (nodeType) => {
    switch (nodeType) {
      case 'activityNode': return <PuzzleIcon />;
      case 'discoveryNode': return <ElementIcon />;
      case 'loreNode': return <EventIcon />;
      default: return <PersonIcon />;
    }
  };

  // Get color for node type
  const getNodeColor = (nodeType) => {
    switch (nodeType) {
      case 'activityNode': return 'primary';
      case 'discoveryNode': return 'success';
      case 'loreNode': return 'warning';
      default: return 'default';
    }
  };

  // Render specific details based on node type
  const renderNodeTypeDetails = () => {
    if (!selectedNode || !selectedNode.data) return null;
    
    const nodeType = getNodeType(selectedNode);
    const data = selectedNode.data;

    switch (nodeType) {
      case 'activityNode':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Activity Details
            </Typography>
            {data.timing && (
              <Typography variant="body2">
                <strong>Timing:</strong> {data.timing}
              </Typography>
            )}
            {data.prerequisiteIds && data.prerequisiteIds.length > 0 && (
              <Typography variant="body2">
                <strong>Prerequisites:</strong> {data.prerequisiteIds.length} items
              </Typography>
            )}
            {data.rewardIds && data.rewardIds.length > 0 && (
              <Typography variant="body2">
                <strong>Rewards:</strong> {data.rewardIds.length} items
              </Typography>
            )}
            {data.difficulty && (
              <Typography variant="body2">
                <strong>Difficulty:</strong> {data.difficulty}
              </Typography>
            )}
          </Box>
        );

      case 'discoveryNode':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Discovery Details
            </Typography>
            {data.type && (
              <Typography variant="body2">
                <strong>Element Type:</strong> {data.type}
              </Typography>
            )}
            {data.memoryType && (
              <Typography variant="body2">
                <strong>Memory Type:</strong> {data.memoryType}
              </Typography>
            )}
            {data.memoryValue !== undefined && (
              <Typography variant="body2">
                <strong>Memory Value:</strong> {data.memoryValue}
              </Typography>
            )}
            {data.owner && (
              <Typography variant="body2">
                <strong>Owner:</strong> {data.owner}
              </Typography>
            )}
            {data.container && (
              <Typography variant="body2">
                <strong>Container:</strong> {data.container}
              </Typography>
            )}
          </Box>
        );

      case 'loreNode':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Lore Details
            </Typography>
            {data.date && (
              <Typography variant="body2">
                <strong>Date:</strong> {data.date}
              </Typography>
            )}
            {data.actFocus && (
              <Typography variant="body2">
                <strong>Act Focus:</strong> {data.actFocus}
              </Typography>
            )}
            {data.characterCount !== undefined && (
              <Typography variant="body2">
                <strong>Characters Involved:</strong> {data.characterCount}
              </Typography>
            )}
            {data.description && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Description:</strong><br />
                {data.description}
              </Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  // Render connections (edges)
  const renderConnections = () => {
    if (!selectedNode || !selectedNode.data) return null;

    const { incomingEdges = [], outgoingEdges = [] } = selectedNode.data;

    if (incomingEdges.length === 0 && outgoingEdges.length === 0) {
      return null;
    }

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Connections
        </Typography>
        
        {incomingEdges.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ArrowBackIcon sx={{ mr: 1, fontSize: 16 }} />
              <strong>Incoming ({incomingEdges.length})</strong>
            </Typography>
            <List dense sx={{ pl: 2 }}>
              {incomingEdges.slice(0, 3).map((edge, idx) => (
                <ListItem key={idx} sx={{ py: 0 }}>
                  <ListItemText 
                    primary={edge.sourceLabel || edge.source}
                    secondary={edge.label || edge.type}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
              {incomingEdges.length > 3 && (
                <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                  ...and {incomingEdges.length - 3} more
                </Typography>
              )}
            </List>
          </Box>
        )}

        {outgoingEdges.length > 0 && (
          <Box>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ArrowForwardIcon sx={{ mr: 1, fontSize: 16 }} />
              <strong>Outgoing ({outgoingEdges.length})</strong>
            </Typography>
            <List dense sx={{ pl: 2 }}>
              {outgoingEdges.slice(0, 3).map((edge, idx) => (
                <ListItem key={idx} sx={{ py: 0 }}>
                  <ListItemText 
                    primary={edge.targetLabel || edge.target}
                    secondary={edge.label || edge.type}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
              {outgoingEdges.length > 3 && (
                <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                  ...and {outgoingEdges.length - 3} more
                </Typography>
              )}
            </List>
          </Box>
        )}
      </Box>
    );
  };

  // Handle view details action
  const handleViewDetails = () => {
    if (!selectedNode) return;
    
    const [entityType, entityId] = selectedNode.id.split('-').slice(0, 2);
    const idParts = selectedNode.id.split('-');
    const actualId = idParts.slice(1).join('-'); // Handle IDs with dashes
    
    switch (entityType) {
      case 'puzzle':
        navigate(`/puzzles/${actualId}`);
        break;
      case 'element':
        navigate(`/elements/${actualId}`);
        break;
      case 'event':
        navigate(`/timeline/${actualId}`);
        break;
      default:
        logger.warn('Unknown entity type:', entityType);
    }
  };

  const renderNodeDetails = () => {
    if (!selectedNode) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: 150,
          color: 'text.secondary'
        }}>
          <Typography variant="body2">
            Select a node in the journey graph to see its details.
          </Typography>
        </Box>
      );
    }

    const nodeType = getNodeType(selectedNode);

    return (
      <Box>
        {/* Header with icon and type */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 2, color: `${getNodeColor(nodeType)}.main` }}>
            {getNodeIcon(nodeType)}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {selectedNode.data?.label || 'Unnamed Node'}
            </Typography>
            <Chip 
              label={nodeType.replace('Node', '').charAt(0).toUpperCase() + nodeType.replace('Node', '').slice(1)} 
              size="small" 
              color={getNodeColor(nodeType)}
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Node ID (truncated) */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          ID: {selectedNode.id}
        </Typography>

        {/* Type-specific details */}
        {renderNodeTypeDetails()}

        {/* Connections */}
        {renderConnections()}

        {/* Actions */}
        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<LaunchIcon />}
            onClick={handleViewDetails}
          >
            View Details
          </Button>
        </Stack>
      </Box>
    );
  };

  return (
    <Paper
      elevation={2}
      sx={{
        padding: 2,
        marginTop: 2,
        minHeight: '200px',
        maxHeight: '400px',
        borderTop: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Context Workspace
      </Typography>
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {renderNodeDetails()}
      </Box>
    </Paper>
  );
};

export default ContextWorkspace;
