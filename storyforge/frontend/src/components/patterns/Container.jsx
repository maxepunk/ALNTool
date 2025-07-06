import React from 'react';
import PropTypes from 'prop-types';
import { Container as MuiContainer, Box } from '@mui/material';

/**
 * Container - Responsive container component with consistent max-widths
 * 
 * Features:
 * - Responsive max-width breakpoints
 * - Consistent padding
 * - Fluid option
 * - Section variants
 * - Background and elevation support
 * 
 * @example
 * // Basic page container
 * <Container>
 *   <Typography variant="h4">Page Title</Typography>
 *   <Typography>Page content goes here...</Typography>
 * </Container>
 * 
 * @example
 * // Full-width section with background
 * <Container 
 *   variant="section" 
 *   background="primary.light"
 *   py={4}
 * >
 *   <Container maxWidth="md">
 *     <Typography variant="h3">Hero Section</Typography>
 *   </Container>
 * </Container>
 * 
 * @example
 * // Card-like container
 * <Container 
 *   maxWidth="sm" 
 *   variant="card"
 *   elevation={2}
 * >
 *   <LoginForm />
 * </Container>
 */
export const Container = React.memo(({
  maxWidth = 'lg',
  variant = 'default',
  background,
  elevation = 0,
  disableGutters = false,
  fixed = false,
  fluid = false,
  component = 'div',
  padding,
  py,
  px,
  pt,
  pb,
  pl,
  pr,
  children,
  className,
  sx,
  ...otherProps
}) => {
  // Calculate padding values
  const getPadding = () => {
    const defaultPadding = variant === 'card' ? 3 : 0;
    return {
      padding: padding !== undefined ? padding : defaultPadding,
      py: py,
      px: px,
      pt: pt,
      pb: pb,
      pl: pl,
      pr: pr
    };
  };

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'section':
        return {
          width: '100%',
          backgroundColor: background,
          ...getPadding()
        };
      case 'card':
        return {
          backgroundColor: background || 'background.paper',
          borderRadius: 1,
          boxShadow: elevation,
          ...getPadding()
        };
      case 'fluid':
        return {
          width: '100%',
          maxWidth: '100%',
          ...getPadding()
        };
      default:
        return getPadding();
    }
  };

  // For section variant, wrap in Box for full-width background
  if (variant === 'section') {
    return (
      <Box
        component={component}
        className={className}
        sx={{
          ...getVariantStyles(),
          ...sx
        }}
        {...otherProps}
      >
        <MuiContainer
          maxWidth={maxWidth}
          disableGutters={disableGutters}
          fixed={fixed}
        >
          {children}
        </MuiContainer>
      </Box>
    );
  }

  // For other variants
  return (
    <MuiContainer
      maxWidth={fluid ? false : maxWidth}
      disableGutters={disableGutters}
      fixed={fixed}
      component={component}
      className={className}
      sx={{
        ...getVariantStyles(),
        ...sx
      }}
      {...otherProps}
    >
      {children}
    </MuiContainer>
  );
});

Container.displayName = 'Container';

// Convenience components
export const PageContainer = React.memo((props) => (
  <Container maxWidth="lg" {...props} />
));
PageContainer.displayName = 'PageContainer';

export const Section = React.memo((props) => (
  <Container variant="section" {...props} />
));
Section.displayName = 'Section';

export const CardContainer = React.memo((props) => (
  <Container variant="card" {...props} />
));
CardContainer.displayName = 'CardContainer';

Container.propTypes = {
  /** Maximum width breakpoint */
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  /** Container variant */
  variant: PropTypes.oneOf(['default', 'section', 'card', 'fluid']),
  /** Background color */
  background: PropTypes.string,
  /** Elevation (for card variant) */
  elevation: PropTypes.number,
  /** Remove padding */
  disableGutters: PropTypes.bool,
  /** Fixed width at each breakpoint */
  fixed: PropTypes.bool,
  /** Full width container */
  fluid: PropTypes.bool,
  /** HTML element or component */
  component: PropTypes.elementType,
  /** Padding all sides */
  padding: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Padding top and bottom */
  py: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Padding left and right */
  px: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Padding top */
  pt: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Padding bottom */
  pb: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Padding left */
  pl: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Padding right */
  pr: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Child elements */
  children: PropTypes.node,
  /** Additional CSS class */
  className: PropTypes.string,
  /** MUI sx prop */
  sx: PropTypes.object
};

PageContainer.propTypes = Container.propTypes;
Section.propTypes = Container.propTypes;
CardContainer.propTypes = Container.propTypes;