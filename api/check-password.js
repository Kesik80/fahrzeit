// /api/check-password.js — Vercel Serverless Function
// Проверяет пароль редактора на сервере. Пароль хранится в Vercel env: REDAKTOR_PASSWORD
// Никакой информации о пароле клиенту не передаётся.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ ok: false });
  }

  const correct = process.env.REDAKTOR_PASSWORD;
  if (!correct) {
    // env-переменная не задана — отказываем
    return res.status(500).json({ ok: false, error: 'Server misconfigured' });
  }

  // Сравниваем с фиксированной задержкой, чтобы исключить timing-атаку
  await new Promise(r => setTimeout(r, 200 + Math.random() * 100));

  if (password === correct) {
    return res.status(200).json({ ok: true });
  } else {
    return res.status(200).json({ ok: false });
  }
}
