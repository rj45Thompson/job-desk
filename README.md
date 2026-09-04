# Job Desk

A job-application page that talks to the Claude already signed in on your own
computer. Your profile, résumé and applications live in your browser; the
answers come off your Claude subscription through the Claude Code CLI. There
is no API key in this repository, on the page, or on the wire.

**Page:** https://rj45thompson.github.io/job-desk/

```
GitHub Pages (static page)  ──►  a Cloudflare quick tunnel  ──►  desk.py on your computer  ──►  claude -p
```

## Run it

On RJ's machine it runs itself: a Windows scheduled task named **JobDesk**
starts `desk.py up` at every sign-in, windowless, and restarts it if it dies.
The current link is always in `open-me.txt` and at the top of `desk.log`.

```
py desk.py down           stop it cleanly (the task starts it again at next sign-in)
Start-ScheduledTask JobDesk                start it again now
Unregister-ScheduledTask JobDesk -Confirm:$false   remove the task
```

By hand, double-click `Desk.cmd`, or:

```
py desk.py
```

That starts the desk, opens a tunnel, publishes the tunnel address so the page
can find it, and opens the page pointed at this computer. The link it prints
carries the address and the access code, so nothing has to be typed anywhere -
send that link to your phone and the page answers from here. Ctrl-C stops it
and clears the published address.

First run only: `cloudflared.exe` (54 MB, Cloudflare's official release) is
fetched into this folder, and an access code is generated into `.env`. Both are
gitignored.

If the chat says the CLI is signed out:

```
py desk.py login
```

A browser opens once; after that the CLI refreshes its own login as long as it
is used.

```
py desk.py check          what works and what does not, nothing started
py desk.py check --ask    ...and one real question through the whole chain
py desk.py serve          this machine only, no tunnel
py desk.py down           stop a running desk cleanly; after one that was killed,
                          end its orphaned tunnel and clear the published address
py desk.py test           the test suite (no network, no real Claude)
```

A desk that starts also ends any orphaned tunnel on its port from an earlier
desk, so a crash never leaves the page pointed at an address that answers
nothing.

## How the page finds the desk

In this order, each probed with `/health` rather than trusted:

1. The address in the link (`#desk=…&code=…`).
2. The address it remembers from last time.
3. `desk.json` beside the page, which the desk writes through the signed-in
   `gh` CLI every time it comes up and clears when it goes down.
4. `http://127.0.0.1:8790`, if the desk is running on the machine the page is
   open on.

A quick tunnel gets a new hostname every run and the old one goes to somebody
else, so a remembered address is a guess until `/health` answers with this
desk's own version.

On the desk's own computer, open http://127.0.0.1:8790/ instead of the public
page: same origin, no tunnel, no code, no browser permission prompts.

## What is exposed

One endpoint, `POST /chat`, behind the access code for anyone who did not
arrive from this computer. The CLI runs with no tools, from a scratch
directory, with a fixed system prompt that nothing the caller sends can reach.
Profile, résumé and posting travel as data inside tags with their angle
brackets stripped. Twenty requests a minute per address, two answers in flight
at once, 40,000 characters a conversation. `/health` is open and carries no
secrets.

Settings live in `.env` (created on first run):

```
DESK_CODE=...             generated; the code in the link
DESK_PORT=8790
DESK_MODEL=opus           any model alias the CLI accepts
PAGE_URL=https://rj45thompson.github.io/job-desk/
PAGES_REPO=rj45Thompson/job-desk
GITHUB_TOKEN=...          copied from gh by the first console run, for the logon task
```

The token line exists because a desk started by the scheduled task cannot read
gh's keyring, even as the same user: `gh auth status` there says it is not
logged in at all. `py desk.py check` or any console `py desk.py` copies the
token gh already has into `.env` once; after that both contexts publish.

`desk.json` on GitHub is written by the desk, so `git pull` before you push
changes of your own.

## Layout

```
index.html    the whole page - no build, no framework, no dependencies
desk.py       the whole desk - Python 3.10+, standard library only
test_desk.py  its tests
desk.json     where the desk currently is; written by desk.py, read by the page
Desk.cmd      double-click launcher
```
