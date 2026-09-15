# Job Desk - the use-case model

Built 2026-09-14 with the `usecase-map` skill. **No product code was changed to write this.**

**MODE: clone-and-change.** The reference product is the desk as it runs today, and the change is
productisation (owner pays, users bring no key, custom skills, self-editing). So the end-to-end
system basics are harvested from the running system and marked HAVE, while the product intent
comes from RJ's own words and its gaps are marked INFERRED.

## The layering, corrected 2026-09-14

RJ: *"I never said don't get requirements from code but our code is not the first set of
requirements which I want done as the base layer. It will have the end to end system basics."*

The first draft of this file quoted the skill's rule as "never generate requirements from code"
and then refused to harvest the code at all. That is not the rule. The rule is about **order and
primacy**, not prohibition:

| layer | source | why in this order |
|---|---|---|
| **0 - base** | the **end-to-end system basics**: how a question actually gets from a browser to Claude and back, and everything that must hold along the way | this is the spine. If it is not written first, everything above it is describing features of a system nobody specified. |
| **1** | the **problem story** - the actor's goal, sourced to what RJ said | anchored above the implementation, so it can find a MISSING feature |
| **2** | the **code** - what the system demonstrably already does | legitimate and useful. It just must not be mistaken for layer 0, or the model becomes "the code does what the code does" |

Layer 2 is marked **HAVE** and cites a real symbol. Layer 1 gaps are marked **INFERRED**. The
danger the skill was guarding against is real - a requirement read off a broken implementation
records the break as intent - but the fix is labelling the layer, not banning the source.

---

## 1. The problem story

> **A job seeker has one résumé and many postings, and the work that never gets done is finding
> the postings that actually match and re-tailoring the application for each one - so the desk
> finds the matches, tailors the application against the real CV, and shows the whole thing before
> anything is sent, because pressing submit is the applicant's to do and nobody else's.**

Provenance, clause by clause. Nothing here is composed from the source:

| clause | said by RJ |
|---|---|
| finds matches, tailors, previews before sending | *"it should preview the application it's going to submit before it does it, that's it and it should scan for job matches and tailor your resume for that. thats the user case use"* |
| no forms, it reads your file and you chat | *"there is no form to fill out here just displays information back to you and you chat that's it"* |
| it is a themed Claude wrapper, not a job board | *"this is just a claude wraper themed for jobs that has some of keep alive and a way to diplay things back to the user"* |
| it is for other people now, not only him | *"this is a generic product not just for myself now"* |
| one project per login, private | *"Just make sure it has a login and then a project per login"*; *"when I send this out I want the user to login so they don't see my stuff"* |
| nothing to configure once signed in | *"I want it to just work once signed in"* |
| the owner pays; users bring no key | *"I will pay the Claude and use my key they don't need a key"* |
| it runs his skills | *"it's going to be running all custom skills"* |
| it can change itself | *"add features where the Claude AI can adjust things about the product itself. Edit its own code."* |
| the extension signs you in | *"the exdtension should allow the sign it automatically"* |

### The problems that fall out of it

1. Your CV has to get in with no form-filling. (→ UC-J1)
2. Your material must be invisible to every other user. (→ UC-J2)
3. It must work the instant you are signed in - no key, no code, no setup. (→ UC-J2)
4. It must never submit anything on your behalf. (→ UC-J4)
5. **The owner pays, so one user must not be able to bankrupt him.** (→ UC-J5, and IR-1/IR-2/IR-3)
6. It has to run custom skills without a skill reaching another user's project. (→ IR-5)
7. It has to be able to edit its own code without breaking itself for everyone. (→ IR-6)

---

## 2. Authority of existing requirement files

**There are none.** The only prose is `README.md`, and it is a description of the current
implementation, not authored intent. It is also now *stale against the product direction*: it
states "There is no API key in this repository, on the page, or on the wire", which is the exact
opposite of the paid-by-the-owner model this pass exists to build.

Consequence: every requirement below is either sourced to a quotation in §1 or marked **INFERRED**.
That is unusual and it is the honest position - it means the inferred table is the whole payload.

---

## EPIC JD-E0 — LAYER 0: a question gets from a browser to Claude and back

**This is the base layer.** Not the seeker's goal - the system's own end-to-end path, which every
other use case sits on top of. It is harvested from the code (layer 2 evidence) because the code
is where the end-to-end basics are demonstrably true; what makes it layer 0 is that it is written
*first* and describes the whole spine rather than a feature.

| field | value |
|---|---|
| **Scope** | the whole system: static page, tunnel, desk process, model backend |
| **Level** | kite (summary) |
| **Primary actor** | the page, acting for a signed-in seeker |
| **Trigger** | any question typed into the chat |
| **Minimal guarantee** | a question either gets an answer or a named failure; it never hangs silently, and it never reaches this machine's files or the owner's accounts |
| **Success guarantee** | the answer is back in the page, attributed to the asking login |

| # | Step | What it needs | Thing | Requirement |
|---|---|---|---|---|
| 0.1 | The page finds the desk | the address moves every restart | `findDesk` | HAVE - reads `desk.json` published to GitHub Pages by `publish` |
| 0.2 | The desk proves it is alive | "published" is not "answering" | `/health` | HAVE - `{ok, provider, signedIn, tunnel}` |
| 0.3 | A question is accepted, not held | the request that exists to be instant must be instant | `POST /chat` | HAVE - returns an id; the slot is taken in the worker, measured 20.8 s → 857 ms |
| 0.4 | The caller is gated | a tunnel is open to the world | `_gate` | HAVE rate limit (`Limiter` 20/60 s per IP); the code is public so it authenticates nobody - **INFERRED IR-1** |
| 0.5 | The work is queued and serialised | one machine, one Claude | worker + slot | HAVE |
| 0.6 | A backend is chosen | owner's CLI today, owner's key later | `ask_claude` | HAVE - routes on presence of a key |
| 0.7 | The model cannot touch this machine or the owner's accounts | the desk is reachable by strangers | `--tools` / `--restricted` / `--strict-mcp-config` | HAVE - measured: exactly Glob, Grep, Read, WebFetch, WebSearch and `MCP: NONE` |
| 0.8 | The answer is collected | Cloudflare cuts a held request at ~100 s | `GET /chat/<id>` | HAVE - the page polls |
| 0.9 | The answer is attributed to the asker | one person's answer is not another's | `require_user` | HAVE - per-login project |

**Extensions**

- **0.1a** the published address is stale → the page reaches a dead hostname. Lived 2026-09-11.
- **0.2a** the desk is not running at all → **INFERRED IR-8**
- **0.6a** a key is present but has no credit → every question fails → **INFERRED IR-3**

---

## EPIC JD-E1 — A job seeker turns one résumé into a tailored application they send themselves

| field | value |
|---|---|
| **Scope** | the Job Desk product (page + desk + extension) |
| **Level** | kite (summary) |
| **Primary actor** | the job seeker |
| **Supporting actors** | Claude (via the owner's account); Google (identity); the employer's own site |
| **Stakeholders** | *job seeker*: wants a tailored application without hand-editing for every posting. *owner (RJ)*: pays for every token, so wants a bounded bill. *other users*: want their material invisible to everyone else. |
| **Trigger** | the seeker opens the published page |
| **Precondition** | the desk is reachable and a Google identity is configured |
| **Minimal guarantee** | nothing is sent anywhere on the seeker's behalf, and no other user's material is exposed |
| **Success guarantee** | the seeker is holding a tailored application, has read it in full, and knows what it was tailored against |

| # | Step | What it needs | Thing | Requirement |
|---|---|---|---|---|
| 1.1 | The seeker signs in | an identity the desk did not invent | `googleButton` | Google ID token verified server-side by `google_identity` |
| 1.2 | They get their own project | one person's files are never another's context | `uploads_dir` | raises unless signed in; per-login folder |
| 1.3 | They drop a résumé in | no form to fill, the model reads the PDF itself | `_attachments` | attached as a document block; **INFERRED IR-2** on cost |
| 1.4 | They ask for matching roles | live postings, not the model's memory | `SERVER_TOOLS` | `web_search` / `web_fetch`, capped at 12 uses |
| 1.5 | It tailors against real CV lines | claims must trace to the file, not be invented | system prompt | "gaps marked [like this] rather than invented" |
| 1.6 | They read the whole thing before anything moves | the preview is the product | `renderReview` | Review tab; the desk declares it cannot send |
| 1.7 | They submit on the employer's site themselves | a legal declaration is the applicant's to make | (none) | **INFERRED IR-4** |
| 1.8 | The application is recorded | they can see what they have already sent | `project_write` | per-login `project.json` |

**Extensions**

- **1.1a** the desk has no Google client id → only door is the extension, which is local-only → *nobody can sign in.* Lived on 2026-09-11.
- **1.1b** the consent screen is in Testing → user 101 cannot sign in at all. **INFERRED IR-7**
- **1.4a** the owner's credit is exhausted → every answer fails. **INFERRED IR-3**
- **1.x** the owner's desktop sleeps → the whole desk vanishes mid-conversation. **INFERRED IR-8**

---

## UC-J1 — Seeker puts their material in without filling a form

| # | Step | What it needs | Thing | Requirement |
|---|---|---|---|---|
| 2.1 | They drop a file on the page | no parsing in the browser | `/upload` | base64 JSON to the desk |
| 2.2 | It lands in their project only | isolation is a property of which bytes are sent | `uploads_dir` | per-login folder, tested |
| 2.3 | The model reads the PDF itself | no text extraction step to get wrong | `_attachments` | document content block |
| 2.4 | A file that could not be sent is named | a silent drop produces a confident wrong answer | `_attachments` | skipped files announced to the model |
| 2.5 | They can remove what they uploaded | their material is theirs | (none) | **INFERRED IR-9** |

## UC-J2 — Seeker signs in and everything is already set up

| # | Step | What it needs | Thing | Requirement |
|---|---|---|---|---|
| 3.1 | The page finds the desk | the address moves | `findDesk` | reads `desk.json` published by `publish` |
| 3.2 | They sign in with Google | a real identity, not a typed name | `google_identity` | `aud`, `iss`, `email_verified` all checked |
| 3.3 | Nothing else is asked of them | no key, no access code typed | `signInControls` | code auto-supplied from `desk.json` |
| 3.4 | Chat is unreachable until signed in | signed-out must mean signed-out | `.gate` | full-viewport overlay, verified 1280x860 |
| 3.5 | Their past work is waiting | it followed them, not the browser | `project_read` | per-login `project.json` |

## UC-J4 — Seeker reviews the whole application before anything is sent

| # | Step | What it needs | Thing | Requirement |
|---|---|---|---|---|
| 4.1 | They open Review | a place the finished thing lives | `renderReview` | Review tab |
| 4.2 | They see it as it would go out | a preview that hides nothing is the point | `renderReview` | letter + tailored résumé in editable boxes |
| 4.3 | The desk cannot send it | not a promise, a property | `ALLOWED_TOOLS` | no Bash, no Write, no browser automation |
| 4.4 | They are told submitting is theirs | the declaration is legally theirs | Review copy | "You read it, you copy it, you press submit" |

## UC-J5 — Owner pays for everyone without being bankrupted by anyone

**This use case has no implementation at all.** It is written because the problem story demands it
("I will pay the Claude and use my key they don't need a key"), and every step below is inferred.

| # | Step | What it needs | Thing | Requirement |
|---|---|---|---|---|
| 5.1 | Every answer's cost is known | you cannot cap what you do not measure | (none) | **INFERRED IR-1** |
| 5.2 | A user has a spend ceiling | one person must not spend everyone's budget | (none) | **INFERRED IR-1** |
| 5.3 | The repeated prefix is not paid for twice | the résumé is re-sent every single turn | `_attachments` | **INFERRED IR-2** |
| 5.4 | Exhausted credit is a clear message | not a failure on every question | `ask_claude_api` | **INFERRED IR-3** |
| 5.5 | The owner can stop everything at once | a runaway needs one switch | (none) | **INFERRED IR-10** |

---

## 8. INFERRED requirements - the payload

Each was produced by the chain needing something no authored requirement guarantees. Absence is
**proved by grep over every prose surface in the repo** (`README.md`, `desk.py`, `index.html`), not
asserted. Hit counts are from 2026-09-14.

| id | the requirement nobody wrote | grep | hits | real? |
|---|---|---|---|---|
| **IR-1** | One user must have a spend ceiling, enforced before the call | `quota`, `spend`, `budget`, `cap per user` | **0, 0, 0, 0** | **YES** - measured: the only limit is 20 req/60s **per IP**, defeated by a hotspot |
| **IR-2** | The résumé and system prompt must be cached, not re-billed each turn | `cache_control`, `prompt cach` | **0, 0** | **YES** - `_attachments` runs on every request |
| **IR-3** | Exhausted credit must be one clear state, not a failure per question | `credit` | **0** | **YES** - measured 2026-09-11: `400 "credit balance is too low"` |
| **IR-4** | The desk must never submit, and must say so | - | - | partly built (Review copy); no test asserts it |
| **IR-5** | A custom skill must not reach another user's project | `skill` | 7, **all false** - every hit is about *removing* skills from the fenced subprocess | **YES** |
| **IR-6** | Self-editing needs an approval gate and a rollback | `edit its own`, `self-edit` | **0, 0** | **YES** - nothing stops a bad edit breaking the desk for every user |
| **IR-7** | Sign-in must work beyond 100 people | `consent screen`, `verification` | 1 (a comment, not a requirement) | **YES** - Testing mode caps at 100 hand-added users |
| **IR-8** | The seeker must be told when the desk is simply gone | `asleep`, `offline` | 2 (both describe, neither requires) | **YES** |
| **IR-9** | A user must be able to delete their material | `delete my data`, `data deletion` | **0** | **YES** |
| **IR-10** | The owner needs one switch that stops all spending | - | **0** | **YES** |

**10 inferred, 9 of them real defects, 0 present in any authored file** - because there is no
authored file. The chain was not written from the code: if it had been, UC-J5 could not exist at
all, since it describes behaviour with zero implementation.

---

## 9. include vs extend

`include` is mandatory and its arrow points **base → included**. `extend` is optional and its arrow
points **extension → base**. They point opposite ways; this is the most commonly inverted detail in
UML, so it is stated rather than drawn from memory.

- EPIC JD-E1 **includes** UC-J2 (you cannot start without signing in)
- UC-J4 **extends** EPIC JD-E1 (reviewing is the good path, not the only one)
- UC-J5 **includes** nothing and is included by nothing yet - which is itself the finding
