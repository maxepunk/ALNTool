import { Box, IconButton, Tooltip, Button, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import PageHeader from '../PageHeader';

function ElementDetailHeader({ 
  element, 
  id,
  isFetching, 
  showMapper, 
  onToggleMapper, 
  onRefresh, 
  onEdit 
}) {
  const pageActions = element ? (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Tooltip title={isFetching ? "Refreshing..." : "Refresh Data"}>
        <span>
          <IconButton onClick={onRefresh} disabled={isFetching} aria-label="refresh element data">
            {isFetching ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={showMapper ? "Hide Relationship Map" : "Show Relationship Map"}>
        <IconButton 
          onClick={onToggleMapper} 
          aria-label="toggle relationship map" 
          color={showMapper ? "primary" : "default"}
        >
          {showMapper ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit element (Phase 3)">
        <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit} size="medium">
          Edit Element
        </Button>
      </Tooltip>
    </Box>
  ) : null;

  return (
    <PageHeader
      title={element?.name || "Element Details"}
      breadcrumbs={[
        { name: 'Elements', path: '/elements' },
        { name: element?.name || id },
      ]}
      action={pageActions}
    />
  );
}

export default ElementDetailHeader;