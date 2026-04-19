# Transmission Web Manager

一个现代化、功能强大的 Transmission Web 管理界面，基于 transmission-web-control 的重写版本。

## 功能特点

### 种子管理
- 浏览所有种子列表和状态显示
- 种子开始/暂停/立即开始/停止
- 种子校验和重新宣告
- 批量选中操作
- 删除种子（含数据选项）
- 队列管理（上移/下移/移至顶部/移至底部）
- 种子详细面板
- 文件预览和优先级设置
- 文件重命名
- 查看和管理 Tracker
- 国家/地区显示（GeoIP）
- 多标签支持
- 磁力链接和 Hash 复制

### 筛选和搜索
- 状态筛选：全部、下载中/完成/做种中/已停止/错误
- Tracker 筛选
- 下载目录筛选
- 标签筛选
- 实时搜索：名称、Hash、标签、注释、创建者等字段
- 多筛选条件组合使用

### 用户界面
- 明暗主题切换
- 响应式设计，支持桌面和移动端
- 实时数据更新
- 可拖拽调整列宽
- 可自定义显示列
- 右键菜单快捷操作
- 详细面板标签页：信息/文件/追踪器/同行/标签/设置
- 左侧导航栏
- 状态栏实时更新

### 系统信息
- 速度历史图表
- 详细统计数据
- 完整设置配置
- 端口连通检测
- 连接状态显示

### 配置和设置
- 完整 RPC 接口支持
- 会话设置管理
- 下载/上传限速设置
- 备用限速（时间计划）
- 带宽组管理
- 自定义下载目录
- 端口检测
- 空闲做种设置
- 队列管理设置
- 网络发现设置（DHT/PEX/LPD）

## 使用方法

### 快速开始

#### 1. 部署界面

**方式一：内置部署**
将项目文件复制到 Transmission 的 web 目录
```
例如：/usr/share/transmission/web/
访问地址：http://your-server:9091/transmission/web/
```

**方式二：自定义部署**
部署到任意 Web 服务器，通过 RPC 连接
```
访问：http://your-web-server/transmission-web-manager/
或者使用 RPC 参数：http://your-server/index.html?rpc=http://transmission-host:9091/transmission/rpc
```

#### 2. 连接 Transmission

- 首次访问时，自动连接默认 RPC
- 如需要认证，在登录界面输入用户名和密码
- 如 RPC 地址不同，在登录界面或通过 `?rpc=` 参数修改

### 界面操作指南

#### 主界面结构
| 区域 | 说明 |
|------|------|
| 顶部工具栏 | 操作按钮、设置、刷新、主题切换 |
| 左侧导航栏 | 快速状态筛选、Tracker/目录/标签筛选 |
| 种子列表 | 显示所有种子，支持排序、筛选、搜索 |
| 底部状态栏 | 速度、状态、连接、端口、版本等信息 |
| 详情面板 | 显示选中种子的详细信息 |

#### 种子操作
- 点击列表行选中/取消选中
- 双击打开详情面板
- 右键菜单：右键点击种子显示快捷操作菜单
- 工具栏按钮：选中种子后操作按钮可用

#### 筛选和搜索
- 左侧导航栏点击快速筛选状态
- 搜索栏输入关键词实时过滤
- 组合使用多维度筛选

#### 详情面板
- **信息**：种子基本信息、上传下载统计、Peer连接数
- **文件**：文件列表、优先级设置、选择性下载
- **追踪器**：Tracker列表、添加/移除/编辑、连接情况
- **同行**：Peer列表、国家显示、连接信息
- **标签**：标签管理
- **设置**：种子单独设置（限速、带宽组、做种等）

#### 状态栏信息
- 连接状态和断开提示
- 实时下载/上传速度
- 总 Peer 连接数
- 全局分享率
- 种子统计和错误计数
- 备用限速状态
- 端口连通性检测
- 可用空间
- Transmission 版本

### 高级功能

#### 校验过程可视化
- 开始校验后显示 Toast 提示
- 种子列表显示 🔍 图标
- 进度条显示"校验中 XX%"
- 黄色进度条闪烁动画指示正在校验

#### 文件管理
- 查看文件列表和大小
- 调整文件优先级（无/低/普通/高）
- 跳过文件下载
- 重命名文件
- 移动数据到新目录

#### Tracker 管理
- 查看 Tracker 连接状态
- 添加新 Tracker
- 移除 Tracker
- 批量替换 Tracker

## 安装与部署

### 系统要求

**Transmission**
- Transmission 2.0 或更高版本（推荐 4.0+）
- 启用 RPC 接口

**浏览器**
- Chrome 70+
- Firefox 65+
- Safari 13+
- Edge 79+

### 部署方式

#### 1. 作为 Transmission 默认界面
```bash
# 备份原界面
sudo mv /usr/share/transmission/web /usr/share/transmission/web.bak

# 复制文件
sudo cp -r /path/to/transmission-web-manager /usr/share/transmission/web
```

#### 2. 独立部署（支持远程连接）
```bash
# 部署到任意 Web 服务器
cp -r /path/to/transmission-web-manager /var/www/html/twm

# 访问时通过 ?rpc= 参数指定
# http://your-server/twm/index.html?rpc=http://transmission-host:9091/transmission/rpc
```

#### 3. Docker 部署
```dockerfile
# 如果你使用 Transmission 容器，可以挂载文件
docker run -d \
  -v /path/to/twm:/web \
  -p 9091:9091 \
  linuxserver/transmission
```

### 配置说明

#### Transmission 配置
确保 Transmission RPC 启用
```json
{
  "rpc-enabled": true,
  "rpc-bind-address": "0.0.0.0",
  "rpc-port": 9091,
  "rpc-url": "/transmission/rpc",
  "rpc-whitelist": "127.0.0.1,192.168.*.*",
  "rpc-whitelist-enabled": true
}
```

#### 认证设置
```json
{
  "rpc-authentication-required": true,
  "rpc-username": "your-username",
  "rpc-password": "hashed-password"
}
```

## 快捷键

| 按键 | 功能 |
|------|------|
| Delete | 删除选中种子 |
| Ctrl/Cmd + A | 全选 |
| Ctrl/Cmd + N | 添加种子 |
| Ctrl/Cmd + S | 开始选中种子 |
| Ctrl/Cmd + D | 停止选中种子 |
| F5 | 刷新数据 |
| Escape | 清除选择/关闭弹窗/隐藏菜单 |

## 项目结构

```
transmission-web-manager/
├── index.html          # 主入口
├── mobile.html         # 移动端入口
├── css/
│   ├── tailwind.css    # 基础样式
│   ├── theme.css       # 主题和界面样式
│   └── mobile.css      # 移动端样式
├── js/
│   ├── rpc.js          # RPC 通信
│   ├── torrent.js      # 种子数据管理
│   ├── ui.js           # 主 UI 控制
│   ├── ui-layout.js    # 布局组件
│   ├── ui-torrent-list.js  # 种子列表
│   ├── ui-detail.js    # 详情面板
│   ├── ui-dialog.js    # 对话框
│   ├── ui-stats.js     # 统计页面
│   ├── config.js       # 配置管理
│   ├── theme.js        # 主题切换
│   ├── utils.js        # 工具函数
│   └── geoip.js        # GeoIP 国家检测
└── assets/
    ├── flags/          # 国家/地区旗帜
    ├── geoip/          # GeoIP 数据库
    └── logo.svg
```

## 技术栈

- 原生 JavaScript + jQuery 3.7
- Tailwind CSS 3.0
- 响应式设计
- CSS 动画和过渡效果
- 纯前端实现，无需后端

## 开发和贡献

欢迎提交 Issue 和 Pull Request！

### 本地开发
```bash
# 克隆项目
git clone https://github.com/your-repo/transmission-web-manager
cd transmission-web-manager

# 使用本地 Transmission 开发
# 或使用 Mock RPC 数据
```

### 功能建议
如需要新功能，请提交 Issue 详细描述：
- 使用场景
- 期望行为
- 其他想法

## License

MIT License

本项目基于 transmission-web-control 进行了重构和优化。感谢原作者的工作！

## 致谢

- Transmission 项目
- transmission-web-control 原作者
- GeoLite2 数据库（提供国家/地区识别）
