/**
 * Export all custom node types for ReactFlow
 */

import CharacterNode from './CharacterNode';
import ElementNode from './ElementNode';
import PuzzleNode from './PuzzleNode';
import TimelineEventNode from './TimelineEventNode';
import AggregatedNode from './AggregatedNode';

// Node type mapping for ReactFlow
export const nodeTypes = {
  character: CharacterNode,
  element: ElementNode,
  puzzle: PuzzleNode,
  timeline_event: TimelineEventNode,
  aggregated: AggregatedNode
};

// Also export individual components if needed elsewhere
export {
  CharacterNode,
  ElementNode,
  PuzzleNode,
  TimelineEventNode,
  AggregatedNode
};