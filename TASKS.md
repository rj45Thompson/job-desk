# Job Desk - productisation burn-down

## 14 OPEN / 0 DONE  (2026-09-14)

**This file is the durable state.** The keep-going loop reads it off disk at the top of every
iteration, before anything else, because context does not survive compaction and this does.
Work ONE item, verify its stated observable, rewrite its line in place with the measured
result, commit, then re-read this file. Blocked is a result, not a stop - record it and move
to the next item. Stop when a whole pass moves nothing.

Nothing here is waiting on RJ except the two marked **RJ**.

Generated 2026-09-14 from `USE_CASES.md`, which was built with the `usecase-map` skill from RJ's
own words rather than from the code. **Every item below is an INFERRED requirement** - the chain
needed it and no authored requirement covers it. That is not a coincidence: this repo has no
authored requirements file at all, so the inferred table *is* the backlog.

Ranked the way `autobot` ranks: a defect a user would actually hit outranks elegance, and
something that can cost RJ real money outranks both.

**Done means an observable came back true.** Not "implemented" - measured.

---

## Rung 1 - the owner pays, so this is the spine

- [ ] **IR-1 · per-user spend ledger.** Record `response.usage` for every answer against the
      signed-in login, persisted next to `project.json`.
      *Observable:* ask two questions as two different logins, then read back per-login input/output
      token totals that match the API's own numbers.
      *Why first:* measured 2026-09-14 - the only limit today is `Limiter(max_hits=20, window=60)`
      and it is **per IP**, which a phone hotspot defeats. Zero tokens are tracked anywhere.

- [ ] **IR-1b · per-user cap, enforced BEFORE the call.** Daily and monthly ceilings; at the cap the
      desk refuses with a clear message rather than spending.
      *Observable:* set the cap to ~1 answer, ask twice, second returns a named refusal and the
      ledger shows no second spend.

- [ ] **IR-10 · one switch that stops all spending.** Owner-only, local-only, instant.
      *Observable:* flip it, ask a question through the tunnel, get a named refusal.

- [ ] **IR-2 · prompt caching.** The résumé and system prompt are byte-identical every turn and are
      re-billed every turn (`_attachments` runs per request, `desk.py`).
      *Observable:* `usage.cache_read_input_tokens > 0` on the second question of a conversation.
      *Do not* mark done on "added cache_control" - the skill's own rule is that a zero cache-read
      across repeated prefixes means a silent invalidator is at work.

- [ ] **IR-3 · exhausted credit is ONE clear state.** Measured 2026-09-11:
      `400 "Your credit balance is too low"`. Today that would surface as a failure on every
      question. The key is currently commented out in `.env` precisely because of this.
      *Observable:* with a dead key, the desk reports one owner-facing state, and users are told the
      desk is unavailable rather than shown an API error.

## Rung 2 - RJ asked for these directly

- [ ] **Chrome extension finished.** `extension/` is complete and correctly targeted (MV3,
      `content_scripts` match the github.io origin) but has never been installed or confirmed
      working, and `/signin-extension` is now **local-only** (585d4d8), so the extension only signs
      in on the machine the desk runs on.
      *Observable:* load unpacked in **Chrome** (not Edge - `chrome.identity.getProfileUserInfo`
      reads the browser profile's Google account and an Edge profile is a Microsoft one), open the
      desk on that machine, and be signed in with no click.
      *Open question:* what is the extension FOR now that Google sign-in works on the page? Answer
      before building further.

- [ ] **IR-6 · Claude edits the product's own code, safely.** No approval gate, no rollback, nothing
      stopping a bad edit breaking the desk for every user. grep: `edit its own` 0 hits, `self-edit`
      0 hits.
      *Observable:* a proposed self-edit is shown as a diff, is not applied without approval, and a
      single command restores the previous working desk.
      *Design note:* the desk currently runs with no Write and no Bash by construction. Self-editing
      means deliberately re-opening that fence, so it must be a separate, differently-gated path -
      not a relaxation of `ALLOWED_TOOLS`.

- [ ] **IR-5 · a custom skill must not reach another user's project.** grep `skill` = 7 hits, **all
      7 are about removing skills from the fenced subprocess**; nothing authorises running them.
      *Observable:* a skill invoked by user A cannot read user B's uploads - asserted by a test, the
      way per-login isolation already is.

## Rung 3 - blocks real users

- [ ] **IR-7 · sign-in beyond 100 people.** The OAuth consent screen is in **Testing**, capped at
      100 hand-added test users. Publishing needs a home page, a privacy policy and terms of service.
      *Observable:* a Google account that was never added as a test user can sign in.

- [ ] **IR-9 · a user can delete their material.** grep `data deletion` 0 hits.
      *Observable:* delete from the page, then confirm the file is gone from `uploads/<login>/` and
      no longer reaches the model.

- [ ] **IR-8 · the seeker is told when the desk is simply gone.** It runs on RJ's desktop; sleep
      kills it mid-conversation.
      *Observable:* with the desk stopped, the page says so plainly instead of failing a question.

- [ ] **Named Cloudflare tunnel.** The quick tunnel hostname rotates on every restart; only the
      github.io page survives it.
      *Observable:* restart the desk twice and the public hostname does not change.

## Rung 4 - hardening

- [ ] **IR-4 · a test that the desk cannot send.** The Review tab *says* it cannot submit and that
      is true by construction (no Bash, no Write, no browser automation) - but nothing asserts it.
      *Observable:* a test that fails if a sending-capable tool is ever added.

- [ ] **Access code is not a secret.** It is published in `desk.json` so the page can supply it
      without anyone typing one. It authenticates nobody and should stop being described as access
      control.

---

## Model health

```
py .opus-tools/autobot/interrogate.py --doc USE_CASES.md
```

2026-09-14 baseline: **10 sections, 27 steps, 5 modules, 38 open questions**
(8 inferred + 30 baseline-probe facets). 5/35 facets answered.

The count has to reach zero. "Every requirement" is a count, not a feeling.
