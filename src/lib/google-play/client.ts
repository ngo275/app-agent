import { androidpublisher_v3 } from '@googleapis/androidpublisher';
import { GoogleAuth } from 'google-auth-library';

/**
 * Create a Google Play API client from service account credentials
 * @param serviceAccountKey - JSON string containing service account credentials
 * @returns Authenticated Google Play API client
 */
export async function getGooglePlayClient(
  serviceAccountKey: string
): Promise<androidpublisher_v3.Androidpublisher> {
  try {
    // Parse the service account key
    const credentials = JSON.parse(serviceAccountKey);

    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    const authClient = await auth.getClient();

    const client = new androidpublisher_v3.Androidpublisher({
      auth: authClient as any,
    });

    return client;
  } catch (error) {
    console.error('Error creating Google Play client:', error);
    throw new Error(
      'Failed to create Google Play client. Please check your service account credentials.'
    );
  }
}
