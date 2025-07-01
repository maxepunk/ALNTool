import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import InfoIcon from '@mui/icons-material/Info';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const ControlsPanel = ({ 
  ui, 
  onZoomIn, 
  onZoomOut, 
  onFitView,
  dependencyAnalysisMode = false
}) => {
  return (
    <>
      <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
        <Typography variant="subtitle1" sx={{fontWeight: 600}}>
          {dependencyAnalysisMode ? 'Production Controls' : 'Controls'}
        </Typography>
        <Tooltip title="Map Information & Help">
          <IconButton onClick={ui.openInfoModal} size="small"> <InfoIcon /> </IconButton>
        </Tooltip>
      </Box>
      
      <Divider sx={{my:1}}/>
      
      <Typography variant="caption" display="block" gutterBottom>View</Typography>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, justifyContent: 'center' }}>
        <Tooltip title="Zoom In"><IconButton onClick={onZoomIn} size="small"><ZoomInIcon /></IconButton></Tooltip>
        <Tooltip title="Zoom Out"><IconButton onClick={onZoomOut} size="small"><ZoomOutIcon /></IconButton></Tooltip>
        <Tooltip title="Fit View"><IconButton onClick={onFitView} size="small"><FitScreenIcon /></IconButton></Tooltip>
      </Box>
      <Divider sx={{my:1}}/>

      <Typography variant="caption" display="block" id="depth-slider-label" gutterBottom>
        Exploration Depth: {ui.depth}
      </Typography>
      <Slider 
        size="small" 
        value={ui.depth} 
        onChange={(e, newValue) => ui.setDepth(newValue)} 
        aria-labelledby="depth-slider-label" 
        valueLabelDisplay="auto" 
        step={1} 
        marks 
        min={1} 
        max={ui.maxDepth || 3} 
        sx={{mb:1.5, mx: 0.5}}
      />
      <Divider sx={{my:1}}/>

      <Typography variant="caption" display="block" gutterBottom>Filter Nodes by Type</Typography>
      <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5}}>
        {Object.entries(ui.nodeFilters || {}).map(([type, checked]) => (
          <Chip 
            key={type} 
            icon={checked ? <CheckBoxIcon fontSize="small"/> : <CheckBoxOutlineBlankIcon fontSize="small"/>} 
            label={type} 
            onClick={() => ui.toggleNodeFilter(type)} 
            size="small" 
            color={checked ? "primary" : "default"} 
            variant={checked ? "filled" : "outlined"}
          />
        ))}
      </Box>
      <Divider sx={{my:1}}/>
      
      {/* Act Focus Filter */}
      <Typography variant="caption" display="block" gutterBottom>Filter by Act Focus</Typography>
      <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
        <InputLabel id="act-focus-filter-label">Act Focus</InputLabel>
        <Select
          labelId="act-focus-filter-label"
          value={ui.actFocusFilter}
          label="Act Focus"
          onChange={(e) => ui.setActFocusFilter(e.target.value)}
        >
          <MenuItem value="All">All Acts</MenuItem>
          <MenuItem value="Act 1">Act 1</MenuItem>
          <MenuItem value="Act 2">Act 2</MenuItem>
          <MenuItem value="Act 3">Act 3</MenuItem>
        </Select>
      </FormControl>
      <Divider sx={{my:1}}/>

      {/* Theme Filters */}
      <Typography variant="caption" display="block" gutterBottom>Filter by Theme</Typography>
      <Box sx={{display: 'flex', gap: 0.5, mb: 0.5}}>
        <Button size="small" onClick={() => ui.setAllThemeFilters(true)} sx={{fontSize: '0.7rem', mr:0.5}}>All</Button>
        <Button size="small" onClick={() => ui.setAllThemeFilters(false)} sx={{fontSize: '0.7rem'}}>None</Button>
      </Box>
      <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5}}>
        {ui.availableThemes.map((themeName) => (
          <Chip
            key={themeName}
            label={themeName}
            onClick={() => ui.toggleThemeFilter(themeName)}
            size="small"
            color={ui.themeFilters[themeName] ? "info" : "default"}
            variant={ui.themeFilters[themeName] ? "filled" : "outlined"}
          />
        ))}
      </Box>
      <Divider sx={{my:1}}/>

      {/* Memory Set Filter */}
      <Typography variant="caption" display="block" gutterBottom>Filter by Memory Set</Typography>
      <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
        <InputLabel id="memory-set-filter-label">Memory Set</InputLabel>
        <Select
          labelId="memory-set-filter-label"
          value={ui.memorySetFilter}
          label="Memory Set"
          onChange={(e) => ui.setMemorySetFilter(e.target.value)}
        >
          <MenuItem value="All">All Sets</MenuItem>
          {ui.availableMemorySets.map((setName) => (
            <MenuItem key={setName} value={setName}>{setName}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Divider sx={{my:1}}/>

      <Typography variant="caption" display="block" gutterBottom>Filter Edges by Type</Typography>
      <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5}}>
        {Object.entries(ui.edgeFilters || {}).map(([type, checked]) => (
          <Chip 
            key={type} 
            label={type.charAt(0).toUpperCase() + type.slice(1)} 
            onClick={() => ui.toggleEdgeFilter(type)} 
            size="small" 
            color={checked ? "secondary" : "default"} 
            variant={checked ? "filled" : "outlined"} 
            icon={checked ? <CheckBoxIcon fontSize="small"/> : <CheckBoxOutlineBlankIcon fontSize="small"/>}
          />
        ))}
      </Box>
      <Divider sx={{my:1}}/>

      <Tooltip title={ui.showLowSignal ? "Low signal items are visible" : "Low signal items are hidden"}>
        <Button 
          variant="outlined" 
          size="small" 
          fullWidth 
          onClick={ui.toggleShowLowSignal} 
          startIcon={ui.showLowSignal ? <VisibilityIcon /> : <VisibilityOffIcon />}
        >
          {ui.showLowSignal ? 'Show All Connections' : 'Focus on Key Links'}
        </Button>
      </Tooltip>
    </>
  );
};

ControlsPanel.propTypes = {
  ui: PropTypes.shape({
    depth: PropTypes.number.isRequired,
    setDepth: PropTypes.func.isRequired,
    maxDepth: PropTypes.number,
    nodeFilters: PropTypes.object,
    toggleNodeFilter: PropTypes.func.isRequired,
    edgeFilters: PropTypes.object,
    toggleEdgeFilter: PropTypes.func.isRequired,
    showLowSignal: PropTypes.bool.isRequired,
    toggleShowLowSignal: PropTypes.func.isRequired,
    openInfoModal: PropTypes.func.isRequired,
    actFocusFilter: PropTypes.string.isRequired,
    setActFocusFilter: PropTypes.func.isRequired,
    availableThemes: PropTypes.arrayOf(PropTypes.string).isRequired,
    themeFilters: PropTypes.object.isRequired,
    toggleThemeFilter: PropTypes.func.isRequired,
    setAllThemeFilters: PropTypes.func.isRequired,
    availableMemorySets: PropTypes.arrayOf(PropTypes.string).isRequired,
    memorySetFilter: PropTypes.string.isRequired,
    setMemorySetFilter: PropTypes.func.isRequired,
  }).isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
  onFitView: PropTypes.func.isRequired,
  dependencyAnalysisMode: PropTypes.bool,
};

export default ControlsPanel;