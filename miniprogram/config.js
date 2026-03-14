// 后端 API 地址。
// - 留空：使用微信云函数（国内云函数访问 Google 可能超时）。
// - 填写境外后端地址：可解决超时，需在微信公众平台配置该域名为 request 合法域名。
// 示例（部署到 Vercel 后）：baseUrl: 'https://你的项目.vercel.app'
module.exports = {
  baseUrl: '',
};
