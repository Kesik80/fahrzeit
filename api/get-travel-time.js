// api/get-travel-time.js
export default async function handler(req, res) {
    const { fromLat, fromLng, toLat, toLng } = req.query;

    if (!fromLat || !fromLng || !toLat || !toLng) {
        return res.status(400).json({ error: 'Missing coordinates' });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${fromLat},${fromLng}&destinations=${toLat},${toLng}&mode=driving&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.rows[0]?.elements[0]?.status === 'OK') {
            const durationMinutes = Math.round(data.rows[0].elements[0].duration.value / 60);
            res.status(200).json({ duration: durationMinutes });
        } else {
            res.status(500).json({ error: 'Google API error' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}