# KeyWord Compare

A separate IRIS-based project for comparing KeyWord files and storing comparison results.

## Structure

- `IRIS/backend`: IRIS persistent classes for configuration, comparison runs, discovered fields, and differences.
- `IRIS/ui`: browser UI files (`index.html`, `app.js`, `styles.css`, `web.config`).

## Current local hosting setup

- IIS site name: `KWCompare`
- URL: `http://lpv-itfwin12:8086/`
- Physical path: `C:\inetpub\KWCompare`

The UI uses same-origin API calls via `/api`.

- UI base URL default: `/api`
- IIS rewrite proxy target: `https://itf-webapache-dev.co.ihc.com:8443/KWCompare/*`

## Publish UI locally

Run from the repository root:

```powershell
.\publish-ui.ps1
```

Optional custom destination:

```powershell
.\publish-ui.ps1 -Destination "C:\inetpub\KWCompare"
```

## Troubleshooting

### Sign-in popup appears repeatedly

Cause: the browser receives `401` with `WWW-Authenticate: Basic` from proxied `/api/*` requests.

Checks:

```powershell
curl -i http://lpv-itfwin12:8086/api/runs
```

Expected: `401 Unauthorized` when no credentials are sent.

Actions:

- Enter username/password in the UI before loading runs or running comparisons.
- Hard refresh the page (`Ctrl+F5`) after publishing new UI files.

### API call fails from UI

Confirm UI endpoint is up:

```powershell
curl -i http://lpv-itfwin12:8086/
```

Confirm IIS proxy route is active:

```powershell
curl -i http://lpv-itfwin12:8086/api/runs
```

If `/api/runs` does not return through IIS, confirm [IRIS/ui/web.config](IRIS/ui/web.config) is published to `C:\inetpub\KWCompare\web.config`.

### Backend authentication errors

`401` after credentials usually means invalid backend credentials.

Quick backend check:

```powershell
curl -k -i "https://itf-webapache-dev.co.ihc.com:8443/KWCompare/runs" -u <username>
```

### CORS checks

With the current setup, UI calls should be same-origin (`/api`) and not require browser CORS to the remote IRIS host.
If CORS errors appear in the browser, verify that the UI is still using `/api` in [IRIS/ui/index.html](IRIS/ui/index.html).
