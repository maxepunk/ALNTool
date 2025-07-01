import WarningIcon from '@mui/icons-material/Warning';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import NfcIcon from '@mui/icons-material/Nfc';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import BusinessIcon from '@mui/icons-material/Business';

export const analyzeDependencies = (graphData, entityType, entityId) => {
  if (!graphData?.nodes) return {
    criticalPaths: [],
    bottlenecks: [],
    collaborationOpportunities: [],
    isolationRisks: [],
  };

  const analysis = {
    criticalPaths: [],
    bottlenecks: [],
    collaborationOpportunities: [],
    isolationRisks: [],
  };

  // Detect UV Light dependency chain
  const uvElements = graphData.nodes.filter(node => 
    node.properties?.name?.toLowerCase().includes('uv') ||
    node.properties?.themes?.includes('UV') ||
    node.properties?.basicType?.toLowerCase().includes('uv')
  );
  if (uvElements.length > 0) {
    analysis.criticalPaths.push({
      type: 'UV Light Chain',
      description: `${uvElements.length} UV-dependent elements detected`,
      severity: 'high',
      icon: <LightbulbIcon />
    });
  }

  // Detect Company One-Pager dependencies
  const onePagerElements = graphData.nodes.filter(node => 
    node.properties?.name?.toLowerCase().includes('one-pager') ||
    node.properties?.name?.toLowerCase().includes('company') ||
    node.properties?.themes?.includes('Business')
  );
  if (onePagerElements.length > 0) {
    analysis.criticalPaths.push({
      type: 'Company One-Pager Network',
      description: `${onePagerElements.length} business-critical elements`,
      severity: 'medium',
      icon: <BusinessIcon />
    });
  }

  // Detect RFID bottlenecks (3 scanners for 20 players)
  const rfidElements = graphData.nodes.filter(node => 
    node.properties?.basicType?.toLowerCase().includes('rfid') ||
    node.properties?.name?.toLowerCase().includes('rfid')
  );
  if (rfidElements.length > 3) {
    analysis.bottlenecks.push({
      type: 'RFID Scanner Bottleneck',
      description: `${rfidElements.length} RFID elements with only 3 scanners`,
      severity: 'high',
      icon: <NfcIcon />
    });
  }

  // Detect collaborative puzzles requiring 2+ players
  const collaborativePuzzles = graphData.nodes.filter(node => 
    node.type === 'Puzzle' && 
    (node.properties?.minPlayers > 1 || 
     node.properties?.name?.toLowerCase().includes('collab') ||
     node.properties?.themes?.includes('Collaboration'))
  );
  if (collaborativePuzzles.length > 0) {
    analysis.collaborationOpportunities.push({
      type: 'Multi-Player Puzzles',
      description: `${collaborativePuzzles.length} puzzles require collaboration`,
      severity: 'medium',
      icon: <GroupWorkIcon />
    });
  }

  // Detect isolated characters (characters with < 2 connections)
  if (entityType === 'Character' && entityId) {
    const connections = graphData.edges?.filter(edge => 
      edge.source === entityId || edge.target === entityId
    ).length || 0;
    
    if (connections < 2) {
      analysis.isolationRisks.push({
        type: 'Social Isolation Risk',
        description: `Only ${connections} connections - may need interaction opportunities`,
        severity: 'medium',
        icon: <WarningIcon />
      });
    }
  }

  return analysis;
};