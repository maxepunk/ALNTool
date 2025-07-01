import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Paper,
  Typography,
  Button,
} from '@mui/material';

const InfoModal = ({ open, onClose }) => {
  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      aria-labelledby="info-modal-title" 
      aria-describedby="info-modal-description" 
      disableEnforceFocus
    >
      <Paper sx={{
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        width: {xs: '90%', sm: 450, md: 500}, 
        bgcolor: 'background.paper', 
        boxShadow: 24, 
        p: {xs: 2, sm: 3, md: 4}, 
        borderRadius: 2 
      }}>
        <Typography id="info-modal-title" variant="h6" component="h2">
          Relationship Mapper Guide
        </Typography>
        <Typography id="info-modal-description" sx={{ mt: 2 }} component="div">
          <p>This map visualizes connections using a hierarchical layout.</p>
          <strong>Navigation:</strong>
          <ul>
            <li>Click on a node (entity) to navigate to its detail page.</li>
            <li>Drag the background to pan the view.</li>
            <li>Use mouse wheel or pinch to zoom.</li>
          </ul>
          <strong>Standard Controls:</strong>
          <ul>
            <li><strong>View:</strong> Zoom in/out, or fit all items to the screen.</li>
            <li><strong>Exploration Depth:</strong> Control how many levels of connections are shown.</li>
            <li><strong>Filter Nodes/Edges:</strong> Toggle visibility of specific entity types or relationships.</li>
            <li><strong>Signal Strength:</strong> Show or hide items deemed less critical connections.</li>
          </ul>
          <strong>Dependency Choreographer Mode:</strong>
          <ul>
            <li><strong>Production Mode:</strong> Highlights critical dependencies for About Last Night orchestration.</li>
            <li><strong>Critical Dependencies:</strong> UV Light chains, Company One-Pagers, collaborative puzzles.</li>
            <li><strong>Resource Bottlenecks:</strong> RFID scanner limitations, multi-player puzzle scheduling.</li>
            <li><strong>Social Balance:</strong> Character isolation risks and interaction opportunities.</li>
          </ul>
        </Typography>
        <Button onClick={onClose} sx={{mt:3}} variant="contained">
          Got it!
        </Button>
      </Paper>
    </Modal>
  );
};

InfoModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default InfoModal;