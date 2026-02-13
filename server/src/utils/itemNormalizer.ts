import logger from './logger';

interface NormalizationRule {
  pattern: RegExp;
  replacement: string;
}

/**
 * Item Name Normalizer
 * Converts abbreviated receipt text to readable product names
 * Example: "GV ORG MLK 1GAL" -> "Great Value Organic Milk 1 Gallon"
 */
export class ItemNormalizer {
  private brandAbbreviations: Map<string, string>;
  private commonAbbreviations: Map<string, string>;
  private unitAbbreviations: Map<string, string>;

  constructor() {
    // Common brand abbreviations
    this.brandAbbreviations = new Map([
      ['GV', 'Great Value'],
      ['MM', "Member's Mark"],
      ['KS', 'Kirkland Signature'],
      ['SM', 'Sam\'s Member'],
      ['365', '365 Everyday Value'],
      ['TJ', "Trader Joe's"],
      ['KC', 'King\'s Choice'],
      ['FM', 'Food Maxx'],
      ['SB', 'Safeway Brand'],
      ['WM', 'Walmart'],
      ['TGT', 'Target'],
    ]);

    // Common product abbreviations
    this.commonAbbreviations = new Map([
      ['ORG', 'Organic'],
      ['MLK', 'Milk'],
      ['CHZ', 'Cheese'],
      ['BTR', 'Butter'],
      ['BRD', 'Bread'],
      ['YGT', 'Yogurt'],
      ['CKN', 'Chicken'],
      ['BF', 'Beef'],
      ['PK', 'Pork'],
      ['FRZ', 'Frozen'],
      ['FRS', 'Fresh'],
      ['WHT', 'White'],
      ['WHL', 'Whole'],
      ['SKM', 'Skim'],
      ['2%', '2% Reduced Fat'],
      ['FF', 'Fat Free'],
      ['LF', 'Low Fat'],
      ['RF', 'Reduced Fat'],
      ['NS', 'No Salt'],
      ['LS', 'Low Sodium'],
      ['SF', 'Sugar Free'],
      ['GF', 'Gluten Free'],
      ['VEG', 'Vegetable'],
      ['FRT', 'Fruit'],
      ['JCE', 'Juice'],
      ['WTR', 'Water'],
      ['SDW', 'Sandwich'],
    ]);

    // Unit abbreviations
    this.unitAbbreviations = new Map([
      ['GAL', 'Gallon'],
      ['QT', 'Quart'],
      ['PT', 'Pint'],
      ['OZ', 'Ounce'],
      ['LB', 'Pound'],
      ['CT', 'Count'],
      ['PK', 'Pack'],
      ['BX', 'Box'],
      ['BG', 'Bag'],
      ['BTL', 'Bottle'],
      ['CN', 'Can'],
      ['JAR', 'Jar'],
    ]);
  }

  /**
   * Normalize an item name from receipt OCR text
   * @param rawName - Raw item name from OCR
   * @returns Normalized, readable item name
   */
  normalize(rawName: string): string {
    let normalized = rawName.trim();

    // Remove extra whitespace
    normalized = normalized.replace(/\s+/g, ' ');

    // Split into parts
    const parts = normalized.split(/\s+/);
    const normalizedParts: string[] = [];

    for (let part of parts) {
      const upperPart = part.toUpperCase();

      // Check brand abbreviations
      if (this.brandAbbreviations.has(upperPart)) {
        normalizedParts.push(this.brandAbbreviations.get(upperPart)!);
        continue;
      }

      // Check common abbreviations
      if (this.commonAbbreviations.has(upperPart)) {
        normalizedParts.push(this.commonAbbreviations.get(upperPart)!);
        continue;
      }

      // Check unit abbreviations (with or without numbers)
      const unitMatch = upperPart.match(/^(\d+\.?\d*)?([A-Z]+)$/);
      if (unitMatch) {
        const [, number, unit] = unitMatch;
        if (this.unitAbbreviations.has(unit)) {
          const unitName = this.unitAbbreviations.get(unit)!;
          normalizedParts.push(number ? `${number} ${unitName}` : unitName);
          continue;
        }
      }

      // If no abbreviation found, capitalize properly
      normalizedParts.push(this.capitalizeWord(part));
    }

    const result = normalizedParts.join(' ');

    if (result !== rawName) {
      logger.debug(`Normalized item: "${rawName}" -> "${result}"`);
    }

    return result;
  }

  /**
   * Capitalize a word properly (handle all caps, mixed case)
   */
  private capitalizeWord(word: string): string {
    // If already mixed case, leave it (e.g., "iPhone")
    if (word !== word.toUpperCase() && word !== word.toLowerCase()) {
      return word;
    }

    // Convert all caps or all lowercase to proper case
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  /**
   * Add a new brand abbreviation
   */
  addBrandAbbreviation(abbr: string, fullName: string): void {
    this.brandAbbreviations.set(abbr.toUpperCase(), fullName);
    logger.info(`Added brand abbreviation: ${abbr} -> ${fullName}`);
  }

  /**
   * Add a new product abbreviation
   */
  addProductAbbreviation(abbr: string, fullName: string): void {
    this.commonAbbreviations.set(abbr.toUpperCase(), fullName);
    logger.info(`Added product abbreviation: ${abbr} -> ${fullName}`);
  }

  /**
   * Batch normalize multiple items
   */
  normalizeBatch(rawNames: string[]): string[] {
    return rawNames.map((name) => this.normalize(name));
  }
}

// Singleton instance
export const itemNormalizer = new ItemNormalizer();
