import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MatchFilters } from "@/types";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import MatchDetail from "@/pages/MatchDetail";
import LiveStreamPage from "@/pages/LiveStreamPage";
import LiveMatches from "@/pages/LiveMatches";
import UpcomingMatches from "@/pages/UpcomingMatches";
import NBAMatches from "@/pages/NBAMatches";
import Results from "@/pages/Results";
import AccumulatorPage from "@/pages/AccumulatorPage";
import AdminPanel from "@/pages/AdminPanel";
import Login from "@/pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

const App = () => {
  const [filters, setFilters] = useState<MatchFilters>({
    status: 'all',
    searchQuery: '',
    competition: 'all',
  });

  const handleFilterChange = (newFilters: Partial<MatchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AppSettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route element={<Layout onSearch={handleSearch} searchQuery={filters.searchQuery} />}>
                  <Route path="/" element={<Dashboard filters={filters} onFilterChange={handleFilterChange} />} />
                  <Route path="/matches/:matchId" element={<MatchDetail />} />
                  <Route path="/watch/:matchId" element={<LiveStreamPage />} />
                  <Route path="/live" element={<LiveMatches />} />
                  <Route path="/upcoming" element={<UpcomingMatches />} />
                  <Route path="/basketball" element={<NBAMatches />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/accumulator" element={<AccumulatorPage />} />
                </Route>
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppSettingsProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
