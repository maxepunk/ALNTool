import React from 'react';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import EventIcon from '@mui/icons-material/Event';
import ExtensionIcon from '@mui/icons-material/Extension';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MemoryIcon from '@mui/icons-material/Memory';

export const getEntityPresentation = (type, properties = {}, isCenter = false) => {
  let color = '#78909c'; // Default Blue Grey 400
  let icon = <HelpOutlineIcon fontSize="inherit" />;
  let contrastColor = 'rgba(0,0,0,0.87)'; // For chips on light backgrounds

  if (isCenter) {
    color = '#673ab7'; // Deep Purple 500 for center node
    contrastColor = '#fff';
  }
  
  // Check for Memory Element first as it's a subtype of Element
  if (type === 'Element' && properties.basicType?.toLowerCase().includes('memory')) {
    color = isCenter ? color : '#2196f3'; // Blue 500 for Memory Elements
    icon = <MemoryIcon fontSize="inherit" />;
    contrastColor = '#fff';
  } else {
    switch (type) {
      case 'Character':
        color = isCenter ? color : '#3f51b5'; // Indigo 500
        icon = <PersonIcon fontSize="inherit" />;
        contrastColor = '#fff';
        break;
      case 'Element': // General Elements (not Memory)
        color = isCenter ? color : '#00897b'; // Teal 600
        icon = <InventoryIcon fontSize="inherit" />;
        contrastColor = '#fff';
        break;
      case 'Puzzle':
        color = isCenter ? color : '#f57c00'; // Orange 700
        icon = <ExtensionIcon fontSize="inherit" />;
        contrastColor = '#fff';
        break;
      case 'Timeline':
        color = isCenter ? color : '#d81b60'; // Pink 600
        icon = <EventIcon fontSize="inherit" />;
        contrastColor = '#fff';
        break;
    }
  }
  return { color, icon, contrastColor };
};