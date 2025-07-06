import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Tooltip, IconButton } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

/**
 * FormField - Wrapper component for form fields with consistent layout
 * 
 * Features:
 * - Consistent label and spacing
 * - Required field indicator
 * - Help tooltip
 * - Error message display
 * - Description text
 * - Responsive layout
 * 
 * @example
 * // Basic usage
 * <FormField label="Email Address" required>
 *   <TextInput 
 *     value={email} 
 *     onChange={setEmail}
 *     type="email"
 *   />
 * </FormField>
 * 
 * @example
 * // With help and description
 * <FormField 
 *   label="API Key"
 *   description="You can find your API key in settings"
 *   helpText="Your API key is used to authenticate requests"
 *   required
 * >
 *   <TextInput 
 *     value={apiKey} 
 *     onChange={setApiKey}
 *     type="password"
 *   />
 * </FormField>
 * 
 * @example
 * // With error
 * <FormField 
 *   label="Username"
 *   error={errors.username}
 *   required
 * >
 *   <TextInput 
 *     value={username} 
 *     onChange={setUsername}
 *     error={!!errors.username}
 *   />
 * </FormField>
 */
export const FormField = React.memo(({
  label,
  children,
  required = false,
  error = '',
  description = '',
  helpText = '',
  labelPosition = 'top',
  spacing = 1,
  fullWidth = true,
  className,
  sx,
  ...otherProps
}) => {
  const getLabelElement = () => {
    if (!label) return null;

    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: labelPosition === 'top' ? spacing : 0,
          marginRight: labelPosition === 'left' ? 2 : 0
        }}
      >
        <Typography
          component="label"
          variant="body2"
          sx={{
            fontWeight: 500,
            color: error ? 'error.main' : 'text.primary'
          }}
        >
          {label}
          {required && (
            <Typography
              component="span"
              sx={{ 
                color: 'error.main', 
                marginLeft: 0.5 
              }}
            >
              *
            </Typography>
          )}
        </Typography>
        {helpText && (
          <Tooltip title={helpText} arrow placement="top">
            <IconButton 
              size="small" 
              sx={{ 
                marginLeft: 0.5,
                padding: 0.5
              }}
            >
              <HelpOutlineIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  const containerProps = labelPosition === 'left' ? {
    display: 'flex',
    alignItems: 'flex-start'
  } : {};

  return (
    <Box
      className={className}
      sx={{
        width: fullWidth ? '100%' : 'auto',
        marginBottom: 2,
        ...containerProps,
        ...sx
      }}
      {...otherProps}
    >
      {getLabelElement()}
      <Box sx={{ flex: labelPosition === 'left' ? 1 : undefined }}>
        {description && !error && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ 
              display: 'block',
              marginBottom: spacing
            }}
          >
            {description}
          </Typography>
        )}
        {children}
        {error && (
          <Typography
            variant="caption"
            color="error"
            sx={{ 
              display: 'block',
              marginTop: 0.5
            }}
          >
            {error}
          </Typography>
        )}
      </Box>
    </Box>
  );
});

FormField.displayName = 'FormField';

FormField.propTypes = {
  /** Field label */
  label: PropTypes.string,
  /** Form field component(s) */
  children: PropTypes.node.isRequired,
  /** Required field indicator */
  required: PropTypes.bool,
  /** Error message */
  error: PropTypes.string,
  /** Description text (shown above field) */
  description: PropTypes.string,
  /** Help tooltip text */
  helpText: PropTypes.string,
  /** Label position */
  labelPosition: PropTypes.oneOf(['top', 'left']),
  /** Spacing between elements */
  spacing: PropTypes.number,
  /** Take full width */
  fullWidth: PropTypes.bool,
  /** Additional CSS class */
  className: PropTypes.string,
  /** MUI sx prop */
  sx: PropTypes.object
};