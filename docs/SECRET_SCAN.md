# Secret Scan — 2026-09-22

## Searched patterns

`API_KEY`, `SECRET`, `PASSWORD`, `TOKEN`, `PRIVATE_KEY`, `BEGIN PRIVATE KEY`, keystore passwords, Apple/Google credentials.

## Findings

| Finding | Classification |
|---------|----------------|
| `android/key.properties.example` placeholder passwords | **Fake / template** — clearly marked; real `key.properties` gitignored |
| In-game `tokens` currency field | Game currency — not a secret |
| npm package names containing “token” | Dependency metadata — N/A |
| Docs mentioning keystore steps | Instructions only — no private keys |

## Verdict

**PASS** — no real secrets in repository.
