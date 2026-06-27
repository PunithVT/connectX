# connectX Design System

connectX intentionally fuses **three** tactile visual languages. Each is mapped
to a purpose so the UI stays coherent instead of chaotic.

| Style          | Feels like            | Used for                                              |
|----------------|-----------------------|------------------------------------------------------|
| Neo-brutalism  | Bold, blocky, honest  | Primary actions, post cards, navbar, feed, badges    |
| Neumorphism    | Soft, extruded, calm  | Form inputs, toggles, search, secondary panels       |
| Skeuomorphism  | Real-world objects    | Profile "ID card", mentorship "certificate", StartupVarsity "workbench" |

## Token files (`frontend/src/styles/`)

- `tokens.css` — shared color / spacing / radius / typography variables.
- `neobrutalism.css` — `.nb-*` utility classes (hard offset shadows, thick borders).
- `neumorphism.css` — `.neu-*` classes (dual inner/outer soft shadows).
- `skeuomorphism.css` — `.skeu-*` classes (gradients, textures, bevels).
- `global.css` — resets + imports the above.

## Rules of thumb

1. **One dominant style per surface.** A card is brutalist *or* neumorphic, not both.
2. **Brutalism leads.** It is the brand's primary voice; the other two accent it.
3. **Neumorphism never for primary CTAs** (low contrast hurts accessibility).
4. **Skeuomorphism is reserved** for "moments" — onboarding completion, a booked
   mentorship session, a StartupVarsity grant — where delight pays off.
5. Respect `prefers-reduced-motion` and maintain WCAG AA contrast on text.

See each component in `frontend/src/components/ui/` for the canonical implementation.
