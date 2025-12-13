// server/routes/translate.js - MULTI-BACKEND TRANSLATION SYSTEM
// Supports: LibreTranslate, MyMemory, Google Translate, and AI

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { generateAIResponse } = require('../utils/ai');

// Translation cache
const translationCache = new Map();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// ============================================
// TRANSLATION BACKENDS CONFIGURATION
// ============================================

const BACKENDS = {
    // 1. LibreTranslate - BEST FREE OPTION (Unlimited, Open Source)
    LIBRETRANSLATE: 'libretranslate',
    // 2. MyMemory - Good free tier (1000 words/day)
    MYMEMORY: 'mymemory',
    // 3. Google Translate - Unofficial free API
    GOOGLE_FREE: 'google_free',
    // 4. Your AI - Existing implementation
    AI: 'ai'
};

// Active backend (change this to switch providers)
let ACTIVE_BACKEND = BACKENDS.LIBRETRANSLATE; // Default to LibreTranslate

// LibreTranslate configuration
const LIBRETRANSLATE_CONFIG = {
    // Option 1: Public instance (free, but slower)
    url: 'https://libretranslate.com/translate',
    apiKey: null, // No API key needed for public instance

    // Option 2: Your own instance (fastest, unlimited)
    // url: 'http://localhost:5000/translate', // Run locally
    // apiKey: null,

    // Option 3: Paid hosted instance (faster, more reliable)
    // url: 'https://libretranslate.com/translate',
    // apiKey: 'YOUR_API_KEY_HERE', // Get from https://portal.libretranslate.com/
};

// Common translations dictionary
const commonTranslations = {
    en: {
        ml: {
            // Business terms
            'invoice': 'ഇൻവോയ്സ്',
            'customer': 'ഉപഭോക്താവ്',
            'product': 'ഉൽപ്പന്നം',
            'stock': 'സ്റ്റോക്ക്',
            'revenue': 'വരുമാനം',
            'dashboard': 'ഡാഷ്‌ബോർഡ്',
            'total': 'ആകെ',
            'paid': 'അടച്ചു',
            'pending': 'കുടിശിക',
            'price': 'വില',
            'quantity': 'അളവ്',
            'tax': 'നികുതി',
            'discount': 'കിഴിവ്',
            'save': 'സംരക്ഷിക്കുക',
            'cancel': 'റദ്ദാക്കുക',
            'delete': 'ഇല്ലാതാക്കുക',
            'edit': 'എഡിറ്റ് ചെയ്യുക',
            'export': 'എക്സ്പോർട്ട്',
            'sales': 'വിൽപ്പന',
            'collection': 'ശേഖരണം',
            'refund': 'റീഫണ്ട്',
            'payment': 'പേയ്‌മെന്റ്',
            'cash': 'പണം',
            'credit': 'ക്രെഡിറ്റ്',
            'online': 'ഓൺലൈൻ',
        }
    }
};

// ============================================
// TRANSLATION BACKENDS IMPLEMENTATION
// ============================================

/**
 * 1. LibreTranslate - Best Free Option
 */
async function translateWithLibreTranslate(text, targetLang, sourceLang = 'en') {
    try {
        const response = await axios.post(LIBRETRANSLATE_CONFIG.url, {
            q: text,
            source: sourceLang,
            target: targetLang,
            format: 'text',
            apiKey: LIBRETRANSLATE_CONFIG.apiKey || undefined
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data.translatedText;
    } catch (error) {
        console.error('LibreTranslate error:', error.message);
        throw new Error(`LibreTranslate failed: ${error.message}`);
    }
}

/**
 * 2. MyMemory Translation API - Free tier: 1000 words/day
 */
async function translateWithMyMemory(text, targetLang, sourceLang = 'en') {
    try {
        const langPair = `${sourceLang}|${targetLang}`;
        const response = await axios.get('https://api.mymemory.translated.net/get', {
            params: {
                q: text,
                langpair: langPair
            },
            timeout: 10000
        });

        if (response.data.responseStatus === 200) {
            return response.data.responseData.translatedText;
        } else {
            throw new Error('MyMemory translation failed');
        }
    } catch (error) {
        console.error('MyMemory error:', error.message);
        throw new Error(`MyMemory failed: ${error.message}`);
    }
}

/**
 * 3. Google Translate (Unofficial Free API)
 */
async function translateWithGoogleFree(text, targetLang, sourceLang = 'en') {
    try {
        // Using @vitalets/google-translate-api (unofficial)
        // Note: Install with: npm install @vitalets/google-translate-api
        const translate = require('@vitalets/google-translate-api');

        const result = await translate(text, {
            from: sourceLang,
            to: targetLang
        });

        return result.text;
    } catch (error) {
        console.error('Google Translate Free error:', error.message);
        throw new Error(`Google Translate Free failed: ${error.message}`);
    }
}

/**
 * 4. AI Translation (Your existing implementation)
 */
async function translateWithAI(text, sourceLang, targetLang) {
    const languageNames = {
        en: 'English',
        ml: 'Malayalam',
        hi: 'Hindi',
        ta: 'Tamil'
    };

    const prompt = `Translate the following ${languageNames[sourceLang]} text to ${languageNames[targetLang]}. 
This is for a billing/invoicing application, so use appropriate business terminology.
Only respond with the translated text, nothing else.

Text to translate: "${text}"

Translated text:`;

    try {
        const translation = await generateAIResponse(prompt);
        return translation.trim();
    } catch (error) {
        console.error('AI translation error:', error);
        throw error;
    }
}

// ============================================
// UNIFIED TRANSLATION FUNCTION
// ============================================

async function translateText(text, targetLang, sourceLang = 'en', preferredBackend = null) {
    const backend = preferredBackend || ACTIVE_BACKEND;

    try {
        switch (backend) {
            case BACKENDS.LIBRETRANSLATE:
                return await translateWithLibreTranslate(text, targetLang, sourceLang);

            case BACKENDS.MYMEMORY:
                return await translateWithMyMemory(text, targetLang, sourceLang);

            case BACKENDS.GOOGLE_FREE:
                return await translateWithGoogleFree(text, targetLang, sourceLang);

            case BACKENDS.AI:
                return await translateWithAI(text, sourceLang, targetLang);

            default:
                throw new Error(`Unknown backend: ${backend}`);
        }
    } catch (error) {
        console.error(`Translation failed with ${backend}, trying fallback...`);

        // Fallback chain: LibreTranslate -> MyMemory -> AI
        if (backend !== BACKENDS.MYMEMORY) {
            try {
                return await translateWithMyMemory(text, targetLang, sourceLang);
            } catch (e) {
                console.error('MyMemory fallback failed, trying AI...');
            }
        }

        if (backend !== BACKENDS.AI) {
            try {
                return await translateWithAI(text, sourceLang, targetLang);
            } catch (e) {
                console.error('AI fallback failed');
            }
        }

        // All backends failed, return original
        return text;
    }
}

// ============================================
// CACHE FUNCTIONS
// ============================================

const getCachedTranslation = (text, sourceLang, targetLang) => {
    const key = `${text}_${sourceLang}_${targetLang}`;
    const cached = translationCache.get(key);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.translation;
    }

    return null;
};

const setCachedTranslation = (text, sourceLang, targetLang, translation) => {
    const key = `${text}_${sourceLang}_${targetLang}`;
    translationCache.set(key, {
        translation,
        timestamp: Date.now()
    });
};

const getCommonTranslation = (text, sourceLang, targetLang) => {
    const lowerText = text.toLowerCase().trim();
    return commonTranslations[sourceLang]?.[targetLang]?.[lowerText];
};

// ============================================
// API ROUTES
// ============================================

// POST /api/translate - Single text translation
router.post('/', async (req, res) => {
    try {
        const { text, targetLang = 'ml', sourceLang = 'en', backend } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (sourceLang === targetLang) {
            return res.json({ translatedText: text });
        }

        // Check cache
        let translatedText = getCachedTranslation(text, sourceLang, targetLang);
        if (translatedText) {
            return res.json({ translatedText, cached: true });
        }

        // Check common translations
        translatedText = getCommonTranslation(text, sourceLang, targetLang);
        if (translatedText) {
            setCachedTranslation(text, sourceLang, targetLang, translatedText);
            return res.json({ translatedText, common: true });
        }

        // Translate
        translatedText = await translateText(text, targetLang, sourceLang, backend);

        // Cache result
        setCachedTranslation(text, sourceLang, targetLang, translatedText);

        res.json({
            translatedText,
            backend: backend || ACTIVE_BACKEND,
            success: true
        });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({
            error: 'Translation failed',
            message: error.message,
            translatedText: req.body.text // Return original on error
        });
    }
});

// POST /api/translate/batch - Batch translation
router.post('/batch', async (req, res) => {
    try {
        const { texts, targetLang = 'ml', sourceLang = 'en', backend } = req.body;

        if (!Array.isArray(texts) || texts.length === 0) {
            return res.status(400).json({ error: 'Texts array is required' });
        }

        const translations = await Promise.all(
            texts.map(async (text) => {
                // Check cache
                let translated = getCachedTranslation(text, sourceLang, targetLang);
                if (translated) return translated;

                // Check common
                translated = getCommonTranslation(text, sourceLang, targetLang);
                if (translated) {
                    setCachedTranslation(text, sourceLang, targetLang, translated);
                    return translated;
                }

                // Translate
                try {
                    translated = await translateText(text, targetLang, sourceLang, backend);
                    setCachedTranslation(text, sourceLang, targetLang, translated);
                    return translated;
                } catch (error) {
                    console.error(`Failed to translate: ${text}`, error);
                    return text; // Return original on error
                }
            })
        );

        res.json({ translations, backend: backend || ACTIVE_BACKEND });
    } catch (error) {
        console.error('Batch translation error:', error);
        res.status(500).json({ error: 'Batch translation failed', message: error.message });
    }
});

// GET /api/translate/backends - List available backends
router.get('/backends', (req, res) => {
    res.json({
        available: Object.values(BACKENDS),
        active: ACTIVE_BACKEND,
        backends: {
            libretranslate: {
                name: 'LibreTranslate',
                description: 'Open source, unlimited translations',
                free: true,
                quality: 'High',
                speed: 'Medium',
                recommended: true
            },
            mymemory: {
                name: 'MyMemory',
                description: 'Free tier: 1000 words/day',
                free: true,
                quality: 'Good',
                speed: 'Fast',
                limit: '1000 words/day'
            },
            google_free: {
                name: 'Google Translate (Unofficial)',
                description: 'Free but may be unstable',
                free: true,
                quality: 'Excellent',
                speed: 'Fast',
                warning: 'Unofficial API, may break'
            },
            ai: {
                name: 'AI Translation',
                description: 'Your existing AI service',
                free: true,
                quality: 'Good',
                speed: 'Slow'
            }
        }
    });
});

// POST /api/translate/backend - Change active backend
router.post('/backend', (req, res) => {
    const { backend } = req.body;

    if (!Object.values(BACKENDS).includes(backend)) {
        return res.status(400).json({ error: 'Invalid backend' });
    }

    ACTIVE_BACKEND = backend;
    res.json({ message: `Backend changed to ${backend}`, active: ACTIVE_BACKEND });
});

// GET /api/translate/cache-stats
router.get('/cache-stats', (req, res) => {
    res.json({
        cacheSize: translationCache.size,
        commonTranslations: Object.keys(commonTranslations.en.ml).length,
        activeBackend: ACTIVE_BACKEND
    });
});

// DELETE /api/translate/cache
router.delete('/cache', (req, res) => {
    translationCache.clear();
    res.json({ message: 'Translation cache cleared' });
});

module.exports = router;
