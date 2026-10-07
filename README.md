# Bog Life (PWA)

Static, no-build PWA. Run locally: `python -m http.server 8000` and open http://localhost:8000.

To install on iPhone: host over HTTPS (e.g. GitHub Pages), open in Safari, Share → Add to Home Screen.

Notes: iOS ignores the Vibration API, so haptics are a no-op there. `apple-touch-icon` should be a 180×180 PNG for best results on iOS (currently SVG).
