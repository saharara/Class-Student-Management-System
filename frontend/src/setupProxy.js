const proxy = require('http-proxy-middleware');

const createProxyMiddleware = proxy.createProxyMiddleware || proxy;
const target = process.env.ODOO_PROXY_TARGET || 'http://localhost:8070';
const options = {
  target,
  changeOrigin: true,
  secure: false,
  logLevel: 'debug',
};

module.exports = function setupProxy(app) {
  app.use('/edmanage-class', createProxyMiddleware(options));
  app.use('/edmanage-student', createProxyMiddleware(options));
};
