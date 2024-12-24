import { generateContents } from '@/lib/llm/utils/generate-contents';
import { FIELD_LIMITS } from '@/types/app-store';
import { AsoContent, AsoKeyword, AsoTarget, Store } from '@/types/aso';
import {
  AsoDescriptionError,
  AsoKeywordsError,
  AsoSubtitleError,
  AsoTitleError,
} from '@/types/errors';
import { LocaleCode } from '../utils/locale';

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
  maxLength: number
): string[] {
  // Convert title and subtitle to lowercase for case-insensitive comparison
  const titleLower = title.toLowerCase();
  const subtitleLower = subtitle?.toLowerCase() || '';

  // Filter out keywords that are already used in title or subtitle
  const unusedKeywords = asoKeywords.filter((keyword) => {
    const keywordLower = keyword.keyword.toLowerCase();
    return (
      !titleLower.includes(keywordLower) &&
      !subtitleLower.includes(keywordLower)
    );
  });

  // Sort by position (if available) to get most important keywords first
  const sortedKeywords = unusedKeywords.sort((a, b) => {
    if (!a.position && !b.position) return 0;
    if (!a.position) return 1;
    if (!b.position) return -1;
    return a.position - b.position;
  });

  // Build keywords string while respecting maxLength char limit
  const result: string[] = [];
  let currentLength = 0;

  for (const keyword of sortedKeywords) {
    // Add 1 for comma delimiter if not first keyword
    const delimiterLength = result.length > 0 ? 1 : 0;
    if (currentLength + keyword.keyword.length + delimiterLength <= maxLength) {
      result.push(keyword.keyword);
      currentLength += keyword.keyword.length + delimiterLength;
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
  currentDescription?: string,
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
        previousResult.subtitle,
        previousResult.description
      ),
      feedback: userFeedback,
    };
  }

  // Keywords are not generated by LLM, so we don't need to include them in the targets
  const targetsWithoutKeywords = targets.filter(
    (t) => t !== AsoTarget.keywords
  );
  let result = await generateContents(
    locale,
    title,
    asoKeywords,
    targetsWithoutKeywords,
    subtitle,
    currentDescription,
    descriptionOutline,
    retryOption,
    store
  );

  if (result.description) {
    result.description = result.description.replace(/\\n/g, '\n');
  }

  let generatedTitle = result.title;
  let generatedSubtitle = result.subtitle;
  let generatedDescription = result.description;

  let retryCount = 0;
  while (retryCount < MAX_RETRIES) {
    const errorFeedback = validateContent(result, targetsWithoutKeywords);

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
        result.subtitle,
        result.description
      ),
      feedback: `There was some error in the previous generation. Retry attempt ${retryCount}/${MAX_RETRIES} according to the provided error messages.\n${errorFeedback.map((f) => f.message).join(', ')}`,
    };

    const retryResult = await generateContents(
      locale,
      title,
      asoKeywords,
      retryTargets,
      subtitle,
      currentDescription,
      descriptionOutline,
      errorRetryOption,
      store
    );

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
    FIELD_LIMITS.keywords
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
        message: `Description is too long. The max character count is ${FIELD_LIMITS.description} and min character count is ${FIELD_LIMITS.description * 0.6}, but it's ${result.description.length} now. Make it shorter so it can fit into the field.`,
      });
    }
    if (result.description.length < FIELD_LIMITS.description * 0.75) {
      errorFeedback.push({
        target: AsoTarget.description,
        message: `Description is too short. Min character count is ${FIELD_LIMITS.description * 0.75} and max character count is ${FIELD_LIMITS.description}, but it's ${result.description.length} now. Make it longer so it can fit into the field.`,
      });
    }
  }

  return errorFeedback;
}
