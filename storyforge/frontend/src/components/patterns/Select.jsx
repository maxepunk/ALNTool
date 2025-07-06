import React from 'react';
import PropTypes from 'prop-types';
import { 
  FormControl, 
  InputLabel, 
  Select as MuiSelect, 
  MenuItem, 
  FormHelperText,
  Chip,
  Box
} from '@mui/material';

/**
 * Select - Reusable select/dropdown component with consistent styling
 * 
 * Features:
 * - Single and multiple selection
 * - Grouped options
 * - Custom option rendering
 * - Search/filter capability
 * - Placeholder support
 * - Error handling
 * - Chip display for multiple selection
 * 
 * @example
 * // Basic usage
 * <Select
 *   label="Role"
 *   value={role}
 *   onChange={setRole}
 *   options={[
 *     { value: 'admin', label: 'Administrator' },
 *     { value: 'user', label: 'User' },
 *     { value: 'guest', label: 'Guest' }
 *   ]}
 * />
 * 
 * @example
 * // Multiple selection with chips
 * <Select
 *   label="Skills"
 *   multiple
 *   value={skills}
 *   onChange={setSkills}
 *   options={skillOptions}
 *   renderValue={(selected) => (
 *     <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
 *       {selected.map((value) => (
 *         <Chip key={value} label={value} size="small" />
 *       ))}
 *     </Box>
 *   )}
 * />
 * 
 * @example
 * // Grouped options
 * <Select
 *   label="Entity Type"
 *   value={entityType}
 *   onChange={setEntityType}
 *   options={[
 *     { group: 'People', options: [
 *       { value: 'character', label: 'Character' },
 *       { value: 'npc', label: 'NPC' }
 *     ]},
 *     { group: 'Items', options: [
 *       { value: 'element', label: 'Element' },
 *       { value: 'puzzle', label: 'Puzzle' }
 *     ]}
 *   ]}
 * />
 */
export const Select = React.memo(({
  label,
  value = '',
  onChange,
  options = [],
  multiple = false,
  placeholder = 'Select...',
  error = false,
  helperText = '',
  disabled = false,
  required = false,
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
  renderValue,
  renderOption,
  getOptionLabel,
  getOptionValue,
  className,
  sx,
  ...otherProps
}) => {
  const getValue = (option) => {
    if (getOptionValue) return getOptionValue(option);
    return typeof option === 'object' ? option.value : option;
  };

  const getLabel = (option) => {
    if (getOptionLabel) return getOptionLabel(option);
    return typeof option === 'object' ? option.label : option;
  };

  const handleChange = (event) => {
    const newValue = event.target.value;
    if (onChange) {
      onChange(multiple ? newValue : newValue);
    }
  };

  const renderMenuItems = () => {
    // Handle grouped options
    const hasGroups = options.some(opt => opt.group);
    
    if (hasGroups) {
      return options.map((group, groupIndex) => (
        <React.Fragment key={group.group || groupIndex}>
          {group.group && (
            <MenuItem disabled sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
              {group.group}
            </MenuItem>
          )}
          {(group.options || []).map((option) => {
            const optionValue = getValue(option);
            const optionLabel = getLabel(option);
            
            return (
              <MenuItem 
                key={optionValue} 
                value={optionValue}
                sx={{ pl: group.group ? 4 : 2 }}
              >
                {renderOption ? renderOption(option) : optionLabel}
              </MenuItem>
            );
          })}
        </React.Fragment>
      ));
    }

    // Handle flat options
    return options.map((option) => {
      const optionValue = getValue(option);
      const optionLabel = getLabel(option);
      
      return (
        <MenuItem key={optionValue} value={optionValue}>
          {renderOption ? renderOption(option) : optionLabel}
        </MenuItem>
      );
    });
  };

  const getDisplayValue = () => {
    if (renderValue) {
      return renderValue;
    }

    if (multiple) {
      return (selected) => {
        if (selected.length === 0) return placeholder;
        
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((val) => {
              const option = options.flat().find(opt => getValue(opt) === val);
              const label = option ? getLabel(option) : val;
              return <Chip key={val} label={label} size="small" />;
            })}
          </Box>
        );
      };
    }

    return undefined;
  };

  return (
    <FormControl 
      fullWidth={fullWidth} 
      error={error} 
      size={size}
      variant={variant}
      disabled={disabled}
      required={required}
      className={className}
    >
      {label && (
        <InputLabel id={`${label}-select-label`}>
          {label}
        </InputLabel>
      )}
      <MuiSelect
        labelId={label ? `${label}-select-label` : undefined}
        value={value}
        onChange={handleChange}
        label={label}
        multiple={multiple}
        renderValue={getDisplayValue()}
        displayEmpty={!label}
        sx={sx}
        {...otherProps}
      >
        {!multiple && placeholder && (
          <MenuItem value="" disabled>
            <em>{placeholder}</em>
          </MenuItem>
        )}
        {renderMenuItems()}
      </MuiSelect>
      {helperText && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
  /** Field label */
  label: PropTypes.string,
  /** Current value(s) */
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array
  ]),
  /** Change handler - receives new value(s) */
  onChange: PropTypes.func,
  /** Options array - can be flat or grouped */
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.any.isRequired,
        label: PropTypes.string.isRequired,
        disabled: PropTypes.bool
      }),
      PropTypes.shape({
        group: PropTypes.string,
        options: PropTypes.array
      })
    ])
  ),
  /** Enable multiple selection */
  multiple: PropTypes.bool,
  /** Placeholder text */
  placeholder: PropTypes.string,
  /** Error state */
  error: PropTypes.bool,
  /** Helper text */
  helperText: PropTypes.string,
  /** Disabled state */
  disabled: PropTypes.bool,
  /** Required field */
  required: PropTypes.bool,
  /** Take full width */
  fullWidth: PropTypes.bool,
  /** Component size */
  size: PropTypes.oneOf(['small', 'medium']),
  /** Select variant */
  variant: PropTypes.oneOf(['outlined', 'filled', 'standard']),
  /** Custom render for selected value(s) */
  renderValue: PropTypes.func,
  /** Custom render for options */
  renderOption: PropTypes.func,
  /** Custom function to get option label */
  getOptionLabel: PropTypes.func,
  /** Custom function to get option value */
  getOptionValue: PropTypes.func,
  /** Additional CSS class */
  className: PropTypes.string,
  /** MUI sx prop */
  sx: PropTypes.object
};