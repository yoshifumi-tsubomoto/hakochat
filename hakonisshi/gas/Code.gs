// ハコ日誌 配布用（2026/11/24 20:02:54 作成）。Copyright 坪本 吉史 / Apache License 2.0。直接編集せず、新しい版は貼り替えてください。


const SHEET = {
  CONFIG: '設定',
  MEMBERS: '部員',
  THEMES: 'テーマ',
  BELONG: '所属',
  DAYS: '活動日',
  LOG: '日誌',
  SYNCLOG: '同期ログ',
  PLAN: '全体予定',
  COMMENT: 'コメント',
  READ: '既読',
  MILESTONE: 'マイルストーン',
};

const HEADERS = {
  [SHEET.CONFIG]: ['項目', '値', '説明'],
  [SHEET.MEMBERS]: ['部員ID', '区分', '学年', '組', '氏名', 'メール', '学校', '在籍', 'メモ'],
  [SHEET.THEMES]: ['テーマID', 'テーマ名', '状態', '表示順', '色', '開始日', '終了日', 'メモ'],
  [SHEET.BELONG]: ['氏名', 'テーマ名', 'メモ'],
  [SHEET.DAYS]: ['日付', '曜', '休日', '活動予定', '時間', '活動場所', '行事1', '行事2', '備考',
                 '自動判定', '手動設定', '活動', '出所', '同期日時'],
  [SHEET.LOG]: ['日付', '部員ID', 'テーマID', '予定', 'やったこと', '次回やること', '出欠', '持ち物',
                '更新者', '更新日時'],
  [SHEET.SYNCLOG]: ['実行日時', '読み込んだ月', '日数', '活動日数', '警告'],
  [SHEET.PLAN]: ['日付', '内容', '更新者', '更新日時'],
  [SHEET.COMMENT]: ['コメントID', '日付', '部員ID', '欄', '本文', '書いた人', '名前', '作成日時', '更新日時', '削除'],
  [SHEET.READ]: ['メール', 'スレッド', '既読日時'],
  [SHEET.MILESTONE]: ['ID', 'テーマID', '種類', '内容', '期限', '状態', '登録者', '登録日時', '更新日時', 'メモ'],
};

const DEFAULT_CONFIG = [
  ['予定表ID', '', '活動予定表（年間予定のシートがあるスプレッドシート）のファイルID'],
  ['予定シート名', '年間予定', '活動日の同期元。1日1行（月・日・曜・行事1・行事2・活動予定・時間・活動場所・備考）'],
  ['年度', new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1, '4〜12月はこの年、1〜3月は翌年として日付を作る'],
  ['旧日誌ID', '', '（使う場合だけ）以前の日誌のファイルID。部員名簿の取り込みと「旧日誌を取り込む」に使う'],
  ['管理者メール', '', '教員として全員分を編集できるアカウント（カンマ区切り）。部員シートで区分=教員の人は書かなくてよい'],
  ['行事1の名前', '', '活動予定表の行事の列1の見出し（新しく作るとき・作り直すときに使う。空なら「学校行事」）'],
  ['行事2の名前', '', '活動予定表の行事の列2の見出し（空なら「（予備）」）'],
];

const SEED_THEMES = [];

const THEME_STATES = ['進行中', '休止', '完了', '要確認'];

function onOpen() {
  const ss = SpreadsheetApp.getActive();
  ensureConfigDefaults_(ss);
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu(APP_DEFAULT_NAME);
  if (!ss.getSheetByName(SHEET.CONFIG)) {

    menu.addItem('初期設定（最初にここから）', 'setupDatabase').addToUi();
    return;
  }
  const tools = ui.createMenu('活動予定表の作業')
    .addItem('月予定を保存（値だけの月シートを作る）', 'archiveMonthlyView')
    .addItem('月予定シートを作成', 'createMonthlyView')
    .addItem('月予定の色と文字を整える', 'fixMonthlyViewFormat');

  if (typeof buildAnnualFromMonthSheets === 'function') tools.addItem('年間予定を月別シートから作成（最初に1回）', 'buildAnnualFromMonthSheets');
  menu.addItem('活動日を今すぐ同期', 'syncActivityDays')
    .addItem('自動同期を1時間ごとにする', 'installHourlyTrigger')
    .addSeparator()
    .addSubMenu(tools)
    .addSeparator()
    .addItem('初期設定（名前・年度・活動予定表）', 'setupDatabase');
  if (typeof importOldJournal === 'function') menu.addItem('旧日誌を取り込む', 'importOldJournal');
  menu.addToUi();
}

function setupDatabase() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(HEADERS).forEach(name => ensureSheet_(ss, name, HEADERS[name]));

  const blank = ss.getSheetByName('シート1') || ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);

  ensureConfigDefaults_(ss);
  importMembers_(ss);
  seedThemes_(ss);
  setValidations_(ss);
  ensureTimeZone_();
  ensureGuideSheet_(ss);
  openSetupWizard_();
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground('#e8eef7');
    sh.setFrozenRows(1);
  }
  return sh;
}

function ensureConfigDefaults_(ss) {
  const sh = ss.getSheetByName(SHEET.CONFIG);
  if (!sh) return; // 初期設定の前（新しいシート）は何もしない。メニューだけは出す
  const have = new Set(sh.getLastRow() > 1
    ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(r => String(r[0]).trim())
    : []);
  const missing = DEFAULT_CONFIG.filter(r => !have.has(r[0]));
  if (missing.length) sh.getRange(sh.getLastRow() + 1, 1, missing.length, 3).setValues(missing);
}

function getConfig() {
  const values = SpreadsheetApp.getActive().getSheetByName(SHEET.CONFIG).getDataRange().getValues();
  const cfg = {};
  values.slice(1).forEach(r => { if (r[0]) cfg[String(r[0]).trim()] = r[1]; });
  return cfg;
}

function importMembers_(ss) {
  const sh = ss.getSheetByName(SHEET.MEMBERS);
  if (sh.getLastRow() > 1) return '部員：既存データがあるため取り込みませんでした';
  const oldId = String(getConfig()['旧日誌ID'] || '').trim();
  if (!oldId) return '部員：「部員」シートに名簿を入力してください（部員ID・区分・学年・組・氏名・メール）';

  const src = SpreadsheetApp.openById(oldId).getSheetByName('氏名');
  if (!src) return '部員：旧日誌に「氏名」シートがないため取り込みませんでした';
  const rows = src.getDataRange().getValues().slice(1)
    .filter(r => String(r[2]).trim() !== '')
    .map((r, i) => {
      const grade = String(r[0]).trim();
      const isTeacher = grade.toUpperCase() === 'T';
      return [
        'M' + String(i + 1).padStart(3, '0'),
        isTeacher ? '教員' : '生徒',
        isTeacher ? '' : grade,
        r[1],
        normalizeName(r[2]),
        String(r[3]).trim(),
        '',
        true,
        '',
      ];
    });
  if (rows.length) sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  sh.getRange(2, 8, Math.max(rows.length, 1), 1).insertCheckboxes();
  return `部員：${rows.length}名を取り込みました（在籍・学年を確認してください）`;
}

function seedThemes_(ss) {
  const sh = ss.getSheetByName(SHEET.THEMES);
  if (sh.getLastRow() > 1) return 'テーマ：既存データがあるため追加しませんでした';
  if (!SEED_THEMES.length) return 'テーマ：アプリの「テーマ」タブの「⚙ テーマを管理」から追加してください';
  const rows = SEED_THEMES.map((name, i) =>
    ['T' + String(i + 1).padStart(2, '0'), name, '要確認', i + 1, '', '', '', '旧日誌から仮登録']);
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return `テーマ：${rows.length}件を「要確認」で仮登録しました`;
}

function setValidations_(ss) {
  const members = ss.getSheetByName(SHEET.MEMBERS);
  const themes = ss.getSheetByName(SHEET.THEMES);
  const belong = ss.getSheetByName(SHEET.BELONG);
  const days = ss.getSheetByName(SHEET.DAYS);

  themes.getRange('C2:C').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(THEME_STATES, true).build());
  belong.getRange('A2:A').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(members.getRange('E2:E'), true).build());
  belong.getRange('B2:B').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(themes.getRange('B2:B'), true).build());
  days.getRange('K2:K').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['あり', 'なし'], true).build());
}

function normalizeName(name) {
  return String(name).replace(/[\s　]+/g, ' ').trim();
}

function ensureTimeZone_() {
  const ss = SpreadsheetApp.getActive();
  const tz = Session.getScriptTimeZone();
  if (ss.getSpreadsheetTimeZone() === tz) return false;
  ss.setSpreadsheetTimeZone(tz);
  return true;
}

function showMessage_(msg) {
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    console.log(msg); // トリガー実行時はUIがない
  }
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const ANNUAL_HEADERS = ['月', '日', '曜', '行事1', '行事2', '活動予定', '時間', '活動場所', '備  考'];

function syncActivityDays(quiet) {
  const cfg = getConfig();
  const nendo = Number(cfg['年度']);
  const scheduleId = String(cfg['予定表ID'] || '').trim();
  if (!scheduleId) {
    const msg = '活動予定表がまだ設定されていません。メニューの「ハコ日誌 → 初期設定」から設定してください。';
    if (quiet === true || quiet === 'auto') return msg;
    showMessage_(msg);
    return msg;
  }
  const src = SpreadsheetApp.openById(scheduleId);
  const holidays = readHolidays_(src);
  const tz = Session.getScriptTimeZone();
  const now = new Date();
  const sheetName = String(cfg['予定シート名'] || '年間予定');

  const annual = src.getSheetByName(sheetName);
  if (!annual) throw new Error(`活動予定表に「${sheetName}」シートがありません`);
  const { days, warnings } = readAnnualSchedule_(annual, nendo);

  const scheduled = new Map(); // 'yyyy-MM-dd' -> 行データ
  const months = new Set();
  days.forEach(d => {
    const key = Utilities.formatDate(d.date, tz, 'yyyy-MM-dd');
    if (scheduled.has(key)) warnings.push(`${d.month}/${d.day} が年間予定に2回あります（下の行を使用）`);
    const isHoliday = d.date.getDay() === 0 || d.date.getDay() === 6 || holidays.has(key);
    const judged = judgeActivity(d.plan, isHoliday);
    if (isHoliday && d.plan && !judged && !hasCross(d.plan)) {
      warnings.push(`${d.month}/${d.day} 休日の「${d.plan}」に〇△◎がないため活動なしと判定`);
    }
    months.add(d.month);
    scheduled.set(key, Object.assign({ isHoliday, judged }, d));
  });

  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET.DAYS);
  if (ensureTimeZone_() && sh.getLastRow() > 1) {

    sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS[SHEET.DAYS].length).clearContent();
  }
  const existing = sh.getLastRow() > 1
    ? sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS[SHEET.DAYS].length).getValues()
    : [];
  const manual = new Map();
  const extraRows = [];
  const logDates = new Set(readLog_().map(r => r.date));
  existing.forEach(r => {
    if (!(r[0] instanceof Date)) return;
    const key = Utilities.formatDate(r[0], tz, 'yyyy-MM-dd');
    if (r[10]) manual.set(key, r[10]);

    if (!scheduled.has(key) && (r[10] || r[12] === '手動' || r[12] === '旧日誌' || logDates.has(key))) {
      extraRows.push([r[0], WEEKDAYS[r[0].getDay()], r[2], r[3], r[4], r[5], r[6], r[7], r[8],
                      r[9], r[10], null, r[12] || '手動', r[13]]);
    }
  });

  const rows = [];
  scheduled.forEach((v, key) => {
    rows.push([v.date, WEEKDAYS[v.date.getDay()], v.isHoliday, v.plan, v.time, v.place,
               v.demachi, v.shogawa, v.note, v.judged, manual.get(key) || '', null, '予定表', now]);
  });
  const all = rows.concat(extraRows).sort((a, b) => a[0] - b[0]);

  if (all.length) {
    all.forEach((r, i) => {
      const row = i + 2;
      r[11] = `=IF(K${row}="",J${row},K${row}="あり")`; // 手動設定があれば優先
    });
    sh.getRange(2, 1, all.length, all[0].length).setValues(all);
    sh.getRange(2, 1, all.length, 1).setNumberFormat('yyyy/mm/dd');
    sh.getRange(2, 14, all.length, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  }
  if (existing.length > all.length) {
    sh.getRange(all.length + 2, 1, existing.length - all.length, HEADERS[SHEET.DAYS].length).clearContent();
  }

  const activeCount = all.filter((r, i) => {
    const m = r[10];
    return m ? m === 'あり' : r[9] === true;
  }).length;

  const logSheet = SpreadsheetApp.getActive().getSheetByName(SHEET.SYNCLOG);
  const logRow = [now, Array.from(months).join(','), all.length, activeCount, warnings.join('\n')];
  let same = false;
  if (quiet === 'auto' && logSheet.getLastRow() > 1) {
    const last = logSheet.getRange(logSheet.getLastRow(), 1, 1, 5).getValues()[0];
    same = String(last[1]) === logRow[1] && Number(last[2]) === logRow[2] && Number(last[3]) === logRow[3]
      && String(last[4]) === logRow[4];
  }
  if (!same) logSheet.appendRow(logRow);

  const msg = `活動日：${sheetName}から${months.size}か月分（${all.length}日）を同期、うち活動日 ${activeCount}日`
    + (warnings.length ? `\n  ※確認が必要な日が${warnings.length}件あります（同期ログ参照）` : '');
  if (quiet === true || quiet === 'auto') return msg;
  showMessage_(msg);
  return msg;
}

function readAnnualSchedule_(sh, nendo) {
  const days = [];
  const warnings = [];
  if (sh.getLastRow() < 2) return { days, warnings };
  const range = sh.getRange(2, 1, sh.getLastRow() - 1, ANNUAL_HEADERS.length);
  const raw = range.getValues();
  const sheetTz = sh.getParent().getSpreadsheetTimeZone();
  range.getDisplayValues().forEach((r, i) => {
    if (!r[0] && !r[1]) return;

    const a = raw[i][0];
    const date = a instanceof Date
      ? keyToDate_(Utilities.formatDate(a, sheetTz, 'yyyy-MM-dd')) // セルに見えている日付で読む
      : makeDate_(nendo, Number(String(r[0]).trim()), Number(String(r[1]).trim()));
    const month = date ? date.getMonth() + 1 : r[0];
    const day = date ? date.getDate() : r[1];
    if (!date) { warnings.push(`年間予定 ${i + 2}行目：月「${r[0]}」日「${r[1]}」が日付として読めません`); return; }
    days.push({
      date, month, day,
      demachi: r[3], shogawa: r[4], plan: String(r[5]).trim(), time: r[6], place: r[7], note: r[8],
    });
  });
  return { days, warnings };
}

function makeDate_(nendo, month, day) {
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;
  const year = month >= 4 ? nendo : nendo + 1;
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 ? date : null; // 2/30 など
}

function keyToDate_(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateForSheet_(key, ss) {
  return Utilities.parseDate(key, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
}

function judgeActivity(plan, isHoliday) {
  const p = String(plan || '').trim();
  if (hasCross(p)) return false;
  if (isHoliday) return /[〇○◯◎△]/.test(p);
  return true;
}

function hasCross(p) {
  return /[×✕✖╳xXｘＸ]/.test(p);
}

function readHolidays_(ss) {
  const set = new Set();
  const sh = ss.getSheetByName('祝日');
  if (!sh || sh.getLastRow() < 2) return set;
  const tz = ss.getSpreadsheetTimeZone(); // 祝日シートに見えている日付で読む
  sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(([d]) => {
    if (d instanceof Date) set.add(Utilities.formatDate(d, tz, 'yyyy-MM-dd'));
  });
  return set;
}

const AUTO_SYNC_HANDLERS = ['syncActivityDaysAuto', 'syncActivityDaysNightly'];

function installHourlyTrigger() {
  installHourlyTrigger_();
  showMessage_('活動日を1時間ごとに自動同期するよう設定しました。\n年間予定を直すと、1時間以内にアプリに反映されます。急ぐときは「活動日を今すぐ同期」を使ってください。');
}

function installHourlyTrigger_() {
  ScriptApp.getProjectTriggers()
    .filter(t => AUTO_SYNC_HANDLERS.includes(t.getHandlerFunction()))
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncActivityDaysAuto').timeBased().everyHours(1).create();
}

function hasAutoSync_() {
  return ScriptApp.getProjectTriggers().some(t => AUTO_SYNC_HANDLERS.includes(t.getHandlerFunction()));
}

function syncActivityDaysAuto() {
  syncActivityDays('auto');
}

function syncActivityDaysNightly() {
  syncActivityDays('auto');
}

function japaneseHolidays(year) {
  const pad = n => String(n).padStart(2, '0');
  const key = (m, d) => `${year}-${pad(m)}-${pad(d)}`;
  const nthMonday = (m, n) => {
    const first = new Date(year, m - 1, 1).getDay(); // 0=日
    const firstMon = 1 + ((8 - first) % 7);
    return firstMon + 7 * (n - 1);
  };
  const shunbun = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  const shubun = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));

  const map = new Map();
  const add = (m, d, name) => map.set(key(m, d), name);
  add(1, 1, '元日');
  add(1, nthMonday(1, 2), '成人の日');
  add(2, 11, '建国記念の日');
  add(2, 23, '天皇誕生日');
  add(3, shunbun, '春分の日');
  add(4, 29, '昭和の日');
  add(5, 3, '憲法記念日');
  add(5, 4, 'みどりの日');
  add(5, 5, 'こどもの日');
  add(7, nthMonday(7, 3), '海の日');
  add(8, 11, '山の日');
  add(9, nthMonday(9, 3), '敬老の日');
  add(9, shubun, '秋分の日');
  add(10, nthMonday(10, 2), 'スポーツの日');
  add(11, 3, '文化の日');
  add(11, 23, '勤労感謝の日');

  const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const base = new Map(map);
  for (let d = new Date(year, 0, 2); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    const prev = new Date(d); prev.setDate(d.getDate() - 1);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    if (!base.has(dayKey(d)) && d.getDay() !== 0 && base.has(dayKey(prev)) && base.has(dayKey(next))) {
      map.set(dayKey(d), '国民の休日');
    }
  }

  Array.from(base.keys()).forEach(k => {
    const [y, m, dd] = k.split('-').map(Number);
    const d = new Date(y, m - 1, dd);
    if (d.getDay() !== 0) return;
    const s = new Date(d);
    do { s.setDate(s.getDate() + 1); } while (map.has(dayKey(s)));
    if (s.getFullYear() === year) map.set(dayKey(s), '振替休日');
  });

  return Array.from(map.entries()).map(([k, name]) => ({ key: k, name })).sort((a, b) => (a.key < b.key ? -1 : 1));
}

function fiscalYearHolidays(nendo) {
  return japaneseHolidays(nendo).filter(h => h.key >= `${nendo}-04-01`)
    .concat(japaneseHolidays(nendo + 1).filter(h => h.key <= `${nendo + 1}-03-31`));
}

const MONTHLY_VIEW = '月予定';
const HOLIDAY_SHEET = '祝日';
const MONTH_FIRST_ROW = 4; // 月予定のデータ開始行
const MONTH_ROWS = 31;     // 4〜34行目（35行目より下は「お知らせ」欄）

function scheduleBook_() {
  const id = String(getConfig()['予定表ID'] || '').trim();
  if (!id) throw new Error('活動予定表がまだ設定されていません。メニューの「初期設定」から設定してください。');
  return SpreadsheetApp.openById(id);
}

function confirm_(msg) {
  const ui = SpreadsheetApp.getUi();
  return ui.alert(msg, ui.ButtonSet.OK_CANCEL) === ui.Button.OK;
}

function eventNames_(cfg) {
  return [String(cfg['行事1の名前'] || '').trim() || '学校行事', String(cfg['行事2の名前'] || '').trim() || '（予備）'];
}

function annualHeaders_(cfg) {
  const h = ANNUAL_HEADERS.slice();
  const [e1, e2] = eventNames_(cfg);
  h[3] = e1;
  h[4] = e2;
  return h;
}

function createScheduleBook_(opts) {
  const cfg = getConfig();
  const nendo = Number(opts.nendo || cfg['年度']);
  const name = opts.name || `${opts.orgName ? opts.orgName + ' ' : ''}活動予定表（${nendo}年度）`;
  const ss = SpreadsheetApp.create(name);
  ss.setSpreadsheetTimeZone(Session.getScriptTimeZone());

  buildHolidaySheet_(ss, nendo);
  const annual = buildAnnualSheet_(ss, nendo, cfg);
  buildMonthlySheet_(ss, annual.getName(), opts.orgName || '', cfg);

  const blank = ss.getSheetByName('シート1') || ss.getSheetByName('Sheet1');
  if (blank && ss.getSheets().length > 1) ss.deleteSheet(blank);
  ss.setActiveSheet(annual);
  ss.moveActiveSheet(1);

  if (opts.folderId) DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(opts.folderId));
  return ss;
}

function buildHolidaySheet_(ss, nendo) {
  const sh = ss.getSheetByName(HOLIDAY_SHEET) || ss.insertSheet(HOLIDAY_SHEET);
  const rows = fiscalYearHolidays(nendo).map(h => [dateForSheet_(h.key, ss), h.name]);
  sh.getRange(1, 1, 1, 2).setValues([['日付', '内容']]).setFontWeight('bold').setBackground('#e8eef7');
  if (rows.length) {
    sh.getRange(2, 1, rows.length, 2).setValues(rows);
    sh.getRange(2, 1, rows.length, 1).setNumberFormat('yyyy/mm/dd');
  }
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 110);
  sh.setColumnWidth(2, 160);
  return sh;
}

function buildAnnualSheet_(ss, nendo, cfg) {
  const sheetName = String(cfg['予定シート名'] || '年間予定');
  const sh = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  const tz = Session.getScriptTimeZone();
  const dates = [];
  for (let d = new Date(nendo, 3, 1); d <= new Date(nendo + 1, 2, 31); d.setDate(d.getDate() + 1)) {
    dates.push([dateForSheet_(Utilities.formatDate(d, tz, 'yyyy-MM-dd'), ss)]);
  }
  const n = dates.length;
  sh.getRange(1, 1, 1, ANNUAL_HEADERS.length).setValues([annualHeaders_(cfg)]);
  sh.getRange(2, 1, n, 1).setValues(dates);
  sh.getRange(2, 2, n, 2).setFormulas(dates.map((_, i) => [`=A${i + 2}`, `=A${i + 2}`]));
  sh.getRange(2, 4, n, 6).setNumberFormat('@'); // 「8:30」などを時刻にしない
  formatAnnualSheet_(sh, n);
  return sh;
}

function formatAnnualSheet_(sh, n) {
  const all = sh.getRange(1, 1, n + 1, ANNUAL_HEADERS.length);
  const body = sh.getRange(2, 1, n, ANNUAL_HEADERS.length);

  all.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID)
    .setVerticalAlignment('middle').setFontWeight('normal');
  sh.setRowHeights(1, n + 1, 34);
  sh.getRange(1, 1, 1, ANNUAL_HEADERS.length).setHorizontalAlignment('center');

  sh.getRange(2, 1, n, 1).setNumberFormat('m').setHorizontalAlignment('center');
  sh.getRange(2, 2, n, 1).setNumberFormat('d').setHorizontalAlignment('center');
  sh.getRange(2, 3, n, 1).setNumberFormat('ddd').setHorizontalAlignment('center');
  sh.getRange(2, 4, n, 2).setHorizontalAlignment('left');   // 行事1・行事2
  sh.getRange(2, 6, n, 2).setHorizontalAlignment('center'); // 活動予定・時間
  sh.getRange(2, 8, n, 2).setHorizontalAlignment('left');   // 活動場所・備考

  [36, 33, 33, 140, 140, 80, 110, 150, 160].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.setFrozenRows(1);
  sh.setFrozenColumns(3);

  const green = '#b7e1cd';
  const rule = f => SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(f)
    .setBackground(green).setRanges([body]).build();
  sh.setConditionalFormatRules([
    rule(`=COUNTIF(INDIRECT("${HOLIDAY_SHEET}!A:A"),$A2)>0`),
    rule('=WEEKDAY($A2)=1'),
    rule('=WEEKDAY($A2)=7'),
  ]);
}

function buildMonthlySheet_(ss, annualName, orgName, cfg) {
  const sh = ss.getSheetByName(MONTHLY_VIEW) || ss.insertSheet(MONTHLY_VIEW);
  const [e1, e2] = eventNames_(cfg);
  const last = MONTH_FIRST_ROW + MONTH_ROWS - 1;

  sh.getRange('A1:G1').merge().setValue(`${orgName ? orgName + ' ' : ''}活動予定表`).setFontSize(22).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.getRange('L1:M1').merge().setFormula('=TODAY()').setNumberFormat('yyyy/mm/dd').setHorizontalAlignment('right');
  sh.getRange('N1').setValue('現在');
  sh.getRange('A2:E2').merge().setValue('休日：○午前、△午後、◎全日、×なし').setFontSize(10)
    .setHorizontalAlignment('center').setVerticalAlignment('bottom');
  const tz = Session.getScriptTimeZone();
  const firstKey = Utilities.formatDate(new Date(), tz, 'yyyy-MM-01');
  sh.getRange('F2').setValue(dateForSheet_(firstKey, ss)).setNumberFormat('m"月"').setFontSize(28).setHorizontalAlignment('center');
  sh.getRange('J2:K2').merge().setFontSize(20).setHorizontalAlignment('center');
  sh.getRange('L2:N2').merge().setValue('月の予定').setVerticalAlignment('bottom');

  sh.getRange('A3:H3').setValues([['日', '曜', e1, e2, '活動予定', '時間', '活動場所', '備  考']]);
  sh.getRange('J3:N3').setValues([['日', '曜', e1, e2, '活動']]);
  [sh.getRange('A3:H3'), sh.getRange('J3:N3')].forEach(r => r.setFontWeight('bold').setHorizontalAlignment('center'));

  sh.getRange('A4').setFormula('=F2');
  sh.getRange('B4').setFormula('=A4');
  sh.getRange('J4').setFormula('=J2');
  sh.getRange('K4').setFormula('=J4');
  sh.getRange(MONTH_FIRST_ROW, 2, MONTH_ROWS - 1 + 1, 1).setFormulas(
    Array.from({ length: MONTH_ROWS }, (_, i) => [`=A${MONTH_FIRST_ROW + i}`]));
  sh.getRange(MONTH_FIRST_ROW, 11, MONTH_ROWS, 1).setFormulas(
    Array.from({ length: MONTH_ROWS }, (_, i) => [`=J${MONTH_FIRST_ROW + i}`]));
  [1, 10].forEach(c => sh.getRange(MONTH_FIRST_ROW, c, MONTH_ROWS, 1).setNumberFormat('d').setHorizontalAlignment('center'));
  [2, 11].forEach(c => sh.getRange(MONTH_FIRST_ROW, c, MONTH_ROWS, 1).setNumberFormat('ddd').setHorizontalAlignment('center'));
  sh.getRange(MONTH_FIRST_ROW, 5, MONTH_ROWS, 2).setHorizontalAlignment('center');
  sh.getRange(MONTH_FIRST_ROW, 14, MONTH_ROWS, 1).setHorizontalAlignment('center');

  [sh.getRange(3, 1, MONTH_ROWS + 1, 8), sh.getRange(3, 10, MONTH_ROWS + 1, 5)].forEach(r =>
    r.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID).setVerticalAlignment('middle'));
  sh.setRowHeights(MONTH_FIRST_ROW, MONTH_ROWS, 30);
  [40, 36, 140, 140, 80, 110, 130, 160, 16, 40, 36, 120, 120, 60].forEach((w, i) => sh.setColumnWidth(i + 1, w));

  sh.getRange(last + 2, 1, 4, 14).merge().setValue('<お知らせ>').setVerticalAlignment('top').setWrap(true);

  setMonthlyFormulas_(sh, annualName);
  applyMonthlyViewFormat_(sh);
  return sh;
}

function setMonthlyFormulas_(sh, annualName) {
  const rows = MONTH_ROWS;
  const last = MONTH_FIRST_ROW + rows - 1;

  [sh.getRange(MONTH_FIRST_ROW, 3, rows, 6), sh.getRange(MONTH_FIRST_ROW, 12, rows, 3)].forEach(r => {
    r.breakApart().clearContent();
  });

  const dateFormulas = (col, firstCell) => Array.from({ length: rows - 1 }, (_, i) => {
    const prev = `${col}${MONTH_FIRST_ROW + i}`;
    return [`=IF(${prev}="","",IF(MONTH(${prev}+1)=MONTH(${firstCell}),${prev}+1,""))`];
  });
  sh.getRange(MONTH_FIRST_ROW + 1, 1, rows - 1, 1).setFormulas(dateFormulas('A', '$F$2'));
  sh.getRange(MONTH_FIRST_ROW + 1, 10, rows - 1, 1).setFormulas(dateFormulas('J', '$J$2'));

  const q = `'${annualName.replace(/'/g, "''")}'`;

  const lookup = (dateCol, firstCell, cols) => {
    const d = `$${dateCol}$4:$${dateCol}$${last}`;
    return `=ARRAYFORMULA(IF(IFERROR(MONTH(${d})<>MONTH(${firstCell}), TRUE), "", `
      + `IFERROR(VLOOKUP(${d}, ${q}!$A$2:$I, {${cols}}, FALSE)&"", "")))`;
  };
  sh.getRange('C4').setFormula(lookup('A', '$F$2', '4,5,6,7,8,9')); // 行事1・行事2・活動予定・時間・活動場所・備考
  sh.getRange('L4').setFormula(lookup('J', '$J$2', '4,5,6'));       // 行事1・行事2・活動
  sh.getRange('J2').setFormula('=EDATE($F$2,1)').setNumberFormat('m'); // 翌月は F2 から自動で
}

function createMonthlyView() {
  const cfg = getConfig();
  const sheetName = String(cfg['予定シート名'] || '年間予定');
  const src = scheduleBook_();

  let sh = src.getSheetByName(MONTHLY_VIEW);
  if (!sh) {
    const template = src.getSheets().find(s => /^\d{1,2}月$/.test(s.getName().trim()));
    if (!template) {
      buildMonthlySheet_(src, sheetName, String(getAppSettings_().orgName || ''), cfg);
      showMessage_(`「${MONTHLY_VIEW}」シートを作りました。\nF2（月の欄）に月初めの日（例：2026/11/1）を入れると、その月と翌月の中身に切り替わります。`);
      return;
    }
    sh = template.copyTo(src).setName(MONTHLY_VIEW);
  }
  if (!(sh.getRange('F2').getValue() instanceof Date) || !String(sh.getRange('A4').getFormula()).startsWith('=')) {
    showMessage_('「月予定」の形が想定と違います（F2に月初めの日、A4に「=F2」の数式がある形を想定しています）。');
    return;
  }
  if (!confirm_(`「${MONTHLY_VIEW}」の行事〜備考（C〜H列）と、翌月の行事〜活動（L〜N列）を、`
    + `「${sheetName}」から自動で表示する数式に置き換えます。いま入っている値は消えます。\n`
    + 'あわせて、日付の列（A列・J列）を月末で止まる数式にします。よろしいですか？')) return;

  setMonthlyFormulas_(sh, sheetName);
  applyMonthlyViewFormat_(sh); // 色は固定をやめて日付に合わせる

  showMessage_(`「${MONTHLY_VIEW}」を設定しました。\n`
    + 'F2（月の欄）に月初めの日（例：2026/11/1）を入れると、その月と翌月の中身に切り替わります。');
}

function fixMonthlyViewFormat() {
  const view = scheduleBook_().getSheetByName(MONTHLY_VIEW);
  if (!view) { showMessage_(`「${MONTHLY_VIEW}」シートがありません。先に「月予定シートを作成」を実行してください。`); return; }
  applyMonthlyViewFormat_(view);
  showMessage_(`「${MONTHLY_VIEW}」の色と文字を整えました。\n土日・祝日（祝日シート）の行が、日付に合わせて自動で青くなります。`);
}

function applyMonthlyViewFormat_(sh) {
  const first = MONTH_FIRST_ROW;
  const rows = MONTH_ROWS;
  const blue = '#c9daf8';
  const left = sh.getRange(first, 1, rows, 8);   // A〜H
  const right = sh.getRange(first, 10, rows, 5); // J〜N
  [left, right].forEach(r => r.setBackground(null));

  [sh.getRange(first, 3, rows, 2), sh.getRange(first, 8, rows, 1), sh.getRange(first, 12, rows, 2)].forEach(r => {
    r.setFontSize(9).setWrap(true);
  });

  const rule = (range, col) => SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=AND($${col}${first}<>"",OR(WEEKDAY($${col}${first})=1,WEEKDAY($${col}${first})=7,COUNTIF(INDIRECT("${HOLIDAY_SHEET}!A:A"),$${col}${first})>0))`)
    .setBackground(blue).setRanges([range]).build();

  const ours = [left.getA1Notation(), right.getA1Notation()];
  const others = sh.getConditionalFormatRules().filter(r => !r.getRanges().some(g => ours.includes(g.getA1Notation())));
  sh.setConditionalFormatRules(others.concat([rule(left, 'A'), rule(right, 'J')]));
}

function archiveMonthlyView() {
  const src = scheduleBook_();
  const view = src.getSheetByName(MONTHLY_VIEW);
  if (!view) { showMessage_(`「${MONTHLY_VIEW}」シートがありません。先に「月予定シートを作成」を実行してください。`); return; }
  const first = view.getRange('F2').getValue();
  if (!(first instanceof Date)) { showMessage_('月予定の F2 に、月初めの日（例：2026/11/1）を入れてください。'); return; }

  const base = `${Utilities.formatDate(first, src.getSpreadsheetTimeZone(), 'M')}月`;
  let name = base;
  for (let n = 2; src.getSheetByName(name); n++) name = `${base}_${n}`;

  const copy = view.copyTo(src).setName(name);
  const range = copy.getDataRange();
  range.copyTo(range, SpreadsheetApp.CopyPasteType.PASTE_VALUES, false);

  src.setActiveSheet(copy);
  src.moveActiveSheet(view.getIndex() + 1);
  showMessage_(`「${name}」として保存しました（値だけなので、年間予定を直しても変わりません）。`
    + (name !== base ? `\n同じ名前の「${base}」がすでにあったため、「${name}」にしました。` : ''));
}

function setConfigValue_(key, value) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET.CONFIG);
  const last = sh.getLastRow();
  const keys = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0]).trim()) : [];
  const i = keys.indexOf(key);
  if (i >= 0) sh.getRange(i + 2, 2).setValue(value);
  else sh.getRange(last + 1, 1, 1, 2).setValues([[key, value]]);
}

function driveIdFrom_(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  const m = t.match(/\/(?:folders|d)\/([\w-]{20,})/) || t.match(/[?&]id=([\w-]{20,})/) || t.match(/^([\w-]{20,})$/);
  return m ? m[1] : '';
}

function openSetupWizard_() {
  const html = HtmlService.createHtmlOutput(SETUP_HTML).setWidth(560).setHeight(640);
  SpreadsheetApp.getUi().showModalDialog(html, '初期設定');
}

function setupWizardInfo() {
  const cfg = getConfig();
  const app = getAppSettings_();
  const [e1, e2] = eventNames_(cfg);
  const id = String(cfg['予定表ID'] || '').trim();
  let scheduleName = '';
  if (id) {
    try { scheduleName = SpreadsheetApp.openById(id).getName(); } catch (e) { scheduleName = '（開けません）'; }
  }
  return {
    appName: app.appName === APP_DEFAULT_NAME ? '' : app.appName,
    orgName: app.orgName,
    nendo: Number(cfg['年度']) || '',
    event1: cfg['行事1の名前'] ? e1 : '',
    event2: cfg['行事2の名前'] ? e2 : '',
    admin: String(cfg['管理者メール'] || '') || Session.getEffectiveUser().getEmail(),
    scheduleId: id,
    scheduleName,
  };
}

function setupWizardSave(p) {
  const clean = v => String(v == null ? '' : v).replace(/[\s　]+/g, ' ').trim();
  const nendo = Number(p.nendo);
  if (!Number.isInteger(nendo) || nendo < 2000 || nendo > 2100) throw new Error('年度は西暦の4けたで入れてください（例：2026）。');

  const props = PropertiesService.getScriptProperties();
  const appName = clean(p.appName).slice(0, 30);
  const orgName = clean(p.orgName).slice(0, 40);
  if (appName && appName !== APP_DEFAULT_NAME) props.setProperty('APP_NAME', appName); else props.deleteProperty('APP_NAME');
  if (orgName) props.setProperty('ORG_NAME', orgName); else props.deleteProperty('ORG_NAME');

  setConfigValue_('年度', nendo);
  setConfigValue_('行事1の名前', clean(p.event1).slice(0, 20));
  setConfigValue_('行事2の名前', clean(p.event2).slice(0, 20));
  setConfigValue_('管理者メール', clean(p.admin).replace(/\s*,\s*/g, ','));

  const msgs = [];
  let scheduleUrl = '';
  if (p.scheduleMode === 'new') {
    const folderId = driveIdFrom_(p.folder);
    if (p.folder && !folderId) throw new Error('フォルダのURLが読み取れません。フォルダを開いたときのアドレスを貼ってください（空欄ならマイドライブに作ります）。');
    const ss = createScheduleBook_({ nendo, orgName, folderId });
    setConfigValue_('予定表ID', ss.getId());
    scheduleUrl = ss.getUrl();
    msgs.push(`活動予定表「${ss.getName()}」を作りました${folderId ? '' : '（マイドライブ。部員と見るフォルダへ移してください）'}。`);
  } else if (p.scheduleMode === 'existing') {
    const id = driveIdFrom_(p.schedule);
    if (!id) throw new Error('活動予定表のURLが読み取れません。スプレッドシートを開いたときのアドレスを貼ってください。');
    let ss;
    try { ss = SpreadsheetApp.openById(id); } catch (e) { throw new Error('活動予定表が開けません。URLと、このアカウントで開けるかを確かめてください。'); }
    const cfg = getConfig();
    const annualName = String(cfg['予定シート名'] || '年間予定');
    const added = [];
    if (!ss.getSheetByName(HOLIDAY_SHEET)) { buildHolidaySheet_(ss, nendo); added.push(HOLIDAY_SHEET); }
    if (!ss.getSheetByName(annualName)) { buildAnnualSheet_(ss, nendo, cfg); added.push(annualName); }
    if (!ss.getSheetByName(MONTHLY_VIEW)) { buildMonthlySheet_(ss, annualName, orgName, cfg); added.push(MONTHLY_VIEW); }
    setConfigValue_('予定表ID', id);
    scheduleUrl = ss.getUrl();
    msgs.push(`活動予定表「${ss.getName()}」をつなぎました${added.length ? `（${added.join('・')} シートを足しました）` : ''}。`);
  } else {
    const id = String(getConfig()['予定表ID'] || '').trim();
    if (id) scheduleUrl = `https://docs.google.com/spreadsheets/d/${id}/edit`;
  }

  if (String(getConfig()['予定表ID'] || '').trim()) {
    try { msgs.push(syncActivityDays(true)); } catch (e) { msgs.push('最初の同期でエラー：' + e.message); }
    try { installHourlyTrigger_(); msgs.push('活動日を1時間ごとに自動で同期します。'); } catch (e) { msgs.push('自動同期の設定でエラー：' + e.message); }
  } else {
    msgs.push('活動予定表がまだないので、同期はしていません。');
  }
  CacheService.getScriptCache().remove(SAFETY_CACHE_KEY_()); // 安全の確認をやり直す
  return { messages: msgs, scheduleUrl };
}

const SETUP_HTML = `<!DOCTYPE html><html><head><base target="_blank"><style>
body{font-family:"Noto Sans JP","Yu Gothic UI",sans-serif;font-size:14px;color:#1f2430;margin:0;padding:4px 6px}
h3{font-size:14px;margin:14px 0 4px;color:#2f6fdb}
[hidden]{display:none!important}
label{display:block;margin:6px 0;font-size:13px;color:#555}
input[type=text],input[type=number]{width:100%;box-sizing:border-box;border:1px solid #ccd;border-radius:6px;padding:6px 8px;font:inherit;color:#1f2430}
.row{display:flex;gap:8px}.row>label{flex:1}
.hint{font-size:12px;color:#6b7280;margin:2px 0}
.mode label{display:flex;gap:6px;align-items:flex-start;color:#1f2430}
.sub{margin-left:24px}
.err{color:#c0392b;min-height:1em}
.ok{background:#e8f5ee;border:1px solid #b6dcc6;border-radius:8px;padding:10px;margin-top:8px}
.place{background:#fff7e0;border:1px solid #ecd9a0;border-radius:8px;padding:8px 10px;margin:4px 0 6px;font-size:13px}.place ul{margin:4px 0 0;padding-left:18px}.place li{margin:2px 0}
button{font:inherit;border:0;background:#2f6fdb;color:#fff;border-radius:8px;padding:8px 18px;cursor:pointer}
button:disabled{opacity:.5}
</style></head><body>
<div id="form">
<div class="place"><b>ファイルの置き場所</b><ul>
<li><b>このファイル（DB）</b>：先生のマイドライブか、<b>先生だけがメンバーの共有ドライブ</b>に置きます。名簿・記録・出欠が入るので、<b>生徒と共有しないでください</b>（生徒がメンバーの共有ドライブにも置かない）。</li>
<li><b>活動予定表</b>：部員も見るので、部員と使うフォルダ（部の共有ドライブなど）に置きます（下の4で選びます）。</li>
</ul></div>
<h3>1. 名前</h3>
<div class="row"><label>アプリ名<input type="text" id="appName" maxlength="30" placeholder="ハコ日誌"></label>
<label>団体名（部活動名など）<input type="text" id="orgName" maxlength="40" placeholder="例：科学部"></label></div>
<h3>2. 年度と行事の列</h3>
<div class="row"><label>年度（4月はじまり）<input type="number" id="nendo" min="2000" max="2100"></label>
<label>行事の列1の名前<input type="text" id="event1" maxlength="20" placeholder="学校行事"></label>
<label>行事の列2の名前<input type="text" id="event2" maxlength="20" placeholder="（予備）"></label></div>
<p class="hint">活動予定表に「行事」の列が2つあります。2校で使うときは学校名、1校なら「学校行事」と「（予備）」のままで構いません。</p>
<h3>3. 管理者（先生）のメール</h3>
<label><input type="text" id="admin" placeholder="例：sensei@example.ed.jp"></label>
<p class="hint">全員分を編集できる先生です。複数ならカンマ（,）で区切ります。部員シートで区分を「教員」にした人も先生になります。</p>
<h3>4. 活動予定表（年間予定・祝日・月予定）</h3>
<div class="mode">
<label id="keepRow"><input type="radio" name="mode" value="keep"><span>今のまま使う：<b id="schName"></b></span></label>
<label><input type="radio" name="mode" value="new"><span>新しく作る</span></label>
<div class="sub"><input type="text" id="folder" placeholder="置くフォルダのURL（空欄ならマイドライブ）"><p class="hint">部員が見られるフォルダ（部の共有ドライブなど）がおすすめです。予定には個人情報を書かないでください。</p></div>
<label><input type="radio" name="mode" value="existing"><span>今ある活動予定表を使う</span></label>
<div class="sub"><input type="text" id="schedule" placeholder="活動予定表のURL"><p class="hint">「年間予定」「祝日」「月予定」のシートがなければ足します。</p></div>
</div>
<p class="err" id="err"></p>
<button id="save">保存して準備する</button>
</div>
<div id="done" hidden></div>
<script>
const $=id=>document.getElementById(id);
google.script.run.withSuccessHandler(i=>{
 $('appName').value=i.appName;$('orgName').value=i.orgName;$('nendo').value=i.nendo;
 $('event1').value=i.event1;$('event2').value=i.event2;$('admin').value=i.admin;
 if(i.scheduleId){$('schName').textContent=i.scheduleName;document.querySelector('[value=keep]').checked=true;}
 else{$('keepRow').hidden=true;document.querySelector('[value=new]').checked=true;}
}).setupWizardInfo();
$('save').onclick=()=>{
 const mode=(document.querySelector('[name=mode]:checked')||{}).value;
 if(mode==='existing'&&!$('schedule').value.trim()){$('err').textContent='活動予定表のURLを入れてください';return;}
 $('err').textContent='';$('save').disabled=true;$('save').textContent='準備しています…（1分ほどかかることがあります）';
 google.script.run.withSuccessHandler(r=>{
  $('form').hidden=true;const d=$('done');d.hidden=false;
  d.innerHTML='<div class="ok"><b>準備ができました</b><ul></ul></div><h3>このあとすること</h3><ol>'
   +'<li>置き場所を確かめる：このファイル（DB）は先生だけの場所（生徒と共有しない）、活動予定表は部員も見られるフォルダ</li>'
   +'<li>「部員」シートに名簿を入れる（部員ID・区分・学年・組・氏名・メール・在籍はチェックボックス）</li>'
   +'<li>拡張機能 → Apps Script → デプロイ → 新しいデプロイ → ウェブアプリ（自分として実行・学校の全員）</li>'
   +'<li>アプリを開き、「テーマ」タブの「⚙ テーマを管理」でテーマ（班）を作る</li></ol>';
  const ul=d.querySelector('ul');r.messages.forEach(m=>{const li=document.createElement('li');li.textContent=m;ul.appendChild(li);});
  if(r.scheduleUrl){const a=document.createElement('a');a.href=r.scheduleUrl;a.textContent='活動予定表を開く';d.appendChild(a);}
 }).withFailureHandler(e=>{$('save').disabled=false;$('save').textContent='保存して準備する';$('err').textContent=e.message||e;})
 .setupWizardSave({appName:$('appName').value,orgName:$('orgName').value,nendo:$('nendo').value,event1:$('event1').value,
  event2:$('event2').value,admin:$('admin').value,scheduleMode:mode,folder:$('folder').value,schedule:$('schedule').value});
};
</script></body></html>`;

const GUIDE_SHEET = 'はじめに';
const GUIDE_URL = 'https://yoshifumi-tsubomoto.github.io/hakochat/hakonisshi/';

function ensureGuideSheet_(ss) {
  if (ss.getSheetByName(GUIDE_SHEET)) return;
  const sh = ss.insertSheet(GUIDE_SHEET, 0);
  const rows = [
    ['', APP_DEFAULT_NAME + ' はじめに'],
    ['', ''],
    ['', '■ ファイルの置き場所（いちばん大切です）'],
    ['', 'このファイル（DB）：先生のマイドライブか、先生だけがメンバーの共有ドライブに置く。名簿・記録・出欠が入るので、生徒と共有しない。生徒がメンバーの共有ドライブにも置かない（生徒が記録やプログラムを書き換えられてしまうため）。'],
    ['', '活動予定表：部員も見るので、部員と使うフォルダ（部の共有ドライブなど）に置くか、部員に「閲覧者」で共有する。予定には個人情報を書かない。'],
    ['', '置き場所に問題があると、アプリの先生の画面に「⚠ 確認してください」と出ます（直すと消えます）。'],
    ['', ''],
    ['', '■ 導入の手順（済んだらチェック）'],
    [false, 'メニュー「' + APP_DEFAULT_NAME + ' → 初期設定」で、名前・年度・管理者・活動予定表を設定する'],
    [false, '上の「ファイルの置き場所」のとおりに、このファイルと活動予定表を置く'],
    [false, '「部員」シートに名簿を入れる（部員ID・区分（生徒／教員）・学年・組・氏名・メール（学校のアカウント）・在籍（チェックボックス））'],
    [false, '拡張機能 → Apps Script → デプロイ → 新しいデプロイ → ウェブアプリ（次のユーザーとして実行：自分、アクセスできるユーザー：学校のドメイン内の全員）'],
    [false, 'アプリを開き、「テーマ」タブの「⚙ テーマを管理」でテーマ（班）を作る'],
    [false, 'アプリの URL を部員に配る。部員は最初に「所属テーマ」で自分の班を選ぶ'],
    ['', ''],
    ['', '■ ふだんのこと'],
    ['', '活動日は活動予定表の「年間予定」から1時間ごとに読み込みます。急ぐときはメニュー「' + APP_DEFAULT_NAME + ' → 活動日を今すぐ同期」。'],
    ['', '部員やテーマを直すときは、アプリの「テーマ」タブか、このファイルの「部員」「テーマ」「所属」シート。ほかのシートは手で直さない。'],
    ['', '手引き・新しい版：' + GUIDE_URL],
  ];
  sh.getRange(1, 1, rows.length, 2).setValues(rows);
  rows.forEach((r, i) => { if (r[0] === false) sh.getRange(i + 1, 1).insertCheckboxes(); });
  sh.setColumnWidth(1, 32).setColumnWidth(2, 900);
  sh.getRange(1, 2, rows.length, 1).setWrap(true).setVerticalAlignment('top');
  sh.getRange(1, 2).setFontSize(14).setFontWeight('bold');
  rows.forEach((r, i) => { if (/^■/.test(r[1])) sh.getRange(i + 1, 2).setFontWeight('bold').setBackground('#e8eef7'); });
  sh.getRange(4, 2).setBackground('#fff4e0');
  sh.setHiddenGridlines(true);
}

const SAFETY_TTL_SEC = 6 * 60 * 60;

function SAFETY_CACHE_KEY_() {
  return 'safety:' + SpreadsheetApp.getActive().getId();
}

function recheckSafety() {
  if (!me_().isTeacher) throw new Error('先生だけが使えます。');
  CacheService.getScriptCache().remove(SAFETY_CACHE_KEY_());
  return safetyWarnings_();
}

function safetyWarnings_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(SAFETY_CACHE_KEY_());
  if (hit) return JSON.parse(hit);
  const list = checkSafety_();
  cache.put(SAFETY_CACHE_KEY_(), JSON.stringify(list), SAFETY_TTL_SEC);
  return list;
}

function checkSafety_() {
  const out = [];
  const cfg = getConfig();
  const members = readTable_(SHEET.MEMBERS).filter(m => m['部員ID']);
  const lower = s => String(s || '').trim().toLowerCase();
  const students = new Set(members.filter(m => m['区分'] !== '教員').map(m => lower(m['メール'])).filter(Boolean));
  const teachers = new Set(members.filter(m => m['区分'] === '教員').map(m => lower(m['メール'])).filter(Boolean));
  String(cfg['管理者メール'] || '').split(/[,\s]+/).map(lower).filter(Boolean).forEach(e => teachers.add(e));
  teachers.add(lower(Session.getEffectiveUser().getEmail()));

  try {
    const file = DriveApp.getFileById(SpreadsheetApp.getActive().getId());
    const access = file.getSharingAccess();
    if (access !== DriveApp.Access.PRIVATE) {
      const what = access === DriveApp.Access.DOMAIN || access === DriveApp.Access.DOMAIN_WITH_LINK ? '学校（組織）の全員' : 'リンクを知っている人';
      out.push(`ハコ日誌DB（このアプリのデータ）が「${what}」に公開されています。共有の設定を「制限付き」にしてください。`);
    }
    const shared = file.getEditors().concat(file.getViewers()).map(u => lower(u.getEmail())).filter(Boolean);
    const owner = file.getOwner();
    if (owner) teachers.add(lower(owner.getEmail()));
    const stu = shared.filter(e => students.has(e));
    const others = shared.filter(e => !students.has(e) && !teachers.has(e));
    if (stu.length) {
      out.push(`ハコ日誌DB（このアプリのデータ）を生徒 ${stu.length}人と共有しています。生徒が記録を直接見たり書き換えたりできます。先生だけの場所（マイドライブか、先生だけの共有ドライブ）に置いてください。`);
    }
    if (others.length) {
      out.push(`ハコ日誌DB を先生以外の ${others.length}人と共有しています（${others.slice(0, 3).join('、')}${others.length > 3 ? ' ほか' : ''}）。先生だけにしてください（先生なら、部員シートで区分を「教員」にするか、設定の管理者メールに入れると、この表示は消えます）。`);
    }
  } catch (e) {

  }

  const id = String(cfg['予定表ID'] || '').trim();
  if (!id) {
    out.push('活動予定表がまだ設定されていません。ハコ日誌DB のメニュー「ハコ日誌 → 初期設定」から設定してください。');
  } else {
    try {
      const ss = SpreadsheetApp.openById(id);
      const name = String(cfg['予定シート名'] || '年間予定');
      if (!ss.getSheetByName(name)) out.push(`活動予定表に「${name}」シートがありません。初期設定で「今ある活動予定表を使う」を選び直すと足せます。`);
    } catch (e) {
      out.push('活動予定表が開けません（消された、作り直されてIDが変わった、などが考えられます）。ハコ日誌DB のメニュー「ハコ日誌 → 初期設定」で選び直してください。');
    }
    try {

      const f = DriveApp.getFileById(id);
      const owner = f.getOwner();
      if (owner && f.getSharingAccess() === DriveApp.Access.PRIVATE &&
          !f.getEditors().concat(f.getViewers()).some(u => lower(u.getEmail()) !== lower(owner.getEmail()))) {
        out.push('活動予定表を部員が開けません（先生だけのファイルになっています）。部員と使うフォルダ（部の共有ドライブなど）へ移すか、部員に「閲覧者」で共有してください。');
      }
    } catch (e) { /* 確かめられないときは出さない */ }
    try {
      if (!hasAutoSync_()) out.push('活動日の自動同期が設定されていません。ハコ日誌DB のメニュー「ハコ日誌 → 自動同期を1時間ごとにする」を実行してください。');
    } catch (e) { /* 確かめられないときは出さない */ }
  }
  return out;
}

const TZ = 'Asia/Tokyo';
const LOG_FIELDS = { themeId: 3, plan: 4, done: 5, next: 6, attend: 7, items: 8 }; // 日誌シートの列番号
const ATTEND_OPTIONS = ['出席', '欠席', '遅刻', '早退'];

function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate()
    .setTitle(getAppSettings_().appName)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function dkey_(d) {
  return Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
}

function parseKey_(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error('日付の形式が正しくありません');
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function readTable_(name) {
  const values = SpreadsheetApp.getActive().getSheetByName(name).getDataRange().getValues();
  const headers = values[0];
  return values.slice(1).map(r => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });
}

function readLog_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET.LOG);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS[SHEET.LOG].length).getValues()
    .map((r, i) => ({
      row: i + 2,
      date: r[0] instanceof Date ? dkey_(r[0]) : '',
      memberId: String(r[1]),
      themeId: String(r[2]),
      plan: String(r[3]),
      done: String(r[4]),
      next: String(r[5]),
      attend: String(r[6]),
      items: String(r[7]),
      updatedBy: String(r[8]),
      updatedAt: r[9] instanceof Date ? Utilities.formatDate(r[9], TZ, 'M/d HH:mm') : '',
    }))
    .filter(r => r.date && r.memberId);
}

function isEnrolled_(v) {
  if (v === true) return true;
  return /^(✓|✔|☑|〇|○|◯|true|1|在籍|はい)$/i.test(String(v == null ? '' : v).trim());
}

function currentUser_(members, cfg) {

  const email = (Session.getActiveUser().getEmail() || '').toLowerCase();
  const admins = String(cfg['管理者メール'] || '').toLowerCase().split(/[,\s]+/).filter(Boolean);
  const m = email ? members.find(x => String(x['メール']).trim().toLowerCase() === email) : null;
  return {
    email,
    memberId: m && m['区分'] !== '教員' ? String(m['部員ID']) : '',
    name: m ? normalizeName(m['氏名']) : '',
    isTeacher: !!email && (admins.includes(email) || (m && m['区分'] === '教員')),
  };
}

function getBootstrap() {
  ensureTimeZone_();
  const cfg = getConfig();
  const allMembers = readTable_(SHEET.MEMBERS).filter(m => m['部員ID'] && m['氏名']);
  const students = allMembers.filter(m => m['区分'] !== '教員' && isEnrolled_(m['在籍']));

  const themes = listThemes_();

  const memberThemes = readBelongMap_(students, themes);

  const logDates = new Set(readLog_().map(r => r.date));
  const days = readTable_(SHEET.DAYS)
    .filter(d => d['日付'] instanceof Date && (d['活動'] === true || logDates.has(dkey_(d['日付']))))
    .map(d => {
      const v = Object.values(d); // 行事の列は見出しの名前（学校名など）によらず、位置（G列＝行事1）で読む
      return {
        date: dkey_(d['日付']),
        wd: String(d['曜']),
        holiday: d['休日'] === true,
        active: d['活動'] === true,
        plan: String(d['活動予定']),
        time: String(d['時間']),
        place: String(d['活動場所']),
        event: String(v[6] || ''),
        note: String(d['備考'] || ''),
      };
    })
    .sort((a, b) => a.date < b.date ? -1 : 1);

  const names = {};
  allMembers.filter(m => m['区分'] !== '教員').forEach(m => { names[String(m['部員ID'])] = normalizeName(m['氏名']); });

  const me = currentUser_(allMembers, cfg);
  let warnings = [];
  if (me.isTeacher) {
    try { warnings = safetyWarnings_(); } catch (e) { warnings = []; }
  }
  return {
    me,
    warnings, // 先生だけ：安全の確認の結果
    links: {
      schedule: scheduleLink_(cfg),                                // 年間予定：全員に出す
      db: me.isTeacher ? SpreadsheetApp.getActive().getUrl() : '', // ハコ日誌DB：先生だけ（生徒には送らない）
    },
    members: students.map(m => ({ id: String(m['部員ID']), name: normalizeName(m['氏名']),
                                  grade: String(m['学年']) })),
    names,
    milestones: getMilestones(),
    appSettings: getAppSettings_(),
    appUrl: ScriptApp.getService().getUrl() || '', // 「この日のリンク」用（CHATなどに貼る）
    themes,
    memberThemes,
    days,
    today: dkey_(new Date()),
    attendOptions: ATTEND_OPTIONS,
  };
}

function scheduleLink_(cfg) {
  const id = String(cfg['予定表ID'] || '').trim();
  if (!id) return '';
  const cache = CacheService.getScriptCache();
  const key = 'scheduleLink:' + id + ':' + dkey_(new Date());
  const hit = cache.get(key);
  if (hit) return hit;

  let link = `https://docs.google.com/spreadsheets/d/${id}/edit`;
  try {
    const ss = SpreadsheetApp.openById(id);
    const sh = ss.getSheetByName(String(cfg['予定シート名'] || '年間予定'));
    if (sh) {
      link += `#gid=${sh.getSheetId()}`; // 年間予定のシートを直接開く
      const row = todayRowOfAnnual_(sh, ss.getSpreadsheetTimeZone());
      if (row) link += `&range=D${row}`; // 今日の行（行事1の欄）を選んだ状態で開く
    }
    cache.put(key, link, 3 * 60 * 60);
  } catch (e) {

  }
  return link;
}

function todayRowOfAnnual_(sh, tz) {
  if (sh.getLastRow() < 2) return 0;
  const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const dates = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < dates.length; i++) {
    const d = dates[i][0];
    if (d instanceof Date && Utilities.formatDate(d, tz, 'yyyy-MM-dd') >= today) return i + 2;
  }
  return 0;
}

function getDay(dateKey) {
  parseKey_(dateKey);
  const rows = readLog_();
  const prevNext = {};
  rows.forEach(r => {
    if (r.date >= dateKey || !r.next.trim()) return;
    const cur = prevNext[r.memberId];
    if (!cur || cur.date < r.date) prevNext[r.memberId] = { date: r.date, text: r.next };
  });
  const plan = readDayPlans_().get(dateKey);
  const cm = commentsFor_(c => c.date === dateKey, me_());
  return {
    date: dateKey,
    entries: rows.filter(r => r.date === dateKey).map(stripRow_),
    prevNext,
    dayPlan: plan ? plan.text : '',
    comments: cm.comments,
    notifs: cm.notifs,
  };
}

function readDayPlans_() {
  const map = new Map();
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET.PLAN);
  if (!sh || sh.getLastRow() < 2) return map;
  sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach((r, i) => {
    if (r[0] instanceof Date) map.set(dkey_(r[0]), { row: i + 2, text: String(r[1]) });
  });
  return map;
}

function readBelongMap_(members, themes) {
  members = members || readTable_(SHEET.MEMBERS).filter(m => m['部員ID'] && m['氏名']);
  themes = themes || readTable_(SHEET.THEMES).filter(t => t['テーマID'] && t['テーマ名'])
    .map(t => ({ id: String(t['テーマID']), name: String(t['テーマ名']) }));
  const idByName = new Map(members.map(m => [normalizeName(m['氏名']), String(m['部員ID'])]));
  const themeIdByName = new Map(themes.map(t => [t.name.trim(), t.id]));
  const map = {};
  readTable_(SHEET.BELONG).forEach(b => {
    const mid = idByName.get(normalizeName(b['氏名']));
    const tid = themeIdByName.get(String(b['テーマ名']).trim());
    if (!mid || !tid) return;
    (map[mid] = map[mid] || []).push(tid);
  });
  return map;
}

function getHistory(filter) {
  const belong = filter.themeId ? readBelongMap_() : {};
  const rows = readLog_().filter(r =>
    (!filter.memberId || r.memberId === filter.memberId) &&
    (!filter.themeId || r.themeId === filter.themeId ||
      (!r.themeId && (belong[r.memberId] || []).includes(filter.themeId))) &&
    (r.plan || r.done || r.next || r.attend));
  const keys = new Set(rows.map(r => r.date + '|' + r.memberId));
  const cm = commentsFor_(c => keys.has(c.date + '|' + c.memberId), me_());
  return {
    rows: rows.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0).map(stripRow_),
    comments: cm.comments,
    notifs: cm.notifs,
  };
}

function stripRow_(r) {
  const o = Object.assign({}, r);
  delete o.row;
  return o;
}

function saveDayPlan(p) {
  const me = currentUser_(readTable_(SHEET.MEMBERS), getConfig());
  if (!me.isTeacher && !me.memberId) throw new Error('全体の予定は部員と先生だけが編集できます。');
  const date = parseKey_(p.date);
  let text = String(p.text == null ? '' : p.text).slice(0, 5000);
  if (/^[=+\-@]/.test(text)) text = "'" + text; // 数式として解釈させない

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = ensureSheet_(SpreadsheetApp.getActive(), SHEET.PLAN, HEADERS[SHEET.PLAN]);
    const hit = readDayPlans_().get(p.date);
    const current = hit ? hit.text : '';
    if (p.base != null && current !== String(p.base)) return { conflict: true, latest: current };
    const row = hit ? hit.row : sh.getLastRow() + 1;
    const now = new Date();
    sh.getRange(row, 1).setValue(date).setNumberFormat('yyyy/mm/dd');
    sh.getRange(row, 2).setNumberFormat('@').setValue(text);
    sh.getRange(row, 3, 1, 2).setValues([[me.email, now]]);
    return { updatedAt: Utilities.formatDate(now, TZ, 'M/d HH:mm') };
  } finally {
    lock.releaseLock();
  }
}

function saveMemberThemes(p) {
  const cfg = getConfig();
  const members = readTable_(SHEET.MEMBERS);
  const me = currentUser_(members, cfg);
  if (!me.email) throw new Error('ログイン中のアカウントを確認できません。学校のアカウントで開き直してください。');
  if (!me.isTeacher && me.memberId !== p.memberId) throw new Error('自分の所属テーマだけ変更できます。');
  const m = members.find(x => String(x['部員ID']) === p.memberId && x['区分'] !== '教員');
  if (!m) throw new Error('部員が見つかりません。');

  const themeName = new Map(readTable_(SHEET.THEMES)
    .filter(t => t['テーマID'] && t['テーマ名'])
    .map(t => [String(t['テーマID']), String(t['テーマ名']).trim()]));
  const ids = Array.from(new Set(p.themeIds || []));
  ids.forEach(id => { if (!themeName.has(id)) throw new Error('テーマが見つかりません: ' + id); });
  const name = normalizeName(m['氏名']);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName(SHEET.BELONG);
    const width = HEADERS[SHEET.BELONG].length;
    const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, width).getValues() : [];
    const memo = new Map(); // この部員の既存行のメモは、同じテーマなら引き継ぐ
    const others = rows.filter(r => {
      if (!String(r[0]).trim()) return false;
      if (normalizeName(r[0]) !== name) return true;
      memo.set(String(r[1]).trim(), r[2]);
      return false;
    });
    const mine = ids.map(id => [m['氏名'], themeName.get(id), memo.get(themeName.get(id)) || '']);
    const all = others.concat(mine);
    if (rows.length) sh.getRange(2, 1, rows.length, width).clearContent();
    if (all.length) sh.getRange(2, 1, all.length, width).setValues(all);
  } finally {
    lock.releaseLock();
  }
  return ids;
}

function saveField(p) {
  const cfg = getConfig();
  const members = readTable_(SHEET.MEMBERS);
  const me = currentUser_(members, cfg);
  if (!me.email) throw new Error('ログイン中のアカウントを確認できません。学校のアカウントで開き直してください。');
  if (!me.isTeacher && me.memberId !== p.memberId) throw new Error('自分の欄だけ編集できます。');
  if (!(p.field in LOG_FIELDS)) throw new Error('保存できない項目です: ' + p.field);
  if (!members.some(m => String(m['部員ID']) === p.memberId)) throw new Error('部員が見つかりません。');
  const date = parseKey_(p.date);

  let value = String(p.value == null ? '' : p.value).slice(0, 5000);
  if (p.field === 'attend' && value && !ATTEND_OPTIONS.includes(value)) throw new Error('出欠の値が正しくありません');
  if (/^[=+\-@]/.test(value)) value = "'" + value; // 数式として解釈させない

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName(SHEET.LOG);
    const hit = readLog_().find(r => r.date === p.date && r.memberId === p.memberId);
    const now = new Date();
    let row;
    if (hit) {
      row = hit.row;
    } else {

      const defaultTheme = p.field === 'themeId' ? '' : ((readBelongMap_()[p.memberId] || [])[0] || '');
      row = sh.getLastRow() + 1;
      sh.getRange(row, 1, 1, 3).setValues([[date, p.memberId, defaultTheme]]);
      sh.getRange(row, 1).setNumberFormat('yyyy/mm/dd');
    }

    sh.getRange(row, LOG_FIELDS[p.field]).setNumberFormat('@').setValue(value);
    sh.getRange(row, 9, 1, 2).setValues([[me.email, now]]);
    sh.getRange(row, 10).setNumberFormat('yyyy/mm/dd hh:mm');
    return { updatedAt: Utilities.formatDate(now, TZ, 'M/d HH:mm'), updatedBy: me.email };
  } finally {
    lock.releaseLock();
  }
}

const COMMENT_FIELDS = ['plan', 'done', 'next'];
const NOTIF_LIMIT = 30;

function threadKey_(date, memberId, field) {
  return `${date}|${memberId}|${field}`;
}

function readComments_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET.COMMENT);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS[SHEET.COMMENT].length).getValues()
    .map((r, i) => ({
      row: i + 2,
      id: String(r[0]),
      date: r[1] instanceof Date ? dkey_(r[1]) : '',
      memberId: String(r[2]),
      field: String(r[3]),
      text: String(r[4]),
      email: String(r[5]).toLowerCase(),
      name: String(r[6]),
      created: r[7] instanceof Date ? r[7].getTime() : 0,
      edited: r[8] instanceof Date,
      deleted: r[9] === true,
    }))
    .filter(c => c.id && c.date && !c.deleted);
}

function readMyReads_(email) {
  const map = new Map();
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET.READ);
  if (!sh || sh.getLastRow() < 2 || !email) return map;
  sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues().forEach((r, i) => {
    if (String(r[0]).toLowerCase() === email && r[2] instanceof Date) {
      map.set(String(r[1]), { row: i + 2, at: r[2].getTime() });
    }
  });
  return map;
}

function commentView_(c, me) {
  const mine = !!me.email && c.email === me.email;
  return {
    id: c.id, key: threadKey_(c.date, c.memberId, c.field),
    date: c.date, memberId: c.memberId, field: c.field,
    text: c.text, name: c.name,
    at: Utilities.formatDate(new Date(c.created), TZ, 'M/d HH:mm'),
    edited: c.edited, mine, canDelete: mine || me.isTeacher,
  };
}

function notifications_(comments, me) {
  if (!me.email) return [];
  const reads = readMyReads_(me.email);
  const myThreads = new Set(comments.filter(c => c.email === me.email).map(c => threadKey_(c.date, c.memberId, c.field)));
  return comments
    .filter(c => c.email !== me.email)
    .filter(c => {
      const key = threadKey_(c.date, c.memberId, c.field);
      if (c.memberId !== me.memberId && !myThreads.has(key)) return false;
      const read = reads.get(key);
      return !read || c.created > read.at;
    })
    .sort((a, b) => b.created - a.created)
    .slice(0, NOTIF_LIMIT)
    .map(c => commentView_(c, me));
}

function commentsFor_(pred, me) {
  const all = readComments_();
  return {
    comments: all.filter(pred).sort((a, b) => a.created - b.created).map(c => commentView_(c, me)),
    notifs: notifications_(all, me),
  };
}

function me_() {
  return currentUser_(readTable_(SHEET.MEMBERS), getConfig());
}

function cleanText_(text) {
  let t = String(text == null ? '' : text).trim().slice(0, 2000);
  if (/^[=+\-@]/.test(t)) t = "'" + t; // 数式として解釈させない
  return t;
}

function addComment(p) {
  const me = me_();
  if (!me.email || (!me.memberId && !me.isTeacher)) throw new Error('コメントは部員と先生だけが書けます。');
  if (!COMMENT_FIELDS.includes(p.field)) throw new Error('コメントできない欄です。');
  const date = parseKey_(p.date);
  const text = cleanText_(p.text);
  if (!text) throw new Error('コメントが空です。');

  const ss = SpreadsheetApp.getActive();
  const sh = ensureSheet_(ss, SHEET.COMMENT, HEADERS[SHEET.COMMENT]);
  const now = new Date();
  const id = Utilities.getUuid();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const row = sh.getLastRow() + 1;
    sh.getRange(row, 5).setNumberFormat('@');
    sh.getRange(row, 1, 1, 10).setValues([[id, date, p.memberId, p.field, text, me.email, me.name || me.email, now, '', false]]);
    sh.getRange(row, 2).setNumberFormat('yyyy/mm/dd');
    sh.getRange(row, 8, 1, 2).setNumberFormat('yyyy/mm/dd hh:mm');
  } finally {
    lock.releaseLock();
  }
  markRead({ date: p.date, memberId: p.memberId, field: p.field }); // 自分で書いたスレッドは既読
  return commentView_({ id, date: p.date, memberId: p.memberId, field: p.field, text: String(p.text).trim(),
                        email: me.email, name: me.name || me.email, created: now.getTime(), edited: false }, me);
}

function editComment(p) {
  const me = me_();
  const c = readComments_().find(x => x.id === p.id);
  if (!c) throw new Error('コメントが見つかりません（削除された可能性があります）。');
  if (c.email !== me.email) throw new Error('自分のコメントだけ直せます。');
  const text = cleanText_(p.text);
  if (!text) throw new Error('コメントが空です。消す場合は「削除」を押してください。');
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET.COMMENT);
  sh.getRange(c.row, 5).setNumberFormat('@').setValue(text);
  sh.getRange(c.row, 9).setValue(new Date());
  return commentView_(Object.assign({}, c, { text: String(p.text).trim(), edited: true }), me);
}

function deleteComment(p) {
  const me = me_();
  const c = readComments_().find(x => x.id === p.id);
  if (!c) return true;
  if (c.email !== me.email && !me.isTeacher) throw new Error('自分のコメントだけ消せます。');
  SpreadsheetApp.getActive().getSheetByName(SHEET.COMMENT).getRange(c.row, 10).setValue(true);
  return true;
}

function markReadMany(keys) {
  const me = me_();
  if (!me.email || !Array.isArray(keys) || !keys.length) return false;
  const sh = ensureSheet_(SpreadsheetApp.getActive(), SHEET.READ, HEADERS[SHEET.READ]);
  const now = new Date();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const reads = readMyReads_(me.email);
    const add = [];
    keys.slice(0, 200).forEach(k => {
      const key = String(k);
      if (!/^\d{4}-\d{2}-\d{2}\|[^|]+\|(plan|done|next)$/.test(key)) return;
      const hit = reads.get(key);
      if (hit) sh.getRange(hit.row, 3).setValue(now);
      else add.push([me.email, key, now]);
    });
    if (add.length) {
      const row = sh.getLastRow() + 1;
      sh.getRange(row, 2, add.length, 1).setNumberFormat('@');
      sh.getRange(row, 1, add.length, 3).setValues(add);
    }
  } finally {
    lock.releaseLock();
  }
  return true;
}

function markRead(p) {
  const me = me_();
  if (!me.email) return false;
  const key = threadKey_(p.date, p.memberId, p.field);
  const sh = ensureSheet_(SpreadsheetApp.getActive(), SHEET.READ, HEADERS[SHEET.READ]);
  const now = new Date();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const hit = readMyReads_(me.email).get(key);
    if (hit) {
      sh.getRange(hit.row, 3).setValue(now);
    } else {
      const row = sh.getLastRow() + 1;
      sh.getRange(row, 2).setNumberFormat('@');
      sh.getRange(row, 1, 1, 3).setValues([[me.email, key, now]]);
    }
  } finally {
    lock.releaseLock();
  }
  return true;
}

const MS_ALL = 'ALL';
const MS_KINDS = ['大会・提出', '目標'];
const MS_STATES = ['予定', '完了', '中止'];

function readMilestones_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET.MILESTONE);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS[SHEET.MILESTONE].length).getValues()
    .map((r, i) => ({
      row: i + 2,
      id: String(r[0]),
      themeIds: splitThemeIds_(r[1]),
      kind: MS_KINDS.includes(String(r[2])) ? String(r[2]) : MS_KINDS[0],
      title: String(r[3]),
      due: r[4] instanceof Date ? dkey_(r[4]) : '',
      state: String(r[5] || '予定'),
      memo: String(r[9] || ''),
    }))
    .filter(m => m.id && m.due && m.state !== '削除');
}

function splitThemeIds_(v) {
  const ids = String(v || '').split(/[,、\s]+/).map(s => s.trim()).filter(Boolean);
  return ids.length ? Array.from(new Set(ids)) : [MS_ALL];
}

function getMilestones() {
  return readMilestones_().map(m => ({
    id: m.id, themeIds: m.themeIds, kind: m.kind, title: m.title, due: m.due, state: m.state, memo: m.memo,
  }));
}

function canEditMilestone_(me, themeIds) {
  if (me.isTeacher) return true;
  if (!me.memberId || !themeIds.length || themeIds.includes(MS_ALL)) return false;
  const mine = readBelongMap_()[me.memberId] || [];
  return themeIds.every(t => mine.includes(t));
}

function saveMilestone(p) {
  const me = me_();
  if (!me.email) throw new Error('ログイン中のアカウントを確認できません。');
  let themeIds = Array.from(new Set((Array.isArray(p.themeIds) ? p.themeIds : [p.themeIds]).map(String).filter(Boolean)));
  if (!themeIds.length) throw new Error('テーマを1つ以上選んでください。');
  if (themeIds.includes(MS_ALL)) themeIds = [MS_ALL]; // 部全体は単独
  const known = new Set(readTable_(SHEET.THEMES).map(t => String(t['テーマID'])));
  if (themeIds.some(t => t !== MS_ALL && !known.has(t))) throw new Error('テーマが見つかりません。');
  if (!canEditMilestone_(me, themeIds)) {
    throw new Error(themeIds.includes(MS_ALL) ? '部全体の予定は先生だけが登録できます。' : '自分が所属するテーマだけ選べます。');
  }
  const themeId = themeIds.join(',');
  if (!MS_KINDS.includes(p.kind)) throw new Error('種類が正しくありません。');
  const state = MS_STATES.includes(p.state) ? p.state : '予定';
  const title = cleanText_(p.title).slice(0, 200);
  if (!title) throw new Error('内容を入れてください。');
  const due = parseKey_(p.due);

  const ss = SpreadsheetApp.getActive();
  const sh = ensureSheet_(ss, SHEET.MILESTONE, HEADERS[SHEET.MILESTONE]);
  const now = new Date();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (p.id) {
      const hit = readMilestones_().find(m => m.id === p.id);
      if (!hit) throw new Error('予定が見つかりません（削除された可能性があります）。');
      if (!canEditMilestone_(me, hit.themeIds)) throw new Error('この予定は変更できません（ほかのテーマも含むものは先生が変更します）。');
      sh.getRange(hit.row, 2).setNumberFormat('@');
      sh.getRange(hit.row, 4).setNumberFormat('@');
      sh.getRange(hit.row, 2, 1, 5).setValues([[themeId, p.kind, title, due, state]]);
      sh.getRange(hit.row, 9).setValue(now);
    } else {
      const row = sh.getLastRow() + 1;
      sh.getRange(row, 2).setNumberFormat('@');
      sh.getRange(row, 4).setNumberFormat('@');
      sh.getRange(row, 1, 1, 10).setValues([[Utilities.getUuid(), themeId, p.kind, title, due, state, me.email, now, '', '']]);
    }
    sh.getRange(2, 5, sh.getLastRow() - 1, 1).setNumberFormat('yyyy/mm/dd');
  } finally {
    lock.releaseLock();
  }
  return getMilestones();
}

function deleteMilestone(id) {
  const me = me_();
  const hit = readMilestones_().find(m => m.id === id);
  if (!hit) return getMilestones();
  if (!canEditMilestone_(me, hit.themeIds)) throw new Error('この予定は削除できません。');
  SpreadsheetApp.getActive().getSheetByName(SHEET.MILESTONE).getRange(hit.row, 6).setValue('削除');
  return getMilestones();
}

function getTimeline(p) {
  parseKey_(p.from);
  parseKey_(p.to);
  const belong = readBelongMap_();
  const map = {};
  readLog_().forEach(r => {
    if (r.date < p.from || r.date > p.to) return;
    if (!(r.plan.trim() || r.done.trim() || r.next.trim())) return;
    const tids = r.themeId ? [r.themeId] : (belong[r.memberId] || []);
    tids.forEach(t => { (map[t] = map[t] || {})[r.date] = true; });
  });
  const out = {};
  Object.keys(map).forEach(t => { out[t] = Object.keys(map[t]).sort(); });
  return out;
}

const THEME_COLS = 8; // テーマID・テーマ名・状態・表示順・色・開始日・終了日・メモ

function listThemes_() {
  return readTable_(SHEET.THEMES)
    .filter(t => t['テーマID'] && t['テーマ名'])
    .sort((a, b) => (Number(a['表示順']) || 999) - (Number(b['表示順']) || 999))
    .map(t => ({
      id: String(t['テーマID']),
      name: String(t['テーマ名']).trim(),
      state: String(t['状態']),
      color: String(t['色'] || ''),
      order: Number(t['表示順']) || '',
    }));
}

function saveTheme(p) {
  const me = me_();
  if (!me.isTeacher) throw new Error('テーマの追加・変更は先生だけができます。');
  const name = String(p.name || '').replace(/[\s　]+/g, ' ').trim().slice(0, 50);
  if (!name) throw new Error('テーマ名を入れてください。');
  if (/^[=+\-@]/.test(name)) throw new Error('テーマ名の最初に = + - @ は使えません。');
  const state = THEME_STATES.includes(p.state) ? p.state : '進行中';
  const order = p.order === '' || p.order == null ? '' : Number(p.order);
  if (order !== '' && !Number.isFinite(order)) throw new Error('表示順は数字で入れてください。');
  const color = /^#[0-9a-f]{6}$/i.test(p.color || '') ? p.color : '';

  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET.THEMES);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, THEME_COLS).getValues() : [];
    if (rows.some(r => String(r[1]).trim() === name && String(r[0]) !== String(p.id || ''))) {
      throw new Error(`「${name}」というテーマはすでにあります。`);
    }

    if (p.id) {
      const i = rows.findIndex(r => String(r[0]) === String(p.id));
      if (i < 0) throw new Error('テーマが見つかりません。');
      const oldName = String(rows[i][1]).trim();
      sh.getRange(i + 2, 2, 1, 4).setValues([[name, state, order, color]]);
      if (oldName && oldName !== name) renameThemeInBelong_(ss, oldName, name);
    } else {
      const maxNo = Math.max(0, ...rows.map(r => {
        const m = String(r[0]).match(/^T(\d+)$/);
        return m ? Number(m[1]) : 0;
      }));
      const id = 'T' + String(maxNo + 1).padStart(2, '0');
      const ord = order === '' ? rows.length + 1 : order;
      sh.getRange(sh.getLastRow() + 1, 1, 1, THEME_COLS).setValues([[id, name, state, ord, color, '', '', '']]);
    }
  } finally {
    lock.releaseLock();
  }
  return listThemes_();
}

function renameThemeInBelong_(ss, oldName, newName) {
  const sh = ss.getSheetByName(SHEET.BELONG);
  if (!sh || sh.getLastRow() < 2) return;
  const range = sh.getRange(2, 2, sh.getLastRow() - 1, 1);
  const vals = range.getValues();
  let changed = false;
  vals.forEach(r => { if (String(r[0]).trim() === oldName) { r[0] = newName; changed = true; } });
  if (changed) range.setValues(vals);
}

const APP_DEFAULT_NAME = 'ハコ日誌';
const APP_LINK_MAX = 3;

const APP_COLORS = {
  navy: ['#1f3a5f', '#2f5a8f'],
  blue: ['#1c4f9c', '#2f6cc4'],
  teal: ['#0f5c63', '#1d7f88'],
  green: ['#25573a', '#367a53'],
  olive: ['#4a5a1c', '#66792b'],
  brown: ['#5c3d24', '#7d5636'],
  orange: ['#8a4316', '#ad5a24'],
  red: ['#7d2232', '#a03246'],
  purple: ['#4b3478', '#664a9c'],
  gray: ['#3a4048', '#565e69'],
};

function getAppSettings_() {
  const p = PropertiesService.getScriptProperties();
  let links = [];
  try { links = JSON.parse(p.getProperty('APP_LINKS') || '[]'); } catch (e) { links = []; }
  const color = p.getProperty('THEME_COLOR') || '';
  return {
    appName: p.getProperty('APP_NAME') || APP_DEFAULT_NAME,
    orgName: p.getProperty('ORG_NAME') || '',
    color: APP_COLORS[color] ? color : '',
    colors: APP_COLORS,
    links: Array.isArray(links) ? links.filter(l => l && l.name && /^https:\/\//.test(l.url)).slice(0, APP_LINK_MAX) : [],
  };
}

function saveAppSettings(s) {
  const me = me_();
  if (!me.isTeacher) throw new Error('アプリの表示は先生だけが変えられます。');
  const clean = v => String(v == null ? '' : v).replace(/[\s　]+/g, ' ').trim();
  const appName = clean(s.appName).slice(0, 30);
  const orgName = clean(s.orgName).slice(0, 40);
  const color = APP_COLORS[s.color] ? s.color : '';
  const links = (Array.isArray(s.links) ? s.links : [])
    .map(l => ({ name: clean(l && l.name).slice(0, 20), url: String((l && l.url) || '').trim() }))
    .filter(l => l.name || l.url)
    .slice(0, APP_LINK_MAX);
  links.forEach(l => {
    if (!l.name) throw new Error('リンクの名前を入れてください。');
    if (!/^https:\/\/[^\s"'<>]+$/.test(l.url)) throw new Error(`「${l.name}」のURLは https:// で始まる形で入れてください。`);
  });

  const p = PropertiesService.getScriptProperties();
  const put = (k, v) => (v ? p.setProperty(k, v) : p.deleteProperty(k));
  put('APP_NAME', appName && appName !== APP_DEFAULT_NAME ? appName : '');
  put('ORG_NAME', orgName);
  put('THEME_COLOR', color);
  put('APP_LINKS', links.length ? JSON.stringify(links) : '');
  return getAppSettings_();
}
