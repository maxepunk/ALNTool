import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { TextField, InputAdornment } from '@mui/material';
import { useDebounce } from '../../hooks/patterns/useDebounce';

/**
 * TextInput - Reusable text input component with consistent styling and behavior
 * 
 * Features:
 * - Controlled and uncontrolled modes
 * - Built-in debouncing option
 * - Error state handling
 * - Helper text support
 * - Icon support (start/end)
 * - Character count
 * - Clear button option
 * 
 * @example
 * // Basic usage
 * <TextInput
 *   label="Username"
 *   value={username}
 *   onChange={(value) => setUsername(value)}
 * />
 * 
 * @example
 * // With validation and helper text
 * <TextInput
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={setEmail}
 *   error={!isValidEmail(email)}
 *   helperText={!isValidEmail(email) ? "Invalid email format" : ""}
 *   required
 * />
 * 
 * @example
 * // With debouncing for search
 * <TextInput
 *   label="Search"
 *   placeholder="Search entities..."
 *   onChange={handleSearch}
 *   debounceMs={300}
 *   startIcon={<SearchIcon />}
 *   clearable
 * />
 * 
 * @example
 * // With character limit
 * <TextInput
 *   label="Description"
 *   multiline
 *   rows={4}
 *   value={description}
 *   onChange={setDescription}
 *   maxLength={500}
 *   showCharCount
 * />
 */
export const TextInput = forwardRef(({
  label,
  value = '',
  onChange,
  onBlur,
  onFocus,
  placeholder,
  type = 'text',
  error = false,
  helperText = '',
  disabled = false,
  required = false,
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
  multiline = false,
  rows = 1,
  maxRows,
  maxLength,
  showCharCount = false,
  debounceMs = 0,
  startIcon,
  endIcon,
  clearable = false,
  autoFocus = false,
  autoComplete,
  className,
  sx,
  ...otherProps
}, ref) => {
  const [internalValue, setInternalValue] = React.useState(value);
  const debouncedValue = useDebounce(internalValue, debounceMs);

  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  React.useEffect(() => {
    if (debounceMs > 0 && debouncedValue !== value && onChange) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, debounceMs, onChange, value]);

  const handleChange = (event) => {
    const newValue = event.target.value;
    
    if (maxLength && newValue.length > maxLength) {
      return;
    }

    setInternalValue(newValue);
    
    if (debounceMs === 0 && onChange) {
      onChange(newValue);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    if (onChange) {
      onChange('');
    }
  };

  const getHelperText = () => {
    if (showCharCount && maxLength) {
      const charCount = `${internalValue.length}/${maxLength}`;
      return helperText ? `${helperText} (${charCount})` : charCount;
    }
    return helperText;
  };

  const getEndAdornment = () => {
    const adornments = [];
    
    if (clearable && internalValue) {
      adornments.push(
        <InputAdornment key="clear" position="end">
          <IconButton
            size="small"
            onClick={handleClear}
            disabled={disabled}
            edge="end"
          >
            <ClearIcon />
          </IconButton>
        </InputAdornment>
      );
    }
    
    if (endIcon) {
      adornments.push(
        <InputAdornment key="end-icon" position="end">
          {endIcon}
        </InputAdornment>
      );
    }
    
    return adornments.length > 0 ? adornments : null;
  };

  return (
    <TextField
      ref={ref}
      label={label}
      value={internalValue}
      onChange={handleChange}
      onBlur={onBlur}
      onFocus={onFocus}
      placeholder={placeholder}
      type={type}
      error={error}
      helperText={getHelperText()}
      disabled={disabled}
      required={required}
      fullWidth={fullWidth}
      size={size}
      variant={variant}
      multiline={multiline}
      rows={rows}
      maxRows={maxRows}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      className={className}
      sx={sx}
      InputProps={{
        startAdornment: startIcon && (
          <InputAdornment position="start">{startIcon}</InputAdornment>
        ),
        endAdornment: getEndAdornment(),
        ...otherProps.InputProps
      }}
      {...otherProps}
    />
  );
});

TextInput.displayName = 'TextInput';

TextInput.propTypes = {
  /** Field label */
  label: PropTypes.string,
  /** Current value */
  value: PropTypes.string,
  /** Change handler - receives new value */
  onChange: PropTypes.func,
  /** Blur event handler */
  onBlur: PropTypes.func,
  /** Focus event handler */
  onFocus: PropTypes.func,
  /** Placeholder text */
  placeholder: PropTypes.string,
  /** Input type */
  type: PropTypes.oneOf(['text', 'email', 'password', 'search', 'tel', 'url', 'number']),
  /** Error state */
  error: PropTypes.bool,
  /** Helper text (shown below input) */
  helperText: PropTypes.string,
  /** Disabled state */
  disabled: PropTypes.bool,
  /** Required field */
  required: PropTypes.bool,
  /** Take full width of container */
  fullWidth: PropTypes.bool,
  /** Input size */
  size: PropTypes.oneOf(['small', 'medium']),
  /** TextField variant */
  variant: PropTypes.oneOf(['outlined', 'filled', 'standard']),
  /** Enable multiline mode */
  multiline: PropTypes.bool,
  /** Number of rows for multiline */
  rows: PropTypes.number,
  /** Maximum rows for multiline */
  maxRows: PropTypes.number,
  /** Maximum character length */
  maxLength: PropTypes.number,
  /** Show character count */
  showCharCount: PropTypes.bool,
  /** Debounce delay in milliseconds */
  debounceMs: PropTypes.number,
  /** Icon to show at start */
  startIcon: PropTypes.node,
  /** Icon to show at end */
  endIcon: PropTypes.node,
  /** Show clear button when has value */
  clearable: PropTypes.bool,
  /** Auto focus on mount */
  autoFocus: PropTypes.bool,
  /** HTML autocomplete attribute */
  autoComplete: PropTypes.string,
  /** Additional CSS class */
  className: PropTypes.string,
  /** MUI sx prop for styling */
  sx: PropTypes.object
};

// Missing imports that would be needed
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';