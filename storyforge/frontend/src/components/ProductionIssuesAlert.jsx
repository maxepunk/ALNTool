import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Alert, Typography, Box, Button } from '@mui/material';

const ProductionIssuesAlert = ({ issues }) => {
  const navigate = useNavigate();

  if (!issues || issues.length === 0) {
    return null;
  }

  return (
    <Alert 
      severity="warning" 
      sx={{ mb: 3 }}
      action={
        <Button color="inherit" size="small" onClick={() => navigate('/resolution-path-analyzer')}>
          View Path Analyzer
        </Button>
      }
    >
      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
        {issues.length} production issue(s) detected:
      </Typography>
      <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
        {issues.slice(0, 2).map((issue, index) => (
          <li key={index}>
            <Typography variant="body2">{issue.message}</Typography>
          </li>
        ))}
        {issues.length > 2 && (
          <li>
            <Typography variant="body2">+{issues.length - 2} more issues</Typography>
          </li>
        )}
      </Box>
    </Alert>
  );
};

ProductionIssuesAlert.propTypes = {
  issues: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      severity: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      action: PropTypes.string.isRequired,
    })
  ),
};

export default ProductionIssuesAlert;