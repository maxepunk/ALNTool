import React from 'react';
import PropTypes from 'prop-types';
import { 
  Alert as MuiAlert, 
  AlertTitle,
  Collapse,
  IconButton,
  Button,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Alert - Feedback component for displaying messages
 * 
 * Features:
 * - Multiple severity levels
 * - Optional title
 * - Dismissible alerts
 * - Action buttons
 * - Auto-hide timeout
 * - Custom icons
 * 
 * @example
 * // Basic alert
 * <Alert severity="success">
 *   Your changes have been saved!
 * </Alert>
 * 
 * @example
 * // Alert with title and action
 * <Alert 
 *   severity="warning"
 *   title="Warning"
 *   action={<Button size="small">UNDO</Button>}
 * >
 *   This action cannot be reversed after 24 hours.
 * </Alert>
 * 
 * @example
 * // Dismissible alert with auto-hide
 * <Alert 
 *   severity="info"
 *   dismissible
 *   autoHideDuration={5000}
 *   onClose={() => console.log('Alert closed')}
 * >
 *   New update available. Refresh to see changes.
 * </Alert>
 * 
 * @example
 * // Error alert with details
 * <Alert 
 *   severity="error"
 *   title="Error submitting form"
 *   dismissible
 * >
 *   <ul>
 *     <li>Email is required</li>
 *     <li>Password must be at least 8 characters</li>
 *   </ul>
 * </Alert>
 */
export const Alert = React.memo(({
  severity = 'info',
  variant = 'standard',
  title,
  children,
  icon,
  action,
  dismissible = false,
  onClose,
  autoHideDuration,
  color,
  className,
  sx,
  ...otherProps
}) => {
  const [open, setOpen] = React.useState(true);
  const timeoutRef = React.useRef();

  React.useEffect(() => {
    if (autoHideDuration && open) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, autoHideDuration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoHideDuration, open]);

  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const getAction = () => {
    const actions = [];

    if (action) {
      actions.push(React.cloneElement(action, { key: 'action' }));
    }

    if (dismissible) {
      actions.push(
        <IconButton
          key="close"
          size="small"
          aria-label="close"
          color="inherit"
          onClick={handleClose}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      );
    }

    return actions.length > 0 ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {actions}
      </Box>
    ) : null;
  };

  return (
    <Collapse in={open}>
      <MuiAlert
        severity={severity}
        variant={variant}
        icon={icon}
        action={getAction()}
        color={color}
        className={className}
        sx={sx}
        {...otherProps}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {children}
      </MuiAlert>
    </Collapse>
  );
});

Alert.displayName = 'Alert';

// Convenience components for common severities
export const SuccessAlert = React.memo((props) => (
  <Alert severity="success" {...props} />
));
SuccessAlert.displayName = 'SuccessAlert';

export const ErrorAlert = React.memo((props) => (
  <Alert severity="error" {...props} />
));
ErrorAlert.displayName = 'ErrorAlert';

export const WarningAlert = React.memo((props) => (
  <Alert severity="warning" {...props} />
));
WarningAlert.displayName = 'WarningAlert';

export const InfoAlert = React.memo((props) => (
  <Alert severity="info" {...props} />
));
InfoAlert.displayName = 'InfoAlert';

Alert.propTypes = {
  /** Alert severity */
  severity: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  /** Alert variant */
  variant: PropTypes.oneOf(['standard', 'filled', 'outlined']),
  /** Alert title */
  title: PropTypes.node,
  /** Alert content */
  children: PropTypes.node,
  /** Custom icon */
  icon: PropTypes.node,
  /** Action element */
  action: PropTypes.node,
  /** Show close button */
  dismissible: PropTypes.bool,
  /** Close handler */
  onClose: PropTypes.func,
  /** Auto-hide duration in milliseconds */
  autoHideDuration: PropTypes.number,
  /** Custom color */
  color: PropTypes.string,
  /** Additional CSS class */
  className: PropTypes.string,
  /** MUI sx prop */
  sx: PropTypes.object
};

SuccessAlert.propTypes = Alert.propTypes;
ErrorAlert.propTypes = Alert.propTypes;
WarningAlert.propTypes = Alert.propTypes;
InfoAlert.propTypes = Alert.propTypes;