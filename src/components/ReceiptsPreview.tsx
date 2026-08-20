"use client";

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);
}

// Browsers block (or silently fail) top-level navigations straight to a
// data: URI -- that's what causes a blank "Untitled" tab when a receipt
// thumbnail is opened with <a href={dataUri} target="_blank">. Opening a
// blank tab first and writing an <img>/<iframe> that *references* the data
// URI as a resource sidesteps the restriction, since that's a resource
// load rather than a full-page navigation.
function openReceiptInNewTab(fileData: string, fileType?: string, fileName?: string) {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow pop-ups for this site to view the receipt.');
    return;
  }
  const isImage = fileType === 'image' || fileData.startsWith('data:image');
  const safeTitle = escapeHtml(fileName || 'Receipt');
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<title>${safeTitle}</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #1a1a1a; }
  body { display: flex; align-items: center; justify-content: center; }
  img { max-width: 100%; max-height: 100vh; object-fit: contain; }
  iframe { width: 100vw; height: 100vh; border: none; background: #fff; }
</style>
</head>
<body>
  ${isImage
    ? `<img src="${fileData}" alt="${safeTitle}" />`
    : `<iframe src="${fileData}"></iframe>`
  }
</body>
</html>`);
  win.document.close();
  // Sever the opener link now that we're done writing to it, as a
  // reverse-tabnabbing precaution -- harmless here since we control the
  // window and its content, but no reason to leave it connected.
  try { win.opener = null; } catch {}
}

// Read-only receipt display -- no approve/reject workflow. Uploading is
// sufficient; this block just reflects what's been added so far so admins
// can review them at a glance. Clicking a thumbnail opens it in a new tab
// via openReceiptInNewTab rather than a direct <a href> data: URI link.
export default function ReceiptsPreview({ label, receipts }: { label: string; receipts: any[] }) {
  if (!receipts || receipts.length === 0) {
    return (
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
        <p className="text-[11px] text-gray-300 italic">None uploaded</p>
      </div>
    )
  }
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">
        {label} ({receipts.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {receipts.map((r: any, idx: number) => (
          <button
            key={idx}
            type="button"
            onClick={() => openReceiptInNewTab(r.fileData, r.fileType, r.fileName)}
            className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center hover:opacity-80 transition-opacity shadow-sm shrink-0 cursor-pointer"
            title={r.fileName || `Receipt ${idx + 1}`}
          >
            {r.fileData?.startsWith('data:image') ? (
              <img src={r.fileData} alt={r.fileName || 'Receipt'} className="object-cover w-full h-full" />
            ) : (
              <span className="text-[8px] font-bold text-gray-400 uppercase">PDF</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}