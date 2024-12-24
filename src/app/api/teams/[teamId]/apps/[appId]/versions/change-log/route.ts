import { NextResponse } from 'next/server';
import { generateLocalizations } from '@/lib/llm/utils/generate-localization';
import { InvalidParamsError, handleAppError } from '@/types/errors';
import { AppLocalization, AsoKeyword, Platform, Store } from '@/types/aso';
import prisma from '@/lib/prisma';
import { LocaleCode } from '@/lib/utils/locale';

// Localize What's New contents into the all locales at a time.
export async function POST(
  request: Request,
  { params }: { params: { teamId: string; appId: string } }
) {
  try {
    const { whatsNew, localizations, version, platform, store } =
      (await request.json()) as {
        whatsNew: string;
        localizations: AppLocalization[];
        version: string;
        platform: string;
        store: string;
      };

    if (!whatsNew || !version || !platform || !localizations) {
      throw new InvalidParamsError('Missing params');
    }

    // Generate translations for each locale
    const translationPromises = localizations.map(
      async (localization: AppLocalization) => {
        const asoKeywords = (await prisma.asoKeyword.findMany({
          where: {
            appId: params.appId,
            locale: localization.locale,
            platform: platform as Platform,
            store: store as Store,
          },
          orderBy: {
            overall: 'desc',
          },
        })) as AsoKeyword[];

        const keywords =
          asoKeywords
            .map(
              (keyword) =>
                `"${keyword.keyword} (${keyword.position === -1 ? 'not within top 100' : `currently positioned at ${keyword.position}`})"`
            )
            .join('\n') || '';

        const translated = await generateLocalizations(
          whatsNew,
          localization.locale as LocaleCode,
          localization.title || '',
          version,
          keywords,
          localization.whatsNew || undefined
        );
        return { locale: localization.locale, text: translated };
      }
    );

    console.log(
      `Going to generate ${translationPromises.length} localizations`
    );
    const translations = await Promise.all(translationPromises);
    console.log(`Generated ${translations.length} localizations`);

    // For example { en: 'whats new', es: 'que hay de nuevo' }
    const updatedLocalizations: { [key: string]: string } = {};
    translations.forEach(({ locale, text }) => {
      updatedLocalizations[locale] = text;
    });

    return NextResponse.json({ localizations: updatedLocalizations });
  } catch (error) {
    return handleAppError(error as Error);
  }
}
