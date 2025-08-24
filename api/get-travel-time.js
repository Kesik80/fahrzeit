export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const { fromLat, fromLng, toLat, toLng } = req.query;
    if (!fromLat || !fromLng || !toLat || !toLng) {
        return res.status(400).json({ error: 'Не хватает координат' });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    const url =
        `https://maps.googleapis.com/maps/api/distancematrix/json` +
        `?origins=${fromLat},${fromLng}` +
        `&destinations=${toLat},${toLng}` +
        `&mode=driving&key=${apiKey}`;

    try {
        const googleRes = await fetch(url);
        const data = await googleRes.json();

        if (data.rows?.[0]?.elements?.[0]?.status === 'OK') {
            const seconds = data.rows[0].elements[0].duration.value;
            const minutes = Math.round(seconds / 60);
            res.status(200).json({ duration: minutes });
        } else {
            res.status(500).json({ error: 'Google API не вернуло duration' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
}