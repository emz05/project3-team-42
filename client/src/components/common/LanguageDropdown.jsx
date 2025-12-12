/*
- Creates dropdown component for user to select preferred language
- Should be applied to all pages
 */
import React, { useMemo, useState } from "react";
import { useTranslation } from "../../context/translation-storage.jsx";

const LANGUAGES_BY_REGION = {
  Americas: [
    { code: "en-us", language: "English", locale: "United States" },
    { code: "es-mx", language: "Español", locale: "México" },
    { code: "pt-br", language: "Português", locale: "Brasil" },
    { code: "fr-ca", language: "Français", locale: "Canada" },
  ],
  "Asia & Pacific": [
    { code: "zh-cn", language: "中文", locale: "中国" },
    { code: "ja-jp", language: "日本語", locale: "日本" },
    { code: "ko-kr", language: "한국어", locale: "대한민국" },
    { code: "hi-in", language: "हिन्दी", locale: "भारत" },
    { code: "th-th", language: "ไทย", locale: "ประเทศไทย" },
    { code: "vi-vn", language: "Tiếng Việt", locale: "Việt Nam" },
    { code: "id-id", language: "Bahasa Indonesia", locale: "Indonesia" },
    { code: "ms-my", language: "Bahasa Melayu", locale: "Malaysia" },
    { code: "tl-ph", language: "Tagalog", locale: "Pilipinas" },
  ],
  Europe: [
    { code: "fr-fr", language: "Français", locale: "France" },
    { code: "de-de", language: "Deutsch", locale: "Deutschland" },
    { code: "it-it", language: "Italiano", locale: "Italia" },
    { code: "es-es", language: "Español", locale: "España" },
    { code: "pt-pt", language: "Português", locale: "Portugal" },
    { code: "nl-nl", language: "Nederlands", locale: "Nederland" },
    { code: "pl-pl", language: "Polski", locale: "Polska" },
    { code: "ru-ru", language: "Русский", locale: "Россия" },
    { code: "sv-se", language: "Svenska", locale: "Sverige" },
    { code: "no-no", language: "Norsk", locale: "Norge" },
    { code: "da-dk", language: "Dansk", locale: "Danmark" },
    { code: "fi-fi", language: "Suomi", locale: "Suomi" },
    { code: "tr-tr", language: "Türkçe", locale: "Türkiye" },
    { code: "el-gr", language: "Ελληνικά", locale: "Ελλάδα" },
  ],
  "Middle East & Africa": [
    { code: "ar-sa", language: "العربية", locale: "المملكة العربية السعودية" },
    { code: "he-il", language: "עברית", locale: "ישראל" },
    { code: "tr-tr", language: "Türkçe", locale: "Türkiye" },
    { code: "sw-ke", language: "Kiswahili", locale: "Kenya" },
    { code: "am-et", language: "አማርኛ", locale: "ኢትዮጵያ" },
    { code: "zu-za", language: "isiZulu", locale: "iNingizimu Afrika" },
    { code: "af-za", language: "Afrikaans", locale: "Suid-Afrika" },
  ],
};

// Simple inline icons to avoid extra dependencies
function GlobeIcon({ className = "" }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function ChevronIcon({ className = "" }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function LanguageDropdown({ className = "", label = "Select language", align = "right" }) {
  const { language, setLanguage } = useTranslation();
  const allLanguages = useMemo(
    () => Object.values(LANGUAGES_BY_REGION).flat(),
    []
  );

  const initialSelected =
    allLanguages.find((lang) => lang.code.split("-")[0] === language) ||
    allLanguages[0];

  const [isOpen, setIsOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("Europe");
  const [selectedLanguage, setSelectedLanguage] = useState(initialSelected);

  const handleLanguageSelect = (lang) => {
    setSelectedLanguage(lang);
    setIsOpen(false);
    const baseCode = lang.code.split("-")[0]; // keep compatibility with existing translator
    setLanguage(baseCode);
  };

  return (
    <div className={`relative inline-block ${className}`} aria-label={label}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="bg-white rounded-full px-6 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex items-center gap-2 hover:shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition-shadow text-sm"
        style={{ borderRadius: '9999px' }}
      >
        <GlobeIcon className="w-4 h-4 text-gray-700" />
        <span className="font-semibold text-gray-900 leading-tight">{selectedLanguage.language}</span>
        <span className="text-gray-400 text-xs leading-tight">{selectedLanguage.locale}</span>
        <ChevronIcon
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-[2000] mt-2 ${
            align === "left" ? "left-0" : "right-0"
          } bg-white rounded-2xl shadow-2xl w-[min(70vw,38rem)] overflow-hidden border border-gray-200`}
        >
          <div className="border-b border-gray-200 flex">
            {Object.keys(LANGUAGES_BY_REGION).map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                type="button"
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                  selectedRegion === region
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {region}
                {selectedRegion === region && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                )}
              </button>
            ))}
          </div>

          <div className="p-4 max-h-[24rem] overflow-y-auto">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
              {LANGUAGES_BY_REGION[selectedRegion].map((lang) => {
                const isActive = selectedLanguage.code === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang)}
                    type="button"
                    className={`relative text-left px-4 py-3 rounded-lg transition-colors ${
                      isActive ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-gray-900">{lang.language}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{lang.locale}</div>
                    {isActive && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
