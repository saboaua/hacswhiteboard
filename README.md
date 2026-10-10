# CollabBoard – Collaborative Whiteboard for Home Assistant (HACS)

A lightweight real-time collaborative whiteboard (Miro-like) that appears **automatically in the Home Assistant sidebar** after installation.

Perfect for family planning, shopping lists, kids homework boards, team stand-ups, or just doodling together from any device in the house.

## Features

- **Automatic sidebar panel** – no YAML, no manual panel configuration
- Infinite canvas with pan & zoom
- Pen, shapes, sticky notes, text, arrows
- Real-time multi-user collaboration (WebRTC via Yjs)
- Colored presence cursors + user list
- Shareable board links
- Dark modern UI

## Installation (HACS)

1. **HACS** → **Integrations** → ⋮ → **Custom repositories**
2. Add: `https://github.com/saboaua/hacswhiteboard`  
   Category: **Integration**
3. Search for **CollabBoard** and install
4. **Restart Home Assistant**
5. Go to **Settings → Devices & Services → Add Integration** → search **CollabBoard** → click it
6. The **CollabBoard** item appears in the sidebar automatically 🎉

That’s it – no YAML, no extra configuration.

### Alternative: YAML (optional)

```yaml
# configuration.yaml
collabboard:
```

Restart HA. The sidebar panel will appear.

## Using the whiteboard

- Click **CollabBoard** in the sidebar (icon: draw)
- Or open `/collabboard`
- Share the same board with other devices – everyone draws in real time

### Optional: Lovelace card

You can also embed the whiteboard in any dashboard:

1. Add the resource (Settings → Dashboards → Resources):
   ```
   /hacsfiles/hacswhiteboard/lovelace/collabboard-card.js
   ```
2. Add a card:

```yaml
type: custom:collabboard-card
board_id: family-shopping
height: 600px
title: Family Board
```

## Multiple boards

Use different `board_id` values. Anyone opening the same ID collaborates in real time.

## Standalone version

The pure HTML version lives in `www/collabboard/index.html` and can be opened directly in a browser.

## Credits

Built on Konva.js + Yjs. Designed to be extremely light compared to full Miro alternatives.
