import React from 'react';
import PropTypes from 'prop-types';
import { Snackbar, Alert, Slide } from '@mui/material';

/**
 * Toast - Temporary notification component
 * 
 * Features:
 * - Auto-dismiss with configurable duration
 * - Multiple severity levels
 * - Positioning options
 * - Action buttons
 * - Queue management (via external state)
 * - Smooth transitions
 * 
 * @example
 * // Basic toast
 * const [toast, setToast] = useState({ open: false });
 * 
 * <Toast 
 *   open={toast.open}
 *   message="File uploaded successfully"
 *   severity="success"
 *   onClose={() => setToast({ open: false })}
 * />
 * 
 * @example
 * // Toast with action
 * <Toast 
 *   open={showToast}
 *   message="Item deleted"
 *   severity="info"
 *   action={<Button size="small">UNDO</Button>}
 *   onClose={handleClose}
 *   duration={10000}
 * />
 * 
 * @example
 * // Custom positioned toast
 * <Toast 
 *   open={true}
 *   message="New message received"
 *   severity="info"
 *   position={{ vertical: 'top', horizontal: 'right' }}
 *   onClose={handleClose}
 * />
 * 
 * @example
 * // Toast hook usage (create your own)
 * const { showToast } = useToast();
 * 
 * showToast({
 *   message: 'Operation completed',
 *   severity: 'success',
 *   duration: 3000
 * });
 */
export const Toast = React.memo(({
  open = false,
  message,
  severity = 'info',
  variant = 'filled',
  position = { vertical: 'bottom', horizontal: 'left' },
  duration = 6000,
  action,
  onClose,
  TransitionComponent = Slide,
  transitionDirection = 'up',
  disableWindowBlur = true,
  className,
  sx,
  ...otherProps
}) => {
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    if (onClose) {
      onClose(event, reason);
    }
  };

  const transitionProps = {
    direction: transitionDirection
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={position}
      TransitionComponent={TransitionComponent}
      TransitionProps={transitionProps}
      disableWindowBlurListener={disableWindowBlur}
      className={className}
      sx={sx}
      {...otherProps}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant={variant}
        action={action}
        sx={{ 
          width: '100%',
          minWidth: '250px',
          maxWidth: '500px'
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
});

Toast.displayName = 'Toast';

// Toast Context for global toast management
export const ToastContext = React.createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);

  const showToast = React.useCallback((toast) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...toast, id, open: true }]);
    
    // Auto remove after duration
    if (toast.duration !== null) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration || 6000);
    }
  }, []);

  const hideToast = React.useCallback((id) => {
    setToasts(prev => 
      prev.map(t => t.id === id ? { ...t, open: false } : t)
    );
    // Remove from DOM after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          {...toast}
          position={{
            ...toast.position,
            vertical: toast.position?.vertical || 'bottom',
            horizontal: toast.position?.horizontal || 'left'
          }}
          onClose={() => hideToast(toast.id)}
          style={{
            marginBottom: index * 60 // Stack multiple toasts
          }}
        />
      ))}
    </ToastContext.Provider>
  );
};

// Hook for using toast
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

Toast.propTypes = {
  /** Open state */
  open: PropTypes.bool,
  /** Message to display */
  message: PropTypes.node.isRequired,
  /** Toast severity */
  severity: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  /** Alert variant */
  variant: PropTypes.oneOf(['standard', 'filled', 'outlined']),
  /** Toast position */
  position: PropTypes.shape({
    vertical: PropTypes.oneOf(['top', 'bottom']),
    horizontal: PropTypes.oneOf(['left', 'center', 'right'])
  }),
  /** Auto-hide duration in milliseconds (null to disable) */
  duration: PropTypes.number,
  /** Action element */
  action: PropTypes.node,
  /** Close handler */
  onClose: PropTypes.func,
  /** Transition component */
  TransitionComponent: PropTypes.elementType,
  /** Transition direction */
  transitionDirection: PropTypes.oneOf(['up', 'down', 'left', 'right']),
  /** Disable window blur listener */
  disableWindowBlur: PropTypes.bool,
  /** Additional CSS class */
  className: PropTypes.string,
  /** MUI sx prop */
  sx: PropTypes.object
};