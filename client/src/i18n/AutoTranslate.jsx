// client/src/i18n/AutoTranslate.jsx - AUTOMATIC TRANSLATION SYSTEM

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Translation cache to avoid repeated API calls
const translationCache = new Map();

// AutoTranslate Context
const AutoTranslateContext = createContext({
    translate: (text) => text,
    isTranslating: false,
});

// Translation API service
class TranslationService {
    static async translateText(text, targetLang, sourceLang = 'en') {
        // Check cache first
        const cacheKey = `${text}_${sourceLang}_${targetLang}`;
        if (translationCache.has(cacheKey)) {
            return translationCache.get(cacheKey);
        }

        try {
            // Option 1: Use your backend AI service
            const response = await fetch('/api/ai/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, targetLang, sourceLang }),
            });

            if (response.ok) {
                const data = await response.json();
                translationCache.set(cacheKey, data.translatedText);
                return data.translatedText;
            }
        } catch (error) {
            console.warn('Translation API failed, using fallback:', error);
        }

        // Fallback: Return original text
        return text;
    }

    static async translateBatch(texts, targetLang, sourceLang = 'en') {
        // Batch translate multiple texts at once (more efficient)
        const uncached = texts.filter(text => {
            const cacheKey = `${text}_${sourceLang}_${targetLang}`;
            return !translationCache.has(cacheKey);
        });

        if (uncached.length === 0) {
            // All cached
            return texts.map(text => {
                const cacheKey = `${text}_${sourceLang}_${targetLang}`;
                return translationCache.get(cacheKey) || text;
            });
        }

        try {
            const response = await fetch('/api/ai/translate-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texts: uncached, targetLang, sourceLang }),
            });

            if (response.ok) {
                const data = await response.json();
                data.translations.forEach((translated, index) => {
                    const cacheKey = `${uncached[index]}_${sourceLang}_${targetLang}`;
                    translationCache.set(cacheKey, translated);
                });

                return texts.map(text => {
                    const cacheKey = `${text}_${sourceLang}_${targetLang}`;
                    return translationCache.get(cacheKey) || text;
                });
            }
        } catch (error) {
            console.warn('Batch translation failed:', error);
        }

        return texts;
    }
}

// Provider component
export const AutoTranslateProvider = ({ children }) => {
    const { i18n } = useTranslation();
    const [isTranslating, setIsTranslating] = useState(false);

    const translate = async (text, options = {}) => {
        const currentLang = i18n.language;

        // If English or no translation needed, return original
        if (currentLang === 'en' || !text) {
            return text;
        }

        setIsTranslating(true);
        const translated = await TranslationService.translateText(
            text,
            currentLang,
            options.sourceLang || 'en'
        );
        setIsTranslating(false);

        return translated;
    };

    return (
        <AutoTranslateContext.Provider value={{ translate, isTranslating }}>
            {children}
        </AutoTranslateContext.Provider>
    );
};

// Hook to use auto-translation
export const useAutoTranslate = () => {
    return useContext(AutoTranslateContext);
};

// HOC to automatically translate component text content
export const withAutoTranslate = (Component) => {
    return function AutoTranslatedComponent(props) {
        const { translate } = useAutoTranslate();
        const { i18n } = useTranslation();

        // If props contain text that should be translated, do it here
        const translatedProps = { ...props };

        // Common text props to auto-translate
        const textProps = ['title', 'description', 'label', 'placeholder', 'name'];

        textProps.forEach(async (prop) => {
            if (props[prop] && typeof props[prop] === 'string') {
                translatedProps[prop] = await translate(props[prop]);
            }
        });

        return <Component {...translatedProps} />;
    };
};

// Component for translating dynamic text
export const AutoTranslate = ({ children, fallback = null }) => {
    const { translate } = useAutoTranslate();
    const { i18n } = useTranslation();
    const [translatedText, setTranslatedText] = useState(children);

    useEffect(() => {
        if (typeof children === 'string' && i18n.language !== 'en') {
            translate(children).then(setTranslatedText);
        } else {
            setTranslatedText(children);
        }
    }, [children, i18n.language, translate]);

    if (translatedText === children && i18n.language !== 'en' && fallback) {
        return fallback;
    }

    return <>{translatedText}</>;
};

// Hook for translating dynamic content (like product names)
export const useTranslateContent = (content, options = {}) => {
    const { i18n } = useTranslation();
    const [translated, setTranslated] = useState(content);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const translateContent = async () => {
            if (i18n.language === 'en' || !content) {
                setTranslated(content);
                return;
            }

            setLoading(true);

            if (typeof content === 'string') {
                const result = await TranslationService.translateText(
                    content,
                    i18n.language,
                    options.sourceLang || 'en'
                );
                setTranslated(result);
            } else if (Array.isArray(content)) {
                const results = await TranslationService.translateBatch(
                    content,
                    i18n.language,
                    options.sourceLang || 'en'
                );
                setTranslated(results);
            } else if (typeof content === 'object') {
                // Translate object properties
                const translated = {};
                for (const [key, value] of Object.entries(content)) {
                    if (typeof value === 'string') {
                        translated[key] = await TranslationService.translateText(
                            value,
                            i18n.language,
                            options.sourceLang || 'en'
                        );
                    } else {
                        translated[key] = value;
                    }
                }
                setTranslated(translated);
            }

            setLoading(false);
        };

        translateContent();
    }, [content, i18n.language, options.sourceLang]);

    return { translated, loading };
};

export default TranslationService;
