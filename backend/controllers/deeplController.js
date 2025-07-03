exports.translate = async (req, res) => {
    try {
        const { text } = req.body;
        const response = await axios.post(
            'https://api-free.deepl.com/v2/translate',
            new URLSearchParams({
                text: text,
                target_lang: 'RU',
                source_lang: 'EN'
            }),
            {
                headers: {
                    'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Translation failed' });
    }
};
