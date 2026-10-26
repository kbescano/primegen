'use client'

import { useClientSearch, type ClientOption } from '@/lib/useClientSearch'

export default function ClientPickerModal({
  onSelect,
  onSkip,
}: {
  onSelect: (client: ClientOption) => void
  onSkip: () => void
}) {
  const { query, setQuery, clients, total, loading, pageSize } = useClientSearch()

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full max-h-[80vh] flex flex-col shadow-[0_30px_80px_-20px_rgba(1,23,47,0.35)]">
        <div className="p-6 border-b border-[#01172f]/10">
          <div className="w-8 h-[3px] bg-[#149911] mb-3" />
          <h2 className="text-lg font-black uppercase tracking-tight text-[#01172f]">
            Use an Existing Client?
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Select a client to auto-fill this quotation, or start with a blank form.
          </p>
        </div>

        <div className="px-6 py-3 border-b border-[#01172f]/10">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, company, phone, or email"
            autoFocus
            className="w-full px-4 py-2.5 border border-[#01172f]/15 text-sm text-[#01172f] placeholder:text-[#01172f]/35 focus:outline-none focus:border-[#149911]"
          />
          {!loading && total > clients.length && (
            <p className="text-xs text-gray-400 mt-2">
              Showing first {pageSize} of {total} clients. Type to narrow the list.
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-400 p-6">Loading clients...</p>
          ) : clients.length === 0 ? (
            <p className="text-sm text-gray-400 p-6">
              {query.trim() ? `No clients match "${query.trim()}".` : 'No clients saved yet.'}
            </p>
          ) : (
            clients.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="w-full text-left px-6 py-4 hover:bg-[#149911]/[0.05] transition-colors border-b border-gray-100 last:border-0"
              >
                <p className="font-bold text-[#01172f] text-sm">{c.name}</p>
                {c.company && <p className="text-xs text-gray-500 mt-0.5">{c.company}</p>}
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[#01172f]/10">
          <button
            onClick={onSkip}
            className="w-full py-3 text-sm font-bold uppercase tracking-wide text-gray-500 hover:text-[#01172f] transition-colors"
          >
            Start Blank Instead
          </button>
        </div>
      </div>
    </div>
  )
}
