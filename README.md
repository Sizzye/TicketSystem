# Repair Desk Web

Repair shop ticket system built with `Next.js`, with custom login, ticket intake, ticket dashboard, sticker printing, and Supabase-ready cloud ticket storage.

## Current status

The app currently includes:

- Login page with the current shop credentials
- New ticket form
- Ticket dashboard
- Search by customer name or phone
- Status updates
- Edit and delete actions
- Finished tickets view
- Browser print label flow
- DYMO print path for testing
- Supabase integration for cloud ticket storage

## Important note

`.env.local` is intentionally not pushed to GitHub because it contains private values.

You will need to create your own local `.env.local` on each computer by copying `.env.local.example`.

## Supabase setup

This project is now wired to use Supabase for tickets.

Before tickets will save in the cloud, run the SQL file below in your Supabase project:

- `supabase/tickets-setup.sql`

In Supabase:

1. Open your project
2. Go to `SQL Editor`
3. Paste in the contents of `supabase/tickets-setup.sql`
4. Run it

## Local setup on a new computer

1. Clone the repo:

```powershell
git clone https://github.com/Sizzye/TicketSystem.git
```

2. Go into the project:

```powershell
cd TicketSystem
```

3. Install packages:

```powershell
npm install
```

4. Create `.env.local` from `.env.local.example`

5. Start the app:

```powershell
npm run dev:reset
```

6. Open:

```text
http://localhost:3000
```

## Required environment variables

Put these in `.env.local`:

```env
REPAIR_DESK_SESSION_SECRET=your-secret-here
REPAIR_DESK_OWNER_USERNAME=er4gadgets
REPAIR_DESK_OWNER_PASSWORD=Humberto11
REPAIR_DESK_OWNER_NAME=Store Owner
REPAIR_DESK_STAFF_USERNAME=staff
REPAIR_DESK_STAFF_PASSWORD=staff1234
REPAIR_DESK_STAFF_NAME=Staff
NEXT_PUBLIC_SUPABASE_URL=https://jlxsizllrmxbbtsnmfnq.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key-here
```

## Project structure

- `src/app`: routes and pages
- `src/components`: UI pieces
- `src/lib`: auth, ticket helpers, Supabase, DYMO helpers
- `supabase/tickets-setup.sql`: database setup for testing

## What to do next

1. Run the Supabase SQL file
2. Test ticket create, edit, status update, delete, and print
3. Test DYMO printing at the shop
4. Deploy the app to Vercel for browser access from both computers
5. Replace the temporary test-friendly Supabase policies with proper auth/security before real business use
