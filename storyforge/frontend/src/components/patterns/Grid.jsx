import React from 'react';
import PropTypes from 'prop-types';
import { Grid as MuiGrid } from '@mui/material';

/**
 * Grid - Responsive grid layout component
 * 
 * Features:
 * - 12-column responsive grid system
 * - Flexible item sizing
 * - Spacing control
 * - Alignment options
 * - Nested grids support
 * 
 * @example
 * // Basic 2-column layout
 * <Grid container spacing={2}>
 *   <Grid item xs={12} md={6}>
 *     <Card>Left content</Card>
 *   </Grid>
 *   <Grid item xs={12} md={6}>
 *     <Card>Right content</Card>
 *   </Grid>
 * </Grid>
 * 
 * @example
 * // Responsive 3-column cards
 * <Grid container spacing={3}>
 *   {items.map(item => (
 *     <Grid item key={item.id} xs={12} sm={6} md={4}>
 *       <ItemCard item={item} />
 *     </Grid>
 *   ))}
 * </Grid>
 * 
 * @example
 * // Complex layout with alignment
 * <Grid 
 *   container 
 *   spacing={2}
 *   alignItems="center"
 *   justifyContent="space-between"
 * >
 *   <Grid item xs="auto">
 *     <Logo />
 *   </Grid>
 *   <Grid item xs>
 *     <SearchBar />
 *   </Grid>
 *   <Grid item xs="auto">
 *     <UserMenu />
 *   </Grid>
 * </Grid>
 */
export const Grid = React.memo(({
  container = false,
  item = false,
  spacing = 0,
  xs,
  sm,
  md,
  lg,
  xl,
  alignItems,
  justifyContent,
  direction = 'row',
  wrap = 'wrap',
  children,
  className,
  sx,
  ...otherProps
}) => {
  // Helper to create responsive grid
  if (container && !item) {
    return (
      <MuiGrid
        container
        spacing={spacing}
        alignItems={alignItems}
        justifyContent={justifyContent}
        direction={direction}
        wrap={wrap}
        className={className}
        sx={sx}
        {...otherProps}
      >
        {children}
      </MuiGrid>
    );
  }

  // Grid item
  if (item && !container) {
    return (
      <MuiGrid
        item
        xs={xs}
        sm={sm}
        md={md}
        lg={lg}
        xl={xl}
        className={className}
        sx={sx}
        {...otherProps}
      >
        {children}
      </MuiGrid>
    );
  }

  // Both container and item (for nested grids)
  return (
    <MuiGrid
      container={container}
      item={item}
      spacing={spacing}
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      alignItems={alignItems}
      justifyContent={justifyContent}
      direction={direction}
      wrap={wrap}
      className={className}
      sx={sx}
      {...otherProps}
    >
      {children}
    </MuiGrid>
  );
});

Grid.displayName = 'Grid';

// Export convenience components
export const GridContainer = React.memo((props) => (
  <Grid container {...props} />
));
GridContainer.displayName = 'GridContainer';

export const GridItem = React.memo((props) => (
  <Grid item {...props} />
));
GridItem.displayName = 'GridItem';

Grid.propTypes = {
  /** Establish element as grid container */
  container: PropTypes.bool,
  /** Establish element as grid item */
  item: PropTypes.bool,
  /** Grid spacing (0-10) */
  spacing: PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
  /** Columns for xs breakpoint */
  xs: PropTypes.oneOfType([
    PropTypes.oneOf([false, 'auto', true, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  ]),
  /** Columns for sm breakpoint */
  sm: PropTypes.oneOfType([
    PropTypes.oneOf([false, 'auto', true, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  ]),
  /** Columns for md breakpoint */
  md: PropTypes.oneOfType([
    PropTypes.oneOf([false, 'auto', true, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  ]),
  /** Columns for lg breakpoint */
  lg: PropTypes.oneOfType([
    PropTypes.oneOf([false, 'auto', true, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  ]),
  /** Columns for xl breakpoint */
  xl: PropTypes.oneOfType([
    PropTypes.oneOf([false, 'auto', true, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  ]),
  /** Align items vertically */
  alignItems: PropTypes.oneOf([
    'flex-start', 'center', 'flex-end', 'stretch', 'baseline'
  ]),
  /** Justify content horizontally */
  justifyContent: PropTypes.oneOf([
    'flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'
  ]),
  /** Direction of flex container */
  direction: PropTypes.oneOf(['row', 'row-reverse', 'column', 'column-reverse']),
  /** Wrap behavior */
  wrap: PropTypes.oneOf(['nowrap', 'wrap', 'wrap-reverse']),
  /** Child elements */
  children: PropTypes.node,
  /** Additional CSS class */
  className: PropTypes.string,
  /** MUI sx prop */
  sx: PropTypes.object
};

GridContainer.propTypes = Grid.propTypes;
GridItem.propTypes = Grid.propTypes;