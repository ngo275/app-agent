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

const MAX_RETRIES = 3;

export async function optimizeContents(
  locale: LocaleCode,
  title: string,
  asoKeywords: AsoKeyword[],
  targets: AsoTarget[],
  subtitle?: string,
  keywords?: string,
  description?: string,
  shortDescription?: string,
  descriptionOutline?: string,
  previousResult?: {
    title?: string;
    subtitle?: string;
    description?: string;
    shortDescription?: string;
    fullDescription?: string;
  },
  userFeedback?: string,
  store: Store = 'APPSTORE'
): Promise<AsoContent> {
  console.log('optimizeContents called with:', {
    store,
    targets,
    locale,
    subtitle,
    description,
    shortDescription,
  });

  const result: AsoContent = {
    title: '',
    subtitle: '',
    description: '',
    keywords: '',
    shortDescription: '',
    fullDescription: '',
  };

  let retryOption = undefined;
  if (previousResult && userFeedback) {
    retryOption = {
      prev: reconstituteOriginalText(
        previousResult.title,
        previousResult.subtitle
      ),
      feedback: userFeedback,
    };
  }

  // For Google Play
  if (store === Store.GOOGLEPLAY) {
    console.log('Google Play generation - targets:', targets);

    // Map Google Play targets to internal field names for generation
    const needsTitle = targets.includes(AsoTarget.title);
    const needsShortDesc = targets.includes(AsoTarget.shortDescription);
    const needsFullDesc = targets.includes(AsoTarget.fullDescription);

    // Generate title and shortDescription together if needed
    if (needsTitle || needsShortDesc) {
      const generationTargets = [];
      if (needsTitle) generationTargets.push(AsoTarget.title);
      if (needsShortDesc) generationTargets.push(AsoTarget.subtitle); // Use subtitle internally

      console.log('Generating with targets:', generationTargets);
      let generated = await generateContents(
        locale,
        title,
        asoKeywords,
        generationTargets,
        subtitle,
        description,
        descriptionOutline,
        retryOption,
        store
      );

      // Validation and retry logic
      let retryCount = 0;
      while (retryCount < MAX_RETRIES) {
        const errors: string[] = [];

        // Validate title (30 chars for Google Play)
        if (needsTitle && generated.title) {
          if (generated.title.length > 30) {
            errors.push(
              `Title is too long (${generated.title.length}/30 chars). Make it shorter to fit within the limit.`
            );
          }
        }

        // Validate shortDescription (80 chars for Google Play)
        if (needsShortDesc && generated.subtitle) {
          if (generated.subtitle.length > 80) {
            errors.push(
              `Short description is too long (${generated.subtitle.length}/80 chars). Make it shorter to fit within the limit.`
            );
          }
        }

        if (errors.length === 0) break; // Success

        retryCount++;
        console.log(
          `Retry ${retryCount}/${MAX_RETRIES} for validation errors:`,
          errors
        );

        if (retryCount >= MAX_RETRIES) {
          console.warn('Max retries reached, using current result');
          break;
        }

        // Retry with feedback
        const retryFeedback = {
          prev: reconstituteOriginalText(generated.title, generated.subtitle),
          feedback: errors.join(' '),
        };

        generated = await generateContents(
          locale,
          title,
          asoKeywords,
          generationTargets,
          subtitle,
          description,
          descriptionOutline,
          retryFeedback,
          store
        );
      }

      if (needsTitle && generated.title) {
        result.title = generated.title;
        console.log(
          'Title generated:',
          result.title,
          `(${result.title.length} chars)`
        );
      }
      if (needsShortDesc && generated.subtitle) {
        result.shortDescription = generated.subtitle
          .replace(/\*\*/g, '')
          .replace(/### /g, '')
          .replace(/## /g, '');
        console.log(
          'ShortDescription generated:',
          result.shortDescription.substring(0, 50),
          `(${result.shortDescription.length} chars)`
        );
      }
    }

    // Generate fullDescription separately if needed
    if (needsFullDesc) {
      console.log('Generating fullDescription...');
      let fullDesc = await generateDescription(
        locale,
        title,
        asoKeywords,
        result.shortDescription || shortDescription || '',
        description || '', // Use description parameter for current fullDescription
        FIELD_LIMITS.description,
        retryOption
      );

      // Validate and retry fullDescription
      let retryCount = 0;
      while (retryCount < MAX_RETRIES) {
        if (fullDesc.length <= FIELD_LIMITS.description) break;

        retryCount++;
        console.log(
          `Retry ${retryCount}/${MAX_RETRIES} - fullDescription too long (${fullDesc.length}/${FIELD_LIMITS.description} chars)`
        );

        if (retryCount >= MAX_RETRIES) {
          console.warn('Max retries reached, using current fullDescription');
          break;
        }

        fullDesc = await generateDescription(
          locale,
          title,
          asoKeywords,
          result.shortDescription || shortDescription || '',
          description || '',
          FIELD_LIMITS.description,
          {
            prev: fullDesc,
            feedback: `The description is too long (${fullDesc.length}/${FIELD_LIMITS.description} chars). Make it shorter to fit within the limit.`,
          }
        );
      }

      result.fullDescription = fullDesc
        .replace(/\*\*/g, '')
        .replace(/### /g, '')
        .replace(/## /g, '');
      console.log(
        'FullDescription generated:',
        `${result.fullDescription.length} chars`
      );
    }

    // Return ONLY the requested fields
    const filteredResult: AsoContent = {
      title: needsTitle ? result.title : '',
      subtitle: '',
      description: '',
      keywords: '',
      shortDescription: needsShortDesc ? result.shortDescription : '',
      fullDescription: needsFullDesc ? result.fullDescription : '',
    };

    console.log(
      'Returning filtered result with fields:',
      Object.keys(filteredResult).filter(
        (k) => filteredResult[k as keyof AsoContent]
      )
    );
    return filteredResult;
  }

  // For App Store
  console.log('App Store generation - targets:', targets);

  const needsTitle = targets.includes(AsoTarget.title);
  const needsSubtitle = targets.includes(AsoTarget.subtitle);
  const needsDescription = targets.includes(AsoTarget.description);
  const needsKeywords = targets.includes(AsoTarget.keywords);

  // Generate title and subtitle together if needed
  if (needsTitle || needsSubtitle) {
    const generationTargets = [];
    if (needsTitle) generationTargets.push(AsoTarget.title);
    if (needsSubtitle) generationTargets.push(AsoTarget.subtitle);

    console.log('Generating with targets:', generationTargets);
    let generated = await generateContents(
      locale,
      title,
      asoKeywords,
      generationTargets,
      subtitle,
      description,
      descriptionOutline,
      retryOption,
      store
    );

    // Validation and retry logic
    let retryCount = 0;
    while (retryCount < MAX_RETRIES) {
      const errors: string[] = [];

      // Validate title (30 chars for App Store)
      if (needsTitle && generated.title) {
        if (generated.title.length > FIELD_LIMITS.name) {
          errors.push(
            `Title is too long (${generated.title.length}/${FIELD_LIMITS.name} chars). Make it shorter to fit within the limit.`
          );
        }
      }

      // Validate subtitle (30 chars for App Store)
      if (needsSubtitle && generated.subtitle) {
        if (generated.subtitle.length > FIELD_LIMITS.subtitle) {
          errors.push(
            `Subtitle is too long (${generated.subtitle.length}/${FIELD_LIMITS.subtitle} chars). Make it shorter to fit within the limit.`
          );
        }
      }

      if (errors.length === 0) break; // Success

      retryCount++;
      console.log(
        `Retry ${retryCount}/${MAX_RETRIES} for validation errors:`,
        errors
      );

      if (retryCount >= MAX_RETRIES) {
        console.warn('Max retries reached, using current result');
        break;
      }

      // Retry with feedback
      const retryFeedback = {
        prev: reconstituteOriginalText(generated.title, generated.subtitle),
        feedback: errors.join(' '),
      };

      generated = await generateContents(
        locale,
        title,
        asoKeywords,
        generationTargets,
        subtitle,
        description,
        descriptionOutline,
        retryFeedback,
        store
      );
    }

    if (needsTitle && generated.title) {
      result.title = generated.title;
      console.log(
        'Title generated:',
        result.title,
        `(${result.title.length} chars)`
      );
    }
    if (needsSubtitle && generated.subtitle) {
      result.subtitle = generated.subtitle;
      console.log(
        'Subtitle generated:',
        result.subtitle,
        `(${result.subtitle.length} chars)`
      );
    }
  }

  // Generate description separately if needed
  if (needsDescription) {
    console.log('Generating description...');
    let descriptionResult = await generateDescription(
      locale,
      title,
      asoKeywords,
      result.subtitle || subtitle || '',
      description || '',
      FIELD_LIMITS.description,
      retryOption
    );

    // Validate and retry description
    let retryCount = 0;
    while (retryCount < MAX_RETRIES) {
      if (descriptionResult.length <= FIELD_LIMITS.description) break;

      retryCount++;
      console.log(
        `Retry ${retryCount}/${MAX_RETRIES} - description too long (${descriptionResult.length}/${FIELD_LIMITS.description} chars)`
      );

      if (retryCount >= MAX_RETRIES) {
        console.warn('Max retries reached, using current description');
        break;
      }

      descriptionResult = await generateDescription(
        locale,
        title,
        asoKeywords,
        result.subtitle || subtitle || '',
        description || '',
        FIELD_LIMITS.description,
        {
          prev: descriptionResult,
          feedback: `The description is too long (${descriptionResult.length}/${FIELD_LIMITS.description} chars). Make it shorter to fit within the limit.`,
        }
      );
    }

    result.description = descriptionResult
      .replace(/\*\*/g, '')
      .replace(/### /g, '')
      .replace(/## /g, '');
    console.log('Description generated:', `${result.description.length} chars`);
  }

  // Generate keywords if needed
  if (needsKeywords) {
    console.log('Generating keywords...');
    const generatedKeywords = generateKeywords(
      asoKeywords,
      result.title || title,
      result.subtitle || subtitle || '',
      FIELD_LIMITS.keywords,
      locale
    );
    result.keywords = generatedKeywords.join(',');
  }

  // Return ONLY the requested fields
  const filteredResult: AsoContent = {
    title: needsTitle ? result.title : '',
    subtitle: needsSubtitle ? result.subtitle : '',
    description: needsDescription ? result.description : '',
    keywords: needsKeywords ? result.keywords : '',
    shortDescription: '',
    fullDescription: '',
  };

  console.log(
    'Returning filtered result with fields:',
    Object.keys(filteredResult).filter(
      (k) => filteredResult[k as keyof AsoContent]
    )
  );
  return filteredResult;
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
  // For Google Play, shortDescription is internally stored as subtitle
  if (targets.includes(AsoTarget.shortDescription) && !result.subtitle) {
    errorFeedback.push({
      target: AsoTarget.shortDescription,
      message: '[SHORT_DESCRIPTION] is missing',
    });
  }
  // For App Store, subtitle validation
  if (targets.includes(AsoTarget.subtitle) && !result.subtitle) {
    errorFeedback.push({
      target: AsoTarget.subtitle,
      message: '[SUBTITLE] is missing',
    });
  }
  // For Google Play, fullDescription is internally stored as description
  if (targets.includes(AsoTarget.fullDescription) && !result.description) {
    errorFeedback.push({
      target: AsoTarget.fullDescription,
      message: '[FULL_DESCRIPTION] is missing',
    });
  }
  // For App Store, description validation
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
    // Check if this is for Google Play shortDescription (80 chars) or App Store subtitle (30 chars)
    const isGooglePlayShortDesc = targets.includes(AsoTarget.shortDescription);
    const maxLength = isGooglePlayShortDesc ? 80 : FIELD_LIMITS.subtitle;
    const minLength = maxLength * 0.6;
    const fieldName = isGooglePlayShortDesc ? 'Short description' : 'Subtitle';

    if (result.subtitle.length > maxLength) {
      errorFeedback.push({
        target: isGooglePlayShortDesc
          ? AsoTarget.shortDescription
          : AsoTarget.subtitle,
        message: `${fieldName} is too long. The max character count is ${maxLength} and min character count is ${minLength}, but it's ${result.subtitle.length} now. Make it shorter so it can fit into the field.`,
      });
    }
    if (result.subtitle.length < minLength) {
      errorFeedback.push({
        target: isGooglePlayShortDesc
          ? AsoTarget.shortDescription
          : AsoTarget.subtitle,
        message: `${fieldName} is too short. Min character count is ${minLength} and max character count is ${maxLength}, but it's ${result.subtitle.length} now. Make it longer so it can fit into the field.`,
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
