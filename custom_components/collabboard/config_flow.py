"""Config flow for CollabBoard – allows adding the integration from the UI."""
from __future__ import annotations

from homeassistant import config_entries
from homeassistant.data_entry_flow import FlowResult

from .const import DOMAIN


class CollabBoardConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for CollabBoard."""

    VERSION = 1

    async def async_step_user(self, user_input=None) -> FlowResult:
        """Handle the initial step – single click to add."""
        # Only allow one instance
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            return self.async_create_entry(
                title="CollabBoard Whiteboard",
                data={},
            )

        # Show a simple confirmation form (no options needed)
        return self.async_show_form(step_id="user")

    async def async_step_import(self, import_info) -> FlowResult:
        """Handle import from configuration.yaml."""
        return await self.async_step_user(import_info)
