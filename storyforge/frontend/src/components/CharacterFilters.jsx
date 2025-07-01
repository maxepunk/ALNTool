import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper, Typography, Grid, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { getConstant } from '../hooks/useGameConstants';

const CharacterFilters = ({
  typeFilter,
  tierFilter,
  pathFilter,
  onTypeFilterChange,
  onTierFilterChange,
  onPathFilterChange,
  gameConstants
}) => {
  return (
    <Paper sx={{ p: {xs: 1.5, sm:2}, mb: 2.5 }} elevation={1}>
      <Typography variant="subtitle1" gutterBottom sx={{fontWeight: 'medium'}}>
        Production Filters
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="character-type-label">Type</InputLabel>
            <Select
              labelId="character-type-label"
              value={typeFilter}
              label="Type"
              onChange={onTypeFilterChange}
            >
              {['All Types'].concat(getConstant(gameConstants, 'CHARACTERS.TYPES', ['Player', 'NPC'])).map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="character-tier-label">Tier</InputLabel>
            <Select
              labelId="character-tier-label"
              value={tierFilter}
              label="Tier"
              onChange={onTierFilterChange}
            >
              {['All Tiers'].concat(getConstant(gameConstants, 'CHARACTERS.TIERS', ['Core', 'Secondary', 'Tertiary'])).map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="character-path-label">Resolution Path</InputLabel>
            <Select
              labelId="character-path-label"
              value={pathFilter}
              label="Resolution Path"
              onChange={onPathFilterChange}
            >
              {['All Paths'].concat(getConstant(gameConstants, 'RESOLUTION_PATHS.TYPES', ['Black Market', 'Detective', 'Third Path'])).concat([getConstant(gameConstants, 'RESOLUTION_PATHS.DEFAULT', 'Unassigned')]).map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};

CharacterFilters.propTypes = {
  typeFilter: PropTypes.string.isRequired,
  tierFilter: PropTypes.string.isRequired,
  pathFilter: PropTypes.string.isRequired,
  onTypeFilterChange: PropTypes.func.isRequired,
  onTierFilterChange: PropTypes.func.isRequired,
  onPathFilterChange: PropTypes.func.isRequired,
  gameConstants: PropTypes.object
};

export default CharacterFilters;