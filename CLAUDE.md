# Bog Life (life-tracker)

Read `NOTES.md` first. It has how to run and test the app, the release routine, how the code is organised and what is not yet confirmed on a real device.

## Keep NOTES.md true
When a change affects how the app works or is tested, update `NOTES.md` in the same commit. That means a new file, a new saved setting (localStorage key), a new
feature or setting, a changed build or test step, or a newly confirmed or newly found problem. Keep it short: fix or remove lines that are no longer true
instead of adding more. Also keep the "Last updated at vX.Y.Z" line current.

## Every change
- Bump `APP_VERSION` in `index.html`.
- Test it in the browser pane. Say plainly what was and wasn't tested (nothing has been run on a real iPhone by Claude).
- Commit with the trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Never push; the owner pushes to GitHub Pages.
- Tell the owner the version shown in the ⚙️ menu.

## Style
- Any text on a light background must be black.
- Keep replies short and plain.
