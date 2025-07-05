import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Box, Button, Chip
} from '@mui/material';
import { getConstant } from '../hooks/useGameConstants';

const ElementFilters = ({
  elementType, status, firstAvailable, actFocusFilter,
  availableThemes, selectedThemes, availableMemorySets, selectedMemorySet,
  onTypeChange, onStatusChange, onFirstAvailableChange, onActFocusChange,
  onThemeChange, onSelectAllThemes, onMemorySetChange,
  gameConstants
}) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
        Production Filters
      </Typography>
      <Grid container spacing={2}>
        {/* Existing Filters */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="element-type-label">Element Type</InputLabel>
            <Select 
              labelId="element-type-label" 
              value={elementType} 
              label="Element Type" 
              onChange={onTypeChange}
            >
              {['All Types'].concat(getConstant(gameConstants, 'ELEMENTS.CATEGORIES', ['Prop', 'Set Dressing', 'Memory Token Video', 'Character Sheet'])).map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="element-status-label">Status</InputLabel>
            <Select 
              labelId="element-status-label" 
              value={status} 
              label="Status" 
              onChange={onStatusChange}
            >
              {['All Statuses'].concat(getConstant(gameConstants, 'ELEMENTS.STATUS_TYPES', ['Ready for Playtest', 'Done', 'In development', 'Idea/Placeholder', 'Source Prop/print', 'To Design', 'To Build', 'Needs Repair'])).map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="element-first-available-label">First Available</InputLabel>
            <Select 
              labelId="element-first-available-label" 
              value={firstAvailable} 
              label="First Available" 
              onChange={onFirstAvailableChange}
            >
              {['All Acts', 'Act 0'].concat(getConstant(gameConstants, 'ACTS.TYPES', ['Act 1', 'Act 2'])).concat(['Act 3']).map((fa) => (
                <MenuItem key={fa} value={fa}>{fa}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* New Act Focus Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="element-act-focus-label">Act Focus</InputLabel>
            <Select 
              labelId="element-act-focus-label" 
              value={actFocusFilter} 
              label="Act Focus" 
              onChange={onActFocusChange}
            >
              {['All Acts'].concat(getConstant(gameConstants, 'ACTS.TYPES', ['Act 1', 'Act 2'])).concat(['Act 3']).map((act) => (
                <MenuItem key={act} value={act}>{act}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* New Memory Set Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="element-memory-set-label">Memory Set</InputLabel>
            <Select 
              labelId="element-memory-set-label" 
              value={selectedMemorySet} 
              label="Memory Set" 
              onChange={onMemorySetChange}
            >
              <MenuItem value="All Sets">All Sets</MenuItem>
              {availableMemorySets.map((set) => (
                <MenuItem key={set} value={set}>{set}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* New Themes Filter */}
        <Grid item xs={12} md={9}> {/* Wider for theme chips */}
          <Typography variant="caption" display="block" sx={{ mb: 0.5, ml: 0.5 }}>
            Filter by Themes
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => onSelectAllThemes(true)} 
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              All
            </Button>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => onSelectAllThemes(false)} 
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              None
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {availableThemes.map((theme) => (
              <Chip
                key={theme}
                label={theme}
                clickable
                onClick={() => onThemeChange(theme)}
                color={selectedThemes[theme] ? 'primary' : 'default'}
                variant={selectedThemes[theme] ? 'filled' : 'outlined'}
                size="small"
              />
            ))}
            {availableThemes.length === 0 && (
              <Typography variant="caption" color="textSecondary">
                No themes found in current data.
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

ElementFilters.propTypes = {
  elementType: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  firstAvailable: PropTypes.string.isRequired,
  actFocusFilter: PropTypes.string.isRequired,
  availableThemes: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedThemes: PropTypes.object.isRequired,
  availableMemorySets: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedMemorySet: PropTypes.string.isRequired,
  onTypeChange: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onFirstAvailableChange: PropTypes.func.isRequired,
  onActFocusChange: PropTypes.func.isRequired,
  onThemeChange: PropTypes.func.isRequired,
  onSelectAllThemes: PropTypes.func.isRequired,
  onMemorySetChange: PropTypes.func.isRequired,
  gameConstants: PropTypes.object.isRequired,
};

export default ElementFilters;