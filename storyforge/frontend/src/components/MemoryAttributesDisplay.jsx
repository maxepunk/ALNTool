import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Paper, Divider, Chip } from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';

// Simple parsing strategy:
// Lines like "Key: Value" are attributes.
// A line with "--- NARRATIVE ---" (or similar) separates attributes from narrative.
// If no separator, all non-key-value lines are narrative.
const ATTRIBUTE_SEPARATOR = "--- NARRATIVE ---";

function parseMemoryDescription(descriptionText) {
  const attributes = {};
  let narrativeText = '';
  let parsingAttributes = true;

  if (!descriptionText || typeof descriptionText !== 'string') {
    return { attributes, narrativeText: descriptionText || '' };
  }

  const lines = descriptionText.split('\n');
  const narrativeLines = [];

  for (const line of lines) {
    if (line.trim() === ATTRIBUTE_SEPARATOR) {
      parsingAttributes = false;
      continue; // Skip the separator line itself
    }

    if (parsingAttributes) {
      const parts = line.match(/^([^:]+):\s*(.*)$/);
      if (parts && parts.length === 3) {
        const key = parts[1].trim();
        const value = parts[2].trim();
        // Normalize key for easier access (e.g., "Memory ID" -> "memoryId")
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
        attributes[normalizedKey] = value;
      } else {
        // If line doesn't match "Key: Value" and we are in attribute parsing mode,
        // it might be the start of narrative or just a malformed line.
        // For simplicity, we'll treat it as narrative if it's not a clear attribute.
        // Or, we could choose to discard it or mark it as an error.
        // Let's assume it becomes part of the narrative if separator not yet found.
        narrativeLines.push(line);
      }
    } else {
      narrativeLines.push(line);
    }
  }
  
  // If separator was not found and we collected lines into narrativeLines
  // while also collecting some attributes, decide priority.
  // Current logic: if any line was not a key:value pair before separator, it goes to narrative.
  // If narrativeLines still empty after loop but attributes were parsed, it means all was attributes.
  // If attributes empty but narrativeLines has content, it's all narrative.

  narrativeText = narrativeLines.join('\n').trim();

  // If narrativeText is empty and attributes were found, but some lines were treated as narrative
  // because they didn't match Key:Value, then those initial lines are the narrative.
  // This handles cases where description might be:
  // Some narrative text
  // Memory ID: 123
  // Corruption: Low
  // (without a separator)
  // A more robust parser would be needed for complex cases.
  // For now, we assume if attributes are found, narrative is what's explicitly after separator or non-key-value lines.

  return { attributes, narrativeText };
}


const MemoryAttributesDisplay = ({ descriptionText, basicType }) => {
  if (!basicType?.toLowerCase().includes('memory')) {
    // If not a memory type, just render the original description
    return (
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
        {descriptionText}
      </Typography>
    );
  }

  const { attributes, narrativeText } = parseMemoryDescription(descriptionText);
  const hasAttributes = Object.keys(attributes).length > 0;

  // Define which attributes to display prominently if they exist
  const prominentAttributes = [
    { key: 'memory_id', label: 'Memory ID' },
    { key: 'memory_title', label: 'Memory Title' },
    { key: 'corruption_status', label: 'Corruption Status' },
    { key: 'rfid_token_id', label: 'RFID Token ID' },
    { key: 'value_indicator', label: 'Value Indicator' },
    { key: 'memory_type_(narrative)', label: 'Narrative Memory Type' },
    { key: 'puzzle_integration_type', label: 'Puzzle Integration' },
  ];

  return (
    <Box>
      {hasAttributes && (
        <Paper variant="outlined" sx={{ p: 2, mt: 1.5, mb: 2, borderColor: 'secondary.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <MemoryIcon color="secondary" sx={{ mr: 1 }} />
            <Typography variant="h6" color="secondary.main">
              Memory Specifics
            </Typography>
          </Box>
          {prominentAttributes.map(attr => 
            attributes[attr.key] ? (
              <Box key={attr.key} sx={{ display: 'flex', mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ minWidth: 150, color: 'text.secondary' }}>
                  {attr.label}:
                </Typography>
                <Typography variant="body1">{attributes[attr.key]}</Typography>
              </Box>
            ) : null
          )}
          {attributes.puzzle_notes && (
             <Box sx={{ mt: 1.5}}>
                <Typography variant="subtitle2" color="text.secondary">Puzzle Notes (Memory):</Typography>
                <Typography variant="body2" sx={{whiteSpace: 'pre-wrap', pl:1, borderLeft: 2, borderColor: 'divider'}}>{attributes.puzzle_notes}</Typography>
             </Box>
          )}
        </Paper>
      )}

      {narrativeText && (
        <>
          {hasAttributes && <Divider sx={{ my: 2 }}><Chip label="Narrative Content" size="small"/></Divider>}
          <Typography variant="subtitle2" color="text.secondary">
            {hasAttributes ? 'Detailed Description / Content' : 'Description / Content'}
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: hasAttributes ? 1 : 0.5, pl: hasAttributes ? 1: 0 }}>
            {narrativeText}
          </Typography>
        </>
      )}
      
      {!hasAttributes && !narrativeText && (
        <Typography variant="body2" color="text.secondary" sx={{mt:1}}>
            No specific memory attributes or narrative content parsed from description.
        </Typography>
      )}
    </Box>
  );
};

MemoryAttributesDisplay.propTypes = {
  descriptionText: PropTypes.string,
  basicType: PropTypes.string,
};

export default MemoryAttributesDisplay; 