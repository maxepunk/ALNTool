import React, { useState, useMemo } from 'react';
import { useQueries } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, CircularProgress, Alert, Paper, Grid, List, ListItem, ListItemText,
  Chip, Divider, TextField, InputAdornment, IconButton, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import { Link as RouterLink } from 'react-router-dom';

const ElementPuzzleEconomyPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const results = useQueries([
    { queryKey: 'allPuzzlesForEconomy', queryFn: () => api.getPuzzles({ limit: 1000 }) }, // Fetch all puzzles
    { queryKey: 'allElementsForEconomy', queryFn: () => api.getElements({ limit: 1000 }) } // Fetch all elements
  ]);

  const isLoading = results.some(query => query.isLoading);
  const error = results.find(query => query.error)?.error;
  const puzzles = results[0]?.data;
  const elements = results[1]?.data;

  const elementsMap = useMemo(() => {
    if (!elements) return new Map();
    return new Map(elements.map(el => [el.id, el]));
  }, [elements]);

  const processedPuzzles = useMemo(() => {
    if (!puzzles || !elementsMap.size) return [];

    return puzzles.map(puzzle => {
      const requiredElements = (puzzle.puzzleElements || []).map(reqElStub => {
        const fullEl = elementsMap.get(reqElStub.id);
        return { ...reqElStub, basicType: fullEl?.properties?.basicType || 'Unknown' };
      });

      let rewardedElements = (puzzle.rewards || []).map(rewElStub => {
        const fullEl = elementsMap.get(rewElStub.id);
        return { ...rewElStub, basicType: fullEl?.properties?.basicType || 'Unknown' };
      });

      // Add lockedItem to rewards if it's an element and not already listed
      if (puzzle.lockedItem && puzzle.lockedItem.length > 0) {
        puzzle.lockedItem.forEach(lockedElStub => {
          const fullEl = elementsMap.get(lockedElStub.id);
          if (fullEl && !rewardedElements.find(r => r.id === lockedElStub.id)) { // Check if it's an element and not duplicate
            rewardedElements.push({ ...lockedElStub, basicType: fullEl.properties?.basicType || 'Unknown' });
          }
        });
      }

      return {
        ...puzzle,
        requiredElements,
        rewardedElements,
        hasNoInputs: requiredElements.length === 0,
        hasNoOutputs: rewardedElements.length === 0,
      };
    }).filter(puzzle => {
      if (!searchTerm) return true;
      return puzzle.puzzle?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [puzzles, elementsMap, searchTerm]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Element-Puzzle Economy Data...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{m:2}}>Error loading data: {error.message || 'An unknown error occurred.'}</Alert>;
  }

  return (
    <Box sx={{ m: 2 }}>
      <PageHeader title="Element-Puzzle Economy Overview" />
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Filter Puzzles by Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {processedPuzzles.length === 0 && !isLoading && (
        <Typography sx={{textAlign: 'center', mt: 3}}>
            {searchTerm ? `No puzzles found matching "${searchTerm}".` : "No puzzles data available."}
        </Typography>
      )}

      <Grid container spacing={2}>
        {processedPuzzles.map(puzzle => (
          <Grid item xs={12} md={6} lg={4} key={puzzle.id}>
            <Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography
                variant="h6"
                component={RouterLink}
                to={`/puzzles/${puzzle.id}`}
                sx={{textDecoration: 'none', color: 'primary.main', '&:hover': {textDecoration: 'underline'}}}
              >
                {puzzle.puzzle}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, my: 1, flexWrap: 'wrap' }}>
                {puzzle.hasNoInputs && <Chip label="No Inputs" color="warning" size="small" variant="outlined" />}
                {puzzle.hasNoOutputs && <Chip label="No Outputs" color="error" size="small" variant="outlined" />}
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{flexGrow:1}}>
                <Typography variant="subtitle2" gutterBottom>Required Elements ({puzzle.requiredElements.length}):</Typography>
                {puzzle.requiredElements.length > 0 ? (
                  <List dense disablePadding>
                    {puzzle.requiredElements.map(el => (
                      <ListItem key={el.id} disablePadding sx={{pl:1}}>
                        <ListItemText
                           primary={<Tooltip title={`Type: ${el.basicType}`}><RouterLink to={`/elements/${el.id}`} style={{textDecoration:'none', color:'inherit'}}>{el.name}</RouterLink></Tooltip>}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : <Typography variant="caption" color="text.secondary" sx={{pl:1}}>None</Typography>}

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 1.5 }}>Rewarded Elements ({puzzle.rewardedElements.length}):</Typography>
                {puzzle.rewardedElements.length > 0 ? (
                  <List dense disablePadding>
                    {puzzle.rewardedElements.map(el => (
                      <ListItem key={el.id} disablePadding sx={{pl:1}}>
                         <ListItemText
                            primary={<Tooltip title={`Type: ${el.basicType}`}><RouterLink to={`/elements/${el.id}`} style={{textDecoration:'none', color:'inherit'}}>{el.name}</RouterLink></Tooltip>}
                         />
                      </ListItem>
                    ))}
                  </List>
                ) : <Typography variant="caption" color="text.secondary" sx={{pl:1}}>None</Typography>}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ElementPuzzleEconomyPage;
