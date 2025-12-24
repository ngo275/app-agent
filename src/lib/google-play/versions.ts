import { androidpublisher_v3 } from '@googleapis/androidpublisher';
import { getGooglePlayClient } from './client';
import { fetchCompleteMetadata } from './metadata';
import prisma from '@/lib/prisma';
import {
  upsertGooglePlayApp,
  upsertGooglePlayAppVersion,
  upsertGooglePlayLocalization,
} from '@/lib/utils/versions';

/**
 * Fetch all tracks (production, beta, alpha, internal) for an app
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @returns Array of tracks with their releases
 */
export async function fetchTracks(
  serviceAccountKey: string,
  packageName: string
): Promise<androidpublisher_v3.Schema$Track[]> {
  try {
    const client = await getGooglePlayClient(serviceAccountKey);

    const edit = await client.edits.insert({
      packageName,
    });

    if (!edit.data.id) {
      throw new Error('Failed to create edit session');
    }

    const editId = edit.data.id;

    try {
      const response = await client.edits.tracks.list({
        packageName,
        editId,
      });

      // Delete the edit (cleanup)
      await client.edits.delete({
        packageName,
        editId,
      });

      return response.data.tracks || [];
    } catch (error) {
      // Clean up edit on error
      await client.edits.delete({
        packageName,
        editId,
      });
      throw error;
    }
  } catch (error) {
    console.error('Error fetching tracks:', error);
    throw new Error('Failed to fetch app tracks');
  }
}

/**
 * Get active release from a track
 * @param track - Track object
 * @returns Active release or null
 */
function getActiveRelease(
  track: androidpublisher_v3.Schema$Track
): androidpublisher_v3.Schema$TrackRelease | null {
  if (!track.releases || track.releases.length === 0) {
    return null;
  }

  // Find the most recent completed or in-progress release
  const activeRelease = track.releases.find(
    (release) =>
      release.status === 'completed' || release.status === 'inProgress'
  );

  return activeRelease || track.releases[0];
}

/**
 * Check if local database version is up-to-date with Google Play Console
 * @param teamId - Team ID
 * @param appId - App ID (database ID)
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @returns Sync status
 */
export async function checkIfVersionUpToDate(
  teamId: string,
  appId: string,
  serviceAccountKey: string,
  packageName: string
): Promise<{
  upToDate: boolean;
  localVersion?: {
    version: string;
    state: string;
    id: string;
  };
  remoteVersion?: {
    version: string;
    state: string;
    id: string;
  };
}> {
  try {
    // Get local version from database
    const dbApp = await prisma.app.findFirst({
      where: {
        id: appId,
        teamId,
      },
      include: {
        versions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!dbApp) {
      throw new Error('App not found');
    }

    const latestLocalVersion = dbApp.versions[0];

    // Get remote version from Google Play Console
    const tracks = await fetchTracks(serviceAccountKey, packageName);

    // Check production track first, then beta, then alpha
    let latestRemoteVersionCode: string | null = null;
    let latestRemoteStatus: string | null = null;
    let latestRemoteTrack: string | null = null;

    for (const trackName of ['production', 'beta', 'alpha', 'internal']) {
      const track = tracks.find((t) => t.track === trackName);
      if (track) {
        const activeRelease = getActiveRelease(track);
        if (activeRelease && activeRelease.versionCodes) {
          // Get the highest version code
          const maxVersionCode = Math.max(
            ...(activeRelease.versionCodes
              .map((v) => (typeof v === 'string' ? parseInt(v, 10) : v))
              .filter((v) => !isNaN(v)) as number[])
          );
          latestRemoteVersionCode = maxVersionCode.toString();
          latestRemoteStatus = activeRelease.status || 'completed';
          latestRemoteTrack = track.track || trackName;
          break;
        }
      }
    }

    const upToDate = latestLocalVersion?.version === latestRemoteVersionCode;

    return {
      upToDate,
      localVersion: latestLocalVersion
        ? {
            version: latestLocalVersion.version,
            state: latestLocalVersion.state || 'unknown',
            id: latestLocalVersion.id,
          }
        : undefined,
      remoteVersion: latestRemoteVersionCode
        ? {
            version: latestRemoteVersionCode,
            state: latestRemoteStatus || 'unknown',
            id: latestRemoteTrack || 'production',
          }
        : undefined,
    };
  } catch (error) {
    console.error('Error checking version status:', error);
    throw new Error('Failed to check version status');
  }
}

/**
 * Pull latest version data from Google Play Console to local database
 * Similar to App Store Connect's pullLatestVersionFromAppStoreConnect
 * @param teamId - Team ID
 * @param appId - App ID (database ID)
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 */
export async function pullLatestVersionFromGooglePlay(
  teamId: string,
  appId: string,
  serviceAccountKey: string,
  packageName: string
): Promise<void> {
  try {
    // Use transaction for atomicity (all-or-nothing)
    await prisma.$transaction(
      async (tx) => {
        // Fetch all metadata
        const metadata = await fetchCompleteMetadata(
          serviceAccountKey,
          packageName
        );

        // Upsert app
        await upsertGooglePlayApp(
          tx,
          teamId,
          packageName,
          metadata.details?.defaultLanguage || 'en-US'
        );

        // Process each track to find versions
        for (const track of metadata.tracks) {
          if (!track.releases || track.releases.length === 0) continue;

          for (const release of track.releases) {
            if (!release.versionCodes || release.versionCodes.length === 0)
              continue;

            // Get the highest version code in this release
            const versionCode = Math.max(
              ...(release.versionCodes
                .map((v) => (typeof v === 'string' ? parseInt(v, 10) : v))
                .filter((v) => !isNaN(v)) as number[])
            );

            // Upsert version
            const version = await upsertGooglePlayAppVersion(
              tx,
              appId,
              versionCode.toString(),
              track.track || 'production',
              release.status || 'completed',
              release.userFraction || undefined
            );

            // Upsert localizations for this version
            for (const [language, listing] of Object.entries(
              metadata.listings
            )) {
              // Find release notes for this language
              const releaseNotes = release.releaseNotes?.find(
                (note) => note.language === language
              );

              await upsertGooglePlayLocalization(
                tx,
                appId,
                version.id,
                language,
                {
                  title: listing.title,
                  shortDescription: listing.shortDescription,
                  fullDescription: listing.fullDescription,
                  video: listing.video,
                  recentChanges: releaseNotes?.text,
                }
              );
            }
          }
        }
      },
      {
        timeout: 30000, // 30 second timeout
      }
    );
  } catch (error) {
    console.error('Error pulling latest version from Google Play:', error);
    throw new Error('Failed to sync version from Google Play Console');
  }
}

/**
 * Get the latest version code for an app
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @returns Latest version code or null
 */
export async function getLatestVersionCode(
  serviceAccountKey: string,
  packageName: string
): Promise<number | null> {
  try {
    const tracks = await fetchTracks(serviceAccountKey, packageName);

    let maxVersionCode: number | null = null;

    for (const track of tracks) {
      const activeRelease = getActiveRelease(track);
      if (activeRelease && activeRelease.versionCodes) {
        const trackMaxVersion = Math.max(
          ...(activeRelease.versionCodes
            .map((v) => (typeof v === 'string' ? parseInt(v, 10) : v))
            .filter((v) => !isNaN(v)) as number[])
        );

        if (maxVersionCode === null || trackMaxVersion > maxVersionCode) {
          maxVersionCode = trackMaxVersion;
        }
      }
    }

    return maxVersionCode;
  } catch (error) {
    console.error('Error getting latest version code:', error);
    return null;
  }
}

/**
 * Add a new localization to an existing app
 * @param teamId - Team ID
 * @param appId - App ID
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @param language - Language code for the new locale
 * @param sourceLanguage - Language code to copy data from
 * @returns true if successful
 */
/**
 * Convert App Store Connect locale codes to Google Play locale codes
 * Google Play requires full locale codes with region (e.g., it-IT instead of just it)
 */
function convertToGooglePlayLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    // Languages that need region codes
    it: 'it-IT',
    ca: 'ca-ES',
    hr: 'hr-HR',
    cs: 'cs-CZ',
    da: 'da-DK',
    fi: 'fi-FI',
    el: 'el-GR',
    he: 'iw-IL', // Google Play uses 'iw' instead of 'he' for Hebrew
    hi: 'hi-IN',
    hu: 'hu-HU',
    id: 'id-ID',
    ja: 'ja-JP',
    ko: 'ko-KR',
    ms: 'ms-MY',
    no: 'no-NO',
    pl: 'pl-PL',
    ro: 'ro-RO',
    ru: 'ru-RU',
    sk: 'sk-SK',
    sv: 'sv-SE',
    th: 'th-TH',
    tr: 'tr-TR',
    uk: 'uk-UA',
    vi: 'vi-VN',
  };

  return localeMap[locale] || locale;
}

export async function addNewLocale(
  teamId: string,
  appId: string,
  serviceAccountKey: string,
  packageName: string,
  language: string,
  sourceLanguage: string = 'en-US'
): Promise<boolean> {
  try {
    // Convert locale codes to Google Play format
    const googlePlayLanguage = convertToGooglePlayLocale(language);
    const googlePlaySourceLanguage = convertToGooglePlayLocale(sourceLanguage);

    console.log(
      `Adding new locale: ${language} -> ${googlePlayLanguage}, source: ${sourceLanguage} -> ${googlePlaySourceLanguage}`
    );

    const client = await getGooglePlayClient(serviceAccountKey);

    const edit = await client.edits.insert({
      packageName,
    });

    if (!edit.data.id) {
      throw new Error('Failed to create edit session');
    }

    const editId = edit.data.id;

    try {
      // Get source listing
      console.log(
        `Getting source listing for language: ${googlePlaySourceLanguage}`
      );
      const sourceListing = await client.edits.listings.get({
        packageName,
        editId,
        language: googlePlaySourceLanguage,
      });

      // Create new listing with copied data
      console.log(`Creating new listing for language: ${googlePlayLanguage}`);
      await client.edits.listings.update({
        packageName,
        editId,
        language: googlePlayLanguage,
        requestBody: {
          title: sourceListing.data.title || 'App Title',
          shortDescription:
            sourceListing.data.shortDescription || 'Short description',
          fullDescription:
            sourceListing.data.fullDescription || 'Full description',
          video: sourceListing.data.video,
        },
      });

      // Commit the edit
      await client.edits.commit({
        packageName,
        editId,
      });

      // Sync to database
      await pullLatestVersionFromGooglePlay(
        teamId,
        appId,
        serviceAccountKey,
        packageName
      );

      return true;
    } catch (error) {
      // Delete edit on error
      await client.edits.delete({
        packageName,
        editId,
      });
      throw error;
    }
  } catch (error) {
    console.error('Error adding new locale:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to add new locale: ${error.message}`);
    }
    throw new Error('Failed to add new locale');
  }
}
