/**
 * ActionButton - Consistent button styling with loading and confirmation states
 * 
 * @component
 * @example
 * // Simple button
 * <ActionButton onClick={handleSave}>
 *   Save Changes
 * </ActionButton>
 * 
 * @example
 * // With icon and loading
 * <ActionButton
 *   variant="contained"
 *   color="primary"
 *   startIcon={<Save />}
 *   loading={isSaving}
 *   onClick={handleSave}
 * >
 *   Save Changes
 * </ActionButton>
 * 
 * @example
 * // With confirmation
 * <ActionButton
 *   color="error"
 *   confirm={{
 *     title: 'Delete Item?',
 *     message: 'This action cannot be undone.',
 *     confirmText: 'Delete',
 *     confirmColor: 'error'
 *   }}
 *   onClick={handleDelete}
 * >
 *   Delete
 * </ActionButton>
 */

import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Box
} from '@mui/material';
import PropTypes from 'prop-types';

const ActionButton = ({
  children,
  onClick,
  loading = false,
  disabled = false,
  variant = 'text',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  startIcon,
  endIcon,
  confirm,
  tooltip,
  loadingText,
  sx = {},
  ...otherProps
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async (event) => {
    if (confirm) {
      setConfirmOpen(true);
    } else {
      await executeAction(event);
    }
  };

  const executeAction = async (event) => {
    if (onClick) {
      setIsProcessing(true);
      try {
        await onClick(event);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    await executeAction();
  };

  const handleCancel = () => {
    setConfirmOpen(false);
  };

  const isLoading = loading || isProcessing;
  const isDisabled = disabled || isLoading;

  const buttonContent = (
    <>
      {startIcon && !isLoading && startIcon}
      {isLoading && (
        <CircularProgress
          size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
          color="inherit"
          sx={{ mr: 1 }}
        />
      )}
      {isLoading && loadingText ? loadingText : children}
      {endIcon && !isLoading && endIcon}
    </>
  );

  const button = (
    <Button
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      disabled={isDisabled}
      onClick={handleClick}
      sx={{
        position: 'relative',
        ...sx
      }}
      {...otherProps}
    >
      {buttonContent}
    </Button>
  );

  return (
    <>
      {tooltip && !isDisabled ? (
        <Tooltip title={tooltip}>
          <Box component="span" sx={{ display: fullWidth ? 'block' : 'inline-block', width: fullWidth ? '100%' : 'auto' }}>
            {button}
          </Box>
        </Tooltip>
      ) : (
        button
      )}

      {confirm && (
        <Dialog
          open={confirmOpen}
          onClose={handleCancel}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>{confirm.title || 'Confirm Action'}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {confirm.message || 'Are you sure you want to proceed?'}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel} color="inherit">
              {confirm.cancelText || 'Cancel'}
            </Button>
            <Button
              onClick={handleConfirm}
              color={confirm.confirmColor || color}
              variant={confirm.confirmVariant || 'contained'}
              autoFocus
            >
              {confirm.confirmText || 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

ActionButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  color: PropTypes.oneOf(['inherit', 'primary', 'secondary', 'success', 'error', 'info', 'warning']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  startIcon: PropTypes.element,
  endIcon: PropTypes.element,
  confirm: PropTypes.shape({
    title: PropTypes.string,
    message: PropTypes.string,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    confirmColor: PropTypes.string,
    confirmVariant: PropTypes.string
  }),
  tooltip: PropTypes.string,
  loadingText: PropTypes.string,
  sx: PropTypes.object
};

export default React.memo(ActionButton);