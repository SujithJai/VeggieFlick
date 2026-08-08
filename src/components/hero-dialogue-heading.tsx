"use client";

import { useEffect, useState } from "react";

const HERO_QUOTES = [
  "No chopping. No stress. Just fresh cooking.",
  "From our chop board to your hot pan.",
  "Freshly cut. Easily cooked. Loved by all.",
  "Save time on the prep. Spend time on the meal.",
];

export function HeroDialogueHeading() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_QUOTES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-[7.5rem] md:min-h-[10rem] flex items-center">
      <h1
        key={index}
        className="animate-fade-in text-balance text-[38px] font-extrabold leading-[1.08] tracking-[-0.03em] text-slate-900 md:text-[58px]"
      >
        &ldquo;{HERO_QUOTES[index]}&rdquo;
      </h1>
    </div>
  );
}
