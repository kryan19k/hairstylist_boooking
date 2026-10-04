# Ella El Beauty Salon: booking site

Next.js 16 + Tailwind 4 + Supabase. Single page with tabs (Work, Menu, Book, Stories, Studio),
ivory/black modes, 8 color shades, a hairbrush cursor, and an owner dashboard at `/admin`.

## Run
```
npm install
cp .env.example .env.local   # then fill in your Supabase URL + publishable key
npm run dev
```

## One-time Supabase setup
1. Supabase dashboard -> **SQL Editor** -> paste `supabase/schema.sql` -> **Run**.
2. **Authentication -> Users -> Add user** (email + password, tick "Auto confirm"). This is the owner login.
   Then **Authentication -> Sign In / Providers**: turn OFF "Allow new users to sign up".
3. Open `/admin`, sign in, press **I'm the owner. Claim it** (works once), then **Load starter content**.

After that the owner edits services, portfolio photos, reviews, FAQ, hours, contact info and
colors from `/admin`. Changes appear on the public site immediately.

## Notes
- Until the schema is installed the site runs on built-in sample content and bookings are kept in memory.
- Reviews in the starter content are placeholders. Replace them with real ones before launch.
- No emails/SMS or deposit payments are sent yet; the owner confirms bookings from the dashboard.
