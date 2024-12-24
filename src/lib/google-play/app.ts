import { GooglePlayApp } from '@/types/google-play';
import { getGooglePlayClient } from './client';

/**
 * Get all apps accessible by the service account that belong to the owner of the provided package name app
 * @param packageName - One package name to identify the developer account
 * @returns
 */
export async function getGooglePlayApps(
  packageName: string
): Promise<GooglePlayApp[]> {
  const client = await getGooglePlayClient();
  const apps: GooglePlayApp[] = [];

  try {
    // Step 1: Get the edit resource first
    const edit = await client.edits.insert({
      packageName: packageName,
    });

    if (!edit.data.id) {
      throw new Error('Failed to create edit resource');
    }

    // Step 2: Get app details
    // const appDetails = await client.edits.app.get({
    //   packageName: packageName,
    //   editId: edit.data.id,
    // });

    // Step 3: Get the developer account ID from the app details
    // const developerAccountId = appDetails.data.developerId;

    // if (!developerAccountId) {
    //   throw new Error('Developer account ID not found.');
    // }

    // Step 4: List all apps under the developer account
    // const appsResponse = await client.apps.list({
    //   developerId: developerAccountId,
    // });

    // if (!appsResponse.data.apps) {
    //   return [];
    // }

    // for (const app of appsResponse.data.apps) {
    //   apps.push({
    //     packageName: app.packageName!,
    //     name: app.title!,
    //   });
    // }

    // return apps;
    throw new Error('Not implemented');
  } catch (error) {
    console.error('Error fetching Google Play apps:', error);
    throw error;
  }
}
