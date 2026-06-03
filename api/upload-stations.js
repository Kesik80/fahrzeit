// api/upload-stations.js
// Vercel serverless function (CommonJS)
//
// ENV-переменные (Vercel Dashboard → Settings → Environment Variables):
//   UPLOAD_PASSWORD  — пароль из редактора
//   GH_TOKEN         — GitHub Personal Access Token (classic, scope: repo)
//   GH_OWNER         — напр. "Kesik80"
//   GH_REPO          — напр. "fahrzeit"
//   GH_FILE          — напр. "stations.js"

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Vercel автоматически парсит JSON если Content-Type: application/json
  const body = req.body || {};
  const password = body.password;
  const content  = body.content;

  // 1. Проверяем пароль
  const UPLOAD_PASSWORD = process.env.UPLOAD_PASSWORD;
  if (!UPLOAD_PASSWORD) {
    return res.status(500).json({ error: 'UPLOAD_PASSWORD not configured' });
  }
  if (!password || password !== UPLOAD_PASSWORD) {
    return res.status(401).json({ error: 'Неверный пароль' });
  }

  // 2. Читаем GitHub credentials из env
  const GH_TOKEN = process.env.GH_TOKEN;
  const GH_OWNER = process.env.GH_OWNER;
  const GH_REPO  = process.env.GH_REPO;
  const GH_FILE  = process.env.GH_FILE || 'stations.js';

  if (!GH_TOKEN || !GH_OWNER || !GH_REPO) {
    return res.status(500).json({ error: 'GitHub credentials not configured' });
  }
  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}`;
  const ghHeaders = {
    Authorization: `token ${GH_TOKEN}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // 3. Получаем SHA текущего файла (нужен для обновления)
  let sha;
  try {
    const shaResp = await fetch(apiUrl, { headers: ghHeaders });
    if (shaResp.ok) {
      const shaData = await shaResp.json();
      sha = shaData.sha;
    }
  } catch (e) {
    // файла ещё нет — создаём новый, sha не нужен
  }

  // 4. Base64
  const base64 = Buffer.from(content, 'utf8').toString('base64');

  // 5. PUT на GitHub
  const putResp = await fetch(apiUrl, {
    method: 'PUT',
    headers: ghHeaders,
    body: JSON.stringify({
      message: `web-editor ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
      content: base64,
      ...(sha ? { sha } : {}),
    }),
  });

  if (putResp.ok) {
    return res.status(200).json({ ok: true });
  } else {
    let errMsg = 'GitHub error';
    try { errMsg = (await putResp.json()).message || errMsg; } catch {}
    return res.status(putResp.status).json({ error: errMsg });
  }
};