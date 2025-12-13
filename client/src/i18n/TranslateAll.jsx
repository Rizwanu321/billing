// client/src/i18n/TranslateAll.jsx - AUTOMATIC PAGE TRANSLATION
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Higher Order Component to automatically translate ALL text content in a component
 * Usage: export default translateAll(MyComponent);
 */
export const translateAll = (Component) => {
    return function TranslatedComponent(props) {
        const { i18n } = useTranslation();
        const [mounted, setMounted] = useState(false);

        useEffect(() => {
            setMounted(true);

            // Force re-render when language changes
            const handleLanguageChange = () => {
                setMounted(false);
                setTimeout(() => setMounted(true), 0);
            };

            i18n.on('languageChanged', handleLanguageChange);
            return () => i18n.off('languageChanged', handleLanguageChange);
        }, [i18n]);

        if (!mounted) return null;

        return (
            <TranslateWrapper>
                <Component {...props} />
            </TranslateWrapper>
        );
    };
};

/**
 * Wrapper component that automatically translates all text nodes
 */
const TranslateWrapper = ({ children }) => {
    const { i18n } = useTranslation();
    const [translatedContent, setTranslatedContent] = useState(children);

    useEffect(() => {
        if (i18n.language === 'en') {
            setTranslatedContent(children);
            return;
        }

        // Auto-translate logic here
        // This would recursively walk through React children and translate text
        setTranslatedContent(children);
    }, [children, i18n.language]);

    return <>{translatedContent}</>;
};

/**
 * Hook to automatically translate text without manual t() calls
 * Usage: const text = useAutoText('My English Text');
 */
export const useAutoText = (text) => {
    const { i18n } = useTranslation();
    const [translated, setTranslated] = useState(text);

    useEffect(() => {
        if (!text || i18n.language === 'en') {
            setTranslated(text);
            return;
        }

        // Call translation API
        const translateText = async () => {
            try {
                const response = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text,
                        targetLang: i18n.language,
                        sourceLang: 'en'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    setTranslated(data.translatedText);
                } else {
                    setTranslated(text);
                }
            } catch (error) {
                console.error('Translation error:', error);
                setTranslated(text);
            }
        };

        translateText();
    }, [text, i18n.language]);

    return translated;
};

/**
 * Component to wrap any text for automatic translation
 * Usage: <T>My English Text</T>
 */
export const T = ({ children, fallback }) => {
    const translated = useAutoText(children);
    return <>{translated || fallback || children}</>;
};

/**
 * Hook for translating arrays/objects (like product lists)
 */
export const useAutoTranslateList = (items, keys = ['name', 'description']) => {
    const { i18n } = useTranslation();
    const [translatedItems, setTranslatedItems] = useState(items);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!items || items.length === 0 || i18n.language === 'en') {
            setTranslatedItems(items);
            return;
        }

        const translateList = async () => {
            setLoading(true);

            try {
                // Collect all texts to translate
                const textsToTranslate = [];
                const textMap = new Map();

                items.forEach((item, index) => {
                    keys.forEach(key => {
                        if (item[key] && typeof item[key] === 'string') {
                            const text = item[key];
                            if (!textMap.has(text)) {
                                textMap.set(text, []);
                                textsToTranslate.push(text);
                            }
                            textMap.get(text).push({ index, key });
                        }
                    });
                });

                // Batch translate
                const response = await fetch('/api/translate/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        texts: textsToTranslate,
                        targetLang: i18n.language,
                        sourceLang: 'en'
                    })
                });

                if (response.ok) {
                    const { translations } = await response.json();

                    // Apply translations
                    const newItems = items.map(item => ({ ...item }));

                    translations.forEach((translation, idx) => {
                        const originalText = textsToTranslate[idx];
                        const positions = textMap.get(originalText);

                        positions.forEach(({ index, key }) => {
                            newItems[index][key] = translation;
                        });
                    });

                    setTranslatedItems(newItems);
                } else {
                    setTranslatedItems(items);
                }
            } catch (error) {
                console.error('List translation error:', error);
                setTranslatedItems(items);
            } finally {
                setLoading(false);
            }
        };

        translateList();
    }, [items, i18n.language, keys]);

    return { translatedItems, loading };
};

export default translateAll;
