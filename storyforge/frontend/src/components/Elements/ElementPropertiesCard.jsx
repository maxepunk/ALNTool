import { Grid, Typography, Box, Chip, Divider } from '@mui/material';

function ElementPropertiesCard({ element }) {
  // Helper to check if this is a memory-type element
  const isMemoryType = element.basicType?.toLowerCase().includes('memory') ||
                       element.basicType?.toLowerCase().includes('corrupted') ||
                       element.basicType?.toLowerCase().includes('rfid');

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" color="text.secondary">
          Basic Type
        </Typography>
        <Box sx={{ mb: 2 }}>
          {element.basicType && (
            <Chip
              label={element.basicType}
              color={
                isMemoryType ? 'secondary' :
                element.basicType === 'Prop' ? 'primary' :
                element.basicType === 'Clue' ? 'success' :
                'default'
              }
            />
          )}
        </Box>
        
        <Typography variant="subtitle2" color="text.secondary">
          Status
        </Typography>
        <Box sx={{ mb: 2 }}>
          {element.status && (
            <Chip
              label={element.status}
              color={
                element.status === 'Final' ? 'success' :
                element.status === 'In Production' ? 'warning' :
                element.status === 'Needs Review' ? 'error' :
                'default'
              }
              variant={element.status === 'Final' ? 'filled' : 'outlined'}
            />
          )}
        </Box>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" color="text.secondary">
          First Available
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            {element.firstAvailable || 'Not specified'}
          </Typography>
        </Box>
        
        {element.revealedBy && (
          <>
            <Typography variant="subtitle2" color="text.secondary">
              Revealed By
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                {element.revealedBy}
              </Typography>
            </Box>
          </>
        )}
        
        {isMemoryType && (
          <>
            <Typography variant="subtitle2" color="text.secondary" 
              sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
              Memory Data
            </Typography>
            <Box sx={{ mb: 2, mt: 1 }}>
              {/* This would be enhanced in future to parse and display specific memory attributes */}
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>
                Further memory-specific details might be in the description.
              </Typography>
            </Box>
          </>
        )}

        {isMemoryType && element.properties?.parsed_sf_rfid && (
          <Grid item xs={12}> {/* Placed within the second column of the main details grid */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
              Parsed RFID
            </Typography>
            <Chip
              label={element.properties.parsed_sf_rfid}
              color="info"
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
          </Grid>
        )}
      </Grid>

      {element.description && (
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary">
            Description/Text
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
            {element.description}
          </Typography>
        </Grid>
      )}
      
      {element.productionNotes && (
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary">
            Production/Puzzle Notes
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
            {element.productionNotes}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
}

export default ElementPropertiesCard;