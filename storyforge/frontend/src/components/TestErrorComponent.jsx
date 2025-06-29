import React from 'react';
import { Button, Box, Typography } from '@mui/material';

const TestErrorComponent = () => {
  const [shouldError, setShouldError] = React.useState(false);

  if (shouldError) {
    // Intentional error to test error boundaries
    throw new Error('Test error for ErrorBoundary testing');
  }

  return (
    <Box sx={{ padding: 2, border: '1px dashed orange', margin: 2 }}>
      <Typography variant="h6" gutterBottom>
        Error Boundary Test Component
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Click the button below to trigger an intentional error and test error boundary recovery.
      </Typography>
      <Button 
        variant="contained" 
        color="warning"
        onClick={() => setShouldError(true)}
        sx={{ mt: 1 }}
      >
        Trigger Test Error
      </Button>
    </Box>
  );
};

export default TestErrorComponent;