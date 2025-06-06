import {
  generateContents,
  generateDescription,
} from '@/lib/llm/utils/generate-contents';
import { FIELD_LIMITS } from '@/types/app-store';
import { AsoContent, AsoKeyword, AsoTarget, Store } from '@/types/aso';
import {
  AsoDescriptionError,
  AsoKeywordsError,
  AsoSubtitleError,
  AsoTitleError,
} from '@/types/errors';
import { LocaleCode } from '../utils/locale';
import { STOP_WORDS, NON_SPACE_LANGUAGES } from './stop-words';
import { BLACKLIST_KEYWORDS } from './blacklists';

// Helper function to detect plural English words
function isSingularForm(word: string, otherWords: string[]): boolean {
  if (word.length <= 3) return true; // Very short words are likely singular

  if (
    word.endsWith('s') &&
    !word.endsWith('ss') &&
    !word.endsWith('us') &&
    !word.endsWith('is')
  ) {
    const singular = word.slice(0, -1);
    return !otherWords.includes(singular);
  }

  if (word.endsWith('es')) {
    const singular = word.slice(0, -2);
    return !otherWords.includes(singular);
  }

  if (word.endsWith('ies')) {
    const singular = word.slice(0, -3) + 'y';
    return !otherWords.includes(singular);
  }

  return true; // If no plural form detected, assume it's singular
}

function reconstituteOriginalText(
  title?: string,
  subtitle?: string,
  description?: string
): string {
  let prev = ``;
  if (title) {
    prev += `
[TITLE]
${title}
`;
  }
  if (subtitle) {
    prev += `
[SUBTITLE]
${subtitle}
`;
  }
  if (description) {
    prev += `
[DESCRIPTION]
${description}
`;
  }
  return prev.trim();
}

function generateKeywords(
  asoKeywords: AsoKeyword[],
  title: string,
  subtitle: string,
  maxLength: number,
  locale: LocaleCode = LocaleCode.EN
): string[] {
  // Convert title and subtitle to lowercase for case-insensitive comparison
  const titleLower = title.toLowerCase();
  const subtitleLower = subtitle?.toLowerCase() || '';

  const localeStopWords = new Set(
    STOP_WORDS[locale] || STOP_WORDS[LocaleCode.EN] || []
  );

  const blacklistedWords = BLACKLIST_KEYWORDS[locale] || [];
  blacklistedWords.forEach((word) => localeStopWords.add(word.toLowerCase()));

  const isNonSpaceLanguage = NON_SPACE_LANGUAGES.has(locale);

  const titleAndSubtitleWords = new Set<string>();

  if (isNonSpaceLanguage) {
    Array.from(titleLower + subtitleLower).forEach((char) => {
      if (char && char.trim()) titleAndSubtitleWords.add(char);
    });
  } else {
    [...titleLower.split(/\s+/), ...subtitleLower.split(/\s+/)].forEach(
      (word) => {
        if (word) titleAndSubtitleWords.add(word.toLowerCase());
      }
    );
  }

  const allIndividualWords: string[] = [];
  const wordToPositionMap = new Map<string, number>();

  asoKeywords.forEach((keyword) => {
    let words: string[] = [];

    if (isNonSpaceLanguage) {
      words = [keyword.keyword.toLowerCase()];

      if (locale === LocaleCode.ZH_HANS || locale === LocaleCode.ZH_HANT) {
        Array.from(keyword.keyword.toLowerCase()).forEach((char) => {
          if (char && char.trim()) words.push(char);
        });
      }
    } else {
      words = keyword.keyword.toLowerCase().split(/\s+/);
    }

    words.forEach((word) => {
      if (word) {
        allIndividualWords.push(word);

        if (keyword.position !== null && keyword.position !== undefined) {
          const currentPosition = wordToPositionMap.get(word);
          if (
            currentPosition === undefined ||
            keyword.position < currentPosition
          ) {
            wordToPositionMap.set(word, keyword.position);
          }
        }
      }
    });
  });

  // Filter individual words:
  // 2. Remove words already in title or subtitle
  const uniqueWords = Array.from(new Set(allIndividualWords));
  const filteredWords = uniqueWords.filter((word) => {
    // Skip words already in title or subtitle
    if (isNonSpaceLanguage) {
      if (titleLower.includes(word) || subtitleLower.includes(word)) {
        return false;
      }
    } else {
      if (titleAndSubtitleWords.has(word)) {
        return false;
      }
    }

    if (localeStopWords.has(word)) {
      return false;
    }

    if (
      !isNonSpaceLanguage &&
      (locale.startsWith('en') ||
        locale.startsWith('es') ||
        locale.startsWith('fr') ||
        locale.startsWith('de') ||
        locale.startsWith('it') ||
        locale.startsWith('pt'))
    ) {
      if (!isSingularForm(word, uniqueWords)) {
        return false;
      }
    }

    return true;
  });

  const sortedWords = filteredWords.sort((a, b) => {
    const posA = wordToPositionMap.get(a);
    const posB = wordToPositionMap.get(b);

    if (posA === undefined && posB === undefined) return 0;
    if (posA === undefined) return 1;
    if (posB === undefined) return -1;
    return posA - posB;
  });

  // Build keywords string while respecting maxLength char limit
  const result: string[] = [];
  let currentLength = 0;

  for (const word of sortedWords) {
    // Add 1 for comma delimiter if not first word
    const delimiterLength = result.length > 0 ? 1 : 0;
    if (currentLength + word.length + delimiterLength <= maxLength) {
      result.push(word);
      currentLength += word.length + delimiterLength;
    } else {
      break;
    }
  }

  return result;
}

const MAX_RETRIES = 2;

export async function optimizeContents(
  locale: LocaleCode,
  title: string,
  asoKeywords: AsoKeyword[],
  targets: AsoTarget[],
  subtitle?: string,
  keywords?: string,
  currentDescription?: string,
  shortDescription?: string,
  descriptionOutline?: string,
  previousResult?: { title?: string; subtitle?: string; description?: string },
  userFeedback?: string,
  store: Store = 'APPSTORE'
): Promise<AsoContent> {
  let retryOption = undefined;
  if (previousResult && userFeedback) {
    retryOption = {
      prev: reconstituteOriginalText(
        previousResult.title,
        previousResult.subtitle
        // previousResult.description
      ),
      feedback: userFeedback,
    };
  }

  // Keywords are not generated by LLM, so we don't need to include them in the targets
  targets = targets.filter(
    (t) => t !== AsoTarget.keywords && t !== AsoTarget.description
  );

  let result = await generateContents(
    locale,
    title,
    asoKeywords,
    targets,
    subtitle,
    currentDescription,
    descriptionOutline,
    retryOption,
    store
  );

  console.log('Generating description separately');
  // Previously, we were generating description altogether with the other contents, but now we are generating it separately
  const description = await generateDescription(
    locale,
    title,
    asoKeywords,
    shortDescription || '',
    currentDescription || '',
    FIELD_LIMITS.description,
    retryOption
  );
  result.description = description;

  let generatedTitle = result.title;
  let generatedSubtitle = result.subtitle;
  let generatedDescription = result.description;

  let retryCount = 0;
  while (retryCount < MAX_RETRIES) {
    const errorFeedback = validateContent(result, targets);

    if (errorFeedback.length === 0) {
      break; // Success - no errors found
    }

    retryCount++;
    console.log(`Retry attempt ${retryCount} of ${MAX_RETRIES}`);

    // should dedupe
    const retryTargets = errorFeedback.map((f) => f.target);
    console.log(`Going to regenerate ${retryTargets.join(', ')}`);

    const errorRetryOption = {
      prev: reconstituteOriginalText(
        result.title,
        result.subtitle
        // result.description
      ),
      feedback: `There was some error in the previous generation. Retry attempt ${retryCount}/${MAX_RETRIES} according to the provided error messages.\n${errorFeedback
        .filter((f) => f.target !== AsoTarget.description)
        .map((f) => f.message)
        .join(', ')}`,
    };

    const retryResult = await generateContents(
      locale,
      title,
      asoKeywords,
      retryTargets.filter((t) => t !== AsoTarget.description),
      subtitle,
      currentDescription,
      descriptionOutline,
      errorRetryOption,
      store
    );

    if (retryTargets.includes(AsoTarget.description)) {
      const retryOption = {
        prev: result.description || '',
        feedback: `${errorFeedback
          .filter((f) => f.target === AsoTarget.description)
          .map((f) => f.message)
          .join(', ')}`,
      };
      const description = await generateDescription(
        locale,
        title,
        asoKeywords,
        shortDescription || '',
        currentDescription || '',
        FIELD_LIMITS.description,
        retryOption
      );
      retryResult.description = description;
    }

    // Update generated content with retry results
    if (retryTargets.includes(AsoTarget.title)) {
      if (!retryResult.title) {
        if (retryCount === MAX_RETRIES)
          throw new AsoTitleError('Failed to generate a title');
        continue;
      }
      generatedTitle = retryResult.title;
    }
    if (retryTargets.includes(AsoTarget.subtitle)) {
      if (!retryResult.subtitle) {
        if (retryCount === MAX_RETRIES)
          throw new AsoSubtitleError('Failed to generate a subtitle');
        continue;
      }
      generatedSubtitle = retryResult.subtitle;
    }
    if (retryTargets.includes(AsoTarget.description)) {
      if (!retryResult.description) {
        if (retryCount === MAX_RETRIES)
          throw new AsoDescriptionError('Failed to generate a description');
        continue;
      }
      generatedDescription = retryResult.description.replace(/\\n/g, '\n');
    }

    result = retryResult; // Update result for next iteration's validation
  }

  // Generate keywords here without LLM
  const generatedKeywords = generateKeywords(
    asoKeywords,
    generatedTitle || '',
    generatedSubtitle || '',
    FIELD_LIMITS.keywords,
    locale
  );

  return {
    title: generatedTitle || '',
    subtitle: generatedSubtitle || '',
    description: (generatedDescription || '')
      .replace(/\*\*/g, '')
      .replace(/### /g, '')
      .replace(/## /g, ''),
    keywords: generatedKeywords.join(','),
  };
}

// Helper function to validate content
function validateContent(
  result: Partial<AsoContent>,
  targets: AsoTarget[]
): { target: AsoTarget; message: string }[] {
  const errorFeedback: { target: AsoTarget; message: string }[] = [];

  if (targets.includes(AsoTarget.title) && !result.title) {
    errorFeedback.push({
      target: AsoTarget.title,
      message: '[TITLE] is missing',
    });
  }
  if (targets.includes(AsoTarget.subtitle) && !result.subtitle) {
    errorFeedback.push({
      target: AsoTarget.subtitle,
      message: '[SUBTITLE] is missing',
    });
  }
  if (targets.includes(AsoTarget.description) && !result.description) {
    errorFeedback.push({
      target: AsoTarget.description,
      message: '[DESCRIPTION] is missing',
    });
  }

  if (result.title) {
    if (result.title.length > FIELD_LIMITS.name) {
      errorFeedback.push({
        target: AsoTarget.title,
        message: `Title is too long. The max character count is ${FIELD_LIMITS.name} and min character count is ${FIELD_LIMITS.name * 0.6}, but it's ${result.title.length} now. Make it shorter so it can fit into the field.`,
      });
    }
    if (result.title.length < FIELD_LIMITS.name * 0.75) {
      errorFeedback.push({
        target: AsoTarget.title,
        message: `Title is too short. Min character count is ${FIELD_LIMITS.name * 0.75} and max character count is ${FIELD_LIMITS.name}, but it's ${result.title.length} now. Make it longer so it can fit into the field.`,
      });
    }
  }

  if (result.subtitle) {
    if (result.subtitle.length > FIELD_LIMITS.subtitle) {
      errorFeedback.push({
        target: AsoTarget.subtitle,
        message: `Subtitle is too long. The max character count is ${FIELD_LIMITS.subtitle} and min character count is ${FIELD_LIMITS.subtitle * 0.6}, but it's ${result.subtitle.length} now. Make it shorter so it can fit into the field.`,
      });
    }
    if (result.subtitle.length < FIELD_LIMITS.subtitle * 0.6) {
      errorFeedback.push({
        target: AsoTarget.subtitle,
        message: `Subtitle is too short. Min character count is ${FIELD_LIMITS.subtitle * 0.6} and max character count is ${FIELD_LIMITS.subtitle}, but it's ${result.subtitle.length} now. Make it longer so it can fit into the field.`,
      });
    }
  }

  if (result.description) {
    if (result.description.length > FIELD_LIMITS.description) {
      errorFeedback.push({
        target: AsoTarget.description,
        message: `It is too long. The max character count is ${FIELD_LIMITS.description}, but it's ${result.description.length} now. Make it shorter so it can fit into the field.`,
      });
    }
    // if (result.description.length < FIELD_LIMITS.description * 0.75) {
    //   errorFeedback.push({
    //     target: AsoTarget.description,
    //     message: `Description is too short. Min character count is ${FIELD_LIMITS.description * 0.75} and max character count is ${FIELD_LIMITS.description}, but it's ${result.description.length} now. Make it longer so it can fit into the field.`,
    //   });
    // }
  }

  return errorFeedback;
}
