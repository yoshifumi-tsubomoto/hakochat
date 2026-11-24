// ハコチャット ログイン用 配布用（2026/11/24 20:42:36 作成）。Copyright 坪本 吉史 / Apache License 2.0。

const TOKEN_TTL_SEC = 60 * 60 * 24 * 30; // 30日

const DEFAULT_APP_NAME = 'ハコチャット';

function doGet() {
  const p = PropertiesService.getScriptProperties();
  const secret = p.getProperty('SHARED_SECRET');
  const mainUrl = p.getProperty('MAIN_URL');
  const email = Session.getActiveUser().getEmail();

  const appName = p.getProperty('APP_NAME') || DEFAULT_APP_NAME;
  const tpl = HtmlService.createTemplateFromFile('bridge');
  tpl.appName = appName;
  tpl.email = email;
  tpl.nextUrl = '';
  tpl.error = '';
  if (!secret || !mainUrl) {
    tpl.error = 'ログイン用アプリの設定がまだ済んでいません（管理者の先生にお知らせください）。';
  } else if (!email) {
    tpl.error = 'Googleアカウントのメールアドレスを確かめられませんでした。';
  } else {
    tpl.nextUrl = mainUrl + '?t=' + encodeURIComponent(makeToken_(email, secret));
  }
  return tpl.evaluate()
    .setTitle(appName + ' ログイン')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function makeToken_(email, secret) {
  const payload = JSON.stringify({ email: email, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC });
  const data = Utilities.base64EncodeWebSafe(payload, Utilities.Charset.UTF_8);
  const sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(data, secret));
  return data + '.' + sig;
}
