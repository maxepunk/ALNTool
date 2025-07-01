import React from 'react';
import {
  Grid, Card, CardContent, Box, Typography, Chip, LinearProgress
} from '@mui/material';
import ExtensionIcon from '@mui/icons-material/Extension';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AssessmentIcon from '@mui/icons-material/Assessment';

function PuzzleDashboardCards({ analytics }) {
  if (!analytics) return null;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Puzzle Overview */}
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ExtensionIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Puzzles</Typography>
            </Box>
            <Typography variant="h3" color="primary">{analytics.totalPuzzles}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total game puzzles
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">Complexity:</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                <Chip label={`High: ${analytics.complexityDistribution['High Complexity'] || 0}`} size="small" color="error" />
                <Chip label={`Med: ${analytics.complexityDistribution['Medium Complexity'] || 0}`} size="small" color="warning" />
                <Chip label={`Low: ${analytics.complexityDistribution['Low Complexity'] || 0}`} size="small" color="success" />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Act Distribution */}
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountTreeIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Act Distribution</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Act 1</Typography>
                <Typography variant="h6" color="primary">{analytics.actDistribution['Act 1'] || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Act 2</Typography>
                <Typography variant="h6" color="secondary">{analytics.actDistribution['Act 2'] || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Act 3</Typography>
                <Typography variant="h6" color="info">{analytics.actDistribution['Act 3'] || 0}</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {analytics.plotCriticalAnalysis.critical} plot critical, {analytics.plotCriticalAnalysis.optional} optional
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Reward Economy */}
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EmojiEventsIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Reward Economy</Typography>
            </Box>
            <Typography variant="h3" color="warning">{analytics.rewardAnalysis.totalRewards}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total puzzle rewards
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={analytics.totalPuzzles > 0 ? (analytics.rewardAnalysis.totalRewards / (analytics.totalPuzzles * 2)) * 100 : 0}
              sx={{ mt: 1, mb: 1, height: 6, borderRadius: 3 }}
              color="warning"
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {analytics.rewardAnalysis.avgRewardsPerPuzzle} avg per puzzle
              </Typography>
            </Box>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Ownership: {analytics.ownershipAnalysis.assigned} assigned
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Production Readiness */}
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssessmentIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Production Ready</Typography>
            </Box>
            <Typography variant="h3" color="success">{analytics.productionReadiness.ready}</Typography>
            <Typography variant="body2" color="text.secondary">
              Puzzles fully configured
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={analytics.totalPuzzles > 0 ? (analytics.productionReadiness.ready / analytics.totalPuzzles * 100) : 0}
              sx={{ mt: 1, mb: 1, height: 6, borderRadius: 3 }}
              color="success"
            />
            <Typography variant="caption" color="text.secondary">
              {analytics.productionReadiness.needsWork} need configuration
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default PuzzleDashboardCards;