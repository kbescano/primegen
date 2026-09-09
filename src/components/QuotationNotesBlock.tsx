"use client";

import { useEffect, useRef, useState } from "react";

export type NotesBoxState = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
};

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 24;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// Same drag/resize mechanics as the position editor in the pdf-form-filler
// project (pointer events + setPointerCapture, a move handle and a corner
// resize handle, a font-size slider) -- simpler here since this sits
// directly in live HTML rather than overlaying a flat PDF image, so there's
// no page scale or coordinate-flip to account for: box coordinates are
// plain CSS pixels within the document, top-left origin, 1:1 with drag
// deltas.
export default function QuotationNotesBlock({
  notes,
  onNotesChange,
  box,
  onBoxChange,
  onRemove,
  disabled,
}: {
  notes: string;
  onNotesChange: (value: string) => void;
  box: NotesBoxState;
  onBoxChange: (box: NotesBoxState) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  // A brand-new, still-empty note starts focused (open the editor right
  // away, nothing to click through) -- one that already has text (an
  // existing quotation being reopened) starts collapsed to its clean,
  // as-printed look instead, same as clicking away from it does.
  const [focused, setFocused] = useState(() => !notes);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<
    | null
    | {
        mode: "move" | "resize";
        pointerId: number;
        startClientX: number;
        startClientY: number;
        startBox: NotesBoxState;
      }
  >(null);

  // Click anywhere outside the note collapses it back to the plain,
  // undecorated text -- exactly how it'll print -- so it's easy to see
  // what the quotation actually looks like without the editor chrome in
  // the way. Clicking the note again (see onMouseDown below) reopens it.
  useEffect(() => {
    if (disabled || !focused) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [disabled, focused]);

  function onPointerDown(e: React.PointerEvent, mode: "move" | "resize") {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragRef.current = {
      mode,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startBox: box,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;
    if (drag.mode === "move") {
      onBoxChange({
        ...drag.startBox,
        x: Math.max(0, drag.startBox.x + dx),
        y: Math.max(0, drag.startBox.y + dy),
      });
    } else {
      onBoxChange({
        ...drag.startBox,
        width: Math.max(100, drag.startBox.width + dx),
        height: Math.max(50, drag.startBox.height + dy),
      });
    }
  }

  function endDrag(e: React.PointerEvent) {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  }

  const showEditor = focused && !disabled;

  return (
    <div
      ref={wrapperRef}
      onMouseDown={() => {
        if (!disabled && !focused) setFocused(true);
      }}
      className={`absolute rounded-sm break-inside-avoid transition-colors ${
        showEditor
          ? "border border-amber-300 bg-amber-50/90 shadow-sm print:shadow-none print:bg-amber-50/60"
          : disabled
            ? ""
            : "border border-transparent hover:border-amber-200 cursor-text"
      }`}
      style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
    >
      {/* Drag handle + toolbar -- only while actively editing, and never printed. */}
      {showEditor && (
        <div
          onPointerDown={(e) => onPointerDown(e, "move")}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="print:hidden flex items-center justify-between gap-2 px-1.5 py-1 border-b border-amber-200 bg-amber-100/80 cursor-move touch-none rounded-t-sm"
        >
          <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wide text-amber-700">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="8" cy="6" r="1.5" /><circle cx="16" cy="6" r="1.5" />
              <circle cx="8" cy="12" r="1.5" /><circle cx="16" cy="12" r="1.5" />
              <circle cx="8" cy="18" r="1.5" /><circle cx="16" cy="18" r="1.5" />
            </svg>
            Note
          </span>
          <span className="flex items-center gap-1.5">
            <input
              type="range"
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              value={box.fontSize}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) =>
                onBoxChange({ ...box, fontSize: clamp(Number(e.target.value), MIN_FONT_SIZE, MAX_FONT_SIZE) })
              }
              className="w-14 accent-amber-600 cursor-pointer"
              title="Font size"
              aria-label="Note font size"
            />
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onRemove}
              className="text-amber-500 hover:text-red-600 transition-colors leading-none text-xs"
              aria-label="Remove note"
              title="Remove note"
            >
              &times;
            </button>
          </span>
        </div>
      )}

      {/* The note itself -- this is what actually prints. */}
      <div className="px-1.5 py-1" style={{ height: showEditor ? "calc(100% - 22px)" : "100%" }}>
        {showEditor ? (
          <textarea
            autoFocus
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Type a note..."
            className="w-full h-full resize-none border-0 bg-transparent outline-none placeholder:text-amber-400/70 text-[#01172f] leading-snug"
            style={{ fontSize: box.fontSize }}
          />
        ) : (
          <p
            className="whitespace-pre-wrap break-words text-[#01172f] leading-snug"
            style={{ fontSize: box.fontSize }}
          >
            {notes}
          </p>
        )}
      </div>

      {showEditor && (
        <div
          onPointerDown={(e) => onPointerDown(e, "resize")}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="print:hidden absolute -right-1 -bottom-1 w-3 h-3 rounded-sm border border-white bg-amber-500 cursor-nwse-resize touch-none"
          title="Drag to resize"
        />
      )}
    </div>
  );
}
