# Transmission Web Manager (TRWM) 全面审计报告

> 审计日期：2026-05-25  
> 审计范围：src/ 全量代码 + oldsrc/ 对比 + Transmission 4.1 RPC 官方规范  
> 审计人：资深前端架构师

---

## 一、功能覆盖完整性审计

### 1.1 RPC 接口覆盖

**已实现的方法（24个）**：
`torrent_get`, `torrent_add`, `torrent_remove`, `torrent_set`, `torrent_start`, `torrent_start_now`, `torrent_stop`, `torrent_verify`, `torrent_reannounce`, `torrent_set_location`, `torrent_rename_path`(仅映射), `session_get`, `session_set`, `session_stats`, `port_test`, `blocklist_update`, `free_space`, `group_get`, `group_set`, `queue_move_up/down/top/bottom`

**缺失的方法**：
| 方法 | 等级 | 说明 |
|---|---|---|
| `session_close` | Low | 关闭当前会话，极少使用 |
| `torrent_rename_path` 便捷封装 | Medium | Legacy映射存在但Store层无封装，FilesTab中无法重命名文件 |

**参数命名严重问题**：
| 位置 | 等级 | 问题 |
|---|---|---|
| App.tsx 第223-293行 | **Critical** | `torrent-set` 调用使用 camelCase 参数名(`bandwidthPriority`, `downloadLimited`等)，在 JSON-RPC 2.0 模式下 Transmission 4.1+ 期望 snake_case，可能导致参数无法识别 |

### 1.2 配置项完整性

**GlobalConfigModal 已实现的配置标签页**：Download, Speed, Groups, Network, Peer, Seeding, Queue, Labels, Blocklist, RPC, Script

**缺失的配置项**：
| 配置项 | 等级 | 说明 |
|---|---|---|
| `default_trackers` | High | 默认注入Tracker列表，Transmission 4.0+新增 |
| `preferred_transports` | Medium | 传输协议优先级(utp,tcp)，Transmission 4.0+新增 |
| `scrape_paused_torrents_enabled` | Medium | 是否对暂停种子执行Scrape |
| `cache_size_mib` | Low | 磁盘缓存大小 |
| `anti_brute_force_*` | Low | 防暴破设置 |
| `rename_partial_files` | Medium | 未完成文件添加后缀 |
| `trash_original_torrent_files` | Medium | 添加后删除原始种子文件 |
| `lpd_enabled` | Medium | 本地Peer发现 |
| `encryption` | Medium | 加密偏好(required/preferred/tolerated) |

### 1.3 数据展示完整性

**TorrentTable 列**：当前约10列，原项目支持更多列且可配置显隐

| 缺失功能 | 等级 | 说明 |
|---|---|---|
| 列显隐配置 | High | 原项目支持右键显隐列，新项目缺失 |
| 列宽拖拽调整 | Medium | 原项目支持，新项目缺失 |
| 列排序 | Medium | 点击表头排序 |
| `eta_idle` 列 | Low | 空闲ETA |
| `recheck_progress` 列 | Low | 校验进度 |
| `webseeds_sending_to_us` 列 | Low | WebSeed数 |

### 1.4 用户交互流程

| 缺失功能 | 等级 | 说明 |
|---|---|---|
| 文件重命名 | High | FilesTab无重命名功能，原项目支持行内重命名 |
| 拖拽调整详情面板高度 | Medium | 设计方案要求但未实现 |
| 批量标签设置 | Medium | 右键菜单有入口但功能简陋 |
| Shift多选 | Medium | TorrentTable多选逻辑不完整 |
| 移动端适配 | Low | 设计方案要求但未实现 |

---

## 二、库与浏览器新特性审计

### 2.1 设计方案指定库的使用检查

| 库 | 设计方案要求 | 实际状态 | 问题 |
|---|---|---|---|
| Solid.js ^1.9.0 | ✅ | ✅ 已引入 ^1.9.12 | 正确使用 |
| Vite ^5.0.0 | ✅ | ⚠️ 已引入 ^8.0.12 | 版本高于设计方案，但无问题 |
| Dexie.js ^4.0.0 | ✅ | ✅ 已引入 ^4.4.2 | 正确使用 |
| @tanstack/solid-virtual ^3.0.0 | ✅ | ✅ 已引入 ^3.13.25 | 正确使用 |
| **@kobalte/core ^0.13** | ✅ | ⚠️ 已引入但**未使用** | **严重浪费** - 引入了Headless UI库但没有任何组件使用它 |
| **uPlot ^1.6** | ✅ | ⚠️ 已引入但**未使用** | **严重浪费** - SpeedTab使用Canvas手绘图表而非uPlot |
| **Lucide Solid ^1.16** | ✅ | ⚠️ 已引入但**极少使用** | 大量使用emoji和手写SVG代替图标库 |
| Tailwind CSS ^4.3.0 | ✅ | ✅ 已引入 | 但组件中几乎未使用，仍用手写CSS |
| dayjs ^1.11.20 | 未指定 | ✅ 已引入 | format.ts中使用，合理 |
| @tanstack/solid-query ^5.100 | 未指定 | ✅ 已引入 | queries.ts中使用，合理 |

### 2.2 未充分利用的现有库

| 库 | 当前使用 | 应有使用 | 等级 |
|---|---|---|---|
| **@kobalte/core** | 完全未使用 | Dialog/Select/Dropdown/Tooltip等组件 | **High** |
| **uPlot** | 完全未使用 | SpeedTab速度图表 | **High** |
| **Lucide Solid** | 极少使用 | 所有图标统一使用Lucide | **Medium** |
| **Tailwind CSS** | 几乎未使用 | 全局样式系统 | **Medium** |

### 2.3 不必要的依赖

| 依赖 | 问题 | 建议 |
|---|---|---|
| `@kobalte/core` | 引入但未使用，增加打包体积 | 要么使用它，要么移除 |
| `uPlot` | 引入但未使用 | 要么在SpeedTab中使用，要么移除 |
| `lucide-solid` | 引入但几乎未使用 | 统一使用或移除 |

### 2.4 建议引入的新库

| 库 | 收益 | 成本 | 风险 |
|---|---|---|---|
| 无需额外引入 | 已有库足够 | - | - |

### 2.5 浏览器新特性审计

| 特性 | 设计方案要求 | 实际状态 |
|---|---|---|
| Canvas 2D | Pieces矩阵+Speed图表 | ✅ Pieces已实现，Speed用Canvas手绘 |
| IndexedDB (Dexie) | 历史快照引擎 | ✅ 已实现 |
| Drag and Drop API | 拖拽.torrent文件 | ✅ 已实现 |
| FileReader API | Base64编码 | ✅ 已实现 |
| IntersectionObserver | 虚拟滚动 | ✅ 通过@tanstack/solid-virtual实现 |
| ResizeObserver | 详情面板拖拽resize | ❌ 未实现 |
| CSS Custom Properties | 全局换肤 | ✅ 已实现 |
| CSS Grid | 布局 | ✅ 部分使用 |

---

## 三、UI/UX 设计审计

### 3.1 行间距过大问题（核心问题）

| 位置 | 当前值 | 建议值 | 等级 |
|---|---|---|---|
| `settings-group` gap | 16px | 12px | Medium |
| `settings-section` gap | 12px | 8px | Medium |
| `form-group` margin-bottom | 12px | 8px | Medium |
| `form-group` gap | 6px | 4px | Low |
| `checkbox-stack` gap | 10px | 6px | Medium |
| `checkbox-grid-2x2` gap | 10px 16px | 6px 12px | Medium |
| `pieces-legend` gap | 12px | 8px | Low |
| PeersTab `peers-table td` padding | 2px 8px | ✅ 已优化 | - |
| 右键菜单 `cm-item` padding | 4px 10px | ✅ 已优化 | - |

### 3.2 整体设计一致性问题

| 问题 | 等级 | 说明 |
|---|---|---|
| 图标使用不统一 | High | 混用emoji(▶ⓘ×)、手写SVG、Lucide图标，应统一使用Lucide |
| CSS实现方式不统一 | High | 混用内联style标签、CSS文件、Tailwind类名，应统一 |
| 字体大小不统一 | Medium | 标签页标题、表头、正文、辅助文字的字体大小缺乏统一规范 |
| 深色/浅色模式 | Medium | theme.css已定义变量但部分组件硬编码颜色值 |

### 3.3 Tailwind CSS 引入可行性

**当前状态**：Tailwind CSS 已通过 `@tailwindcss/vite` 插件引入，但组件中几乎未使用Tailwind类名，仍以手写CSS为主。

**建议**：
- **不建议全面迁移**：项目已有大量手写CSS，全面迁移成本高且风险大
- **建议渐进式采用**：新组件优先使用Tailwind类名，旧组件逐步迁移
- **核心收益**：统一间距/字体/颜色规范，减少CSS重复

### 3.4 用户体验优化点

| 问题 | 等级 | 建议 |
|---|---|---|
| 详情面板无拖拽调整高度 | Medium | 实现ResizeObserver拖拽 |
| 种子列表无列排序 | Medium | 点击表头排序 |
| 无列显隐配置 | High | 右键表头显隐列 |
| 搜索无高亮匹配 | Low | 搜索结果高亮 |
| 无拖拽排序种子 | Low | 拖拽调整队列位置 |

---

## 四、代码质量与可维护性审计

### 4.1 SolidJS 最佳实践

| 问题 | 等级 | 位置 | 说明 |
|---|---|---|---|
| **组件内大段内联CSS** | High | 所有组件 | 每个组件用`<style>`标签内联数百行CSS，应提取到独立CSS文件或使用Tailwind |
| **`void t.xxx` 建立依赖** | Medium | torrentStore.ts, DetailPanel.tsx | 通过`void`访问属性建立响应式依赖是workaround，SolidJS官方推荐使用`createMemo`或`untrack` |
| **geoip.ts使用`@ts-nocheck`** | High | geoip.ts | 完全禁用类型检查，约600行代码无任何类型安全 |
| **`createRoot`警告** | Medium | queries.ts | `@tanstack/solid-query`的`createQuery`在组件外创建计算，产生控制台警告 |
| **App.tsx过于庞大** | High | App.tsx (~600行) | 包含右键菜单、标签对话框、快捷键、拖拽等所有逻辑，应拆分 |

### 4.2 潜在Bug与逻辑缺陷

| 问题 | 等级 | 位置 | 说明 |
|---|---|---|---|
| **RPC参数命名不一致** | **Critical** | App.tsx L223-293 | `torrent-set`在JSON-RPC 2.0模式下使用camelCase参数名，可能导致Transmission 4.1+无法识别 |
| **geoip.ts国家名与i18n脱节** | Medium | geoip.ts | 切换英文后GeoIP仍显示中文国名 |
| **en.ts国家名翻译错误** | Medium | en.ts | `countries.na`值为"Andaman"，应为"Namibia" |
| **`copyMagnet`手动构造磁力链接** | Low | App.tsx | 应使用种子的`magnet_link`字段 |
| **SpeedTab手绘Canvas而非uPlot** | Medium | SpeedTab.tsx | 引入了uPlot但未使用，手绘Canvas功能简陋 |
| **`isFetching`非响应式** | Low | torrentStore.ts | 模块级变量，UI无法追踪加载状态 |
| **标签对话框状态在App组件内** | Low | App.tsx | 未放入modalStore统一管理 |

### 4.3 内存泄漏风险

| 问题 | 等级 | 位置 | 说明 |
|---|---|---|---|
| **PiecesTab canvas未清理** | Low | PiecesTab.tsx | `createEffect`中获取canvas context但无cleanup |
| **geoip.ts XHR无abort** | Low | geoip.ts | 网络请求未提供取消机制 |
| **SpeedTab canvas动画无cleanup** | Medium | SpeedTab.tsx | `requestAnimationFrame`可能未正确取消 |

### 4.4 代码结构建议

| 建议 | 优先级 | 说明 |
|---|---|---|
| 拆分App.tsx | High | 右键菜单、标签对话框、快捷键分别提取为独立组件 |
| 提取内联CSS | High | 所有组件的`<style>`标签内容提取到CSS文件 |
| 统一RPC调用层 | Medium | App.tsx中直接调用rpcCall应通过Store层封装 |
| 修复geoip.ts类型 | Medium | 移除`@ts-nocheck`，添加类型定义 |

---

## 五、性能审计

### 5.1 加载性能

| 指标 | 当前值 | 目标值 | 说明 |
|---|---|---|---|
| 构建产物大小 | 507 KB | < 300 KB | 包含未使用的@kobalte/core和uPlot |
| Gzip大小 | 138 KB | < 80 KB | 移除未使用依赖后预计可降低40% |
| 首屏加载 | 未测试 | < 1s | 需要Lighthouse测试 |

**优化建议**：
1. **移除未使用的@kobalte/core**：预计减少约50KB
2. **移除或使用uPlot**：预计减少约30KB
3. **统一使用Lucide图标**：移除内联SVG，按需引入图标
4. **代码分割**：Modals组件懒加载

### 5.2 运行时性能

| 问题 | 等级 | 说明 |
|---|---|---|
| **每2秒全量获取所有torrent** | High | 不使用`recently-active`，每次传输所有种子完整数据，种子多时带宽浪费 |
| **`reconcile`深度比较开销** | Medium | 每次轮询都创建完整newItems对象并用reconcile比较，种子多时CPU开销大 |
| **`torrentList`中`void t.xxx`遍历** | Medium | 每次计算都遍历所有种子访问6个属性，O(n)开销 |
| **SpeedTab Canvas手绘** | Low | 每秒重绘，但实现简单，性能影响小 |

**优化建议**：
1. **恢复`recently-active`增量更新**：但需修复JSON-RPC 2.0下不返回数据的问题
2. **使用`produce`替代`reconcile`**：对于delta update，`produce`更高效
3. **Memo化`sidebarCounts`**：当前每次访问都重新计算

### 5.3 网络性能

| 问题 | 等级 | 说明 |
|---|---|---|
| **轮询间隔2秒** | Medium | 固定间隔，无自适应调整 |
| **session_stats独立轮询3秒** | Low | 与torrent轮询不同步，多一次请求 |
| **无请求合并** | Low | 多个组件可能同时触发相同RPC请求 |

---

## 六、测试与验证

### 6.1 自动化测试方案

**推荐工具**：Playwright + Chrome Headless

**核心测试用例**：
1. 添加磁力链接 → 验证列表显示 → 验证详情面板数据
2. 暂停/继续种子 → 验证状态变化
3. 设置限速 → 验证参数正确传递
4. 删除种子 → 验证历史归档
5. 切换标签页 → 验证数据不丢失
6. 切换语言 → 验证所有文本更新

### 6.2 兼容性

| 浏览器 | 兼容性 | 说明 |
|---|---|---|
| Chrome 90+ | ✅ | 主要目标浏览器 |
| Firefox 90+ | ⚠️ | 需测试CSS Custom Properties和Canvas |
| Safari 15+ | ⚠️ | 需测试backdrop-filter |
| Edge 90+ | ✅ | 基于Chromium |
| 移动端 | ❌ | 未实现响应式设计 |

---

## 七、总体评估与优先级行动计划

### 总体评分

| 维度 | 评分(1-10) | 说明 |
|---|---|---|
| 功能覆盖 | 7 | 核心功能完整，缺少文件重命名、列配置等 |
| 代码质量 | 5 | App.tsx过于庞大，内联CSS，geoip无类型检查 |
| UI/UX | 6 | 基本可用，行间距偏大，图标不统一 |
| 性能 | 6 | 基本流畅，全量轮询有优化空间 |
| 库使用 | 4 | 3个库引入但未使用，严重浪费 |
| 可维护性 | 5 | 组件拆分不足，CSS分散 |

### 优先级行动计划

**P0 - 立即修复（Critical）**：
1. 修复App.tsx中`torrent-set`的RPC参数命名问题（camelCase→snake_case）
2. 移除未使用的@kobalte/core和uPlot依赖（减少50%+打包体积）

**P1 - 高优先级（High）**：
3. 拆分App.tsx（右键菜单、标签对话框、快捷键独立组件）
4. 提取组件内联CSS到独立文件或使用Tailwind
5. 实现FilesTab文件重命名功能
6. 实现TorrentTable列显隐配置
7. 统一图标使用Lucide Solid
8. 修复geoip.ts的`@ts-nocheck`问题

**P2 - 中优先级（Medium）**：
9. 恢复`recently-active`增量更新（需修复JSON-RPC 2.0兼容性）
10. 在SpeedTab中使用uPlot替代手绘Canvas
11. 添加GlobalConfigModal缺失的配置项
12. 修复geoip.ts国家名与i18n系统脱节
13. 修复en.ts国家名翻译错误
14. 实现详情面板拖拽调整高度
15. 优化行间距（统一缩小20-30%）

**P3 - 低优先级（Low）**：
16. 添加Playwright自动化测试
17. 实现移动端适配
18. 优化`isFetching`为响应式Signal
19. 添加请求合并和缓存策略
