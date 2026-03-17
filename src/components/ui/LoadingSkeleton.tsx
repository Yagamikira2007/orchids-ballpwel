const LoadingSkeleton = () => {
  return (
    <div className="match-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-16 bg-secondary/60 rounded-full" />
          <div className="h-6 w-10 bg-secondary/60 rounded-full" />
        </div>
        <div className="h-5 w-14 bg-secondary/60 rounded-lg" />
      </div>
      
      <div className="h-3 w-28 bg-secondary/60 rounded mb-5" />
      
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-secondary/60" />
          <div className="h-4 w-20 bg-secondary/60 rounded" />
        </div>
        <div className="h-9 w-16 bg-secondary/60 rounded-xl" />
        <div className="flex-1 flex items-center gap-3 justify-end">
          <div className="h-4 w-20 bg-secondary/60 rounded" />
          <div className="w-11 h-11 rounded-xl bg-secondary/60" />
        </div>
      </div>
      
      <div className="h-11 w-full bg-secondary/40 rounded-xl mt-4" />
    </div>
  );
};

export default LoadingSkeleton;
