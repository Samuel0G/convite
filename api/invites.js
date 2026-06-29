const environmentKeys = Object.keys(process.env);
const redisUrlKey = environmentKeys.find(key =>
  /(?:UPSTASH|STORAGE|KV)/i.test(key) && /(?:REST_)?URL$/i.test(key)
);
const redisTokenKey = environmentKeys.find(key =>
  /(?:UPSTASH|STORAGE|KV)/i.test(key) && /TOKEN$/i.test(key) && !/READ.?ONLY/i.test(key)
);
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  || process.env.KV_REST_API_URL
  || process.env.STORAGE_REDIS_REST_URL
  || process.env.STORAGE_URL
  || process.env[redisUrlKey];
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  || process.env.KV_REST_API_TOKEN
  || process.env.STORAGE_REDIS_REST_TOKEN
  || process.env.STORAGE_TOKEN
  || process.env[redisTokenKey];

async function redis(command) {
  if (!redisUrl || !redisToken) throw new Error('Banco de dados não configurado');
  const response = await fetch(redisUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command)
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'Falha no banco de dados');
  return data.result;
}

function shortCode() {
  return Math.random().toString(36).slice(2, 8).padEnd(6, '0');
}

export default async function handler(request, response) {
  try {
    if (request.method === 'POST') {
      const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
      let code;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        code = shortCode();
        const exists = await redis(['EXISTS', `invite:${code}`]);
        if (!exists) break;
      }
      const invite = { ...body, code, status: 'pending', createdAt: new Date().toISOString() };
      await redis(['SET', `invite:${code}`, JSON.stringify(invite)]);
      return response.status(201).json({ code, invite });
    }

    const code = String(request.query.code || '').toLowerCase();
    if (!/^[a-z0-9]{6}$/.test(code)) return response.status(400).json({ error: 'Código inválido' });
    const stored = await redis(['GET', `invite:${code}`]);
    if (!stored) return response.status(404).json({ error: 'Convite não encontrado' });
    const invite = JSON.parse(stored);

    if (request.method === 'GET') return response.status(200).json({ invite });
    if (request.method === 'PATCH') {
      const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
      if (!['accepted', 'declined'].includes(body.status)) return response.status(400).json({ error: 'Resposta inválida' });
      const updated = {
        ...invite,
        status: body.status,
        responseItems: body.responseItems || [],
        responseDate: new Date().toISOString()
      };
      await redis(['SET', `invite:${code}`, JSON.stringify(updated)]);
      return response.status(200).json({ invite: updated });
    }
    return response.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Erro interno' });
  }
}
