"use client";

import React, { useState, useEffect } from "react";

export type TypewriterLine = {
  text: string;
  as?: React.ElementType;
  className?: string;
  charsPerTick?: number;
};

export default function TypewriterEffect({
  text,
  className,
  speed = 30,
  delay = 0,
  containerClassName,
  lines,
}: {
  // Legacy Single-line mode
  text?: string;
  className?: string;
  speed?: number;
  delay?: number;
  
  // New Multi-line mode
  containerClassName?: string;
  lines?: TypewriterLine[];
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  // Multi-line specific state
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    // MULTI-LINE MODE
    if (lines && lines.length > 0) {
      if (currentLineIndex >= lines.length) return;

      const currentLine = lines[currentLineIndex];
      const fullText = currentLine.text || "";
      const charsPerTick = currentLine.charsPerTick || 1;

      if (displayed.length < fullText.length) {
        const timer = setTimeout(() => {
          setDisplayed(fullText.substring(0, displayed.length + charsPerTick));
        }, speed);
        return () => clearTimeout(timer);
      } else {
        // Line finished, move to the next one
        const timer = setTimeout(() => {
          setCurrentLineIndex((prev) => prev + 1);
          setDisplayed(""); // Reset display buffer for next line
        }, speed * 2);
        return () => clearTimeout(timer);
      }
    } 
    // SINGLE-LINE MODE
    else if (text) {
      if (displayed.length < text.length) {
        const timer = setTimeout(() => {
          setDisplayed(text.substring(0, displayed.length + 1));
        }, speed);
        return () => clearTimeout(timer);
      }
    }
  }, [started, lines, text, currentLineIndex, displayed, speed]);

  // Render Multi-line
  if (lines && lines.length > 0) {
    return (
      <div className={containerClassName}>
        {lines.map((line, idx) => {
          const Tag = line.as || "p";
          const isCurrent = idx === currentLineIndex;
          const isPast = idx < currentLineIndex;
          const isLast = idx === lines.length - 1;
          const isFinished = currentLineIndex >= lines.length;

          // Hide lines we haven't typed yet
          if (!isPast && !isCurrent && !isFinished) return null;

          const content = isPast || isFinished ? line.text : displayed;
          const showCursor = (isCurrent && started) || (isLast && isFinished);

          return (
            <Tag key={idx} className={line.className}>
              {content}
              {showCursor && (
                <span className="inline-block w-[3px] h-[0.8em] bg-[#149911] ml-1 animate-pulse align-middle translate-y-[-10%]" />
              )}
            </Tag>
          );
        })}
      </div>
    );
  }

  // Render Single-line Fallback
  return (
    <span className={className}>
      {displayed}
      <span className="inline-block w-[3px] h-[0.8em] bg-[#149911] ml-1 animate-pulse align-middle translate-y-[-10%]" />
    </span>
  );
}