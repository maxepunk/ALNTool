/**
 * DetailCard - Consistent entity detail display component
 * 
 * @component
 * @example
 * // Simple usage
 * <DetailCard
 *   title="Character Details"
 *   entity={character}
 *   fields={[
 *     { label: 'Name', value: character.name },
 *     { label: 'Role', value: character.role },
 *     { label: 'Status', value: character.status, color: 'success' }
 *   ]}
 * />
 * 
 * @example
 * // With sections and actions
 * <DetailCard
 *   title="Puzzle Information"
 *   subtitle="Act 1 - Investigation"
 *   entity={puzzle}
 *   sections={[
 *     {
 *       title: 'Basic Info',
 *       fields: [
 *         { label: 'Name', value: puzzle.name },
 *         { label: 'Type', value: puzzle.type }
 *       ]
 *     },
 *     {
 *       title: 'Requirements',
 *       fields: puzzle.requirements.map(req => ({
 *         label: req.type,
 *         value: req.description
 *       }))
 *     }
 *   ]}
 *   actions={[
 *     { label: 'Edit', onClick: handleEdit },
 *     { label: 'Delete', onClick: handleDelete, color: 'error' }
 *   ]}
 * />
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Box,
  Chip,
  Divider,
  Button,
  Grid,
  Avatar,
  Skeleton
} from '@mui/material';
import PropTypes from 'prop-types';

const DetailCard = ({
  title,
  subtitle,
  avatar,
  entity,
  fields = [],
  sections = [],
  actions = [],
  loading = false,
  elevation = 1,
  sx = {},
  headerAction,
  dense = false
}) => {
  // Render a single field
  const renderField = (field, index) => {
    if (loading) {
      return (
        <Box key={index} sx={{ mb: dense ? 1 : 2 }}>
          <Skeleton width="40%" height={20} />
          <Skeleton width="60%" height={24} sx={{ mt: 0.5 }} />
        </Box>
      );
    }

    if (!field.value && !field.render) return null;

    return (
      <Box key={field.label || index} sx={{ mb: dense ? 1 : 2 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {field.label}
        </Typography>
        <Box>
          {field.render ? (
            field.render(field.value, entity)
          ) : field.chip ? (
            <Chip
              label={field.value}
              size="small"
              color={field.color || 'default'}
              sx={{ mt: 0.5 }}
            />
          ) : (
            <Typography
              variant={dense ? 'body2' : 'body1'}
              color={field.color ? `${field.color}.main` : 'text.primary'}
              sx={{ fontWeight: field.bold ? 'medium' : 'normal' }}
            >
              {field.value || '-'}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  // Render a section
  const renderSection = (section, sectionIndex) => (
    <Box key={section.title || sectionIndex} sx={{ mb: 3 }}>
      {section.title && (
        <>
          <Typography
            variant={dense ? 'subtitle2' : 'subtitle1'}
            gutterBottom
            sx={{ fontWeight: 'medium' }}
          >
            {section.title}
          </Typography>
          {section.subtitle && (
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {section.subtitle}
            </Typography>
          )}
          <Divider sx={{ my: 1 }} />
        </>
      )}
      
      {section.grid ? (
        <Grid container spacing={dense ? 1 : 2}>
          {section.fields.map((field, index) => (
            <Grid item xs={12} sm={6} key={field.label || index}>
              {renderField(field, index)}
            </Grid>
          ))}
        </Grid>
      ) : (
        section.fields.map((field, index) => renderField(field, index))
      )}
    </Box>
  );

  return (
    <Card elevation={elevation} sx={{ height: '100%', ...sx }}>
      {(title || avatar) && (
        <CardHeader
          avatar={
            loading ? (
              <Skeleton variant="circular" width={40} height={40} />
            ) : (
              avatar && (
                typeof avatar === 'string' ? (
                  <Avatar src={avatar} />
                ) : (
                  avatar
                )
              )
            )
          }
          title={
            loading ? (
              <Skeleton width="60%" />
            ) : (
              <Typography variant={dense ? 'h6' : 'h5'}>
                {title}
              </Typography>
            )
          }
          subheader={
            loading ? (
              <Skeleton width="40%" />
            ) : (
              subtitle
            )
          }
          action={!loading && headerAction}
        />
      )}

      <CardContent sx={{ pt: title ? 0 : undefined }}>
        {loading ? (
          <>
            <Skeleton width="100%" height={24} />
            <Skeleton width="80%" height={24} />
            <Skeleton width="90%" height={24} />
          </>
        ) : (
          <>
            {/* Simple fields */}
            {fields.length > 0 && (
              <Box>
                {fields.map((field, index) => renderField(field, index))}
              </Box>
            )}

            {/* Sections */}
            {sections.length > 0 && (
              <Box sx={{ mt: fields.length > 0 ? 3 : 0 }}>
                {sections.map((section, index) => renderSection(section, index))}
              </Box>
            )}
          </>
        )}
      </CardContent>

      {actions.length > 0 && !loading && (
        <>
          <Divider />
          <CardActions sx={{ justifyContent: 'flex-end', px: 2, py: 1 }}>
            {actions.map((action, index) => (
              <Button
                key={action.label || index}
                size={dense ? 'small' : 'medium'}
                color={action.color || 'primary'}
                variant={action.variant || 'text'}
                onClick={action.onClick}
                disabled={action.disabled}
                startIcon={action.icon}
              >
                {action.label}
              </Button>
            ))}
          </CardActions>
        </>
      )}
    </Card>
  );
};

DetailCard.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  avatar: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  entity: PropTypes.object,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.any,
      render: PropTypes.func,
      chip: PropTypes.bool,
      color: PropTypes.string,
      bold: PropTypes.bool
    })
  ),
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      subtitle: PropTypes.string,
      fields: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.any,
          render: PropTypes.func,
          chip: PropTypes.bool,
          color: PropTypes.string,
          bold: PropTypes.bool
        })
      ),
      grid: PropTypes.bool
    })
  ),
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      color: PropTypes.string,
      variant: PropTypes.string,
      disabled: PropTypes.bool,
      icon: PropTypes.element
    })
  ),
  loading: PropTypes.bool,
  elevation: PropTypes.number,
  sx: PropTypes.object,
  headerAction: PropTypes.element,
  dense: PropTypes.bool
};

export default React.memo(DetailCard);