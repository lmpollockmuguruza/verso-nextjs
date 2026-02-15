"use client";

import { useState, useEffect } from "react";

const LOADING_QUIPS = [
  "Remember to drink water today",
  "Have you stretched in the last hour?",
  "Text someone you haven't talked to in a while",
  "Fun fact: octopuses have three hearts",
  "Did you know honey never spoils?",
  "Time for a deep breath... in... and out",
  "A group of flamingos is called a 'flamboyance'",
  "Your posture could probably use some love",
  "The mitochondria is the powerhouse of the cell",
  "Have you told someone you appreciate them today?",
  "Hot take: breakfast for dinner is elite",
  "A cloud can weigh over a million pounds",
  "Maybe go outside after this? Just a thought",
  "You're doing great, by the way",
  "Sea otters hold hands while sleeping",
  "Reading papers counts as self-care, right?",
  "Scotland's national animal is the unicorn",
  "You've got this",
  "A day on Venus is longer than its year",
  "Maybe make some tea while you wait?",
  "Elephants think humans are cute (allegedly)",
  "Remember: correlation ≠ causation",
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
            background: "var(--fg)",
            animation: "loadingSlide 1.5s ease infinite",
          }}
        />
      </div>

      {/* Fun quip */}
      <div className="mt-10 w-full max-w-sm text-center">
        <p
          className="font-serif text-sm italic transition-opacity duration-300"
          style={{
            color: "var(--fg-faint)",
            opacity: fade ? 1 : 0,
          }}
        >
          {LOADING_QUIPS[quipIndex]}
        </p>
      </div>
    </div>
  );
}
