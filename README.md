# 地暖控制器自定义卡片

一个美观、现代的 Home Assistant Lovelace 自定义卡片，用于控制地暖设备。采用类似 Mushroom 的设计风格，支持亮色和暗色主题。

## 功能特性

- ✅ **预设模式切换**：离家、在家、睡眠、节能、手动五种预设模式
- ✅ **温度控制**：直观的 +/- 按钮调节目标温度（5-35℃）
- ✅ **开关控制**：一键开关地暖
- ✅ **实时显示**：当前温度、目标温度清晰显示
- ✅ **主题适配**：完美支持亮色和暗色主题
- ✅ **UI 配置**：支持可视化配置编辑器，无需手写 YAML

## 安装方法

### 方法一：通过 HACS 安装（推荐）

1. 在 HACS 中，进入 "Frontend" 分类
2. 点击右上角的三个点菜单
3. 选择 "Custom repositories"
4. 添加此仓库：
   - Repository: `LuckyStarry/lovelace-heating-card`
   - Category: `Frontend`
5. 点击 "Install" 安装
6. 在 Home Assistant 配置中添加资源

### 方法二：手动安装

1. 下载 `heating-card.js` 文件
2. 将文件复制到 Home Assistant 的 `www/heating-card/` 目录
3. 在 Home Assistant 配置中添加资源

## 配置资源

在 Home Assistant 的配置中添加资源：

**通过 UI 配置：**

1. 进入 "设置" > "仪表盘" > "资源"
2. 点击 "添加资源"
3. 选择 "JavaScript 模块"
4. 输入 URL: `/hacsfiles/lovelace-heating-card/heating-card.js`（HACS 安装） 或 `/local/heating-card/heating-card.js`（手动安装）
5. 点击 "创建"

**通过 YAML 配置：**

在 `configuration.yaml` 中添加：

```yaml
lovelace:
  resources:
    - url: /hacsfiles/lovelace-heating-card/heating-card.js
      type: module
```

## 使用方法

### 通过 UI 配置（推荐）

1. 在 Lovelace 编辑模式下，点击 "添加卡片"
2. 搜索 "Heating Card" 或 "地暖控制器自定义卡片"
3. 在可视化编辑器中：
   - 选择地暖实体（climate 实体）
   - 输入卡片名称（可选）
4. 点击 "保存"

### 通过 YAML 配置

#### 基本用法

```yaml
type: custom:heating-card
entity: climate.bedroom_heating
```

#### 带自定义名称

```yaml
type: custom:heating-card
entity: climate.bedroom_heating
name: 主卧地暖
```

#### 在网格布局中使用

```yaml
type: grid
cards:
  - type: custom:heating-card
    entity: climate.bedroom_heating
    name: 主卧地暖
    grid_options:
      columns: 6
      rows: auto
  - type: custom:heating-card
    entity: climate.living_room_heating
    name: 客厅地暖
    grid_options:
      columns: 6
      rows: auto
```

## 配置选项

| 参数   | 类型   | 必需 | 默认值 | 说明                   |
| ------ | ------ | ---- | ------ | ---------------------- |
| entity | string | ✅   | \-     | 地暖的 climate 实体 ID |
| name   | string | ❌   | "地暖" | 卡片显示的名称（可选） |

## 支持的功能

### 预设模式

- **离家** 🏠：离家模式，通常设置为较低温度以节能
- **在家** 🏡：在家模式，舒适温度
- **睡眠** 😴：睡眠模式，适合夜间使用的温度
- **节能** 🌿：节能模式，平衡舒适度和能耗
- **手动** ✋：手动模式，完全手动控制温度

### 温度控制

- 显示当前环境温度
- 显示目标温度
- +/- 按钮调节目标温度（范围：5-35℃）
- 温度步进：1℃（根据实体配置）

### 开关控制

- 一键开关地暖
- 关闭时，所有控制按钮自动禁用

## 依赖项

### 必需依赖（Home Assistant 内置，无需安装）

- ✅ `mwc-button` - Material Web Components（Home Assistant 已内置）
- ✅ `ha-card`, `ha-icon`, `ha-switch`, `ha-form` - Home Assistant 核心组件

### 可选依赖

无。此卡片**不需要任何额外依赖**！

## 界面说明

1. **标题栏**：显示卡片名称和开关按钮
2. **温度显示**：当前温度和目标温度并排显示
3. **预设模式选择**：离家、在家、睡眠、节能、手动五种模式
4. **温度控制**：- 和 + 按钮调节目标温度，中间显示当前目标温度

## 自定义样式

卡片使用 CSS 变量，可以通过 `card-mod` 自定义样式：

```yaml
type: custom:heating-card
entity: climate.heating
card_mod:
  style: |
    .heating-card {
      border-radius: 16px;
    }
```

## 故障排除

### 1. 卡片不显示

- 检查资源是否正确添加
- 检查浏览器控制台是否有错误
- 确认实体 ID 是否正确
- 尝试强制刷新页面（Ctrl+F5 或 Cmd+Shift+R）

### 2. 按钮无响应

- 检查实体是否支持对应的服务（`set_preset_mode`, `set_temperature`, `set_hvac_mode`）
- 检查浏览器控制台是否有错误
- 确认实体状态正常

### 3. UI 配置编辑器不显示

- 确保已正确安装并添加资源
- 清除浏览器缓存
- 检查浏览器控制台是否有错误

### 4. 样式异常

- 清除浏览器缓存
- 检查是否有其他卡片样式冲突
- 确认 Home Assistant 版本是否支持（建议 2023.1.0+）

### 5. 预设模式不显示

- 确认实体支持 `preset_modes` 属性
- 检查实体的 `preset_modes` 列表是否包含支持的预设模式
- 如果实体不支持预设模式，卡片将显示默认的预设模式列表

## 开发说明

### 文件结构

```
lovelace-heating-card/
├── heating-card.js    # 主卡片文件
├── README.md                   # 使用说明
├── hacs.json                   # HACS 配置
├── example-usage.yaml          # 使用示例
├── manifest.json               # 清单文件
└── LICENSE                     # 许可证
```

### 技术栈

- 原生 Web Components（不依赖 Lit）
- Material Web Components
- Home Assistant 核心组件

### 实体要求

地暖控制器实体应满足以下要求：

- **实体类型**：`climate` 实体
- **HVAC 模式**：支持 `auto` 和 `off`
- **预设模式**：支持 `preset_modes`（离家、在家、睡眠、节能、手动等）
- **温度范围**：`min_temp` 和 `max_temp`（通常为 5-35℃）
- **温度步进**：`target_temp_step`（通常为 1℃）
- **属性**：`current_temperature`（当前温度）、`temperature`（目标温度）

示例实体状态：

```yaml
hvac_modes: auto, off
min_temp: 5
max_temp: 35
target_temp_step: 1
preset_modes: 离家, 在家, 睡眠, 节能, 手动
current_temperature: 20
temperature: 20
preset_mode: 手动
icon: mdi:thermostat
friendly_name: 南卧地暖温控器
supported_features: 401
```

## 许可证

MIT License

Copyright (c) 2025 SUN BO

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
