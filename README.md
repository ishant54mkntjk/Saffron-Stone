# Saffron & Stone — restaurant booking website

A responsive static restaurant website built with HTML, CSS, JavaScript, and Supabase Auth + Database.

## Included
- Restaurant landing page and sample menu
- Email/password sign-up and sign-in with Supabase Auth
- Booking form that stores reservation requests in Supabase
- Logged-in users can view and cancel their own requests
- Row Level Security (RLS) policies to isolate user bookings
- Responsive layout for desktop and mobile

## Setup (required before deployment)
1. Create a project at https://supabase.com/.
2. In the Supabase dashboard, open **Project Settings → API** (or **Data API**) and copy the Project URL and the **publishable/anon public key**.
3. Open `app.js` and replace:
   - `https://YOUR_PROJECT_ID.supabase.co` with your Project URL
   - `YOUR_SUPABASE_ANON_KEY` with your publishable/anon public key
4. In Supabase, open **SQL Editor**, paste all of `supabase_schema.sql`, and run it.
5. In Supabase **Authentication → URL Configuration**, set your deployed website URL as the Site URL. Add your local development URL and any preview/deployment URLs to Redirect URLs if needed.
6. In **Authentication → Providers → Email**, choose whether email confirmation is required. If enabled, configure email delivery and users must confirm their email before signing in.

## Run locally
Because this is a static site, you can open `index.html` for a quick visual preview. For auth, use a local web server (recommended), such as VS Code Live Server, or run:
```bash
python -m http.server 8000
```
Then visit http://localhost:8000.

## Deploy
Upload `index.html`, `style.css`, and `app.js` to any static hosting provider such as Netlify, Vercel (static), GitHub Pages, or Cloudflare Pages. Keep `supabase_schema.sql` and this README for setup/reference; they do not need to be public.

## Security notes
- Browser code must use only the Supabase publishable/anon public key. Never place a `service_role` or secret key in `app.js`.
- RLS is enabled and policies scope access to `auth.uid() = user_id`.
- This is a reservation-request demo, not a restaurant management/POS system. The status is `requested`; this website does not notify restaurant staff or confirm table availability automatically.
- Use HTTPS in production. Consider adding server-side validation, rate limiting, anti-spam controls, and a staff/admin workflow before accepting real customer bookings.
- Menu items, prices, imagery, and the restaurant name are demo content and should be replaced with your own.
