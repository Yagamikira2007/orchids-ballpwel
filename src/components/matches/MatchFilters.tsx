import { MatchFilters as FilterTypes, MatchStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Zap, Clock, CheckCircle2, LayoutGrid } from 'lucide-react';

interface MatchFiltersProps {
  filters: FilterTypes;
  onFilterChange: (filters: Partial<FilterTypes>) => void;
  competitions: string[];
}

const MatchFiltersComponent = ({ filters, onFilterChange, competitions }: MatchFiltersProps) => {
  const statusOptions: { value: 'all' | MatchStatus; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <LayoutGrid className="w-4 h-4" /> },
    { value: 'live', label: 'Live', icon: <Zap className="w-4 h-4" /> },
    { value: 'upcoming', label: 'Upcoming', icon: <Clock className="w-4 h-4" /> },
    { value: 'finished', label: 'Finished', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map(({ value, label, icon }) => (
          <Button
            key={value}
            variant={filters.status === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ status: value })}
            className={`gap-2 rounded-xl transition-all duration-300 ${
              filters.status === value
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                : 'bg-secondary/50 border-border/50 hover:bg-secondary/80 hover:scale-105'
            }`}
          >
            {icon}
            {label}
          </Button>
        ))}
      </div>

      {/* Competition Filter */}
      {competitions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.competition === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ competition: 'all' })}
            className={`rounded-xl transition-all duration-300 ${
              filters.competition === 'all'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-secondary/50 border-border/50'
            }`}
          >
            All Competitions
          </Button>
          {competitions.slice(0, 5).map((competition) => (
            <Button
              key={competition}
              variant={filters.competition === competition ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ competition })}
              className={`truncate max-w-[150px] rounded-xl transition-all duration-300 ${
                filters.competition === competition
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-secondary/50 border-border/50 hover:bg-secondary/80'
              }`}
            >
              {competition}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchFiltersComponent;
