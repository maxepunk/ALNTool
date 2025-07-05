import React from 'react';
import { Box, Typography, Alert, AlertTitle, Button, Collapse } from '@mui/material';
import { Refresh as RefreshIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import logger from '../../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('ErrorBoundary caught error:', { 
      error: error.toString(), 
      errorInfo,
      componentStack: errorInfo.componentStack 
    });
    
    // Store error details for display
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      showDetails: false
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;
      
      return (
        <Box sx={{ p: 2, width: '100%' }}>
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={this.handleReset}
                  startIcon={<RefreshIcon />}
                >
                  Try Again
                </Button>
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
              </Box>
            }
          >
            <AlertTitle>Something went wrong</AlertTitle>
            <Typography variant="body2">
              {error?.message || 'An unexpected error occurred in this component.'}
            </Typography>
            
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  onClick={this.toggleDetails}
                  endIcon={<ExpandMoreIcon sx={{ 
                    transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }} />}
                >
                  {showDetails ? 'Hide' : 'Show'} Details
                </Button>
                
                <Collapse in={showDetails}>
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Stack Trace:
                    </Typography>
                    {errorInfo?.componentStack}
                  </Box>
                </Collapse>
              </Box>
            )}
          </Alert>
          
          {/* Provide context-specific help */}
          <Alert severity="info">
            <Typography variant="body2">
              If this error persists, try:
            </Typography>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Refreshing the page</li>
              <li>Clearing your browser cache</li>
              <li>Checking your network connection</li>
              <li>Contacting support if the issue continues</li>
            </ul>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;