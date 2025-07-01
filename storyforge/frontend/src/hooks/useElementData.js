import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useElementData(elementId) {
  const queryClient = useQueryClient();
  
  // Fetch element data with the queryKey for refreshing
  const queryKey = ['element', elementId];
  const {
    data: element,
    isLoading: isElementLoading,
    isFetching,
    error: elementError
  } = useQuery({
    queryKey,
    queryFn: () => api.getElementById(elementId),
    enabled: !!elementId,
    // Keep previous data while refetching for a smoother UX
    keepPreviousData: true,
  });
  
  // Fetch element graph data
  const {
    data: elementGraph,
    isLoading: isGraphLoading
  } = useQuery({
    queryKey: ['elementGraph', elementId],
    queryFn: () => api.getElementGraph(elementId, 2),
    enabled: !!elementId
  });

  // Refresh element data
  const refresh = () => {
    queryClient.invalidateQueries(queryKey);
  };

  return {
    element,
    elementGraph,
    isLoading: isElementLoading,
    isGraphLoading,
    isFetching,
    error: elementError,
    refresh
  };
}