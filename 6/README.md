# B41M 17PlayBox — PS4 Exploit Host

> A modern, terminal-styled web-based exploit host for the PlayStation 4 (FW 6.00–11.02).

![Terminal UI](includes/ps.jpg)

---

## Overview

**B41M 17PlayBox** is a self-hosted, browser-based jailbreak tool for the PlayStation 4. It leverages a WebKit/JavaScript exploit chain running entirely from the PS4's built-in web browser — no PC or external dongle required after the initial setup.

The interface was designed as a full **HACKING TERMINAL** experience with:

- Glitching animated banner & matrix-style background
- Live status dashboard (System / Exploit / Uptime / Connection)
- Real-time uptime counter
- Kernel exploit chain selection
- Auto-jailbreak countdown with retry logic
- Animated terminal log console

---

## Features

| Feature | Description |
|---------|-------------|
| 🧠 **Dual Exploit Chains** | Supports both **NetCtrl** and **Lapse** kernel exploit chains |
| 🛠 **Kernel Patches** | Bundled kernel patches for firmware `6.00` → `11.02` |
| 📦 **Payload Injection** | Loads external `payload.bin` after a successful jailbreak |
| 🌐 **Offline Ready** | Uses AppCache (`cache.manifest`) so everything runs offline after first load |
| 🤖 **Auto Jailbreak** | Optional countdown-based auto-execution, persisted via `localStorage` |
| ⏱ **Uptime Tracker** | Live `HH:MM:SS` uptime counter since page load |
| 🖥 **Terminal UI** | CRT scanlines, matrix rain, green-on-black hacking aesthetic |
| 📊 **Live Status** | Dashboard tracks system, exploit, connection and uptime in real time |

---

## Supported Firmware

| Firmware | Patch |
|----------|-------|
| 6.00 – 6.20 | `600.bin` / `620.bin` |
| 6.50 – 6.72 | `650.bin` / `670.bin` |
| 7.00 – 7.50 | `700.bin` / `750.bin` |
| 8.00 – 8.50 | `800.bin` / `850.bin` |
| 9.00 – 9.50 | `900.bin` / `903.bin` / `950.bin` |
| 10.00 – 10.50 | `1000.bin` / `1050.bin` |
| 11.00 – 11.02 | `1100.bin` / `1102.bin` |

---

## Getting Started

### 1. Host the files

Deploy the contents of this repository to any static web server, e.g.:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (npx)
npx serve .

# PHP
php -S 0.0.0.0:8080
```

### 2. Open from your PS4

1. Make sure your PS4 and the host machine are on the **same network**.
2. On the PS4 browser, go to:
   ```
   http://<your-host-ip>:<port>/
   ```
3. Wait for the page to load and cache (look for the ✓ in the title bar).
4. Select your preferred exploit chain (**NetCtrl** or **Lapse**).
5. Click **`> JEILBREK`** — or enable **Auto Jailbreak** and let it count down.

---

## Project Structure

```
.
├── index.html                     # Main exploit page (terminal UI)
├── cache.manifest                 # Offline AppCache manifest
├── appcache_manifest_generator.py # Tool to regenerate the AppCache manifest
├── includes/
│   ├── style.css                  # Terminal / hacker theme
│   ├── script.js                  # UI logic, dashboard, auto-JB (and uptime)
│   └── ps.jpg                     # Console illustration
└── src/
    ├── main.js                    # Entry point — orchestrates the whole exploit
    ├── misc.js                    # Logger, BInt (64-bit int), version detection
    ├── loader.js                  # ELF payload loader (mmap + pthread)
    ├── worker.js                  # Web Worker runtime for kernel primitives
    ├── workers.js                 # RPCWorker class (main ↔ worker bridge)
    ├── lapse.js                   # Lapse kernel exploit chain
    ├── netctrl.js                 # NetCtrl kernel exploit chain
    ├── payload.bin                # User payload (loadable after jailbreak)
    └── ps4/
        ├── constants.js           # Per-firmware constants
        ├── userland.js            # Userland (WebKit) exploit layer
        ├── kernel.js              # Kernel exploit layer
        └── patches/               # Firmware-specific kernel patches (60x → 11.02)
```

---

## How It Works

```
┌──────────────┐    ┌─────────────────┐    ┌─────────────────────┐
│  index.html  │ →  │  userland.js    │ →  │  kernel exploit     │
│  (UI/host)   │    │  (WebKit ROP)   │    │  (lapse / netctrl)  │
└──────────────┘    └─────────────────┘    └──────────┬──────────┘
                                                      ▼
                                            ┌─────────────────────┐
                                            │  kernel ARW (R/W)   │
                                            │  + jailbreak()      │
                                            └──────────┬──────────┘
                                                      ▼
                                            ┌─────────────────────┐
                                            │  kernel_patches()   │
                                            │  + load_bin()       │
                                            └─────────────────────┘
```

1. **Version detection** — parses the PS4 user agent to identify console & firmware.
2. **Userland exploit** — WebKit vulnerability gives **addrof/fakeobj** primitives (bypassed via Web Worker for the specific Safari/JSC version).
3. **Kernel primitive** — ROP chain escalates to kernel **arbitrary read/write (ARW)**.
4. **Jailbreak** — `jailbreak()` patch is applied if not already rooted.
5. **Kernel patches** — firmware-specific `.bin` patches are fetched and applied.
6. **Payload** — `payload.bin` is mapped into memory and executed in a new thread.

---

## Regenerating the AppCache Manifest

```bash
python3 appcache_manifest_generator.py .
```

This regenerates `cache.manifest` with SHA-256 hashes for every file, so the PS4 browser knows when to refresh its cached copy.

---

## Safety & Legal Disclaimer

> ⚠️ **FOR EDUCATIONAL / RESEARCH PURPOSES ONLY**

- This software modifies the security model of a consumer gaming device.
- Bypassing PlayStation protections may violate the **Sony Interactive Entertainment Terms of Service** and may void your warranty.
- Do **not** use this on a console you don't own.
- The author assumes **no responsibility** for any damage, bans, or bricked consoles resulting from the use of this software.
- Payloads (`payload.bin`) are **external** and are executed with kernel privileges — only load trusted payloads.

---

## Troubleshooting

| Problem | Likely cause / fix |
|---------|-------------------|
| Page loads but exploit fails | Firmware unsupported or patch missing — double-check the version in the User-Agent |
| White screen / crash | Clear the PS4 browser cache & cookies, then reload once more |
| AppCache not updating | Regenerate `cache.manifest` (see above) and bump a file hash |
| Auto JB never fires | Ensure the **Auto Jailbreak** toggle is enabled and the button is not disabled |
| Caching stuck | Use the included `appcache_manifest_generator.py` and re-deploy |

---

## Credits & License

**Project:** B41M 17PlayBox PS4 Exploit Host  
**Owner:** Ibrahim Yusuf  
**Location:** Jl. Tahir, Muara Jawa, Kukar, Kalimantan Timur, Indonesia.

This project is provided **as-is**, without warranty of any kind. Use it responsibly and only on hardware you own.

