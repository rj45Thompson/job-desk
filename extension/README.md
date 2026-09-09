# Job Desk - Chrome extension

Signs you in to your desk as **the Google account this Chrome is signed into**, with no OAuth
client id, no Cloud project and no consent screen.

## Install (30 seconds, once)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. **Load unpacked** → choose this folder: `D:\code\job-desk\extension`
4. Click the puzzle-piece icon → pin **Job Desk**

Click the icon. It shows three things, because every failure in this project has been one of them
being false while the screen said something vaguer:

* whether Chrome is signed into Google,
* whether the desk on this computer is answering,
* whether you are signed in to it.

Then press **Sign in**.

## How the sign-in works, and what it is not

`chrome.identity.getProfileUserInfo()` is Chrome's own answer to "whose browser is this". No token
is exchanged, so the desk trusts the extension's word for the address - which is reasonable for an
extension you installed on your own computer to reach your own desk, and is not a front door for a
hosted product. The stronger route already exists in `desk.py`: `/signin` takes a real Google ID
token and `google_identity()` verifies it with Google. Set `GOOGLE_CLIENT_ID` in `.env` to use it.

## What it does not do yet

Fill job application forms. That is the next piece: content scripts for LinkedIn, Indeed, then the
ATS platforms (Greenhouse, Lever, Ashby, Workday). The rule it will be built to is the one RJ set -
**it fills and shows you; you press submit.**
