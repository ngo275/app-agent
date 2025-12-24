import { androidpublisher_v3 } from '@googleapis/androidpublisher';
import { getGooglePlayClient } from './client';

/**
 * Fetch app metadata including listings and localizations
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @param language - Language code (e.g., 'en-US')
 * @returns Listing data for the specified language
 */
export async function fetchListing(
  serviceAccountKey: string,
  packageName: string,
  language: string
): Promise<androidpublisher_v3.Schema$Listing | null> {
  try {
    const client = await getGooglePlayClient(serviceAccountKey);

    // Create an edit to read data
    const edit = await client.edits.insert({
      packageName,
    });

    if (!edit.data.id) {
      throw new Error('Failed to create edit session');
    }

    const editId = edit.data.id;

    try {
      // Get listing for specified language
      const listing = await client.edits.listings.get({
        packageName,
        editId,
        language,
      });

      // Delete the edit (cleanup)
      await client.edits.delete({
        packageName,
        editId,
      });

      return listing.data;
    } catch (error) {
      // Clean up edit on error
      await client.edits.delete({
        packageName,
        editId,
      });
      throw error;
    }
  } catch (error) {
    console.error(`Error fetching listing for ${language}:`, error);
    return null;
  }
}

/**
 * Fetch all available listings (localizations) for an app
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @returns Object mapping language codes to listing data
 */
export async function fetchAllListings(
  serviceAccountKey: string,
  packageName: string
): Promise<Record<string, androidpublisher_v3.Schema$Listing>> {
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
      // Get all listings
      const response = await client.edits.listings.list({
        packageName,
        editId,
      });

      // Delete the edit (cleanup)
      await client.edits.delete({
        packageName,
        editId,
      });

      // Convert array to object keyed by language
      const listings: Record<string, androidpublisher_v3.Schema$Listing> = {};
      if (response.data.listings) {
        response.data.listings.forEach((listing) => {
          if (listing.language) {
            listings[listing.language] = listing;
          }
        });
      }

      return listings;
    } catch (error) {
      // Clean up edit on error
      await client.edits.delete({
        packageName,
        editId,
      });
      throw error;
    }
  } catch (error) {
    console.error('Error fetching all listings:', error);
    throw new Error('Failed to fetch app listings');
  }
}

/**
 * Update listing for a specific language
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @param language - Language code
 * @param listingData - Updated listing data
 * @returns true if successful
 */
export async function updateListing(
  serviceAccountKey: string,
  packageName: string,
  language: string,
  listingData: {
    title?: string;
    shortDescription?: string;
    fullDescription?: string;
    video?: string;
  }
): Promise<boolean> {
  try {
    const client = await getGooglePlayClient(serviceAccountKey);

    // Create an edit
    const edit = await client.edits.insert({
      packageName,
    });

    if (!edit.data.id) {
      throw new Error('Failed to create edit session');
    }

    const editId = edit.data.id;

    try {
      // Update the listing
      await client.edits.listings.update({
        packageName,
        editId,
        language,
        requestBody: listingData,
      });

      // Commit the edit
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
    console.error(`Error updating listing for ${language}:`, error);
    throw new Error('Failed to update app listing');
  }
}

/**
 * Add a new listing/localization
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @param language - Language code for the new locale
 * @param listingData - Listing data for the new locale
 * @returns true if successful
 */
export async function addListing(
  serviceAccountKey: string,
  packageName: string,
  language: string,
  listingData: {
    title: string;
    shortDescription: string;
    fullDescription: string;
    video?: string;
  }
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
      // Create new listing
      await client.edits.listings.update({
        packageName,
        editId,
        language,
        requestBody: listingData,
      });

      // Commit the edit
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
    console.error(`Error adding listing for ${language}:`, error);
    throw new Error('Failed to add new listing');
  }
}

/**
 * Fetch app details including metadata
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @returns App details
 */
export async function fetchAppDetails(
  serviceAccountKey: string,
  packageName: string
): Promise<androidpublisher_v3.Schema$AppDetails | null> {
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
      // Get app details
      const details = await client.edits.details.get({
        packageName,
        editId,
      });

      // Delete the edit (cleanup)
      await client.edits.delete({
        packageName,
        editId,
      });

      return details.data;
    } catch (error) {
      // Clean up edit on error
      await client.edits.delete({
        packageName,
        editId,
      });
      throw error;
    }
  } catch (error) {
    console.error('Error fetching app details:', error);
    return null;
  }
}

/**
 * Update multiple listings in a single edit session
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @param listings - Array of listings to update
 * @returns true if successful
 */
export async function updateMultipleListings(
  serviceAccountKey: string,
  packageName: string,
  listings: Array<{
    language: string;
    title?: string;
    shortDescription?: string;
    fullDescription?: string;
    video?: string;
  }>
): Promise<boolean> {
  try {
    const client = await getGooglePlayClient(serviceAccountKey);

    // Create a single edit for all updates
    const edit = await client.edits.insert({
      packageName,
    });

    if (!edit.data.id) {
      throw new Error('Failed to create edit session');
    }

    const editId = edit.data.id;

    try {
      // Update all listings in parallel within the same edit
      await Promise.all(
        listings.map((listing) =>
          client.edits.listings.update({
            packageName,
            editId,
            language: listing.language,
            requestBody: {
              title: listing.title,
              shortDescription: listing.shortDescription,
              fullDescription: listing.fullDescription,
              video: listing.video,
            },
          })
        )
      );

      // Commit the edit once after all updates
      await client.edits.commit({
        packageName,
        editId,
      });

      return true;
    } catch (error) {
      // Delete edit on error (rollback all changes)
      try {
        await client.edits.delete({
          packageName,
          editId,
        });
      } catch (deleteError) {
        // Ignore delete errors if edit was already deleted
        console.error('Error deleting edit:', deleteError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating multiple listings:', error);
    throw new Error('Failed to update app listings');
  }
}

/**
 * Comprehensive metadata fetch - gets all data in one operation
 * Similar to App Store Connect's fetchAppMetadata
 * @param serviceAccountKey - Service account credentials
 * @param packageName - App package name
 * @returns Complete metadata including listings, tracks, and details
 */
export async function fetchCompleteMetadata(
  serviceAccountKey: string,
  packageName: string
): Promise<{
  listings: Record<string, androidpublisher_v3.Schema$Listing>;
  details: androidpublisher_v3.Schema$AppDetails | null;
  tracks: androidpublisher_v3.Schema$Track[];
}> {
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
      // Fetch all data in parallel
      const [listingsResponse, detailsResponse, tracksResponse] =
        await Promise.all([
          client.edits.listings.list({
            packageName,
            editId,
          }),
          client.edits.details.get({
            packageName,
            editId,
          }),
          client.edits.tracks.list({
            packageName,
            editId,
          }),
        ]);

      // Delete the edit (cleanup)
      await client.edits.delete({
        packageName,
        editId,
      });

      // Convert listings array to object
      const listings: Record<string, androidpublisher_v3.Schema$Listing> = {};
      if (listingsResponse.data.listings) {
        listingsResponse.data.listings.forEach((listing) => {
          if (listing.language) {
            listings[listing.language] = listing;
          }
        });
      }

      return {
        listings,
        details: detailsResponse.data,
        tracks: tracksResponse.data.tracks || [],
      };
    } catch (error) {
      // Clean up edit on error
      await client.edits.delete({
        packageName,
        editId,
      });
      throw error;
    }
  } catch (error) {
    console.error('Error fetching complete metadata:', error);
    throw new Error('Failed to fetch complete app metadata');
  }
}
