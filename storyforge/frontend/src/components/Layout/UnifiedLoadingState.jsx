import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Skeleton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// Loading component for different states
const UnifiedLoadingState = ({ 
  loading = false, 
  error = null, 
  warning = null,
  loadingText = "Loading...",
  errorText = "Something went wrong",
  warningText = "Warning",
  onRetry = null,
  variant = "circular", // "circular", "linear", "skeleton", "card"
  size = "medium", // "small", "medium", "large"
  fullHeight = false,
  children = null
}) => {
  
  // Error state
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: fullHeight ? '50vh' : 'auto',
          minHeight: fullHeight ? 'auto' : '200px',
          p: 3,
          textAlign: 'center'
        }}
      >
        <ErrorIcon 
          color="error" 
          sx={{ 
            fontSize: size === 'large' ? 64 : size === 'small' ? 32 : 48,
            mb: 2 
          }} 
        />
        <Typography variant="h6" color="error" gutterBottom>
          {errorText}
        </Typography>
        {error.message && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {error.message}
          </Typography>
        )}
        {onRetry && (
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            sx={{ mt: 1 }}
          >
            Try Again
          </Button>
        )}
      </Box>
    );
  }

  // Warning state (still shows content but with warning)
  if (warning && !loading) {
    return (
      <Box>
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ mb: 2 }}
          action={
            onRetry && (
              <Button size="small" onClick={onRetry}>
                Retry
              </Button>
            )
          }
        >
          {warningText}: {warning.message || warning}
        </Alert>
        {children}
      </Box>
    );
  }

  // Loading states
  if (loading) {
    switch (variant) {
      case 'linear':
        return (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mt: 1, textAlign: 'center' }}
            >
              {loadingText}
            </Typography>
          </Box>
        );

      case 'skeleton':
        return (
          <Box sx={{ p: 2 }}>
            <Skeleton variant="text" height={40} />
            <Skeleton variant="rectangular" height={200} sx={{ mt: 1 }} />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Skeleton variant="rectangular" width={100} height={32} />
              <Skeleton variant="rectangular" width={100} height={32} />
              <Skeleton variant="rectangular" width={100} height={32} />
            </Box>
          </Box>
        );

      case 'card':
        return (
          <Card>
            <CardContent>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  py: 3
                }}
              >
                <CircularProgress 
                  size={size === 'large' ? 60 : size === 'small' ? 30 : 40}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body1" color="text.secondary">
                  {loadingText}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        );

      default: // circular
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: fullHeight ? '50vh' : 'auto',
              minHeight: fullHeight ? 'auto' : '200px',
              p: 3
            }}
          >
            <CircularProgress 
              size={size === 'large' ? 60 : size === 'small' ? 30 : 40}
              sx={{ mb: 2 }}
            />
            <Typography variant="body1" color="text.secondary">
              {loadingText}
            </Typography>
          </Box>
        );
    }
  }

  // Default: show children
  return children || null;
};

// Hook for consistent loading states across components
export const useUnifiedLoading = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [warning, setWarning] = React.useState(null);

  const startLoading = (text = "Loading...") => {
    setLoading(true);
    setError(null);
    setWarning(null);
  };

  const stopLoading = () => {
    setLoading(false);
  };

  const setLoadingError = (error, text = "Something went wrong") => {
    setLoading(false);
    setError({ message: error.message || error, original: error });
  };

  const setLoadingWarning = (warning, text = "Warning") => {
    setWarning({ message: warning.message || warning, original: warning });
  };

  const clearAll = () => {
    setLoading(false);
    setError(null);
    setWarning(null);
  };

  const retry = (retryFn) => {
    clearAll();
    if (retryFn) retryFn();
  };

  return {
    loading,
    error,
    warning,
    startLoading,
    stopLoading,
    setError: setLoadingError,
    setWarning: setLoadingWarning,
    clearAll,
    retry,
    
    // Pre-configured components
    LoadingComponent: (props) => (
      <UnifiedLoadingState 
        loading={loading}
        error={error}
        warning={warning}
        onRetry={() => retry(props.onRetry)}
        {...props}
      />
    )
  };
};

// Pre-configured loading states for common scenarios
export const DataTableLoading = () => (
  <UnifiedLoadingState
    loading={true}
    variant="skeleton"
    loadingText="Loading data..."
  />
);

export const PageLoading = () => (
  <UnifiedLoadingState
    loading={true}
    variant="circular"
    size="large"
    fullHeight={true}
    loadingText="Loading page..."
  />
);

export const CardLoading = () => (
  <UnifiedLoadingState
    loading={true}
    variant="card"
    loadingText="Loading content..."
  />
);

export const InlineLoading = () => (
  <UnifiedLoadingState
    loading={true}
    variant="linear"
    loadingText="Processing..."
  />
);

export default UnifiedLoadingState;