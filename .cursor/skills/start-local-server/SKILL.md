---
name: start-local-server
description: >-
  Start a local static-file HTTP server for this Breakout project. Use when the
  user asks to start, run, or launch a local server, dev server, or preview the
  game in the browser.
---

# Start Local Server

This project is static HTML/ES modules (no build step). Serve the repo root over HTTP so modules and assets load correctly.

## Defaults

| Setting | Value |
|---------|-------|
| Port | `8080` |
| Bind | `127.0.0.1` |
| URL | `http://127.0.0.1:8080/` |
| Root | Repository root (where `index.html` lives) |

## Workflow

1. **Check existing servers** — List the terminals folder. If a server is already running on port 8080 and responding, tell the user the URL; do not start another.

2. **Clear port conflicts (Windows)** — Multiple listeners on the same port break requests. If 8080 is in use but not responding:
   ```powershell
   netstat -ano | findstr ":8080"
   taskkill /PID <pid> /F
   ```
   Kill only processes bound to the target port.

3. **Start the server in the background** — Use the Shell tool with `block_until_ms: 0` and `working_directory` set to the repo root:
   ```powershell
   py -m http.server 8080 --bind 127.0.0.1
   ```
   Fall back to `python -m http.server 8080 --bind 127.0.0.1` if `py` is unavailable.

4. **Verify** — Confirm HTTP 200:
   ```powershell
   py -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8080/').status)"
   ```

5. **Report** — Give the user `http://127.0.0.1:8080/` as the game URL.

## Shell Notes (Windows)

- Prefer `working_directory` over `cd` chaining.
- Do not use `&&` in PowerShell; use `;` or separate commands.
- Avoid starting duplicate background servers on the same port.

## Console Check

To validate the game after server changes:

```powershell
node scripts/check-console.mjs
```

Optional custom URL:

```powershell
node scripts/check-console.mjs http://127.0.0.1:8080/
```

Ensure the server is running before running the check.
