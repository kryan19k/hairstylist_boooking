# Aurelle — Hair Atelier booking site

Single-page Next.js 16 + Tailwind 4 site: portfolio, menu, online booking, reviews, studio info.
Content is placeholder; edit `src/lib/site.ts` and `src/lib/data.ts`.

```
npm install
npm run dev
```

## Status
- Booking runs against an in-memory store (`src/app/actions.ts`) + deterministic fake availability (`src/lib/availability.ts`).
- Supabase is the last step: replace those two with `bookings` queries.
