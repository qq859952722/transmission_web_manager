# Transmission RPC 接口与字段实现对照清单

**项目**: Transmission Web Manager\
**目标版本**: Transmission 4.1.x (RPC semver 6.0.1, rpc-version: 19)\
**兼容版本**: Transmission 3.0+ (RPC 15-16)\
**更新日期**: 2026-05-04\
**验证实例**: Transmission 4.1.1 @ 127.0.0.1:9091

***

## 一、协议差异概述

> **重要说明**: Transmission 4.1.x **同时支持两种协议**。本项目当前使用的是**旧协议格式**（`method`+`arguments`），通过 `_convertResponseKeys()` 将 camelCase 响应转换为内部 snake\_case 使用。JSON-RPC 2.0 协议为 4.1.x 新增支持，未来版本将移除旧协议。

| 特性      | 4.1.x (JSON-RPC 2.0)                                          | 4.1.x (旧协议兼容)                                     | 老版本 (Legacy RPC ≤16)                     |
| ------- | ------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| 协议标准    | JSON-RPC 2.0 (RFC 8259)                                       | 自定义 JSON 格式 (已废弃)                                 | 自定义 JSON 格式                              |
| 请求格式    | `{"jsonrpc":"2.0","method":"torrent_get","params":{},"id":N}` | `{"method":"torrent-get","arguments":{},"tag":N}` | 同左                                       |
| 响应格式    | `{"jsonrpc":"2.0","result":{数据},"id":N}`                      | `{"result":"success","arguments":{数据},"tag":N}`   | 同左                                       |
| 字段命名    | **snake\_case** (如 `hash_string`, `download_dir`)             | **camelCase/kebab-case 混合** + 新字段 snake\_case     | **camelCase/kebab-case** 混合              |
| 错误处理    | JSON-RPC 2.0 Error 对象 (`code`, `message`, `data`)             | `result` 字段返回错误字符串                                | 同左                                       |
| 通知支持    | 支持 (HTTP 204)                                                 | 不支持                                               | 不支持                                      |
| RPC 版本号 | `rpc-version-semver` (如 "6.0.1")                              | `rpc-version` (如 19)                              | `rpc-version` (如 16)                     |
| 加密枚举值   | `required`, `preferred`, **`allowed`**                        | `required`, `preferred`, **`tolerated`**          | `required`, `preferred`, **`tolerated`** |
| 缓存字段名   | `cache_size_mib`                                              | `cache-size-mb`                                   | `cache-size-mb`                          |
| 本项目使用   | ❌ 未使用                                                         | ✅ **当前使用**                                        | ✅ 兼容适配                                   |

> **实测验证** (Transmission 4.1.1):
>
> - 使用旧协议请求 `{"method":"session-get",...}` → 响应 `{"result":"success","arguments":{...},"encryption":"tolerated"}`
> - 使用 JSON-RPC 2.0 请求 `{"jsonrpc":"2.0","method":"session_get",...}` → 响应 `{"jsonrpc":"2.0","result":{...},"encryption":"allowed"}`
> - 旧协议中，4.1.x 新增字段（如 `preferred_transports`、`sequential_download`）已使用 snake\_case

***

## 二、RPC 方法对照表

### 2.1 种子操作方法

| 方法 (4.1.x)           | 方法 (老版本)             | 功能          | 本项目实现                    |
| -------------------- | -------------------- | ----------- | ------------------------ |
| `torrent_start`      | `torrent-start`      | 开始种子        | ✅ `startTorrents()`      |
| `torrent_start_now`  | `torrent-start-now`  | 立即开始（忽略队列）  | ✅ `startNowTorrents()`   |
| `torrent_stop`       | `torrent-stop`       | 停止种子        | ✅ `stopTorrents()`       |
| `torrent_verify`     | `torrent-verify`     | 校验本地数据      | ✅ `verifyTorrents()`     |
| `torrent_reannounce` | `torrent-reannounce` | 重新宣告获取 Peer | ✅ `reannounceTorrents()` |

### 2.2 种子查询与修改

| 方法 (4.1.x)             | 方法 (老版本)               | 功能     | 本项目实现                                            |
| ---------------------- | ---------------------- | ------ | ------------------------------------------------ |
| `torrent_get`          | `torrent-get`          | 获取种子信息 | ✅ `getTorrents()`, `getRecentlyActiveTorrents()` |
| `torrent_set`          | `torrent-set`          | 修改种子属性 | ✅ `setTorrent()`, `setTorrentSequential()`       |
| `torrent_add`          | `torrent-add`          | 添加种子   | ✅ `addTorrent()`                                 |
| `torrent_remove`       | `torrent-remove`       | 删除种子   | ✅ `removeTorrents()`                             |
| `torrent_set_location` | `torrent-set-location` | 移动种子位置 | ✅ `setTorrentLocation()`                         |
| `torrent_rename_path`  | `torrent-rename-path`  | 重命名路径  | ✅ `renamePath()`                                 |

### 2.3 队列管理

| 方法 (4.1.x)          | 方法 (老版本)            | 功能     | 本项目实现                 |
| ------------------- | ------------------- | ------ | --------------------- |
| `queue_move_top`    | `queue-move-top`    | 移至队列顶部 | ✅ `queueMoveTop()`    |
| `queue_move_up`     | `queue-move-up`     | 上移一位   | ✅ `queueMoveUp()`     |
| `queue_move_down`   | `queue-move-down`   | 下移一位   | ✅ `queueMoveDown()`   |
| `queue_move_bottom` | `queue-move-bottom` | 移至队列底部 | ✅ `queueMoveBottom()` |

### 2.4 会话管理

| 方法 (4.1.x)      | 方法 (老版本)        | 功能     | 本项目实现                 |
| --------------- | --------------- | ------ | --------------------- |
| `session_get`   | `session-get`   | 获取会话配置 | ✅ `getSession()`      |
| `session_set`   | `session-set`   | 修改会话配置 | ✅ `setSession()`      |
| `session_stats` | `session-stats` | 获取会话统计 | ✅ `getSessionStats()` |
| `session_close` | `session-close` | 关闭会话   | ✅ `closeSession()`    |

### 2.5 其他方法

| 方法 (4.1.x)         | 方法 (老版本)           | 功能              | 本项目实现                 |
| ------------------ | ------------------ | --------------- | --------------------- |
| `blocklist_update` | `blocklist-update` | 更新屏蔽列表          | ✅ `updateBlocklist()` |
| `port_test`        | `port-test`        | 测试端口连通性         | ✅ `testPort()`        |
| `free_space`       | `free-space`       | 查询磁盘空间          | ✅ `getFreeSpace()`    |
| `group_get`        | `group-get`        | 获取带宽组 (RPC 17+) | ✅ `getGroups()`       |
| `group_set`        | `group-set`        | 设置带宽组 (RPC 17+) | ✅ `setGroup()`        |

> **总计**: 官方 4.1.x 共 24 个 RPC 方法，本项目全部实现 ✅

***

## 三、torrent\_get 字段对照表

> **列说明**: "字段 (4.1.x snake\_case)" 为 JSON-RPC 2.0 协议中的字段名；"字段 (老版本)" 为旧协议格式中的字段名（camelCase/kebab-case/snake\_case 混合）。4.1.x 新增字段在旧协议中可能使用 snake\_case（如 `sequential_download`）或 kebab-case（如 `primary-mime-type`）。标记 `—` 表示该字段为 JSON-RPC 2.0 新增，旧协议中无对应名称。

### 3.1 基本信息字段

| 字段 (4.1.x snake\_case) | 字段 (旧协议格式)                  | 类型        | 说明                     | 本项目使用   |
| ---------------------- | --------------------------- | --------- | ---------------------- | ------- |
| `id`                   | `id`                        | integer   | 种子 ID                  | ✅ 列表/详情 |
| `name`                 | `name`                      | string    | 种子名称                   | ✅ 列表/详情 |
| `hash_string`          | `hashString`                | string    | SHA1 Hash              | ✅ 列表/详情 |
| `total_size`           | `totalSize`                 | number    | 总大小 (bytes)            | ✅ 列表/详情 |
| `status`               | `status`                    | number    | 状态 (0-6)               | ✅ 列表/详情 |
| `is_private`           | `isPrivate`                 | boolean   | 是否私有种子                 | ✅ 详情    |
| `is_finished`          | `isFinished`                | boolean   | 是否已完成                  | ✅ 列表    |
| `is_stalled`           | `isStalled`                 | boolean   | 是否停滞                   | ✅ 列表    |
| `labels`               | `labels`                    | string\[] | 标签列表 (RPC 16+)         | ✅ 列表/详情 |
| `group`                | `group`                     | string    | 带宽组名称 (RPC 17+)        | ✅ 列表/详情 |
| `source`               | `source`                    | string    | 种子来源 (RPC 17+, 官方文档字段) | ✅ 详情    |
| `primary_mime_type`    | `primary-mimqingtonge-type` | string    | MIME 类型 (RPC 17+)      | ✅ 详情    |
| `comment`              | `comment`                   | string    | 注释                     | ✅ 详情    |
| `creator`              | `creator`                   | string    | 创建者                    | ✅ 详情    |
| `date_created`         | `dateCreated`               | number    | 创建时间 (Unix)            | ✅ 详情    |
| `torrent_file`         | `torrentFile`               | string    | .torrent 文件路径          | ✅ 详情    |
| `magnet_link`          | `magnetLink`                | string    | 磁力链接                   | ✅ 详情    |
| `piece_count`          | `pieceCount`                | number    | 分片数量                   | ✅ 详情    |
| `piece_size`           | `pieceSize`                 | number    | 分片大小                   | ✅ 详情    |
| `pieces`               | `pieces`                    | string    | 分片位图 (base64)          | ✅ 详情    |
| `file_count`           | `file-count`                | number    | 文件数量 (RPC 17+)         | ✅ 详情    |

### 3.2 进度与状态字段

| 字段 (4.1.x snake\_case)      | 字段 (老版本)                  | 类型     | 说明                  | 本项目使用   |
| --------------------------- | ------------------------- | ------ | ------------------- | ------- |
| `percent_done`              | `percentDone`             | double | 完成百分比 (0-1)         | ✅ 列表/详情 |
| `percent_complete`          | `percentComplete`         | double | 完整度百分比 (RPC 17+)    | ✅ 列表    |
| `have_valid`                | `haveValid`               | number | 已校验字节数              | ✅ 列表/详情 |
| `have_unchecked`            | `haveUnchecked`           | number | 未校验字节数              | ✅ 详情    |
| `left_until_done`           | `leftUntilDone`           | number | 剩余字节数               | ✅ 列表    |
| `size_when_done`            | `sizeWhenDone`            | number | 完成时大小               | ✅ 列表/详情 |
| `desired_available`         | `desiredAvailable`        | number | 可用期望字节              | ✅ 详情    |
| `recheck_progress`          | `recheckProgress`         | double | 校验进度 (0-1)          | ✅ 列表    |
| `metadata_percent_complete` | `metadataPercentComplete` | double | 元数据完成度              | ✅ 列表    |
| `eta`                       | `eta`                     | number | 预计剩余时间 (秒)          | ✅ 列表/详情 |
| `eta_idle`                  | `etaIdle`                 | number | 空闲超时 ETA            | ✅ 详情    |
| `bytes_completed`           | `bytesCompleted`          | array  | 各文件已完成字节数组 (长度=文件数) | ❌ 未使用   |

### 3.3 速度字段

| 字段 (4.1.x snake\_case) | 字段 (老版本)             | 类型     | 说明         | 本项目使用   |
| ---------------------- | -------------------- | ------ | ---------- | ------- |
| `rate_download`        | `rateDownload`       | number | 下载速度 (B/s) | ✅ 列表/详情 |
| `rate_upload`          | `rateUpload`         | number | 上传速度 (B/s) | ✅ 列表/详情 |
| `downloaded_ever`      | `downloadedEver`     | number | 累计下载量      | ✅ 详情    |
| `uploaded_ever`        | `uploadedEver`       | number | 累计上传量      | ✅ 详情    |
| `corrupt_ever`         | `corruptEver`        | number | 累计损坏量      | ✅ 详情    |
| `upload_ratio`         | `uploadRatio`        | double | 分享率        | ✅ 列表/详情 |
| `seconds_downloading`  | `secondsDownloading` | number | 下载时长 (秒)   | ✅ 详情    |
| `seconds_seeding`      | `secondsSeeding`     | number | 做种时长 (秒)   | ✅ 详情    |

### 3.4 Peer 与 Tracker 字段

| 字段 (4.1.x snake\_case)   | 字段 (老版本)              | 类型        | 说明                                                     | 本项目使用 |
| ------------------------ | --------------------- | --------- | ------------------------------------------------------ | ----- |
| `peers_connected`        | `peersConnected`      | number    | 已连接 Peer 数                                             | ✅ 列表  |
| `peers_sending_to_us`    | `peersSendingToUs`    | number    | 正在上传给我们的 Peer                                          | ✅ 列表  |
| `peers_getting_from_us`  | `peersGettingFromUs`  | number    | 正在从我们下载的 Peer                                          | ✅ 列表  |
| `peers`                  | `peers`               | array     | Peer 详情列表                                              | ✅ 详情  |
| `peers_from`             | `peersFrom`           | object    | Peer 来源统计                                              | ✅ 详情  |
| `trackers`               | `trackers`            | array     | Tracker 列表                                             | ✅ 详情  |
| `tracker_stats`          | `trackerStats`        | array     | Tracker 统计信息                                           | ✅ 详情  |
| `tracker_list`           | `trackerList`         | string    | Tracker URL 列表 (RPC 17+, 替代 trackerAdd/Remove/Replace) | ✅ 详情 (数据已请求，与 Tracker Tab 融合) |
| `webseeds`               | `webseeds`            | string\[] | Web 种子列表 (**DEPRECATED**, 用 webseeds\_ex 替代)           | ✅ 详情  |
| `webseeds_ex`            | —                     | array     | Web 种子扩展信息 (4.2.0+)                                    | ❌ 未使用 |
| `webseeds_sending_to_us` | `webseedsSendingToUs` | number    | 正在下载的 Web 种子                                           | ✅ 详情  |

> **注意**: `seeders` 和 `leechers` 在老版本 (RPC 7-) 中作为顶级字段存在，但在 4.1.x 中已移除。4.1.x 中需从 `tracker_stats` 的 `seeder_count`/`leecher_count` 获取。本项目代码 `TORRENT_FIELDS` 中仍请求了这两个字段，但 4.1.x 实际不会返回这些字段（请求不会报错，只是忽略）。

### 3.5 时间戳字段

| 字段 (4.1.x snake\_case) | 字段 (老版本)             | 类型     | 说明                                  | 本项目使用 |
| ---------------------- | -------------------- | ------ | ----------------------------------- | ----- |
| `added_date`           | `addedDate`          | number | 添加时间                                | ✅ 列表  |
| `done_date`            | `doneDate`           | number | 完成时间                                | ✅ 列表  |
| `start_date`           | `startDate`          | number | 开始时间                                | ✅ 详情  |
| `activity_date`        | `activityDate`       | number | 最后活动时间                              | ✅ 列表  |
| `edit_date`            | `editDate`           | number | 最后编辑时间 (RPC 16+)                    | ✅ 详情  |
| `manual_announce_time` | `manualAnnounceTime` | number | 手动宣告时间 (**DEPRECATED** 4.1.x, 从未有效) | ✅ 列表  |

### 3.6 限速与优先级字段

| 字段 (4.1.x snake\_case)  | 字段 (老版本)              | 类型      | 说明             | 本项目使用   |
| ----------------------- | --------------------- | ------- | -------------- | ------- |
| `download_limit`        | `downloadLimit`       | integer | 下载限速 (kB/s)    | ✅ 详情    |
| `download_limited`      | `downloadLimited`     | boolean | 是否启用下载限速       | ✅ 列表/详情 |
| `upload_limit`          | `uploadLimit`         | integer | 上传限速 (kB/s)    | ✅ 详情    |
| `upload_limited`        | `uploadLimited`       | boolean | 是否启用上传限速       | ✅ 列表/详情 |
| `bandwidth_priority`    | `bandwidthPriority`   | number  | 带宽优先级 (-1/0/1) | ✅ 详情    |
| `honors_session_limits` | `honorsSessionLimits` | boolean | 是否遵循会话限速       | ✅ 详情    |
| `max_connected_peers`   | `maxConnectedPeers`   | number  | 最大连接数          | ✅ 详情    |
| `peer_limit`            | `peer-limit`          | number  | 最大 Peer 数（与 max_connected_peers 同值） | ✅ 详情（通过 maxConnectedPeers） |

### 3.7 做种限制字段

| 字段 (4.1.x snake\_case) | 字段 (老版本)         | 类型     | 说明            | 本项目使用 |
| ---------------------- | ---------------- | ------ | ------------- | ----- |
| `seed_ratio_mode`      | `seedRatioMode`  | number | 分享率模式 (0/1/2) | ✅ 详情  |
| `seed_ratio_limit`     | `seedRatioLimit` | double | 分享率限制         | ✅ 详情  |
| `seed_idle_mode`       | `seedIdleMode`   | number | 空闲模式 (0/1/2)  | ✅ 详情  |
| `seed_idle_limit`      | `seedIdleLimit`  | number | 空闲超时 (分钟)     | ✅ 详情  |

### 3.8 文件相关字段

| 字段 (4.1.x snake\_case) | 字段 (老版本)       | 类型         | 说明                                 | 本项目使用 |
| ---------------------- | -------------- | ---------- | ---------------------------------- | ----- |
| `files`                | `files`        | array      | 文件列表                               | ✅ 详情  |
| `file_stats`           | `fileStats`    | array      | 文件统计                               | ✅ 详情  |
| `file_count`           | `file-count`   | number     | 文件数量 (RPC 17+)                     | ✅ 详情  |
| `priorities`           | `priorities`   | array      | 文件优先级（与 fileStats.priority 重复）     | ✅ 详情（通过 fileStats） |
| `wanted`               | `wanted`       | boolean\[] | 文件下载标记（与 fileStats.wanted 重复）      | ✅ 详情（通过 fileStats） |
| `availability`         | `availability` | array      | 分片可用性 (RPC 17+)                    | ✅ 分片Tab |

### 3.9 其他字段

| 字段 (4.1.x snake\_case)           | 字段 (老版本)                         | 类型      | 说明                | 本项目使用   |
| -------------------------------- | -------------------------------- | ------- | ----------------- | ------- |
| `download_dir`                   | `downloadDir`                    | string  | 下载目录              | ✅ 列表/详情 |
| `queue_position`                 | `queuePosition`                  | number  | 队列位置              | ✅ 列表/详情 |
| `error`                          | `error`                          | number  | 错误代码 (0=无)        | ✅ 列表    |
| `error_string`                   | `errorString`                    | string  | 错误信息              | ✅ 列表    |
| `sequential_download`            | `sequential_download`            | boolean | 顺序下载 (4.1.x+)     | ✅ 详情    |
| `sequential_download_from_piece` | `sequential_download_from_piece` | number  | 顺序下载起始分片 (4.1.x+) | ❌ 未使用   |

***

## 四、子对象字段对照表

### 4.1 peers 对象字段

| 字段 (4.1.x snake\_case) | 字段 (老版本 camelCase)   | 类型      | 说明            | 本项目使用      |
| ---------------------- | -------------------- | ------- | ------------- | ---------- |
| `address`              | `address`            | string  | IP 地址         | ✅ 详情/GeoIP |
| `bytes_to_client`      | `bytesToClient`      | number  | 发送给我们的字节数     | ✅ 详情       |
| `bytes_to_peer`        | `bytesToPeer`        | number  | 发送给 Peer 的字节数 | ✅ 详情       |
| `client_is_choked`     | `clientIsChoked`     | boolean | 我们被阻塞         | ✅ 详情弹窗      |
| `client_is_interested` | `clientIsInterested` | boolean | 我们感兴趣         | ✅ 详情弹窗      |
| `client_name`          | `clientName`         | string  | 客户端名称         | ✅ 详情       |
| `flag_str`             | `flagStr`            | string  | 状态标志字符串       | ✅ 详情       |
| `is_downloading_from`  | `isDownloadingFrom`  | boolean | 正在从该 Peer 下载  | ✅ 详情弹窗      |
| `is_encrypted`         | `isEncrypted`        | boolean | 连接是否加密        | ✅ 详情/弹窗    |
| `is_incoming`          | `isIncoming`         | boolean | 是否入站连接        | ✅ 详情弹窗      |
| `is_uploading_to`      | `isUploadingTo`      | boolean | 正在上传给该 Peer   | ✅ 详情弹窗      |
| `is_utp`               | `isUTP`              | boolean | 是否 uTP 连接     | ✅ 详情弹窗      |
| `peer_id`              | `peer_id`            | string  | Peer ID       | ✅ 详情弹窗      |
| `peer_is_choked`       | `peerIsChoked`       | boolean | Peer 被阻塞      | ✅ 详情弹窗      |
| `peer_is_interested`   | `peerIsInterested`   | boolean | Peer 感兴趣      | ✅ 详情弹窗      |
| `port`                 | `port`               | number  | 端口号           | ✅ 详情弹窗      |
| `progress`             | `progress`           | double  | 进度 (0-1)      | ✅ 详情       |
| `rate_to_client`       | `rateToClient`       | number  | 下载速度 (B/s)    | ✅ 详情       |
| `rate_to_peer`         | `rateToPeer`         | number  | 上传速度 (B/s)    | ✅ 详情       |

### 4.2 peers\_from 对象字段

| 字段 (4.1.x snake\_case) | 字段 (老版本 camelCase) | 类型     | 说明             | 本项目使用 |
| ---------------------- | ------------------ | ------ | -------------- | ----- |
| `from_cache`           | `fromCache`        | number | 来自缓存 (RPC 17+) | ✅ 详情 |
| `from_dht`             | `fromDht`          | number | 来自 DHT         | ✅ 详情  |
| `from_incoming`        | `fromIncoming`     | number | 来自入站连接         | ✅ 详情  |
| `from_lpd`             | `fromLpd`          | number | 来自 LPD         | ✅ 详情  |
| `from_ltep`            | `fromLtep`         | number | 来自 LTEP        | ✅ 详情  |
| `from_pex`             | `fromPex`          | number | 来自 PEX         | ✅ 详情  |
| `from_tracker`         | `fromTracker`      | number | 来自 Tracker     | ✅ 详情  |

### 4.3 trackers 对象字段

| 字段 (4.1.x snake\_case) | 字段 (老版本 camelCase) | 类型      | 说明             | 本项目使用 |
| ---------------------- | ------------------ | ------- | -------------- | ----- |
| `announce`             | `announce`         | string  | 宣告 URL         | ✅ 详情  |
| `id`                   | `id`               | integer | Tracker ID     | ✅ 详情  |
| `scrape`               | `scrape`           | string  | 刮取 URL         | ❌ 未使用 |
| `sitename`             | `sitename`         | string  | 站点名称 (RPC 17+) | ✅ 详情  |
| `tier`                 | `tier`             | number  | 层级             | ✅ 详情  |

### 4.4 tracker\_stats 对象字段

| 字段 (4.1.x snake\_case)     | 字段 (老版本 camelCase)      | 类型      | 说明                | 本项目使用 |
| -------------------------- | ----------------------- | ------- | ----------------- | ----- |
| `announce`                 | `announce`              | string  | 宣告 URL            | ✅ 详情  |
| `announce_state`           | `announceState`         | number  | 宣告状态              | ❌ 未使用 |
| `download_count`           | `downloadCount`         | number  | 下载次数              | ✅ 详情      |
| `downloader_count`         | `downloader_count`      | number  | 下载者数 (4.1.x+)     | ✅ 详情      |
| `has_announced`            | `hasAnnounced`          | boolean | 是否已宣告             | ❌ 未使用 |
| `has_scraped`              | `hasScraped`            | boolean | 是否已刮取             | ❌ 未使用 |
| `host`                     | `host`                  | string  | 主机名               | ✅ 详情  |
| `id`                       | `id`                    | integer | Tracker ID        | ✅ 详情  |
| `is_backup`                | `isBackup`              | boolean | 是否备用 Tracker      | ❌ 未使用 |
| `last_announce_peer_count` | `lastAnnouncePeerCount` | number  | 上次宣告 Peer 数       | ✅ 详情  |
| `last_announce_result`     | `lastAnnounceResult`    | string  | 上次宣告结果            | ✅ 详情  |
| `last_announce_start_time` | `lastAnnounceStartTime` | number  | 上次宣告开始时间          | ❌ 未使用 |
| `last_announce_succeeded`  | `lastAnnounceSucceeded` | boolean | 上次宣告是否成功          | ✅ 详情  |
| `last_announce_time`       | `lastAnnounceTime`      | number  | 上次宣告时间            | ✅ 详情  |
| `last_announce_timed_out`  | `lastAnnounceTimedOut`  | boolean | 上次宣告是否超时          | ✅ 详情  |
| `last_scrape_result`       | `lastScrapeResult`      | string  | 上次刮取结果            | ❌ 未使用 |
| `last_scrape_start_time`   | `lastScrapeStartTime`   | number  | 上次刮取开始时间          | ❌ 未使用 |
| `last_scrape_succeeded`    | `lastScrapeSucceeded`   | boolean | 上次刮取是否成功          | ❌ 未使用 |
| `last_scrape_time`         | `lastScrapeTime`        | number  | 上次刮取时间            | ❌ 未使用 |
| `last_scrape_timed_out`    | `lastScrapeTimedOut`    | boolean | 上次刮取是否超时          | ❌ 未使用 |
| `leecher_count`            | `leecherCount`          | number  | 下载者数 (tracker 报告) | ✅ 详情  |
| `seeder_count`             | `seederCount`           | number  | 做种者数 (tracker 报告) | ✅ 详情  |
| `next_announce_time`       | `nextAnnounceTime`      | number  | 下次宣告时间            | ✅ 详情  |
| `next_scrape_time`         | `nextScrapeTime`        | number  | 下次刮取时间            | ❌ 未使用 |
| `scrape`                   | `scrape`                | string  | 刮取 URL            | ❌ 未使用 |
| `scrape_state`             | `scrapeState`           | number  | 刮取状态              | ❌ 未使用 |
| `sitename`                 | `sitename`              | string  | 站点名称 (RPC 17+)    | ✅ 详情  |
| `tier`                     | `tier`                  | number  | 层级                | ✅ 详情  |

### 4.5 files 对象字段

| 字段 (4.1.x snake\_case) | 字段 (老版本 camelCase) | 类型     | 说明              | 本项目使用 |
| ---------------------- | ------------------ | ------ | --------------- | ----- |
| `bytes_completed`      | `bytesCompleted`   | number | 已完成字节           | ✅ 详情  |
| `length`               | `length`           | number | 文件大小            | ✅ 详情  |
| `name`                 | `name`             | string | 文件名             | ✅ 详情  |
| `begin_piece`          | `begin_piece`      | number | 起始分片索引 (4.1.x+) | ❌ 未使用 |
| `end_piece`            | `end_piece`        | number | 结束分片索引 (4.1.x+) | ❌ 未使用 |

### 4.6 file\_stats 对象字段

| 字段 (4.1.x snake\_case) | 字段 (老版本 camelCase) | 类型      | 说明    | 本项目使用 |
| ---------------------- | ------------------ | ------- | ----- | ----- |
| `bytes_completed`      | `bytesCompleted`   | number  | 已完成字节 | ✅ 详情  |
| `wanted`               | `wanted`           | boolean | 是否下载  | ✅ 详情  |
| `priority`             | `priority`         | number  | 优先级   | ✅ 详情  |

### 4.7 webseeds\_ex 对象字段 (4.2.0+)

| 字段 (4.1.x snake\_case)      | 字段 (老版本) | 类型      | 说明         | 本项目使用 |
| --------------------------- | -------- | ------- | ---------- | ----- |
| `url`                       | —        | string  | Web 种子 URL | ❌ 未使用 |
| `is_downloading`            | —        | boolean | 是否正在下载     | ❌ 未使用 |
| `download_bytes_per_second` | —        | number  | 下载速度 (B/s) | ❌ 未使用 |

### 4.8 units 对象字段

| 字段 (4.1.x snake\_case) | 字段 (老版本)       | 类型        | 说明         | 本项目使用 |
| ---------------------- | -------------- | --------- | ---------- | ----- |
| `speed_units`          | `speed-units`  | string\[] | 速度单位 (5 个) | ❌ 未使用 |
| `speed_bytes`          | `speed-bytes`  | number    | 速度单位字节数    | ❌ 未使用 |
| `size_units`           | `size-units`   | string\[] | 大小单位 (5 个) | ❌ 未使用 |
| `size_bytes`           | `size-bytes`   | number    | 大小单位字节数    | ❌ 未使用 |
| `memory_units`         | `memory-units` | string\[] | 内存单位 (5 个) | ❌ 未使用 |
| `memory_bytes`         | `memory-bytes` | number    | 内存单位字节数    | ❌ 未使用 |

***

## 五、torrent\_set 字段对照表

| 字段 (4.1.x snake\_case)           | 字段 (老版本)                         | 类型        | 说明                                              | 本项目实现 |
| -------------------------------- | -------------------------------- | --------- | ----------------------------------------------- | ----- |
| `bandwidth_priority`             | `bandwidthPriority`              | number    | 带宽优先级                                           | ✅     |
| `download_limit`                 | `downloadLimit`                  | number    | 下载限速                                            | ✅     |
| `download_limited`               | `downloadLimited`                | boolean   | 启用下载限速                                          | ✅     |
| `upload_limit`                   | `uploadLimit`                    | number    | 上传限速                                            | ✅     |
| `upload_limited`                 | `uploadLimited`                  | boolean   | 启用上传限速                                          | ✅     |
| `honors_session_limits`          | `honorsSessionLimits`            | boolean   | 遵循会话限速                                          | ✅     |
| `seed_ratio_mode`                | `seedRatioMode`                  | number    | 分享率模式                                           | ✅     |
| `seed_ratio_limit`               | `seedRatioLimit`                 | double    | 分享率限制                                           | ✅     |
| `seed_idle_mode`                 | `seedIdleMode`                   | number    | 空闲模式                                            | ✅     |
| `seed_idle_limit`                | `seedIdleLimit`                  | number    | 空闲超时                                            | ✅     |
| `peer_limit`                     | `peer-limit`                     | number    | 最大 Peer 数                                       | ✅     |
| `labels`                         | `labels`                         | string\[] | 标签列表                                            | ✅     |
| `group`                          | `group`                          | string    | 带宽组名称                                           | ✅     |
| `location`                       | `location`                       | string    | 下载目录                                            | ✅     |
| `sequential_download`            | `sequential_download`            | boolean   | 顺序下载                                            | ✅     |
| `sequential_download_from_piece` | `sequential_download_from_piece` | number    | 顺序下载起始分片                                        | ❌ 未使用 |
| `files_wanted`                   | `files-wanted`                   | array     | 要下载的文件                                          | ✅     |
| `files_unwanted`                 | `files-unwanted`                 | array     | 不下载的文件                                          | ✅     |
| `priority_high`                  | `priority-high`                  | array     | 高优先级文件                                          | ✅     |
| `priority_low`                   | `priority-low`                   | array     | 低优先级文件                                          | ✅     |
| `priority_normal`                | `priority-normal`                | array     | 普通优先级文件                                         | ✅     |
| `queue_position`                 | `queuePosition`                  | number    | 队列位置                                            | ✅ 队列操作 |
| `tracker_add`                    | `trackerAdd`                     | array     | 添加 Tracker (**DEPRECATED**, 用 tracker\_list 替代) | ✅     |
| `tracker_remove`                 | `trackerRemove`                  | array     | 删除 Tracker (**DEPRECATED**, 用 tracker\_list 替代) | ✅     |
| `tracker_replace`                | `trackerReplace`                 | array     | 替换 Tracker (**DEPRECATED**, 用 tracker\_list 替代) | ✅     |
| `tracker_list`                   | `trackerList`                    | string    | Tracker URL 列表 (RPC 17+)                        | ✅ 详情 |

***

## 六、torrent\_add 字段对照表

| 字段 (4.1.x snake\_case)           | 字段 (老版本)                         | 类型        | 说明                  | 本项目实现 |
| -------------------------------- | -------------------------------- | --------- | ------------------- | ----- |
| `filename`                       | `filename`                       | string    | .torrent 文件或 URL    | ✅     |
| `metainfo`                       | `metainfo`                       | string    | base64 编码的 .torrent | ✅     |
| `download_dir`                   | `download-dir`                   | string    | 下载目录                | ✅     |
| `paused`                         | `paused`                         | boolean   | 是否暂停                | ✅     |
| `cookies`                        | `cookies`                        | string    | Cookie 字符串          | ✅     |
| `peer_limit`                     | `peer-limit`                     | number    | 最大 Peer 数           | ✅     |
| `bandwidth_priority`             | `bandwidthPriority`              | number    | 带宽优先级               | ✅     |
| `labels`                         | `labels`                         | string\[] | 标签列表                | ✅     |
| `files_wanted`                   | `files-wanted`                   | array     | 要下载的文件              | ✅     |
| `files_unwanted`                 | `files-unwanted`                 | array     | 不下载的文件              | ✅     |
| `priority_high`                  | `priority-high`                  | array     | 高优先级文件              | ✅     |
| `priority_low`                   | `priority-low`                   | array     | 低优先级文件              | ✅     |
| `priority_normal`                | `priority-normal`                | array     | 普通优先级文件             | ✅     |
| `sequential_download`            | `sequential_download`            | boolean   | 顺序下载                | ✅     |
| `sequential_download_from_piece` | `sequential_download_from_piece` | number    | 顺序下载起始分片            | ❌ 未使用 |

> **注意**: `group`（带宽组）不是 `torrent-add` 的合法参数。添加种子时指定带宽组的实现方式为：先调用 `torrent-add`，成功后立即调用 `torrent-set` 设置 `group` 字段。本项目已实现此逻辑。

***

## 七、session\_get 字段对照表

### 7.1 速度限制

| 字段 (4.1.x snake\_case)     | 字段 (老版本 kebab-case)        | 类型      | 说明            | 本项目实现 |
| -------------------------- | -------------------------- | ------- | ------------- | ----- |
| `alt_speed_down`           | `alt-speed-down`           | number  | 备用下载限速 (kB/s) | ✅     |
| `alt_speed_enabled`        | `alt-speed-enabled`        | boolean | 启用备用限速        | ✅     |
| `alt_speed_time_begin`     | `alt-speed-time-begin`     | number  | 备用限速开始时间      | ✅     |
| `alt_speed_time_day`       | `alt-speed-time-day`       | number  | 备用限速日期掩码      | ✅     |
| `alt_speed_time_enabled`   | `alt-speed-time-enabled`   | boolean | 启用备用限速计划      | ✅     |
| `alt_speed_time_end`       | `alt-speed-time-end`       | number  | 备用限速结束时间      | ✅     |
| `alt_speed_up`             | `alt-speed-up`             | number  | 备用上传限速 (kB/s) | ✅     |
| `speed_limit_down`         | `speed-limit-down`         | integer | 下载限速 (kB/s)   | ✅     |
| `speed_limit_down_enabled` | `speed-limit-down-enabled` | boolean | 启用下载限速        | ✅     |
| `speed_limit_up`           | `speed-limit-up`           | integer | 上传限速 (kB/s)   | ✅     |
| `speed_limit_up_enabled`   | `speed-limit-up-enabled`   | boolean | 启用上传限速        | ✅     |

### 7.2 下载与目录

| 字段 (4.1.x snake\_case)         | 字段 (老版本 kebab-case)            | 类型      | 说明                                           | 本项目实现 |
| ------------------------------ | ------------------------------ | ------- | -------------------------------------------- | ----- |
| `download_dir`                 | `download-dir`                 | string  | 默认下载目录                                       | ✅     |
| `download_dir_free_space`      | `download-dir-free-space`      | number  | 可用空间 (**DEPRECATED** 4.0+, 用 free\_space 替代) | ✅     |
| `incomplete_dir`               | `incomplete-dir`               | string  | 未完成目录                                        | ✅     |
| `incomplete_dir_enabled`       | `incomplete-dir-enabled`       | boolean | 启用未完成目录                                      | ✅     |
| `start_added_torrents`         | `start-added-torrents`         | boolean | 添加后自动开始                                      | ✅     |
| `trash_original_torrent_files` | `trash-original-torrent-files` | boolean | 删除原始 .torrent                                | ✅     |
| `rename_partial_files`         | `rename-partial-files`         | boolean | 追加 .part 后缀                                  | ✅     |
| `default_trackers`             | `default-trackers`             | string  | 默认 Tracker 列表 (RPC 17+)                      | ✅     |

### 7.3 网络与端口

| 字段 (4.1.x snake\_case)      | 字段 (老版本 kebab-case)         | 类型        | 说明                                                                                             | 本项目实现 |
| --------------------------- | --------------------------- | --------- | ---------------------------------------------------------------------------------------------- | ----- |
| `peer_port`                 | `peer-port`                 | number    | Peer 端口                                                                                        | ✅     |
| `peer_port_random_on_start` | `peer-port-random-on-start` | boolean   | 启动时随机端口                                                                                        | ✅     |
| `port_forwarding_enabled`   | `port-forwarding-enabled`   | boolean   | 启用端口转发                                                                                         | ✅     |
| `encryption`                | `encryption`                | string    | 加密策略 (JSON-RPC 2.0: `required`/`preferred`/`allowed`; 旧协议: `required`/`preferred`/`tolerated`) | ✅     |
| `preferred_transports`      | `preferred_transports`      | string\[] | 首选传输方式 (4.1.x+)                                                                                | ✅     |
| `tcp_enabled`               | `tcp-enabled`               | boolean   | 启用 TCP (**DEPRECATED** 4.1.x, 用 preferred\_transports 替代)                                      | ✅     |
| `utp_enabled`               | `utp-enabled`               | boolean   | 启用 uTP (**DEPRECATED** 4.1.x, 用 preferred\_transports 替代)                                      | ✅     |
| `dht_enabled`               | `dht-enabled`               | boolean   | 启用 DHT                                                                                         | ✅     |
| `pex_enabled`               | `pex-enabled`               | boolean   | 启用 PEX                                                                                         | ✅     |
| `lpd_enabled`               | `lpd-enabled`               | boolean   | 启用 LPD                                                                                         | ✅     |
| `sequential_download`       | `sequential_download`       | boolean   | 默认顺序下载 (4.1.x+)                                                                                | ✅     |
| `reqq`                      | `reqq`                      | number    | 请求队列大小                                                                                         | ✅     |

### 7.4 连接限制

| 字段 (4.1.x snake\_case)   | 字段 (老版本 kebab-case)      | 类型     | 说明                                                                                             | 本项目实现 |
| ------------------------ | ------------------------ | ------ | ---------------------------------------------------------------------------------------------- | ----- |
| `peer_limit_global`      | `peer-limit-global`      | number | 全局最大 Peer 数                                                                                    | ✅     |
| `peer_limit_per_torrent` | `peer-limit-per-torrent` | number | 每种子最大 Peer 数                                                                                   | ✅     |
| `cache_size_mib`         | `cache-size-mb`          | number | 磁盘缓存大小 (JSON-RPC 2.0: `cache_size_mib`; 旧协议: `cache-size-mb`; **DEPRECATED** 4.2.0, 将在 5.0 移除) | ✅     |

### 7.5 队列管理

| 字段 (4.1.x snake\_case)   | 字段 (老版本 kebab-case)      | 类型      | 说明        | 本项目实现 |
| ------------------------ | ------------------------ | ------- | --------- | ----- |
| `download_queue_enabled` | `download-queue-enabled` | boolean | 启用下载队列    | ✅     |
| `download_queue_size`    | `download-queue-size`    | number  | 最大同时下载数   | ✅     |
| `seed_queue_enabled`     | `seed-queue-enabled`     | boolean | 启用做种队列    | ✅     |
| `seed_queue_size`        | `seed-queue-size`        | number  | 最大同时做种数   | ✅     |
| `queue_stalled_enabled`  | `queue-stalled-enabled`  | boolean | 启用停滞检测    | ✅     |
| `queue_stalled_minutes`  | `queue-stalled-minutes`  | number  | 停滞超时 (分钟) | ✅     |

### 7.6 做种限制

| 字段 (4.1.x snake\_case)       | 字段 (老版本)                     | 类型      | 说明          | 本项目实现 |
| ---------------------------- | ---------------------------- | ------- | ----------- | ----- |
| `seed_ratio_limit`           | `seedRatioLimit`             | double  | 默认分享率限制     | ✅     |
| `seed_ratio_limited`         | `seedRatioLimited`           | boolean | 启用分享率限制     | ✅     |
| `idle_seeding_limit_enabled` | `idle-seeding-limit-enabled` | boolean | 启用空闲做种限制    | ✅     |
| `idle_seeding_limit`         | `idle-seeding-limit`         | number  | 空闲做种超时 (分钟) | ✅     |

### 7.7 屏蔽列表

| 字段 (4.1.x snake\_case) | 字段 (老版本 kebab-case) | 类型      | 说明       | 本项目实现 |
| ---------------------- | ------------------- | ------- | -------- | ----- |
| `blocklist_enabled`    | `blocklist-enabled` | boolean | 启用屏蔽列表   | ✅     |
| `blocklist_url`        | `blocklist-url`     | string  | 屏蔽列表 URL | ✅     |
| `blocklist_size`       | `blocklist-size`    | number  | 屏蔽规则数量   | ✅     |

### 7.8 RPC 与安全配置

| 字段 (4.1.x snake\_case)       | 字段 (老版本 kebab-case)          | 类型      | 说明                                                        | 本项目实现 |
| ---------------------------- | ---------------------------- | ------- | --------------------------------------------------------- | ----- |
| `rpc_version`                | `rpc-version`                | number  | RPC 版本号 (**DEPRECATED** 4.1.x, 用 rpc\_version\_semver 替代) | ✅     |
| `rpc_version_semver`         | `rpc-version-semver`         | string  | RPC 语义化版本 (4.0+)                                          | ✅     |
| `rpc_version_minimum`        | `rpc-version-minimum`        | number  | 最低兼容版本 (**DEPRECATED** 4.1.x)                             | ✅     |
| `anti_brute_force_enabled`   | `anti-brute-force-enabled`   | boolean | 启用防暴力破解                                                   | ✅     |
| `anti_brute_force_threshold` | `anti-brute-force-threshold` | number  | 暴力破解阈值                                                    | ✅     |

> **重要**: 以下 RPC 配置字段在老版本 session-get 中返回，但在 4.1.x 中**不再通过 session-get 返回**（安全改进，两种协议均如此），仅可通过 session-set 修改：
>
> - `rpc_enabled`, `rpc_port`, `rpc_url`, `rpc_bind_address`
> - `rpc_authentication_required`, `rpc_username`, `rpc_password`
> - `rpc_whitelist`, `rpc_whitelist_enabled`
> - `rpc_host_whitelist`, `rpc_host_whitelist_enabled`
> - `rpc_socket_path`
>
> 本项目代码 SESSION\_FIELDS 中仍包含这些字段（兼容旧版），但 4.1.x 请求时不会返回。建议从 SESSION\_FIELDS 中移除这些无效字段以减少请求体积。

### 7.9 脚本

| 字段 (4.1.x snake\_case)                 | 字段 (老版本 kebab-case)                    | 类型      | 说明                 | 本项目实现 |
| -------------------------------------- | -------------------------------------- | ------- | ------------------ | ----- |
| `script_torrent_added_enabled`         | `script-torrent-added-enabled`         | boolean | 启用添加脚本 (RPC 17+)   | ✅     |
| `script_torrent_added_filename`        | `script-torrent-added-filename`        | string  | 添加脚本路径 (RPC 17+)   | ✅     |
| `script_torrent_done_enabled`          | `script-torrent-done-enabled`          | boolean | 启用完成脚本             | ✅     |
| `script_torrent_done_filename`         | `script-torrent-done-filename`         | string  | 完成脚本路径             | ✅     |
| `script_torrent_done_seeding_enabled`  | `script-torrent-done-seeding-enabled`  | boolean | 启用做种完成脚本 (RPC 17+) | ✅     |
| `script_torrent_done_seeding_filename` | `script-torrent-done-seeding-filename` | string  | 做种完成脚本路径 (RPC 17+) | ✅     |

### 7.10 系统信息

| 字段 (4.1.x snake\_case) | 字段 (老版本 kebab-case) | 类型     | 说明              | 本项目实现 |
| ---------------------- | ------------------- | ------ | --------------- | ----- |
| `version`              | `version`           | string | Transmission 版本 | ✅     |
| `config_dir`           | `config-dir`        | string | 配置目录            | ✅     |
| `session_id`           | `session-id`        | string | 会话 ID           | ✅     |
| `units`                | `units`             | object | 单位配置 (见 4.8)    | ❌ 未使用 |

***

## 八、session\_stats 字段对照表

### 8.1 顶层字段

| 字段 (4.1.x snake\_case) | 字段 (老版本 camelCase)   | 类型     | 说明     | 本项目实现 |
| ---------------------- | -------------------- | ------ | ------ | ----- |
| `active_torrent_count` | `activeTorrentCount` | number | 活跃种子数  | ✅     |
| `download_speed`       | `downloadSpeed`      | number | 全局下载速度 | ✅     |
| `paused_torrent_count` | `pausedTorrentCount` | number | 暂停种子数  | ✅     |
| `torrent_count`        | `torrentCount`       | number | 总种子数   | ✅     |
| `upload_speed`         | `uploadSpeed`        | number | 全局上传速度 | ✅     |

### 8.2 cumulative\_stats / current\_stats 子对象

| 字段 (4.1.x snake\_case) | 字段 (老版本 camelCase) | 类型     | 说明     | 本项目实现 |
| ---------------------- | ------------------ | ------ | ------ | ----- |
| `uploaded_bytes`       | `uploadedBytes`    | number | 累计上传字节 | ✅     |
| `downloaded_bytes`     | `downloadedBytes`  | number | 累计下载字节 | ✅     |
| `files_added`          | `filesAdded`       | number | 添加文件数  | ✅     |
| `seconds_active`       | `secondsActive`    | number | 活跃时长   | ✅     |
| `session_count`        | `sessionCount`     | number | 会话次数   | ✅     |

***

## 九、其他方法字段对照表

### 9.1 port\_test 字段

| 字段 (4.1.x snake\_case) | 字段 (老版本)       | 类型      | 说明                              | 本项目实现 |
| ---------------------- | -------------- | ------- | ------------------------------- | ----- |
| `port_is_open`         | `port-is-open` | boolean | 端口是否开放                          | ✅     |
| `ip_protocol`          | —              | string  | IP 协议版本 (4.1.x+, `ipv4`/`ipv6`) | ✅ 请求+响应 |

### 9.2 free\_space 字段

| 字段 (4.1.x snake\_case) | 字段 (老版本 kebab-case) | 类型     | 说明                   | 本项目实现 |
| ---------------------- | ------------------- | ------ | -------------------- | ----- |
| `path`                 | `path`              | string | 查询路径                 | ✅     |
| `size_bytes`           | `size-bytes`        | number | 可用空间 (bytes)         | ✅     |
| `total_size`           | `total-size`        | number | 总空间 (bytes, RPC 17+) | ✅     |

### 9.3 group\_get / group\_set 字段 (RPC 17+)

| 字段 (4.1.x snake\_case)     | 字段 (老版本)                   | 类型      | 说明          | 本项目实现 |
| -------------------------- | -------------------------- | ------- | ----------- | ----- |
| `name`                     | `name`                     | string  | 带宽组名称       | ✅     |
| `honors_session_limits`    | `honorsSessionLimits`      | boolean | 遵循会话限速      | ✅     |
| `speed_limit_down`         | `speed-limit-down`         | integer | 下载限速 (kB/s) | ✅     |
| `speed_limit_down_enabled` | `speed-limit-down-enabled` | boolean | 启用下载限速      | ✅     |
| `speed_limit_up`           | `speed-limit-up`           | integer | 上传限速 (kB/s) | ✅     |
| `speed_limit_up_enabled`   | `speed-limit-up-enabled`   | boolean | 启用上传限速      | ✅     |

> **注意**: 带宽组功能仅在 Transmission 4.0+ (RPC 17+) 中可用。老版本不支持。

### 9.4 torrent\_remove 字段

| 字段 (4.1.x snake\_case) | 字段 (老版本 kebab-case) | 类型      | 说明       | 本项目实现 |
| ---------------------- | ------------------- | ------- | -------- | ----- |
| `ids`                  | `ids`               | array   | 种子 ID 列表 | ✅     |
| `delete_local_data`    | `delete-local-data` | boolean | 删除本地数据   | ✅     |

### 9.5 torrent\_set\_location 字段

| 字段 (4.1.x snake\_case) | 字段 (老版本 kebab-case) | 类型      | 说明                | 本项目实现 |
| ---------------------- | ------------------- | ------- | ----------------- | ----- |
| `ids`                  | `ids`               | array   | 种子 ID 列表          | ✅     |
| `location`             | `location`          | string  | 新位置               | ✅     |
| `move`                 | `move`              | boolean | 是否移动文件 (默认 false) | ✅     |

### 9.6 torrent\_rename\_path 字段

**请求字段**:

| 字段 (4.1.x snake\_case) | 字段 (老版本 kebab-case) | 类型     | 说明            | 本项目实现 |
| ---------------------- | ------------------- | ------ | ------------- | ----- |
| `ids`                  | `ids`               | array  | 种子 ID (仅 1 个) | ✅     |
| `path`                 | `path`              | string | 原路径           | ✅     |
| `name`                 | `name`              | string | 新名称           | ✅     |

**响应字段**:

| 字段 (4.1.x snake\_case) | 字段 (老版本 kebab-case) | 类型      | 说明    | 本项目实现 |
| ---------------------- | ------------------- | ------- | ----- | ----- |
| `id`                   | `id`                | integer | 种子 ID | ✅     |
| `path`                 | `path`              | string  | 原路径   | ✅     |
| `name`                 | `name`              | string  | 新名称   | ✅     |

***

## 十、4.1.x 废弃字段汇总

以下字段在 4.1.x 中已标记为 **DEPRECATED**，但仍可使用（兼容性保留）：

| 字段                        | 所属方法             | 替代方案                   | 废弃版本  |
| ------------------------- | ---------------- | ---------------------- | ----- |
| `manual_announce_time`    | torrent\_get     | 无 (从未有效)               | 4.1.0 |
| `tcp_enabled`             | session\_get/set | `preferred_transports` | 4.1.0 |
| `utp_enabled`             | session\_get/set | `preferred_transports` | 4.1.0 |
| `rpc_version`             | session\_get     | `rpc_version_semver`   | 4.1.0 |
| `rpc_version_minimum`     | session\_get     | `rpc_version_semver`   | 4.1.0 |
| `download_dir_free_space` | session\_get     | `free_space` 方法        | 4.0.0 |
| `tracker_add`             | torrent\_set     | `tracker_list`         | 4.0.0 |
| `tracker_remove`          | torrent\_set     | `tracker_list`         | 4.0.0 |
| `tracker_replace`         | torrent\_set     | `tracker_list`         | 4.0.0 |
| `webseeds`                | torrent\_get     | `webseeds_ex`          | 4.2.0 |
| `cache_size_mib`          | session\_get/set | 将在 5.0 移除              | 4.2.0 |

***

## 十一、4.1.x 重大变更汇总

| 变更        | 说明                                                           |
| --------- | ------------------------------------------------------------ |
| 协议切换      | 新增 JSON-RPC 2.0 协议支持（旧协议仍可用但已废弃）                             |
| 字段命名      | JSON-RPC 2.0 中所有字符串从 camelCase/kebab-case 切换到 snake\_case    |
| 加密枚举      | JSON-RPC 2.0 中 `tolerated` 改名为 `allowed`（旧协议仍返回 `tolerated`） |
| 缓存字段      | JSON-RPC 2.0 中 `cache-size-mb` 改名为 `cache_size_mib`          |
| wanted 类型 | JSON-RPC 2.0 中从 0/1 整数数组改为 boolean 数组（旧协议仍返回 0/1）            |
| 速度限制类型    | `speed_limit_down/up` 从 number 改为 integer (4.1.1 修正)         |
| RPC 配置字段  | session-get 不再返回 rpc\_enabled 等安全敏感字段（两种协议均如此）               |
| HTTP 头    | CSRF 409 响应新增 `X-Transmission-Rpc-Version` 头                 |

***

## 十二、本项目未实现的 RPC 功能

| 功能                                           | 说明                                            | 优先级 |
| -------------------------------------------- | --------------------------------------------- | --- |
| `torrent_get.format` (table 格式)              | 表格格式响应，更高效                                    | 低   |
| `torrent_get.bytes_completed`                | 各文件已完成字节数                                     | 低   |
| `torrent_get.availability`                   | 分片可用性统计（已实现，分片Tab可用性视图）                       | ~~中~~ ✅ |
| `torrent_get.webseeds_ex`                    | Web 种子扩展信息 (4.2.0+)                           | 低   |
| `torrent_set.tracker_list`                   | 新 Tracker 列表格式 (替代 trackerAdd/Remove/Replace) | 高   |
| `torrent_set.sequential_download_from_piece` | 顺序下载起始分片                                      | 低   |
| `torrent_add.sequential_download_from_piece` | 顺序下载起始分片                                      | 低   |
| `port_test.ip_protocol`                      | IPv4/IPv6 选择（已实现，状态栏+设置对话框）                  | ~~中~~ ✅ |
| `session_get.units`                          | 单位配置                                          | 低   |
| `peers 子对象完整字段`                              | client\_is\_choked 等未展示字段                     | 低   |
| JSON-RPC 2.0 协议支持                            | 项目当前使用旧协议格式，未实现 JSON-RPC 2.0 请求               | 中   |
| `encryption` 枚举适配                            | 旧协议返回 `tolerated`，需映射为统一显示                    | 中   |

> **已修复**: `TORRENT_FIELDS` 中无效的 `remaining` 字段和已废弃的 `seeders`/`leechers` 字段已从代码中移除。`torrent_file`、`pieces`（分片完成度可视化）、`file_count` 字段已在前端实现。

***

## 十三、兼容性处理

本项目通过以下机制实现 4.1.x 与老版本的兼容：

1. **统一使用旧协议格式**: 项目对所有版本均使用 `{"method":"...","arguments":{}}` 格式发送请求（4.1.x 仍支持旧协议）
2. **RPC 版本检测**: 连接时获取 `rpc-version`/`rpc-version-semver`，判断协议版本
3. **Legacy 适配器**: `js/legacy/rpc-legacy-adapter.js` 处理 RPC ≤16 老版本的协议差异
4. **字段名转换**: `_convertResponseKeys()` + `_camelToSnakeMap` 将旧协议 camelCase 响应统一转换为内部 snake\_case 使用
5. **方法名适配**: `TWC.legacy.adaptMethod()` 将方法名转为老版本格式（如 `torrent-get`）
6. **参数适配**: `TWC.legacy.adaptArguments()` 处理请求参数格式差异
7. **字段适配**: `TWC.legacy.adaptFields()` 转换请求字段名
8. **版本功能守卫**: `getGroups()` 等方法检查 RPC 版本，低于 17 时返回友好提示
9. **加密枚举适配**: 旧协议返回 `tolerated`，项目需在显示时映射为统一的中文描述

> **未来改进建议**: 当 Transmission 移除旧协议支持后，项目需切换到 JSON-RPC 2.0 格式。届时需修改 `_exec()` 函数的请求构建和响应解析逻辑。

