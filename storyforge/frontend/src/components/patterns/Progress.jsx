import React from 'react';
import PropTypes from 'prop-types';
import { 
  LinearProgress, 
  CircularProgress, 
  Box, 
  Typography 
} from '@mui/material';

/**
 * Progress - Visual progress indicator component
 * 
 * Features:
 * - Linear and circular variants
 * - Determinate and indeterminate modes
 * - Progress labels
 * - Buffer mode for linear
 * - Custom colors and sizes
 * - Animated transitions
 * 
 * @example
 * // Basic linear progress
 * <Progress value={60} />
 * 
 * @example
 * // Circular progress with label
 * <Progress 
 *   variant="circular"
 *   value={75}
 *   showLabel
 *   size={80}
 * />
 * 
 * @example
 * // Indeterminate loading
 * <Progress variant="linear" />
 * 
 * @example
 * // Linear with buffer
 * <Progress 
 *   variant="linear"
 *   value={50}
 *   buffer={70}
 *   showLabel
 * />
 * 
 * @example
 * // Custom colored progress
 * <Progress 
 *   value={progress}
 *   color="success"
 *   showLabel
 *   labelFormat={(value) => `${value}% Complete`}
 * />
 */
export const Progress = React.memo(({
  variant = 'linear',
  value = 0,
  buffer,
  color = 'primary',
  size = 40,
  thickness = 3.6,
  showLabel = false,
  labelFormat,
  labelPlacement = 'center',
  height = 4,
  className,
  sx,
  ...otherProps
}) => {
  const formatLabel = (val) => {
    if (labelFormat) {
      return labelFormat(val);
    }
    return `${Math.round(val)}%`;
  };

  // Circular progress
  if (variant === 'circular') {
    const circularProgress = (
      <CircularProgress
        variant={value !== undefined ? 'determinate' : 'indeterminate'}
        value={value}
        color={color}
        size={size}
        thickness={thickness}
        className={className}
        sx={sx}
        {...otherProps}
      />
    );

    if (!showLabel) {
      return circularProgress;
    }

    return (
      <Box 
        sx={{ 
          position: 'relative', 
          display: 'inline-flex',
          ...sx
        }}
        className={className}
      >
        {circularProgress}
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography 
            variant="caption" 
            component="div" 
            color="text.secondary"
            sx={{ fontSize: size / 5 }}
          >
            {formatLabel(value)}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Linear progress
  const linearProgress = (
    <LinearProgress
      variant={buffer !== undefined ? 'buffer' : 
               value !== undefined ? 'determinate' : 'indeterminate'}
      value={value}
      valueBuffer={buffer}
      color={color}
      className={className}
      sx={{
        height,
        borderRadius: height / 2,
        ...sx
      }}
      {...otherProps}
    />
  );

  if (!showLabel) {
    return linearProgress;
  }

  // Linear with label
  return (
    <Box sx={{ width: '100%' }}>
      {labelPlacement === 'top' && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatLabel(value)}
          </Typography>
        </Box>
      )}
      
      <Box sx={{ position: 'relative' }}>
        {linearProgress}
        {labelPlacement === 'center' && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'white',
                fontWeight: 500,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              {formatLabel(value)}
            </Typography>
          </Box>
        )}
      </Box>
      
      {labelPlacement === 'bottom' && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            0%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatLabel(value)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            100%
          </Typography>
        </Box>
      )}
    </Box>
  );
});

Progress.displayName = 'Progress';

// Convenience components
export const LoadingProgress = React.memo((props) => (
  <Progress {...props} />
));
LoadingProgress.displayName = 'LoadingProgress';

export const CircularLoader = React.memo(({ size = 40, ...props }) => (
  <Progress variant="circular" size={size} {...props} />
));
CircularLoader.displayName = 'CircularLoader';

export const LinearLoader = React.memo((props) => (
  <Progress variant="linear" {...props} />
));
LinearLoader.displayName = 'LinearLoader';

Progress.propTypes = {
  /** Progress variant */
  variant: PropTypes.oneOf(['linear', 'circular']),
  /** Progress value (0-100) */
  value: PropTypes.number,
  /** Buffer value for linear variant */
  buffer: PropTypes.number,
  /** Progress color */
  color: PropTypes.oneOf([
    'primary', 'secondary', 'error', 'info', 'success', 'warning', 'inherit'
  ]),
  /** Size for circular variant */
  size: PropTypes.number,
  /** Thickness for circular variant */
  thickness: PropTypes.number,
  /** Show percentage label */
  showLabel: PropTypes.bool,
  /** Custom label format function */
  labelFormat: PropTypes.func,
  /** Label placement for linear variant */
  labelPlacement: PropTypes.oneOf(['top', 'center', 'bottom']),
  /** Height for linear variant */
  height: PropTypes.number,
  /** Additional CSS class */
  className: PropTypes.string,
  /** MUI sx prop */
  sx: PropTypes.object
};

LoadingProgress.propTypes = Progress.propTypes;
CircularLoader.propTypes = Progress.propTypes;
LinearLoader.propTypes = Progress.propTypes;