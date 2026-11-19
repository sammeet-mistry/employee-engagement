const Pagination = ({ page, totalPages, total, limit, onPageChange, label = 'items' }) => {
  if (!totalPages || totalPages < 2) return null;

  const firstItem = (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, total);

  return (
    <nav className="mt-4 flex flex-wrap items-center justify-between gap-3" aria-label={`${label} pages`}>
      <span className="text-sm text-secondary-600">
        Showing {firstItem}–{lastItem} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span className="text-sm text-secondary-600">Page {page} of {totalPages}</span>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
