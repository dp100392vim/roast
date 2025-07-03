const deepl = require('deepl-node');
const deeplClient = new deepl.DeepLClient(process.env.DEEPL_API_KEY);


exports.translate = async (req, res) => {
    try {
        const { text, mode } = req.body;
        let toLang = null
        
        if(mode === 'de-en') toLang = 'en-US' 
        else toLang = 'ru'

        deeplClient
            .translateText(text, null, toLang)
            .then((result) => {
                res.json(result.text);
            })
            .catch((error) => {
                console.error(error);
            });
    } catch (error) {
        res.status(500).json({ error: 'Translation failed' });
    }
};
