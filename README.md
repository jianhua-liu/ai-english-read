<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9f930470-ae67-4b4f-a343-b4b695c3d594

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies: `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app: `npm run dev`

### 使用后端 API（推荐，便于部署与保护 API Key）

1. 启动后端：`npm run server`（默认 http://localhost:3001）
2. 在 `.env.local` 中增加：`VITE_API_URL=http://localhost:3001`
3. 再运行：`npm run dev`，网页将通过后端调用 Gemini

### 微信小程序

- 小程序源码在 **`miniprogram/`** 目录。用微信开发者工具「导入项目」选择该目录即可。
- 本地调试：保持 `npm run server` 运行，在 `miniprogram/config.js` 中 `baseUrl` 设为 `http://localhost:3001`，并在开发者工具中勾选「不校验合法域名」。
- **完整部署步骤**（后端上线、配置 request 合法域名、上传发布）见 [微信小程序部署指南.md](微信小程序部署指南.md)。
