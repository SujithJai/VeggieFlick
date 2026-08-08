"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChefHat, Clock, UtensilsCrossed } from "lucide-react";

const DIALOGUES = [
  {
    title: "No chopping. No stress. Just fresh cooking.",
    desc: "Pre-washed, freshly cut vegetables & ready-to-cook kits ready when you reach home from work.",
  },
  {
    title: "From our chop board to your hot pan.",
    desc: "Skip 30 minutes of tedious peeling and slicing. Just open the pack and sizzle!",
  },
  {
    title: "Save time on the prep. Spend time on the meal.",
    desc: "Ideal for busy office goers and families across Chennai.",
  },
  {
    title: "ஆபீஸ்ல இருந்து வர்றீங்களா? 10-Min Easy Cooking!",
    desc: "10 நிமிஷத்துல Ready to Cook Meal Kits & Pre-cut Veggies delivered fresh.",
  },
  {
    title: "Freshly cut. Easily cooked. Loved by all.",
    desc: "Harvested at dawn from partner farms in Tamil Nadu and delivered to your doorstep.",
  },
];

export function ChefDialogueSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % DIALOGUES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const current = DIALOGUES[index];

  return (
    <div className="mt-6 rounded-3xl border border-sky-200/80 bg-white/90 p-5 shadow-xl backdrop-blur-md transition-all md:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 text-white shadow-md">
          <ChefHat className="h-8 w-8" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-extrabold text-sky-900 uppercase tracking-wider">
              Chef&apos;s Special Solution
            </span>
            <span className="text-xs font-semibold text-muted flex items-center gap-1">
              <Clock size={12} className="text-sky-600" /> 10-Min Meal Kits
            </span>
          </div>

          {/* Animated Dynamic Text Overlay */}
          <div className="relative mt-2 min-h-[4rem]">
            <div
              key={index}
              className="animate-fade-in transition-all duration-700 ease-in-out"
            >
              <h3 className="text-base font-extrabold text-slate-900 md:text-lg">
                &ldquo;{current.title}&rdquo;
              </h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed md:text-sm">
                {current.desc}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/shop?category=ready-to-cook"
              className="btn btn-primary bg-sky-800 hover:bg-sky-900 border-none py-2 text-xs font-bold shadow-sm"
            >
              <UtensilsCrossed size={14} /> Ready to Cook Kits
            </Link>
            <Link
              href="/shop?category=cut-vegetables"
              className="btn btn-outline border-sky-300 text-sky-900 hover:bg-sky-50 py-2 text-xs font-bold"
            >
              Pre-Cut Veggies 🥗
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
