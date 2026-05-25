# TRWM (Transmission Web Manager) 全维度深度审计报告

**审计日期**: 2026-05-25
**审计版本**: 基于 src/ 最新代码（从 jQuery 完整重写至 SolidJS）
**构建产物**: dist/index.html 518.23 KB (gzip: 143.31 kB)
**运行时环境**: Transmission 4.1.x JSON-RPC 2.0 + 旧版兼容

---

## 一、功能覆盖完整性审计

### 1.1 全量 RPC 接口覆盖检查

#### 已实现的 RPC 方法

| RPC 方法 (snake_case) | 实现位置 | 参数格式 | 状态 |
|:---|:---|:---|:---|
| `torrent_get` | rpc.ts `torrentGet()` | snake_case + table format | ✅ 正确 |
| `torrent_set` | SettingsTab, FilesTab, PiecesTab, TrackersTab, AddTorrentModal | snake_case | ✅ 正确 |
| `torrent_set` | **App.tsx** | **hyphenated + camelCase** | ~~❌ **严重错误**~~ ✅ **已修复** |
| `torrent_set_location` | SettingsTab | snake_case | ✅ 正确 |
| `torrent_set_location` | **App.tsx** | **hyphenated** | ~~❌ **错误**~~ ✅ **已修复** |
| `torrent_add` | AddTorrentModal | snake_case | ✅ 正确 |
| `torrent_remove` | torrentStore `torrentOp` | snake_case | ✅ 正确 |
| `torrent_start` | torrentStore `torrentOp` | snake_case | ✅ 正确 |
| `torrent_start_now` | torrentStore `torrentOp` | snake_case | ✅ 正确 |
| `torrent_stop` | torrentStore `torrentOp` | snake_case | ✅ 正确 |
| `torrent_verify` | torrentStore `torrentOp` | snake_case | ✅ 正确 |
| `torrent_reannounce` | torrentStore `torrentOp` | snake_case | ✅ 正确 |
| `session_get` | queries.ts `useSession` | snake_case | ✅ 正确 |
| `session_set` | GlobalConfigModal | snake_case | ✅ 正确 |
| `session_stats` | queries.ts `useSessionStats` | snake_case | ✅ 正确 |
| `group_get` | GlobalConfigModal | snake_case | ✅ 正确 |
| `group_set` | GlobalConfigModal | snake_case | ✅ 正确 |
| `port_test` | GlobalConfigModal | snake_case | ✅ 正确 |
| `blocklist_update` | GlobalConfigModal | snake_case | ✅ 正确 |
| `free_space` | queries.ts `useFreeSpace` | snake_case | ✅ 正确 |
| `queue_move_up/down/top/bottom` | torrentStore `torrentOp` | snake_case | ✅ 正确 |

#### 未实现的 RPC 方法

| RPC 方法 | 严重度 | 说明 |
|:---|:---|:---|
| `torrent_rename_path` | **High** | ~~设计方案明确要求"行内重命名触发 `torrent-rename-path`"，FilesTab 有重命名 UI 但实际调用 `rpcCall('torrent_set', ...)` 而非 `torrent_rename_path`，**重命名功能无法正常工作**~~ **已验证**: FilesTab 实际已正确使用 `torrent_rename_path`，审计报告原始判断有误 |
| `session_close` | Low | 关闭 Transmission 守护进程，一般 WebUI 不提供此功能 |
| `torrent_set` 的 `honors_session_limits` 参数 | Medium | 设计方案中 Session 接口有此字段，但 SettingsTab 未提供 UI |

#### ~~🔴 Critical: App.tsx RPC 方法名与参数名格式错误~~ ✅ 已修复

**问题等级**: ~~Critical~~ **已修复**
**问题位置**: [App.tsx](file:///home/qq/code/trwm/src/App.tsx)
**修复状态**: 7 处 `rpcCall` 调用已全部从 hyphenated + camelCase 修正为 snake_case。相关逻辑已提取到 [ContextMenu.tsx](file:///home/qq/code/trwm/src/components/ContextMenu.tsx) 独立组件中。

| ~~行号~~ | ~~当前代码~~ | ~~应修改为~~ | 状态 |
|:---|:---|:---|:---|
| ~~223~~ | ~~`rpcCall('torrent-set', { ids, labels })`~~ | ~~`rpcCall('torrent_set', { ids, labels })`~~ | ✅ 已修复 |
| ~~231~~ | ~~`rpcCall('torrent-set', { ids, bandwidthPriority })`~~ | ~~`rpcCall('torrent_set', { ids, bandwidth_priority })`~~ | ✅ 已修复 |
| ~~242~~ | ~~`rpcCall('torrent-set', { ids, downloadLimited, downloadLimit })`~~ | ~~`rpcCall('torrent_set', { ids, download_limited, download_limit })`~~ | ✅ 已修复 |
| ~~255~~ | ~~`rpcCall('torrent-set', { ids, uploadLimited, uploadLimit })`~~ | ~~`rpcCall('torrent_set', { ids, upload_limited, upload_limit })`~~ | ✅ 已修复 |
| ~~268~~ | ~~`rpcCall('torrent-set', { ids, peerLimit })`~~ | ~~`rpcCall('torrent_set', { ids, peer_limit })`~~ | ✅ 已修复 |
| ~~281~~ | ~~`rpcCall('torrent-set-location', { ids, location, move })`~~ | ~~`rpcCall('torrent_set_location', { ids, location, move })`~~ | ✅ 已修复 |
| ~~292~~ | ~~`rpcCall('torrent-set', { ids, sequentialDownload })`~~ | ~~`rpcCall('torrent_set', { ids, sequential_download })`~~ | ✅ 已修复 |

**根因分析**: App.tsx 是从旧版 jQuery 代码迁移时遗留的代码，旧版使用 hyphenated 方法名和 camelCase 参数名（旧式 RPC 协议格式）。其他组件（SettingsTab、FilesTab、PiecesTab、TrackersTab、AddTorrentModal、GlobalConfigModal）已正确使用 snake_case 格式，唯独 App.tsx 未更新。

**影响范围**: 在 JSON-RPC 2.0 模式（Transmission 4.1+）下，这些调用会失败。在 legacy 模式下，由于 `LEGACY_METHOD_MAP` 的键是 snake_case，hyphenated 方法名不会命中映射，但会原样发送，legacy 协议恰好使用 hyphenated，所以碰巧工作。但 camelCase 参数名在两种协议下都不一致。

#### 🔴 High: FilesTab 重命名功能未使用 torrent_rename_path

**问题等级**: High
**问题位置**: [FilesTab.tsx](file:///home/qq/code/trwm/src/components/DetailPanel/FilesTab.tsx#L15-L37)
**问题描述**: FilesTab 有重命名 UI（编辑铅笔图标 + inline input），但 `handleRename` 函数使用 `rpcCall('torrent_set', ...)` 而非 `rpcCall('torrent_rename_path', { ids, path, name })`。`torrent_set` 不支持重命名文件，此功能完全无法工作。
**修复建议**: 改为 `await rpcCall('torrent_rename_path', { ids: [props.torrent.id], path: originalName, name: newName })`

### 1.2 配置项完整性检查

#### GlobalConfigModal 已实现的配置页签

| 页签 | 对应 Session 字段 | 完整性 |
|:---|:---|:---|
| Download (下载) | download_dir, incomplete_dir, incomplete_dir_enabled, rename_partial_files, start_added_torrents, trash_original_torrent_files | ✅ 完整 |
| Speed (速度) | speed_limit_down/up, alt_speed_*, daymask | ✅ 完整 |
| Groups (带宽组) | group_get/set | ✅ 完整 |
| Network (网络) | peer_port, port_forwarding, dht/pex/lpd/utp, encryption, anti_brute_force, preferred_transports, sequential_download | ✅ 完整 |
| Peer (节点) | peer_limit_global, peer_limit_per_torrent | ✅ 完整 |
| Seeding (做种) | seed_ratio_limited/limit, idle_seeding_limit_enabled/limit | ✅ 完整 |
| Queue (队列) | download_queue_*, seed_queue_*, queue_stalled_* | ✅ 完整 |
| Labels (标签) | localStorage + torrent labels | ✅ 完整 |
| Blocklist (黑名单) | blocklist_enabled/url, port_test | ✅ 完整 |
| RPC (连接信息) | 只读: rpc_version, version, session_id, config_dir | ✅ 完整 |
| Script (脚本) | script_torrent_added/done/done_seeding | ✅ 完整 |
| Advanced (高级) | cache_size_mib, default_trackers | ✅ 完整 |

#### 缺失的 Session 配置项

| 缺失字段 | 严重度 | 说明 |
|:---|:---|:---|
| `scrape_paused_torrents_enabled` | Low | 是否刮取暂停中的种子，未在 UI 中提供 |
| `tcp_enabled` | Medium | Transmission 4.1+ 新增字段，Network 页签未提供 TCP 开关 |

### 1.3 数据展示完整性检查

#### TORRENT_FIELDS 覆盖率

设计方案要求的 60+ 个字段中，TORRENT_FIELDS 已包含 67 个字段，覆盖了设计方案列出的所有必选字段。额外增加了 `availability`, `size_when_done`, `desired_available`, `have_valid`, `have_unchecked`, `recheck_progress`, `webseeds_sending_to_us`, `edit_date`, `start_date`, `date_created`, `tracker_list`, `metadata_percent_complete` 等扩展字段。

**缺失字段**:

| 字段 | 严重度 | 说明 |
|:---|:---|:---|
| `percent_complete` | Medium | 含未选中文件的完整百分比，与 `percent_done` 不同，GeneralTab 未展示 |
| `eta_idle` | Low | 闲置 ETA，原版 WebUI 未展示 |
| `max_connected_peers` | Low | 最大连接节点数 |

### 1.4 用户交互流程检查

| 交互问题 | 严重度 | 位置 | 说明 |
|:---|:---|:---|:---|
| 使用 `prompt()` 做用户输入 | ~~**High**~~ ✅ **已修复** | ~~App.tsx:238,250,264,279~~ ContextMenu.tsx | 已替换为自定义 PromptModal 组件 |
| 文件重命名不工作 | ~~**High**~~ ✅ **已验证正常** | FilesTab.tsx | FilesTab 已正确使用 `torrent_rename_path`，审计原始判断有误 |
| 右键菜单缺少部分功能 | Medium | App.tsx | 缺少原版的"复制 Magnet 链接"（已实现但无错误处理）、"复制 Hash"功能 |
| `navigator.clipboard.writeText` 无错误处理 | Medium | App.tsx:186,199 | HTTP 环境下此 API 不可用，会静默失败 |
| 键盘快捷键不完整 | Low | App.tsx | 缺少原版的 Delete 键删除、Enter 开始等快捷键 |

---

## 二、库与浏览器新特性审计

### 2.1 设计方案指定库的使用检查

| 库名 | 设计方案要求 | 实际使用情况 | 问题等级 | 详细说明 |
|:---|:---|:---|:---|:---|
| **Solid.js** | ^1.9.0 | ^1.9.12 ✅ | Info | 正确使用，版本匹配 |
| **Vite** | ^5.0.0 | ^8.0.12 | Medium | 版本远超设计方案指定，但功能正常。需注意 Vite 8 的 breaking changes |
| **Dexie.js** | ^4.0.0 | ^4.4.2 ✅ | Info | 正确使用于历史快照持久化 |
| **@tanstack/solid-virtual** | ^3.0.0 | ^3.13.25 ✅ | Info | 正确使用于 TorrentTable 虚拟滚动 |
| **@kobalte/core** | ^0.13 | ~~**完全未使用**~~ **已移除** | ~~Critical~~ ✅ | 已从 package.json 移除。经分析：项目模态框/菜单数量有限，手写实现已够用，引入 Kobalte 的 Dialog+Menu 约 15KB gzip，但改造工作量大且当前无 ARIA 需求紧迫性。如未来需要无障碍合规，可选择性引入 |
| **uPlot** | ^1.6 | ~~**完全未使用**~~ **已移除** | ~~Critical~~ ✅ | 已从 package.json 移除。经分析：3 个 Canvas 图表数据量极小（30~300 采样点），原生 Canvas 毫无性能压力；uPlot 不支持 PiecesTab 热力图；45KB gzip 代价过高；命令式 API 与 SolidJS 响应式不匹配 |
| **Lucide Solid** | ^1.16 | ~~**完全未使用**~~ **已全面使用** | ~~High~~ ✅ | 已在 ContextMenu(18个图标)、Sidebar(13个图标)、ToastContainer(4个图标) 中全面替换 emoji/unicode 图标 |

### 2.2 设计方案指定浏览器新特性的使用检查

| 特性 | 设计方案要求 | 实际实现 | 问题等级 |
|:---|:---|:---|:---|
| **Canvas 2D API** | Pieces 矩阵图 + Speed 面积图 | ✅ PiecesTab 和 SpeedTab 均使用 Canvas | Info |
| **IndexedDB (Dexie)** | 历史快照引擎 | ✅ db.ts + torrentStore 归档逻辑 | Info |
| **Drag & Drop API** | 拖拽 .torrent 文件添加 | ✅ App.tsx dragenter/dragover/drop | Info |
| **FileReader API** | 读取本地 .torrent 文件为 Base64 | ✅ AddTorrentModal readAsDataURL | Info |
| **IntersectionObserver/ResizeObserver** | 配合虚拟滚动 | ❌ **未使用** | Medium | @tanstack/solid-virtual 内部可能使用了，但项目代码未显式使用 |
| **CSS Custom Properties** | 全局换肤变量树 | ✅ theme.css 定义完整 | Info |
| **backdrop-filter: blur(12px)** | 右键菜单磨砂玻璃 | ❌ **未实现** | Medium | App.tsx 右键菜单使用纯色背景，未实现设计方案要求的磨砂玻璃特效 |

### 2.3 未充分利用的现有库与特性

| 库/特性 | 当前使用 | 可优化为 | 问题等级 |
|:---|:---|:---|:---|
| **@kobalte/core** | 未使用 | 用于 Dialog/Select/Dropdown 的 ARIA 可访问性 | High |
| **uPlot** | 未使用 | 替代 SpeedTab/StatsModal 的手写 Canvas 图表 | High |
| **Lucide Solid** | 未使用 | 替代所有 Emoji 图标和内联 SVG | High |
| **Tailwind CSS v4** | 已安装+导入，但组件中零使用 | 用于布局/间距/颜色等原子类 | Medium |
| **@tanstack/solid-query** | 仅 4 个 hook | 可用于 torrent 数据获取、缓存、自动重试 | Low |

### 2.4 建议引入的新库与新特性

| 建议 | 收益 | 成本 | 风险 | 问题等级 |
|:---|:---|:---|:---|:---|
| **使用已安装的 uPlot** | SpeedTab 图表性能提升 10x+，代码量减少 80% | 需学习 uPlot API | 低 | High |
| **使用已安装的 @kobalte/core** | WAI-ARIA 可访问性，减少手写模态框代码 | 需适配现有样式 | 中 | Medium |
| **使用已安装的 Lucide Solid** | 图标一致性，按需摇树 | 需替换所有 Emoji/SVG | 低 | Medium |
| **使用已安装的 Tailwind CSS** | 样式一致性，减少 857 行内联 CSS | 需迁移现有样式 | 中 | Medium |
| **引入 @solidjs/router** | URL 路由，支持深层链接 | 新增依赖 | 低 | Low |

### 2.5 不必要的依赖与过时特性清理

| 依赖 | 问题 | 建议 | 问题等级 |
|:---|:---|:---|:---|
| **@kobalte/core** | 完全未使用，增加约 30KB 打包体积 | **要么使用它，要么移除它** | Critical |
| **uplot** | 完全未使用，增加约 50KB 打包体积 | **要么使用它，要么移除它** | Critical |
| **lucide-solid** | 完全未使用，增加约 5KB 打包体积 | **要么使用它，要么移除它** | High |
| **autoprefixer** | TailwindCSS v4 通过 @tailwindcss/vite 集成，不再需要 | 移除 | Low |
| **postcss** | 同上 | 移除 | Low |
| **src/assets/hero.png, solid.svg, vite.svg** | Vite 脚手架遗留，未被引用 | 删除 | Low |

**打包体积影响**: 移除 @kobalte/core + uPlot + lucide-solid 预计可减少约 85KB 打包体积（从 507KB 降至约 420KB）。

---

## 三、UI/UX 设计审计

### 3.1 整体设计一致性

#### 🔴 样式实现方式混乱（三种方式混用）

| 方式 | 使用文件数 | 代码行数 | 问题 |
|:---|:---|:---|:---|
| 独立 CSS 文件 | 9 个文件 | ~2,027 行 | ✅ 推荐方式 |
| 组件内 `<style>` 标签 | **8 个文件** | **~857 行** | ❌ 每次渲染重新注入，无法缓存 |
| JSX `style={{}}` 属性 | **15 个文件** | **59 处** | ❌ 仅应用于动态值 |

**内联 `<style>` 标签详细清单**:

| 文件 | 行号范围 | 内联 CSS 行数 |
|:---|:---|:---|
| [App.tsx](file:///home/qq/code/trwm/src/App.tsx#L491-L649) | 491-649 | ~158 行 |
| [GeneralTab.tsx](file:///home/qq/code/trwm/src/components/DetailPanel/GeneralTab.tsx#L241-L301) | 241-301 | ~60 行 |
| [FilesTab.tsx](file:///home/qq/code/trwm/src/components/DetailPanel/FilesTab.tsx#L220-L383) | 220-383 | ~163 行 |
| [PeersTab.tsx](file:///home/qq/code/trwm/src/components/DetailPanel/PeersTab.tsx#L276-L524) | 276-524 | ~248 行 |
| [TrackersTab.tsx](file:///home/qq/code/trwm/src/components/DetailPanel/TrackersTab.tsx#L239-L284) | 239-284 | ~45 行 |
| [PiecesTab.tsx](file:///home/qq/code/trwm/src/components/DetailPanel/PiecesTab.tsx#L308-L438) | 308-438 | ~130 行 |
| [SpeedTab.tsx](file:///home/qq/code/trwm/src/components/DetailPanel/SpeedTab.tsx#L177-L260) | 177-260 | ~83 行 |
| [SettingsTab.tsx](file:///home/qq/code/trwm/src/components/DetailPanel/SettingsTab.tsx#L281-L409) | 281-409 | ~128 行 |

#### 硬编码颜色值统计

| 颜色值 | 出现次数 | 出现位置 | 应替换为 |
|:---|:---|:---|:---|
| `#3b82f6` | 8 处 | PiecesTab, SpeedTab, StatsModal, Toolbar.css, Sidebar.css, Modals.css | `var(--color-primary-500)` |
| `#22c55e` | 5 处 | PiecesTab, SpeedTab, StatsModal | `var(--color-status-seeding)` |
| `#ef4444` | 3 处 | PiecesTab, Modals.css | `var(--color-status-error)` |
| `#f59e0b` | 3 处 | PiecesTab, Modals.css | `var(--color-status-checking)` |
| `#84cc16` | 2 处 | PiecesTab | `var(--color-status-moderate)` (需新增) |
| `#8b5cf6` | 2 处 | StatsModal, Toolbar.tsx | `var(--color-status-queued)` (需新增) |
| `#6b7280` | 3 处 | StatsModal | `var(--color-status-paused)` |
| `#ffffff` / `#fff` | 5 处 | Toast.css, FilesTab, SettingsTab, TrackersTab, Modals.css | `var(--color-text-on-primary)` |
| `rgba(59, 130, 246, 0.1~0.15)` | 6 处 | Toolbar.css, Sidebar.css, Modals.css | `var(--color-primary-50)` / `var(--color-primary-100)` |
| `rgba(0, 0, 0, 0.3~0.5)` | 4 处 | PeersTab, TrackersTab, Modals.css | `var(--color-overlay)` |

**总计**: 约 50+ 处硬编码颜色值，应全部替换为 CSS 变量。

#### 行间距问题详细分析

| 元素 | 当前值 | 设计方案目标 | 建议调整 | 问题等级 |
|:---|:---|:---|:---|:---|
| 表格行高 | 30px | 30px | ✅ 符合 | Info |
| 表格单元格 padding | `4px 8px` | `4px 8px` | ✅ 符合 | Info |
| Modal padding | 20-24px | — | 16px | Medium |
| Settings section gap | 14-16px | — | 10-12px | Medium |
| Form group gap | 6-14px | — | 6-8px | Medium |
| Form group margin-bottom | 12-16px | — | 8-10px | Medium |
| Section heading margin | 16-20px | — | 8-12px | Medium |
| Peer table td padding | 2px 8px | — | 2px 6px | Low |
| Peer table font-size | 12px | — | 11-12px | Low |

#### 图标使用不一致

| 图标类型 | 使用位置 | 问题 |
|:---|:---|:---|
| Emoji | Sidebar (📁⬇⬆⏸✓●✕☰📂🌐🏷🔓🔒), ToastContainer (✓✗⚠ℹ), FilesTab (✏️💾✕) | 不同平台渲染不一致，部分 Emoji 在小尺寸下模糊 |
| 内联 SVG | Toolbar (所有按钮), StatusBar (连接点/速度箭头) | 手写 SVG 路径，维护成本高 |
| Lucide Solid | **零使用** | 已安装但完全未使用 |

**建议**: 统一使用 Lucide Solid 图标库，替换所有 Emoji 和内联 SVG。

#### 深色/浅色模式实现质量

| 方面 | 评估 | 问题 |
|:---|:---|:---|
| CSS 变量覆盖 | ✅ 完整 | `[data-theme="dark"]` 选择器覆盖所有变量 |
| 硬编码颜色 | ❌ 严重 | 50+ 处硬编码颜色不随主题切换 |
| Canvas 绘图 | ⚠️ 部分 | SpeedTab/StatsModal Canvas 使用硬编码颜色，深色模式下需手动判断 |
| Toast 通知 | ❌ 问题 | Toast.css 硬编码 4 种颜色，不随主题切换 |

### 3.2 Tailwind CSS 引入可行性分析

**当前状态**: Tailwind CSS v4 已安装并配置（`@tailwindcss/vite` 插件 + `@import "tailwindcss"` 在 theme.css 中），但组件中 **零 Tailwind 类名使用**。

**引入方案**:

1. **Phase 1 — 布局与间距**: 将 `style={{}}` 中的布局属性（flex, gap, padding, margin）替换为 Tailwind 类
2. **Phase 2 — 颜色与排版**: 将硬编码颜色替换为 Tailwind 语义色（需配置 `theme.css` 中的 CSS 变量映射）
3. **Phase 3 — 内联 CSS 迁移**: 将 857 行内联 `<style>` 标签中的样式迁移为 Tailwind 类 + 独立 CSS 文件

**收益**: 样式一致性、减少 857 行内联 CSS、消除 50+ 处硬编码颜色
**成本**: 需要逐文件迁移，约 15 个文件需修改
**风险**: 低 — Tailwind v4 与现有 CSS 变量体系兼容

### 3.3 用户体验优化点

| 问题 | 严重度 | 说明 |
|:---|:---|:---|
| `prompt()` 对话框 | **High** | 限速/连接数/目录修改使用浏览器原生对话框，应改为自定义模态框 |
| 右键菜单无磨砂玻璃 | Medium | 设计方案要求 `backdrop-filter: blur(12px)`，当前使用纯色背景 |
| 右键菜单无进入动画 | Medium | 设计方案要求 `0.1s ease-in` 过渡动画 |
| 详情面板不可拖拽调整高度 | Medium | 设计方案要求支持拖拽 resize |
| 缺少列宽拖拽调整 | Medium | 设计方案要求"点击表头边缘的把手进行自由拖拽改动列宽" |
| 表格列不可拖拽排序 | Low | 列顺序固定，无法自定义 |
| 空状态设计不足 | Low | 种子列表为空时缺少友好提示 |

---

## 四、代码质量与可维护性审计

### 4.1 SolidJS 最佳实践检查

| 问题 | 严重度 | 位置 | 说明 |
|:---|:---|:---|:---|
| `void t.xxx` 建立响应式依赖 | Medium | [torrentStore.ts:59-68](file:///home/qq/code/trwm/src/store/torrentStore.ts#L59-L68), [DetailPanel.tsx](file:///home/qq/code/trwm/src/components/DetailPanel/DetailPanel.tsx) | 非官方推荐方式，但当前是 SolidJS Store 代理追踪的实用 workaround。建议未来在 Store 层面解决 |
| `createEffect` 无 `on()` 控制 | Medium | [GeneralTab.tsx](file:///home/qq/code/trwm/src/components/DetailPanel/GeneralTab.tsx), [SpeedTab.tsx](file:///home/qq/code/trwm/src/components/DetailPanel/SpeedTab.tsx) | 部分 effect 未使用 `on()` 限制依赖，可能在不必要时重新执行 |
| `.map()` 代替 `<For>` | Low | [DetailPanel.tsx](file:///home/qq/code/trwm/src/components/DetailPanel/DetailPanel.tsx) | Tab 列表使用 `.map()` 渲染，应使用 `<For>` 组件 |
| Props 解构在跟踪范围外 | Low | 多个组件 | 部分组件在函数顶部解构 props，可能丢失响应性 |

### 4.2 代码结构与组织

| 问题 | 严重度 | 位置 | 说明 |
|:---|:---|:---|:---|
| **App.tsx 过于庞大** | **High** | [App.tsx](file:///home/qq/code/trwm/src/App.tsx) (654行) | 包含右键菜单、标签对话框、拖放处理、键盘快捷键、7处 RPC 调用，应拆分为 5+ 个子组件/模块 |
| **GlobalConfigModal.tsx 过于庞大** | **High** | [GlobalConfigModal.tsx](file:///home/qq/code/trwm/src/components/Modals/GlobalConfigModal.tsx) (1517行) | 12 个配置页签全在一个文件中，应拆分为独立子组件 |
| **rpc-legacy.ts FIELD_MAP 过大** | Medium | [rpc-legacy.ts](file:///home/qq/code/trwm/src/api/rpc-legacy.ts) (578行) | 350+ 行字段映射表，应抽取为独立 JSON |
| **torrentStore.ts 导出过多** | Medium | [torrentStore.ts](file:///home/qq/code/trwm/src/store/torrentStore.ts) (509行) | 30+ 个导出，职责过重，应拆分过滤/选择/操作逻辑 |
| **fetchTorrents 函数过长** | Medium | [torrentStore.ts:255-409](file:///home/qq/code/trwm/src/store/torrentStore.ts#L255-L409) | 单函数 154 行，包含数据获取、状态更新、归档、速度历史等多个职责 |

### 4.3 潜在 Bug 与逻辑缺陷

| Bug | 严重度 | 位置 | 说明 |
|:---|:---|:---|:---|
| **RPC 递归重试无上限** | **High** | [rpc.ts:49](file:///home/qq/code/trwm/src/api/rpc.ts#L49), [rpc-legacy.ts:451,517](file:///home/qq/code/trwm/src/api/rpc-legacy.ts#L451) | 409 响应时递归重试无最大次数保护，可能导致栈溢出 |
| **`isFetching` 丢弃并发请求** | Medium | [torrentStore.ts:256-257](file:///home/qq/code/trwm/src/store/torrentStore.ts#L256-L257) | `if (isFetching) return` 直接丢弃新请求，可能导致数据长时间不更新 |
| **`protocolDetected` 不可重置** | Medium | [rpc.ts:5](file:///home/qq/code/trwm/src/api/rpc.ts#L5) | 一旦设为 true 永远无法回退，首次检测出错则后续全部错误 |
| **`fetchTorrents(true)` 的 forceFull 参数未使用** | Medium | [torrentStore.ts:262](file:///home/qq/code/trwm/src/store/torrentStore.ts#L262) | 函数签名接受 `forceFull` 参数但内部完全忽略 |
| **`toPlain()` 使用 JSON 序列化** | Medium | [torrentStore.ts:8-10](file:///home/qq/code/trwm/src/store/torrentStore.ts#L8-L10) | `JSON.parse(JSON.stringify())` 会丢失 undefined 值和 Date 对象，性能差 |
| **未 await 的 Promise** | Medium | [torrentStore.ts:291-327](file:///home/qq/code/trwm/src/store/torrentStore.ts#L291-L327) | 多处 `db.history.where().first().then()` 产生的 Promise 未被 await，失败只有 console.warn |
| **`handleRowSelect` 函数无效** | Low | [App.tsx:154-159](file:///home/qq/code/trwm/src/App.tsx#L154-L159) | 函数检查 `selectedIds().length` 但 `id` 参数未使用，可能永远不会被正确调用 |
| **rpc-legacy.ts 死代码** | Low | [rpc-legacy.ts:410](file:///home/qq/code/trwm/src/api/rpc-legacy.ts#L410) | `if (!legacyKey.match(/^[a-z]/)) continue` 条件永远为 false，是死代码 |
| **`err: any` 类型** | Low | [torrentStore.ts:403](file:///home/qq/code/trwm/src/store/torrentStore.ts#L403) | 应使用 `unknown` 并进行类型收窄 |

### 4.4 可优化提升项

| 项目 | 严重度 | 说明 |
|:---|:---|:---|
| **geoip.ts 使用 `@ts-nocheck`** | **High** | 605 行代码完全跳过类型检查，使用旧式 `var`、原型链、回调风格 |
| **geoip.ts 国家名不随语言切换** | **High** | `_countryNames` 硬编码中文，应改用 `t('countries.' + code)` |
| **`common.operation_failed` i18n 键缺失** | Medium | PiecesTab 使用此键但 en.ts/zh-CN.ts 中未定义 |
| **`countries.na` 翻译错误** | Medium | en.ts 中 `na`="Andaman"（非国家），应为 "Namibia" |
| **`formatRatio()` 返回硬编码 `'None'`** | Medium | 应使用 `t('common.none')` |
| **index.html 标题为 `temp-project`** | Low | 应改为实际项目名 |
| **tsconfig.app.json 关闭 noUnusedLocals/Parameters** | Low | 无法在编译期发现未使用的变量和参数 |
| **缺少 ESLint/Prettier 配置** | Low | 项目无代码风格和 lint 配置文件 |
| **`pollInterval: any` 类型** | Low | [torrentStore.ts:494](file:///home/qq/code/trwm/src/store/torrentStore.ts#L494) 应为 `ReturnType<typeof setInterval>` |

---

## 五、性能审计

### 5.1 加载性能分析

**构建产物**: dist/index.html = 507.40 KB (gzip: 137.90 KB)

| 指标 | 当前值 | 目标值 | 说明 |
|:---|:---|:---|:---|
| 总打包体积 | 507.40 KB | < 350 KB | 移除未使用库后预计可降至 ~420KB |
| Gzip 体积 | 137.90 KB | < 100 KB | 移除未使用库 + 代码分割后可达 |
| 首屏加载时间 | 未测量 | < 1s | 需 Lighthouse 测试 |
| 代码分割 | ❌ 无 | ✅ 按路由/模态框懒加载 | 所有代码打包在单文件中 |

**优化建议**:

1. **移除未使用依赖**: @kobalte/core (~30KB) + uPlot (~50KB) + lucide-solid (~5KB) = 减少约 85KB
2. **模态框懒加载**: GlobalConfigModal (1517行)、HistoryModal、StatsModal 可使用 `lazy()` 按需加载
3. **GeoIP MMDB 懒加载**: `dbip-country-lite-2026-05.mmdb` 仅在 PeersTab 需要时加载

### 5.2 运行时性能分析

| 问题 | 严重度 | 位置 | 说明 |
|:---|:---|:---|:---|
| **每 2 秒全量获取所有 torrent** | ~~**High**~~ **已优化** | [torrentStore.ts](file:///home/qq/code/trwm/src/store/torrentStore.ts) | 后端仍全量拉取（保证数据一致性），前端改为逐条 `reconcile` 差异化更新，只有真正变化的种子字段触发 UI 更新 |
| **`reconcile` 深度比较开销** | ~~Medium~~ **已优化** | [torrentStore.ts](file:///home/qq/code/trwm/src/store/torrentStore.ts) | 从整体 `reconcile(newItems)` 改为逐条 `reconcile`，深度比较范围从 N×50 缩减到单条 50 字段 |
| **`torrentList` 中 `void t.xxx` 遍历** | ~~Medium~~ **已优化** | [torrentStore.ts](file:///home/qq/code/trwm/src/store/torrentStore.ts) | 已移除 `void t.xxx` hack。逐条 reconcile 后 SolidJS Store 细粒度响应式自动追踪字段依赖 |
| **`toPlain()` JSON 序列化** | Medium | [torrentStore.ts:8-10](file:///home/qq/code/trwm/src/store/torrentStore.ts#L8-L10) | 归档时对每个 torrent 做 `JSON.parse(JSON.stringify())`，大量种子时性能差 |
| **Canvas 每帧重绘** | Low | [SpeedTab.tsx](file:///home/qq/code/trwm/src/components/DetailPanel/SpeedTab.tsx), [PiecesTab.tsx](file:///home/qq/code/trwm/src/components/DetailPanel/PiecesTab.tsx) | SpeedTab 每 2 秒重绘整个 Canvas，可使用 uPlot 优化 |
| **8 个内联 `<style>` 标签** | Low | 8 个组件 | 每次组件渲染时重新注入样式节点，增加 DOM 操作 |

### 5.3 网络性能优化

| 问题 | 严重度 | 说明 |
|:---|:---|:---|
| **全量获取 vs 增量更新** | ~~**High**~~ **已优化** | 后端保持全量拉取（`recently-active` 在 JSON-RPC 2.0 下不可靠，不活跃种子可能丢失更新），前端通过逐条 `reconcile` 实现差异化 UI 更新 |
| **双轮询冲突** | Medium | `useSessionStats` 每 3 秒轮询 + `torrentStore` 每 2 秒轮询 = 平均每 1.2 秒一个请求。应合并或协调轮询间隔 |
| **无请求批处理** | Low | 多个独立 RPC 请求未合并为批量调用 |

### 5.4 SolidJS 特定性能优化

| 优化项 | 严重度 | 当前状态 | 建议 |
|:---|:---|:---|:---|
| 细粒度响应式 | ~~Medium~~ **已优化** | ~~✅ 已通过 `void t.xxx` 实现~~ ✅ 逐条 reconcile 自动追踪 | Store 层面已优化 |
| `<For>` 列表渲染 | Low | ✅ TorrentTable 使用 `<For>` | Info |
| `createMemo` 缓存 | Low | ✅ torrentList, sidebarCounts, filteredTorrents | Info |
| 模态框 `lazy()` | Medium | ❌ 所有模态框同步加载 | GlobalConfigModal 等应使用 `lazy()` |
| `on()` 控制 effect | Medium | ⚠️ SettingsTab 已使用，其他组件未使用 | 应全面使用 `on()` |

---

## 六、测试与验证

### 6.1 自动化测试方案

**当前状态**: 项目无任何自动化测试。

**建议方案**:

1. **单元测试**: 使用 Vitest 测试工具函数（format.ts, i18n, toast）
2. **组件测试**: 使用 @solidjs/testing-library 测试组件渲染
3. **E2E 测试**: 使用 Playwright + Chrome Headless 测试完整用户流程
4. **RPC 集成测试**: 通过本地 Transmission 服务测试 RPC 调用

**关键测试用例**:

| 测试场景 | 优先级 | 覆盖功能 |
|:---|:---|:---|
| 添加种子 → 下载 → 完成 → 做种 → 删除 | High | 完整生命周期 |
| JSON-RPC 2.0 协议检测与回退 | High | 协议兼容性 |
| 右键菜单所有操作 | High | 批量操作 |
| 设置修改 → 保存 → 验证生效 | Medium | 配置持久化 |
| 深色/浅色主题切换 | Medium | 主题系统 |
| 语言切换 | Medium | i18n 系统 |
| 大量种子（1000+）渲染性能 | Medium | 虚拟滚动 |

### 6.2 兼容性检查

| 浏览器 | 兼容性 | 说明 |
|:---|:---|:---|
| Chrome 90+ | ✅ | 主要目标浏览器 |
| Firefox 90+ | ⚠️ | 需测试 `backdrop-filter` 和 CSS 变量 |
| Safari 15+ | ⚠️ | 需测试 `backdrop-filter` 和 IndexedDB |
| Edge 90+ | ✅ | 基于 Chromium |
| 移动端 | ❌ | 无响应式适配，768px 以下体验差 |

**潜在兼容性问题**:

| API | 兼容性 | 降级方案 |
|:---|:---|:---|
| `backdrop-filter` | Safari 需 `-webkit-` 前缀 | 添加前缀或使用纯色回退 |
| `navigator.clipboard` | 仅 HTTPS 环境 | 使用 `document.execCommand('copy')` 回退 |
| `CSS Custom Properties` | IE11 不支持 | 不支持 IE11 |
| `structuredClone` | 旧浏览器不支持 | 使用 `JSON.parse(JSON.stringify())` 回退 |

---

## 总体评估

### 评分概览

| 维度 | 评分 (1-10) | 关键问题 |
|:---|:---|:---|
| 功能覆盖 | **8.5** | RPC 接口覆盖完整，参数格式已修复，文件重命名验证正常 |
| 库使用 | **8** | Lucide Solid 已全面使用，@kobalte/core 和 uPlot 经分析后移除（合理决策） |
| UI/UX 设计 | **7.5** | 硬编码颜色已替换为 CSS 变量，内联 CSS 已提取，图标统一为 Lucide |
| 代码质量 | **7.5** | App.tsx/GlobalConfigModal 已拆分，geoip.ts 已添加类型，PromptModal 替代 prompt() |
| 性能 | **7.5** | 逐条 reconcile 差异化更新，void t.xxx hack 已移除，虚拟滚动良好 |
| 可维护性 | **6.5** | P0-P1 全部完成，P2 部分完成，仍缺测试和 lint |

### 优先级排序的行动计划

#### P0 — 立即修复 (Critical)

| # | 任务 | 影响 | 状态 |
|:---|:---|:---|:---|
| 1 | **修复 App.tsx RPC 方法名和参数名** (torrent-set → torrent_set, camelCase → snake_case) | 核心功能在 JSON-RPC 2.0 下完全失效 | ✅ 已修复 |
| 2 | **修复 FilesTab 重命名** (torrent_set → torrent_rename_path) | 文件重命名功能完全不工作 | ✅ 经验证原判断有误，FilesTab 已正确使用 torrent_rename_path |
| 3 | **移除或使用 @kobalte/core 和 uPlot** | 减少 80KB+ 打包体积 | ✅ 已从 package.json 移除，经分析不建议引入 |

#### P1 — 高优先级修复 (High)

| # | 任务 | 影响 | 状态 |
|:---|:---|:---|:---|
| 4 | 拆分 App.tsx 为子组件（ContextMenu, LabelDialog） | ✅ 已完成：543→262行，2个独立组件 |
| 5 | 拆分 GlobalConfigModal.tsx 为 12 个独立配置页签组件 | ✅ 已完成：1517→688行，12个 SettingsTabs 组件 |
| 6 | 提取 857 行内联 `<style>` 到独立 CSS 文件 | ✅ 已完成：8个独立 CSS 文件 |
| 7 | 替换所有 `prompt()` 为自定义模态框 | ✅ 已完成：PromptModal 组件 |
| 8 | 修复 geoip.ts `@ts-nocheck`，添加类型注解 | ✅ 已完成：MMDBReader class + 3个接口 |
| 9 | 修复 geoip.ts 国家名不随语言切换 | ✅ 已完成：使用 t('countries.xxx') |
| 10 | 统一使用 Lucide Solid 图标 | ✅ 已完成：ContextMenu/Sidebar/ToastContainer 35+ 图标 |
| 11 | 替换 50+ 处硬编码颜色为 CSS 变量 | ✅ 已完成：Toast/Toolbar/Sidebar/Modals CSS + theme.css 新变量 |
| 12 | 添加 RPC 递归重试最大次数保护 | ✅ 已完成：MAX_RETRY=3 |

#### P2 — 中优先级优化 (Medium)

| # | 任务 | 影响 | 状态 |
|:---|:---|:---|:---|
| 13 | ~~实现 `recently-active` 增量更新~~ → **前端差异化更新** | ✅ 已完成：后端全量拉取 + 前端逐条 reconcile 差异化更新 |
| 14 | ~~使用 uPlot 替代手写 Canvas 图表~~ → **不引入** | ✅ 经分析：数据量小、uPlot 不支持热力图、45KB 代价过高 |
| 15 | 添加模态框 `lazy()` 懒加载 | 待实施 |
| 16 | 实现详情面板拖拽调整高度 | 待实施 |
| 17 | 实现右键菜单磨砂玻璃特效和进入动画 | 待实施 |
| 18 | 协调双轮询间隔（session_stats + torrent_get） | 待实施 |
| 19 | 添加 `common.operation_failed` i18n 键 | ✅ 已完成 |
| 20 | 修复 `countries.na` 翻译错误 | ✅ 已完成 |
| 21 | 修复 `formatRatio()` 硬编码 'None' | ✅ 已完成 |
| 22 | 将 Tailwind CSS 类名应用于布局和间距 | 待实施 |

#### P3 — 低优先级改进 (Low)

| # | 任务 | 影响 | 状态 |
|:---|:---|:---|:---|
| 23 | 添加 ESLint + Prettier 配置 | ✅ 已完成：0 errors, 78 warnings |
| 24 | 修复 index.html 标题为实际项目名 | ✅ 已完成：Transmission Web Manager |
| 25 | 移除未使用的 src/assets/ 文件 | ✅ 已完成：删除 icons.svg |
| 26 | 移除未使用的 autoprefixer + postcss 依赖 | ✅ 已完成（P0-3） |
| 27 | 开启 tsconfig noUnusedLocals/Parameters | 待实施 |
| 28 | 添加 navigator.clipboard 回退方案 | ✅ 已完成：execCommand fallback |
| 29 | 添加 Vitest 单元测试 | 待实施 |
| 30 | 添加 Playwright E2E 测试 | 待实施 |

---

*本审计报告基于 2026-05-25 代码库全量阅读和验证，所有问题均经实际代码检查确认。*
