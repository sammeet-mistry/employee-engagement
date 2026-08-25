const ContentSkeleton = ({ variant = 'card', count = 3 }) => {
  const items = Array.from({ length: count });

  return (
    <div className={variant === 'stat' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4' : 'space-y-4'} aria-label="Loading content">
      {items.map((_, index) => (
        <div
          key={index}
          className={`animate-pulse rounded-lg border border-secondary-200 bg-white p-6 ${variant === 'stat' ? 'h-28' : ''}`}
        >
          {variant === 'stat' ? (
            <div className="space-y-3">
              <div className="h-3 w-24 rounded bg-secondary-200" />
              <div className="h-8 w-16 rounded bg-secondary-200" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between gap-4">
                <div className="h-5 w-2/5 rounded bg-secondary-200" />
                <div className="h-5 w-20 rounded-full bg-secondary-200" />
              </div>
              <div className="h-4 w-full rounded bg-secondary-100" />
              <div className="h-4 w-4/5 rounded bg-secondary-100" />
              <div className="h-3 w-1/2 rounded bg-secondary-100" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ContentSkeleton;
