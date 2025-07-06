import React from 'react';
import PropTypes from 'prop-types';
import { 
  Checkbox as MuiCheckbox, 
  FormControlLabel, 
  FormGroup,
  FormControl,
  FormLabel,
  FormHelperText
} from '@mui/material';

/**
 * Checkbox - Reusable checkbox component with consistent styling
 * 
 * Features:
 * - Single checkbox or checkbox group
 * - Label positioning options
 * - Indeterminate state
 * - Custom icons
 * - Error handling
 * - Helper text
 * 
 * @example
 * // Single checkbox
 * <Checkbox
 *   label="I agree to the terms"
 *   checked={agreed}
 *   onChange={setAgreed}
 *   required
 * />
 * 
 * @example
 * // Checkbox group
 * <Checkbox
 *   label="Select Features"
 *   options={[
 *     { value: 'feature1', label: 'Feature 1' },
 *     { value: 'feature2', label: 'Feature 2', disabled: true },
 *     { value: 'feature3', label: 'Feature 3' }
 *   ]}
 *   value={selectedFeatures}
 *   onChange={setSelectedFeatures}
 *   row
 * />
 * 
 * @example
 * // With custom styling and indeterminate
 * <Checkbox
 *   label="Select All"
 *   checked={selectedAll}
 *   indeterminate={selectedSome}
 *   onChange={handleSelectAll}
 *   color="primary"
 *   size="small"
 * />
 */
export const Checkbox = React.memo(({
  label,
  checked = false,
  onChange,
  options,
  value = [],
  indeterminate = false,
  disabled = false,
  required = false,
  error = false,
  helperText = '',
  color = 'primary',
  size = 'medium',
  labelPlacement = 'end',
  row = false,
  className,
  sx,
  ...otherProps
}) => {
  // Single checkbox mode
  if (!options) {
    const handleChange = (event) => {
      if (onChange) {
        onChange(event.target.checked);
      }
    };

    const checkbox = (
      <MuiCheckbox
        checked={checked}
        onChange={handleChange}
        indeterminate={indeterminate}
        disabled={disabled}
        required={required}
        color={color}
        size={size}
        {...otherProps}
      />
    );

    if (!label) {
      return checkbox;
    }

    return (
      <FormControl error={error} className={className}>
        <FormControlLabel
          control={checkbox}
          label={label}
          labelPlacement={labelPlacement}
          disabled={disabled}
          sx={sx}
        />
        {helperText && (
          <FormHelperText>{helperText}</FormHelperText>
        )}
      </FormControl>
    );
  }

  // Checkbox group mode
  const handleGroupChange = (optionValue) => (event) => {
    if (!onChange) return;

    const newValue = event.target.checked
      ? [...value, optionValue]
      : value.filter(v => v !== optionValue);
    
    onChange(newValue);
  };

  return (
    <FormControl 
      component="fieldset" 
      error={error} 
      disabled={disabled}
      required={required}
      className={className}
    >
      {label && <FormLabel component="legend">{label}</FormLabel>}
      <FormGroup row={row} sx={sx}>
        {options.map((option) => {
          const optionValue = typeof option === 'object' ? option.value : option;
          const optionLabel = typeof option === 'object' ? option.label : option;
          const optionDisabled = typeof option === 'object' ? option.disabled : false;
          
          return (
            <FormControlLabel
              key={optionValue}
              control={
                <MuiCheckbox
                  checked={value.includes(optionValue)}
                  onChange={handleGroupChange(optionValue)}
                  color={color}
                  size={size}
                  disabled={optionDisabled}
                />
              }
              label={optionLabel}
              labelPlacement={labelPlacement}
            />
          );
        })}
      </FormGroup>
      {helperText && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
});

Checkbox.displayName = 'Checkbox';

Checkbox.propTypes = {
  /** Label text */
  label: PropTypes.string,
  /** Checked state (single checkbox) */
  checked: PropTypes.bool,
  /** Change handler - receives boolean (single) or array (group) */
  onChange: PropTypes.func,
  /** Options for checkbox group */
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.any.isRequired,
        label: PropTypes.string.isRequired,
        disabled: PropTypes.bool
      })
    ])
  ),
  /** Selected values (checkbox group) */
  value: PropTypes.array,
  /** Indeterminate state */
  indeterminate: PropTypes.bool,
  /** Disabled state */
  disabled: PropTypes.bool,
  /** Required field */
  required: PropTypes.bool,
  /** Error state */
  error: PropTypes.bool,
  /** Helper text */
  helperText: PropTypes.string,
  /** Checkbox color */
  color: PropTypes.oneOf(['primary', 'secondary', 'default']),
  /** Checkbox size */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Label placement */
  labelPlacement: PropTypes.oneOf(['end', 'start', 'top', 'bottom']),
  /** Display checkboxes in row (group mode) */
  row: PropTypes.bool,
  /** Additional CSS class */
  className: PropTypes.string,
  /** MUI sx prop */
  sx: PropTypes.object
};