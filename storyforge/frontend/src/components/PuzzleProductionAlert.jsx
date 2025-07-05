import React from 'react';
import {
  Alert, AlertTitle, Box, Collapse, IconButton, Typography, Chip
} from '@mui/material';
import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';

function PuzzleProductionAlert({ analytics }) {
  const [expanded, setExpanded] = useState(false);

  if (!analytics?.issues || analytics.issues.length === 0) {
    return null;
  }

  const { issues } = analytics;
  const severityCounts = issues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, {});

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error': return <ErrorIcon fontSize="small" />;
      case 'warning': return <WarningIcon fontSize="small" />;
      case 'info': return <InfoIcon fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const primarySeverity = issues.find(issue => issue.severity === 'error') 
    ? 'error' 
    : issues.find(issue => issue.severity === 'warning') 
    ? 'warning' 
    : 'info';

  return (
    <Alert 
      severity={primarySeverity}
      sx={{ mb: 3 }}
      action={
        <IconButton
          color="inherit"
          size="small"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Show less" : "Show more"}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      }
    >
      <AlertTitle>
        Production Intelligence Alert
        <Box sx={{ display: 'inline-flex', gap: 1, ml: 2 }}>
          {Object.entries(severityCounts).map(([severity, count]) => (
            <Chip
              key={severity}
              label={`${count} ${severity}`}
              size="small"
              color={getSeverityColor(severity)}
              variant="outlined"
            />
          ))}
        </Box>
      </AlertTitle>
      
      <Typography variant="body2" sx={{ mb: expanded ? 2 : 0 }}>
        Production Issues Detected - Click to view details
      </Typography>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          {issues.map((issue, index) => (
            <Box 
              key={index}
              sx={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                gap: 1.5,
                mb: index < issues.length - 1 ? 2 : 0,
                p: 1.5,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box sx={{ color: `${getSeverityColor(issue.severity)}.main`, mt: 0.5 }}>
                {getSeverityIcon(issue.severity)}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="text.primary">
                  {issue.message}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Recommendation: {issue.action}
                </Typography>
                <Chip
                  label={issue.type}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Alert>
  );
}

export default PuzzleProductionAlert;