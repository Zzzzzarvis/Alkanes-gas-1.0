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
- TypeScript - JavaScript类型扩展
- Chakra UI - 用户界面组件库
- Axios - HTTP客户端
- Sandshrew API - 比特币区块链数据源

## 安装与运行指南

### 前提条件

- Node.js (v16+)
- npm 或 yarn (推荐使用yarn)

### 安装步骤

1. 克隆代码库:

```bash
git clone https://github.com/你的用户名/alkanes-explorer.git
cd alkanes-explorer
```

2. 安装依赖:

```bash
# 使用yarn（推荐）
yarn install

# 或使用npm
npm install
```

3. 配置环境变量 (可选):

创建`.env.local`文件并填入以下内容:

```
NEXT_PUBLIC_SANDSHREW_API_URL=https://mainnet.sandshrew.io/v2/lasereyes
NEXT_PUBLIC_SANDSHREW_PROJECT_ID=你的项目ID
```

注意：如果不配置环境变量，系统将使用默认值，仍然可以运行，但某些API功能可能受限。

### 运行方法

有两种方式运行应用：

#### 1. 开发模式 (带热重载)

```bash
# 使用yarn
yarn dev

# 或使用npm
npm run dev
```

#### 2. 生产模式

首先构建应用:

```bash
# 使用yarn
yarn build

# 或使用npm
npm run build
```

然后启动服务:

```bash
# 使用yarn
yarn start

# 或使用npm
npm start
```

### 访问应用

启动服务后，打开浏览器访问 http://localhost:3000 即可使用监控面板。

### 常见问题解决

如果遇到TypeScript或React相关错误，尝试以下方法:

1. 确保React和React-DOM版本为18.2.0:
```bash
yarn add react@18.2.0 react-dom@18.2.0
```

2. 降级TypeScript版本:
```bash
yarn add typescript@5.1.6 --dev
```

3. 如果仍有问题，尝试禁用TypeScript错误检查:
在`next.config.js`中添加:
```javascript
typescript: {
  ignoreBuildErrors: true,
},
```

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