# Transmission Web Manager

一个现代化、功能丰富的 Transmission BitTorrent 客户端 Web 管理界面，采用纯前端架构，支持桌面端和移动端。

## 特性概览

### 种子管理
- 完整的种子生命周期管理：开始/暂停/立即开始/停止/删除
- 种子校验与重新宣告
- 批量选中与操作
- 队列管理：上移/下移/移至顶部/移至底部
- 删除种子（可选同时删除数据）
- 顺序下载支持

### 详情面板（6 个标签页）
- **基本信息**：名称、Hash、状态、进度、大小、速度、分享率、ETA、时间戳、错误信息等 30+ 属性
- **文件**：文件列表、进度显示、优先级设置（高/正常/低/不下载）、批量优先级操作
- **Tracker**：Tracker 列表与状态、做种/下载数、宣告时间与结果、添加/替换 Tracker
- **Peer**：Peer 列表、国家/地区旗帜（GeoIP）、客户端识别、加密/uTP 标识、Peer 来源统计
- **速度**：实时速度折线图（Canvas 绘制）、累计统计、分享率
- **设置**：单种子限速、带宽优先级、最大连接数、分享率模式、做种空闲超时、下载目录移动

### 筛选与搜索
- 状态筛选：全部、下载中、做种中、已停止、校验中、活跃、错误、排队中
- Tracker 域名分组筛选
- 下载目录分组筛选
- 标签分组筛选
- 实时搜索：支持名称、Hash、标签、注释、创建者、目录、分组等多字段匹配
- 多维度筛选条件组合

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

### 状态栏
- 连接状态实时指示
- 下载/上传速度
- Peer 连接总数
- 全局分享率
- 种子计数与错误数
- 备用限速开关状态
- 端口连通性检测
- 下载目录可用空间
- Transmission 版本号

### 全局统计
- 实时速度折线图
- 累计/本次会话上传下载统计
- 种子状态分布条形图
- 系统信息总览

### 设置管理（11 个分类）
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

### GeoIP 国家识别
- 自定义二进制格式 GeoIP 数据库（IPv4 + IPv6）
- 二分查找快速定位
- 国家旗帜 SVG 图标显示
- IPv4-mapped IPv6 地址支持
- 私有 IP 地址识别（LAN 标识）
- Python 转换脚本（MaxMind GeoLite2 MMDB → 自定义 bin）

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
| `Escape` | 清除选择/关闭弹窗 |

## 系统要求

| 组件 | 最低版本 | 推荐版本 |
|------|----------|----------|
| Transmission | 3.0+ | 4.0+ |
| Chrome | 70+ | 最新 |
| Firefox | 65+ | 最新 |
| Safari | 13+ | 最新 |
| Edge | 79+ | 最新 |

> 注：带宽组（group-get/group-set）功能需要 Transmission 4.0+。

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
│   └── geoip/
│       └── geoip.bin           # 自定义格式 GeoIP 数据库
├── convert_mmdb.py             # MMDB → bin 转换脚本
└── LICENSE                     # Apache License 2.0
```

## 技术架构

- **前端框架**：原生 JavaScript (ES5) + jQuery 3.7.1
- **样式方案**：Tailwind CSS 3.0 + CSS 自定义属性（主题变量）
- **通信协议**：Transmission RPC（JSON over HTTP POST）
- **图表绘制**：Canvas 2D API
- **数据存储**：localStorage（UI 配置持久化）
- **模块化**：IIFE 命名空间模式（`TWC.*`）
- **GeoIP**：自定义二进制格式 + 二分查找算法

### RPC 通信架构

```
浏览器 → HTTP POST → Transmission RPC
         ↑
    JSON-RPC 请求
    {
      "method": "torrent-get",
      "arguments": { "fields": [...], "ids": "recently-active" }
    }
         ↓
    JSON 响应
    {
      "result": "success",
      "arguments": { "torrents": [...], "removed": [...] }
    }
```

支持的 RPC 方法：
- `torrent-get` / `torrent-set` / `torrent-add` / `torrent-remove`
- `torrent-start` / `torrent-start-now` / `torrent-stop`
- `torrent-verify` / `torrent-reannounce`
- `torrent-set-location` / `torrent-rename-path`
- `queue-move-top` / `queue-move-up` / `queue-move-down` / `queue-move-bottom`
- `session-get` / `session-set` / `session-stats` / `session-close`
- `port-test` / `free-space` / `blocklist-update`
- `group-get` / `group-set`（Transmission 4.0+）

### 数据刷新策略

- 首次加载：全量获取所有种子
- 后续刷新：使用 `recently-active` 增量获取 + 选中种子全量更新
- 刷新间隔：可配置（2s/5s/10s/30s/60s）
- 操作后立即刷新
- 速度历史：每秒采样，保留最近 120 个数据点

## 已知问题与改进计划

### 已知 Bug
- 全局分享率计算条件有误（`totalDownloaded` 重复判断）
- 下载中/排队中状态计数重叠（status=3 被两处同时计入）
- `getSession` 的 `fields` 参数被忽略
- 大文件 Base64 编码可能导致栈溢出
- 刷新竞态条件可能导致数据更新丢失

### 性能优化方向
- 分层字段请求（列表/详情分离）
- 差异化 DOM 更新（增量渲染）
- 增量索引更新（避免全量重建）
- RPC 请求合并
- 环形缓冲区替代 Array.shift

### 功能规划
- 国际化（i18n）多语言支持
- JSON-RPC 2.0 协议适配（Transmission 4.1.0+）
- 拖拽添加种子文件
- 浏览器通知推送
- 多服务器连接配置
- 文件树形视图
- 带宽调度可视化编辑

## GeoIP 数据库更新

```bash
# 1. 下载 MaxMind GeoLite2-Country MMDB 文件
#    https://dev.maxmind.com/geoip/geolite2-free-geolocation-data

# 2. 转换为自定义格式
pip install maxminddb
python convert_mmdb.py

# 3. 输出文件
#    assets/geoip/geoip.bin
```

## 许可证

Apache License 2.0

## 致谢

- [Transmission](https://github.com/transmission/transmission) — BitTorrent 客户端
- [transmission-web-control](https://github.com/ronggang/transmission-web-control) — 原始 Web 控制界面
- [MaxMind GeoLite2](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data) — 国家/地区 IP 数据库
