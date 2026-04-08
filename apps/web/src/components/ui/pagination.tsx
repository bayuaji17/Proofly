import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  currentCount: number
  itemName?: string
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  currentCount,
  itemName = 'item',
  onPageChange,
}: PaginationProps) {
  // Logic untuk maksimal 3 angka halaman
  let pages: number[] = []

  if (totalPages <= 1) {
    pages = [1]
  } else if (totalPages <= 3) {
    pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  } else {
    if (currentPage <= 2) {
      pages = [1, 2, 3]
    } else if (currentPage >= totalPages - 1) {
      pages = [totalPages - 2, totalPages - 1, totalPages]
    } else {
      pages = [currentPage - 1, currentPage, currentPage + 1]
    }
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 py-4 px-2 sm:flex-row font-sans">
      {/* Sisi Kiri: Teks Informasi */}
      <div className="text-sm text-base-content/60">
        Menampilkan{' '}
        <span className="font-semibold text-base-content">{currentCount}</span> dari{' '}
        <span className="font-semibold text-base-content">{totalItems}</span> {itemName}
      </div>

      {/* Sisi Kanan: Kontrol Navigasi */}
      <div className="flex items-center gap-2">
        <div className="join">
          <button
            type="button"
            className="btn join-item btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200"
            disabled={currentPage <= 1 || totalPages === 0}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="size-4" />
          </button>

          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={`btn join-item btn-sm border-base-300 font-medium ${
                p === currentPage
                  ? 'btn-primary border-primary hover:btn-primary'
                  : 'bg-base-100 text-base-content hover:bg-base-200'
              }`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            className="btn join-item btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200"
            disabled={currentPage >= totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
