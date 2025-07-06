import React from 'react';
import PropTypes from 'prop-types';
import { 
  Radio,
  RadioGroup as MuiRadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText
} from '@mui/material';

/**
 * RadioGroup - Reusable radio button group component
 * 
 * Features:
 * - Vertical or horizontal layout
 * - Custom option rendering
 * - Error handling
 * - Helper text
 * - Disabled options
 * 
 * @example
 * // Basic usage
 * <RadioGroup
 *   label="Select Plan"
 *   value={plan}
 *   onChange={setPlan}
 *   options={[
 *     { value: 'basic', label: 'Basic Plan' },
 *     { value: 'pro', label: 'Pro Plan' },
 *     { value: 'enterprise', label: 'Enterprise Plan' }
 *   ]}
 * />
 * 
 * @example
 * // Horizontal layout with descriptions
 * <RadioGroup
 *   label="Choose Theme"
 *   value={theme}
 *   onChange={setTheme}
 *   row
 *   options={[
 *     { value: 'light', label: 'Light', description: 'Default light theme' },
 *     { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
 *     { value: 'auto', label: 'Auto', description: 'Follow system' }
 *   ]}
 * />
 * 
 * @example
 * // With validation
 * <RadioGroup
 *   label="Notification Preference"
 *   value={preference}
 *   onChange={setPreference}
 *   options={notificationOptions}
 *   required
 *   error={!preference}
 *   helperText={!preference ? "Please select an option" : ""}
 * />
 */
export const RadioGroup = React.memo(({
  label,
  value = '',
  onChange,
  options = [],
  row = false,
  disabled = false,
  required = false,
  error = false,
  helperText = '',
  color = 'primary',
  size = 'medium',
  labelPlacement = 'end',
  className,
  sx,
  ...otherProps
}) => {
  const handleChange = (event) => {
    if (onChange) {
      onChange(event.target.value);
    }
  };

  const renderOption = (option) => {
    const optionValue = typeof option === 'object' ? option.value : option;
    const optionLabel = typeof option === 'object' ? option.label : option;
    const optionDisabled = typeof option === 'object' ? option.disabled : false;
    const optionDescription = typeof option === 'object' ? option.description : null;

    return (
      <FormControlLabel
        key={optionValue}
        value={optionValue}
        disabled={optionDisabled || disabled}
        control={
          <Radio 
            color={color} 
            size={size}
          />
        }
        label={
          optionDescription ? (
            <div>
              <div>{optionLabel}</div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: 'text.secondary',
                marginTop: '2px'
              }}>
                {optionDescription}
              </div>
            </div>
          ) : optionLabel
        }
        labelPlacement={labelPlacement}
        sx={{
          marginRight: row ? 3 : 0,
          marginBottom: row ? 0 : 1
        }}
      />
    );
  };

  return (
    <FormControl 
      component="fieldset" 
      error={error} 
      disabled={disabled}
      required={required}
      className={className}
      sx={sx}
    >
      {label && (
        <FormLabel component="legend">
          {label}
        </FormLabel>
      )}
      <MuiRadioGroup
        value={value}
        onChange={handleChange}
        row={row}
        {...otherProps}
      >
        {options.map(renderOption)}
      </MuiRadioGroup>
      {helperText && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
});

RadioGroup.displayName = 'RadioGroup';

RadioGroup.propTypes = {
  /** Field label */
  label: PropTypes.string,
  /** Selected value */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Change handler - receives selected value */
  onChange: PropTypes.func,
  /** Radio options */
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.any.isRequired,
        label: PropTypes.string.isRequired,
        description: PropTypes.string,
        disabled: PropTypes.bool
      })
    ])
  ).isRequired,
  /** Display radios in row */
  row: PropTypes.bool,
  /** Disabled state */
  disabled: PropTypes.bool,
  /** Required field */
  required: PropTypes.bool,
  /** Error state */
  error: PropTypes.bool,
  /** Helper text */
  helperText: PropTypes.string,
  /** Radio color */
  color: PropTypes.oneOf(['primary', 'secondary', 'default']),
  /** Radio size */
  size: PropTypes.oneOf(['small', 'medium']),
  /** Label placement */
  labelPlacement: PropTypes.oneOf(['end', 'start', 'top', 'bottom']),
  /** Additional CSS class */
  className: PropTypes.string,
  /** MUI sx prop */
  sx: PropTypes.object
};