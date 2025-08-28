/**
 * Translation Services
 * Handles real-time message translation and language detection
 */

// Language detection
export async function detectLanguage(text) {
  // TODO: Integrate with Google Translate API or similar service
  // For now, return a mock detection
  
  const languagePatterns = {
    'es': /^(hola|gracias|por favor|adiós)/i,
    'fr': /^(bonjour|merci|s'il vous plaît|au revoir)/i,
    'de': /^(hallo|danke|bitte|auf wiedersehen)/i,
    'it': /^(ciao|grazie|per favore|arrivederci)/i,
    'pt': /^(olá|obrigado|por favor|tchau)/i,
    'ru': /^(привет|спасибо|пожалуйста|до свидания)/i,
    'ja': /^(こんにちは|ありがとう|お願いします|さようなら)/i,
    'ko': /^(안녕하세요|감사합니다|부탁드립니다|안녕히 가세요)/i,
    'zh': /^(你好|谢谢|请|再见)/i,
    'ar': /^(مرحبا|شكرا|من فضلك|مع السلامة)/i
  };

  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(text)) {
      return {
        language: lang,
        confidence: 0.9,
        languageName: getLanguageName(lang)
      };
    }
  }

  return {
    language: 'en',
    confidence: 0.8,
    languageName: 'English'
  };
}

// Translation function
export async function translateText(text, targetLanguage, sourceLanguage = 'auto') {
  // TODO: Integrate with translation service (Google Translate, AWS Translate, etc.)
  
  // Mock translation for demonstration
  const mockTranslations = {
    'es': {
      'Hello': 'Hola',
      'Thank you': 'Gracias',
      'Please': 'Por favor',
      'Goodbye': 'Adiós'
    },
    'fr': {
      'Hello': 'Bonjour',
      'Thank you': 'Merci',
      'Please': 'S\'il vous plaît',
      'Goodbye': 'Au revoir'
    },
    'de': {
      'Hello': 'Hallo',
      'Thank you': 'Danke',
      'Please': 'Bitte',
      'Goodbye': 'Auf Wiedersehen'
    }
  };

  const translations = mockTranslations[targetLanguage] || {};
  const translatedText = translations[text] || `[${targetLanguage.toUpperCase()}] ${text}`;

  return {
    originalText: text,
    translatedText,
    sourceLanguage: sourceLanguage,
    targetLanguage: targetLanguage,
    confidence: 0.95
  };
}

// Batch translation
export async function translateMessages(messages, targetLanguage) {
  const translations = await Promise.all(
    messages.map(async (message) => {
      const translation = await translateText(message.text, targetLanguage);
      return {
        ...message,
        translation
      };
    })
  );

  return translations;
}

// Auto-translate conversation
export class AutoTranslator {
  constructor(targetLanguage) {
    this.targetLanguage = targetLanguage;
    this.cache = new Map(); // Translation cache
    this.enabled = true;
  }

  async translateMessage(message) {
    if (!this.enabled) return message;

    const cacheKey = `${message.text}_${this.targetLanguage}`;
    
    if (this.cache.has(cacheKey)) {
      return {
        ...message,
        translation: this.cache.get(cacheKey)
      };
    }

    try {
      const translation = await translateText(message.text, this.targetLanguage);
      this.cache.set(cacheKey, translation);
      
      return {
        ...message,
        translation
      };
    } catch (error) {
      console.error('Translation failed:', error);
      return message;
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  changeLanguage(newLanguage) {
    this.targetLanguage = newLanguage;
    this.cache.clear(); // Clear cache when language changes
  }
}

// Language utilities
export function getLanguageName(code) {
  const languages = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic'
  };
  
  return languages[code] || 'Unknown';
}

export function getSupportedLanguages() {
  return [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
  ];
}