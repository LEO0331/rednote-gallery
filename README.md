# RedNote Milestone Gallery

[![CI](https://github.com/LEO0331/rednote-gallery/actions/workflows/deploy-and-lighthouse.yml/badge.svg)](https://github.com/LEO0331/rednote-gallery/actions/workflows/deploy-and-lighthouse.yml)
[![Coverage](https://img.shields.io/badge/coverage-85%25%2B-brightgreen)](#quality-checks)

A fast, static showcase site for RedNote / Xiaohongshu badges, achievement captures, and growth milestones.

## What this site is

- A customer-facing portfolio gallery
- Fully static and GitHub Pages ready
- No backend, no database, no upload API, no cloud storage
- All images are stored in the repository under `badges/`

## Visitor experience

- Responsive gallery layout (desktop, tablet, mobile)
- Lightbox preview for every image
- Tag-based filtering
- Sort options (newest first / oldest first)
- Dark/light theme toggle
- Language toggle: English, Traditional Chinese, Simplified Chinese
- Footer with latest milestone update date

## How content is managed

To publish a new badge or milestone:

1. Add the image file to `badges/`.
2. Add one record to the `badges` array in `app.js`.
3. Commit and push to GitHub.

Supported image formats:
- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.gif`

## Deploy to GitHub Pages

1. Open your repository on GitHub.
2. Go to **Settings** -> **Pages**.
3. Select **Deploy from branch**.
4. Choose `main` branch and `/ (root)`.
5. Save.

Your site URL will be:

- `https://<github-username>.github.io/<repository-name>/`

## Local preview

- Open `index.html` directly in a browser, or
- Use a simple static server (for example VS Code Live Server).

## Quality checks

### E2E tests (Playwright)

```bash
npm ci
npx playwright install chromium
npm run test:e2e
```

### Unit + coverage gate

```bash
npm run test:coverage
```

Coverage threshold is enforced at **85%+** (including branch coverage).

## CI workflow

GitHub Actions runs:

1. Unit coverage gate
2. Playwright E2E tests
3. Lighthouse CI audit
4. GitHub Pages deployment (on `main` after all checks pass)

## Privacy and repository hygiene

- The project documentation intentionally avoids personal machine paths.
- Build/test artifacts are excluded through `.gitignore`.

## License

Distributed under the terms of the repository [LICENSE](LICENSE).

## Contact

For collaboration or usage questions, open a GitHub Issue in this repository.
