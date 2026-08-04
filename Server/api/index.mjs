import app from '../backend/index.js';

export default async function handler(req, res) {
  return app(req, res);
}