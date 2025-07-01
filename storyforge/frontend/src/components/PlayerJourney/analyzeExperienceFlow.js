// Experience Flow Analysis utilities
export const analyzeExperienceFlow = (nodes, edges, characterData) => {
  if (!nodes || !edges) return {
    pacing: { score: 0, issues: [] },
    memoryTokenFlow: { collected: 0, total: 0, progression: [] },
    actTransitions: { smooth: true, issues: [] },
    bottlenecks: [],
    qualityMetrics: { discoveryRatio: 0, actionRatio: 0, balance: 'unknown' }
  };

  const analysis = {
    pacing: { score: 85, issues: [] },
    memoryTokenFlow: { collected: 0, total: 0, progression: [] },
    actTransitions: { smooth: true, issues: [] },
    bottlenecks: [],
    qualityMetrics: { discoveryRatio: 0, actionRatio: 0, balance: 'good' }
  };

  // Analyze pacing by looking at node clustering and types
  const activityNodes = nodes.filter(n => n.type === 'activityNode');
  const discoveryNodes = nodes.filter(n => n.type === 'discoveryNode');
  const totalNodes = nodes.length;

  if (totalNodes > 0) {
    const discoveryRatio = (discoveryNodes.length / totalNodes) * 100;
    const actionRatio = (activityNodes.length / totalNodes) * 100;
    
    analysis.qualityMetrics.discoveryRatio = Math.round(discoveryRatio);
    analysis.qualityMetrics.actionRatio = Math.round(actionRatio);
    
    // Ideal ratio is 60% discovery, 40% action for About Last Night
    if (discoveryRatio < 50) {
      analysis.pacing.issues.push('Low discovery content - may feel rushed');
      analysis.pacing.score -= 15;
    } else if (discoveryRatio > 75) {
      analysis.pacing.issues.push('High discovery ratio - may feel slow');
      analysis.pacing.score -= 10;
    }
    
    analysis.qualityMetrics.balance = 
      discoveryRatio >= 55 && discoveryRatio <= 70 ? 'excellent' :
      discoveryRatio >= 45 && discoveryRatio <= 80 ? 'good' : 'needs-attention';
  }

  // Check for memory token flow (simulate based on About Last Night's 55-token economy)
  const memoryEvents = nodes.filter(n => 
    n.data?.label?.toLowerCase().includes('memory') ||
    n.data?.label?.toLowerCase().includes('token') ||
    n.data?.type === 'memory'
  );
  
  analysis.memoryTokenFlow.collected = memoryEvents.length;
  analysis.memoryTokenFlow.total = 8; // Estimated per character in 55-token economy
  
  if (analysis.memoryTokenFlow.collected < 3) {
    analysis.bottlenecks.push('Memory token collection below target - check economy balance');
  }

  // Detect potential bottlenecks from node connections
  const highConnectionNodes = nodes.filter(n => {
    const connections = edges.filter(e => e.source === n.id || e.target === n.id);
    return connections.length > 4;
  });
  
  if (highConnectionNodes.length > 0) {
    analysis.bottlenecks.push(`${highConnectionNodes.length} high-traffic nodes may cause congestion`);
  }

  // Act transition analysis (look for Act 1 -> Act 2 flow)
  const act1Nodes = nodes.filter(n => n.data?.act === 1 || n.data?.actFocus === 'Act 1');
  const act2Nodes = nodes.filter(n => n.data?.act === 2 || n.data?.actFocus === 'Act 2');
  
  if (act1Nodes.length === 0 && act2Nodes.length === 0) {
    analysis.actTransitions.issues.push('No clear act structure detected');
    analysis.actTransitions.smooth = false;
  } else if (act1Nodes.length > 0 && act2Nodes.length === 0) {
    analysis.actTransitions.issues.push('Missing Act 2 content - incomplete experience');
    analysis.actTransitions.smooth = false;
  }

  return analysis;
};