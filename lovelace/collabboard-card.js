/**
 * CollabBoard Card – Lovelace custom card for Home Assistant
 * Embeds the collaborative whiteboard.
 *
 * Usage:
 * type: custom:collabboard-card
 * board_id: family-board
 * height: 650px
 * title: Family Planning
 */

class CollabBoardCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("collabboard-card-editor");
  }

  static getStubConfig() {
    return {
      board_id: "home-assistant",
      height: "560px",
      title: "CollabBoard",
      show_header: true,
    };
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = {
      board_id: "home-assistant",
      height: "560px",
      title: "CollabBoard",
      show_header: true,
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  getCardSize() {
    // Approximate size for layout engine
    const h = parseInt(this._config?.height || "500", 10);
    return Math.max(3, Math.ceil(h / 50));
  }

  _render() {
    if (!this._config) return;

    const boardId = encodeURIComponent(this._config.board_id || "home-assistant");
    // Prefer the static path registered by the integration, fall back to local www
    const base = "/collabboard-static/index.html";
    const src = `${base}?board=${boardId}&embed=1`;

    this.innerHTML = `
      <ha-card>
        ${
          this._config.show_header !== false
            ? `<div class="card-header" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px 8px;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <ha-icon icon="mdi:draw" style="color:var(--primary-color)"></ha-icon>
                  <span style="font-weight:500;">${this._escape(this._config.title)}</span>
                </div>
                <a href="${src}" target="_blank" rel="noopener" style="font-size:12px;color:var(--secondary-text-color);text-decoration:none;">
                  Open fullscreen ↗
                </a>
              </div>`
            : ""
        }
        <div style="position:relative;width:100%;height:${this._escape(this._config.height)};overflow:hidden;border-radius:0 0 var(--ha-card-border-radius,12px) var(--ha-card-border-radius,12px);">
          <iframe
            src="${src}"
            style="width:100%;height:100%;border:none;display:block;background:#0f1115;"
            allow="clipboard-write; fullscreen"
            loading="lazy"
            title="CollabBoard Whiteboard"
          ></iframe>
        </div>
      </ha-card>
    `;
  }

  _escape(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

// Simple visual editor (optional but nice for HACS)
class CollabBoardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  _render() {
    if (!this._config) return;
    this.innerHTML = `
      <div style="padding:16px;display:flex;flex-direction:column;gap:12px;">
        <ha-textfield
          label="Board ID"
          .value="${this._config.board_id || ""}"
          placeholder="e.g. family-shopping"
          style="width:100%"
        ></ha-textfield>
        <ha-textfield
          label="Title"
          .value="${this._config.title || ""}"
          style="width:100%"
        ></ha-textfield>
        <ha-textfield
          label="Height"
          .value="${this._config.height || "560px"}"
          placeholder="560px or 70vh"
          style="width:100%"
        ></ha-textfield>
        <ha-formfield label="Show header">
          <ha-switch
            .checked="${this._config.show_header !== false}"
          ></ha-switch>
        </ha-formfield>
        <p style="font-size:12px;color:var(--secondary-text-color);margin:0;">
          Use the same Board ID on multiple devices / cards to collaborate in real time.
        </p>
      </div>
    `;

    // Wire events
    const fields = this.querySelectorAll("ha-textfield");
    const switchEl = this.querySelector("ha-switch");

    const fire = () => {
      const newConfig = {
        ...this._config,
        board_id: fields[0].value || "home-assistant",
        title: fields[1].value || "CollabBoard",
        height: fields[2].value || "560px",
        show_header: switchEl.checked,
      };
      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config: newConfig },
          bubbles: true,
          composed: true,
        })
      );
    };

    fields.forEach((f) => f.addEventListener("change", fire));
    fields.forEach((f) => f.addEventListener("input", fire));
    if (switchEl) switchEl.addEventListener("change", fire);
  }
}

customElements.define("collabboard-card", CollabBoardCard);
customElements.define("collabboard-card-editor", CollabBoardCardEditor);

// Register with Lovelace
window.customCards = window.customCards || [];
window.customCards.push({
  type: "collabboard-card",
  name: "CollabBoard Whiteboard",
  description: "Real-time collaborative whiteboard (Miro-like). Share the same board_id to draw together.",
  preview: true,
  documentationURL: "https://github.com/saboaua/hacswhiteboard",
});

console.info(
  "%c CollabBoard %c 1.0.0 ",
  "color:#fff;background:#6366f1;padding:2px 6px;border-radius:4px 0 0 4px",
  "color:#fff;background:#1a1d24;padding:2px 6px;border-radius:0 4px 4px 0"
);
