export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(payload));
}

export async function callService(base, path, { method = 'GET', body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || `${method} ${base}${path} failed (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}
