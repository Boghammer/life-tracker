BOG LIFE - GOOGLE SHEET COLLECTOR (Apps Script)
================================================

What this is
------------
Code.gs is the script behind the "Share results" and "Send feedback" buttons
in the app. It runs inside your Google Sheet and adds rows to three tabs,
which it creates by itself the first time something arrives:

  Players   one row per player per finished game
  Games     one row per game, plus the life-total timeline
  Feedback  messages sent from "Send feedback"

The app sends to the web app address (SHEET_URL in ../index.html). The
script checks a shared key (KEY here, SHEET_KEY in index.html). The two
must match or everything is refused.


FIRST-TIME SETUP
----------------
1. Go to sheets.google.com and create a blank spreadsheet.
2. In it, choose Extensions > Apps Script.
3. Delete the sample code, paste in ALL of Code.gs, and click Save (disk icon).
4. Click Deploy > New deployment.
5. Click the gear icon next to "Select type" and choose Web app.
6. Set:  Execute as: Me
         Who has access: Anyone
7. Click Deploy.
8. Click Authorize access, pick your account, then
   Advanced > Go to (project name) (unsafe) > Allow.
   (Google shows "unsafe" for every personal script. It is your own code.)
9. Copy the Web app URL (it ends in /exec).
10. Put that URL in index.html as SHEET_URL, bump APP_VERSION, commit, and
    push to GitHub Pages.


CHANGING THE SCRIPT LATER  (the part that is easy to forget)
------------------------------------------------------------
Saving the code is NOT enough. The live web app keeps running the old
version until you publish a new one:

1. Paste the new Code.gs into the Apps Script editor and click Save.
2. Click Deploy > Manage deployments.
3. Click the pencil (edit) icon on the existing deployment.
4. Under Version choose "New version", then click Deploy.

The URL stays the same, so the app does not need to change.
Do NOT use "New deployment" for an update: that makes a different URL.


CHECKING THAT IT WORKS
----------------------
- Open the web app URL in a browser. You should see:
    {"ok":true,"info":"Bog Life collector is running"}
- Finish a game over 3 minutes in the app with "Send my results
  automatically" turned on (Settings > Share results). New rows should
  appear in the Players and Games tabs.
- Settings > Send feedback should add a row to the Feedback tab.


ROTATING THE KEY (if someone abuses the endpoint)
-------------------------------------------------
1. Make up a new random string.
2. Put it in KEY in Code.gs and in SHEET_KEY in index.html.
3. Redeploy the script (New version, as above), then push the app.
Old copies of the app will then be told to update.


TROUBLESHOOTING
---------------
- "Could not send" in the app: the script is not deployed, the URL in
  index.html is wrong, or "Who has access" is not set to Anyone.
- App says it is too old to send: KEY and SHEET_KEY do not match.
- New feature (for example feedback) does nothing: the script was saved
  but not redeployed as a new version.
- Test rows: any game id starting with TEST was a test. Delete those rows.
- Rows are only added. The script never edits or deletes anything.
  Sending the same game twice is ignored (duplicate game ids).
