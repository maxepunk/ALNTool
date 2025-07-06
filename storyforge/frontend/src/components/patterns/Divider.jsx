import React from 'react';
import PropTypes from 'prop-types';
import { Divider as MuiDivider, Typography, Box } from '@mui/material';

/**
 * Divider - Visual separator with optional text
 * 
 * Features:
 * - Horizontal and vertical orientation
 * - Text/component in divider
 * - Custom styling and spacing
 * - Flexible width/height
 * - Variants (full width, inset, middle)
 * 
 * @example
 * // Basic divider
 * <Divider />
 * 
 * @example
 * // Divider with text
 * <Divider>OR</Divider>
 * 
 * @example
 * // Section divider with spacing
 * <Stack spacing={4}>
 *   <Section1 />
 *   <Divider variant="middle" my={2} />
 *   <Section2 />
 * </Stack>
 * 
 * @example
 * // Vertical divider in flex container
 * <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
 *   <Item1 />
 *   <Item2 />
 *   <Item3 />
 * </Stack>
 * 
 * @example
 * // Styled divider with custom content
 * <Divider 
 *   textAlign="left"
 *   sx={{ borderColor: 'primary.main' }}
 * >
 *   <Chip label="Section Title" size="small" />
 * </Divider>
 */
export const Divider = React.memo(({
  children,
  orientation = 'horizontal',
  variant = 'fullWidth',
  textAlign = 'center',
  flexItem = false,
  light = false,
  component = 'hr',
  spacing = 0,
  my,
  mx,
  mt,
  mb,
  ml,
  mr,
  className,
  sx,
  ...otherProps
}) => {
  // Calculate margin values
  const getMargin = () => {
    const margins = {};
    if (spacing) {
      margins.my = orientation === 'horizontal' ? spacing : 0;
      margins.mx = orientation === 'vertical' ? spacing : 0;
    }
    // Specific margins override spacing
    if (my !== undefined) margins.my = my;
    if (mx !== undefined) margins.mx = mx;
    if (mt !== undefined) margins.mt = mt;
    if (mb !== undefined) margins.mb = mb;
    if (ml !== undefined) margins.ml = ml;
    if (mr !== undefined) margins.mr = mr;
    
    return margins;
  };

  const dividerProps = {
    orientation,
    variant,
    textAlign,
    flexItem: flexItem || orientation === 'vertical',
    light,
    component: children ? 'div' : component,
    className,
    sx: {
      ...getMargin(),
      ...sx
    },
    ...otherProps
  };

  // If children provided, render as text divider
  if (children) {
    return (
      <MuiDivider {...dividerProps}>
        {typeof children === 'string' ? (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ px: 2 }}
          >
            {children}
          </Typography>
        ) : (
          <Box sx={{ px: 2 }}>{children}</Box>
        )}
      </MuiDivider>
    );
  }

  return <MuiDivider {...dividerProps} />;
});

Divider.displayName = 'Divider';

// Convenience components
export const HDivider = React.memo((props) => (
  <Divider orientation="horizontal" {...props} />
));
HDivider.displayName = 'HDivider';

export const VDivider = React.memo((props) => (
  <Divider orientation="vertical" flexItem {...props} />
));
VDivider.displayName = 'VDivider';

export const TextDivider = React.memo(({ text, ...props }) => (
  <Divider {...props}>{text}</Divider>
));
TextDivider.displayName = 'TextDivider';

Divider.propTypes = {
  /** Content to display in divider */
  children: PropTypes.node,
  /** Divider orientation */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /** Divider variant */
  variant: PropTypes.oneOf(['fullWidth', 'inset', 'middle']),
  /** Text alignment (when children provided) */
  textAlign: PropTypes.oneOf(['center', 'left', 'right']),
  /** Use in flex container */
  flexItem: PropTypes.bool,
  /** Light divider (reduced opacity) */
  light: PropTypes.bool,
  /** HTML element */
  component: PropTypes.elementType,
  /** Margin spacing (applied based on orientation) */
  spacing: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Margin top and bottom */
  my: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Margin left and right */
  mx: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Margin top */
  mt: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Margin bottom */
  mb: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Margin left */
  ml: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Margin right */
  mr: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Additional CSS class */
  className: PropTypes.string,
  /** MUI sx prop */
  sx: PropTypes.object
};

HDivider.propTypes = Divider.propTypes;
VDivider.propTypes = Divider.propTypes;
TextDivider.propTypes = {
  ...Divider.propTypes,
  /** Text to display */
  text: PropTypes.string.isRequired
};