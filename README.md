# Transmission Web Manager

一个现代化、功能丰富的 Transmission BitTorrent 客户端 Web 管理界面，采用纯前端架构，支持桌面端和移动端。全面适配 Transmission 4.1.x (JSON-RPC 2.0 / RPC semver 6.0.1)，同时兼容 Transmission 3.0+ 旧版协议。

<!-- 截图：桌面端主界面概览 -->
![桌面端主界面](screenshots/desktop-overview.png)

---

## 目录

- [功能特性](#功能特性)
  - [种子管理](#种子管理)
  - [详情面板](#详情面板)
  - [筛选与搜索](#筛选与搜索)
  - [用户界面](#用户界面)
  - [状态栏](#状态栏)
  - [全局统计](#全局统计)
  - [设置管理](#设置管理)
  - [GeoIP 国家识别](#geoip-国家识别)
  - [移动端适配](#移动端适配)
- [截图展示](#截图展示)
- [快速开始](#快速开始)
- [快捷键](#快捷键)
- [系统要求](#系统要求)
- [项目结构](#项目结构)
- [技术架构](#技术架构)
- [RPC 协议适配](#rpc-协议适配)
- [多语言支持](#多语言支持)
- [GeoIP 数据库更新](#geoip-数据库更新)
- [许可证](#许可证)
- [致谢](#致谢)

---

## 功能特性

### 种子管理

- 完整的种子生命周期管理：开始 / 暂停 / 立即开始 / 停止 / 删除
- 种子校验与重新宣告
- 批量选中与操作
- 队列管理：上移 / 下移 / 移至顶部 / 移至底部
- 删除种子（可选同时删除数据）
- 顺序下载支持

### 详情面板

6 个标签页，覆盖种子管理的方方面面：

| 标签页 | 功能 |
|--------|------|
| **基本信息** | 名称、Hash、状态、进度、大小、速度、分享率、ETA、时间戳、错误信息等 30+ 属性 |
| **文件** | 文件列表、进度显示、优先级设置（高/正常/低/不下载）、批量优先级操作 |
| **Tracker** | Tracker 列表与状态、做种/下载数、宣告时间与结果、添加/替换 Tracker |
| **Peer** | Peer 列表、国家/地区旗帜（GeoIP）、客户端识别、加密/uTP 标识、Peer 来源统计 |
| **速度** | 实时速度折线图（Canvas 绘制）、累计统计、分享率 |
| **设置** | 单种子限速、带宽优先级、最大连接数、分享率模式、做种空闲超时、下载目录移动 |

<!-- 截图：详情面板 - 基本信息 -->
![详情面板 - 基本信息](screenshots/detail-info.png)

<!-- 截图：详情面板 - Peer 列表（含国旗） -->
![详情面板 - Peer 列表](screenshots/detail-peers.png)

<!-- 截图：详情面板 - 速度图表 -->
![详情面板 - 速度图表](screenshots/detail-speed.png)

### 筛选与搜索

- 状态筛选：全部、下载中、做种中、已停止、校验中、活跃、错误、排队中
- Tracker 域名分组筛选
- 下载目录分组筛选
- 标签分组筛选
- 实时搜索：支持名称、Hash、标签、注释、创建者、目录、分组等多字段匹配
- 多维度筛选条件组合

<!-- 截图：侧边栏筛选 -->
![侧边栏筛选](screenshots/sidebar-filter.png)

### 用户界面

- 明暗主题切换（自动持久化）
- 桌面端：工具栏 + 侧边栏 + 种子列表 + 详情面板 + 状态栏
- 移动端：底部导航 + 种子列表 + 详情页 + 速度管理 + 统计
- 可拖拽调整列宽
- 可自定义显示/隐藏列（右键表头）
- 右键上下文菜单
- 虚拟滚动（种子数 > 500 自动启用）
- Toast 消息通知与进度提示
- 模态对话框系统

<!-- 截图：明暗主题对比 -->
![亮色主题](screenshots/theme-light.png)
![暗色主题](screenshots/theme-dark.png)

### 状态栏

- 连接状态实时指示
- 下载 / 上传速度
- Peer 连接总数
- 全局分享率
- 种子计数与错误数
- 备用限速开关状态
- 端口连通性检测
- 下载目录可用空间
- Transmission 版本号

### 全局统计

- 实时速度折线图
- 累计 / 本次会话上传下载统计
- 种子状态分布条形图
- 系统信息总览

<!-- 截图：全局统计页面 -->
![全局统计](screenshots/stats.png)

### 设置管理

11 个分类，覆盖 Transmission 所有可配置项：

| 分类 | 内容 |
|------|------|
| 下载 | 默认目录、临时目录、添加行为 |
| 速度限制 | 全局限速、备用限速（时段计划） |
| 网络 | 端口、DHT/PEX/LPD/uTP、加密策略 |
| 连接 | 全局/每种子最大连接数 |
| 做种 | 分享率限制、空闲做种超时 |
| 队列 | 下载/做种队列、停滞检测 |
| 标签管理 | 自定义标签库 |
| 屏蔽列表 | 启用/URL/更新/规则数 |
| RPC | 端口/URL/绑定地址/白名单/认证/防暴力破解 |
| 脚本 | 种子添加/完成脚本 |
| 高级 | 默认 Tracker、只读信息（版本/RPC版本/配置目录） |

<!-- 截图：设置对话框 -->
![设置对话框](screenshots/settings.png)

### GeoIP 国家识别

- 自定义二进制格式 GeoIP 数据库（IPv4 + IPv6）
- 二分查找快速定位
- 国家旗帜 SVG 图标显示
- IPv4-mapped IPv6 地址支持
- 私有 IP 地址识别（LAN 标识）

### 移动端适配

- 响应式设计，自动适配手机/平板
- 底部导航栏：种子列表、统计、速度管理、添加、设置
- 触摸友好的卡片式种子列表
- 滑动操作支持
- 移动端专用详情面板
- 移动端专用速度管理界面

---

## 截图展示

### 桌面端

<!-- 截图：桌面端 - 种子列表 -->
![桌面端 - 种子列表](screenshots/desktop-torrent-list.png)

<!-- 截图：桌面端 - 添加种子对话框 -->
![桌面端 - 添加种子](screenshots/desktop-add-torrent.png)

<!-- 截图：桌面端 - 右键菜单 -->
![桌面端 - 右键菜单](screenshots/desktop-context-menu.png)

### 移动端

<!-- 截图：移动端 - 种子列表 -->
![移动端 - 种子列表](screenshots/mobile-list.png)

<!-- 截图：移动端 - 种子详情 -->
![移动端 - 种子详情](screenshots/mobile-detail.png)

<!-- 截图：移动端 - 速度管理 -->
![移动端 - 速度管理](screenshots/mobile-speed.png)

<!-- 截图：移动端 - 统计页面 -->
![移动端 - 统计](screenshots/mobile-stats.png)

---

## 快速开始

### 部署

**方式一：替换 Transmission 默认界面**

```bash
sudo mv /usr/share/transmission/web /usr/share/transmission/web.bak
sudo cp -r . /usr/share/transmission/web
# 访问 http://your-server:9091/transmission/web/
```

**方式二：独立部署（支持远程连接）**

```bash
cp -r . /var/www/html/twm
# 访问 http://your-server/twm/index.html?rpc=http://transmission-host:9091/transmission/rpc
```

**方式三：Docker**

```bash
docker run -d \
  -v /path/to/transmission-web-manager:/web \
  -p 9091:9091 \
  linuxserver/transmission
```

### 连接

1. 首次访问自动连接默认 RPC 地址 `/transmission/rpc`
2. 连接失败时显示登录界面，可配置 RPC 地址、用户名、密码
3. 通过 URL 参数 `?rpc=` 指定 RPC 地址
4. 支持 HTTP Basic 认证
5. 自动处理 CSRF Token（X-Transmission-Session-Id）

<!-- 截图：登录界面 -->
![登录界面](screenshots/login.png)

---

## 快捷键

| 按键 | 功能 |
|------|------|
| `Delete` | 删除选中种子 |
| `Ctrl/Cmd + A` | 全选种子 |
| `Ctrl/Cmd + N` | 添加种子 |
| `Ctrl/Cmd + S` | 开始选中种子 |
| `Ctrl/Cmd + D` | 暂停选中种子 |
| `Ctrl/Cmd + P` | 打开设置 |
| `F5` | 刷新数据 |
| `Escape` | 清除选择 / 关闭弹窗 |

---

## 系统要求

| 组件 | 最低版本 | 推荐版本 |
|------|----------|----------|
| Transmission | 3.0+ (RPC 15) | 4.1.x (RPC semver 6.0+) |
| Chrome | 70+ | 最新 |
| Firefox | 65+ | 最新 |
| Safari | 13+ | 最新 |
| Edge | 79+ | 最新 |

> **注意**: 带宽组（group-get/group-set）功能需要 Transmission 4.0+ (RPC 17+)。
> 顺序下载（sequential_download）功能需要 Transmission 4.1+ (RPC semver 6.0+)。

---

## 项目结构

```
transmission-web-manager/
├── index.html                  # 桌面端入口
├── mobile.html                 # 移动端入口
├── css/
│   ├── tailwind.css            # Tailwind CSS 基础样式
│   ├── theme.css               # 主题变量与组件样式
│   └── mobile.css              # 移动端专用样式
├── js/
│   ├── jquery-3.7.1.min.js     # jQuery
│   ├── utils.js                # 工具函数（格式化、存储、剪贴板等）
│   ├── rpc.js                  # Transmission RPC 通信层
│   ├── torrent.js              # 种子数据模型与筛选/排序/选择
│   ├── config.js               # 会话配置管理
│   ├── theme.js                # 明暗主题切换
│   ├── geoip.js                # GeoIP 国家查询（二分查找）
│   ├── ui.js                   # 主 UI 控制器（刷新/事件/状态栏）
│   ├── ui-layout.js            # 布局渲染（工具栏/侧边栏/状态栏）
│   ├── ui-torrent-list.js      # 种子列表（虚拟滚动/列管理/排序）
│   ├── ui-detail.js            # 详情面板（基本信息/文件/Tracker）
│   ├── ui-detail-extras.js     # 详情扩展（Peer/速度图表/种子设置）
│   ├── ui-dialog.js            # 对话框（添加/删除/标签/限速/Tracker等）
│   ├── ui-dialog-config.js     # 设置对话框（11分类配置表单）
│   ├── ui-stats.js             # 全局统计页面
│   ├── mobile.js               # 移动端主控制器
│   └── mobile-views.js         # 移动端视图（列表/详情/统计/速度/添加）
├── assets/
│   ├── flags/                  # 国家/地区旗帜 SVG
│   ├── logo.svg                # 项目 Logo
│   └── geo/
│       └── dbip-country-lite-*.mmdb  # GeoIP 数据库
├── screenshots/                # 截图目录
└── LICENSE                     # Apache License 2.0
```

---

## 技术架构

| 层面 | 技术 |
|------|------|
| 前端框架 | 原生 JavaScript (ES5) + jQuery 3.7.1 |
| 样式方案 | Tailwind CSS 3.0 + CSS 自定义属性（主题变量） |
| 通信协议 | Transmission RPC（JSON over HTTP POST） |
| 图表绘制 | Canvas 2D API |
| 数据存储 | localStorage（UI 配置持久化） |
| 模块化 | IIFE 命名空间模式（`TWC.*`） |
| GeoIP | 自定义二进制格式 + 二分查找算法 |

### 数据刷新策略

- 首次加载：全量获取所有种子
- 后续刷新：使用 `recently-active` 增量获取 + 选中种子全量更新
- 刷新间隔：可配置（2s / 5s / 10s / 30s / 60s）
- 操作后立即刷新
- 速度历史：每秒采样，保留最近 120 个数据点

---

## RPC 协议适配

本项目全面适配 Transmission RPC 协议，支持以下两个版本：

### 4.1.x (JSON-RPC 2.0)

- **协议标准**: JSON-RPC 2.0 (RFC 8259)
- **字段命名**: snake_case (如 `hash_string`, `download_dir`)
- **请求格式**: `{"jsonrpc":"2.0","method":"session_get","params":{},"id":N}`
- **响应格式**: `{"jsonrpc":"2.0","result":{},"id":N}`
- **错误处理**: JSON-RPC 2.0 Error 对象 (`code`, `message`, `data`)
- **新增功能**: 带宽组 (group-get/group-set, RPC 17+)、顺序下载、防暴力破解、主机名白名单

### 老版本兼容 (RPC 15-16)

- **协议标准**: 自定义 JSON 格式
- **字段命名**: camelCase/kebab-case 混合 (如 `hashString`, `download-dir`)
- **请求格式**: `{"method":"session-get","arguments":{},"tag":N}`
- **响应格式**: `{"result":"success","arguments":{},"tag":N}`
- **兼容机制**: 通过 `js/legacy/rpc-legacy-adapter.js` 自动适配

### 已实现的 RPC 方法

| 类别 | 方法 | 说明 |
|------|------|------|
| 种子操作 | `torrent_start`, `torrent_start_now`, `torrent_stop`, `torrent_verify`, `torrent_reannounce` | 开始/立即开始/停止/校验/重新宣告 |
| 种子查询 | `torrent_get` | 获取种子信息（支持全量/增量/指定字段） |
| 种子修改 | `torrent_set`, `torrent_add`, `torrent_remove`, `torrent_set_location`, `torrent_rename_path` | 修改/添加/删除/移动/重命名 |
| 队列管理 | `queue_move_top`, `queue_move_up`, `queue_move_down`, `queue_move_bottom` | 队列排序操作 |
| 会话管理 | `session_get`, `session_set`, `session_stats`, `session_close` | 会话配置与统计 |
| 带宽组 | `group_get`, `group_set` | 带宽组管理 (RPC 17+) |
| 工具方法 | `blocklist_update`, `port_test`, `free_space` | 屏蔽列表更新/端口测试/磁盘查询 |

> 完整的 RPC 接口与字段实现对照清单请查看 [RPC对照清单.md](RPC对照清单.md)

---

## 多语言支持

本项目采用完整的多语言架构，支持以下语言：

| 语言 | 代码 | 翻译键数量 | 状态 |
|------|------|-----------|------|
| 简体中文 | zh-CN | 506 | ✅ 完整 |
| English | en | 506 | ✅ 完整 |

### 翻译覆盖范围

- **工具栏**: 添加、删除、开始、暂停、校验、设置、限速、刷新等
- **侧边栏**: 状态筛选、Tracker 分组、目录分组、标签分组
- **种子列表**: 所有列名（名称、状态、进度、大小、速度、分享率、ETA 等）
- **详情面板**: 6 个标签页（基本信息、文件、Tracker、Peer、速度、设置）
- **对话框**: 添加种子、删除确认、设置、限速、标签管理、Tracker 管理等
- **统计页面**: 速度图表、系统信息、种子状态分布
- **设置页面**: 11 个分类（下载、速度、网络、连接、做种、队列、标签、屏蔽列表、RPC、脚本、高级）
- **通用文本**: 是/否、开/关、已启用/已禁用、加载中、未知等

### 技术术语翻译

| 术语 | 中文 | 英文 |
|------|------|------|
| DHT | 分布式哈希表 | Distributed Hash Table |
| PEX | 用户交换 | Peer Exchange |
| LPD | 本地节点发现 | Local Peer Discovery |
| uTP | 微传输协议 | Micro Transport Protocol |

---

## GeoIP 数据库更新

```bash
# 1. 下载 MaxMind GeoLite2-Country MMDB 文件
#    https://dev.maxmind.com/geoip/geolite2-free-geolocation-data

# 2. 替换 assets/geo/ 目录下的 MMDB 文件

# 3. 重启页面即可生效
```

---

## 许可证

[Apache License 2.0](LICENSE)

---

## 致谢

- [Transmission](https://github.com/transmission/transmission) — BitTorrent 客户端
- [transmission-web-control](https://github.com/ronggang/transmission-web-control) — 原始 Web 控制界面
- [MaxMind GeoLite2](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data) — 国家/地区 IP 数据库
- [Tailwind CSS](https://tailwindcss.com/) — 实用优先的 CSS 框架
- [jQuery](https://jquery.com/) — JavaScript 库

---

## 相关文档

- [RPC 接口与字段实现对照清单](RPC对照清单.md) — 4.1.x 与老版本 RPC 协议完整对比
- [整改档案](整改档案.md) — 项目整改记录与问题修复详情
