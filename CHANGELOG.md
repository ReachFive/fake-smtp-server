# Changelog

## 0.9.0

First release since 0.8.0 (December 2018). Published as
`@reachfive/fake-smtp-server` — see the note in the README about the unscoped
package.

### Breaking

- **Requires Node >= 20** (`engines` was `>=8.5.0`). Driven by `mailparser` and
  `smtp-server`, which both require it.
- Published under the `@reachfive` scope. The binary is still `fake-smtp-server`,
  so CLI invocations, the systemd unit and the Docker `ENTRYPOINT` are unchanged.

### Added

- `--hide-tls` stops advertising STARTTLS, for clients that auto-upgrade to a TLS
  handshake this server cannot complete.
- SMTP `AUTH` is now accepted over a plaintext connection (`allowInsecureAuth`).
  This is a fake server with no real certificate, so it previously answered
  `538 Must issue a STARTTLS command first` and blocked local mailers.

### Fixed

- Mail with no `To` or `From` header (bcc-only) no longer returns 500 from
  `GET /api/emails` when a `to`/`from` filter is applied; such mail is simply
  excluded from those filters.
- The web UI no longer crashes rendering mail without a `To`/`From`.
- Attachment blob URLs are revoked after opening, fixing a memory leak.
- `cli.error(...)` on a malformed `--auth` value now exits cleanly instead of
  running `console.log(process.exit(1))`.

### Security

Clears all 42 outstanding advisories; `npm audit` reports 0.

- `express` 4.16.4 -> 5.2.1 — `qs`, `body-parser`, `path-to-regexp` ReDoS
- `mailparser` 2.4.3 -> 3.9.23 — `linkify-it`, `nodemailer`. Also fixes the
  `this.errored` assignment that hangs the `DATA` phase on Node >= 16.9, where a
  single message cost the full client timeout.
- `smtp-server` 3.5.0 -> 3.19.9 — `nodemailer` SMTP command injection, CRLF
  header injection, TLS certificate validation
- `lodash` 4.17.11 -> 4.18.1 — `_.template` code injection, prototype pollution
- `moment` 2.24.0 -> 2.30.1, `express-basic-auth` 1.1.6 -> 1.2.1

### Internal

- Build moved from Create React App to Vite. `react-scripts@5.0.1` is the final
  CRA release and pinned `svgo` at 1.3.2 permanently, leaving 24 advisories with
  no fix path. Dependency count went from 1377 to 174. No runtime effect: the
  build output directory and served asset paths are unchanged.
- React 16 -> 18, reactstrap 7 -> 9 (Bootstrap 5, now bundled rather than loaded
  from a CDN).
- Docker images rebuilt as multi-stage on `node:22-alpine`, installing runtime
  dependencies with `npm ci --omit=dev`.
