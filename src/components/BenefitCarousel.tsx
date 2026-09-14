"use client";

import { useRef, useState, type ReactNode } from "react";
import { BenefitCard } from "@/components/BenefitCard";

type Benefit = {
  title: string;
  description: string;
  icon: ReactNode;
};

/** A horizontally swipeable row of benefit cards — one full card at a time on
 * narrow screens, ~two at a time from `sm` up — with its own small dot row
 * tracking which card is currently in view. */
export function BenefitCarousel({ benefits }: { benefits: Benefit[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  // Neither the scroller nor the card wrappers are CSS-positioned, so
  // card.offsetLeft resolves against the page (its nearest positioned
  // ancestor, or <body>), not against the scroller — using it directly
  // silently breaks once this carousel is itself scrolled inside the outer
  // page carousel. getBoundingClientRect diffed against the scroller's own
  // rect gives the card's true position within the scroller's scrollable
  // content, regardless of positioning context.
  function cardCenterInScroller(card: HTMLDivElement, scroller: HTMLDivElement): number {
    const cardRect = card.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    return cardRect.left - scrollerRect.left + scroller.scrollLeft + cardRect.width / 2;
  }

  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const viewportCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    let closest = 0;
    let closestDist = Infinity;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const dist = Math.abs(cardCenterInScroller(card, scroller) - viewportCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setActive(closest);
  }

  // Cards snap centered (snap-center), so the target scroll position has to
  // center the card too — aligning by its left edge instead would leave
  // native scroll-snap to "correct" onto whichever card ends up nearest,
  // often not the one that was clicked.
  function goTo(index: number) {
    const card = cardRefs.current[index];
    const scroller = scrollerRef.current;
    if (!card || !scroller) return;
    const target = cardCenterInScroller(card, scroller) - scroller.clientWidth / 2;
    scroller.scrollTo({ left: target, behavior: "smooth" });
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-6 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {benefits.map((benefit, i) => (
          <div
            key={benefit.title}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="w-[82%] sm:w-[calc(50%-0.5rem)] shrink-0 snap-center"
          >
            <BenefitCard {...benefit} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {benefits.map((benefit, i) => (
          <button
            key={benefit.title}
            type="button"
            aria-label={`Show ${benefit.title}`}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-5 bg-clay-600" : "w-1.5 bg-mist"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
