# Design Brief — Landing Page

**North-star reference:** https://pasin.ryyarf.my.id/

The landing page should feel as clean, modern, and intentional as the reference.
Below is the design DNA extracted from it, adapted to our Finance Tracker.

## Aesthetic
- **Light / minimal.** Clean (near-white) background, near-black text, lots of
  whitespace. One restrained accent color — do not use a loud palette. (Provide a
  dark-mode variant too, but the default look is light and airy.)
- **Numbered sections.** Each major section is introduced with a big number
  (`01`, `02`, `03`, …) as a divider/label — a signature of the reference.
- **Editorial rhythm.** Generous spacing between sections; content breathes.

## Typography
- Modern **humanist sans-serif** for body and headings.
- Clear hierarchy: large confident headlines, calm descriptive subheads.
- Big section numbers as a recurring typographic motif.
- Conversational, human copy (short, direct sentences).

## 3D (react-three-fiber)
- An **interactive, drag-to-rotate 3D object** in/near the hero — the reference
  uses a 360° rotatable model. For a finance app use a fitting metaphor: a
  spinning **coin**, a **credit/debit card**, a **wallet**, or an abstract
  financial shape.
- Subtle **auto-rotate** at rest + **pointer parallax**; user can grab to spin.
- Tasteful lighting/materials. **Lazy-load** it and respect
  `prefers-reduced-motion` (show a static fallback).

## Motion (framer-motion)
- **Scroll-triggered reveals**: sections and items fade/slide up as they enter
  the viewport, with gentle stagger.
- **Smooth transitions** between states; nothing abrupt.
- **Micro-interactions**: button hovers, a magnetic primary CTA, animated nav,
  smooth anchor scrolling between the numbered sections.
- Keep motion subtle and fast (~200-350ms, ease-out). Premium, not flashy.

## Suggested section flow (adapt copy to finance)
1. **Hero** — headline + subhead + primary CTA, with the 3D object.
2. **Concept / value** — what the app does, in human language.
3. **Interactive highlight** — the 3D piece or an animated product preview.
4. **How it works** — 3-4 numbered steps.
5. **Features** — grid of key features (track, budget, report, secure).
6. **Social proof / stats** — numbers or testimonials (placeholder ok).
7. **Footer CTA** — sign-up prompt + footer info.

## Quality bar
When Day 08 (landing refinement) is done, the page should stand next to the
reference and feel like it belongs in the same tier: clean, smooth, modern, with
3D and animation that feel purposeful — never cluttered or janky.

## Current state (already built, Days 01-07)
The landing already has: hero with an interactive 3D floating coin, ambient 3D
particle background, features + how-it-works + footer, design tokens with dark
mode, entrance/scroll animations, magnetic CTA, animated nav, and a responsive +
reduced-motion pass. Day 08 is about **refining** this toward the reference — not
rebuilding it.
