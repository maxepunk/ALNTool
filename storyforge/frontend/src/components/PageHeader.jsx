import React from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

/**
 * Reusable page header component with title and optional breadcrumbs
 * @param {Object} props Component props
 * @param {string} props.title Page title
 * @param {Array} props.breadcrumbs Optional breadcrumbs array of {name, path} objects
 * @param {React.ReactNode} props.action Optional action button/component
 */
function PageHeader({ title, breadcrumbs, action }) {
  return (
    <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 1.5 }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return isLast ? (
              <Typography key={crumb.name} color="text.primary" sx={{ fontWeight: 500 }}>
                {crumb.name}
              </Typography>
            ) : (
              <MuiLink
                key={crumb.name}
                component={RouterLink}
                to={crumb.path}
                underline="hover"
                color="text.secondary"
                sx={{ '&:hover': { color: 'text.primary' } }}
              >
                {crumb.name}
              </MuiLink>
            );
          })}
        </Breadcrumbs>
      )}
      
      {/* Title and action */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: {sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
      }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        {action && (
          <Box sx={{ ml: { sm: 'auto' } }}>
            {action}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default PageHeader; 