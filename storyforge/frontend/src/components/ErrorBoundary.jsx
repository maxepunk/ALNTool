import React from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import logger from '../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    logger.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.handleReset}
          level={this.props.level || 'page'}
        />
      );
    }

    return this.props.children;
  }
}

// Functional component for the error UI
function ErrorFallback({ error, resetError, level }) {
  const navigate = useNavigate && typeof useNavigate === 'function' ? useNavigate() : null;

  const handleGoHome = () => {
    resetError();
    if (navigate) {
      navigate('/');
    } else {
      window.location.href = '/';
    }
  };

  const errorTitle = level === 'app' ? 'Application Error' :
                    level === 'route' ? 'Page Not Available' :
                    'Something went wrong';

  const errorDescription = level === 'app' ? 
    'The application encountered an unexpected error. Please refresh the page or contact support if the problem persists.' :
    level === 'route' ? 
    'This page encountered an error and cannot be displayed. Try navigating to a different page.' :
    'This component encountered an error. You can try refreshing or navigating away.';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: level === 'app' ? '100vh' : '400px',
        p: 3,
        bgcolor: 'background.default'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center'
        }}
      >
        <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        
        <Typography variant="h4" component="h1" gutterBottom color="error">
          {errorTitle}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {errorDescription}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="subtitle2" gutterBottom>
              Error Details:
            </Typography>
            <Typography variant="body2" component="pre" sx={{ 
              fontFamily: 'monospace', 
              fontSize: '0.875rem',
              overflow: 'auto',
              maxHeight: 200
            }}>
              {error.toString()}
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={resetError}
          >
            Try Again
          </Button>
          
          {level !== 'app' && (
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
            >
              Go Home
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default ErrorBoundary;