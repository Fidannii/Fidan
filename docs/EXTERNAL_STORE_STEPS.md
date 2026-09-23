# External Store Steps Checklist — RC1 Hardened

**Decision context:** `RC_READY_WITH_EXTERNAL_STORE_STEPS`

## APPLE

1. [ ] Apple Developer Program account active
2. [ ] Create App in App Store Connect (`com.fidani.metrobuilder`)
3. [ ] Certificates / Profiles / Team signing in Xcode
4. [ ] On Mac: `npm ci && npm run cap:sync && cd ios/App && pod install && open App.xcworkspace`
5. [ ] Xcode Archive (Release) → Upload
6. [ ] TestFlight Internal
7. [ ] IAP Sandbox (see `APPLE_SANDBOX_TEST_PLAN.md`)
8. [ ] Metadata: name, subtitle, description, keywords, screenshots
9. [ ] Age Rating questionnaire (see `AGE_RATING_QUESTIONNAIRE_PREP.md`)
10. [ ] Privacy Policy URL + Privacy Nutrition Labels
11. [ ] Submit for Review
12. [ ] Release (manual or phased)

## GOOGLE

1. [ ] Play Console account / payments profile
2. [ ] Create app `com.fidani.metrobuilder`
3. [ ] Local keystore → signed AAB (`HOCHLADEN.md`)
4. [ ] Store listing (DE/EN from `store/`)
5. [ ] Data Safety form (`GOOGLE_PLAY_DATA_SAFETY_PREP.md`)
6. [ ] Content rating questionnaire
7. [ ] Internal testing track
8. [ ] Closed testing if required for production access
9. [ ] Production access checklist complete
10. [ ] Review
11. [ ] Release

## Shared

- [ ] Real device script (`REAL_DEVICE_TEST_SCRIPT.md`)
- [ ] Feature freeze: P0/P1 only after RC
- [ ] Support + Privacy URLs reachable
