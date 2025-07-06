import React from 'react';
import PropTypes from 'prop-types';
import { Badge as MuiBadge, Box } from '@mui/material';

/**
 * Badge - Display a small badge on another element
 * 
 * Features:
 * - Numeric and text badges
 * - Dot indicator mode
 * - Multiple colors
 * - Positioning options
 * - Max count display
 * - Invisible when zero
 * 
 * @example
 * // Basic numeric badge
 * <Badge badgeContent={4}>
 *   <MailIcon />
 * </Badge>
 * 
 * @example
 * // Dot badge for status
 * <Badge variant="dot" color="success">
 *   <Avatar>U</Avatar>
 * </Badge>
 * 
 * @example
 * // Badge with max count
 * <Badge badgeContent={99} max={9} color="error">
 *   <NotificationsIcon />
 * </Badge>
 * 
 * @example
 * // Custom positioned badge
 * <Badge 
 *   badgeContent="NEW"
 *   color="secondary"
 *   anchorOrigin={{
 *     vertical: 'top',
 *     horizontal: 'left',
 *   }}
 * >
 *   <ProductCard />
 * </Badge>
 * 
 * @example
 * // Dynamic badge
 * <Badge 
 *   badgeContent={unreadCount}
 *   invisible={unreadCount === 0}
 *   color="primary"
 * >
 *   <IconButton>
 *     <ChatIcon />
 *   </IconButton>
 * </Badge>
 */
export const Badge = React.memo(({
  badgeContent,
  children,
  variant = 'standard',
  color = 'default',
  max = 99,
  showZero = false,
  invisible = false,
  anchorOrigin = {
    vertical: 'top',
    horizontal: 'right',
  },
  overlap = 'rectangular',
  size = 'medium',
  className,
  sx,
  ...otherProps
}) => {
  // Custom size handling
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          '& .MuiBadge-badge': {
            fontSize: '0.625rem',
            height: '16px',
            minWidth: '16px',
            padding: variant === 'dot' ? 0 : '0 4px'
          }
        };
      case 'large':
        return {
          '& .MuiBadge-badge': {
            fontSize: '0.875rem',
            height: '24px',
            minWidth: '24px',
            padding: variant === 'dot' ? 0 : '0 8px'
          }
        };
      default:
        return {};
    }
  };

  return (
    <MuiBadge
      badgeContent={badgeContent}
      variant={variant}
      color={color}
      max={max}
      showZero={showZero}
      invisible={invisible}
      anchorOrigin={anchorOrigin}
      overlap={overlap}
      className={className}
      sx={{
        ...getSizeStyles(),
        ...sx
      }}
      {...otherProps}
    >
      {children}
    </MuiBadge>
  );
});

Badge.displayName = 'Badge';

// Convenience components for common use cases
export const NotificationBadge = React.memo(({ count, ...props }) => (
  <Badge 
    badgeContent={count}
    color="error"
    {...props}
  />
));
NotificationBadge.displayName = 'NotificationBadge';

export const StatusBadge = React.memo(({ status, ...props }) => {
  const getColorForStatus = (status) => {
    switch (status) {
      case 'online':
      case 'active':
        return 'success';
      case 'away':
      case 'pending':
        return 'warning';
      case 'offline':
      case 'inactive':
        return 'default';
      case 'busy':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Badge
      variant="dot"
      color={getColorForStatus(status)}
      {...props}
    />
  );
});
StatusBadge.displayName = 'StatusBadge';

export const LabelBadge = React.memo(({ label, ...props }) => (
  <Badge
    badgeContent={label}
    color="primary"
    {...props}
  />
));
LabelBadge.displayName = 'LabelBadge';

Badge.propTypes = {
  /** Badge content */
  badgeContent: PropTypes.node,
  /** Element to apply badge to */
  children: PropTypes.node,
  /** Badge variant */
  variant: PropTypes.oneOf(['standard', 'dot']),
  /** Badge color */
  color: PropTypes.oneOf([
    'default', 'primary', 'secondary', 'error', 'info', 'success', 'warning'
  ]),
  /** Max count to display */
  max: PropTypes.number,
  /** Show badge when content is zero */
  showZero: PropTypes.bool,
  /** Hide badge */
  invisible: PropTypes.bool,
  /** Badge position */
  anchorOrigin: PropTypes.shape({
    vertical: PropTypes.oneOf(['top', 'bottom']),
    horizontal: PropTypes.oneOf(['left', 'right'])
  }),
  /** Wrapped shape overlap */
  overlap: PropTypes.oneOf(['circular', 'rectangular']),
  /** Badge size */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Additional CSS class */
  className: PropTypes.string,
  /** MUI sx prop */
  sx: PropTypes.object
};

NotificationBadge.propTypes = {
  count: PropTypes.number.isRequired,
  ...Badge.propTypes
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  ...Badge.propTypes
};

LabelBadge.propTypes = {
  label: PropTypes.string.isRequired,
  ...Badge.propTypes
};