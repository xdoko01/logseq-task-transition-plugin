# Changelog

## [0.2.0] — 2026-04-21

### Fixed
- **Plugin was not adding any properties** — the datom attribute used to detect marker changes was `"block/marker"` but the code was checking for `":block/marker"` (with a leading colon). No transitions were ever detected. This is the primary bug fix that makes the plugin actually work.

### Changed
- **`started` is no longer overwritten on subsequent resumes** — if you pause a task (DOING → TODO) and restart it (TODO → DOING), the original `started` timestamp is preserved. Previously every resume would update the timestamp.

### Added
- **Per-rule overwrite toggles in plugin settings** — four new boolean settings, one per default rule, let you control whether the property is overwritten if it already exists:
  - *TODO → DOING: overwrite 'started' if already set* (default: off)
  - *LATER → NOW: overwrite 'started' if already set* (default: off)
  - *DOING → DONE: overwrite 'completed' if already set* (default: on)
  - *NOW → DONE: overwrite 'completed' if already set* (default: on)

---

## [0.1.0] — 2026-04-17

Initial release.

- Detects task marker transitions via `logseq.DB.onChanged`
- Four built-in rules: TODO→DOING, LATER→NOW, DOING→DONE, NOW→DONE
- Configurable via LogSeq plugin settings: enable/disable each rule, custom rules JSON, excluded pages, date format
- Supports LogSeq journal-link date format (`[[Apr 17th, 2026]] 12:05`)
