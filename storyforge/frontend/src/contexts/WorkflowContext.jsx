import React, { createContext, useContext, useState, useEffect } from 'react';

import logger from '../utils/logger';
// Create the context
const WorkflowContext = createContext();

// Custom hook to use the workflow context
export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

// Provider component
export const WorkflowProvider = ({ children }) => {
  // Persistent state across different analysis tools
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState(null);
  
  // Analysis mode preferences
  const [analysisMode, setAnalysisMode] = useState('dual-lens'); // 'dual-lens', 'focus', 'overview'
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Workflow history for navigation
  const [workflowHistory, setWorkflowHistory] = useState([]);
  const [breadcrumbContext, setBreadcrumbContext] = useState({});

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const persistedState = localStorage.getItem('storyforge-workflow-state');
      if (persistedState) {
        const state = JSON.parse(persistedState);
        if (state.selectedCharacter) setSelectedCharacter(state.selectedCharacter);
        if (state.selectedElement) setSelectedElement(state.selectedElement);
        if (state.selectedPuzzle) setSelectedPuzzle(state.selectedPuzzle);
        if (state.selectedTimelineEvent) setSelectedTimelineEvent(state.selectedTimelineEvent);
        if (state.analysisMode) setAnalysisMode(state.analysisMode);
        if (state.showAdvancedOptions !== undefined) setShowAdvancedOptions(state.showAdvancedOptions);
        if (state.workflowHistory) setWorkflowHistory(state.workflowHistory);
      }
    } catch (error) {
      logger.warn('Failed to load persisted workflow state:', error);
    }
  }, []);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    try {
      const stateToSave = {
        selectedCharacter,
        selectedElement,
        selectedPuzzle,
        selectedTimelineEvent,
        analysisMode,
        showAdvancedOptions,
        workflowHistory: workflowHistory.slice(-10) // Keep last 10 entries
      };
      localStorage.setItem('storyforge-workflow-state', JSON.stringify(stateToSave));
    } catch (error) {
      logger.warn('Failed to persist workflow state:', error);
    }
  }, [selectedCharacter, selectedElement, selectedPuzzle, selectedTimelineEvent, analysisMode, showAdvancedOptions, workflowHistory]);

  // Helper functions for workflow management
  const setSelectedEntity = (entityType, entity) => {
    switch (entityType) {
      case 'character':
        setSelectedCharacter(entity);
        break;
      case 'element':
        setSelectedElement(entity);
        break;
      case 'puzzle':
        setSelectedPuzzle(entity);
        break;
      case 'timeline':
        setSelectedTimelineEvent(entity);
        break;
      default:
        logger.warn('Unknown entity type:', entityType);
    }
  };

  const clearSelectedEntity = (entityType) => {
    setSelectedEntity(entityType, null);
  };

  const clearAllSelections = () => {
    setSelectedCharacter(null);
    setSelectedElement(null);
    setSelectedPuzzle(null);
    setSelectedTimelineEvent(null);
  };

  // Workflow history management
  const addToWorkflowHistory = (entry) => {
    const newEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };
    setWorkflowHistory(prev => [...prev, newEntry].slice(-10)); // Keep last 10 entries
  };

  const navigateToAnalysisTool = (toolPath, context = {}) => {
    addToWorkflowHistory({
      action: 'navigate',
      toolPath,
      context,
      selectedEntities: {
        character: selectedCharacter,
        element: selectedElement,
        puzzle: selectedPuzzle,
        timelineEvent: selectedTimelineEvent
      }
    });
  };

  // Get suggested next tools based on current context
  const getSuggestedTools = () => {
    const suggestions = [];
    
    if (selectedCharacter) {
      suggestions.push(
        { label: 'Player Journey', path: '/player-journey', reason: 'Analyze character journey' },
        { label: 'Character Sociogram', path: '/character-sociogram', reason: 'View character relationships' },
        { label: 'Memory Economy', path: '/memory-economy', reason: 'Check character memory distribution' }
      );
    }

    if (selectedElement) {
      suggestions.push(
        { label: 'Element-Puzzle Flow', path: '/element-puzzle-economy', reason: 'Analyze element usage' },
        { label: 'Memory Economy', path: '/memory-economy', reason: 'Check element memory value' }
      );
    }

    if (selectedPuzzle) {
      suggestions.push(
        { label: 'Element-Puzzle Flow', path: '/element-puzzle-economy', reason: 'Analyze puzzle flow' },
        { label: 'Resolution Paths', path: '/resolution-path-analyzer', reason: 'Check puzzle resolution impact' }
      );
    }

    // Always suggest narrative threads for story coherence
    if (!suggestions.find(s => s.path === '/narrative-thread-tracker')) {
      suggestions.push(
        { label: 'Narrative Threads', path: '/narrative-thread-tracker', reason: 'Review story coherence' }
      );
    }

    return suggestions.slice(0, 4); // Return top 4 suggestions
  };

  // Context value
  const contextValue = {
    // Selected entities
    selectedCharacter,
    selectedElement,
    selectedPuzzle,
    selectedTimelineEvent,
    
    // Entity management functions
    setSelectedCharacter,
    setSelectedElement,
    setSelectedPuzzle,
    setSelectedTimelineEvent,
    setSelectedEntity,
    clearSelectedEntity,
    clearAllSelections,
    
    // Analysis preferences
    analysisMode,
    setAnalysisMode,
    showAdvancedOptions,
    setShowAdvancedOptions,
    
    // Workflow management
    workflowHistory,
    addToWorkflowHistory,
    navigateToAnalysisTool,
    getSuggestedTools,
    
    // Breadcrumb context
    breadcrumbContext,
    setBreadcrumbContext,
    
    // Helper to check if any entity is selected
    hasSelectedEntity: !!(selectedCharacter || selectedElement || selectedPuzzle || selectedTimelineEvent),
    
    // Get current context summary for display
    getContextSummary: () => {
      const summary = [];
      if (selectedCharacter) summary.push(`Character: ${selectedCharacter.name || selectedCharacter.id}`);
      if (selectedElement) summary.push(`Element: ${selectedElement.name || selectedElement.id}`);
      if (selectedPuzzle) summary.push(`Puzzle: ${selectedPuzzle.name || selectedPuzzle.id}`);
      if (selectedTimelineEvent) summary.push(`Event: ${selectedTimelineEvent.description || selectedTimelineEvent.id}`);
      return summary.join(' | ');
    }
  };

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
};

export default WorkflowContext;