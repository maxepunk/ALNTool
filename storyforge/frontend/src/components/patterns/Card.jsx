import React from 'react';
import PropTypes from 'prop-types';
import { 
  Card as MuiCard, 
  CardContent, 
  CardHeader,
  CardActions,
  CardMedia,
  IconButton,
  Collapse,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * Card - Flexible card component for content display
 * 
 * Features:
 * - Header with title, subtitle, and action
 * - Media support (images, video)
 * - Expandable content
 * - Action buttons
 * - Click handling
 * - Hover effects
 * 
 * @example
 * // Basic card
 * <Card title="Card Title">
 *   <Typography>Card content goes here</Typography>
 * </Card>
 * 
 * @example
 * // Card with image and actions
 * <Card
 *   title="Product Name"
 *   subtitle="$99.99"
 *   image="/product.jpg"
 *   imageHeight={200}
 *   actions={[
 *     <Button key="buy">Buy Now</Button>,
 *     <IconButton key="fav"><FavoriteIcon /></IconButton>
 *   ]}
 * >
 *   <Typography>Product description...</Typography>
 * </Card>
 * 
 * @example
 * // Expandable card
 * <Card
 *   title="FAQ Item"
 *   expandable
 *   defaultExpanded={false}
 * >
 *   <Typography>Short preview text...</Typography>
 *   <Card.ExpandableContent>
 *     <Typography>Detailed answer goes here...</Typography>
 *   </Card.ExpandableContent>
 * </Card>
 * 
 * @example
 * // Clickable card with hover
 * <Card
 *   title="Article"
 *   subtitle="5 min read"
 *   onClick={() => navigate('/article/123')}
 *   hover
 * >
 *   <Typography>Article preview...</Typography>
 * </Card>
 */
export const Card = React.memo(({
  title,
  subtitle,
  avatar,
  action,
  image,
  imageHeight = 140,
  imageAlt = '',
  children,
  actions,
  expandable = false,
  defaultExpanded = true,
  elevation = 1,
  variant = 'elevation',
  square = false,
  onClick,
  hover = false,
  disabled = false,
  className,
  sx,
  ...otherProps
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const [mainContent, expandableContent] = React.useMemo(() => {
    if (!expandable) return [children, null];
    
    const childArray = React.Children.toArray(children);
    const expandableIndex = childArray.findIndex(
      child => child.type === Card.ExpandableContent
    );
    
    if (expandableIndex === -1) return [children, null];
    
    return [
      childArray.slice(0, expandableIndex),
      childArray[expandableIndex].props.children
    ];
  }, [children, expandable]);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const cardProps = {
    elevation: variant === 'elevation' ? elevation : 0,
    variant,
    square,
    className,
    sx: {
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      ...(hover && {
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[elevation + 2]
        }
      }),
      ...(disabled && {
        opacity: 0.6,
        pointerEvents: 'none'
      }),
      ...sx
    },
    onClick: onClick,
    ...otherProps
  };

  return (
    <MuiCard {...cardProps}>
      {(title || subtitle || avatar || action) && (
        <CardHeader
          avatar={avatar}
          action={
            expandable ? (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpandClick();
                }}
                aria-expanded={expanded}
                aria-label="show more"
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s'
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            ) : action
          }
          title={title}
          subheader={subtitle}
        />
      )}
      
      {image && (
        <CardMedia
          component="img"
          height={imageHeight}
          image={image}
          alt={imageAlt}
        />
      )}
      
      {mainContent && (
        <CardContent>
          {mainContent}
        </CardContent>
      )}
      
      {expandable && expandableContent && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            {expandableContent}
          </CardContent>
        </Collapse>
      )}
      
      {actions && actions.length > 0 && (
        <CardActions>
          {actions}
        </CardActions>
      )}
    </MuiCard>
  );
});

Card.displayName = 'Card';

// Expandable content marker component
Card.ExpandableContent = ({ children }) => children;
Card.ExpandableContent.displayName = 'Card.ExpandableContent';

Card.propTypes = {
  /** Card title */
  title: PropTypes.node,
  /** Card subtitle */
  subtitle: PropTypes.node,
  /** Avatar element for header */
  avatar: PropTypes.node,
  /** Action element for header */
  action: PropTypes.node,
  /** Image URL */
  image: PropTypes.string,
  /** Image height in pixels */
  imageHeight: PropTypes.number,
  /** Image alt text */
  imageAlt: PropTypes.string,
  /** Card content */
  children: PropTypes.node,
  /** Action buttons */
  actions: PropTypes.arrayOf(PropTypes.node),
  /** Enable expandable content */
  expandable: PropTypes.bool,
  /** Default expanded state */
  defaultExpanded: PropTypes.bool,
  /** Card elevation */
  elevation: PropTypes.number,
  /** Card variant */
  variant: PropTypes.oneOf(['elevation', 'outlined']),
  /** Square corners */
  square: PropTypes.bool,
  /** Click handler */
  onClick: PropTypes.func,
  /** Enable hover effect */
  hover: PropTypes.bool,
  /** Disabled state */
  disabled: PropTypes.bool,
  /** Additional CSS class */
  className: PropTypes.string,
  /** MUI sx prop */
  sx: PropTypes.object
};