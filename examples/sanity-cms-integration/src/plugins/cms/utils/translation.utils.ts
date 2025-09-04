import { LanguageCode } from "@vendure/core";

export interface TranslationT {
  languageCode: string;
  slug?: string;
  name?: string;
}

export class TranslationUtils {
  /**
   * @param translations Array of translation objects
   * @param languageCode The language code to find
   * @returns The translation object or null if not found
   */
  getTranslationByLanguage<T extends TranslationT>(
    translations: T[],
    languageCode: LanguageCode | string,
  ): T | null {
    if (!translations || translations.length === 0) {
      return null;
    }

    return translations.find((t) => t.languageCode === languageCode) || null;
  }

  /**
   * @param translations Array of translation objects
   * @param requiredLanguage The required language code
   * @throws Error if validation fails
   */
  validateTranslations<T extends TranslationT>(
    translations: T[],
    requiredLanguage: LanguageCode | string,
  ) {
    if (!translations || translations.length === 0) {
      throw new Error("No translations found");
    }

    const required = this.getTranslationByLanguage(
      translations,
      requiredLanguage,
    );
    if (!required) {
      throw new Error(`No translation found for language: ${requiredLanguage}`);
    }
  }

  /**
   * @param translations Array of translation objects
   * @param languageCode The language code to find
   * @returns The slug or null if not found
   */
  getSlugByLanguage<T extends TranslationT>(
    translations: T[],
    languageCode: LanguageCode | string,
  ): string | null {
    const translation = this.getTranslationByLanguage(
      translations,
      languageCode,
    );
    return translation?.slug || null;
  }
}
