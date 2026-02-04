"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";

// Fun, punchy messages for the loading screen
const LOADING_QUIPS = [
  "Remember to drink water today 💧",
  "Have you stretched in the last hour?",
  "Text someone you haven't talked to in a while",
  "Fun fact: octopuses have three hearts",
  "Did you know honey never spoils?",
  "Time for a deep breath... in... and out",
  "Turtles can breathe through their butts. You're welcome.",
  "A group of flamingos is called a 'flamboyance'",
  "Your posture could probably use some love rn",
  "Bananas are berries. Strawberries aren't. Wild.",
  "The mitochondria is the powerhouse of the cell",
  "Have you told someone you appreciate them today?",
  "Cows have best friends and get stressed when separated",
  "Hot take: breakfast for dinner is elite",
  "A cloud can weigh over a million pounds",
  "Maybe go outside after this? Just a thought",
  "Wombat poop is cube-shaped. For real.",
  "You're doing great, by the way",
  "Sea otters hold hands while sleeping 🦦",
  "The inventor of the Pringles can is buried in one",
  "Reading papers counts as self-care, right?",
  "Scotland's national animal is the unicorn",
  "Sloths can hold their breath longer than dolphins",
  "You've got this 💪",
  "Honey badgers can survive cobra bites",
  "A day on Venus is longer than its year",
  "Maybe make some tea while you wait?",
  "Elephants think humans are cute (allegedly)",
  "The shortest war in history lasted 38 minutes",
  "Remember: correlation ≠ causation",
];

interface LoadingProps {
  message?: string;
  subMessage?: string;
}

export function Loading({
  message = "Loading...",
  subMessage,
}: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="absolute -inset-4 animate-pulse-subtle rounded-full bg-paper-100" />
        <Loader2 className="relative h-8 w-8 animate-spin text-paper-400" />
      </div>
      <p className="mt-6 font-display text-lg font-medium text-paper-700">
        {message}
      </p>
      {subMessage && (
        <p className="mt-1 text-sm text-paper-500">{subMessage}</p>
      )}
    </div>
  );
}

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      <div
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-paper-400"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-paper-400"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-paper-400"
        style={{ animationDelay: "300ms" }}
      />
    </div>
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
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Animated icon */}
      <div className="relative mb-8">
        <div className="absolute -inset-6 animate-pulse rounded-full bg-gradient-to-r from-amber-100 to-paper-100" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
          <Sparkles className="h-8 w-8 animate-pulse text-amber-500" />
        </div>
      </div>

      {/* Main message */}
      <h2 className="font-display text-display-sm font-normal text-paper-900">
        Analyzing papers for you, {userName}
      </h2>
      <p className="mt-2 text-paper-500">
        This usually takes a few seconds...
      </p>

      {/* Progress dots */}
      <div className="mt-6 flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-paper-300"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      {/* Fun quip */}
      <div className="mt-10 h-16 w-full max-w-sm">
        <div
          className={`rounded-xl bg-paper-100 px-6 py-4 text-center transition-opacity duration-300 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-sm text-paper-600">{LOADING_QUIPS[quipIndex]}</p>
        </div>
      </div>
    </div>
  );
}
