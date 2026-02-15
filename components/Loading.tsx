"use client";

import { useState, useEffect } from "react";

const LOADING_QUIPS = [
  "this will age well in conversation",
  "you're optimizing for depth, clearly",
  "strong methodological energy",
  "this is academically coherent, which is rare",
  "you're building an argument whether you know it or not",
  "this could become a minor obsession",
  "the bibliography is forming",
  "this has tenure-track undertones",
  "not mainstream. intentional.",
  "this feels peer-review adjacent",
  "your future self will cite this",
  "you're curating a very specific canon",
  "this is quietly ambitious",
  "respectfully, this is niche",
  "ok polymath era",
  "we're about to expand your personality",
  "you're either ahead of the curve or about to start one",
  "i see the vision. it's footnoted.",
  "this might radicalize your reading list",
  "this is either genius or a cry for help",
  "remember: correlation ≠ causation",
  "sea otters hold hands while sleeping",
  "reading papers counts as self-care, right?",
  "maybe make some tea while you wait?",
  "you're doing great, by the way",
];

interface LoadingProps {
  message?: string;
  subMessage?: string;
}

export function Loading({ message = "Loading...", subMessage }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <p
        className="font-mono text-xs"
        style={{ color: "var(--fg-muted)" }}
      >
        {message}
      </p>
      <div
        className="mt-3 w-48 relative overflow-hidden"
        style={{ height: "1px", background: "var(--border)" }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "40%",
            background: "var(--accent)",
            animation: "loadingSlide 1.5s ease infinite",
          }}
        />
      </div>
      {subMessage && (
        <p className="mt-3 text-xs" style={{ color: "var(--fg-faint)" }}>
          {subMessage}
        </p>
      )}
    </div>
  );
}

export function LoadingDots() {
  return (
    <span className="font-mono text-xs" style={{ color: "var(--fg-faint)" }}>
      <span className="animate-pulse-subtle">...</span>
    </span>
  );
}

interface FunLoadingProps {
  userName: string;
}

export function FunLoading({ userName }: FunLoadingProps) {
  const [quipIndex, setQuipIndex] = useState(() =>
    Math.floor(Math.random() * LOADING_QUIPS.length)
  );
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuipIndex((prev) => (prev + 1) % LOADING_QUIPS.length);
        setFade(true);
      }, 300);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      {/* Header */}
      <p
        className="font-serif text-display-sm"
        style={{ color: "var(--fg)" }}
      >
        Searching for you, {userName}
      </p>
      <p className="mt-1 font-mono text-xs" style={{ color: "var(--fg-faint)" }}>
        Scanning 50+ journals from the last 30 days...
      </p>

      {/* Loading bar */}
      <div
        className="mt-6 w-64 relative overflow-hidden"
        style={{ height: "1px", background: "var(--border)" }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "40%",
            background: "var(--accent)",
            animation: "loadingSlide 1.5s ease infinite",
          }}
        />
      </div>

      {/* Fun quip */}
      <div className="mt-10 w-full max-w-sm text-center">
        <p
          className="font-serif text-sm italic transition-opacity duration-300"
          style={{
            color: "var(--accent)",
            opacity: fade ? 0.7 : 0,
          }}
        >
          {LOADING_QUIPS[quipIndex]}
        </p>
      </div>
    </div>
  );
}
