import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import GroupsIcon from '@mui/icons-material/Groups';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BuildIcon from '@mui/icons-material/Build';
import WarningIcon from '@mui/icons-material/Warning';

const IntelligenceToggles = React.memo(() => {
  const { activeIntelligence, toggleIntelligence } = useJourneyIntelligenceStore();

  const intelligenceLayers = [
    { id: 'story', label: 'Story', icon: <AutoStoriesIcon />, tooltip: 'Story Integration Intelligence' },
    { id: 'social', label: 'Social', icon: <GroupsIcon />, tooltip: 'Social Choreography Intelligence' },
    { id: 'economic', label: 'Economic', icon: <AttachMoneyIcon />, tooltip: 'Economic Impact Intelligence' },
    { id: 'production', label: 'Production', icon: <BuildIcon />, tooltip: 'Production Reality Intelligence' },
    { id: 'gaps', label: 'Gaps', icon: <WarningIcon />, tooltip: 'Content Gap Intelligence' }
  ];

  return (
    <Box data-testid="intelligence-toggles" role="group" aria-label="Intelligence Layers">
      <ToggleButtonGroup
        value={activeIntelligence}
        aria-label="intelligence layer toggles"
        size="small"
      >
        {intelligenceLayers.map(layer => (
          <Tooltip key={layer.id} title={layer.tooltip}>
            <ToggleButton 
              value={layer.id}
              aria-label={layer.label}
              aria-pressed={activeIntelligence.includes(layer.id)}
              onClick={() => toggleIntelligence(layer.id)}
            >
              {layer.icon}
              <Box component="span" sx={{ ml: 0.5 }}>{layer.label}</Box>
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
});

IntelligenceToggles.displayName = 'IntelligenceToggles';

export default IntelligenceToggles;