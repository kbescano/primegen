"use client";

import { useState, useEffect } from "react";

export default function TypewriterEffect({ 
  text, 
  className,
  speed = 30,
  delay = 0 
}: { 
  text: string; 
  className?: string;
  speed?: number;
  delay?: number;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, started, speed]);

  // Cursor only shows while actively typing (or waiting to start) -- once
  // the full text has been displayed, it disappears instead of sitting
  // there permanently as a stray green line after every line of text.
  const isTyping = displayed.length < text.length;

  return (
    <span className={className}>
      {displayed}
      {isTyping && (
        <span className="inline-block w-[3px] h-[0.8em] bg-[#149911] ml-1 animate-pulse align-middle translate-y-[-10%]" />
      )}
    </span>
  );
}