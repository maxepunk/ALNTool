import React from 'react';
import PropTypes from 'prop-types';
import {
  Accordion, AccordionSummary, AccordionDetails,
  Typography, Alert, Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const RecommendationsPanel = ({ recommendations }) => {
  return (
    <Accordion defaultExpanded={false}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon color="info" />
          <span>Production Recommendations ({recommendations.length})</span>
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {recommendations.map((rec, index) => (
          <Alert 
            key={index} 
            severity={rec.severity}
            sx={{ mb: 1 }}
            action={
              <Button size="small" color="inherit">
                View Details
              </Button>
            }
          >
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{rec.message}</Typography>
            <Typography variant="caption">{rec.action}</Typography>
          </Alert>
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

RecommendationsPanel.propTypes = {
  recommendations: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string.isRequired,
    severity: PropTypes.oneOf(['error', 'warning', 'info', 'success']).isRequired,
    message: PropTypes.string.isRequired,
    action: PropTypes.string.isRequired
  })).isRequired
};

export default RecommendationsPanel;