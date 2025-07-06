/**
 * MetricCard - Display metrics with optional trend indicators
 * 
 * @component
 * @example
 * // Simple metric
 * <MetricCard
 *   title="Total Elements"
 *   value={156}
 *   icon={<Inventory />}
 * />
 * 
 * @example
 * // With trend and subtitle
 * <MetricCard
 *   title="Memory Value"
 *   value={3250}
 *   subtitle="Last synced: 2 hours ago"
 *   trend={{ value: 12, direction: 'up' }}
 *   format="currency"
 *   color="primary"
 * />
 * 
 * @example
 * // Loading state
 * <MetricCard
 *   title="Story Completion"
 *   loading
 * />
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Info
} from '@mui/icons-material';
import PropTypes from 'prop-types';

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  format,
  color = 'primary',
  loading = false,
  onClick,
  info,
  size = 'medium',
  sx = {}
}) => {
  const theme = useTheme();

  // Format value based on type
  const formatValue = (val) => {
    if (loading || val === null || val === undefined) return null;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      
      case 'percent':
        return `${val}%`;
      
      case 'number':
        return new Intl.NumberFormat('en-US').format(val);
      
      case 'decimal':
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(val);
      
      default:
        return val;
    }
  };

  // Get trend icon
  const getTrendIcon = () => {
    if (!trend) return null;

    const trendColor = trend.direction === 'up' 
      ? theme.palette.success.main
      : trend.direction === 'down'
      ? theme.palette.error.main
      : theme.palette.text.secondary;

    const TrendIcon = trend.direction === 'up'
      ? TrendingUp
      : trend.direction === 'down'
      ? TrendingDown
      : TrendingFlat;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TrendIcon sx={{ fontSize: 16, color: trendColor }} />
        <Typography variant="caption" sx={{ color: trendColor, fontWeight: 'medium' }}>
          {trend.value}%
        </Typography>
      </Box>
    );
  };

  // Get size-based styling
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: theme.spacing(1.5),
          titleVariant: 'body2',
          valueVariant: 'h6',
          iconSize: 24
        };
      case 'large':
        return {
          padding: theme.spacing(3),
          titleVariant: 'h6',
          valueVariant: 'h3',
          iconSize: 48
        };
      default: // medium
        return {
          padding: theme.spacing(2),
          titleVariant: 'subtitle2',
          valueVariant: 'h4',
          iconSize: 32
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <Card
      elevation={1}
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? {
          elevation: 3,
          transform: 'translateY(-2px)'
        } : {},
        ...sx
      }}
    >
      <CardContent sx={{ p: sizeStyles.padding, '&:last-child': { pb: sizeStyles.padding } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            {/* Title with optional info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              {loading ? (
                <Skeleton width="60%" height={20} />
              ) : (
                <>
                  <Typography
                    variant={sizeStyles.titleVariant}
                    color="text.secondary"
                    sx={{ fontWeight: 'medium' }}
                  >
                    {title}
                  </Typography>
                  {info && (
                    <Tooltip title={info}>
                      <IconButton size="small" sx={{ p: 0.25 }}>
                        <Info sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              )}
            </Box>

            {/* Value */}
            {loading ? (
              <Skeleton width="80%" height={40} />
            ) : (
              <Typography
                variant={sizeStyles.valueVariant}
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette[color]?.main || theme.palette.text.primary,
                  mb: subtitle || trend ? 1 : 0
                }}
              >
                {formatValue(value)}
              </Typography>
            )}

            {/* Subtitle and trend */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {loading ? (
                <Skeleton width="50%" height={16} />
              ) : (
                <>
                  {subtitle && (
                    <Typography variant="caption" color="text.secondary">
                      {subtitle}
                    </Typography>
                  )}
                  {getTrendIcon()}
                </>
              )}
            </Box>
          </Box>

          {/* Icon */}
          {icon && !loading && (
            <Box
              sx={{
                color: theme.palette[color]?.main || theme.palette.text.secondary,
                opacity: 0.3,
                ml: 2
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: sizeStyles.iconSize } })}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  subtitle: PropTypes.string,
  icon: PropTypes.element,
  trend: PropTypes.shape({
    value: PropTypes.number.isRequired,
    direction: PropTypes.oneOf(['up', 'down', 'flat']).isRequired
  }),
  format: PropTypes.oneOf(['currency', 'percent', 'number', 'decimal', 'none']),
  color: PropTypes.string,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  info: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  sx: PropTypes.object
};

export default React.memo(MetricCard);