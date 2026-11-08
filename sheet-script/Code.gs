/**
 * Bog Life results collector (Google Apps Script).
 * Bound to a Google Sheet. Adds one row per player to "Players" and one row per game to "Games".
 * Deploy as a Web app: Execute as "Me", Who has access "Anyone".
 */
var KEY = 'e411c31ec6a88f69ec29a7b0';   // must match SHEET_KEY in index.html
var MAX_BYTES = 90000;

var PLAYER_HEAD = ['game_id', 'received', 'date', 'start_time', 'format', 'bracket', 'game_length', 'game_length_seconds', 'rounds', 'status',
  'winner', 'player', 'turn_order', 'went_first', 'place', 'commander', 'final_life', 'final_poison', 'max_commander_damage_taken',
  'result', 'detail', 'eliminated_round', 'eliminated_time', 'cant_lose', 'names_included', 'app_version'];
var FEEDBACK_HEAD = ['received', 'category', 'message', 'contact', 'app_version'];
var CATEGORIES = ['Bug Report', 'Feature Request', 'Other'];
var FB_PER_HOUR = 5, FB_ALL_PER_HOUR = 60;   // per phone, and for everyone together
var GAME_HEAD = ['game_id', 'received', 'format', 'bracket', 'seconds', 'rounds', 'players', 'app_version', 'timeline_json'];

function doGet() {
  return out_({ ok: true, info: 'Bog Life collector is running' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var raw = (e && e.postData && e.postData.contents) || '';
    if (raw.length > MAX_BYTES) return out_({ ok: false, error: 'size' });
    var body;
    try { body = JSON.parse(raw); } catch (err) { return out_({ ok: false, error: 'format' }); }
    if (!body || body.key !== KEY) return out_({ ok: false, error: 'key' });
    if (body.type === 'feedback') return feedback_(body);
    var g = body.game;
    if (!g || typeof g.id !== 'string' || !/^[A-Za-z0-9]{4,40}$/.test(g.id) || !Array.isArray(g.players) ||
        g.players.length < 2 || g.players.length > 6) return out_({ ok: false, error: 'shape' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var games = sheet_(ss, 'Games', GAME_HEAD), players = sheet_(ss, 'Players', PLAYER_HEAD);
    var last = games.getLastRow();
    if (last > 1) {
      var ids = games.getRange(2, 1, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) if (ids[i][0] === g.id) return out_({ ok: true, dup: true });
    }

    var now = new Date(), start = new Date(Number(g.startedAt) || now.getTime());
    var tz = ss.getSpreadsheetTimeZone();
    var date = Utilities.formatDate(start, tz, 'yyyy-MM-dd'), time = Utilities.formatDate(start, tz, 'HH:mm');
    var secs = num_(g.seconds), len = Math.floor(secs / 60) + ':' + ('0' + (secs % 60)).slice(-2);
    var winnerP = g.players.filter(function (p) { return p.result === 'Winner'; })[0];
    var winner = winnerP ? winnerP.name : (g.finished ? 'Draw' : '');
    var anyFirst = g.players.some(function (p) { return p.first === true; });

    var rows = g.players.map(function (p) {
      return [g.id, now, date, time, str_(g.format), str_(g.bracket), len, secs, num_(g.rounds), g.finished ? 'Finished' : 'Unfinished',
        winner, str_(p.name), num_(p.turn), anyFirst ? (p.first ? 'Yes' : 'No') : '', p.place === '' ? '' : num_(p.place),
        str_(p.cmds), num_(p.life), num_(p.poison), num_(p.cmdrMax), str_(p.result), str_(p.detail), str_(p.outRound), str_(p.outTime),
        str_(p.safe), body.names ? 'Yes' : 'No', str_(body.app)];
    });
    players.getRange(players.getLastRow() + 1, 1, rows.length, PLAYER_HEAD.length).setValues(rows);
    games.appendRow([g.id, now, str_(g.format), str_(g.bracket), secs, num_(g.rounds), g.players.length, str_(body.app),
      JSON.stringify(g.timeline || null).slice(0, 49000)]);
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: 'server' });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function feedback_(body) {
  var msg = String(body.message == null ? '' : body.message).trim().slice(0, 2000);
  if (!msg) return out_({ ok: false, error: 'shape' });
  var cat = CATEGORIES.indexOf(body.category) >= 0 ? body.category : 'Other';
  // rate limit: remembered for an hour in the script cache
  var cache = CacheService.getScriptCache(), cid = 'fb_' + String(body.cid || 'x').replace(/[^A-Za-z0-9]/g, '').slice(0, 30);
  var mine = Number(cache.get(cid) || 0), all = Number(cache.get('fb_all') || 0);
  if (mine >= FB_PER_HOUR || all >= FB_ALL_PER_HOUR) return out_({ ok: false, error: 'rate' });
  cache.put(cid, String(mine + 1), 3600);
  cache.put('fb_all', String(all + 1), 3600);
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = sheet_(ss, 'Feedback', FEEDBACK_HEAD);
  sh.appendRow([new Date(), cat, str2_(msg, 2000), str_(body.contact), str_(body.app)]);
  return out_({ ok: true });
}
function str2_(v, n) {
  v = String(v == null ? '' : v).slice(0, n);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function sheet_(ss, name, head) {
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); sh.setFrozenRows(1); }
  return sh;
}
// text: capped, and a leading = + - @ is defused so nothing is ever treated as a formula
function str_(v) {
  v = String(v == null ? '' : v).slice(0, 200);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
function num_(v) { v = Number(v); return isFinite(v) ? v : 0; }
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
