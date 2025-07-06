import React from 'react';
import PropTypes from 'prop-types';
import { Stack as MuiStack, Divider } from '@mui/material';

/**
 * Stack - Layout component for arranging elements vertically or horizontally
 * 
 * Features:
 * - Consistent spacing between children
 * - Vertical or horizontal direction
 * - Responsive direction changes
 * - Alignment control
 * - Optional dividers between items
 * 
 * @example
 * // Vertical stack with spacing
 * <Stack spacing={2}>
 *   <Typography variant="h6">Title</Typography>
 *   <TextField label="Name" />
 *   <Button variant="contained">Submit</Button>
 * </Stack>
 * 
 * @example
 * // Horizontal button group
 * <Stack direction="row" spacing={1}>
 *   <Button>Cancel</Button>
 *   <Button variant="contained">Save</Button>
 *   <Button variant="outlined">Save as Draft</Button>
 * </Stack>
 * 
 * @example
 * // Responsive stack with dividers
 * <Stack 
 *   direction={{ xs: 'column', sm: 'row' }}
 *   divider={<Divider orientation="vertical" flexItem />}
 *   spacing={2}
 *   alignItems="center"
 * >
 *   <MetricCard title="Users" value={150} />
 *   <MetricCard title="Revenue" value="$5,000" />
 *   <MetricCard title="Growth" value="+15%" />
 * </Stack>
 */
export const Stack = React.memo(({
  spacing = 2,
  direction = 'column',
  divider,
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  useFlexGap = false,
  wrap = false,
  children,
  component = 'div',
  className,
  sx,
  ...otherProps
}) => {
  // Handle divider prop to ensure proper orientation
  const getDivider = () => {
    if (!divider) return undefined;
    
    // If divider is already a React element, return it
    if (React.isValidElement(divider)) {
      return divider;
    }
    
    // Create default divider based on direction
    const isHorizontal = direction === 'row' || 
      (typeof direction === 'object' && Object.values(direction).includes('row'));
    
    return (
      <Divider 
        orientation={isHorizontal ? 'vertical' : 'horizontal'} 
        flexItem 
      />
    );
  };

  return (
    <MuiStack
      spacing={spacing}
      direction={direction}
      divider={getDivider()}
      alignItems={alignItems}
      justifyContent={justifyContent}
      useFlexGap={useFlexGap}
      flexWrap={wrap ? 'wrap' : 'nowrap'}
      component={component}
      className={className}
      sx={sx}
      {...otherProps}
    >
      {children}
    </MuiStack>
  );
});

Stack.displayName = 'Stack';

// Convenience components for common use cases
export const VStack = React.memo((props) => (
  <Stack direction="column" {...props} />
));
VStack.displayName = 'VStack';

export const HStack = React.memo((props) => (
  <Stack direction="row" {...props} />
));
HStack.displayName = 'HStack';

Stack.propTypes = {
  /** Spacing between items (0-10 or custom value) */
  spacing: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.object,
    PropTypes.array
  ]),
  /** Stack direction */
  direction: PropTypes.oneOfType([
    PropTypes.oneOf(['row', 'row-reverse', 'column', 'column-reverse']),
    PropTypes.object
  ]),
  /** Divider element between items */
  divider: PropTypes.node,
  /** Align items */
  alignItems: PropTypes.oneOfType([
    PropTypes.oneOf([
      'flex-start', 'center', 'flex-end', 'stretch', 'baseline'
    ]),
    PropTypes.object
  ]),
  /** Justify content */
  justifyContent: PropTypes.oneOfType([
    PropTypes.oneOf([
      'flex-start', 'center', 'flex-end', 'space-between', 
      'space-around', 'space-evenly'
    ]),
    PropTypes.object
  ]),
  /** Use CSS gap instead of margin */
  useFlexGap: PropTypes.bool,
  /** Allow items to wrap */
  wrap: PropTypes.bool,
  /** HTML element or component */
  component: PropTypes.elementType,
  /** Child elements */
  children: PropTypes.node,
  /** Additional CSS class */
  className: PropTypes.string,
  /** MUI sx prop */
  sx: PropTypes.object
};

VStack.propTypes = Stack.propTypes;
HStack.propTypes = Stack.propTypes;