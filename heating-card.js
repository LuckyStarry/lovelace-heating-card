/**
 * 地暖控制卡片 v2 — 重新设计
 * 设计原则：跟随 HA 主题变量、信息层级清晰、250~520px 响应式
 * 功能：预设模式（离家/在家/睡眠/节能/手动）/ 温度±1 / 电源开关（全保留）
 * 使用方式: type: custom:heating-card
 */
class HeatingCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
    this._entity = null;
    this._initialRender = false;
  }

  static getConfigElement() {
    return document.createElement("heating-card-editor");
  }

  static getStubConfig(hass, entities) {
    const climateEntities = entities.filter((e) => e.startsWith("climate."));
    return { entity: climateEntities[0] || "", name: "地暖" };
  }

  setConfig(config) {
    if (!config.entity) throw new Error("请指定实体 (entity)");
    this._config = config;
    if (this._initialRender) {
      this._updateEntities();
      this._render();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (this._initialRender) {
      this._updateEntities();
      this._render();
    }
  }

  get hass() { return this._hass; }

  connectedCallback() {
    this._initialRender = true;
    if (this._config && this._hass) {
      this._updateEntities();
      this._render();
    }
  }

  _updateEntities() {
    if (!this._hass || !this._config) return;
    this._entity = this._hass.states[this._config.entity];
  }

  getCardSize() { return 4; }

  _render() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = "";
    this._createStyles();

    const haCard = document.createElement("ha-card");
    haCard.className = this._getCardClass();

    if (!this._entity) {
      const err = document.createElement("div");
      err.className = "error";
      err.textContent = `实体未找到: ${this._config?.entity || "未知"}`;
      haCard.appendChild(err);
      this.shadowRoot.appendChild(haCard);
      return;
    }

    const attrs = this._entity.attributes;
    const isOff = this._entity.state === "off";
    const currentTemp = attrs.current_temperature;
    const targetTemp = attrs.temperature;
    const preset = attrs.preset_mode || "";
    const hvacAction = attrs.hvac_action;
    const heating = hvacAction === "heating" || hvacAction === "heat";

    // 状态副行
    let subtitle;
    if (isOff) {
      subtitle = `已关机${currentTemp != null ? " · 当前 " + Math.round(currentTemp) + "℃" : ""}`;
    } else {
      const actionTxt = heating ? "🔥 加热中" : currentTemp != null && targetTemp != null && currentTemp >= targetTemp ? "✓ 已达标" : "待机";
      subtitle = `<span class="mode-txt">${preset || "—"}</span><span class="dot">·</span>当前 ${currentTemp != null ? Math.round(currentTemp) : "—"}℃<span class="dot">·</span>${actionTxt}`;
    }

    const content = document.createElement("div");
    content.className = "card-content";

    // ── header：图标 + 名称/状态行 + 开关
    const header = document.createElement("div");
    header.className = "header";
    const info = document.createElement("div");
    info.className = "header-info";
    const iconBox = document.createElement("div");
    iconBox.className = "header-icon" + (heating ? " heating" : "");
    iconBox.innerHTML = '<ha-icon icon="mdi:heating-coil"></ha-icon>';
    const text = document.createElement("div");
    text.className = "header-text";
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = this._config.name || "地暖";
    const sub = document.createElement("div");
    sub.className = "subtitle";
    sub.innerHTML = subtitle;
    text.appendChild(name);
    text.appendChild(sub);
    info.appendChild(iconBox);
    info.appendChild(text);

    const toggle = document.createElement("ha-switch");
    toggle.checked = !isOff;
    toggle.addEventListener("change", (e) => this._handlePowerToggle(e.target.checked));

    header.appendChild(info);
    header.appendChild(toggle);

    // ── 设定温度居中区（±1，跟随实体 step/min/max）
    const zone = document.createElement("div");
    zone.className = "temp-zone";
    const minus = document.createElement("button");
    minus.className = "step-btn";
    minus.disabled = isOff;
    minus.innerHTML = '<ha-icon icon="mdi:minus"></ha-icon>';
    minus.addEventListener("click", () => this._handleTempChange(-1));
    const disp = document.createElement("div");
    disp.className = "temp-display";
    const val = document.createElement("div");
    val.className = "temp-value" + (heating ? " heating-txt" : "");
    val.innerHTML = isOff || targetTemp == null ? `<small>—</small>` : `${Math.round(targetTemp)}<small>℃</small>`;
    const lab = document.createElement("div");
    lab.className = "temp-label";
    lab.textContent = heating ? "设定温度 · 加热中" : "设定温度";
    disp.appendChild(val);
    disp.appendChild(lab);
    const plus = document.createElement("button");
    plus.className = "step-btn";
    plus.disabled = isOff;
    plus.innerHTML = '<ha-icon icon="mdi:plus"></ha-icon>';
    plus.addEventListener("click", () => this._handleTempChange(1));
    zone.appendChild(minus);
    zone.appendChild(disp);
    zone.appendChild(plus);

    // ── 预设模式 pills（实体 preset_modes 动态）
    const presetRow = document.createElement("div");
    presetRow.className = "chips-row";
    const presetModes = attrs.preset_modes || ["离家", "在家", "睡眠", "节能", "手动"];
    presetModes.forEach((p) => {
      const b = document.createElement("button");
      b.className = `mode-pill ${preset === p && !isOff ? "active" : ""}`;
      b.disabled = isOff;
      b.innerHTML = `<ha-icon icon="${this._getPresetIcon(p)}"></ha-icon><span>${p}</span>`;
      b.addEventListener("click", () => this._handlePresetChange(p));
      presetRow.appendChild(b);
    });

    content.appendChild(header);
    content.appendChild(zone);
    content.appendChild(presetRow);
    haCard.appendChild(content);
    this.shadowRoot.appendChild(haCard);
  }

  _createStyles() {
    const style = document.createElement("style");
    style.textContent = `
      :host { display: block; }
      .heating-card {
        display: block;
        padding: 14px 16px;
        min-height: 268px; box-sizing: border-box;
        box-sizing: border-box;
        border-radius: var(--ha-card-border-radius, 12px);
        background: var(--ha-card-background, var(--card-background-color, #fff));
        box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,.08));
        color: var(--primary-text-color);
        --heat-accent: var(--primary-color);
      }
      :host { display: block; container-type: inline-size; }
      @container (max-width: 320px) {
        .temp-zone { gap: 12px; padding: 12px 0 8px; }
        .step-btn {
          width: 30px; height: 30px;
          min-width: 30px; min-height: 30px;
          max-width: 30px; max-height: 30px;
        }
        .step-btn ha-icon { --mdc-icon-size: 17px; }
        .temp-value { font-size: 34px; }
        .temp-value small { font-size: 17px; }
        .temp-display { min-width: 84px; }
      }
      .heating-card.off { --heat-accent: var(--secondary-text-color); }

      .header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
      .header-info { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .header-icon {
        width: 36px; height: 36px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: color-mix(in srgb, var(--heat-accent) 14%, transparent);
        color: var(--heat-accent); flex: none;
      }
      .header-icon ha-icon { --mdc-icon-size: 22px; }
      .header-icon.heating {
        background: color-mix(in srgb, #FF6B35 18%, transparent);
        color: #FF6B35;
        animation: heat-pulse 2.2s ease-in-out infinite;
      }
      @keyframes heat-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,53,.25); }
        50% { box-shadow: 0 0 0 8px rgba(255,107,53,0); }
      }
      .header-text { display: flex; flex-direction: column; min-width: 0; }
      .name { font-size: 15px; font-weight: 600; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .subtitle {
        font-size: 12px; line-height: 1.4; margin-top: 1px;
        color: var(--secondary-text-color);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .subtitle .dot { margin: 0 3px; opacity: .6; }
      .subtitle .mode-txt { color: var(--heat-accent); font-weight: 500; }

      .temp-zone {
        display: flex; align-items: center; justify-content: center;
        gap: 18px; padding: 14px 0 10px;
      }
      .step-btn {
        width: 36px; height: 36px;
        min-width: 36px; min-height: 36px;
        max-width: 36px; max-height: 36px;
        box-sizing: border-box;
        aspect-ratio: 1;
        border-radius: 9999px;
        border: 1px solid var(--divider-color, rgba(0,0,0,.12));
        background: transparent; color: var(--primary-text-color);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all .18s ease; padding: 0; line-height: 1;
      }
      .step-btn ha-icon { --mdc-icon-size: 20px; pointer-events: none; }
      .step-btn:hover:not(:disabled) {
        background: color-mix(in srgb, var(--heat-accent) 14%, transparent);
        border-color: var(--heat-accent); color: var(--heat-accent);
      }
      .step-btn:disabled { opacity: .35; cursor: not-allowed; }
      .temp-display { display: flex; flex-direction: column; align-items: center; min-width: 96px; }
      .temp-value {
        font-size: 42px; font-weight: 300; line-height: 1.05;
        font-variant-numeric: tabular-nums; color: var(--primary-text-color);
        transition: opacity .2s ease;
      }
      .temp-value small { font-size: 20px; font-weight: 400; }
      .temp-value.heating-txt { color: #FF6B35; }
      .temp-label {
        font-size: 11px; color: var(--secondary-text-color);
        letter-spacing: 2px; margin-top: 2px;
      }

      .chips-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
      .mode-pill {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 5px 12px; border-radius: 17px;
        border: 1px solid var(--divider-color, rgba(0,0,0,.12));
        background: transparent; color: var(--secondary-text-color);
        font-size: 13px; cursor: pointer; transition: all .18s ease;
      }
      .mode-pill ha-icon { --mdc-icon-size: 16px; pointer-events: none; }
      .mode-pill:hover:not(:disabled):not(.active) {
        background: color-mix(in srgb, var(--primary-text-color) 7%, transparent);
        color: var(--primary-text-color);
      }
      .mode-pill.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: #fff; font-weight: 500;
      }
      .mode-pill:disabled { opacity: .38; cursor: not-allowed; }

      .error { padding: 16px; color: var(--error-color); }
    `;
    this.shadowRoot.appendChild(style);
  }

  _getCardClass() {
    const isOff = this._entity?.state === "off";
    return `heating-card ${isOff ? "off" : ""}`;
  }

  _getPresetIcon(preset) {
    const iconMap = {
      离家: "mdi:exit-run",
      在家: "mdi:home",
      睡眠: "mdi:sleep",
      节能: "mdi:leaf",
      手动: "mdi:hand-back-left",
    };
    return iconMap[preset] || "mdi:thermostat";
  }

  _handlePowerToggle(checked) {
    this._callService("climate", "set_hvac_mode", {
      entity_id: this._config.entity,
      hvac_mode: checked ? "auto" : "off",
    });
  }

  _handlePresetChange(preset) {
    this._callService("climate", "set_preset_mode", {
      entity_id: this._config.entity,
      preset_mode: preset,
    });
  }

  _handleTempChange(delta) {
    const currentTemp = Math.round(this._entity?.attributes.temperature || 20);
    const minTemp = this._entity?.attributes.min_temp || 5;
    const maxTemp = this._entity?.attributes.max_temp || 35;
    const step = this._entity?.attributes.target_temp_step || 1;
    let newTemp = Math.max(minTemp, Math.min(maxTemp, currentTemp + delta * step));
    this._callService("climate", "set_temperature", {
      entity_id: this._config.entity,
      temperature: newTemp,
    });
  }

  _callService(domain, service, serviceData) {
    if (this._hass && this._hass.callService) {
      this._hass.callService(domain, service, serviceData);
    }
  }
}

class HeatingCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._hasRendered = false;
  }

  async connectedCallback() {
    try {
      if (window.loadCardHelpers) {
        const helpers = await window.loadCardHelpers();
        if (helpers && helpers.loadHaComponents) await helpers.loadHaComponents();
      }
    } catch (e) { /* continue */ }
    if (this._config && this._hass) this._render();
  }

  setConfig(config) {
    this._config = config || {};
    if (this.isConnected && !this._hasRendered) this._render();
    else if (this._hasRendered) this._updateValues();
  }

  set hass(hass) {
    this._hass = hass;
    if (this.isConnected && this._hasRendered) this._updateValues();
    else if (this.isConnected && this._config) this._render();
  }

  get hass() { return this._hass; }

  async _render() {
    this.innerHTML = "";
    const entityForm = document.createElement("ha-form");
    const schema = [
      { name: "entity", required: true, selector: { entity: { domain: ["climate"] } } },
      { name: "name", selector: { text: {} } },
    ];
    entityForm.hass = this._hass;
    entityForm.data = {
      entity: (this._config && this._config.entity) || "",
      name: (this._config && this._config.name) || "",
    };
    entityForm.schema = schema;
    entityForm.computeLabel = (schema) => {
      if (schema.name === "entity") return "实体 *";
      if (schema.name === "name") return "名称";
      return schema.name;
    };
    entityForm.addEventListener("value-changed", (ev) => {
      if (ev.detail.value) {
        this._config = { ...this._config, ...ev.detail.value };
        this._fireConfigChanged();
      }
    });
    this.appendChild(entityForm);
    this._hasRendered = true;
  }

  _updateValues() {
    const entityForm = this.querySelector("ha-form");
    if (entityForm) {
      entityForm.data = {
        entity: (this._config && this._config.entity) || "",
        name: (this._config && this._config.name) || "",
      };
    }
  }

  _fireConfigChanged() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

if (!customElements.get("heating-card-editor")) {
  customElements.define("heating-card-editor", HeatingCardEditor);
}
if (!customElements.get("heating-card")) {
  customElements.define("heating-card", HeatingCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "heating-card",
    name: "Heating Card",
    description: "地暖控制器自定义卡片 v2",
  });
}
