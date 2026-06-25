# Jirathiwat Suntipreedatham Portfolio

A futuristic animated portfolio with an admin editor for profile content, projects, posts, experience, academic history, certificates, and skills.

## Run Locally

```bash
npm install
npm run dev
```

Open:

- Portfolio: `http://127.0.0.1:5173`
- Editor: `http://127.0.0.1:5173/#/admin`

Local editing saves to `data/content.json` and local uploads save into `public/`.

## Admin Security

Editing is protected by `ADMIN_PASSWORD`.

```bash
cp .env.example .env
```

Then edit `.env` and set:

```env
ADMIN_PASSWORD=Jirathiwat999
```

The `.env` file is ignored by git and should not be pushed.

## Deploy To Vercel

This project is now Vercel-ready. Vercel serves the Vite frontend from `dist/` and runs the backend through `api/index.js`.

In Vercel, set these Environment Variables:

```env
ADMIN_PASSWORD=Jirathiwat999
BLOB_READ_WRITE_TOKEN=<your-vercel-blob-token>
```

`BLOB_READ_WRITE_TOKEN` is required for production admin edits and profile image uploads to persist. Without it, the deployed site still displays the bundled `data/content.json`, but the admin panel stays read-only.

Recommended Vercel settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

The included `vercel.json` already routes `/api/*` to the backend function and all other routes to the React app.

## Add Images And YouTube Videos

Open the editor at `/#/admin`.

- For post, project, and certificate images, paste a public image URL into `Image URL`.
- For profile photo uploads, use the profile image uploader.
- For YouTube embeds, paste a normal YouTube watch URL, Shorts URL, or short `youtu.be` URL.
- For galleries, paste media URLs into `Media URLs`.

## Build

```bash
npm run build
```

For an old static-only build:

```bash
npm run build:static
```

For the previous GitHub Pages base-path build:

```bash
npm run build:pages
```
