// api/upload-stations.js
// Vercel serverless function
//
// ENV-переменные (задаются в Vercel Dashboard → Settings → Environment Variables):
//   UPLOAD_PASSWORD  — пароль, который вводит пользователь в редакторе
//   GH_TOKEN         — GitHub Personal Access Token (classic), repo-scope
//   GH_OWNER         — владелец репозитория, напр. "Kesik80"
//   GH_REPO          — имя репозитория, напр. "fahrzeit"
//   GH_FILE          — путь к файлу в репо, напр. "stations.js"

export default async function handler(req, res) {
  // CORS — разрешаем только с домена редактора (можно расширить)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, content } = req.body || {};

  // 1. Проверяем пароль
  const UPLOAD_PASSWORD = process.env.UPLOAD_PASSWORD;
  if (!UPLOAD_PASSWORD) return res.status(500).json({ error: 'UPLOAD_PASSWORD not configured' });
  if (!password || password !== UPLOAD_PASSWORD) {
    return res.status(401).json({ error: 'Неверный пароль' });
  }

  // 2. Берём данные из env
  const GH_TOKEN = process.env.GH_TOKEN;
  const GH_OWNER = process.env.GH_OWNER;
  const GH_REPO  = process.env.GH_REPO;
  const GH_FILE  = process.env.GH_FILE || 'stations.js';

  if (!GH_TOKEN || !GH_OWNER || !GH_REPO) {
    return res.status(500).json({ error: 'GitHub credentials not configured on server' });
  }
  if (!content) return res.status(400).json({ error: 'content is required' });

  const apiBase = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}`;
  const headers = {
    Authorization: `token ${GH_TOKEN}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // 3. Получаем текущий SHA файла (нужен для обновления)
  let sha;
  try {
    const shaResp = await fetch(apiBase, { headers });
    if (shaResp.ok) sha = (await shaResp.json()).sha;
  } catch {}

  // 4. Base64-кодируем содержимое
  const base64 = Buffer.from(content, 'utf8').toString('base64');

  // 5. Отправляем на GitHub
  const putResp = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `web-editor update ${new Date().toISOString().slice(0,16).replace('T',' ')}`,
      content: base64,
      ...(sha ? { sha } : {}),
    }),
  });

  if (putResp.ok) {
    return res.status(200).json({ ok: true });
  } else {
    const err = await putResp.json();
    return res.status(putResp.status).json({ error: err.message || 'GitHub error' });
  }
}
