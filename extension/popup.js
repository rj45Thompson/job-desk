/* The popup: says what it can see, and signs in. Deliberately three lines of state - is Chrome
 * signed into Google, is the desk answering, are you signed in - because every failure so far in
 * this project has been one of those three being false while the screen said something vaguer. */
const $ = (id) => document.getElementById(id);

function set(dot, text, state, msg) {
  $(dot).className = "dot" + (state === true ? " on" : state === false ? " bad" : "");
  $(text).textContent = msg;
}

async function refresh() {
  const s = await chrome.runtime.sendMessage({ type: "status" });
  const email = s && s.google && s.google.email;
  set("dGoogle", "tGoogle", !!email, email || "Chrome is not signed into Google");
  const deskHost = s && s.desk ? s.desk.replace(/^https?:\/\//, "") : "";
  set("dDesk", "tDesk", !!s.desk, s.desk ? "desk: " + deskHost : "the desk is not answering");
  if (s && s.user) {
    set("dGoogle", "tGoogle", true, "signed in as " + s.user);
    $("signin").textContent = "Signed in";
    $("signin").disabled = true;
  } else {
    $("signin").disabled = !(email && s.desk);
  }
}

$("signin").addEventListener("click", async () => {
  $("err").textContent = "";
  $("signin").disabled = true;
  $("signin").textContent = "Signing in…";
  const r = await chrome.runtime.sendMessage({ type: "signin" });
  if (!r || !r.ok) {
    $("err").textContent = (r && r.error) || "Sign-in failed.";
    $("signin").textContent = "Sign in";
    $("signin").disabled = false;
    return;
  }
  // the desk checks its own Claude during sign-in; better to hear it here than mid-question
  if (r.cli && !r.cli.ready) $("err").textContent = r.cli.message;
  refresh();
});

$("open").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://rj45thompson.github.io/job-desk/" });
});

refresh();
