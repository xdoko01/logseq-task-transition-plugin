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

Properties are **always overwritten** — cycling a task back and forth updates
the timestamp each time.

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

| Setting | Description |
|---|---|
| **TODO → DOING: add 'started'** | Toggle this default rule on/off |
| **LATER → NOW: add 'started'** | Toggle this default rule on/off |
| **DOING → DONE: add 'completed'** | Toggle this default rule on/off |
| **NOW → DONE: add 'completed'** | Toggle this default rule on/off |
| **Custom rules (JSON)** | Add your own transition rules (see below) |
| **Excluded pages** | Comma-separated pages/namespaces to skip |
| **Date format** | `datetime` (date + time) or `date` (date only) |

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
