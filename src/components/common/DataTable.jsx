import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'

// Responsive data table:
//   • md and up  → a normal table inside a horizontal-scroll box (columns never crush)
//   • below md   → each row becomes a stacked card (label → value per column)
// Same props/data as before — the mobile presentation is derived automatically
// from the column defs. Columns with an empty `header` (e.g. an actions column)
// render full-width with no label on mobile.
export default function DataTable({
  columns,
  data,
  loading = false,
  emptyTitle = 'No data found',
  emptyDescription = '',
  onRowClick,
  pagination,
  onPageChange,
}) {
  const renderCell = (col, row, rowIndex) =>
    col.render ? col.render(row[col.key], row, rowIndex) : row[col.key] ?? '—'

  const pageBtn = (disabled) => ({
    minHeight: 40,
    padding: '8px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    fontSize: '0.8125rem',
    fontFamily: 'inherit',
    transition: 'all var(--transition-fast)',
  })

  return (
    <div
      className="animate-fadeIn"
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
      }}
    >
      {loading ? (
        <LoadingSpinner text="Loading data..." />
      ) : !data || data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          {/* Tablet / desktop: scrollable table */}
          <div className="hidden md:block" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((col, i) => (
                    <th key={i} style={{ width: col.width, minWidth: col.minWidth, textAlign: col.align || 'left' }}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr
                    key={row.id || rowIndex}
                    onClick={() => onRowClick?.(row)}
                    style={{ cursor: onRowClick ? 'pointer' : 'default', animationDelay: `${rowIndex * 30}ms` }}
                    className="animate-fadeIn"
                  >
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} style={{ textAlign: col.align || 'left' }}>
                        {renderCell(col, row, rowIndex)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones: stacked cards */}
          <div className="md:hidden">
            {data.map((row, rowIndex) => (
              <div
                key={row.id || rowIndex}
                onClick={() => onRowClick?.(row)}
                className="animate-fadeIn"
                style={{
                  display: 'flex', flexDirection: 'column', gap: '8px',
                  padding: '14px 16px', borderBottom: '1px solid var(--border-default)',
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
              >
                {columns.map((col, i) => {
                  const hasLabel = col.header && String(col.header).trim() !== ''
                  const content = renderCell(col, row, rowIndex)
                  if (!hasLabel) {
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
                        {content}
                      </div>
                    )
                  }
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                        {col.header}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textAlign: 'right', minWidth: 0 }}>
                        {content}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && (() => {
            const { offset, limit, total } = pagination;
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(total / limit) || 1;

            const getPageNumbers = () => {
              const pages = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
                return pages;
              }
              if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
              } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
              } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
              }
              return pages;
            };

            const ChevronLeft = () => (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            )
            const ChevronRight = () => (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )
            
            const arrowCls = `grid h-9 w-9 place-items-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]
              shadow-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:text-[var(--text-primary)] hover:shadow
              disabled:cursor-not-allowed disabled:opacity-40 disabled:border-[var(--border-default)]
              disabled:shadow-none disabled:hover:shadow-none cursor-pointer`;

            return (
              <nav
                className="flex flex-col-reverse items-center justify-between gap-3 border-t border-[var(--border-default)] !p-3 sm:flex-row"
              >
                <p className="text-xs text-[var(--text-secondary)]">
                  Showing <span className="font-semibold text-[var(--text-primary)]">{pagination.total === 0 ? 0 : pagination.offset + 1}–{Math.min(pagination.offset + data.length, pagination.total)}</span> of{" "}
                  <span className="font-semibold text-[var(--text-primary)]">{pagination.total}</span>
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onPageChange?.(Math.max(0, pagination.offset - pagination.limit))}
                    disabled={pagination.offset === 0}
                    className={arrowCls}
                  >
                    <ChevronLeft />
                  </button>

                  {/* Mobile Readout */}
                  <p className="px-2 text-sm font-medium text-[var(--text-secondary)] sm:hidden">
                    Page <span className="font-semibold text-[var(--text-primary)]">{currentPage}</span> of {totalPages}
                  </p>

                  {/* Desktop Page Numbers */}
                  <ul className="hidden list-none items-center gap-1.5 p-0 sm:flex m-0">
                    {getPageNumbers().map((p, i) => {
                      if (p === '...') {
                        return (
                          <li key={i} className="grid h-9 w-6 place-items-center text-sm text-[var(--text-tertiary)]">
                            …
                          </li>
                        )
                      }
                      const isActive = p === currentPage;
                      return (
                        <li key={i}>
                          <button
                            onClick={() => onPageChange?.((p - 1) * limit)}
                            className={`h-9 min-w-[2.25rem] rounded-xl border px-3 text-sm tabular-nums transition-all duration-200 cursor-pointer
                              ${isActive
                                ? "border-[var(--color-primary)] bg-[var(--color-primary)] font-semibold text-white shadow-sm"
                                : "border-[var(--border-default)] bg-[var(--bg-tertiary)] font-medium text-[var(--text-secondary)] shadow-sm hover:border-gray-400 dark:hover:border-gray-500 hover:text-[var(--text-primary)] hover:shadow"}`}
                          >
                            {p}
                          </button>
                        </li>
                      )
                    })}
                  </ul>

                  <button
                    onClick={() => onPageChange?.(pagination.offset + pagination.limit)}
                    disabled={pagination.offset + data.length >= pagination.total}
                    className={arrowCls}
                  >
                    <ChevronRight />
                  </button>
                </div>
              </nav>
            )
          })()}
        </>
      )}
    </div>
  )
}
