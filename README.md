# CollabBoard – Collaborative Whiteboard for Home Assistant (HACS)

A lightweight real-time collaborative whiteboard (Miro-like) that you can embed in Home Assistant dashboards or open as a full panel.

Perfect for family planning, shopping lists, kids homework boards, team stand-ups, or just doodling together from any device in the house.

## Features

- Infinite canvas with pan & zoom
- Pen, shapes, sticky notes, text, arrows
- Real-time multi-user collaboration (WebRTC via Yjs)
- Colored presence cursors + user list
- Shareable board links
- Works fully offline after first load (except peer discovery)
- Dark modern UI

## Installation (HACS)

1. Add this repository as a **custom repository** in HACS (Integration type is fine).
2. Search for **CollabBoard** and install.
3. Restart Home Assistant.
4. Add the Lovelace card or open the sidebar panel.

### Option A – Lovelace Card (recommended for testing)

Add a manual card:

```yaml
type: custom:collabboard-card
board_id: family-shopping
height: 600px
title: Family Board
```

### Option B – Full Panel

After installing the integration a sidebar item **CollabBoard** appears (or go to `/collabboard`).

You can also add to `configuration.yaml`:

```yaml
collabboard:
```

## Configuration

### Lovelace Card options

| Option        | Type   | Default     | Description                     |
|---------------|--------|-------------|---------------------------------|
| `board_id`    | string | random      | Unique board identifier         |
| `height`      | string | `560px`     | Height of the card              |
| `title`       | string | CollabBoard | Card title                      |
| `show_header` | bool   | true        | Show/hide the card header       |

### Multiple boards

Just use different `board_id` values. Anyone who opens the same board_id (from HA or the standalone HTML) will collaborate in real time.

## Testing

1. Install via HACS or copy the folders manually.
2. Add the card to a dashboard.
3. Open the same board on your phone / another browser → draw together.

## Standalone version

The pure HTML version lives in `www/collabboard/index.html` and can be opened directly.

## Credits

Built on Konva.js + Yjs. Designed to be extremely light compared to full Miro alternatives.
