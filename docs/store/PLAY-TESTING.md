# Google Play testing checklist (v4.2.0, versionCode 54)

สรุป: ส่ง APK ให้เพื่อนลองได้ทันทีจาก CI เดิม ถ้าจะขึ้น Play (Internal/Closed testing) ทำตามลิสต์นี้

## Already done in the repo
- [x] Version 4.2.0 / versionCode 54, build label "4.2 product cards" (shown in Company › Settings)
- [x] Settings › "Send feedback" shares version, device and in-game state (no network used)
- [x] Android permissions trimmed: no microphone, storage, overlay or background service.
      Final app asks only for INTERNET, VIBRATE, MODIFY_AUDIO_SETTINGS (all install-time, no prompts)
- [x] `eas.json` production profile builds an **AAB**; manual workflow
      `.github/workflows/android-play-aab.yml`
- [x] Privacy policy page (TH/EN, same format as ผีกินหัว): `docs/privacy/index.html`
- [x] Beginner guide covers the lab → product card → production line loop (unlocks at rank 2)
- [x] Settings › "Scenery motion off" for slow phones (stops ambient traffic, people, sea life)

## You need to do (accounts and uploads)
1. **Upload key / first AAB:** on your PC run `npx eas-cli build -p android --profile production`
   once (EAS creates the keystore). Then add repo secret `EXPO_TOKEN` to use the workflow.
2. **Host the privacy policy** the same way as ผีกินหัว: `Refinery-Story` is private, and GitHub
   Pages on a private repo needs a paid plan, so use a separate PUBLIC repo `refinery-story-privacy`
   with this `index.html` at its root, then Settings › Pages › Deploy from branch `main` / root.
   URL: `https://saranaauttama-afk.github.io/refinery-story-privacy/` (source stays in
   `docs/privacy/index.html`; update both when it changes).
3. **Play Console › Create app:** package `com.refinerystory.u2` (already in app.json; it can't
   change after the first upload).
4. **Testing › Internal testing:** create a release, upload the `.aab`, add tester emails.
5. **App content forms:**
   - Data safety: *No data collected, no data shared*.
   - Ads: *No ads*.
   - Content rating: simulation/management, no violence, no user interaction, no purchases.
   - Target audience: 13+ is the simplest choice (avoids Families policy requirements).
6. **Store listing:** short and full description, icon 512×512, feature graphic 1024×500,
   2–8 phone screenshots (see `docs/art/GPT-PROMPTS-4.2.md` for icon/feature art prompts).

## Things to watch in the first test round
- Slow phones with many trucks (cap is 24): if it lags, try Scenery motion off and report.
- First 15 minutes: does the guide make sense up to the first product card?
- Old saves from 4.1.x load (labs that were switched to mixing become Product Labs).
