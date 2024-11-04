type MessageDescriptor = {
  id?: string;
  default: string;
  description?: string;
}

type TranslationOptions = {
  locale?: string;
  translations?: Record<string, Record<string, string>>;
  generateId?: (msg: string) => string;
}

let currentLocale = 'en';
let translations: Record<string, Record<string, string>> = {};
let idGenerator = (msg: string) => msg;

export function setup(options: TranslationOptions) {
  if (options.locale) currentLocale = options.locale;
  if (options.translations) translations = options.translations;
  if (options.generateId) idGenerator = options.generateId;
}

export function formatMessage(message: string | MessageDescriptor, values: Record<string, any> = {}) {
  const template = typeof message === 'string' ? message : message.default;
  const id = typeof message === 'string' ? idGenerator(message) : (message.id || idGenerator(message.default));
  
  const translation = translations[currentLocale]?.[id] || template;
  
  return translation.replace(/\{([^}]+)\}/g, (match, key) => {
    const trimmedKey = key.trim();
    if (trimmedKey.includes(',')) {
      const [name, type, ...rest] = trimmedKey.split(',').map((s: string) => s.trim());
      const value = values[name];

      if (type === 'select') {
        const cases = Object.fromEntries(
          rest.join(',').split(/\s+(?=[a-z]+\s*{)/).map((c: string) => {
            const [k, v] = c.match(/([^\s{]+)\s*{([^}]*)}/)?.slice(1) || [];
            return [k, v];
          })
        );
        return cases[value] || cases.other || '';
      }

      if (type === 'plural') {
        const cases = Object.fromEntries(
          rest.join(',').split(/\s+(?=[=a-z]+\s*{)/).map((c: string) => {
            const [k, v] = c.match(/([^\s{]+)\s*{([^}]*)}/)?.slice(1) || [];
            return [k.startsWith('=') ? k.slice(1) : k, v];
          })
        );
        const exactMatch = cases[value];
        if (exactMatch) return exactMatch.replace(/#/g, String(value));
        const pluralCase = value === 1 ? 'one' : 'other';
        return (cases[pluralCase] || '').replace(/#/g, String(value));
      }
    }
    
    return String(values[trimmedKey] ?? match);
  });
}
