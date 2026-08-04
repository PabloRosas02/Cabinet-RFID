import app from '../backend/index.js';

export default async function handler(req, res) {
  const appModule = await import('../backend/index.js');
  const app = appModule.default;
  return app(req, res);
}