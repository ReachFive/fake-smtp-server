# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Fake SMTP Server: an email testing tool. It runs a real SMTP server that accepts and parses incoming mail into memory, plus an HTTP API and web UI to inspect those mails. Published to npm as `fake-smtp-server` and to Docker Hub as `reachfive/fake-smtp-server`.

## Architecture

There are two runtimes in one codebase, decoupled at runtime via HTTP:

- **Backend — `index.js` (repo root).** The npm package's `bin` and Docker entrypoint. It:
  - Starts an SMTP server (`smtp-server`) that parses each message with `mailparser` and `unshift`s it onto an in-memory `mails` array, trimming to `--max` (default 100). No persistence — restart loses everything.
  - Starts an Express app exposing `GET /api/emails` (with `from`/`to`/`since`/`until` query filters), `DELETE /api/emails`, and serves the built React app from `build/`.
  - CLI flags are parsed with the `cli` package (see `cli.parse` call, or README Usage). `--headers` toggles whether parsed mail headers are included in API responses. `--auth USER:PASS` enables HTTP basic auth. `--whitelist` restricts accepted sender addresses.

- **Frontend — `src/` (Create React App).** `src/App.js` fetches `/api/emails` and renders each mail in a collapsible reactstrap card. `baseUrl` switches between `localhost:1080` in dev and same-origin in production. Bootstrap CSS is loaded from a CDN in `public/index.html`.

The two only communicate through the HTTP API. The backend serves the frontend's compiled output; `npm run build` must run before the backend can serve the UI (the Docker builds do this).

## Packaging quirk (important)

`package.json` `"files": ["build"]` means **only the compiled `build/` dir ships to npm** — `src/` does not. `prepublishOnly` runs `npm run build` so the published tarball contains `index.js` (bin) + `build/`. React deps are in `devDependencies` because they are build-time only. Keep the backend (`index.js`) dependency-light and in `dependencies`; keep React/UI tooling in `devDependencies`.

## Commands

```bash
npm start            # run React dev server (frontend only, expects backend on :1080)
npm run build        # compile React app into build/ (PUBLIC_URL=./)
npm test             # react-scripts test runner (jsdom); frontend tests only
node index.js        # run the actual SMTP + HTTP backend (SMTP :1025, HTTP :1080)
npm run docker:build # docker build -t reachfive/fake-smtp-server .
```

There are currently no backend tests; `npm test` only covers the React app.

## Docker / deploy

Two Dockerfiles exist and differ:
- `Dockerfile` (repo root) — used by `npm run docker:build` / Docker Hub image.
- `devops/docker/dockerfile-fakesmtp` — used by GCP Cloud Build (`devops/docker/cloudbuild-fakesmtp.yaml`), which pushes to Artifact Registry `europe-docker.pkg.dev/$PROJECT_ID/reachfive/fakesmtp`.

Both `COPY . /www` then `npm i && npm run build`, so both need devDependencies present at build time. **When changing Node version or build steps, update both Dockerfiles.**
