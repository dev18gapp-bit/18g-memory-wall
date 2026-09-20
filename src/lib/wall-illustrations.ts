type IllustrationCategory = {
  id: string;
  src: string;
  keywords: string[];
};

// Order matters — first matching category wins. Sympathy is checked first so
// a loss message never accidentally gets decorated with a party icon just
// because it also happens to contain a word like "love".
const CATEGORIES: IllustrationCategory[] = [
  {
    id: 'sympathy',
    src: '/images/wall-icons/sympathy.svg',
    keywords: [
      'thinking of you',
      'condolence',
      'sorry for your loss',
      'rest in peace',
      'rip ',
      'in loving memory',
    ],
  },
  {
    id: 'birthday',
    src: '/images/wall-icons/birthday.svg',
    keywords: ['birthday', 'bday', 'another year older'],
  },
  {
    id: 'congratulations',
    src: '/images/wall-icons/congratulations.svg',
    keywords: ['congratulations', 'congrats', 'well done', 'graduat', 'you did it'],
  },
  {
    id: 'welcome',
    src: '/images/wall-icons/welcome.svg',
    keywords: ['welcome', 'new job', 'new home', 'new baby', 'newborn'],
  },
  {
    id: 'thank-you',
    src: '/images/wall-icons/thank-you.svg',
    keywords: ['thank you', 'thanks', 'grateful', 'appreciate'],
  },
  {
    id: 'love',
    src: '/images/wall-icons/heart.svg',
    keywords: ['anniversary', 'i love you', 'love you', 'miss you', 'sweetheart', 'valentine', 'love this place'],
  },
];

/**
 * Picks a curated illustration for a message based on its text — a light,
 * deterministic fallback for messages submitted without a photo. Returns
 * null when nothing matches, in which case the message just shows as text,
 * same as before this feature existed.
 */
export function matchWallIllustration(message: string): string | null {
  const text = message.toLowerCase();
  for (const category of CATEGORIES) {
    if (category.keywords.some((kw) => text.includes(kw))) {
      return category.src;
    }
  }
  return null;
}
