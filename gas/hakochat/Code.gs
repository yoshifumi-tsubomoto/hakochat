// ハコチャット 配布用（2026/11/24 20:42:36 作成）。Copyright 坪本 吉史 / Apache License 2.0。直接編集せず、新しい版は貼り替えてください。


const TZ = 'Asia/Tokyo';

const BUILD_TARGET = 'prod';

const PROD_DEFAULTS = { club: '', admin: '', ownerName: '' };

const APP_VERSION = '1.0.0';

const DEFAULT_APP_NAME = 'ハコチャット';

const VERSION_URL = 'https://yoshifumi-tsubomoto.github.io/hakochat/version.json';

const THEME_COLORS = [
  { id: 'navy', name: '紺', side: '#0f2550', side2: '#2b5cb8', accent: '#2563c9', glow: '#5b9dff', active: '#2f5a8f' },
  { id: 'blue', name: '青', side: '#0b3d91', side2: '#1e88e5', accent: '#1a73e8', glow: '#4fc3f7', active: '#2f6cc4' },
  { id: 'teal', name: '青緑', side: '#064e4a', side2: '#0ea5a0', accent: '#0e8c7e', glow: '#2dd4bf', active: '#1d7f88' },
  { id: 'green', name: '緑', side: '#0f4d2c', side2: '#22a35a', accent: '#16a34a', glow: '#4ade80', active: '#367a53' },
  { id: 'olive', name: '若草', side: '#3a5a12', side2: '#7cb518', accent: '#5f8f12', glow: '#a3e635', active: '#66792b' },
  { id: 'brown', name: '琥珀', side: '#6b3a0a', side2: '#d4880f', accent: '#b45309', glow: '#fbbf24', active: '#7d5636' },
  { id: 'orange', name: '橙', side: '#7a2a0c', side2: '#f0652a', accent: '#ea580c', glow: '#fb923c', active: '#ad5a24' },
  { id: 'red', name: '紅', side: '#6d1235', side2: '#e0457b', accent: '#db2777', glow: '#f472b6', active: '#a03246' },
  { id: 'pink', name: 'ピンク', side: '#9d174d', side2: '#f06ab0', accent: '#d6336c', glow: '#f9a8d4', active: '#c2185b' },
  { id: 'purple', name: '紫', side: '#3b1c7a', side2: '#7c4dff', accent: '#7c3aed', glow: '#c084fc', active: '#664a9c' },
  { id: 'gray', name: '夜空', side: '#0f172a', side2: '#4338ca', accent: '#4f46e5', glow: '#818cf8', active: '#565e69' },

  { id: 'plain-navy', name: '紺（落ち着いた）', plain: true, side: '#1f3a5f', active: '#2f5a8f', accent: '#1a73e8' },
  { id: 'plain-blue', name: '青（落ち着いた）', plain: true, side: '#1c4f9c', active: '#2f6cc4', accent: '#1a73e8' },
  { id: 'plain-amber', name: 'アンバー（落ち着いた）', plain: true, side: '#7c4a03', active: '#9a5d07', accent: '#b45309' },
  { id: 'plain-red', name: '赤（落ち着いた）', plain: true, side: '#7a1f2b', active: '#9a2a38', accent: '#b91c1c' }
];

const ROLE = { TEACHER: '管理者', STUDENT: '生徒', COACH: '指導者', PARENT: '保護者' };

const SCHEMA = {
  members: { name: 'メンバー', cols: [
    ['id', 'ID'], ['email', 'メールアドレス'], ['name', '表示名'], ['role', '区分'], ['grade', '学年'],
    ['isAdmin', 'アプリの管理者'], ['children', '子ども（生徒ID）'], ['status', '状態'], ['notify', 'メール通知'], ['createdAt', '登録日時'],
    ['notifiedAt', '最後に通知した日時'], ['notifyEmail', '通知の送り先（空ならログインのアドレス）']
  ] },
  channels: { name: 'チャンネル', cols: [
    ['id', 'ID'], ['folderId', 'フォルダID'], ['no', '番号'], ['name', '名前'], ['type', '種類'],
    ['place', '置き場所'], ['status', '状態'], ['createdAt', '作成日時'], ['purpose', '用途']
  ] },
  channelMembers: { name: 'チャンネルメンバー', cols: [['channelId', 'チャンネルID'], ['memberId', 'メンバーID']] },
  threads: { name: 'スレッド', cols: [
    ['id', 'ID'], ['channelId', 'チャンネルID'], ['authorId', '作成者ID'], ['createdAt', '作成日時'], ['updatedAt', '最終更新日時'], ['pinned', '全員へのピン止め']
  ] },
  posts: { name: '投稿', cols: [
    ['id', 'ID'], ['threadId', 'スレッドID'], ['authorId', '投稿者ID'], ['createdAt', '日時'], ['body', '本文'], ['files', '添付（ファイルID）'],
    ['editedAt', '編集日時'], ['deleted', '削除'], ['absStudentId', '欠席：生徒ID'], ['absDate', '欠席：日付'], ['absKind', '欠席：種類'],
    ['absNote', '欠席：先生・指導者へのメモ']
  ] },
  reads: { name: '既読', cols: [['memberId', 'メンバーID'], ['threadId', 'スレッドID'], ['readAt', '最後に読んだ日時']] },
  reactions: { name: '反応', cols: [['postId', '投稿ID'], ['memberId', 'メンバーID'], ['kind', '種類'], ['createdAt', '日時']] },
  myPins: { name: '自分のピン', cols: [['memberId', 'メンバーID'], ['threadId', 'スレッドID'], ['createdAt', '日時']] },
  drivePerms: { name: 'ドライブ権限', cols: [
    ['folderId', 'フォルダID'], ['email', 'メールアドレス'], ['role', '権限'], ['permId', '権限ID'], ['memberId', 'メンバーID'], ['addedAt', '追加日時']
  ] }
};

function props_() {
  return PropertiesService.getScriptProperties();
}

function prop_(key) {
  return props_().getProperty(key) || '';
}

function appName_() {
  return prop_('APP_NAME') || DEFAULT_APP_NAME;
}

function themeOf_(id) {
  return THEME_COLORS.filter(function (c) { return c.id === id; })[0] || THEME_COLORS[0];
}

const MAX_APP_LINKS = 3;

function appLinks_() {
  try {
    const list = JSON.parse(prop_('APP_LINKS') || '[]');
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function appSettings_() {
  return { name: appName_(), org: prop_('ORG_NAME'), color: themeOf_(prop_('THEME_COLOR')).id, links: appLinks_(), url: appUrl_(), version: APP_VERSION, versionUrl: VERSION_URL, colors: THEME_COLORS };
}

function saveAppSettings_(s) {
  const name = String((s && s.name) || '').trim();
  const org = String((s && s.org) || '').trim();
  if (name.length > 30) throw new Error('アプリ名は30文字までにしてください');
  if (org.length > 40) throw new Error('団体名は40文字までにしてください');
  const links = [];
  ((s && s.links) || []).forEach(function (l) {
    const label = String((l && l.name) || '').trim();
    const url = String((l && l.url) || '').trim();
    if (!label && !url) return;
    if (!label) throw new Error('リンクの名前を入れてください');
    if (label.length > 20) throw new Error('リンクの名前は20文字までにしてください');
    if (!/^https:\/\/[^\s"'<>]+$/.test(url)) throw new Error('リンクのURLは「https://」で始まる形で入れてください（' + label + '）');
    links.push({ name: label, url: url });
  });
  if (links.length > MAX_APP_LINKS) throw new Error('リンクは' + MAX_APP_LINKS + 'つまでです');
  const p = props_();
  p.setProperty('APP_NAME', name);
  p.setProperty('ORG_NAME', org);
  p.setProperty('THEME_COLOR', themeOf_(s && s.color).id);
  if (s && s.links) p.setProperty('APP_LINKS', JSON.stringify(links));
}

function isDev_() {
  return prop_('ENV') === 'dev';
}

let ss__ = null;

function ss_() {
  if (!ss__) ss__ = SpreadsheetApp.openById(prop_('DATA_SHEET_ID'));
  return ss__;
}

function sheet_(key) {
  return ss_().getSheetByName(SCHEMA[key].name);
}

/*
 * 速くするための工夫（読み込みを減らす）
 *  - memo__：1回の処理の中で、同じ表を何度も読まないように覚えておく
 *  - めったに変わらない表（メンバー・チャンネル・チャンネルメンバー）は、処理をまたいで CacheService に覚えておく
 *  - 書き込んだら、その表の覚えを消し、「データの版」を新しくする（新着の確認で「変わったか」を調べるため）
 *  - 書き込みの最中（withLock_ の中）は、覚えを使わず、必ずシートから読む（ほかの人の書き込みと食い違わないように）
 */
const memo__ = {};
let inLock__ = false;
const CACHED_TABLES = { members: true, channels: true, channelMembers: true };
const TABLE_CACHE_SEC = 600;

function copyRows_(rows) {
  return rows.map(function (o) { return Object.assign({}, o); });
}

function readAll_(key) {
  if (!inLock__ && memo__[key]) return copyRows_(memo__[key]);
  const cache = CACHED_TABLES[key] && !inLock__ ? CacheService.getScriptCache() : null;
  if (cache) {
    const hit = cache.get('tbl:' + key);
    if (hit) { memo__[key] = JSON.parse(hit); return copyRows_(memo__[key]); }
  }
  const rows = readSheet_(key);
  memo__[key] = rows;
  if (cache) {
    const json = JSON.stringify(rows);
    if (json.length < 90000) cache.put('tbl:' + key, json, TABLE_CACHE_SEC); // CacheService は1つ100KBまで
  }
  return copyRows_(rows);
}

function readSheet_(key) {
  const sh = sheet_(key);
  const cols = SCHEMA[key].cols;
  const n = sh.getLastRow() - 1;
  if (n <= 0) return [];
  return sh.getRange(2, 1, n, cols.length).getValues().map(function (r, i) {
    const o = { _row: i + 2 };
    cols.forEach(function (c, j) { o[c[0]] = cellToString_(r[j]); });
    return o;
  });
}

function invalidate_(key) {
  delete memo__[key];
  if (CACHED_TABLES[key]) CacheService.getScriptCache().remove('tbl:' + key);
  CacheService.getScriptCache().put('dataVer', now_(), 21600);
}

function dataVersion_() {
  const cache = CacheService.getScriptCache();
  let v = cache.get('dataVer');
  if (!v) { v = now_(); cache.put('dataVer', v, 21600); }
  return v;
}

function cellToString_(v) {
  if (v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, TZ, 'yyyy-MM-dd HH:mm:ss.SSS');
  return String(v);
}

function toRow_(key, obj) {
  return SCHEMA[key].cols.map(function (c) {
    const v = obj[c[0]];
    return v === null || v === undefined ? '' : String(v);
  });
}

function writeRows_(sh, row, rows) {
  sh.getRange(row, 1, rows.length, rows[0].length).setNumberFormat('@').setValues(rows);
}

function append_(key, obj) {
  const sh = sheet_(key);
  writeRows_(sh, sh.getLastRow() + 1, [toRow_(key, obj)]);
  invalidate_(key);
}

function appendMany_(key, objs) {
  if (!objs.length) return;
  const sh = sheet_(key);
  writeRows_(sh, sh.getLastRow() + 1, objs.map(function (o) { return toRow_(key, o); }));
  invalidate_(key);
}

function updateRow_(key, obj) {
  writeRows_(sheet_(key), obj._row, [toRow_(key, obj)]);
  invalidate_(key);
}

function deleteRow_(key, row) {
  sheet_(key).deleteRow(row);
  invalidate_(key);
}

function deleteRowsWhere_(key, pred) {
  const rows = readSheet_(key);
  const keep = rows.filter(function (o) { return !pred(o); });
  if (keep.length === rows.length) return 0;
  const sh = sheet_(key);
  sh.getRange(2, 1, rows.length, SCHEMA[key].cols.length).clearContent();
  if (keep.length) writeRows_(sh, 2, keep.map(function (o) { return toRow_(key, o); }));
  invalidate_(key);
  return rows.length - keep.length;
}

function newId_(prefix) {
  return prefix + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function now_() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss.SSS');
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  Object.keys(memo__).forEach(function (k) { delete memo__[k]; });
  inLock__ = true;
  try {
    return fn();
  } finally {
    inLock__ = false;
    Object.keys(memo__).forEach(function (k) { delete memo__[k]; });
    lock.releaseLock();
  }
}

function doGet(e) {
  const tpl = HtmlService.createTemplateFromFile('index');
  tpl.urlToken = (e && e.parameter && e.parameter.t) || '';
  return tpl.evaluate()
    .setTitle(appName_())
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function authorizeAll() {
  DriveApp.getRootFolder();
  if (prop_('DATA_SHEET_ID')) SpreadsheetApp.openById(prop_('DATA_SHEET_ID'));
  MailApp.getRemainingDailyQuota();
  ScriptApp.getProjectTriggers();
  Drive.About.get({ fields: 'user' });
  Logger.log('必要な権限は許可されています。今日あと送れるメールの数：' + MailApp.getRemainingDailyQuota());
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function api_init(token, asId) {
  const created = ensureSetup_();
  if (created === 'needSetup') {

    return { env: 'prod', needSetup: true, defaults: PROD_DEFAULTS, app: appSettings_(), owner: ownerEmail_(), who: { email: ownerEmail_(), method: 'auto', isOwner: true, member: null } };
  }
  ensureSheets_();
  migrateRoleNames_();
  migrateDev_();
  const who = identify_(token, asId);
  const res = { env: prop_('ENV'), setupJustNow: created, who: who, loginUrl: prop_('LOGIN_URL'), app: appSettings_() };
  if (who.isOwner && isDev_()) res.devMembers = readAll_('members').map(publicMember_);
  if (who.member && who.member.isAdmin) {
    res.dataUrl = ss_().getUrl();

    if (!prop_('APP_URL')) props_().setProperty('APP_URL', ScriptApp.getService().getUrl());

    res.students = readAll_('members').filter(function (m) { return m.role === ROLE.STUDENT && m.status !== '停止'; })
      .map(function (m) { return { id: m.id, name: m.name, grade: m.grade }; })
      .sort(function (a, b) { return String(b.grade).localeCompare(String(a.grade)) || a.name.localeCompare(b.name, 'ja'); });
  }
  if (who.member) {
    if (seedDevContentIfEmpty_()) res.seededJustNow = true;
    else syncChannelsIfStale_();
    res.ver = dataVersion_(); // 先に版を取ってから読む（読んでいる間に書き込まれても、次の確認で取り直せるように）
    res.home = buildHome_(who.member);
  }
  return res;
}

function api_home(token, asId, knownVer) {
  const who = identify_(token, asId);
  if (!who.member) throw new Error('本人確認ができていません');
  syncChannelsIfStale_();
  const ver = dataVersion_();
  if (knownVer && knownVer === ver) return { unchanged: true, ver: ver };
  const home = buildHome_(who.member);
  home.ver = ver;
  return home;
}

const REACTION_KINDS = ['see', 'like', 'no'];

function emptyReactions_() {
  const rx = {};
  REACTION_KINDS.forEach(function (k) { rx[k] = { n: 0, mine: false, names: [] }; });
  return rx;
}

function buildHome_(me) {
  const members = readAll_('members');
  const byId = {};
  members.forEach(function (m) { byId[m.id] = m; });
  const cmSet = channelMemberSet_();
  const channels = sortChannels_(readAll_('channels')).filter(function (c) { return canView_(c, me, cmSet); });
  const chIds = {};
  channels.forEach(function (c) { chIds[c.id] = c; });

  const threads = readAll_('threads').filter(function (t) { return chIds[t.channelId]; });
  const tIds = {};
  threads.forEach(function (t) { tIds[t.id] = t; });

  const reads = {};
  readAll_('reads').forEach(function (r) {
    if (!tIds[r.threadId]) return;
    (reads[r.threadId] = reads[r.threadId] || {})[r.memberId] = r.readAt;
  });
  const myPins = {};
  readAll_('myPins').forEach(function (r) { if (r.memberId === me.id) myPins[r.threadId] = true; });

  const posts = {};
  readAll_('posts').forEach(function (p) {
    if (!tIds[p.threadId]) return;
    (posts[p.threadId] = posts[p.threadId] || []).push(p);
  });
  const reactions = {};
  readAll_('reactions').forEach(function (r) {
    const byKind = reactions[r.postId] = reactions[r.postId] || {};
    (byKind[r.kind] = byKind[r.kind] || []).push(r.memberId);
  });

  const isParent = me.role === ROLE.PARENT;
  const unread = {};
  const out = threads.map(function (t) {
    const ps = (posts[t.id] || []).sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; });
    const tr = reads[t.id] || {};

    const myRead = tr[me.id] || me.joinedAt || '';
    ps.forEach(function (p) {
      if (p.deleted !== '○' && p.authorId !== me.id && p.createdAt > myRead) unread[t.channelId] = (unread[t.channelId] || 0) + 1;
    });
    return {
      id: t.id, channelId: t.channelId, pinned: t.pinned === '○', myPin: !!myPins[t.id],
      updatedAt: t.updatedAt, myRead: myRead,
      posts: ps.map(function (p) {
        const a = byId[p.authorId];
        const author = a ? { id: a.id, name: a.name, role: a.role } : { id: '', name: '（退会したメンバー）', role: '' };
        if (p.deleted === '○') {

          return { id: p.id, createdAt: p.createdAt, deleted: true, mine: p.authorId === me.id, author: author, body: '', files: [],
            reactions: emptyReactions_(), readers: { n: 0, names: isParent ? null : [] }, abs: null };
        }

        const readerSet = {};
        Object.keys(tr).forEach(function (mid) { if (tr[mid] >= p.createdAt) readerSet[mid] = true; });
        REACTION_KINDS.forEach(function (k) { ((reactions[p.id] || {})[k] || []).forEach(function (mid) { readerSet[mid] = true; }); });
        const readers = Object.keys(readerSet).filter(function (mid) {
          return mid !== p.authorId && byId[mid] && canView_(chIds[t.channelId], byId[mid], cmSet);
        });
        const rx = {};
        REACTION_KINDS.forEach(function (k) {
          const ids = (reactions[p.id] || {})[k] || [];
          rx[k] = { n: ids.length, mine: ids.indexOf(me.id) >= 0, names: ids.map(function (id) { return byId[id] ? byId[id].name : '（退会）'; }) };
        });
        return {
          id: p.id, createdAt: p.createdAt, editedAt: p.editedAt, body: p.body, mine: p.authorId === me.id,
          author: author,
          files: parseFiles_(p.files).map(function (f) { return { id: f.id, name: f.name, mime: f.mime, url: fileUrl_(f.id) }; }),
          reactions: rx,
          readers: { n: readers.length, names: isParent ? null : readers.map(function (id) { return byId[id].name; }), me: readers.indexOf(me.id) >= 0 },

          abs: p.absDate ? { studentId: p.absStudentId, date: p.absDate, kind: p.absKind,
            note: canSeeAbsNote_(me) || p.authorId === me.id ? (p.absNote || '') : undefined } : null
        };
      })
    };
  }).filter(function (t) { return t.posts.some(function (p) { return !p.deleted; }); });

  return {
    channels: channels.map(function (c) {
      return { id: c.id, no: c.no, name: c.name, type: c.type, place: c.place, purpose: c.purpose, unread: unread[c.id] || 0 };
    }),
    threads: out
  };
}

const CHANNEL_TYPES = ['all', 'members', 'public', 'parents', 'off'];
const SYNC_INTERVAL_SEC = 300;

function parseFolderName_(name) {
  const m = String(name).match(/^(\d+)\s*(.*)$/);
  return m ? { no: m[1], name: m[2] || m[1] } : { no: '', name: String(name) };
}

function syncChannelsIfStale_() {
  const cache = CacheService.getScriptCache();
  if (cache.get('channelSync')) return;
  syncChannels_();
  cache.put('channelSync', '1', SYNC_INTERVAL_SEC);
}

function syncChannels_() {
  const found = {};
  [['club', prop_('CLUB_ROOT_ID')], ['admin', prop_('ADMIN_ROOT_ID')]].forEach(function (pair) {
    if (!pair[1]) return;
    const it = DriveApp.getFolderById(pair[1]).getFolders();
    while (it.hasNext()) {
      const f = it.next();
      if (f.isTrashed()) continue;
      found[f.getId()] = { place: pair[0], fname: f.getName() };
    }
  });

  withLock_(function () {
    const rows = readAll_('channels');
    const known = {};
    rows.forEach(function (c) {
      known[c.folderId] = true;
      const f = found[c.folderId];
      if (!f) {
        if (c.status !== '見つからない') { c.status = '見つからない'; updateRow_('channels', c); }
        return;
      }
      const p = parseFolderName_(f.fname);
      if (c.name !== p.name || c.no !== p.no || c.place !== f.place || c.status !== '有効') {
        c.name = p.name; c.no = p.no; c.place = f.place; c.status = '有効';
        updateRow_('channels', c);
      }
    });
    const t = now_();
    const added = Object.keys(found).filter(function (id) { return !known[id]; }).map(function (id) {
      const p = parseFolderName_(found[id].fname);
      return { id: newId_('c_'), folderId: id, no: p.no, name: p.name, type: 'off', place: found[id].place, status: '有効', createdAt: t };
    });
    appendMany_('channels', added);
  });
}

function sortChannels_(list) {
  return list.slice().sort(function (a, b) {
    return (a.no ? 0 : 1) - (b.no ? 0 : 1) || (a.no + ' ' + a.name).localeCompare(b.no + ' ' + b.name, 'ja');
  });
}

function canView_(c, m, cmSet) {
  if (!m || c.type === 'off' || c.status !== '有効') return false;
  if (m.role === ROLE.TEACHER || m.role === ROLE.COACH) return true;
  if (m.role === ROLE.STUDENT) return c.type === 'all' || c.type === 'public' || (c.type === 'members' && cmSet[c.id + '|' + m.id] === true);
  if (m.role === ROLE.PARENT) return c.type === 'public' || c.type === 'parents';
  return false;
}

function channelMemberSet_() {
  const set = {};
  readAll_('channelMembers').forEach(function (r) { set[r.channelId + '|' + r.memberId] = true; });
  return set;
}

const ATTACH_FOLDER_NAME = 'チャット添付';
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_FILES_PER_POST = 10;
const UPLOADER_TAG = 'ハコチャット 添付：';

function attachFolder_(channel) {
  const folder = DriveApp.getFolderById(channel.folderId);
  const it = folder.getFoldersByName(ATTACH_FOLDER_NAME);
  while (it.hasNext()) {
    const f = it.next();
    if (!f.isTrashed()) return f;
  }
  return folder.createFolder(ATTACH_FOLDER_NAME);
}

function safeFileName_(name) {
  const s = String(name || 'ファイル').replace(/[\\/:*?"<>|\r\n\t]/g, '_').trim();
  return s.slice(0, 120) || 'ファイル';
}

function api_upload(token, asId, channelId, name, mimeType, base64) {
  const me = requireMember_(token, asId);
  const c = requireChannel_(me, channelId);
  const bytes = Utilities.base64Decode(String(base64 || ''));
  if (!bytes.length) throw new Error('ファイルが空です');
  if (bytes.length > MAX_FILE_BYTES) throw new Error('ファイルが大きすぎます（1つ20MBまで）');
  const fname = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd') + '_' + safeFileName_(name);
  const file = attachFolder_(c).createFile(Utilities.newBlob(bytes, mimeType || 'application/octet-stream', fname));
  file.setDescription(UPLOADER_TAG + me.id); // だれがアップロードしたかの印（投稿せずに外したとき、本人のものだけ消すため）
  return { id: file.getId(), name: fname, mime: file.getMimeType() };
}

function checkFiles_(channel, files) {
  const list = (files || []).slice(0, MAX_FILES_PER_POST);
  if (!list.length) return [];
  const folderId = attachFolder_(channel).getId();
  return list.map(function (f) {
    const file = DriveApp.getFileById(f.id);
    const parents = file.getParents();
    let ok = false;
    while (parents.hasNext()) if (parents.next().getId() === folderId) ok = true;
    if (!ok) throw new Error('添付できないファイルが含まれています');
    return { id: file.getId(), name: file.getName(), mime: file.getMimeType() };
  });
}

function parseFiles_(s) {
  if (!s) return [];
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a : [];
  } catch (e) {
    return [];
  }
}

function fileUrl_(id) {
  return 'https://drive.google.com/file/d/' + id + '/view';
}

function api_files(token, asId, channelId) {
  const me = requireMember_(token, asId);
  const c = requireChannel_(me, channelId);
  const folder = DriveApp.getFolderById(c.folderId);
  const list = function (f) {
    const out = [];
    const fs = f.getFolders();
    while (fs.hasNext()) {
      const x = fs.next();
      if (x.isTrashed() || x.getName() === ATTACH_FOLDER_NAME) continue;
      out.push({ name: x.getName(), kind: 'folder', url: x.getUrl(), updated: fmt_(x.getLastUpdated()) });
    }
    const files = f.getFiles();
    while (files.hasNext()) {
      const x = files.next();
      if (x.isTrashed()) continue;
      out.push({ name: x.getName(), kind: 'file', mime: x.getMimeType(), id: x.getId(), url: x.getUrl(), updated: fmt_(x.getLastUpdated()) });
    }
    return out.sort(function (a, b) {
      return (a.kind === 'folder' ? 0 : 1) - (b.kind === 'folder' ? 0 : 1) || a.name.localeCompare(b.name, 'ja');
    });
  };
  const at = folder.getFoldersByName(ATTACH_FOLDER_NAME);
  let attached = [];
  while (at.hasNext()) {
    const f = at.next();
    if (!f.isTrashed()) { attached = list(f).filter(function (x) { return x.kind === 'file'; }).reverse(); break; }
  }
  const res = {
    folderName: (c.no ? c.no + ' ' : '') + c.name,
    folderUrl: folder.getUrl(),
    place: c.place,
    items: list(folder),
    attached: attached,
    canEdit: me.role !== ROLE.PARENT
  };
  if (me.isAdmin) res.permPlan = permissionPlanFor_(c);
  return res;
}

function fmt_(d) {
  return d ? Utilities.formatDate(d, TZ, 'yyyy-MM-dd HH:mm') : '';
}

const MAX_BODY = 5000;

function requireMember_(token, asId) {
  const who = identify_(token, asId);
  if (!who.member) throw new Error('本人確認ができていません。ページを開き直してください。');
  return who.member;
}

function cleanBody_(body, allowEmpty) {
  const s = String(body == null ? '' : body).replace(/\r\n/g, '\n').trim();
  if (!s && !allowEmpty) throw new Error('本文が空です');
  if (s.length > MAX_BODY) throw new Error('本文が長すぎます（' + MAX_BODY + '文字まで）');
  return s;
}

function findRow_(key, pred) {
  return readAll_(key).filter(pred)[0] || null;
}

function requireChannel_(me, channelId) {
  const c = findRow_('channels', function (x) { return x.id === channelId; });
  if (!c || !canView_(c, me, channelMemberSet_())) throw new Error('このチャンネルには書き込めません');
  return c;
}

function requireThread_(me, threadId) {
  const t = findRow_('threads', function (x) { return x.id === threadId; });
  if (!t) throw new Error('スレッドが見つかりません');
  requireChannel_(me, t.channelId);
  return t;
}

function requirePost_(me, postId) {
  const p = findRow_('posts', function (x) { return x.id === postId; });
  if (!p || p.deleted === '○') throw new Error('投稿が見つかりません');
  const t = requireThread_(me, p.threadId);
  return { post: p, thread: t };
}

function setRead_(memberId, threadId, at) {
  const r = findRow_('reads', function (x) { return x.memberId === memberId && x.threadId === threadId; });
  if (r) {
    if (r.readAt < at) { r.readAt = at; updateRow_('reads', r); }
  } else {
    append_('reads', { memberId: memberId, threadId: threadId, readAt: at });
  }
}

function api_newThread(token, asId, channelId, body, files) {
  const me = requireMember_(token, asId);
  const text = cleanBody_(body, files && files.length);

  return withLock_(function () {
    const c = requireChannel_(me, channelId);
    const fl = checkFiles_(c, files);
    const t = now_(), tid = newId_('t_'), pid = newId_('p_');
    append_('threads', { id: tid, channelId: channelId, authorId: me.id, createdAt: t, updatedAt: t, pinned: '' });
    append_('posts', { id: pid, threadId: tid, authorId: me.id, createdAt: t, body: text, files: fl.length ? JSON.stringify(fl) : '' });
    setRead_(me.id, tid, t);
    return { threadId: tid, postId: pid, createdAt: t, files: fl.map(function (f) { return { id: f.id, name: f.name, mime: f.mime, url: fileUrl_(f.id) }; }) };
  });
}

function api_reply(token, asId, threadId, body, files) {
  const me = requireMember_(token, asId);
  const text = cleanBody_(body, files && files.length);
  return withLock_(function () {
    const th = requireThread_(me, threadId);
    const fl = checkFiles_(requireChannel_(me, th.channelId), files);
    const t = now_(), pid = newId_('p_');
    append_('posts', { id: pid, threadId: threadId, authorId: me.id, createdAt: t, body: text, files: fl.length ? JSON.stringify(fl) : '' });
    th.updatedAt = t;
    updateRow_('threads', th);
    setRead_(me.id, threadId, t);
    return { postId: pid, createdAt: t, files: fl.map(function (f) { return { id: f.id, name: f.name, mime: f.mime, url: fileUrl_(f.id) }; }) };
  });
}

function api_editPost(token, asId, postId, body) {
  const me = requireMember_(token, asId);
  const text = cleanBody_(body);
  return withLock_(function () {
    const p = requirePost_(me, postId).post;
    if (p.authorId !== me.id) throw new Error('自分の投稿だけ編集できます');
    p.body = text;
    p.editedAt = now_();
    updateRow_('posts', p);
    return { ok: true, editedAt: p.editedAt };
  });
}

function api_deletePost(token, asId, postId) {
  const me = requireMember_(token, asId);
  withLock_(function () {
    const p = requirePost_(me, postId).post;
    if (p.authorId !== me.id && !me.isAdmin) throw new Error('自分の投稿だけ削除できます');
    p.deleted = '○';
    p.editedAt = now_();
    updateRow_('posts', p);
  });
  return { ok: true };
}

function api_react(token, asId, postId, kind, on) {
  const me = requireMember_(token, asId);
  if (REACTION_KINDS.indexOf(kind) < 0) throw new Error('反応の種類が正しくありません');
  withLock_(function () {
    requirePost_(me, postId);
    const r = findRow_('reactions', function (x) { return x.postId === postId && x.memberId === me.id && x.kind === kind; });
    if (on && !r) append_('reactions', { postId: postId, memberId: me.id, kind: kind, createdAt: now_() });
    if (!on && r) deleteRow_('reactions', r._row);
  });
  return { ok: true };
}

function api_markRead(token, asId, threadIds) {
  const me = requireMember_(token, asId);
  const ids = (threadIds || []).slice(0, 50);
  return withLock_(function () {
    const t = now_();
    ids.forEach(function (id) {
      try { requireThread_(me, id); } catch (e) { return; }
      setRead_(me.id, id, t);
    });
    return { readAt: t };
  });
}

function api_setPin(token, asId, threadId, on) {
  const me = requireMember_(token, asId);
  if (!me.isAdmin) throw new Error('全員へのピン止めは、管理者だけができます');
  withLock_(function () {
    const th = requireThread_(me, threadId);
    th.pinned = on ? '○' : '';
    updateRow_('threads', th);
  });
  return { ok: true };
}

function api_setMyPin(token, asId, threadId, on) {
  const me = requireMember_(token, asId);
  withLock_(function () {
    requireThread_(me, threadId);
    const r = findRow_('myPins', function (x) { return x.memberId === me.id && x.threadId === threadId; });
    if (on && !r) append_('myPins', { memberId: me.id, threadId: threadId, createdAt: now_() });
    if (!on && r) deleteRow_('myPins', r._row);
  });
  return { ok: true };
}

const ROLE_LABEL = { fileOrganizer: 'コンテンツ管理者', writer: '投稿者・編集者', reader: '閲覧者' };

function internalDomain_() {
  if (prop_('INTERNAL_DOMAIN')) return prop_('INTERNAL_DOMAIN');
  return isDev_() ? 'internal.invalid' : ownerEmail_().split('@')[1];
}

function isInternal_(email) {
  return String(email).toLowerCase().split('@')[1] === internalDomain_();
}

function isDummyEmail_(email) {
  return /@example\.com$/i.test(String(email));
}

function desiredFor_(c, members, cmSet) {
  const out = {};
  if (c.type === 'off' || c.status !== '有効') return out;
  const owner = ownerEmail_();
  const sharedDrive = !isDev_();
  members.forEach(function (m) {
    if (m.status === '停止' || !m.email || m.email.toLowerCase() === owner) return;
    if (!canView_(c, m, cmSet)) return;
    const internal = isInternal_(m.email);
    if (c.place !== 'admin' && internal) return;
    let role;
    if (m.role === ROLE.PARENT) role = 'reader';
    else if (m.role === ROLE.STUDENT) role = 'writer';
    else role = 'fileOrganizer';
    if (!sharedDrive && role === 'fileOrganizer') role = 'writer';
    out[m.email.toLowerCase()] = { role: role, memberId: m.id, name: m.name };
  });
  return out;
}

function permissionPlanFor_(c) {
  const members = readAll_('members');
  const want = desiredFor_(c, members, channelMemberSet_());
  const have = {};
  readAll_('drivePerms').forEach(function (r) { if (r.folderId === c.folderId) have[r.email] = r; });
  const rows = Object.keys(want).map(function (email) {
    const w = want[email], h = have[email];
    let status;
    if (isDummyEmail_(email)) status = '開発用のダミーのため設定しない';
    else if (h && h.role === w.role) status = '設定済み';
    else status = h ? '権限を変える予定' : '追加する予定';
    return { name: w.name, role: ROLE_LABEL[w.role], status: status };
  });
  Object.keys(have).forEach(function (email) {
    if (!want[email]) {
      const m = members.filter(function (x) { return x.email.toLowerCase() === email; })[0];
      rows.push({ name: m ? m.name : email, role: ROLE_LABEL[have[email].role] || have[email].role, status: '外す予定' });
    }
  });
  return {
    note: (c.place === 'admin' ? '先生だけの場所のフォルダです。見られる人を全員追加します。' : '活動の共有ドライブのフォルダです。学校外の人だけを追加します（学校の人は共有ドライブのメンバーなので不要）。') +
      (isDev_() ? '（開発版では、試すために全員を学校外の人として扱います）' : ''),
    rows: rows
  };
}

function applyPermissions_() {
  const members = readAll_('members');
  const cmSet = channelMemberSet_();
  const channels = readAll_('channels');
  const log = [];
  withLock_(function () {
    const recs = readAll_('drivePerms');
    const removeRows = [];
    channels.forEach(function (c) {
      const want = desiredFor_(c, members, cmSet);
      const have = recs.filter(function (r) { return r.folderId === c.folderId; });

      have.forEach(function (r) {
        const w = want[r.email];
        if (w && w.role === r.role) return;
        try {
          Drive.Permissions.remove(c.folderId, r.permId, { supportsAllDrives: true });
          log.push('外した：' + c.name + '／' + r.email);
        } catch (e) {
          log.push('外せなかった：' + c.name + '／' + r.email + '（' + e.message + '）');
        }
        removeRows.push(r._row);
        r._removed = true;
      });

      Object.keys(want).forEach(function (email) {
        if (isDummyEmail_(email)) return;
        if (have.some(function (r) { return r.email === email && !r._removed; })) return;
        try {
          const p = Drive.Permissions.create({ role: want[email].role, type: 'user', emailAddress: email }, c.folderId,
            { supportsAllDrives: true, sendNotificationEmail: false });
          append_('drivePerms', { folderId: c.folderId, email: email, role: want[email].role, permId: p.id, memberId: want[email].memberId, addedAt: now_() });
          log.push('追加した：' + c.name + '／' + email + '（' + ROLE_LABEL[want[email].role] + '）');
        } catch (e) {
          log.push('追加できなかった：' + c.name + '／' + email + '（' + e.message + '）');
        }
      });
    });

    removeRows.sort(function (a, b) { return b - a; }).forEach(function (row) { deleteRow_('drivePerms', row); });
  });
  return log;
}

function api_applyPermissions(token, asId) {
  const me = requireMember_(token, asId);
  if (!me.isAdmin) throw new Error('管理者だけが実行できます');
  return applyPermissions_();
}

const DUMMY_CLUB_FOLDERS = [
  '02 塩酸のさび班', '10 ロボットプログラミング', '11 科学の祭典', '23 空気砲', '30 個人研究2026',
  '79 活動予定', '80 活動予定・欠席連絡', '91 削除予定', '98 未整理写真', '99 交流・その他', 'アクセス制限'
];

function ensureSetup_() {
  if (prop_('DATA_SHEET_ID')) return false;
  if (!isOwner_()) throw new Error('まだ準備ができていません。管理者の先生が最初にアプリを開いて、準備をしてください。');
  if (BUILD_TARGET === 'prod') return 'needSetup';
  setupDev_();
  return true;
}

function folderIdFrom_(s) {
  const t = String(s || '').trim();
  const m = t.match(/folders\/([\w-]+)/);
  return m ? m[1] : t;
}

function api_setupProd(token, asId, club, admin, ownerName, settings) {
  if (BUILD_TARGET !== 'prod') throw new Error('これは本番用の準備です');
  if (prop_('DATA_SHEET_ID')) throw new Error('準備はもう済んでいます');
  if (!isOwner_()) throw new Error('アプリの所有者だけが準備できます');
  const clubId = folderIdFrom_(club), adminId = folderIdFrom_(admin);
  if (!clubId || !adminId) throw new Error('2つの共有ドライブを入れてください');
  if (clubId === adminId) throw new Error('活動の共有ドライブと、先生だけの共有ドライブは、別のものにしてください');
  let clubF, adminF;
  try { clubF = DriveApp.getFolderById(clubId); clubF.getName(); } catch (e) { throw new Error('活動の共有ドライブを開けません（IDかURLを確かめてください）'); }
  try { adminF = DriveApp.getFolderById(adminId); adminF.getName(); } catch (e) { throw new Error('先生だけの共有ドライブを開けません（IDかURLを確かめてください）'); }

  const ss = SpreadsheetApp.create('TSC_データ');
  DriveApp.getFileById(ss.getId()).moveTo(adminF);
  createSheets_(ss);
  const p = props_();
  p.setProperties({
    ENV: 'prod', DATA_SHEET_ID: ss.getId(), CLUB_ROOT_ID: clubId, ADMIN_ROOT_ID: adminId,
    INTERNAL_DOMAIN: ownerEmail_().split('@')[1]
  });
  if (!p.getProperty('SHARED_SECRET')) p.setProperty('SHARED_SECRET', randomSecret_());
  if (settings) saveAppSettings_(settings);
  ss__ = ss;
  append_('members', {
    id: 'm_owner', email: ownerEmail_(), name: String(ownerName || '').trim() || '管理者の先生', role: ROLE.TEACHER,
    isAdmin: '○', status: '有効', createdAt: now_()
  });
  syncChannels_();
  return { ok: true, channels: readAll_('channels').length, dataUrl: ss.getUrl() };
}

function setupDev_() {
  const root = DriveApp.createFolder('TSC開発（ダミーデータ）');
  const club = root.createFolder('部の共有ドライブ（ダミー）');
  const admin = root.createFolder('先生だけ（ダミー）');
  DUMMY_CLUB_FOLDERS.forEach(function (n) { club.createFolder(n); });

  const ss = SpreadsheetApp.create('TSC_データ（開発）');
  DriveApp.getFileById(ss.getId()).moveTo(admin);
  createSheets_(ss);

  const p = props_();
  p.setProperties({ ENV: 'dev', DATA_SHEET_ID: ss.getId(), CLUB_ROOT_ID: club.getId(), ADMIN_ROOT_ID: admin.getId() });
  if (!p.getProperty('SHARED_SECRET')) p.setProperty('SHARED_SECRET', randomSecret_());
  ss__ = ss;
  seedDevMembers_();
}

function createSheets_(ss) {
  const first = ss.getSheets()[0];
  Object.keys(SCHEMA).forEach(function (key, i) {
    formatSheet_(i === 0 ? first.setName(SCHEMA[key].name) : ss.insertSheet(SCHEMA[key].name), SCHEMA[key]);
  });
}

function formatSheet_(sh, def) {
  const n = def.cols.length;
  if (sh.getMaxColumns() > n) sh.deleteColumns(n + 1, sh.getMaxColumns() - n);
  sh.getRange(1, 1, sh.getMaxRows(), n).setNumberFormat('@');
  sh.getRange(1, 1, 1, n).setValues([def.cols.map(function (c) { return c[1]; })])
    .setFontWeight('bold').setBackground('#eef3fb');
  sh.setFrozenRows(1);
}

function ensureSheets_() {
  const ss = ss_();
  Object.keys(SCHEMA).forEach(function (key) {
    const def = SCHEMA[key];
    const sh = ss.getSheetByName(def.name);
    if (!sh) { formatSheet_(ss.insertSheet(def.name), def); return; }
    const n = def.cols.length;
    const have = sh.getMaxColumns();
    if (have < n) {
      sh.insertColumnsAfter(have, n - have);
      sh.getRange(1, have + 1, sh.getMaxRows(), n - have).setNumberFormat('@');
      sh.getRange(1, have + 1, 1, n - have).setValues([def.cols.slice(have).map(function (c) { return c[1]; })])
        .setFontWeight('bold').setBackground('#eef3fb');
    }
  });
}

function seedDevMembers_() {
  const t = now_();
  const m = function (id, email, name, role, grade, isAdmin, children) {
    return { id: id, email: email, name: name, role: role, grade: grade || '', isAdmin: isAdmin ? '○' : '',
      children: children || '', status: '有効', notify: role === ROLE.PARENT ? '○' : '', createdAt: t };
  };
  appendMany_('members', [
    m('m_owner', Session.getEffectiveUser().getEmail(), '管理者の先生', ROLE.TEACHER, '', true),
    m('m_s1', 'student1@example.com', '山田 太郎', ROLE.STUDENT, '2'),
    m('m_s2', 'student2@example.com', '佐藤 花子', ROLE.STUDENT, '2'),
    m('m_s3', 'student3@example.com', '鈴木 一郎', ROLE.STUDENT, '1'),
    m('m_c1', 'coach1@example.com', '高橋コーチ', ROLE.COACH, ''),
    m('m_p1', 'parent1@example.com', '山田 太郎 母', ROLE.PARENT, '', false, 'm_s1'),
    m('m_p2', 'parent2@example.com', '佐藤 花子 父', ROLE.PARENT, '', false, 'm_s2')
  ]);
}

function migrateRoleNames_() {
  if (prop_('ROLE_NAMES_V2')) return;
  withLock_(function () {
    readAll_('members').forEach(function (m) {
      if (m.role === '部' + '員') { m.role = ROLE.STUDENT; updateRow_('members', m); }
    });
  });
  props_().setProperty('ROLE_NAMES_V2', '1');
}

function randomSecret_() {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Utilities.getUuid() + Date.now());
  return Utilities.base64EncodeWebSafe(bytes);
}

const ABS_KINDS = ['欠席', '遅刻', '早退'];
const MAX_ABS_NOTE = 500;

function canSeeAbsNote_(m) {
  return !!m && (m.role === ROLE.TEACHER || m.role === ROLE.COACH || m.isAdmin === true);
}

function requireAdmin_(token, asId) {
  const me = requireMember_(token, asId);
  if (!me.isAdmin) throw new Error('管理者だけが使えます');
  return me;
}

function api_admin(token, asId) {
  requireAdmin_(token, asId);
  syncChannelsIfStale_();
  const members = readAll_('members');
  const cm = {};
  readAll_('channelMembers').forEach(function (r) { (cm[r.channelId] = cm[r.channelId] || []).push(r.memberId); });
  return {
    owner: ownerEmail_(),
    members: members.map(function (m) {
      return {
        id: m.id, email: m.email, name: m.name, role: m.role, grade: m.grade, isAdmin: isAdmin_(m), adminFlag: m.isAdmin === '○',
        children: m.children ? m.children.split(',').filter(String) : [], status: m.status || '有効', notify: m.notify === '○',
        notifyEmail: m.notifyEmail || ''
      };
    }),
    channels: sortChannels_(readAll_('channels')).map(function (c) {
      return { id: c.id, no: c.no, name: c.name, type: c.type, place: c.place, status: c.status, purpose: c.purpose, members: cm[c.id] || [] };
    }),
    absences: absenceList_(members)
  };
}

function absenceList_(members) {
  const byId = {};
  members.forEach(function (m) { byId[m.id] = m; });
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const from = Utilities.formatDate(new Date(Date.now() - 14 * 86400000), TZ, 'yyyy-MM-dd');
  return readAll_('posts').filter(function (p) { return p.absDate && p.deleted !== '○' && p.absDate >= from; })
    .map(function (p) {
      return {
        date: p.absDate, kind: p.absKind, isPast: p.absDate < today,
        student: byId[p.absStudentId] ? byId[p.absStudentId].name : '（退会したメンバー）',
        from: byId[p.authorId] ? byId[p.authorId].name : '（退会したメンバー）',
        fromRole: byId[p.authorId] ? byId[p.authorId].role : '', createdAt: p.createdAt, note: p.absNote || ''
      };
    })
    .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.createdAt < b.createdAt ? -1 : 1); });
}

function validEmail_(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s));
}

function api_saveMember(token, asId, m) {
  requireAdmin_(token, asId);
  const email = String(m.email || '').trim().toLowerCase();
  const name = String(m.name || '').trim();
  if (!validEmail_(email)) throw new Error('メールアドレスが正しくありません');
  if (!name) throw new Error('表示名を入れてください');
  if ([ROLE.TEACHER, ROLE.STUDENT, ROLE.COACH, ROLE.PARENT].indexOf(m.role) < 0) throw new Error('区分が正しくありません');
  withLock_(function () {
    const all = readAll_('members');
    if (all.some(function (x) { return x.email.toLowerCase() === email && x.id !== m.id; })) throw new Error('このメールアドレスは、すでに登録されています');
    const studentIds = all.filter(function (x) { return x.role === ROLE.STUDENT; }).map(function (x) { return x.id; });
    const row = m.id ? all.filter(function (x) { return x.id === m.id; })[0] : null;
    if (m.id && !row) throw new Error('メンバーが見つかりません');
    const isOwnerRow = row && row.email.toLowerCase() === ownerEmail_();
    const o = row || { id: newId_('m_'), createdAt: now_() };
    o.email = isOwnerRow ? row.email : email;
    o.name = name;
    o.role = isOwnerRow ? ROLE.TEACHER : m.role;
    o.grade = m.role === ROLE.STUDENT ? String(m.grade || '') : '';
    o.isAdmin = isOwnerRow || (m.adminFlag && m.role !== ROLE.STUDENT && m.role !== ROLE.PARENT) ? '○' : '';
    o.children = m.role === ROLE.PARENT ? (m.children || []).filter(function (id) { return studentIds.indexOf(id) >= 0; }).join(',') : '';
    o.status = isOwnerRow ? '有効' : (m.status === '停止' ? '停止' : '有効');
    o.notify = m.role === ROLE.PARENT && m.notify ? '○' : '';

    const ne = String(m.notifyEmail || '').trim().toLowerCase();
    if (ne && !validEmail_(ne)) throw new Error('通知の送り先のメールアドレスが正しくありません');
    o.notifyEmail = m.role === ROLE.PARENT ? ne : '';
    if (row) updateRow_('members', o); else append_('members', o);
  });
  return { log: applyPermissions_() };
}

function roleFromText_(t) {
  const aliases = {
    '生徒': ROLE.STUDENT, '部員': ROLE.STUDENT, '保護者': ROLE.PARENT, '指導者': ROLE.COACH, 'コーチ': ROLE.COACH, '外部指導者': ROLE.COACH,
    '管理者': ROLE.TEACHER, '先生': ROLE.TEACHER, '教員': ROLE.TEACHER, '顧問': ROLE.TEACHER
  };
  return aliases[t] || '';
}
const MAX_BULK_ROWS = 200;

function api_addMembers(token, asId, rows, check) {
  requireAdmin_(token, asId);
  const list = (rows || []).slice(0, MAX_BULK_ROWS + 1);
  if (!list.length) throw new Error('登録する行がありません');
  if (list.length > MAX_BULK_ROWS) throw new Error('一度に登録できるのは' + MAX_BULK_ROWS + '人までです');
  let result;
  const work = function () {
    const all = readAll_('members');
    const emails = {};
    all.forEach(function (x) { emails[x.email.toLowerCase()] = '登録済み'; });

    const studentsByName = {};
    const addStudent = function (name, id) { (studentsByName[name] = studentsByName[name] || []).push(id); };
    all.filter(function (x) { return x.role === ROLE.STUDENT && x.status !== '停止'; }).forEach(function (x) { addStudent(x.name, x.id); });
    const out = list.map(function (r, i) {
      const o = { line: i + 1, name: String(r.name || '').trim(), email: String(r.email || '').trim().toLowerCase(),
        roleText: String(r.role || '').trim(), grade: String(r.grade || '').trim().replace(/年$/, ''),
        childText: String(r.children || '').trim(), notifyEmail: String(r.notifyEmail || '').trim().toLowerCase(), errors: [] };
      o.role = roleFromText_(o.roleText);
      o.id = newId_('m_');
      if (!o.name) o.errors.push('表示名がない');
      if (!validEmail_(o.email)) o.errors.push('メールアドレスが正しくない');
      else if (emails[o.email]) o.errors.push(emails[o.email] === '登録済み' ? 'すでに登録されている' : 'この表の中で重複（' + emails[o.email] + '行目）');
      else emails[o.email] = String(o.line);
      if (!o.role) o.errors.push('区分が分からない（生徒・保護者・指導者・管理者のどれか）');
      if (o.role === ROLE.STUDENT) {
        if (['1', '2', '3'].indexOf(o.grade) < 0) o.errors.push('学年は1〜3');
        if (o.name) addStudent(o.name, o.id);
      }
      if (o.notifyEmail && !validEmail_(o.notifyEmail)) o.errors.push('通知の送り先が正しくない');
      return o;
    });
    out.forEach(function (o) {
      o.children = [];
      if (o.role !== ROLE.PARENT) return;
      if (!o.childText) { o.errors.push('子どもの名前がない'); return; }
      o.childText.split(/[、,，]/).map(function (s) { return s.trim(); }).filter(String).forEach(function (n) {
        const ids = studentsByName[n] || [];
        if (ids.length === 1) o.children.push(ids[0]);
        else o.errors.push(ids.length ? '同じ名前の生徒が' + ids.length + '人いる（' + n + '）' : '生徒が見つからない（' + n + '）');
      });
    });
    const ok = out.every(function (o) { return !o.errors.length; });
    if (ok && !check) {
      const t = now_();
      appendMany_('members', out.map(function (o) {
        return {
          id: o.id, email: o.email, name: o.name, role: o.role, grade: o.role === ROLE.STUDENT ? o.grade : '',
          isAdmin: o.role === ROLE.TEACHER ? '○' : '', children: o.children.join(','), status: '有効',
          notify: o.role === ROLE.PARENT ? '○' : '', notifyEmail: o.role === ROLE.PARENT ? o.notifyEmail : '', createdAt: t
        };
      }));
    }
    result = {
      ok: ok, added: ok && !check ? out.length : 0,
      rows: out.map(function (o) { return { line: o.line, name: o.name, email: o.email, role: o.role || o.roleText, grade: o.role === ROLE.STUDENT ? o.grade : '', children: o.childText, errors: o.errors }; })
    };
  };
  if (check) work(); else withLock_(work);
  if (result.added) result.log = applyPermissions_();
  return result;
}

function api_deleteMember(token, asId, memberId, withParents) {
  return api_deleteMembers(token, asId, [memberId], withParents);
}

function api_deleteMembers(token, asId, memberIds, withParents) {
  const me = requireAdmin_(token, asId);
  const want = {};
  (memberIds || []).forEach(function (id) { want[id] = true; });
  if (!Object.keys(want).length) throw new Error('削除する人を選んでください');
  if (want[me.id]) throw new Error('自分を削除することはできません');
  const names = [];
  withLock_(function () {
    const all = readAll_('members');
    const targets = all.filter(function (x) { return want[x.id]; });
    if (targets.length !== Object.keys(want).length) throw new Error('メンバーが見つかりません');
    if (targets.some(function (x) { return x.email.toLowerCase() === ownerEmail_(); })) throw new Error('アプリの所有者は削除できません');
    const ids = {};
    targets.forEach(function (x) { ids[x.id] = true; names.push(x.name); });

    all.filter(function (x) { return x.role === ROLE.PARENT && x.children && !ids[x.id]; }).forEach(function (p) {
      const kids = p.children.split(',').map(function (s) { return s.trim(); }).filter(String);
      const rest = kids.filter(function (id) { return !ids[id]; });
      if (rest.length === kids.length) return;
      if (withParents && !rest.length) {
        ids[p.id] = true;
        names.push(p.name);
      } else {
        p.children = rest.join(',');
        updateRow_('members', p);
      }
    });
    const gone = function (r) { return ids[r.memberId] === true; };
    deleteRowsWhere_('members', function (r) { return ids[r.id] === true; });
    deleteRowsWhere_('channelMembers', gone);
    deleteRowsWhere_('reads', gone);
    deleteRowsWhere_('myPins', gone);
  });
  return { deleted: names, log: applyPermissions_() };
}

function api_setChannelType(token, asId, channelId, type) {
  requireAdmin_(token, asId);
  if (CHANNEL_TYPES.indexOf(type) < 0) throw new Error('種類が正しくありません');
  withLock_(function () {
    const c = findRow_('channels', function (x) { return x.id === channelId; });
    if (!c) throw new Error('チャンネルが見つかりません');

    if (type === 'parents' && c.place !== 'admin') {
      throw new Error('「保護者のみ」は、先生だけの共有ドライブのフォルダにしか設定できません（活動の共有ドライブのファイルは、生徒がドライブから見られるため）。「＋ 新しいチャンネル」で、場所を「先生だけの共有ドライブ」にして作ってください');
    }
    c.type = type;
    updateRow_('channels', c);
  });
  return { log: applyPermissions_() };
}

function api_setAppSettings(token, asId, settings) {
  requireAdmin_(token, asId);
  saveAppSettings_(settings);
  return appSettings_();
}

function api_removeChannel(token, asId, channelId) {
  requireAdmin_(token, asId);
  syncChannels_();
  let threads = 0;
  withLock_(function () {
    const c = findRow_('channels', function (x) { return x.id === channelId; });
    if (!c) throw new Error('チャンネルが見つかりません');
    if (c.status === '有効') throw new Error('フォルダがあるチャンネルは消せません。使わないときは「チャンネルにしない」にしてください');
    threads = readAll_('threads').filter(function (t) { return t.channelId === channelId; }).length;
    deleteRowsWhere_('channels', function (r) { return r.id === channelId; });
    deleteRowsWhere_('channelMembers', function (r) { return r.channelId === channelId; });
    deleteRowsWhere_('drivePerms', function (r) { return r.folderId === c.folderId; });
  });
  return { threads: threads };
}

function api_setChannelPurpose(token, asId, channelId, purpose) {
  requireAdmin_(token, asId);
  withLock_(function () {
    const c = findRow_('channels', function (x) { return x.id === channelId; });
    if (!c) throw new Error('チャンネルが見つかりません');
    c.purpose = purpose === 'absence' ? 'absence' : '';
    updateRow_('channels', c);
  });
  return { ok: true };
}

function api_setChannelMembers(token, asId, channelId, memberIds) {
  requireAdmin_(token, asId);
  withLock_(function () {
    if (!findRow_('channels', function (x) { return x.id === channelId; })) throw new Error('チャンネルが見つかりません');
    const valid = {};
    readAll_('members').forEach(function (m) { if (m.role === ROLE.STUDENT) valid[m.id] = true; });
    const rows = readAll_('channelMembers').filter(function (r) { return r.channelId === channelId; });
    rows.map(function (r) { return r._row; }).sort(function (a, b) { return b - a; })
      .forEach(function (row) { deleteRow_('channelMembers', row); });
    appendMany_('channelMembers', (memberIds || []).filter(function (id) { return valid[id]; })
      .map(function (id) { return { channelId: channelId, memberId: id }; }));
  });
  return { log: applyPermissions_() };
}

function api_newChannel(token, asId, folderName, place) {
  const me = requireMember_(token, asId);
  if (!me.isAdmin && me.role !== ROLE.COACH) throw new Error('チャンネルを作れるのは、管理者と指導者です');
  const name = safeFileName_(folderName);
  if (!String(folderName || '').trim()) throw new Error('フォルダの名前を入れてください');
  const rootId = place === 'admin' ? prop_('ADMIN_ROOT_ID') : prop_('CLUB_ROOT_ID');
  const folder = DriveApp.getFolderById(rootId).createFolder(name);
  syncChannels_();
  CacheService.getScriptCache().put('channelSync', '1', SYNC_INTERVAL_SEC);
  withLock_(function () {
    const c = findRow_('channels', function (x) { return x.folderId === folder.getId(); });
    if (c) {
      c.type = 'all';
      updateRow_('channels', c);
    } else {

      const p = parseFolderName_(name);
      append_('channels', { id: newId_('c_'), folderId: folder.getId(), no: p.no, name: p.name, type: 'all', place: place === 'admin' ? 'admin' : 'club', status: '有効', createdAt: now_() });
    }
  });
  applyPermissions_();
  return buildHome_(me);
}

function api_loginSettings(token, asId) {
  const who = identify_(token, '');
  if (!who.isOwner) throw new Error('アプリの所有者だけが使えます');
  return { loginUrl: prop_('LOGIN_URL'), appUrl: appUrl_(), secret: prop_('SHARED_SECRET') };
}

function api_setLoginUrl(token, asId, url) {
  const who = identify_(token, '');
  if (!who.isOwner) throw new Error('アプリの所有者だけが使えます');
  const u = String(url || '').trim();
  if (u && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(u)) {
    throw new Error('ログイン用アプリのURLは「https://script.google.com/macros/s/…/exec」の形で入れてください');
  }
  props_().setProperty('LOGIN_URL', u);
  return api_loginSettings(token, asId);
}

function api_syncNow(token, asId) {
  requireAdmin_(token, asId);
  syncChannels_();
  CacheService.getScriptCache().put('channelSync', '1', SYNC_INTERVAL_SEC);
  return api_admin(token, asId);
}

function api_absence(token, asId, channelId, studentId, date, kind, note) {
  const me = requireMember_(token, asId);
  if (ABS_KINDS.indexOf(kind) < 0) throw new Error('種類が正しくありません');

  const memo = String(note == null ? '' : note).replace(/\r\n/g, '\n').trim();
  if (memo.length > MAX_ABS_NOTE) throw new Error('先生・指導者へのメモが長すぎます（' + MAX_ABS_NOTE + '文字まで）');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new Error('日付が正しくありません');
  let sid;
  if (me.role === ROLE.STUDENT) sid = me.id;
  else if (me.role === ROLE.PARENT && me.children.indexOf(studentId) >= 0) sid = studentId;
  else if (me.isAdmin) sid = studentId;
  else throw new Error('欠席連絡を送れるのは、生徒本人と、その保護者と、先生です');
  const student = findRow_('members', function (x) { return x.id === sid && x.role === ROLE.STUDENT; });
  if (!student) throw new Error('生徒を選んでください');
  const d = new Date(date + 'T00:00:00');
  const wd = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  const text = student.name + '：' + (d.getMonth() + 1) + '/' + d.getDate() + '（' + wd + '）' + kind + 'します。' +
    (me.isAdmin && me.role !== ROLE.STUDENT && me.role !== ROLE.PARENT ? '（' + me.name + 'が登録）' : '');
  withLock_(function () {
    const c = requireChannel_(me, channelId);
    if (c.purpose !== 'absence') throw new Error('このチャンネルは欠席連絡用ではありません');
    const t = now_(), tid = newId_('t_');
    append_('threads', { id: tid, channelId: channelId, authorId: me.id, createdAt: t, updatedAt: t, pinned: '' });
    append_('posts', { id: newId_('p_'), threadId: tid, authorId: me.id, createdAt: t, body: text, absStudentId: sid, absDate: date, absKind: kind, absNote: memo });
    setRead_(me.id, tid, t);
  });
  return buildHome_(me);
}

function api_search(token, asId, q) {
  const me = requireMember_(token, asId);
  const words = String(q || '').trim().toLowerCase().split(/\s+/).filter(String);
  if (!words.length) return [];
  const home = buildHome_(me);
  const out = [];
  home.threads.forEach(function (t) {
    t.posts.forEach(function (p) {
      if (p.deleted) return;
      const hay = (p.body + ' ' + p.files.map(function (f) { return f.name; }).join(' ')).toLowerCase();
      if (words.every(function (w) { return hay.indexOf(w) >= 0; })) {
        out.push({ threadId: t.id, channelId: t.channelId, postId: p.id, author: p.author.name, createdAt: p.createdAt, body: p.body, files: p.files.map(function (f) { return f.name; }) });
      }
    });
  });
  return out.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).slice(0, 100);
}

function api_discardUpload(token, asId, channelId, fileId) {
  const me = requireMember_(token, asId);
  const c = requireChannel_(me, channelId);
  const used = readAll_('posts').some(function (p) { return p.files && p.files.indexOf(fileId) >= 0; });
  if (used) return { ok: false };
  const file = DriveApp.getFileById(fileId);
  if (file.getDescription() !== UPLOADER_TAG + me.id) return { ok: false };
  const folderId = attachFolder_(c).getId();
  const parents = file.getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === folderId) { file.setTrashed(true); return { ok: true }; }
  }
  return { ok: false };
}

function migrateDev_() {
  if (!isDev_() || prop_('DEV_MIGRATED_PURPOSE')) return;
  withLock_(function () {
    readAll_('channels').forEach(function (c) {
      if ((c.name === '活動予定・欠席連絡' || c.name === '欠席連絡（保護者）') && !c.purpose) { c.purpose = 'absence'; updateRow_('channels', c); }
    });
  });
  props_().setProperty('DEV_MIGRATED_PURPOSE', '1');
}

function seedDevContentIfEmpty_() {
  if (!isDev_() || readAll_('channels').length) return false;
  const admin = DriveApp.getFolderById(prop_('ADMIN_ROOT_ID'));
  admin.createFolder('欠席連絡（保護者）');
  admin.createFolder('保護者連絡');
  syncChannels_();

  const chs = readAll_('channels');
  const ch = function (name) { return chs.filter(function (c) { return c.name === name; })[0]; };
  const types = {
    '塩酸のさび班': 'members', 'ロボットプログラミング': 'members', '科学の祭典': 'public', '個人研究2026': 'all',
    '活動予定': 'public', '活動予定・欠席連絡': 'all', '交流・その他': 'all', '欠席連絡（保護者）': 'parents', '保護者連絡': 'parents'
  };
  chs.forEach(function (c) {
    if (types[c.name]) c.type = types[c.name];
    if (c.name === '活動予定・欠席連絡' || c.name === '欠席連絡（保護者）') c.purpose = 'absence';
    if (types[c.name] || c.purpose) updateRow_('channels', c);
  });
  appendMany_('channelMembers', [
    { channelId: ch('塩酸のさび班').id, memberId: 'm_s1' }, { channelId: ch('塩酸のさび班').id, memberId: 'm_s3' },
    { channelId: ch('ロボットプログラミング').id, memberId: 'm_s1' }, { channelId: ch('ロボットプログラミング').id, memberId: 'm_s3' }
  ]);

  const threads = [], posts = [], reads = [], reactions = [];

  const thread = function (chName, pinned, list, readMap, rx) {
    const tid = newId_('t_');
    const ids = list.map(function (p) {
      const pid = newId_('p_');
      const o = { id: pid, threadId: tid, authorId: p[0], createdAt: p[1], body: p[2], files: '', editedAt: '', deleted: '' };
      if (p[3]) { o.absStudentId = p[3][0]; o.absDate = p[3][1]; o.absKind = p[3][2]; }
      posts.push(o);
      return pid;
    });
    threads.push({ id: tid, channelId: ch(chName).id, authorId: list[0][0], createdAt: list[0][1], updatedAt: list[list.length - 1][1], pinned: pinned ? '○' : '' });
    Object.keys(readMap || {}).forEach(function (mid) { reads.push({ memberId: mid, threadId: tid, readAt: readMap[mid] }); });
    (rx || []).forEach(function (r) { reactions.push({ postId: ids[r[0]], memberId: r[1], kind: r[2], createdAt: list[r[0]][1] }); });
  };

  thread('活動予定', true, [
    ['m_owner', '2026-10-01 08:00:00', '【固定】2学期の活動予定表です。変更があればこのスレッドでお知らせします。'],
    ['m_owner', '2026-10-15 17:30:00', '10/23（金）は職員会議のため活動なしに変更しました。']
  ], { m_owner: '2026-10-15 17:30:00', m_s1: '2026-10-02 12:00:00', m_s2: '2026-10-16 12:00:00', m_c1: '2026-10-16 12:00:00', m_p2: '2026-10-16 12:00:00' },
  [[0, 'm_s1', 'see'], [0, 'm_s2', 'see'], [0, 'm_p1', 'see'], [0, 'm_c1', 'like'], [1, 'm_p2', 'see']]);

  thread('科学の祭典', false, [
    ['m_owner', '2026-10-16 16:20:00', '科学の祭典（11/8）の出展内容を決めました。当日は保護者の方の見学も歓迎です。'],
    ['m_p2', '2026-10-16 19:05:00', '見学に伺います。駐車場はありますか？'],
    ['m_owner', '2026-10-16 20:10:00', '体育館横の駐車場をご利用ください。'],
    ['m_s2', '2026-10-17 18:40:00', 'ポスターの下書きができました！'],
    ['m_c1', '2026-10-18 07:50:00', 'いいですね。タイトルの文字をもう少し大きくしましょう。']
  ], { m_owner: '2026-10-16 21:00:00', m_s1: '2026-10-16 21:00:00', m_s2: '2026-10-18 08:00:00', m_c1: '2026-10-18 08:00:00', m_p1: '2026-10-16 17:00:00', m_p2: '2026-10-17 12:00:00' },
  [[0, 'm_s2', 'like'], [0, 'm_c1', 'like'], [2, 'm_p2', 'see'], [3, 'm_owner', 'like'], [3, 'm_c1', 'like']]);

  thread('塩酸のさび班', false, [
    ['m_s3', '2026-10-14 16:00:00', '鉄くぎを塩酸に入れた実験の結果です。3日目で色が変わりました。'],
    ['m_s1', '2026-10-14 16:30:00', '濃度を変えた比較もやってみたいです。'],
    ['m_c1', '2026-10-17 21:00:00', '濃度を3段階にして、同じ日数で比べるとよいですよ。'],
    ['m_s3', '2026-10-18 08:10:00', 'ありがとうございます。月曜日に準備します。']
  ], { m_owner: '2026-10-14 17:00:00', m_s1: '2026-10-14 17:00:00', m_s3: '2026-10-18 09:00:00', m_c1: '2026-10-17 21:00:00' },
  [[0, 'm_owner', 'see'], [0, 'm_s1', 'like']]);

  thread('ロボットプログラミング', false, [
    ['m_owner', '2026-10-12 15:00:00', 'ロボットのセンサーの資料をフォルダに置きました。']
  ], { m_owner: '2026-10-12 15:00:00', m_s1: '2026-10-12 16:00:00', m_s3: '2026-10-13 10:00:00' }, [[0, 'm_s1', 'see'], [0, 'm_s3', 'see']]);

  thread('活動予定・欠席連絡', false, [
    ['m_s1', '2026-10-17 12:30:00', '山田 太郎：10/20（火）遅刻します。', ['m_s1', '2026-10-20', '遅刻']]
  ], { m_owner: '2026-10-17 13:00:00', m_s1: '2026-10-17 12:30:00', m_s2: '2026-10-17 13:00:00' }, [[0, 'm_owner', 'see']]);

  thread('欠席連絡（保護者）', false, [
    ['m_p2', '2026-10-17 07:30:00', '佐藤 花子：10/17（土）欠席します。', ['m_s2', '2026-10-17', '欠席']],
    ['m_owner', '2026-10-17 07:45:00', '承知しました。']
  ], { m_owner: '2026-10-17 08:00:00', m_p2: '2026-10-17 08:00:00' }, [[0, 'm_owner', 'see']]);

  thread('保護者連絡', false, [
    ['m_owner', '2026-10-17 19:00:00', '保護者の皆さまへ：科学の祭典当日の送迎についてのお願いです。生徒には別途伝えます。']
  ], { m_owner: '2026-10-17 19:00:00', m_p2: '2026-10-18 06:00:00' }, [[0, 'm_p2', 'see']]);

  appendMany_('threads', threads);
  appendMany_('posts', posts);
  appendMany_('reads', reads);
  appendMany_('reactions', reactions);
  return true;
}

function ownerEmail_() {
  return Session.getEffectiveUser().getEmail().toLowerCase();
}

function isOwner_() {
  return (Session.getActiveUser().getEmail() || '').toLowerCase() === ownerEmail_();
}

function identify_(token, asId) {
  let email = (Session.getActiveUser().getEmail() || '').toLowerCase();
  let method = email ? 'auto' : 'none';
  let error = '';
  if (!email && token) {
    const r = verifyToken_(token);
    if (r.email) { email = r.email.toLowerCase(); method = 'token'; } else { error = r.error; }
  }
  if (!email) return { email: '', method: 'none', error: error };

  const members = readAll_('members');
  const real = members.find(function (x) { return x.email.toLowerCase() === email && x.status !== '停止'; }) || null;
  const isOwner = email === ownerEmail_();
  let me = real;
  if (asId && isDev_() && isOwner) {
    me = members.find(function (x) { return x.id === asId; }) || real;
  }
  const pm = me ? publicMember_(me) : null;
  if (pm && pm.role === ROLE.PARENT) {
    pm.notify = me.notify === '○'; // 「👤 設定」で、メールのお知らせを切り替えるため

    pm.childrenInfo = pm.children.map(function (id) {
      const c = members.filter(function (x) { return x.id === id; })[0];
      return c ? { id: c.id, name: c.name } : null;
    }).filter(Boolean);
  }
  return {
    email: email, method: method, isOwner: isOwner,
    member: pm,
    impersonating: !!(me && real && me.id !== real.id)
  };
}

function isAdmin_(m) {
  return !!m && (m.role === ROLE.TEACHER || m.isAdmin === true || m.isAdmin === '○');
}

function publicMember_(m) {
  return {
    id: m.id, name: m.name, role: m.role, grade: m.grade, joinedAt: m.createdAt || '',
    isAdmin: isAdmin_(m),
    children: m.children ? m.children.split(',').map(function (s) { return s.trim(); }).filter(String) : []
  };
}

function verifyToken_(token) {
  const secret = prop_('SHARED_SECRET');
  if (!secret) return { error: '合言葉（SHARED_SECRET）が設定されていません' };
  const parts = String(token).split('.');
  if (parts.length !== 2) return { error: 'ログイン情報の形式が正しくありません' };
  const sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0], secret));
  if (sig !== parts[1]) return { error: 'ログイン情報を確認できませんでした' };
  let payload;
  try {
    payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString('UTF-8'));
  } catch (err) {
    return { error: 'ログイン情報を読み取れません' };
  }
  if (payload.exp * 1000 < Date.now()) return { error: 'ログインの有効期限が切れています。もう一度ログインしてください' };
  return { email: payload.email };
}

const DIGEST_SNIPPET = 50;
const DEFAULT_NOTIFY_HOUR = 18;

function appUrl_() {
  return prop_('APP_URL') || ScriptApp.getService().getUrl();
}

function notifyHour_() {
  const s = prop_('NOTIFY_HOUR');
  if (s === '') return DEFAULT_NOTIFY_HOUR; // まだ決めていないときは18時（空の文字は数にすると0になるので、先に調べる）
  const h = Number(s);
  return h >= 0 && h <= 23 ? h : DEFAULT_NOTIFY_HOUR;
}

function buildDigest_(m, since) {
  const pm = publicMember_(m);
  const home = buildHome_(pm);
  const chName = {};
  home.channels.forEach(function (c) { chName[c.id] = c.name; });
  const items = [];
  home.threads.forEach(function (t) {
    t.posts.forEach(function (p) {
      if (p.deleted || p.mine || p.createdAt <= since) return;
      let text = p.body.replace(/\s+/g, ' ').trim();
      if (!text && p.files.length) text = '（ファイル ' + p.files.length + '件）';
      if (text.length > DIGEST_SNIPPET) text = text.slice(0, DIGEST_SNIPPET) + '…';
      items.push({ channel: chName[t.channelId], author: p.author.name, createdAt: p.createdAt, text: text });
    });
  });
  if (!items.length) return null;
  items.sort(function (a, b) { return a.channel === b.channel ? (a.createdAt < b.createdAt ? -1 : 1) : a.channel.localeCompare(b.channel, 'ja'); });

  const today = Utilities.formatDate(new Date(), TZ, 'M/d');
  const subject = '【' + appName_() + '】新しい投稿が' + items.length + '件あります（' + today + '）';
  const url = appUrl_();
  let body = m.name + ' さん\n\n' + appName_() + ' に、新しい投稿が ' + items.length + ' 件あります。\n';
  let html = '<p>' + htmlEsc_(m.name) + ' さん</p><p>' + htmlEsc_(appName_()) + ' に、新しい投稿が <b>' + items.length + ' 件</b>あります。</p>';
  let last = null;
  items.forEach(function (it) {
    if (it.channel !== last) {
      body += '\n# ' + it.channel + '\n';
      html += (last === null ? '' : '</ul>') + '<p style="margin:12px 0 4px"><b># ' + htmlEsc_(it.channel) + '</b></p><ul style="margin:0;padding-left:20px">';
      last = it.channel;
    }
    body += '・' + it.author + '（' + it.createdAt.slice(5, 16).replace('-', '/') + '）：' + it.text + '\n';
    html += '<li>' + htmlEsc_(it.author) + '（' + it.createdAt.slice(5, 16).replace('-', '/') + '）：' + htmlEsc_(it.text) + '</li>';
  });
  html += '</ul>';
  body += '\n続きは、アプリで読んでください：\n' + url + '\n\n' +
    '――\nこのメールは送信専用です。返信しても届きません。\n' +
    'メールでのお知らせを止めるには、アプリの左下の「👤 設定」で「メールで知らせる」を外してください。\n';
  html += '<p style="margin-top:16px"><a href="' + url + '">' + htmlEsc_(appName_()) + ' を開く</a></p>' +
    '<p style="color:#667085;font-size:12px">このメールは送信専用です。返信しても届きません。<br>' +
    'メールでのお知らせを止めるには、アプリの左下の「👤 設定」で「メールで知らせる」を外してください。</p>';
  return { to: notifyAddress_(m), subject: subject, body: body, htmlBody: html, count: items.length };
}

function notifyAddress_(m) {
  return m.notifyEmail || m.email;
}

function htmlEsc_(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}

function sendMail_(d) {
  const opt = { to: d.to, subject: d.subject, body: d.body, htmlBody: d.htmlBody, name: appName_() };
  if (!isDev_()) opt.noReply = true; // 返信を受け付けない（学校のアカウントで使える設定）
  MailApp.sendEmail(opt);
}

function sendDailyDigest() {
  const log = [];
  const t = now_();
  const members = readAll_('members').filter(function (m) { return m.role === ROLE.PARENT && m.status !== '停止' && m.notify === '○'; });
  members.forEach(function (m) {
    const since = m.notifiedAt || m.createdAt || '';
    const d = buildDigest_(m, since);
    if (d) {
      if (isDummyEmail_(d.to)) {
        log.push(m.name + '：' + d.count + '件（開発用のダミーのため送らない）');
      } else {
        try {
          sendMail_(d);
          log.push(m.name + '：' + d.count + '件を送った');
        } catch (e) {
          log.push(m.name + '：送れなかった（' + e.message + '）');
          return; // 送れなかったときは、次回もう一度送るため、通知した日時を更新しない
        }
      }
    }
    withLock_(function () {
      const row = findRow_('members', function (x) { return x.id === m.id; });
      if (row) { row.notifiedAt = t; updateRow_('members', row); }
    });
  });
  props_().setProperty('NOTIFY_LAST_RUN', t + '｜' + (log.join('／') || '送る相手なし'));
  return log;
}

function api_notifyInfo(token, asId) {
  requireAdmin_(token, asId);
  const triggers = ScriptApp.getProjectTriggers().filter(function (tr) { return tr.getHandlerFunction() === 'sendDailyDigest'; });
  const parents = readAll_('members').filter(function (m) { return m.role === ROLE.PARENT && m.status !== '停止'; });
  return {
    hour: notifyHour_(),
    scheduled: triggers.length > 0,
    lastRun: prop_('NOTIFY_LAST_RUN'),
    testTo: prop_('TEST_MAIL_TO'),
    appUrl: appUrl_(),
    previews: parents.map(function (m) {
      const d = m.notify === '○' ? buildDigest_(m, m.notifiedAt || m.createdAt || '') : null;
      return { id: m.id, name: m.name, notify: m.notify === '○', to: notifyAddress_(m), count: d ? d.count : 0, subject: d ? d.subject : '', body: d ? d.body : '', dummy: isDummyEmail_(notifyAddress_(m)) };
    })
  };
}

function api_setNotifySchedule(token, asId, hour) {
  requireAdmin_(token, asId);
  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (tr.getHandlerFunction() === 'sendDailyDigest') ScriptApp.deleteTrigger(tr);
  });
  const h = Number(hour);
  if (h >= 0 && h <= 23) {
    props_().setProperty('NOTIFY_HOUR', String(h));
    ScriptApp.newTrigger('sendDailyDigest').timeBased().atHour(h).everyDays(1).inTimezone(TZ).create();
  }
  return api_notifyInfo(token, asId);
}

function api_sendTestDigest(token, asId, parentId, toAddress) {
  requireAdmin_(token, asId);
  const to = String(toAddress || '').trim();
  if (!validEmail_(to)) throw new Error('見本の送り先のメールアドレスを入れてください');
  const m = findRow_('members', function (x) { return x.id === parentId; });
  if (!m) throw new Error('保護者が見つかりません');
  const d = buildDigest_(m, m.notifiedAt || m.createdAt || '');
  if (!d) throw new Error('この保護者に知らせる新しい投稿はありません');
  d.to = to;
  d.subject = '［見本］' + d.subject;
  sendMail_(d);
  props_().setProperty('TEST_MAIL_TO', to);
  return { to: to };
}

function api_sendDigestNow(token, asId) {
  requireAdmin_(token, asId);
  return sendDailyDigest();
}

function api_setMyNotify(token, asId, on) {
  const me = requireMember_(token, asId);
  if (me.role !== ROLE.PARENT) throw new Error('メールのお知らせは、保護者の方だけの機能です');
  withLock_(function () {
    const row = findRow_('members', function (x) { return x.id === me.id; });
    row.notify = on ? '○' : '';
    updateRow_('members', row);
  });
  return { notify: !!on };
}
