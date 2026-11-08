/**
 * Smart music search query normalizer.
 * Cleans punctuation, fixes common artist typos/transpositions,
 * and generates intelligent fallback search terms.
 */
export function normalizeMusicQuery(query: string): string[] {
  if (!query) return [];

  // Remove punctuation commonly used between title and artist (-, _, :, ,, |, etc.)
  let cleaned = query
    .replace(/[\-_,;:|/\\+()\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Correct common artist typos / transpositions (e.g. autsover -> atsuover, ragemine -> rageminer)
  cleaned = cleaned
    .replace(/\bautsover\b/gi, 'atsuover')
    .replace(/\bragemine\b/gi, 'rageminer')
    .replace(/\bgarcelo\b/gi, 'garcello')
    .replace(/\bphonk\b/gi, 'phonk');

  const terms = new Set<string>();
  terms.add(cleaned);
  terms.add(query.trim());

  const lower = cleaned.toLowerCase();

  // FNF / Atsuover / Rageminer specific intelligent alias expansion
  if (lower.includes('nerves')) {
    if (lower.includes('atsuover') || lower.includes('rageminer') || lower.includes('garcello') || lower.includes('fnf')) {
      terms.add('nerves atsuover');
      terms.add('nerves rageminer');
      terms.add('atsuover nerves');
      terms.add('smoke em out struggle nerves');
      terms.add('nerves fnf');
    }
  }

  // Decompose if multiple words: e.g. "Song - Artist1, Artist2" -> "Song Artist1"
  const words = cleaned.split(' ').filter(Boolean);
  if (words.length > 2) {
    terms.add(`${words[0]} ${words[words.length - 1]}`);
    terms.add(`${words[0]} ${words[1]}`);
  }

  return Array.from(terms).filter(Boolean);
}
