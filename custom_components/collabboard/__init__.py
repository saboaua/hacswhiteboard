"""CollabBoard - Lightweight collaborative whiteboard for Home Assistant."""
from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

_LOGGER = logging.getLogger(__name__)

DOMAIN = "collabboard"
URL_BASE = "/collabboard-static"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the CollabBoard component."""
    await _async_register_static(hass)
    _async_register_panel(hass)
    _LOGGER.info("CollabBoard ready – open /collabboard or use the Lovelace card")
    return True


async def _async_register_static(hass: HomeAssistant) -> None:
    """Serve the whiteboard HTML/JS from the best available location."""
    candidates = [
        # When the whole repo is in config/ (manual install)
        Path(hass.config.config_dir) / "www" / "collabboard",
        # When installed as custom_component + www next to it
        Path(__file__).parent.parent.parent / "www" / "collabboard",
        # Files shipped inside the component itself
        Path(__file__).parent / "www",
        # HACS default location for frontend files
        Path(hass.config.config_dir) / "www" / "community" / "collabboard",
    ]

    root = None
    for path in candidates:
        if path.exists() and (path / "index.html").exists():
            root = path
            break

    if root is None:
        _LOGGER.error(
            "CollabBoard static files not found. "
            "Please copy www/collabboard/ into your HA config/www/ folder."
        )
        return

    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                URL_BASE,
                str(root),
                cache_headers=False,
            )
        ]
    )
    _LOGGER.info("CollabBoard static files served from %s → %s", root, URL_BASE)


def _async_register_panel(hass: HomeAssistant) -> None:
    """Add a sidebar panel that opens the whiteboard."""
    try:
        hass.components.frontend.async_register_built_in_panel(
            component_name="iframe",
            sidebar_title="CollabBoard",
            sidebar_icon="mdi:draw",
            frontend_url_path="collabboard",
            config={
                "url": f"{URL_BASE}/index.html?board=home-assistant&embed=1",
                "title": "CollabBoard",
            },
            require_admin=False,
        )
    except ValueError:
        # Already registered
        pass
