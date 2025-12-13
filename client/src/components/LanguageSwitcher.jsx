// client/src/components/LanguageSwitcher.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Check } from 'lucide-react';

const LanguageSwitcher = ({ variant = 'default' }) => {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' }
    ];

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    const changeLanguage = (langCode) => {
        i18n.changeLanguage(langCode);
        setIsOpen(false);
    };

    // Compact variant for header/navbar
    if (variant === 'compact') {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    aria-label={t('language.changeLanguage')}
                >
                    <Languages size={18} />
                    <span className="hidden sm:inline">{currentLanguage.code.toUpperCase()}</span>
                </button>

                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-[60]"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[70] transform origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => changeLanguage(lang.code)}
                                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center justify-between ${currentLanguage.code === lang.code
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <div>
                                        <div className="font-semibold">{lang.nativeName}</div>
                                        <div className="text-xs text-slate-500">{lang.name}</div>
                                    </div>
                                    {currentLanguage.code === lang.code && (
                                        <Check size={16} className="text-indigo-600" strokeWidth={3} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Default variant - full card style
    return (
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 p-6 group hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                    <Languages size={24} strokeWidth={2} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{t('language.changeLanguage')}</h3>
                    <p className="text-sm text-slate-500">{t('language.selectLanguage')}</p>
                </div>
            </div>

            <div className="space-y-2">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full text-left px-4 py-3.5 rounded-xl font-medium transition-all flex items-center justify-between ${currentLanguage.code === lang.code
                            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:scale-[1.01]'
                            }`}
                    >
                        <div>
                            <div className={`text-base font-bold ${currentLanguage.code === lang.code ? 'text-white' : 'text-slate-800'
                                }`}>
                                {lang.nativeName}
                            </div>
                            <div className={`text-xs ${currentLanguage.code === lang.code ? 'text-indigo-100' : 'text-slate-500'
                                }`}>
                                {lang.name}
                            </div>
                        </div>
                        {currentLanguage.code === lang.code && (
                            <div className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
                                <Check size={16} className="text-white" strokeWidth={3} />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">{t('common.currentSelection')}:</span>
                    <span className="font-bold text-slate-700">{currentLanguage.nativeName}</span>
                </div>
            </div>
        </div>
    );
};

export default LanguageSwitcher;
