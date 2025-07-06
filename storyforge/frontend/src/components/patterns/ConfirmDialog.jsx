/**
 * ConfirmDialog - Reusable confirmation dialog component
 * 
 * @component
 * @example
 * // Basic usage
 * const [open, setOpen] = useState(false);
 * 
 * <ConfirmDialog
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Item?"
 *   message="This action cannot be undone."
 * />
 * 
 * @example
 * // With custom styling and loading
 * <ConfirmDialog
 *   open={deleteDialogOpen}
 *   onClose={handleClose}
 *   onConfirm={handleDelete}
 *   title="Delete Character"
 *   message="Are you sure you want to delete this character? All associated data will be lost."
 *   confirmText="Delete"
 *   confirmColor="error"
 *   loading={isDeleting}
 *   maxWidth="sm"
 * />
 * 
 * @example
 * // With custom content
 * <ConfirmDialog
 *   open={open}
 *   onClose={handleClose}
 *   onConfirm={handleConfirm}
 *   title="Export Data"
 * >
 *   <Typography>Select export format:</Typography>
 *   <RadioGroup value={format} onChange={setFormat}>
 *     <FormControlLabel value="csv" control={<Radio />} label="CSV" />
 *     <FormControlLabel value="json" control={<Radio />} label="JSON" />
 *   </RadioGroup>
 * </ConfirmDialog>
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  IconButton,
  Typography,
  Alert
} from '@mui/material';
import { Close } from '@mui/icons-material';
import PropTypes from 'prop-types';

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  confirmVariant = 'contained',
  cancelColor = 'inherit',
  cancelVariant = 'text',
  loading = false,
  error = null,
  maxWidth = 'xs',
  fullWidth = true,
  showCloseButton = true,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  hideCancel = false,
  autoFocus = true,
  sx = {}
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleClose = (event, reason) => {
    if (loading || isProcessing) return;
    
    if (reason === 'backdropClick' && disableBackdropClick) return;
    if (reason === 'escapeKeyDown' && disableEscapeKeyDown) return;
    
    if (onClose) {
      onClose(event, reason);
    }
    setLocalError(null);
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsProcessing(true);
      setLocalError(null);
      try {
        await onConfirm();
        // Only close if onConfirm doesn't throw
        handleClose();
      } catch (err) {
        setLocalError(err.message || 'An error occurred');
        setIsProcessing(false);
      }
    }
  };

  const isLoading = loading || isProcessing;
  const displayError = error || localError;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      sx={sx}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          {showCloseButton && !isLoading && (
            <IconButton
              aria-label="close"
              onClick={handleClose}
              size="small"
              sx={{ ml: 2 }}
            >
              <Close />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {displayError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocalError(null)}>
            {displayError}
          </Alert>
        )}
        
        {message && !children && (
          <DialogContentText id="confirm-dialog-description">
            {message}
          </DialogContentText>
        )}
        
        {children}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!hideCancel && (
          <Button
            onClick={handleClose}
            color={cancelColor}
            variant={cancelVariant}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
        )}
        
        <Button
          onClick={handleConfirm}
          color={confirmColor}
          variant={confirmVariant}
          disabled={isLoading}
          autoFocus={autoFocus}
          startIcon={isLoading && <CircularProgress size={20} color="inherit" />}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  children: PropTypes.node,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmColor: PropTypes.oneOf(['inherit', 'primary', 'secondary', 'success', 'error', 'info', 'warning']),
  confirmVariant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  cancelColor: PropTypes.oneOf(['inherit', 'primary', 'secondary', 'success', 'error', 'info', 'warning']),
  cancelVariant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  loading: PropTypes.bool,
  error: PropTypes.string,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  fullWidth: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  disableBackdropClick: PropTypes.bool,
  disableEscapeKeyDown: PropTypes.bool,
  hideCancel: PropTypes.bool,
  autoFocus: PropTypes.bool,
  sx: PropTypes.object
};

export default React.memo(ConfirmDialog);