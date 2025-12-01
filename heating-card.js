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
    const climateEntities = entities.filter(
      (e) => e.startsWith("climate.") || e.startsWith("sensor.")
    );
    return {
      entity: climateEntities[0] || "",
      name: "地暖",
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("请指定实体 (entity)");
    }
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

  get hass() {
    return this._hass;
  }

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

  _render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = "";

    // 创建样式
    this._createStyles();

    // 创建卡片容器
    const haCard = document.createElement("ha-card");
    haCard.className = this._getCardClass();

    if (!this._entity) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "error";
      errorDiv.textContent = `实体未找到: ${this._config?.entity || "未知"}`;
      haCard.appendChild(errorDiv);
      this.shadowRoot.appendChild(haCard);
      return;
    }

    const cardContent = document.createElement("div");
    cardContent.className = "card-content";

    // 标题栏
    const header = this._createHeader();
    cardContent.appendChild(header);

    // 温度显示区域
    const temperatureSection = this._createTemperatureSection();
    cardContent.appendChild(temperatureSection);

    // 预设模式选择
    const presetSection = this._createPresetSection();
    cardContent.appendChild(presetSection);

    // 温度控制按钮
    const tempControlSection = this._createTempControlSection();
    cardContent.appendChild(tempControlSection);

    haCard.appendChild(cardContent);
    this.shadowRoot.appendChild(haCard);
  }

  _createStyles() {
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
      }

      ha-card {
        overflow: hidden;
        border-radius: 20px;
        background: var(--ha-card-background, var(--card-background-color, #ffffff));
        box-shadow: var(--ha-card-box-shadow, 0 4px 12px rgba(0, 0, 0, 0.08));
        transition: box-shadow 0.3s ease;
      }

      ha-card:hover {
        box-shadow: var(--ha-card-box-shadow-hover, 0 6px 16px rgba(0, 0, 0, 0.12));
      }

      .card-content {
        padding: 24px;
      }

      .error {
        padding: 24px;
        color: var(--error-color, #f44336);
        text-align: center;
        font-size: 14px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .header-title {
        font-size: 20px;
        font-weight: 500;
        color: var(--ha-text-primary-color, var(--primary-text-color, rgba(0, 0, 0, 0.87)));
        letter-spacing: 0.15px;
      }

      .power-switch {
        --mdc-theme-primary: var(--primary-color);
        --mdc-switch-selected-handle-color: white;
        --mdc-switch-selected-track-color: var(--primary-color);
      }

      .temperature-section {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 32px;
        padding: 24px 0;
        gap: 32px;
      }

      .temp-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 120px;
      }

      .temp-label {
        font-size: 13px;
        color: var(--ha-text-secondary-color, var(--secondary-text-color, rgba(0, 0, 0, 0.54)));
        margin-bottom: 12px;
        font-weight: 400;
        letter-spacing: 0.5px;
      }

      .temp-value {
        font-size: 56px;
        font-weight: 300;
        color: var(--ha-text-primary-color, var(--primary-text-color, rgba(0, 0, 0, 0.87)));
        line-height: 1;
        letter-spacing: -2px;
      }

      .temp-unit {
        font-size: 28px;
        font-weight: 300;
        margin-left: 2px;
        opacity: 0.8;
      }

      .temp-divider {
        width: 1px;
        height: 80px;
        background: var(--ha-divider-color, var(--divider-color, rgba(0, 0, 0, 0.08)));
        flex-shrink: 0;
      }

      .preset-section {
        margin-bottom: 24px;
      }

      .preset-label {
        font-size: 13px;
        color: var(--ha-text-secondary-color, var(--secondary-text-color, rgba(0, 0, 0, 0.54)));
        margin-bottom: 12px;
        font-weight: 400;
        letter-spacing: 0.5px;
      }

      .preset-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .preset-button {
        flex: 1;
        min-width: 0;
        --mdc-theme-primary: var(--primary-color);
        --mdc-theme-on-primary: white;
        cursor: pointer !important;
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 13px;
        text-transform: none;
        box-shadow: none;
        border: 1.5px solid var(--ha-divider-color, var(--divider-color, rgba(0, 0, 0, 0.08)));
        background: var(--ha-card-background, var(--card-background-color, #ffffff));
        color: var(--ha-text-primary-color, var(--primary-text-color, rgba(0, 0, 0, 0.87)));
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 400;
      }

      .preset-button:hover {
        background: var(--ha-card-background, var(--card-background-color, #ffffff));
        border-color: var(--primary-color);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
      }

      .preset-button.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
        box-shadow: 0 2px 8px rgba(var(--rgb-primary-color, 33, 150, 243), 0.3);
      }

      .preset-button ha-icon {
        margin-right: 6px;
        --mdc-icon-size: 18px;
      }

      .preset-button.active ha-icon {
        color: white;
      }

      .temp-control-section {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 24px;
        margin-top: 24px;
        padding: 0 16px;
      }

      .temp-control-button {
        --mdc-theme-primary: var(--primary-color);
        --mdc-theme-on-primary: white;
        cursor: pointer !important;
        border-radius: 50%;
        width: 56px;
        height: 56px;
        min-width: 56px;
        padding: 0;
        background: var(--primary-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .temp-control-button:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
        transform: translateY(-2px);
      }

      .temp-control-button:active {
        transform: translateY(0) scale(0.96);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      }

      .temp-control-button ha-icon {
        --mdc-icon-size: 28px;
        color: white;
      }

      .target-temp-display {
        font-size: 40px;
        font-weight: 300;
        color: var(--ha-text-primary-color, var(--primary-text-color, rgba(0, 0, 0, 0.87)));
        min-width: 100px;
        text-align: center;
        letter-spacing: -1px;
      }

      .heating-card.off .temp-value,
      .heating-card.off .target-temp-display {
        opacity: 0.4;
      }

      .heating-card.off .preset-button {
        opacity: 0.5;
        pointer-events: none;
        filter: grayscale(0.5);
      }

      .heating-card.off .temp-control-button {
        opacity: 0.4;
        pointer-events: none;
        background: var(--ha-divider-color, var(--divider-color, rgba(0, 0, 0, 0.12)));
      }

      .heating-card.off .temp-control-button ha-icon {
        color: var(--ha-text-secondary-color, var(--secondary-text-color, rgba(0, 0, 0, 0.54)));
      }

      .heating-card.off .temp-label {
        opacity: 0.6;
      }

      /* 暗色主题适配 */
      @media (prefers-color-scheme: dark) {
        ha-card {
          box-shadow: var(--ha-card-box-shadow, 0 4px 12px rgba(0, 0, 0, 0.3));
        }

        ha-card:hover {
          box-shadow: var(--ha-card-box-shadow-hover, 0 6px 16px rgba(0, 0, 0, 0.4));
        }
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  _createHeader() {
    const header = document.createElement("div");
    header.className = "header";

    const title = document.createElement("div");
    title.className = "header-title";
    title.textContent = this._config.name || "地暖";

    const powerSwitch = document.createElement("ha-switch");
    powerSwitch.className = "power-switch";
    powerSwitch.checked = this._entity?.state !== "off";
    powerSwitch.addEventListener("change", (e) => {
      this._handlePowerToggle(e.target.checked);
    });

    header.appendChild(title);
    header.appendChild(powerSwitch);

    return header;
  }

  _createTemperatureSection() {
    const section = document.createElement("div");
    section.className = "temperature-section";

    // 当前温度
    const currentTemp = document.createElement("div");
    currentTemp.className = "temp-display";

    const currentLabel = document.createElement("div");
    currentLabel.className = "temp-label";
    currentLabel.textContent = "当前温度";

    const currentValue = document.createElement("div");
    currentValue.className = "temp-value";
    const currentTempNum = Math.round(
      this._entity?.attributes.current_temperature || 0
    );
    currentValue.innerHTML = `${currentTempNum}<span class="temp-unit">℃</span>`;

    currentTemp.appendChild(currentLabel);
    currentTemp.appendChild(currentValue);

    // 分隔线
    const divider = document.createElement("div");
    divider.className = "temp-divider";

    // 目标温度
    const targetTemp = document.createElement("div");
    targetTemp.className = "temp-display";

    const targetLabel = document.createElement("div");
    targetLabel.className = "temp-label";
    targetLabel.textContent = "目标温度";

    const targetValue = document.createElement("div");
    targetValue.className = "temp-value";
    const targetTempNum = Math.round(this._entity?.attributes.temperature || 0);
    targetValue.innerHTML = `${targetTempNum}<span class="temp-unit">℃</span>`;

    targetTemp.appendChild(targetLabel);
    targetTemp.appendChild(targetValue);

    section.appendChild(currentTemp);
    section.appendChild(divider);
    section.appendChild(targetTemp);

    return section;
  }

  _createPresetSection() {
    const section = document.createElement("div");
    section.className = "preset-section";

    const label = document.createElement("div");
    label.className = "preset-label";
    label.textContent = "预设模式";

    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "preset-buttons";

    const presetModes = this._entity?.attributes.preset_modes || [
      "离家",
      "在家",
      "睡眠",
      "节能",
      "手动",
    ];
    const currentPreset = this._entity?.attributes.preset_mode || "";

    presetModes.forEach((preset) => {
      const button = document.createElement("mwc-button");
      button.className = `preset-button ${
        currentPreset === preset ? "active" : ""
      }`;
      button.style.cursor = "pointer";
      button.addEventListener("click", () => {
        this._handlePresetChange(preset);
      });

      const icon = document.createElement("ha-icon");
      icon.setAttribute("icon", this._getPresetIcon(preset));
      button.appendChild(icon);

      const text = document.createElement("span");
      text.textContent = preset;
      button.appendChild(text);

      buttonsContainer.appendChild(button);
    });

    section.appendChild(label);
    section.appendChild(buttonsContainer);

    return section;
  }

  _createTempControlSection() {
    const section = document.createElement("div");
    section.className = "temp-control-section";

    // 减温按钮
    const decreaseBtn = document.createElement("mwc-button");
    decreaseBtn.className = "temp-control-button";
    decreaseBtn.style.cursor = "pointer";
    decreaseBtn.addEventListener("click", () => {
      this._handleTempChange(-1);
    });

    const decreaseIcon = document.createElement("ha-icon");
    decreaseIcon.setAttribute("icon", "mdi:minus");
    decreaseBtn.appendChild(decreaseIcon);

    // 目标温度显示
    const targetDisplay = document.createElement("div");
    targetDisplay.className = "target-temp-display";
    const targetTemp = Math.round(this._entity?.attributes.temperature || 0);
    targetDisplay.textContent = `${targetTemp}℃`;

    // 增温按钮
    const increaseBtn = document.createElement("mwc-button");
    increaseBtn.className = "temp-control-button";
    increaseBtn.style.cursor = "pointer";
    increaseBtn.addEventListener("click", () => {
      this._handleTempChange(1);
    });

    const increaseIcon = document.createElement("ha-icon");
    increaseIcon.setAttribute("icon", "mdi:plus");
    increaseBtn.appendChild(increaseIcon);

    section.appendChild(decreaseBtn);
    section.appendChild(targetDisplay);
    section.appendChild(increaseBtn);

    return section;
  }

  _getCardClass() {
    const isOff = this._entity?.state === "off";
    return `heating-card ${isOff ? "off" : ""}`;
  }

  _getPresetIcon(preset) {
    const iconMap = {
      离家: "mdi:home-export",
      在家: "mdi:home",
      睡眠: "mdi:sleep",
      节能: "mdi:leaf",
      手动: "mdi:hand-back-left",
    };
    return iconMap[preset] || "mdi:thermostat";
  }

  _handlePowerToggle(checked) {
    if (checked) {
      // 开启地暖
      this._callService("climate", "set_hvac_mode", {
        entity_id: this._config.entity,
        hvac_mode: "auto",
      });
    } else {
      // 关闭地暖
      this._callService("climate", "set_hvac_mode", {
        entity_id: this._config.entity,
        hvac_mode: "off",
      });
    }
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

    let newTemp = currentTemp + delta * step;
    newTemp = Math.max(minTemp, Math.min(maxTemp, newTemp));

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

  getCardSize() {
    return 4;
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
    // 确保 Home Assistant 组件已加载
    try {
      if (window.loadCardHelpers) {
        const helpers = await window.loadCardHelpers();
        if (helpers && helpers.loadHaComponents) {
          await helpers.loadHaComponents();
        }
      }
    } catch (e) {
      // 继续执行，不阻塞渲染
    }

    if (this._config && this._hass) {
      this._render();
    }
  }

  setConfig(config) {
    this._config = config || {};
    if (this.isConnected && !this._hasRendered) {
      this._render();
    } else if (this._hasRendered) {
      this._updateValues();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (this.isConnected && this._hasRendered) {
      this._updateValues();
    } else if (this.isConnected && this._config) {
      this._render();
    }
  }

  get hass() {
    return this._hass;
  }

  async _render() {
    this.innerHTML = "";

    const entityForm = document.createElement("ha-form");
    const schema = [
      {
        name: "entity",
        required: true,
        selector: {
          entity: {
            domain: ["climate"],
          },
        },
      },
      {
        name: "name",
        selector: {
          text: {},
        },
      },
    ];

    entityForm.hass = this._hass;
    entityForm.data = {
      entity: (this._config && this._config.entity) || "",
      name: (this._config && this._config.name) || "",
    };
    entityForm.schema = schema;
    entityForm.computeLabel = (schema) => {
      if (schema.name === "entity") {
        return "实体 *";
      }
      if (schema.name === "name") {
        return "名称";
      }
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
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

// 先注册配置编辑器
if (!customElements.get("heating-card-editor")) {
  customElements.define("heating-card-editor", HeatingCardEditor);
}

// 注册主卡片
if (!customElements.get("heating-card")) {
  customElements.define("heating-card", HeatingCard);

  // 注册到 window.customCards（有助于 HACS 识别）
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "heating-card",
    name: "Heating Card",
    description: "地暖控制器自定义卡片",
  });
}
