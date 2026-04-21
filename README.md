# LogSeq Task Transition Plugin

Automatically adds properties to your tasks when their status changes.

**Example:** When you click a `TODO` task to move it to `DOING`, the plugin
immediately adds `started:: [[Apr 17th, 2026]] 12:05` to that block.

## Default behaviour

| Status change | Property added / updated |
|---|---|
| `TODO` → `DOING` | `started:: [[date]] HH:mm` |
| `LATER` → `NOW` | `started:: [[date]] HH:mm` |
| `DOING` → `DONE` | `completed:: [[date]] HH:mm` |
| `NOW` → `DONE` | `completed:: [[date]] HH:mm` |

By default, `started` is **set once and never changed** — pausing and resuming a task preserves the original start time. `completed` is **always updated** to the latest finish time. Both behaviours are configurable per rule in the plugin settings.

## Installation

### From the LogSeq Marketplace (recommended)
1. Open LogSeq → Settings (⚙️) → Plugins
2. Search for **Task Transition Properties**
3. Click **Install**

### Manual installation
1. Download the latest `dist.zip` from the [Releases](../../releases) page
2. Unzip it anywhere on your computer
3. Open LogSeq → Settings → Plugins → Enable developer mode
4. Click **Load unpacked plugin** and select the unzipped folder

## Configuration

Open LogSeq → Settings → Plugins → Task Transition Properties.

| Setting | Default | Description |
|---|---|---|
| **TODO → DOING: add 'started'** | on | Toggle this default rule on/off |
| **TODO → DOING: overwrite 'started' if already set** | off | When off, `started` is set only the first time; turn on to update it on every resume |
| **LATER → NOW: add 'started'** | on | Toggle this default rule on/off |
| **LATER → NOW: overwrite 'started' if already set** | off | Same as above for the LATER→NOW variant |
| **DOING → DONE: add 'completed'** | on | Toggle this default rule on/off |
| **DOING → DONE: overwrite 'completed' if already set** | on | When on, `completed` is always updated to the latest finish time; turn off to keep the original |
| **NOW → DONE: add 'completed'** | on | Toggle this default rule on/off |
| **NOW → DONE: overwrite 'completed' if already set** | on | Same as above for the NOW→DONE variant |
| **Custom rules (JSON)** | — | Add your own transition rules (see below) |
| **Excluded pages** | — | Comma-separated pages/namespaces to skip |
| **Date format** | datetime | `datetime` (date + time) or `date` (date only) |

### Adding custom rules

Paste a JSON array into the **Custom rules** setting field:

```json
[
  {
    "from": "TODO",
    "to": "CANCELLED",
    "property": "cancelled",
    "overwrite": true
  }
]
```

| Field | Required | Description |
|---|---|---|
| `from` | yes | Old task state (uppercase): `TODO`, `DOING`, `DONE`, `WAITING`, `LATER`, `NOW`, `CANCELLED` |
| `to` | yes | New task state (uppercase) |
| `property` | yes | Property name to add/update (without `::`) |
| `overwrite` | no | `true` (default) = always update; `false` = only set once |

### Excluding pages

In the **Excluded pages** field, enter a comma-separated list. Use a trailing
`/` to exclude an entire namespace:

```
templates/, inbox, scratch
```

## Supported task markers

`TODO` · `DOING` · `DONE` · `WAITING` · `LATER` · `NOW` · `CANCELLED`

## Licence

MIT
