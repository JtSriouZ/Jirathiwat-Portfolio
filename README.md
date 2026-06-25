# Jirathiwat Suntipreedatham Portfolio

A futuristic animated portfolio with a small backend editor for profile content, news/posts, and experience.

## Run locally

```bash
npm install
npm run dev
```

Open:

- Portfolio: `http://127.0.0.1:5173`
- Editor: `http://127.0.0.1:5173/admin`

The editor saves content to `data/content.json`.

## Admin Security

Local editing is protected by `ADMIN_PASSWORD` in `.env`.

```bash
cp .env.example .env
```

Then edit `.env` and set your own password. The `.env` file is ignored by git and should not be pushed.

Public GitHub Pages builds are static and read-only. They do not expose the local backend edit APIs.

## Add Images and YouTube Videos

Open the local editor at `http://127.0.0.1:5173/#/admin`.

- For post images, paste a public image URL into `Image URL`.
- For YouTube embeds, paste a normal YouTube watch URL or short `youtu.be` URL into `YouTube URL`.
- For project cards, edit the `Projects` section and add repository, live site, image, language, and description fields.

After editing, commit the changed `data/content.json` and push to publish the updated static site.

## Publish to GitHub Pages

This project includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

1. Push the repository to GitHub.
2. Go to your repository settings.
3. Open `Pages`.
4. Set the source to `GitHub Actions`.
5. Push to `main`.

The workflow will build and publish the site to:

```text
https://<your-github-username>.github.io/Jirathiwat-Portfolio/
```

GitHub Pages is static, so it cannot run the Express backend. Use `npm run dev` locally to edit profile, posts, and experience, then commit the changed `data/content.json` and push again.

## Build

```bash
npm run build
npm run server
```

The production server runs on `http://127.0.0.1:5174` by default.

For a local GitHub Pages-style build:

```bash
npm run build:pages
```
