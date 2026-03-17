import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'favorite_teams';

const loadFavorites = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const useFavoriteTeams = () => {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((teamName: string) => {
    setFavorites(prev => {
      const normalized = teamName.trim().toLowerCase();
      const exists = prev.some(t => t.toLowerCase() === normalized);
      if (exists) return prev.filter(t => t.toLowerCase() !== normalized);
      return [...prev, teamName.trim()];
    });
  }, []);

  const isFavorite = useCallback((teamName: string) => {
    return favorites.some(t => t.toLowerCase() === teamName.trim().toLowerCase());
  }, [favorites]);

  const hasFavoriteTeam = useCallback((homeName: string, awayName: string) => {
    return isFavorite(homeName) || isFavorite(awayName);
  }, [isFavorite]);

  return { favorites, toggleFavorite, isFavorite, hasFavoriteTeam };
};
