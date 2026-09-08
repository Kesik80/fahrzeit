// ══════════════════════════════════════════════════════════════
//  auth.js — вход в редактор: отпечаток пальца + пароль
//
//  Зачем: пароль редактора спрашивается в двух местах — при входе
//  из index.html и при отправке stations.js на GitHub. Логика одна,
//  поэтому живёт здесь и подключается в оба файла.
//
//  Как это работает
//  ────────────────
//  1. Первый раз человек вводит пароль. Сервер (/api/check-password)
//     подтверждает — пароль запоминается на этом устройстве.
//  2. Если устройство умеет биометрию, предлагаем привязать отпечаток.
//     Через WebAuthn создаётся ключ, привязанный к этому домену
//     и к этому телефону; сам отпечаток никуда не уходит и остаётся
//     в защищённом хранилище Android.
//  3. Дальше вход — по отпечатку. Пароль остаётся запасным входом:
//     палец не распознался, сменился телефон, чужое устройство.
//
//  ЧЕСТНО ПРО БЕЗОПАСНОСТЬ
//  ───────────────────────
//  Пароль хранится в localStorage этого браузера в открытом виде,
//  иначе после отпечатка нечего было бы отправить на сервер.
//  Значит, тот, у кого есть доступ к разблокированному телефону и
//  к DevTools, пароль увидит. Отпечаток защищает от случайного
//  человека, взявшего телефон в руки, но не от целенаправленного
//  взлома устройства. Для личного инструмента это разумный размен;
//  если понадобится строже — нужен серверный сеанс с токеном,
//  а не хранение пароля на клиенте.
//
//  Использование
//  ─────────────
//      <script src="auth.js"><\/script>
//
//      await Auth.check(pwd)      // спросить сервер, верен ли пароль
//      Auth.remember(pwd)         // запомнить на устройстве
//      Auth.password()            // → строка или null
//      Auth.forget()              // забыть всё: пароль и отпечаток
//      await Auth.available()     // умеет ли устройство биометрию
//      Auth.enrolled()            // привязан ли отпечаток
//      await Auth.enroll()        // привязать отпечаток
//      await Auth.verify()        // спросить отпечаток → true/false
//      await Auth.unlock()        // отпечаток (если есть) → пароль
// ══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  const KEY_PWD = 'fz.auth.password';   // сам пароль
  const KEY_CRED = 'fz.auth.credId';    // идентификатор ключа WebAuthn

  // На локальном сервере (отладка с телефона) API живёт на проде
  const PROD_ORIGIN = 'https://fahrzeit.vercel.app';
  const IS_LOCAL =
    location.protocol === 'file:' ||
    ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', ''].includes(location.hostname) ||
    /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(location.hostname);
  const apiBase = IS_LOCAL ? PROD_ORIGIN : '';

  // localStorage может быть недоступен (приватный режим) — не роняем страницу
  const store = {
    get(k)    { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    del(k)    { try { localStorage.removeItem(k); } catch {} }
  };

  const b64 = {
    // WebAuthn работает с ArrayBuffer, localStorage — со строками
    enc(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); },
    dec(str) { return Uint8Array.from(atob(str), c => c.charCodeAt(0)); }
  };

  const Auth = {

    // ── Пароль ──────────────────────────────────────────────
    // Проверка на сервере. true — пароль верный.
    async check(password) {
      if (!password) return false;
      try {
        const r = await fetch(apiBase + '/api/check-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const d = await r.json().catch(() => ({}));
        return !!d.ok;
      } catch {
        return false;
      }
    },

    remember(password) { if (password) store.set(KEY_PWD, password); },
    password()         { return store.get(KEY_PWD); },
    remembered()       { return !!store.get(KEY_PWD); },

    // Забыть всё: и пароль, и привязку отпечатка
    forget() {
      store.del(KEY_PWD);
      store.del(KEY_CRED);
      try { sessionStorage.removeItem('uploadPassword'); } catch {}
    },

    // Забыть только пароль, отпечаток оставить.
    // Нужно, когда сервер отверг сохранённый пароль: перезаписать его
    // человек сможет, а вот заново привязывать палец — лишняя морока.
    forgetPassword() {
      store.del(KEY_PWD);
      try { sessionStorage.removeItem('uploadPassword'); } catch {}
    },

    // ── Отпечаток пальца (WebAuthn) ─────────────────────────
    // Есть ли на устройстве встроенный сканер, пригодный для входа
    async available() {
      try {
        if (!global.PublicKeyCredential) return false;
        if (!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) return false;
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch {
        return false;
      }
    },

    enrolled() { return !!store.get(KEY_CRED); },

    // Привязать отпечаток к этому устройству и домену
    async enroll() {
      if (!(await Auth.available())) return false;
      try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const userId    = crypto.getRandomValues(new Uint8Array(16));
        // Если ключ уже есть — не создаём второй на том же устройстве
        const existing = store.get(KEY_CRED);
        const cred = await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'Fahrzeit Rechner' },   // домен подставит браузер
            user: { id: userId, name: 'redaktor', displayName: 'Redaktor' },
            pubKeyCredParams: [
              { type: 'public-key', alg: -7 },    // ES256
              { type: 'public-key', alg: -257 }   // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',  // только встроенный сканер
              userVerification: 'required',         // именно палец, не просто пин
              residentKey: 'preferred'
            },
            excludeCredentials: existing
              ? [{ type: 'public-key', id: b64.dec(existing) }]
              : [],
            timeout: 60000,
            attestation: 'none'
          }
        });
        if (!cred) return false;
        store.set(KEY_CRED, b64.enc(cred.rawId));
        return true;
      } catch (e) {
        console.warn('[auth] не удалось привязать отпечаток:', e && e.name);
        return false;
      }
    },

    // Спросить отпечаток. true — подтвердил.
    async verify() {
      const id = store.get(KEY_CRED);
      if (!id) return false;
      try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [{ type: 'public-key', id: b64.dec(id) }],
            userVerification: 'required',
            timeout: 60000
          }
        });
        return !!assertion;
      } catch (e) {
        // NotAllowedError — человек отменил или палец не подошёл
        console.warn('[auth] отпечаток не подтверждён:', e && e.name);
        return false;
      }
    },

    // Главная точка входа: отдаёт пароль, если человек имеет право войти.
    // Возвращает null, если войти не удалось — тогда спрашиваем пароль.
    async unlock() {
      const pwd = Auth.password();
      if (!pwd) return null;                 // ещё ни разу не входили
      if (!Auth.enrolled()) return pwd;      // отпечаток не привязан — пускаем по памяти
      return (await Auth.verify()) ? pwd : null;
    }
  };

  global.Auth = Auth;
})(window);
