import React from 'react';
import {
  Box, FormControl, InputLabel, Select, MenuItem, Button, Grid, 
  Card, CardContent, Typography, Chip, Tooltip
} from '@mui/material';
import { getConstant } from '../hooks/useGameConstants';

function PuzzleFilters({
  actFocusFilter,
  onActFocusChange,
  availableThemes,
  selectedThemes,
  onThemeChange,
  onSelectAllThemes,
  selectedNarrativeThread,
  availableNarrativeThreads,
  onNarrativeThreadChange,
  gameConstants
}) {
  const actFocusOptions = getConstant(gameConstants, 'ACT_FOCUS_OPTIONS', [
    'Act 1',
    'Act 2', 
    'Act 3',
    'Multi-Act'
  ]);

  const selectedThemeCount = Object.values(selectedThemes).filter(Boolean).length;
  const allThemesSelected = selectedThemeCount === availableThemes.length;

  return (
    <Card elevation={1} sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Filter Puzzles
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          {/* Act Focus Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="act-focus-label">Act Focus</InputLabel>
              <Select
                labelId="act-focus-label"
                id="act-focus-select"
                value={actFocusFilter}
                label="Act Focus"
                onChange={onActFocusChange}
              >
                <MenuItem value="All Acts">All Acts</MenuItem>
                {actFocusOptions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Narrative Thread Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="narrative-thread-label">Narrative Thread</InputLabel>
              <Select
                labelId="narrative-thread-label"
                id="narrative-thread-select"
                value={selectedNarrativeThread}
                label="Narrative Thread"
                onChange={onNarrativeThreadChange}
              >
                <MenuItem value="All Threads">All Threads</MenuItem>
                {availableNarrativeThreads.map(thread => (
                  <MenuItem key={thread} value={thread}>
                    {thread}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Theme Selection Controls */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onSelectAllThemes(true)}
                disabled={allThemesSelected}
              >
                Select All
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onSelectAllThemes(false)}
                disabled={selectedThemeCount === 0}
              >
                Clear All
              </Button>
            </Box>
          </Grid>

          {/* Filter Summary */}
          <Grid item xs={12} sm={6} md={3}>
            <Tooltip title="Active filters">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Filters:
                </Typography>
                <Chip 
                  label={`${selectedThemeCount} themes`}
                  size="small"
                  color={selectedThemeCount < availableThemes.length ? "primary" : "default"}
                />
              </Box>
            </Tooltip>
          </Grid>
        </Grid>

        {/* Theme Chips */}
        {availableThemes.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom id="theme-label">
              Theme
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }} role="group" aria-labelledby="theme-label">
              {availableThemes.map(theme => (
                <Chip
                  key={theme}
                  label={theme}
                  size="small"
                  clickable
                  color={selectedThemes[theme] ? "primary" : "default"}
                  variant={selectedThemes[theme] ? "filled" : "outlined"}
                  onClick={() => onThemeChange(theme)}
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default PuzzleFilters;