# Alkanes Explorer

一个功能完善的比特币Alkanes协议监控工具，支持实时追踪内存池中的Alkanes交易、监控RBF交易，并提供直观的数据可视化界面。

## 功能特点

- 🔍 实时监控内存池中的Alkanes交易
- 📊 交易数据可视化展示
- 🔄 RBF (Replace-By-Fee) 交易监控与追踪
- 💼 按地址查询相关Alkanes交易历史
- 📱 响应式设计，支持移动端和桌面端
- 🔔 高Gas费交易提醒

## 技术栈

- Next.js - React框架
- TypeScript - 类型安全的JavaScript
- Chakra UI - 用户界面组件库
- Axios - HTTP客户端
- Sandshrew API - 比特币区块链数据源

## 安装指南

### 前提条件

- Node.js (v16+)
- npm 或 yarn

### 安装步骤

1. 克隆代码库:

```bash
git clone https://github.com/你的用户名/alkanes-explorer.git
cd alkanes-explorer
```

2. 安装依赖:

```bash
npm install
# 或
yarn install
```

3. 配置环境变量:

创建`.env.local`文件并填入以下内容:

```
NEXT_PUBLIC_SANDSHREW_API_URL=https://mainnet.sandshrew.io/v2/lasereyes
NEXT_PUBLIC_SANDSHREW_PROJECT_ID=你的项目ID
```

4. 启动开发服务器:

```bash
npm run dev
# 或
yarn dev
```

## 使用方法

### 本地访问

启动服务后，访问 http://localhost:3000 即可打开监控面板。

### 生产环境部署

1. 构建生产版本:

```bash
npm run build
# 或
yarn build
```

2. 启动生产服务:

```bash
npm start
# 或
yarn start
```

### 公网访问设置

如需通过公网IP让他人访问监控面板（只读模式），请修改`package.json`中的启动命令:

```json
"scripts": {
  "start": "next start -H 0.0.0.0 -p 3000"
}
```

这将使服务绑定到所有网络接口，通过服务器的公网IP可以访问。

#### 安全配置

为确保他人只能查看而不能操作，系统已内置只读模式，他人通过公网IP访问时只能查看数据，不能执行交易或更改设置。

## 功能说明

### 主页面

- **交易监控**: 实时显示内存池中的Alkanes交易，按Gas费从高到低排序
- **RBF监控**: 检测并显示Replace-By-Fee交易，追踪Gas费变化
- **区块信息**: 显示当前区块高度、内存池交易数量等关键信息

### 地址查询

- 输入比特币地址，查询与该地址相关的所有Alkanes交易
- 显示地址余额、交易历史等信息

### 交易监控面板

- 设置地址和私钥进行交易监控
- 自动计算最优Gas费
- 实时日志记录交易状态变化
- RBF交易检测与提醒

## 贡献指南

欢迎提交问题和功能请求，也欢迎直接提交代码贡献。

## 许可证

MIT 