import { GooglePlayApp } from '@/types/google-play';
import { getGooglePlayClient } from './client';
import { getApp } from './get-app';
import { LocaleCode } from '@/lib/utils/locale';

export interface GooglePlayConsoleApp {
  appId: string;
  title: string;
  developer: string;
  icon: string;
  defaultLanguage: string;
}

/**
 * Get list of apps accessible by the service account
 * Note: Google Play API doesn't have a direct "list all apps" endpoint.
 * We need to know the package names beforehand or use the scraper to discover them.
 *
 * This function uses the internal API to list applications, but requires
 * the developer account to be properly configured.
 *
 * @param serviceAccountKey - Service account credentials JSON string
 * @returns List of apps
 */
export async function getGooglePlayAppList(
  serviceAccountKey: string
): Promise<GooglePlayConsoleApp[]> {
  try {
    const client = await getGooglePlayClient(serviceAccountKey);

    // Unfortunately, the Google Play Developer API doesn't provide a direct
    // method to list all apps. We need to use the internal applications endpoint
    // which may not be available in all versions of the API.

    // For now, we'll return an empty array and recommend using the scraper
    // or having users input their package names manually.

    // A workaround would be to:
    // 1. Let users input at least one package name
    // 2. Use the scraper to get developer info
    // 3. Use the scraper to get all apps by that developer

    console.warn(
      'Google Play API does not provide a direct list apps endpoint. ' +
        'Consider using the scraper or manual package name input.'
    );

    return [];
  } catch (error) {
    console.error('Error fetching Google Play apps:', error);
    throw new Error('Failed to fetch apps from Google Play Console');
  }
}

/**
 * Get apps by package names (when user provides them manually)
 * @param serviceAccountKey - Service account credentials
 * @param packageNames - Array of package names to fetch
 * @returns List of apps with their details
 */
export async function getGooglePlayAppsByPackageNames(
  serviceAccountKey: string,
  packageNames: string[]
): Promise<GooglePlayConsoleApp[]> {
  const apps: GooglePlayConsoleApp[] = [];

  for (const packageName of packageNames) {
    try {
      // Verify we can access this app with the service account
      const client = await getGooglePlayClient(serviceAccountKey);

      // Try to get app details via the edit API
      const edit = await client.edits.insert({
        packageName: packageName,
      });

      if (edit.data.id) {
        // Get app details using the scraper (public data)
        try {
          const appDetails = await getApp(packageName, LocaleCode.EN);

          apps.push({
            appId: packageName,
            title: appDetails.title,
            developer: appDetails.developer,
            icon: appDetails.icon,
            defaultLanguage: 'en-US',
          });

          // Clean up the edit
          await client.edits.delete({
            packageName: packageName,
            editId: edit.data.id,
          });
        } catch (scraperError) {
          console.error(
            `Error getting app details for ${packageName}:`,
            scraperError
          );
          // Add basic info even if scraper fails
          apps.push({
            appId: packageName,
            title: packageName,
            developer: 'Unknown',
            icon: '',
            defaultLanguage: 'en-US',
          });
        }
      }
    } catch (error) {
      console.error(`Error accessing app ${packageName}:`, error);
      // Skip apps we can't access
    }
  }

  return apps;
}

/**
 * Verify that the service account has access to a specific app
 * @param serviceAccountKey - Service account credentials
 * @param packageName - Package name to verify
 * @returns true if access is granted, false otherwise
 */
export async function verifyGooglePlayAccess(
  serviceAccountKey: string,
  packageName: string
): Promise<boolean> {
  try {
    const client = await getGooglePlayClient(serviceAccountKey);

    // Try to create an edit - this will fail if we don't have access
    const edit = await client.edits.insert({
      packageName: packageName,
    });

    // Clean up the edit
    if (edit.data.id) {
      await client.edits.delete({
        packageName: packageName,
        editId: edit.data.id,
      });
    }

    return true;
  } catch (error) {
    console.error('Access verification failed:', error);
    return false;
  }
}
