import { useQuery } from 'react-query';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, Tooltip, Paper, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import TimelineIcon from '@mui/icons-material/Timeline';
import ExtensionIcon from '@mui/icons-material/Extension';
import InventoryIcon from '@mui/icons-material/Inventory';
import MemoryIcon from '@mui/icons-material/Memory'; // Specific for Memories
import DesignServicesIcon from '@mui/icons-material/DesignServices'; // For "To Design"
import ConstructionIcon from '@mui/icons-material/Construction'; // For "To Build"
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { Link as RouterLink } from 'react-router-dom';

function StatCard({ title, count, icon, color = "primary", navigateTo, queryParams, isLoading }) {
  const navigate = useNavigate();
  const handleClick = () => {
    if (navigateTo) {
      let path = navigateTo;
      if (queryParams) {
        path += `?${new URLSearchParams(queryParams).toString()}`;
      }
      navigate(path);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: navigateTo ? 'pointer' : 'default',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': navigateTo ? { transform: 'translateY(-4px)', boxShadow: (theme) => theme.shadows[4] } : {},
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={handleClick}
      elevation={2}
    >
      <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Box 
            sx={{ 
              bgcolor: `${color}.main`, // Use main color for icon background
              color: `${color}.contrastText`,
              p: 1.5,
              borderRadius: '50%', // Circular icon background
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: 1,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" color="text.primary" sx={{fontWeight: 500}}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: `${color}.dark`, textAlign: 'right' }}>
          {isLoading ? <CircularProgress size={36} color="inherit" /> : (count !== undefined ? count : 'N/A')}
        </Typography>
      </CardContent>
    </Card>
  );
}

const QuickAccessItem = ({ icon, text, to, queryParams }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    let path = to;
    if (queryParams) {
      path += `?${new URLSearchParams(queryParams).toString()}`;
    }
    navigate(path);
  };

  return (
    <ListItem disablePadding>
      <ListItemButton onClick={handleClick} sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover'} }}>
        <ListItemIcon sx={{minWidth: 36, color: 'primary.main'}}>{icon}</ListItemIcon>
        <ListItemText primary={text} />
      </ListItemButton>
    </ListItem>
  );
};

function Dashboard() {
  const { data: charactersData, isLoading: charactersLoading } = useQuery('charactersSummary', () => api.getCharacters({ limit: 1000 }), { staleTime: Infinity });
  const { data: timelineEventsData, isLoading: timelineLoading } = useQuery('timelineEventsSummary', () => api.getTimelineEvents({ limit: 1000 }), { staleTime: Infinity });
  const { data: puzzlesData, isLoading: puzzlesLoading } = useQuery('puzzlesSummary', () => api.getPuzzles({ limit: 1000 }), { staleTime: Infinity });
  const { data: elementsData, isLoading: elementsLoading } = useQuery('elementsSummary', () => api.getElements({ limit: 1000 }), { staleTime: Infinity });

  const charactersCount = charactersData?.length;
  const timelineEventsCount = timelineEventsData?.length;
  const puzzlesCount = puzzlesData?.length;
  const elementsCount = elementsData?.length;

  const memoryCount = elementsData?.filter(el => 
    el.basicType?.toLowerCase().includes('memory')
  )?.length;
  
  const elementsToDesignCount = elementsData?.filter(el => el.status === 'To Design').length;
  const elementsToBuildCount = elementsData?.filter(el => el.status === 'To Build').length;


  return (
    <Box>
      <PageHeader title="StoryForge Dashboard" />
      
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        Welcome to StoryForge. Here's a quick overview of your narrative project:
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats cards */}
        <Grid item xs={12} sm={6} md={4} lg={2.4}> {/* 5 cards per row on lg */}
          <StatCard title="Characters" count={charactersCount} icon={<PeopleIcon />} color="primary" navigateTo="/characters" isLoading={charactersLoading} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatCard title="Timeline Events" count={timelineEventsCount} icon={<TimelineIcon />} color="secondary" navigateTo="/timeline" isLoading={timelineLoading} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatCard title="Puzzles" count={puzzlesCount} icon={<ExtensionIcon />} color="success" navigateTo="/puzzles" isLoading={puzzlesLoading} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatCard title="Total Elements" count={elementsCount} icon={<InventoryIcon />} color="info" navigateTo="/elements" isLoading={elementsLoading}/>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatCard title="Memory Elements" count={memoryCount} icon={<MemoryIcon />} color="warning" navigateTo="/elements" queryParams={{ type: 'Memory' }} isLoading={elementsLoading} /> {/* Simplified query for "Memory" type */}
        </Grid>

        {/* Quick Access & Needs Attention */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }} elevation={2}>
            <Typography variant="h6" sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider', pb:1 }}>Quick Access</Typography>
            <List dense>
              <QuickAccessItem icon={<DesignServicesIcon />} text={`Elements "To Design" (${elementsToDesignCount ?? '...'})`} to="/elements" queryParams={{ status: 'To Design' }} />
              <QuickAccessItem icon={<ConstructionIcon />} text={`Elements "To Build" (${elementsToBuildCount ?? '...'})`} to="/elements" queryParams={{ status: 'To Build' }} />
              <QuickAccessItem icon={<PeopleIcon />} text="Core Characters" to="/characters" queryParams={{ tier: 'Core' }} />
              <QuickAccessItem icon={<ExtensionIcon />} text="Act 2 Puzzles" to="/puzzles" queryParams={{ timing: 'Act 2' }} />
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }} elevation={2}>
            <Typography variant="h6" sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider', pb:1  }}>Project Overview</Typography>
            <Typography variant="body1" sx={{mb:1}}>
              StoryForge helps you visualize and manage the intricate web of your immersive narrative.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the navigation on the left to dive into Characters, Timeline events, Puzzles, and Elements.
              The Relationship Mapper on detail pages will help you see connections.
              Editing features are planned for a future phase.
            </Typography>
             <Box sx={{mt:2, textAlign:'right'}}>
                <Tooltip title="Full Project Requirements Document (opens in new tab)">
                    <RouterLink to="/StoryForge PR.txt" target="_blank" rel="noopener noreferrer">
                        View PRD
                    </RouterLink>
                </Tooltip>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 