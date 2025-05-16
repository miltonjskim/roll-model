// src/shared/constants/domainStyles.ts

export type DomainStyle = {
  icons: string[];
  colors: string[];
  borders: string[];
};

export type DomainStyles = {
  [key: string]: DomainStyle;
};

export const DOMAIN_STYLES: DomainStyles = {
  FINANCE: {
    icons: ['💰', '💹', '🏦', '💲'],
    colors: ['bg-[theme(color-green-01)]', 'bg-[theme(color-green-02)]', 'bg-[theme(color-green-03)]', 'bg-[theme(color-blue-01)]'],
    borders: ['border-[theme(color-green-01)]', 'border-[theme(color-green-02)]', 'border-[theme(color-green-03)]', 'border-[theme(color-blue-01)]'],
  },
  HEALTHCARE: {
    icons: ['🩺', '❤️', '🏥', '💊'],
    colors: ['bg-[theme(color-rose-01)]', 'bg-[theme(color-rose-02)]', 'bg-[theme(color-rose-03)]', 'bg-[theme(color-pink-01)]'],
    borders: ['border-[theme(color-rose-01)]', 'border-[theme(color-rose-02)]', 'border-[theme(color-rose-03)]', 'border-[theme(color-pink-01)]'],
  },
  RETAIL: {
    icons: ['🛒', '🛍️', '🏪', '📦'],
    colors: ['bg-[theme(color-blue-01)]', 'bg-[theme(color-blue-02)]', 'bg-[theme(color-blue-03)]', 'bg-[theme(color-mint-01)]'],
    borders: ['border-[theme(color-blue-01)]', 'border-[theme(color-blue-02)]', 'border-[theme(color-blue-03)]', 'border-[theme(color-mint-01)]'],
  },
  MARKETING: {
    icons: ['📣', '🎯', '📈', '📊'],
    colors: ['bg-[theme(color-yellow-01)]', 'bg-[theme(color-yellow-02)]', 'bg-[theme(color-yellow-03)]', 'bg-[theme(color-orange-01)]'],
    borders: ['border-[theme(color-yellow-01)]', 'border-[theme(color-yellow-02)]', 'border-[theme(color-yellow-03)]', 'border-[theme(color-orange-01)]'],
  },
  MANUFACTURING: {
    icons: ['🏭', '⚙️', '🔧', '🛠️'],
    colors: ['bg-[theme(color-gray-01)]', 'bg-[theme(color-gray-02)]', 'bg-[theme(color-gray-04)]', 'bg-[theme(color-gray-05)]'],
    borders: ['border-[theme(color-gray-01)]', 'border-[theme(color-gray-02)]', 'border-[theme(color-gray-04)]', 'border-[theme(color-gray-05)]'],
  },
  EDUCATION: {
    icons: ['📚', '🎓', '✏️', '🧠'],
    colors: ['bg-[theme(color-mint-01)]', 'bg-[theme(color-mint-02)]', 'bg-[theme(color-mint-03)]', 'bg-[theme(color-blue-02)]'],
    borders: ['border-[theme(color-mint-01)]', 'border-[theme(color-mint-02)]', 'border-[theme(color-mint-03)]', 'border-[theme(color-blue-02)]'],
  },
  REAL_ESTATE: {
    icons: ['🏠', '🏢', '🏗️', '🔑'],
    colors: ['bg-[theme(color-purple-01)]', 'bg-[theme(color-purple-02)]', 'bg-[theme(color-purple-03)]', 'bg-[theme(color-pink-02)]'],
    borders: ['border-[theme(color-purple-01)]', 'border-[theme(color-purple-02)]', 'border-[theme(color-purple-03)]', 'border-[theme(color-pink-02)]'],
  },
  LOGISTICS: {
    icons: ['🚚', '📦', '🚢', '✈️'],
    colors: ['bg-[theme(color-blue-01)]', 'bg-[theme(color-blue-02)]', 'bg-[theme(color-blue-03)]', 'bg-[theme(color-mint-02)]'],
    borders: ['border-[theme(color-blue-01)]', 'border-[theme(color-blue-02)]', 'border-[theme(color-blue-03)]', 'border-[theme(color-mint-02)]'],
  },
  ENTERTAINMENT: {
    icons: ['🎬', '🎮', '🎭', '🎵'],
    colors: ['bg-[theme(color-pink-01)]', 'bg-[theme(color-pink-02)]', 'bg-[theme(color-pink-03)]', 'bg-[theme(color-purple-01)]'],
    borders: ['border-[theme(color-pink-01)]', 'border-[theme(color-pink-02)]', 'border-[theme(color-pink-03)]', 'border-[theme(color-purple-01)]'],
  },
  GENERAL: {
    icons: ['📋', '🔍', '🧩', '⭐'],
    colors: ['bg-[theme(color-gray-01)]', 'bg-[theme(color-gray-02)]', 'bg-[theme(color-gray-04)]', 'bg-[theme(color-gray-05)]'],
    borders: ['border-[theme(color-gray-01)]', 'border-[theme(color-gray-02)]', 'border-[theme(color-gray-04)]', 'border-[theme(color-gray-05)]'],
  },
};