import React, { useEffect, useState } from 'react';
import useJourneyStore from '../stores/journeyStore';
import { ExperienceFlowAnalyzer } from '../components/PlayerJourney/JourneyGraphView';
import DualLensLayout from '../components/Layout/DualLensLayout';
import { 
  Box, 
  Typography, 
  Paper, 
  Alert, 
  Chip, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimelineIcon from '@mui/icons-material/Timeline';

function PlayerJourneyPage() {
  const { activeCharacterId, loadJourney, journeyData } = useJourneyStore(state => ({
    activeCharacterId: state.activeCharacterId,
    loadJourney: state.loadJourney,
    journeyData: state.journeyData,
  }));
  
  const [systemAnalysis, setSystemAnalysis] = useState(null);

  useEffect(() => {
    // Load journey data if an active character is selected and their data isn't already loaded.
    if (activeCharacterId && !journeyData.has(activeCharacterId)) {
      loadJourney(activeCharacterId);
    }
  }, [activeCharacterId, journeyData, loadJourney]);

  if (!activeCharacterId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">No Character Selected</Typography>
        <Typography color="text.secondary">Please select a character to view their journey timeline.</Typography>
      </Box>
    );
  }

  const journeySpace = (
    <ExperienceFlowAnalyzer 
      characterId={activeCharacterId} 
      onAnalysisUpdate={setSystemAnalysis}
    />
  );
  
  // Enhanced system space with production insights
  const systemSpace = (
    <Paper sx={{p: 2, height: '100%', display: 'flex', flexDirection: 'column'}}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TimelineIcon />
        Production Insights
      </Typography>
      
      {activeCharacterId && journeyData.has(activeCharacterId) ? (
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {/* Character Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Character Profile</Typography>
            {(() => {
              const charInfo = journeyData.get(activeCharacterId)?.character_info;
              return charInfo ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip 
                    label={`${charInfo.tier || 'Unknown'} Tier`} 
                    color={charInfo.tier === 'Core' ? 'primary' : charInfo.tier === 'Secondary' ? 'secondary' : 'default'}
                    size="small"
                  />
                  <Chip 
                    label={charInfo.type || 'Player'} 
                    variant="outlined"
                    size="small"
                  />
                  {charInfo.resolutionPaths && charInfo.resolutionPaths.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Resolution Paths:</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {charInfo.resolutionPaths.map(path => (
                          <Chip key={path} label={path} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">Loading character details...</Typography>
              );
            })()} 
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Production Checklist */}
          <Typography variant="subtitle2" gutterBottom>Production Checklist</Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                {systemAnalysis?.pacing?.score >= 80 ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <WarningIcon color="warning" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText 
                primary="Experience Pacing" 
                secondary={systemAnalysis ? `Score: ${systemAnalysis.pacing.score}/100` : 'Analyzing...'}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {systemAnalysis?.memoryTokenFlow?.collected >= 3 ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <WarningIcon color="warning" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText 
                primary="Memory Token Collection" 
                secondary={systemAnalysis ? `${systemAnalysis.memoryTokenFlow.collected}/${systemAnalysis.memoryTokenFlow.total} tokens` : 'Analyzing...'}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {systemAnalysis?.qualityMetrics?.balance === 'excellent' || systemAnalysis?.qualityMetrics?.balance === 'good' ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <WarningIcon color="warning" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText 
                primary="Discovery/Action Balance" 
                secondary={systemAnalysis ? `${systemAnalysis.qualityMetrics.discoveryRatio}% discovery` : 'Analyzing...'}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {systemAnalysis?.bottlenecks?.length === 0 ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <WarningIcon color="warning" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText 
                primary="Flow Bottlenecks" 
                secondary={systemAnalysis ? `${systemAnalysis.bottlenecks.length} potential issues` : 'Analyzing...'}
              />
            </ListItem>
          </List>
          
          {/* Production Recommendations */}
          {systemAnalysis && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Recommendations</Typography>
              
              {systemAnalysis.pacing.score < 80 && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  Consider adjusting pacing - current score: {systemAnalysis.pacing.score}/100
                </Alert>
              )}
              
              {systemAnalysis.memoryTokenFlow.collected < 3 && (
                <Alert severity="info" sx={{ mb: 1 }}>
                  Add more memory token opportunities to reach target economy
                </Alert>
              )}
              
              {systemAnalysis.qualityMetrics.balance === 'needs-attention' && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  Rebalance discovery/action ratio - aim for 55-70% discovery content
                </Alert>
              )}
              
              {systemAnalysis.bottlenecks.length === 0 && systemAnalysis.pacing.score >= 80 && (
                <Alert severity="success">
                  Experience flow looks excellent! Ready for production.
                </Alert>
              )}
            </>
          )}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Select a character to view production insights and experience flow analysis.
        </Typography>
      )}
    </Paper>
  );

  return (
    <DualLensLayout
      journeySpaceContent={journeySpace}
      systemSpaceContent={systemSpace}
      title="Experience Flow Analyzer"
    />
  );
}

export default PlayerJourneyPage; 