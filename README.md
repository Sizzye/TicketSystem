# Repair Desk Web

Beginner-friendly starter web app for an electronics repair business. The app now runs in the browser, which means you can build it on Windows and later use it from your MacBook at the shop.

## What this project is right now

This first step gives you:

- A `Next.js` web app foundation
- A home page that explains the system
- A ticket list screen with sample data
- A new ticket screen with a live sticker preview
- Browser-based print testing so you can try it with a normal Wi-Fi printer

It does not connect to a real database yet. We will wire up `Supabase` next.

## Why this stack

- `Next.js`: the web app framework
- `Vercel`: where the app will be hosted online
- `Supabase`: where your business data will live

## Mental model

- `src/app`: your pages
- `src/components`: reusable UI pieces
- `src/lib`: simple shared data and helper code
- `src/app/globals.css`: the main app styling

## Run locally

1. Install dependencies:

```powershell
npm install
```

2. Start the development server:

```powershell
npm run dev
```

3. Open the local address shown in the terminal, usually:

```text
http://localhost:3000
```

## Next milestones

1. Create a real `Supabase` project
2. Add sign-in for you and staff
3. Save tickets to the database
4. Add printable intake and label layouts
5. Deploy to `Vercel`
