import { createTheme } from '@mui/material/styles';

// Create a custom theme for StoryForge
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1e88e5', // A vibrant blue
      light: '#90caf9', // Lighter blue for links or highlights
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff5722', // Deep orange for secondary actions or highlights
      light: '#ff8a65',
      dark: '#e64a19',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0a0a0a', // Slightly darker default background
      paper: '#161616', // Paper color slightly distinct from default
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.90)', // Brighter primary text
      secondary: 'rgba(255, 255, 255, 0.65)', // Brighter secondary text
      disabled: 'rgba(255, 255, 255, 0.38)',
    },
    success: {
      main: '#4caf50',
      contrastText: '#ffffff',
    },
    error: {
      main: '#f44336',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ff9800',
      contrastText: 'rgba(0, 0, 0, 0.87)', // Ensure contrast for warning text
    },
    info: {
      main: '#2196f3',
      contrastText: '#ffffff',
    },
    divider: 'rgba(255, 255, 255, 0.20)', // More visible divider
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.8rem', // Slightly larger
      fontWeight: 500,
      letterSpacing: '-0.5px',
    },
    h2: {
      fontSize: '2.2rem',
      fontWeight: 500,
      letterSpacing: '-0.25px',
    },
    h3: {
      fontSize: '1.9rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.6rem', // PageHeader title - bolder
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.3rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1.1rem', // AppBar title, Card titles
      fontWeight: 500,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      color: 'rgba(255, 255, 255, 0.75)', // Slightly softer for subtitles
    },
    subtitle2: {
      fontSize: '0.8rem', // Slightly smaller for compactness
      fontWeight: 600,
      color: 'rgba(255, 255, 255, 0.6)', // Softer label color
      textTransform: 'uppercase',
      letterSpacing: '0.75px',
      display: 'block', // Ensure it takes full width for alignment
      marginBottom: '2px',
    },
    body1: {
      fontSize: '0.95rem', // Slightly smaller body text for better density
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.85rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      color: 'rgba(255, 255, 255, 0.5)',
    },
  },
  shape: {
    borderRadius: 6, // Slightly less rounded for a more "tool" feel
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Keep as is, good choice
          borderRadius: 4, // Consistent with shape.borderRadius
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)', // Add subtle shadow
          backgroundColor: '#161616', // Match paper
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#101010', // Slightly darker drawer
          borderRight: '1px solid rgba(255, 255, 255, 0.12)', // Subtle border
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Ensure no gradient artifacts from MUI default
        },
      },
      defaultProps: {
        elevation: 2, // Default paper elevation for more depth
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1a1a1a' // Slightly different card bg
        },
      },
      defaultProps: {
        elevation: 3,
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#2c2c2c', // Darker tooltip
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '0.8rem',
          border: '1px solid rgba(255,255,255,0.2)'
        },
        arrow: {
          color: '#2c2c2c',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          padding: '2px 4px', // More compact chips
          height: 'auto',
          fontSize: '0.75rem',
        },
        icon: {
          marginLeft: '3px',
          marginRight: '-2px',
          fontSize: '1rem',
        }
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(30, 136, 229, 0.20)', // Slightly more prominent selection
            borderLeft: `3px solid ${'#1e88e5'}`, // Primary main for border
            paddingLeft: 'calc(1.5rem - 3px)', // Adjust padding for border
            '&:hover': {
              backgroundColor: 'rgba(30, 136, 229, 0.25)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)', // Subtle hover
          }
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          padding: '12px 16px', // Adjust tab padding
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.15)' // Slightly lighter divider
        }
      }
    }
  },
});

export default theme; 