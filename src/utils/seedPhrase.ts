/**
 * Seed phrase generation utilities
 * Uses the BIP39 word list for generating recovery phrases
 */

// BIP39 English wordlist (first 100 words for demo - in production use full 2048 word list)
const BIP39_WORDLIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
  'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
  'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
  'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone',
  'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among',
  'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry',
  'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april',
  'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around',
  'arrange', 'arrest', 'arrive', 'arrow', 'art', 'article', 'artist', 'artwork',
  'ask', 'aspect', 'assault', 'asset', 'assist', 'assume', 'asthma', 'athlete',
  'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit', 'august',
  'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake'
];

/**
 * Generates a cryptographically secure random seed phrase
 * @param wordCount Number of words (12, 15, 18, 21, or 24)
 * @returns Array of seed phrase words
 */
export function generateSeedPhrase(wordCount: number = 12): string[] {
  if (![12, 15, 18, 21, 24].includes(wordCount)) {
    throw new Error('Invalid word count. Must be 12, 15, 18, 21, or 24');
  }

  const seedPhrase: string[] = [];
  
  for (let i = 0; i < wordCount; i++) {
    // Use crypto.getRandomValues for secure randomness
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const randomIndex = randomArray[0] % BIP39_WORDLIST.length;
    seedPhrase.push(BIP39_WORDLIST[randomIndex]);
  }

  return seedPhrase;
}

/**
 * Validates if a seed phrase uses valid BIP39 words
 * @param seedPhrase Array of words to validate
 * @returns boolean indicating if all words are valid
 */
export function validateSeedPhrase(seedPhrase: string[]): boolean {
  if (![12, 15, 18, 21, 24].includes(seedPhrase.length)) {
    return false;
  }

  return seedPhrase.every(word => 
    BIP39_WORDLIST.includes(word.toLowerCase())
  );
}

/**
 * Converts seed phrase array to string
 * @param seedPhrase Array of seed words
 * @returns Space-separated seed phrase string
 */
export function seedPhraseToString(seedPhrase: string[]): string {
  return seedPhrase.join(' ');
}

/**
 * Converts seed phrase string to array
 * @param seedPhraseString Space-separated seed phrase
 * @returns Array of seed words
 */
export function stringToSeedPhrase(seedPhraseString: string): string[] {
  return seedPhraseString
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Generates entropy for wallet creation
 * Note: This is a simplified version. In production, use proper BIP39 entropy generation
 * @param seedPhrase The seed phrase to convert to entropy
 * @returns Hex string of entropy
 */
export function seedPhraseToEntropy(seedPhrase: string[]): string {
  // This is a simplified implementation
  // In production, use proper BIP39 entropy calculation
  const seedString = seedPhraseToString(seedPhrase);
  
  // Simple hash function for demo (use proper crypto in production)
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex and pad to 32 characters
  const entropy = Math.abs(hash).toString(16).padStart(32, '0');
  return entropy;
}

/**
 * Demo word list for testing (in production, use full BIP39 list)
 * @returns Array of all available BIP39 words
 */
export function getBIP39WordList(): string[] {
  return [...BIP39_WORDLIST];
}

/**
 * Checks if a word is in the BIP39 word list
 * @param word Word to check
 * @returns boolean indicating if word is valid
 */
export function isValidBIP39Word(word: string): boolean {
  return BIP39_WORDLIST.includes(word.toLowerCase());
}