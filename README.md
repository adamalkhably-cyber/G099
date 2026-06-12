# G099 — Local Files

## Files included
- index.html — App shell and static layout
- styles.css — All visual styles and responsive rules
- app.js — Client-side logic: data loading, rendering, search, add-item modal
- data/items.json — Seed data for items and outfits
- components/modal.html — Modal fragment for adding items
- README.md — This file

## Quick start (local)
1. Put all files in a single folder.
2. Serve the folder with a local static server:
   - Python 3: `python -m http.server 8000`
   - Node (http-server): `npx http-server -p 8000`
3. Open `http://localhost:8000` in your browser.

## Persistence
- The app seeds from `data/items.json` and then stores changes in `localStorage` under key `digital-closet-data-v1`.
- To reset data, clear localStorage for the site or remove the key.

## Extending
- To add server-backed persistence, replace localStorage calls in `app.js` with fetch calls to your API.
- Add authentication, image uploads, and richer outfit-generation logic as needed.

## Notes
- The UI is intentionally data-driven: update `data/items.json` to change initial content.

