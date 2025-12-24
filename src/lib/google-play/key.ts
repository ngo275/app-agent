import prisma from '@/lib/prisma';
import { getGooglePlayClient } from './client';

/**
 * Check if Google Play service account key exists for a team
 * @param teamId - Team ID
 * @returns true if key exists, false otherwise
 */
export async function checkGooglePlayKeyExists(
  teamId: string
): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { googleServiceAccountKey: true },
  });

  return !!team?.googleServiceAccountKey;
}

/**
 * Save Google Play service account key to database
 * @param teamId - Team ID
 * @param serviceAccountKey - JSON string containing service account credentials
 */
export async function saveGooglePlayKeyToDB(
  teamId: string,
  serviceAccountKey: string
): Promise<void> {
  try {
    // Validate the key by trying to create a client
    await getGooglePlayClient(serviceAccountKey);

    // If validation succeeds, save to database
    await prisma.team.update({
      where: { id: teamId },
      data: {
        googleServiceAccountKey: serviceAccountKey,
      },
    });
  } catch (error) {
    console.error('Error saving Google Play key:', error);
    throw new Error(
      'Invalid service account key. Please check your credentials.'
    );
  }
}

/**
 * Get Google Play service account key from database
 * @param teamId - Team ID
 * @returns Service account key JSON string
 */
export async function getGooglePlayKeyFromDB(
  teamId: string
): Promise<string | null> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { googleServiceAccountKey: true },
  });

  if (!team?.googleServiceAccountKey) {
    return null;
  }

  // Ensure we return a string
  if (typeof team.googleServiceAccountKey === 'string') {
    return team.googleServiceAccountKey;
  }

  return JSON.stringify(team.googleServiceAccountKey);
}
