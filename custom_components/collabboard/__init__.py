"""CollabBoard - Lightweight collaborative whiteboard for Home Assistant.

Automatically adds a sidebar panel when the integration is enabled.
No manual configuration or YAML required.
"""
from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN, PANEL_URL_PATH, URL_BASE

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up from configuration.yaml (legacy support)."""
    # If the user still has "collabboard:" in YAML we register everything
    if DOMAIN in config:
        await _async_setup_common(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up CollabBoard from a config entry (UI / HACS)."""
    await _async_setup_common(hass)
    _LOGGER.info(
        "CollabBoard ready – sidebar panel added at /%s", PANEL_URL_PATH
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the integration and remove the sidebar panel."""
    try:
        frontend.async_remove_panel(hass, PANEL_URL_PATH)
    except Exception:  # noqa: BLE001
        pass
    return True


async def _async_setup_common(hass: HomeAssistant) -> None:
    """Shared setup: static files + sidebar panel."""
    await _async_register_static(hass)
    _async_register_panel(hass)


async def _async_register_static(hass: HomeAssistant) -> None:
    """Serve the whiteboard HTML/JS from the best available location."""
    candidates = [
        # Preferred: files that HACS places under www/community
        Path(hass.config.config_dir) / "www" / "community" / "hacswhiteboard" / "www" / "collabboard",
        Path(hass.config.config_dir) / "www" / "community" / "collabboard",
        # Manual install: config/www/collabboard
        Path(hass.config.config_dir) / "www" / "collabboard",
        # Files shipped inside the custom_component itself
        Path(__file__).parent / "www",
        # Repo-root www when the whole repo is copied
        Path(__file__).parent.parent.parent / "www" / "collabboard",
    ]

    root = None
    for path in candidates:
        if path.exists() and (path / "index.html").exists():
            root = path
            break

    if root is None:
        _LOGGER.error(
            "CollabBoard static files not found. "
            "Make sure the integration was installed correctly via HACS."
        )
        return

    # Avoid double-registration
    if not hass.data.get(DOMAIN, {}).get("static_registered"):
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    URL_BASE,
                    str(root),
                    cache_headers=False,
                )
            ]
        )
        hass.data.setdefault(DOMAIN, {})["static_registered"] = True
        _LOGGER.info("CollabBoard static files served from %s → %s", root, URL_BASE)


def _async_register_panel(hass: HomeAssistant) -> None:
    """Add CollabBoard to the Home Assistant sidebar automatically."""
    # Remove any previous registration so we can re-register cleanly
    try:
        frontend.async_remove_panel(hass, PANEL_URL_PATH)
    except Exception:  # noqa: BLE001
        pass

    frontend.async_register_built_in_panel(
        hass,
        component_name="iframe",
        sidebar_title="CollabBoard",
        sidebar_icon="mdi:draw",
        frontend_url_path=PANEL_URL_PATH,
        config={
            "url": f"{URL_BASE}/index.html?board=home-assistant&embed=1",
            "title": "CollabBoard",
        },
        require_admin=False,
    )
    _LOGGER.debug("Sidebar panel 'CollabBoard' registered at /%s", PANEL_URL_PATH)
