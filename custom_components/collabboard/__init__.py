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
    if DOMAIN in config:
        await _async_setup_common(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up CollabBoard from a config entry (UI / HACS)."""
    hass.data.setdefault(DOMAIN, {})
    await _async_setup_common(hass)
    _LOGGER.info(
        "CollabBoard ready – open the sidebar item or /%s", PANEL_URL_PATH
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the integration and remove the sidebar panel."""
    try:
        frontend.async_remove_panel(hass, PANEL_URL_PATH)
    except Exception:  # noqa: BLE001
        _LOGGER.debug("Panel already removed or not registered", exc_info=True)
    hass.data.pop(DOMAIN, None)
    return True


async def _async_setup_common(hass: HomeAssistant) -> None:
    """Shared setup: static files + sidebar panel + optional Lovelace resource."""
    await _async_register_static(hass)
    _async_register_panel(hass)
    _async_register_lovelace_resource(hass)


async def _async_register_static(hass: HomeAssistant) -> None:
    """Serve the whiteboard from the integration's own www folder."""
    candidates = [
        Path(__file__).parent / "www",
        Path(hass.config.config_dir)
        / "www"
        / "community"
        / "hacswhiteboard"
        / "www"
        / "collabboard",
        Path(hass.config.config_dir) / "www" / "community" / "collabboard",
        Path(hass.config.config_dir) / "www" / "collabboard",
        Path(__file__).parent.parent.parent / "www" / "collabboard",
    ]

    root = None
    for path in candidates:
        try:
            if path.is_dir() and (path / "index.html").is_file():
                root = path.resolve()
                break
        except OSError:
            continue

    if root is None:
        _LOGGER.error(
            "CollabBoard static files not found under custom_components/collabboard/www. "
            "Reinstall the integration via HACS."
        )
        return

    data = hass.data.setdefault(DOMAIN, {})
    if data.get("static_registered"):
        _LOGGER.debug("Static paths already registered")
        return

    try:
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    URL_BASE,
                    str(root),
                    cache_headers=False,
                )
            ]
        )
        data["static_registered"] = True
        data["static_root"] = str(root)
        _LOGGER.info("CollabBoard static files: %s → %s", root, URL_BASE)
    except Exception:  # noqa: BLE001
        # Path may already be registered after a reload
        _LOGGER.warning(
            "Could not register static path %s (may already exist)",
            URL_BASE,
            exc_info=True,
        )
        data["static_registered"] = True


def _async_register_panel(hass: HomeAssistant) -> None:
    """Add CollabBoard to the Home Assistant sidebar."""
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
    _LOGGER.debug("Sidebar panel registered at /%s", PANEL_URL_PATH)


def _async_register_lovelace_resource(hass: HomeAssistant) -> None:
    """Expose the Lovelace card JS so it can be loaded without manual resource setup.

    HA stores extra module URLs in hass.data; adding here makes the card available
    after a refresh when the integration is loaded.
    """
    card_url = f"{URL_BASE}/collabboard-card.js"
    try:
        extra = hass.data.setdefault("frontend_extra_module_url", set())
        if isinstance(extra, set):
            extra.add(card_url)
            _LOGGER.debug("Registered Lovelace module %s", card_url)
    except Exception:  # noqa: BLE001
        _LOGGER.debug("Could not register Lovelace module URL", exc_info=True)
