/* Signs the Job Desk page in automatically, as the Google account this Chrome is signed into.
 *
 * RJ: "when I press sign in we only allow google sign in, so let's hook to that sign in system -
 * and the extension should allow the sign in automatically?"
 *
 * Yes, and this is the piece that makes it automatic. The extension already knows who you are
 * (chrome.identity.getProfileUserInfo, no OAuth client and no console); the page did not, because
 * an extension and a page are separate worlds. This content script is the bridge: it runs on the
 * desk page, asks the background worker to sign in, and writes the result where the page already
 * looks for it - localStorage "jd.user", JSON-encoded, the format LS.set() uses at index.html:302.
 *
 * It fires a `jobdesk:signedin` event afterwards so a page that is listening can pick it up without
 * a reload; the page falls back to reading localStorage on its next load either way, so this works
 * whether or not the page knows the extension exists.
 *
 * It only ever signs you in as YOUR OWN Chrome account, and it never signs you out - a page that
 * has already been signed in as somebody else is left alone rather than quietly switched.
 */

const KEY = "jd.user";

function alreadySignedIn() {
  try {
    const v = localStorage.getItem(KEY);
    return !!(v && JSON.parse(v));
  } catch (e) {
    return false;
  }
}

async function autoSignIn() {
  if (alreadySignedIn()) return;              // never override a session already in progress
  let r;
  try {
    r = await chrome.runtime.sendMessage({ type: "signin" });
  } catch (e) {
    return;                                   // the worker is asleep or the extension reloaded
  }
  if (!r || !r.ok || !r.user) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(r.user));
  } catch (e) {
    return;
  }
  window.dispatchEvent(new CustomEvent("jobdesk:signedin", {
    detail: { user: r.user, cli: r.cli || null },
  }));
}

autoSignIn();
