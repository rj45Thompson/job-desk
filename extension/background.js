/* Job Desk extension - the service worker.
 *
 * WHY THIS EXISTS, and why it is the answer to the sign-in problem rather than a detour.
 *
 * RJ: "I said I wanted the ACTUAL google sign in, you know where you have to use your
 * authenticated google account?" - and then "build the chrome extension so I can just login
 * there?"
 *
 * The web page cannot do that without an OAuth client id from a Google Cloud project, which needs
 * his Google account signed into a console, which is the step that had us stuck for an hour. An
 * EXTENSION can, with no console and no client id at all:
 *
 *     chrome.identity.getProfileUserInfo({ accountStatus: "ANY" })  ->  { email, id }
 *
 * That is the Google account Chrome itself is signed into. Not a name someone typed - Chrome's
 * answer to "whose browser is this". No project, no consent screen, no client secret, nothing to
 * configure. It is also exactly what the "real" sign-in was for: telling one person's desk from
 * another's.
 *
 * BE HONEST ABOUT WHAT IT IS NOT. The desk is trusting the extension's word for that email; there
 * is no signed token here for it to verify, the way there would be with an ID token. Anyone who
 * can run code on this machine could post a different address. That is fine for an extension the
 * owner installs on their own computer to reach their own desk, and it is NOT fine as the front
 * door of a hosted product - and the upgrade path is the one already built: a client id, a real
 * ID token, and desk.py's google_identity() which verifies it with Google.
 */

const DEFAULT_PAGE = "https://rj45thompson.github.io/job-desk/";

/** The Google account this Chrome is signed into. No OAuth, no client id, no console. */
function googleAccount() {
  return new Promise((resolve) => {
    if (!chrome.identity || !chrome.identity.getProfileUserInfo) return resolve(null);
    chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, (info) => {
      resolve(info && info.email ? { email: info.email, id: info.id || "" } : null);
    });
  });
}

/** Where the desk is: whatever address the published page is advertising, or localhost. */
async function findDesk() {
  const saved = await chrome.storage.local.get(["deskUrl", "code"]);
  const tries = [];
  if (saved.deskUrl) tries.push(saved.deskUrl);
  try {
    const r = await fetch(DEFAULT_PAGE + "desk.json?" + Date.now(), { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      if (j.url) tries.push(j.url);
      // the page publishes the code with the address, so the extension never asks for one either
      if (j.code) await chrome.storage.local.set({ code: j.code });
    }
  } catch (e) { /* offline, or the desk is down: localhost may still answer */ }
  tries.push("http://127.0.0.1:8790");

  for (const url of tries) {
    try {
      const r = await fetch(url.replace(/\/+$/, "") + "/health", { cache: "no-store" });
      if (!r.ok) continue;
      const j = await r.json();
      if (j && j.ok) {
        await chrome.storage.local.set({ deskUrl: url.replace(/\/+$/, "") });
        return { url: url.replace(/\/+$/, ""), health: j };
      }
    } catch (e) { /* try the next one */ }
  }
  return null;
}

/** Sign in to the desk as this Chrome's Google account. */
async function signIn() {
  const who = await googleAccount();
  if (!who) {
    return { ok: false, error: "Chrome is not signed into a Google account. Sign into Chrome, " +
                              "then try again." };
  }
  const desk = await findDesk();
  if (!desk) {
    return { ok: false, error: "The desk is not answering. Is it running on your computer?" };
  }
  const { code } = await chrome.storage.local.get("code");
  const r = await fetch(desk.url + "/signin-extension", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: who.email, code: code || "" }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.user) {
    return { ok: false, error: (j.error && j.error.message) || ("The desk answered " + r.status) };
  }
  await chrome.storage.local.set({ user: j.user });
  return { ok: true, user: j.user, cli: j.cli || null, desk: desk.url };
}

chrome.runtime.onMessage.addListener((msg, _sender, send) => {
  if (msg && msg.type === "signin") { signIn().then(send); return true; }
  if (msg && msg.type === "status") {
    (async () => {
      const [who, desk, saved] = await Promise.all([
        googleAccount(), findDesk(), chrome.storage.local.get(["user"]),
      ]);
      send({ google: who, desk: desk ? desk.url : "", health: desk ? desk.health : null,
             user: saved.user || "" });
    })();
    return true;
  }
  return false;
});
