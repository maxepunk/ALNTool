import { useQuery } from 'react-query';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, Tooltip, Paper, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import TimelineIcon from '@mui/icons-material/Timeline';
import ExtensionIcon from '@mui/icons-material/Extension';
import InventoryIcon from '@mui/icons-material/Inventory';
import MemoryIcon from '@mui/icons-material/Memory';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import ConstructionIcon from '@mui/icons-material/Construction';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import CategoryIcon from '@mui/icons-material/Category';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'; // Added import
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { Link as RouterLink } from 'react-router-dom';
import { Divider } from '@mui/material'; // Added Divider

function StatCard({ title, count, icon, color = "primary", navigateTo, queryParams, isLoading, warning = false }) {
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

  // New queries for "Needs Attention"
  const { data: puzzlesWithWarningsData, isLoading: puzzlesWarningsLoading } = useQuery('puzzlesWithWarnings', api.getPuzzlesWithWarnings);
  const { data: elementsWithWarningsData, isLoading: elementsWarningsLoading } = useQuery('elementsWithWarnings', api.getElementsWithWarnings);
  const { data: charactersWithWarningsData, isLoading: charactersWarningsLoading } = useQuery('charactersWithWarnings', api.getCharactersWithWarnings); // New fetch

  const charactersCount = charactersData?.length;
  const timelineEventsCount = timelineEventsData?.length;
  const puzzlesCount = puzzlesData?.length;
  const elementsCount = elementsData?.length;

  const memoryCount = elementsData?.filter(el => 
    el.properties?.basicType?.toLowerCase().includes('memory') || el.properties?.basicType?.toLowerCase().includes('token')
  )?.length;
  
  const elementsToDesignCount = elementsData?.filter(el => el.properties?.status === 'To Design').length;
  const elementsToBuildCount = elementsData?.filter(el => el.properties?.status === 'To Build').length;

  const puzzlesNoRewardsCount = puzzlesWithWarningsData?.filter(p => p.warnings.some(w => w.warningType === 'NoRewards')).length; // This specific count might be removed if the card shows total items with warnings
  const puzzlesNoInputsCount = puzzlesWithWarningsData?.filter(p => p.warnings.some(w => w.warningType === 'NoInputs')).length; // This specific count might be removed

  // Updated count for the StatCard to reflect total items with any warning
  const attentionItemsCount = (puzzlesWithWarningsData?.length || 0) +
                              (elementsWithWarningsData?.length || 0) +
                              (charactersWithWarningsData?.length || 0);
  const attentionItemsLoading = puzzlesWarningsLoading || elementsWarningsLoading || charactersWarningsLoading;


  const navigate = useNavigate();

  return (
    <Box>
      <PageHeader title="StoryForge Dashboard" />
      
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        Welcome to StoryForge. Here's a quick overview and key areas needing attention:
      </Typography>
      
      <Grid container spacing={2.5}> {/* Increased spacing slightly */}
        {/* Stats cards */}
        <Grid item xs={12} sm={4} md={3} lg={2}>
          <StatCard title="Characters" count={charactersCount} icon={<PeopleIcon />} color="primary" navigateTo="/characters" isLoading={charactersLoading} />
        </Grid>
        <Grid item xs={12} sm={4} md={3} lg={2}>
          <StatCard title="Timeline Events" count={timelineEventsCount} icon={<TimelineIcon />} color="secondary" navigateTo="/timelines" isLoading={timelineLoading} />
        </Grid>
        <Grid item xs={12} sm={4} md={3} lg={2}>
          <StatCard title="Puzzles" count={puzzlesCount} icon={<ExtensionIcon />} color="success" navigateTo="/puzzles" isLoading={puzzlesLoading} />
        </Grid>
        <Grid item xs={12} sm={4} md={3} lg={2}>
          <StatCard title="Elements" count={elementsCount} icon={<InventoryIcon />} color="info" navigateTo="/elements" isLoading={elementsLoading}/>
        </Grid>
        <Grid item xs={12} sm={4} md={3} lg={2}>
          <StatCard title="Memory Tokens" count={memoryCount} icon={<MemoryIcon />} color="warning" navigateTo="/elements" queryParams={{ type: 'Memory Token Video' }} isLoading={elementsLoading} />
        </Grid>
        {/* New Stat cards for warnings */}
        <Grid item xs={12} sm={4} md={3} lg={2}>
          <StatCard title="Attention Items" count={attentionItemsCount} icon={<ReportProblemIcon />} color="error" isLoading={attentionItemsLoading} warning />
        </Grid>

        {/* Needs Attention Section */}
        <Grid item xs={12} md={6} lg={7}>
          <Paper sx={{ p: 2, height: '100%' }} elevation={2}>
            <Typography variant="h6" sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider', pb:1 }}>Needs Attention</Typography>
            {attentionItemsLoading ? <CircularProgress /> : (
              <>
                <Typography variant="subtitle2" sx={{mt:1, fontWeight:'medium'}}>Puzzles ({puzzlesWithWarningsData?.length || 0}):</Typography>
                {puzzlesWithWarningsData && puzzlesWithWarningsData.length > 0 ? (
                  <List dense disablePadding>
                    {puzzlesWithWarningsData.map(puzzle => (
                      <ListItemButton key={`puzzle-${puzzle.id}`} onClick={() => navigate(`/puzzles/${puzzle.id}`)} sx={{borderRadius: 1, mb:0.5}}>
                        <ListItemIcon sx={{minWidth: 32}}><ExtensionIcon fontSize="small" color="action"/></ListItemIcon>
                        <ListItemText
                          primary={puzzle.name}
                          // secondary={puzzle.warnings.map(w => w.message).join('; ')} // Keep message for tooltip later if needed
                          // secondaryTypographyProps={{color: 'text.secondary'}}
                        />
                        <Box sx={{display: 'flex', gap: 0.5, flexWrap: 'wrap'}}>
                          {puzzle.warnings.map(w => <Chip key={w.warningType} label={w.warningType} size="small" color="error" variant="outlined"/>)}
                        </Box>
                      </ListItemButton>
                    ))}
                  </List>
                ) : <Typography variant="body2" color="text.secondary" sx={{pl:2, py:1}}>No puzzles require attention at this time.</Typography>}

                <Divider sx={{my:1.5}}/>
                <Typography variant="subtitle2" sx={{mt:1, fontWeight:'medium'}}>Elements ({elementsWithWarningsData?.length || 0}):</Typography>
                {elementsWithWarningsData && elementsWithWarningsData.length > 0 ? (
                  <List dense disablePadding>
                    {elementsWithWarningsData.map(element => (
                       <ListItemButton key={`element-${element.id}`} onClick={() => navigate(`/elements/${element.id}`)} sx={{borderRadius: 1, mb:0.5}}>
                         <ListItemIcon sx={{minWidth: 32}}><InventoryIcon fontSize="small" color="action"/></ListItemIcon>
                        <ListItemText
                          primary={element.name}
                          // secondary={element.warnings.map(w => w.message).join('; ')}
                          // secondaryTypographyProps={{color: 'text.secondary'}}
                        />
                         <Box sx={{display: 'flex', gap: 0.5, flexWrap: 'wrap'}}>
                          {element.warnings.map(w => <Chip key={w.warningType} label={w.warningType} size="small" color="warning" variant="outlined"/>)}
                        </Box>
                      </ListItemButton>
                    ))}
                  </List>
                ) : <Typography variant="body2" color="text.secondary" sx={{pl:2, py:1}}>No elements require attention at this time.</Typography>}

                <Divider sx={{my:1.5}}/>
                <Typography variant="subtitle2" sx={{mt:1, fontWeight:'medium'}}>Characters ({charactersWithWarningsData?.length || 0}):</Typography>
                {charactersWithWarningsData && charactersWithWarningsData.length > 0 ? (
                  <List dense disablePadding>
                    {charactersWithWarningsData.map(character => (
                       <ListItemButton key={`char-${character.id}`} onClick={() => navigate(`/characters/${character.id}`)} sx={{borderRadius: 1, mb:0.5}}>
                         <ListItemIcon sx={{minWidth: 32}}><PeopleIcon fontSize="small" color="action"/></ListItemIcon>
                        <ListItemText
                          primary={character.name}
                        />
                         <Box sx={{display: 'flex', gap: 0.5, flexWrap: 'wrap'}}>
                          {character.warnings.map(w => <Chip key={w.warningType} label={w.warningType} size="small" color="secondary" variant="outlined"/>)}
                        </Box>
                      </ListItemButton>
                    ))}
                  </List>
                ) : <Typography variant="body2" color="text.secondary" sx={{pl:2, py:1}}>No characters require attention at this time.</Typography>}
              </>
            )}
          </Paper>
        </Grid>

        {/* Quick Access & Design Workspaces (combined or adjusted) */}
        <Grid item xs={12} md={6} lg={5}>
          <Paper sx={{ p: 2, height: '100%' }} elevation={2}>
            <Typography variant="h6" sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider', pb:1 }}>Quick Access</Typography>
            <List dense>
              <QuickAccessItem icon={<DesignServicesIcon />} text={`Elements "To Design" (${elementsToDesignCount ?? '...'})`} to="/elements" queryParams={{ status: 'To Design' }} />
              <QuickAccessItem icon={<ConstructionIcon />} text={`Elements "To Build" (${elementsToBuildCount ?? '...'})`} to="/elements" queryParams={{ status: 'To Build' }} />
              <QuickAccessItem icon={<PeopleIcon />} text="Core Characters" to="/characters" queryParams={{ tier: 'Core' }} />
              <QuickAccessItem icon={<ExtensionIcon />} text="Act 2 Puzzles" to="/puzzles" queryParams={{ actFocus: 'Act 2' }} /> {/* Assuming actFocus is the param now */}
              <QuickAccessItem icon={<MemoryIcon />} text="Memory Economy" to="/memory-economy" />
            </List>
            <Divider sx={{my: 2}}/>
            <Typography variant="h6" sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider', pb:1 }}>Design Workspaces</Typography>
            <List dense>
              <QuickAccessItem icon={<CategoryIcon />} text="Puzzle Flow View" to="/puzzles" />
              <QuickAccessItem icon={<MonetizationOnIcon />} text="Element Economy for Puzzles" to="/element-puzzle-economy" />
              <QuickAccessItem icon={<CategoryIcon />} text="Resolution Path Analyzer" to="/resolution-path-analyzer" /> {/* Updated link and text */}
              <QuickAccessItem icon={<PeopleIcon />} text="Character Arc Mapper" to="/character-sociogram" />
              <QuickAccessItem icon={<TimelineIcon />} text="Narrative Thread Tracker" to="/narrative-thread-tracker" />
            </List>
            <Typography variant="caption" color="text.secondary" sx={{display: 'block', textAlign: 'center', mt:1}}>(Specialized views coming soon)</Typography>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}

export default Dashboard;