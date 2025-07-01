import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FlashOnIcon from '@mui/icons-material/FlashOn';

const DependencyAnalysisPanel = ({
  dependencyAnalysis,
  highlightCriticalPaths,
  setHighlightCriticalPaths,
  showBottlenecks,
  setShowBottlenecks,
  showCollaborationOpps,
  setShowCollaborationOpps,
}) => {
  return (
    <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 1 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FlashOnIcon color="warning" fontSize="small" />
          Dependency Analysis
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {/* Critical Paths */}
        {dependencyAnalysis.criticalPaths.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              Critical Dependencies:
            </Typography>
            {dependencyAnalysis.criticalPaths.map((path, index) => (
              <Box key={index} sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                p: 1, 
                bgcolor: path.severity === 'high' ? 'error.light' : 'warning.light',
                borderRadius: 1,
                mt: 0.5,
                color: path.severity === 'high' ? 'error.contrastText' : 'warning.contrastText'
              }}>
                {path.icon}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    {path.type}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {path.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
        
        {/* Bottlenecks */}
        {dependencyAnalysis.bottlenecks.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              Resource Bottlenecks:
            </Typography>
            {dependencyAnalysis.bottlenecks.map((bottleneck, index) => (
              <Box key={index} sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                p: 1, 
                bgcolor: 'error.light',
                borderRadius: 1,
                mt: 0.5,
                color: 'error.contrastText'
              }}>
                {bottleneck.icon}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    {bottleneck.type}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {bottleneck.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
        
        {/* Collaboration Opportunities */}
        {dependencyAnalysis.collaborationOpportunities.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'info.main' }}>
              Collaboration Points:
            </Typography>
            {dependencyAnalysis.collaborationOpportunities.map((opp, index) => (
              <Box key={index} sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                p: 1, 
                bgcolor: 'info.light',
                borderRadius: 1,
                mt: 0.5,
                color: 'info.contrastText'
              }}>
                {opp.icon}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    {opp.type}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {opp.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
        
        {/* Isolation Risks */}
        {dependencyAnalysis.isolationRisks.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
              Social Balance:
            </Typography>
            {dependencyAnalysis.isolationRisks.map((risk, index) => (
              <Box key={index} sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                p: 1, 
                bgcolor: 'warning.light',
                borderRadius: 1,
                mt: 0.5,
                color: 'warning.contrastText'
              }}>
                {risk.icon}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    {risk.type}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {risk.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
        
        {/* Orchestration Controls */}
        <Typography variant="caption" sx={{ fontWeight: 'bold', mt: 1, mb: 1, display: 'block' }}>
          Production Highlights:
        </Typography>
        <FormControlLabel
          control={
            <Switch 
              checked={highlightCriticalPaths} 
              onChange={(e) => setHighlightCriticalPaths(e.target.checked)}
              size="small"
            />
          }
          label="Critical Dependencies"
          sx={{ display: 'block', mb: 0.5 }}
        />
        <FormControlLabel
          control={
            <Switch 
              checked={showBottlenecks} 
              onChange={(e) => setShowBottlenecks(e.target.checked)}
              size="small"
            />
          }
          label="Resource Bottlenecks"
          sx={{ display: 'block', mb: 0.5 }}
        />
        <FormControlLabel
          control={
            <Switch 
              checked={showCollaborationOpps} 
              onChange={(e) => setShowCollaborationOpps(e.target.checked)}
              size="small"
            />
          }
          label="Collaboration Opportunities"
          sx={{ display: 'block' }}
        />
      </AccordionDetails>
    </Accordion>
  );
};

DependencyAnalysisPanel.propTypes = {
  dependencyAnalysis: PropTypes.shape({
    criticalPaths: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      severity: PropTypes.string.isRequired,
      icon: PropTypes.element.isRequired,
    })).isRequired,
    bottlenecks: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      severity: PropTypes.string.isRequired,
      icon: PropTypes.element.isRequired,
    })).isRequired,
    collaborationOpportunities: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      severity: PropTypes.string.isRequired,
      icon: PropTypes.element.isRequired,
    })).isRequired,
    isolationRisks: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      severity: PropTypes.string.isRequired,
      icon: PropTypes.element.isRequired,
    })).isRequired,
  }).isRequired,
  highlightCriticalPaths: PropTypes.bool.isRequired,
  setHighlightCriticalPaths: PropTypes.func.isRequired,
  showBottlenecks: PropTypes.bool.isRequired,
  setShowBottlenecks: PropTypes.func.isRequired,
  showCollaborationOpps: PropTypes.bool.isRequired,
  setShowCollaborationOpps: PropTypes.func.isRequired,
};

export default DependencyAnalysisPanel;