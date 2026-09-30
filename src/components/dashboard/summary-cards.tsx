"use client";

import { TrendingDown, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { staggerDelay } from "@/components/dashboard/motion";
import { SummaryCard, type SummaryTone } from "@/components/dashboard/summary-card";
import type { SummaryCardData, SummaryCardKey } from "@/lib/finance/summary";

/** Icon, tone and entrance order for each card, in render order. */
const presentation: Record<SummaryCardKey, { icon: LucideIcon; tone: SummaryTone }> = {
  balance: { icon: Wallet, tone: "primary" },
  income: { icon: TrendingUp, tone: "success" },
  expense: { icon: TrendingDown, tone: "danger" },
};

interface SummaryCardsProps {
  cards: readonly SummaryCardData[];
}

/** Renders the balance / income / expense headline cards in a responsive grid. */
export function SummaryCards({ cards }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card, index) => {
        const { icon, tone } = presentation[card.key];

        return (
          <SummaryCard
            key={card.key}
            label={card.label}
            value={card.amount}
            caption={card.caption}
            trend={card.trend}
            icon={icon}
            tone={tone}
            delay={staggerDelay(index, 0.05, 0)}
          />
        );
      })}
    </div>
  );
}
