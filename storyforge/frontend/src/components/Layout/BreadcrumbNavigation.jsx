import React from 'react';
import { Breadcrumbs, Link, Typography, Box, Chip } from '@mui/material';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import TimelineIcon from '@mui/icons-material/Timeline';
import ExtensionIcon from '@mui/icons-material/Extension';
import InventoryIcon from '@mui/icons-material/Inventory';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import RouteIcon from '@mui/icons-material/Route';
import HubIcon from '@mui/icons-material/Hub';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

const BreadcrumbNavigation = ({ currentEntity = null, showRelatedTools = true }) => {
  const location = useLocation();
  
  // Define path segments and their metadata
  const pathConfig = {
    '': { label: 'Dashboard', icon: <HomeIcon fontSize="small" />, category: 'overview' },
    'characters': { label: 'Characters', icon: <PeopleIcon fontSize="small" />, category: 'data' },
    'timelines': { label: 'Timeline Events', icon: <TimelineIcon fontSize="small" />, category: 'data' },
    'puzzles': { label: 'Puzzles', icon: <ExtensionIcon fontSize="small" />, category: 'data' },
    'elements': { label: 'Elements', icon: <InventoryIcon fontSize="small" />, category: 'data' },
    'memory-economy': { label: 'Memory Economy', icon: <MonetizationOnIcon fontSize="small" />, category: 'analysis' },
    'player-journey': { label: 'Player Journey', icon: <RouteIcon fontSize="small" />, category: 'analysis' },
    'character-sociogram': { label: 'Character Sociogram', icon: <HubIcon fontSize="small" />, category: 'analysis' },
    'narrative-thread-tracker': { label: 'Narrative Threads', icon: <AutoStoriesIcon fontSize="small" />, category: 'analysis' },
    'resolution-path-analyzer': { label: 'Resolution Paths', icon: <AnalyticsIcon fontSize="small" />, category: 'analysis' },
    'element-puzzle-economy': { label: 'Element-Puzzle Flow', icon: <AccountTreeIcon fontSize="small" />, category: 'analysis' },
  };

  // Build breadcrumb items from current path
  const pathSegments = location.pathname.split('/').filter(segment => segment);
  const breadcrumbItems = [];

  // Always start with home/dashboard
  breadcrumbItems.push({
    label: 'Dashboard',
    path: '/',
    icon: <HomeIcon fontSize="small" />,
    category: 'overview'
  });

  // Add path segments
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const config = pathConfig[segment];
    
    if (config) {
      breadcrumbItems.push({
        label: config.label,
        path: currentPath,
        icon: config.icon,
        category: config.category,
        isCurrent: index === pathSegments.length - 1
      });
    } else if (!isNaN(segment)) {
      // Handle entity IDs (just show as ID, don't make clickable)
      breadcrumbItems.push({
        label: currentEntity ? currentEntity.name || `ID: ${segment}` : `ID: ${segment}`,
        path: null,
        icon: null,
        category: 'detail',
        isCurrent: index === pathSegments.length - 1
      });
    } else {
      // Handle unknown segments
      breadcrumbItems.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        path: currentPath,
        icon: null,
        category: 'other',
        isCurrent: index === pathSegments.length - 1
      });
    }
  });

  // Define related tools for each analysis category
  const getRelatedTools = (currentPath) => {
    const current = pathSegments[0];
    const analysisTools = [
      { label: 'Memory Economy', path: '/memory-economy', icon: <MonetizationOnIcon fontSize="small" /> },
      { label: 'Player Journey', path: '/player-journey', icon: <RouteIcon fontSize="small" /> },
      { label: 'Character Sociogram', path: '/character-sociogram', icon: <HubIcon fontSize="small" /> },
      { label: 'Narrative Threads', path: '/narrative-thread-tracker', icon: <AutoStoriesIcon fontSize="small" /> },
      { label: 'Resolution Paths', path: '/resolution-path-analyzer', icon: <AnalyticsIcon fontSize="small" /> },
      { label: 'Element-Puzzle Flow', path: '/element-puzzle-economy', icon: <AccountTreeIcon fontSize="small" /> },
    ];

    // Filter out current tool and show 3-4 most relevant alternatives
    const currentTool = analysisTools.find(tool => tool.path.includes(current));
    const relatedTools = analysisTools.filter(tool => tool.path !== location.pathname);

    // For analysis tools, show other analysis tools
    if (currentTool) {
      return relatedTools.slice(0, 4);
    }

    // For data views, show key analysis tools
    if (['characters', 'elements', 'puzzles', 'timelines'].includes(current)) {
      return [
        { label: 'Memory Economy', path: '/memory-economy', icon: <MonetizationOnIcon fontSize="small" /> },
        { label: 'Player Journey', path: '/player-journey', icon: <RouteIcon fontSize="small" /> },
        { label: 'Character Sociogram', path: '/character-sociogram', icon: <HubIcon fontSize="small" /> },
        { label: 'Narrative Threads', path: '/narrative-thread-tracker', icon: <AutoStoriesIcon fontSize="small" /> },
      ];
    }

    return [];
  };

  const relatedTools = showRelatedTools ? getRelatedTools(location.pathname) : [];

  return (
    <Box sx={{ 
      py: 1, 
      px: 2, 
      backgroundColor: 'background.paper',
      borderBottom: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 2
    }}>
      {/* Main Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ flex: 1 }}
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          if (isLast || !item.path) {
            return (
              <Typography 
                key={index}
                color="text.primary" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontWeight: isLast ? 600 : 400
                }}
              >
                {item.icon && <span style={{ marginRight: 4 }}>{item.icon}</span>}
                {item.label}
              </Typography>
            );
          }

          return (
            <Link
              key={index}
              component={RouterLink}
              to={item.path}
              underline="hover"
              color="inherit"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                '&:hover': {
                  color: 'primary.main'
                }
              }}
            >
              {item.icon && <span style={{ marginRight: 4 }}>{item.icon}</span>}
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>

      {/* Related Tools Quick Access */}
      {relatedTools.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Related:
          </Typography>
          {relatedTools.map((tool, index) => (
            <Chip
              key={index}
              component={RouterLink}
              to={tool.path}
              label={tool.label}
              icon={tool.icon}
              size="small"
              variant="outlined"
              clickable
              sx={{
                height: 24,
                fontSize: '0.7rem',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText'
                }
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default BreadcrumbNavigation;