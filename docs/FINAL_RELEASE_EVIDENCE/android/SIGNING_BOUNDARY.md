# Android Production Signing — Boundary

## Status: **BLOCKED_EXTERNAL**

## What was checked

| Item | Result |
|------|--------|
| `android/key.properties` | absent (gitignored) |
| `*.jks` / `*.keystore` in repo / home | none found |
| `METROBUILDER_KEYSTORE` env | unset |
| Gradle signingConfigs.release | only activates if `key.properties` exists |
| Built AAB build **13** | **unsigned** (`jarsigner`: jar is unsigned) |

## Artifact (unsigned, rebuild after IAP gate)

- File: `/opt/cursor/artifacts/store-completion/app-release-UNSIGNED-build13.aab`
- SHA-256: see `aab-build13.sha256`
- applicationId: `com.fidani.metrobuilder`
- versionName: `3.0.0`
- versionCode: **13**

## Exact human action required (then reply to continue)

**Do one of the following on your machine (never commit secrets):**

### If you already have a MetroBuilder upload keystore
1. Place it **outside** the repo (e.g. `~/keys/metrobuilder-upload.jks`)  
2. Create `android/key.properties` locally (already gitignored):

```properties
storePassword=***
keyPassword=***
keyAlias=metrobuilder
storeFile=/absolute/path/to/metrobuilder-upload.jks
```

3. Tell the agent: **“Keystore bereit — Signing fortsetzen”**  
   (do **not** paste passwords into chat)

### If no keystore exists yet
On your machine:

```bash
keytool -genkey -v -keystore ~/keys/metrobuilder-upload.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias metrobuilder
```

Then create `android/key.properties` as above and reply **“Keystore bereit — Signing fortsetzen”**.

Agent will then rebuild **signed** AAB and continue Play Internal upload prep.
