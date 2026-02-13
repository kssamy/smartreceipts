import categoryKeywords from '../../data/categoryKeywords.json';
import logger from '../logger';

export type Category =
  | 'Groceries'
  | 'Dining'
  | 'Electronics'
  | 'Clothing'
  | 'Health'
  | 'Home'
  | 'Transportation'
  | 'Entertainment'
  | 'Subscriptions'
  | 'Other';

interface CategoryMatch {
  category: Category;
  confidence: number;
  matchedKeywords: string[];
}

/**
 * Tier 1 Categorization: FREE local keyword matching
 * Handles ~70% of items with zero API cost
 */
export class KeywordMatcher {
  private keywords: Record<string, string[]>;

  constructor() {
    this.keywords = categoryKeywords as Record<string, string[]>;
  }

  /**
   * Categorize an item using keyword matching
   * @param itemName - The item name to categorize
   * @returns CategoryMatch with category, confidence, and matched keywords
   */
  categorize(itemName: string): CategoryMatch {
    const normalizedItem = itemName.toLowerCase().trim();
    const matches: Array<{ category: Category; count: number; keywords: string[] }> = [];

    // Check each category for keyword matches
    for (const [category, keywords] of Object.entries(this.keywords)) {
      const matchedKeywords: string[] = [];

      for (const keyword of keywords) {
        if (normalizedItem.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
        }
      }

      if (matchedKeywords.length > 0) {
        matches.push({
          category: category as Category,
          count: matchedKeywords.length,
          keywords: matchedKeywords,
        });
      }
    }

    // No matches found
    if (matches.length === 0) {
      logger.debug(`No keyword match found for item: ${itemName}`);
      return {
        category: 'Other',
        confidence: 0,
        matchedKeywords: [],
      };
    }

    // Sort by number of matched keywords (descending)
    matches.sort((a, b) => b.count - a.count);

    const bestMatch = matches[0];

    // Calculate confidence based on:
    // - Number of keywords matched
    // - Length of item name (more matches in longer names = lower confidence)
    const wordsInItem = normalizedItem.split(/\s+/).length;
    const confidence = Math.min(
      95,
      Math.round((bestMatch.count / Math.max(wordsInItem, 1)) * 100)
    );

    logger.debug(`Categorized "${itemName}" as ${bestMatch.category} (confidence: ${confidence}%)`);

    return {
      category: bestMatch.category,
      confidence,
      matchedKeywords: bestMatch.keywords,
    };
  }

  /**
   * Batch categorize multiple items
   * @param itemNames - Array of item names
   * @returns Array of CategoryMatch results
   */
  categorizeBatch(itemNames: string[]): CategoryMatch[] {
    return itemNames.map((name) => this.categorize(name));
  }

  /**
   * Add new keywords to a category (for learning over time)
   * @param category - The category to add keywords to
   * @param keywords - Array of new keywords
   */
  addKeywords(category: Category, keywords: string[]): void {
    if (!this.keywords[category]) {
      this.keywords[category] = [];
    }

    const newKeywords = keywords.filter(
      (kw) => !this.keywords[category].includes(kw.toLowerCase())
    );

    this.keywords[category].push(...newKeywords.map((kw) => kw.toLowerCase()));

    logger.info(`Added ${newKeywords.length} new keywords to ${category}`);
  }

  /**
   * Get all categories
   */
  getCategories(): Category[] {
    return Object.keys(this.keywords) as Category[];
  }

  /**
   * Get keywords for a specific category
   */
  getCategoryKeywords(category: Category): string[] {
    return this.keywords[category] || [];
  }
}

// Singleton instance
export const keywordMatcher = new KeywordMatcher();
