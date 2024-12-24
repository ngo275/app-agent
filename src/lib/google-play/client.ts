import { androidpublisher_v3 } from '@googleapis/androidpublisher';
import { GoogleAuth } from 'google-auth-library';

let clientInstance: androidpublisher_v3.Androidpublisher | null = null;

export async function getGooglePlayClient() {
  if (clientInstance) {
    return clientInstance;
  }

  const auth = new GoogleAuth({
    keyFile: 'path-to-your-service-account-key.json',
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const authClient = await auth.getClient();
  clientInstance = new androidpublisher_v3.Androidpublisher({
    auth: authClient as any,
  });
  return clientInstance;
}
