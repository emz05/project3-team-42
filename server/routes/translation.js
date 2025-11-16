const express = require('express');
const axios = require('axios');
const router = express.Router();

// client sends post request to /api/translate
router.post('/', async (req, res) => {
    const { text, targetLanguage } = req.body;

    const apiUrl = process.env.TRANSLATE_API_URL;
    const apiKey = process.env.TRANSLATE_API_KEY;

    try {
        const response = await axios.post(
            apiUrl,
            {
                q: text,
                target: targetLanguage,
                source: 'en',
                format: 'text'
            },
            {
                params: { key: apiKey }
            }
        );

        // parse and validate returned translation
        const apiData = response.data;
        const translationBlock = apiData && apiData.data && apiData.data.translations;

        // send translated text back to client
        const translatedText = translationBlock[0].translatedText;
        res.json({ translatedText });
    } catch (error) {
        let details = error.message;

        if (error.response && error.response.data) {
            details = error.response.data;
        }

        console.error('Translation error:', details);
        res.status(502).json({ error: 'Translation failed', details });
    }
});

module.exports = router;