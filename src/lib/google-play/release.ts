import { androidpublisher_v3 } from '@googleapis/androidpublisher';
import { getGooglePlayClient } from './client';

/**
 * Track types available in Google Play Console
 */
export type TrackType = 'internal' | 'alpha' | 'beta' | 'production';

/**
 * Release status
 */
export type ReleaseStatus = 'draft' | 'inProgress' | 'halted' | 'completed';

/**
 * Release note structure
 */
export interface ReleaseNote {
  language: string;
  text: string;
}

/**
 * Get available bundles/APKs for an app
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @returns Array of available bundles
 */
export async function getAvailableBundles(
  serviceAccountKey: string,
  packageName: string
): Promise<androidpublisher_v3.Schema$Bundle[]> {
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
      const response = await client.edits.bundles.list({
        packageName,
        editId,
      });

      // Delete the edit (cleanup)
      await client.edits.delete({
        packageName,
        editId,
      });

      return response.data.bundles || [];
    } catch (error) {
      // Clean up edit on error
      await client.edits.delete({
        packageName,
        editId,
      });
      throw error;
    }
  } catch (error) {
    console.error('Error fetching bundles:', error);
    throw new Error('Failed to fetch available bundles');
  }
}

/**
 * Create a new release on a track
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @param track - Track type (internal, alpha, beta, production)
 * @param versionCode - Version code to release
 * @param releaseNotes - Optional release notes
 * @param status - Release status (default: 'completed')
 * @param userFraction - For staged rollout (0.0 to 1.0)
 * @returns true if successful
 */
export async function createRelease(
  serviceAccountKey: string,
  packageName: string,
  track: TrackType,
  versionCode: number,
  releaseNotes?: ReleaseNote[],
  status: ReleaseStatus = 'completed',
  userFraction?: number
): Promise<boolean> {
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
      // Build release object
      const release: androidpublisher_v3.Schema$TrackRelease = {
        versionCodes: [versionCode.toString()],
        status,
      };

      // Add release notes if provided
      if (releaseNotes && releaseNotes.length > 0) {
        release.releaseNotes = releaseNotes.map((note) => ({
          language: note.language,
          text: note.text,
        }));
      }

      // Add user fraction for staged rollout
      if (userFraction !== undefined && userFraction > 0) {
        release.userFraction = userFraction;
        release.status = 'inProgress';
      }

      // Update the track with the new release
      await client.edits.tracks.update({
        packageName,
        editId,
        track,
        requestBody: {
          track,
          releases: [release],
        },
      });

      // Commit the changes
      await client.edits.commit({
        packageName,
        editId,
      });

      return true;
    } catch (error) {
      // Delete edit on error (rollback)
      await client.edits.delete({
        packageName,
        editId,
      });
      throw error;
    }
  } catch (error) {
    console.error('Error creating release:', error);
    throw new Error('Failed to create release');
  }
}

/**
 * Update release notes for an existing release
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @param track - Track type
 * @param versionCode - Version code
 * @param releaseNotes - Updated release notes
 * @returns true if successful
 */
export async function updateReleaseNotes(
  serviceAccountKey: string,
  packageName: string,
  track: TrackType,
  versionCode: number,
  releaseNotes: ReleaseNote[]
): Promise<boolean> {
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
      // Get current track state
      const trackResponse = await client.edits.tracks.get({
        packageName,
        editId,
        track,
      });

      if (!trackResponse.data.releases) {
        throw new Error('No releases found on this track');
      }

      // Find the release with the specified version code
      const releases = trackResponse.data.releases.map((release) => {
        if (
          release.versionCodes?.includes(versionCode.toString()) ||
          release.versionCodes?.includes(versionCode as any)
        ) {
          // Update release notes for this release
          return {
            ...release,
            releaseNotes: releaseNotes.map((note) => ({
              language: note.language,
              text: note.text,
            })),
          };
        }
        return release;
      });

      // Update the track
      await client.edits.tracks.update({
        packageName,
        editId,
        track,
        requestBody: {
          track,
          releases,
        },
      });

      // Commit the changes
      await client.edits.commit({
        packageName,
        editId,
      });

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
    console.error('Error updating release notes:', error);
    throw new Error('Failed to update release notes');
  }
}

/**
 * Promote a release from one track to another
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @param sourceTrack - Source track (e.g., 'beta')
 * @param targetTrack - Target track (e.g., 'production')
 * @param versionCode - Version code to promote
 * @param releaseNotes - Optional release notes for target track
 * @param userFraction - Optional staged rollout percentage
 * @returns true if successful
 */
export async function promoteRelease(
  serviceAccountKey: string,
  packageName: string,
  sourceTrack: TrackType,
  targetTrack: TrackType,
  versionCode: number,
  releaseNotes?: ReleaseNote[],
  userFraction?: number
): Promise<boolean> {
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
      // Get source release to copy release notes if not provided
      const sourceTrackResponse = await client.edits.tracks.get({
        packageName,
        editId,
        track: sourceTrack,
      });

      let notesToUse = releaseNotes;

      // If no release notes provided, copy from source
      if (!notesToUse && sourceTrackResponse.data.releases) {
        const sourceRelease = sourceTrackResponse.data.releases.find(
          (release) =>
            release.versionCodes?.includes(versionCode.toString()) ||
            release.versionCodes?.includes(versionCode as any)
        );

        if (sourceRelease?.releaseNotes) {
          notesToUse = sourceRelease.releaseNotes.map((note) => ({
            language: note.language || 'en-US',
            text: note.text || '',
          }));
        }
      }

      // Create release on target track
      const release: androidpublisher_v3.Schema$TrackRelease = {
        versionCodes: [versionCode.toString()],
        status: userFraction ? 'inProgress' : 'completed',
      };

      if (notesToUse) {
        release.releaseNotes = notesToUse;
      }

      if (userFraction) {
        release.userFraction = userFraction;
      }

      await client.edits.tracks.update({
        packageName,
        editId,
        track: targetTrack,
        requestBody: {
          track: targetTrack,
          releases: [release],
        },
      });

      // Commit the changes
      await client.edits.commit({
        packageName,
        editId,
      });

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
    console.error('Error promoting release:', error);
    throw new Error('Failed to promote release');
  }
}

/**
 * Update staged rollout percentage
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @param track - Track type
 * @param versionCode - Version code
 * @param userFraction - New rollout percentage (0.0 to 1.0)
 * @returns true if successful
 */
export async function updateRollout(
  serviceAccountKey: string,
  packageName: string,
  track: TrackType,
  versionCode: number,
  userFraction: number
): Promise<boolean> {
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
      // Get current track state
      const trackResponse = await client.edits.tracks.get({
        packageName,
        editId,
        track,
      });

      if (!trackResponse.data.releases) {
        throw new Error('No releases found on this track');
      }

      // Update the release with new user fraction
      const releases = trackResponse.data.releases.map((release) => {
        if (
          release.versionCodes?.includes(versionCode.toString()) ||
          release.versionCodes?.includes(versionCode as any)
        ) {
          return {
            ...release,
            userFraction,
            status: userFraction >= 1.0 ? 'completed' : 'inProgress',
          };
        }
        return release;
      });

      await client.edits.tracks.update({
        packageName,
        editId,
        track,
        requestBody: {
          track,
          releases,
        },
      });

      // Commit the changes
      await client.edits.commit({
        packageName,
        editId,
      });

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
    console.error('Error updating rollout:', error);
    throw new Error('Failed to update rollout percentage');
  }
}

/**
 * Halt a release (stop distribution)
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @param track - Track type
 * @param versionCode - Version code to halt
 * @returns true if successful
 */
export async function haltRelease(
  serviceAccountKey: string,
  packageName: string,
  track: TrackType,
  versionCode: number
): Promise<boolean> {
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
      // Get current track state
      const trackResponse = await client.edits.tracks.get({
        packageName,
        editId,
        track,
      });

      if (!trackResponse.data.releases) {
        throw new Error('No releases found on this track');
      }

      // Update the release status to halted
      const releases = trackResponse.data.releases.map((release) => {
        if (
          release.versionCodes?.includes(versionCode.toString()) ||
          release.versionCodes?.includes(versionCode as any)
        ) {
          return {
            ...release,
            status: 'halted' as const,
          };
        }
        return release;
      });

      await client.edits.tracks.update({
        packageName,
        editId,
        track,
        requestBody: {
          track,
          releases,
        },
      });

      // Commit the changes
      await client.edits.commit({
        packageName,
        editId,
      });

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
    console.error('Error halting release:', error);
    throw new Error('Failed to halt release');
  }
}

/**
 * Get release information for a specific track
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @param track - Track type
 * @returns Track information with releases
 */
export async function getTrackInfo(
  serviceAccountKey: string,
  packageName: string,
  track: TrackType
): Promise<androidpublisher_v3.Schema$Track | null> {
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
      const response = await client.edits.tracks.get({
        packageName,
        editId,
        track,
      });

      // Delete the edit (cleanup)
      await client.edits.delete({
        packageName,
        editId,
      });

      return response.data;
    } catch (error) {
      // Clean up edit on error
      await client.edits.delete({
        packageName,
        editId,
      });
      throw error;
    }
  } catch (error) {
    console.error('Error fetching track info:', error);
    return null;
  }
}
