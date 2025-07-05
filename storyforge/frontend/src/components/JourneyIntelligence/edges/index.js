// Import the custom edge component
import CustomEdge from './CustomEdge';

// Export it for external use
export { CustomEdge };

// Edge type registry for ReactFlow
export const edgeTypes = {
  default: CustomEdge,
  smoothstep: CustomEdge,
  straight: CustomEdge,
  step: CustomEdge,
  // Our custom types all use the same component
  'character-link': CustomEdge,
  'ownership': CustomEdge,
  'container': CustomEdge,
  'timeline': CustomEdge,
  'contextEdge': CustomEdge
};