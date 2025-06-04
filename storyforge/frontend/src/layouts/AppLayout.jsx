import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  Tooltip,
  Modal,
  TextField,
  List as MUIList,
  ListItem as MUIListItem,
  ListItemText as MUIListItemText,
  CircularProgress,
  InputAdornment,
  Alert,
  Link as MuiLink,
  Paper,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import TimelineIcon from '@mui/icons-material/Timeline';
import ExtensionIcon from '@mui/icons-material/Extension';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'; // Import chosen icon
import { Link as RouterLink } from 'react-router-dom';
import { api } from '../services/api';

const drawerWidth = 240;

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Characters', icon: <PeopleIcon />, path: '/characters' },
  { text: 'Timeline Events', icon: <TimelineIcon />, path: '/timelines' }, // Changed "Timelines" to "Timeline Events"
  { text: 'Puzzles', icon: <ExtensionIcon />, path: '/puzzles' },
  { text: 'Elements', icon: <InventoryIcon />, path: '/elements' },
  { text: 'Memory Economy', icon: <MonetizationOnIcon />, path: '/memory-economy' },
];

const getIconForType = (type) => {
  switch (type) {
    case 'characters': return <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'primary.light' }} />;
    case 'timeline': return <TimelineIcon fontSize="small" sx={{ mr: 1, color: 'secondary.light' }} />;
    case 'puzzles': return <ExtensionIcon fontSize="small" sx={{ mr: 1, color: 'success.light' }} />;
    case 'elements': return <InventoryIcon fontSize="small" sx={{ mr: 1, color: 'info.light' }} />;
    default: return null;
  }
};

// AppBar height constants
const APP_BAR_MOBILE = 56;
const APP_BAR_DESKTOP = 64;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isMobile' })(
  ({ theme, open, isMobile }) => ({
    flexGrow: 1,
    // Padding top is now handled by a Toolbar spacer in the Main content
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: isMobile ? 0 : (open ? 0 : `-${drawerWidth}px`), // Adjust based on drawer state for desktop
    minHeight: '100vh',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',

    ...(open && !isMobile && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      // marginLeft: 0, // Already handled by the ternary above
    }),
  }),
);

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isMobile',
})(({ theme, open, isMobile }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(!isMobile && open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

export default function AppLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const navigate = useNavigate();
  const location = useLocation();

  const [searchValue, setSearchValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    if (!isMobile && !open) {
      setOpen(true);
    } else if (isMobile && open) {
      setOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setOpen(false);
    }
  };

  const performSearch = useCallback(async () => {
    if (searchValue.trim()) {
      setSearchLoading(true);
      setSearchError(null);
      setSearchResults(null);
      setSearchOpen(true);
      try {
        const results = await api.globalSearch(searchValue.trim());
        setSearchResults(results);
      } catch (err) {
        console.error("Search error:", err);
        setSearchError(err.message || 'Error searching. Please try again.');
      } finally {
        setSearchLoading(false);
      }
    }
  }, [searchValue]);

  const handleSearchInputChange = (e) => setSearchValue(e.target.value);
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); performSearch(); }
    if (e.key === 'Escape') { setSearchOpen(false); }
  };
  const handleSearchIconClick = () => performSearch();
  const handleCloseModal = () => setSearchOpen(false);

  const handleResultClick = (type, id) => {
    let path = '';
    switch (type) {
      case 'characters': path = `/characters/${id}`; break;
      case 'timeline': path = `/timelines/${id}`; break;
      case 'puzzles': path = `/puzzles/${id}`; break;
      case 'elements': path = `/elements/${id}`; break;
      default: return;
    }
    navigate(path);
    handleCloseModal();
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const drawerContent = (
    <>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', px: [2], minHeight: { xs: APP_BAR_MOBILE, sm: APP_BAR_DESKTOP } }}>
        <MuiLink component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>StoryForge</Typography>
        </MuiLink>
        {isMobile && open && (
          <IconButton onClick={handleDrawerToggle} aria-label="close drawer" sx={{ ml: 'auto' }}><ChevronLeftIcon /></IconButton>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ pt: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block', px: 1, mb: 0.5 }}>
            <Tooltip title={item.text} placement="right" disableHoverListener={open}>
              <ListItemButton
                selected={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))}
                onClick={() => handleNavigation(item.path)}
                sx={{ minHeight: 44, justifyContent: 'initial', px: 1.5, borderRadius: theme.shape.borderRadius - 2 }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))) ? theme.palette.primary.light : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0, color: 'text.primary', whiteSpace: 'nowrap' }} />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      <StyledAppBar position="fixed" open={open} isMobile={isMobile}>
        <Toolbar sx={{minHeight: { xs: APP_BAR_MOBILE, sm: APP_BAR_DESKTOP }}}> {/* Ensure Toolbar height matches */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, ...(!isMobile && open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />
          <TextField
            id="global-search-input"
            size="small" variant="outlined" placeholder="Search (Ctrl+K)"
            value={searchValue} onChange={handleSearchInputChange} onKeyDown={handleSearchKeyDown}
            aria-label="Global search"
            sx={{
              bgcolor: 'rgba(255,255,255,0.08)', borderRadius: theme.shape.borderRadius - 2,
              minWidth: { xs: 150, sm: 220, md: 280 }, transition: 'background-color 0.3s',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255,255,255,0.23)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.light, boxShadow: `0 0 0 2px ${theme.palette.primary.main}33` },
              },
            }}
            InputProps={{
              startAdornment: (<InputAdornment position="start" sx={{ pl: 0.5 }}><IconButton onClick={handleSearchIconClick} edge="start" aria-label="perform search" size="small" sx={{ color: 'text.secondary' }}><SearchIcon /></IconButton></InputAdornment>),
            }}
          />
        </Toolbar>
      </StyledAppBar>
      
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={open}
        onClose={isMobile ? handleDrawerToggle : undefined}
        ModalProps={{ keepMounted: true }}
      >
        {drawerContent}
      </Drawer>

      <Main open={open} isMobile={isMobile}>
        <Toolbar sx={{display: {xs: 'block', sm: 'block'}}} /> {/* Spacer for fixed AppBar */}
        <Box sx={{ flexGrow:1, p: { xs: 1.5, sm: 2, md: 2.5 } }}> 
            {children}
        </Box>
      </Main>

      <Modal open={searchOpen} onClose={handleCloseModal} aria-labelledby="search-modal-title">
        <Paper sx={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: { xs: '90%', sm: 550, md: 650 }, bgcolor: 'background.paper', borderRadius: 1.5, boxShadow: 24, p: { xs: 2, sm: 3 }, maxHeight: '70vh', overflowY: 'auto' }}>
          <Typography variant="h6" component="h2" id="search-modal-title" sx={{ mb: 2 }}>Search Results for: <Typography component="span" sx={{ fontWeight: 'bold' }}>{searchValue}</Typography></Typography>
          {searchLoading && (<Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>)}
          {searchError && <Alert severity="error" sx={{ my: 2 }}>{searchError}</Alert>}
          {!searchLoading && !searchError && searchResults && Object.keys(searchResults).every(key => searchResults[key].length === 0) && (<Typography sx={{ my: 3, textAlign: 'center', color: 'text.secondary' }}>No results found. Try a different search term.</Typography>)}
          {!searchLoading && !searchError && searchResults && (Object.entries(searchResults).map(([type, items]) => (
            items.length > 0 && (
              <Box key={type} sx={{ mb: 2.5 }}>
                <Typography variant="overline" sx={{ display: 'block', color: 'text.secondary', borderBottom: 1, borderColor: 'divider', pb: 0.5, mb: 1, fontWeight: 'medium' }}>{type.charAt(0).toUpperCase() + type.slice(1)} ({items.length})</Typography> {/* Capitalized type */}
                <MUIList dense>
                  {items.map((item) => (
                    <MUIListItem button key={`${type}-${item.id}`} onClick={() => handleResultClick(type, item.id)} sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover' }, mb: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36, mr: 0.5 }}>{getIconForType(type) || <Box sx={{ width: 20 }} />}</ListItemIcon>
                      <MUIListItemText primaryTypographyProps={{ sx: { fontWeight: 500 } }} primary={item.name || item.puzzle || item.description || 'Unknown Item'} secondary={`ID: ${item.id}`} />
                    </MUIListItem>
                  ))}
                </MUIList>
              </Box>
            )
          )))}
        </Paper>
      </Modal>
    </Box>
  );
} 