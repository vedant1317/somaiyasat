import { handleHealth } from './_shared.mjs';

export default function handler(req, res) {
  handleHealth(req, res);
}