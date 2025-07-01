import React from 'react';
import PropTypes from 'prop-types';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssessmentIcon from '@mui/icons-material/Assessment';

const BalanceAnalysisAccordion = ({ balanceAnalysis }) => {
  const { issues, recommendations } = balanceAnalysis;

  if (issues.length === 0 && recommendations.length === 0) {
    return null;
  }

  return (
    <Accordion sx={{ mb: 3 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="warning" />
          Production Analysis ({issues.length} issues, {recommendations.length} recommendations)
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {issues.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="error.main" gutterBottom>Issues Detected:</Typography>
            {issues.map((issue, index) => (
              <Alert key={index} severity="warning" sx={{ mb: 1 }}>{issue}</Alert>
            ))}
          </Box>
        )}
        {recommendations.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="info.main" gutterBottom>Recommendations:</Typography>
            {recommendations.map((rec, index) => (
              <Alert key={index} severity="info" sx={{ mb: 1 }}>{rec}</Alert>
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

BalanceAnalysisAccordion.propTypes = {
  balanceAnalysis: PropTypes.shape({
    issues: PropTypes.arrayOf(PropTypes.string).isRequired,
    recommendations: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired
};

export default BalanceAnalysisAccordion;