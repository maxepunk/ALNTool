import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useJourney(characterId) {
  return useQuery({
    queryKey: ['journey', characterId],
    queryFn: () => api.getJourneyByCharacterId(characterId),
    enabled: !!characterId,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}