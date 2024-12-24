import {
  AppStoreConnectBuild,
  AppStoreReviewSubmission,
  AppStoreReviewSubmissionItem,
} from '@/types/app-store';
import { Platform } from '@/types/aso';
import { AppStoreConnectReviewSubmissionError } from '@/types/errors';

// Get build candidates for a draft version
export async function getBuildsForPreReleaseVersion(
  token: string,
  appId: string,
  versionId: string
) {
  const params = new URLSearchParams({
    'filter[app]': appId,
    include: 'appStoreVersion',
    'fields[appStoreVersions]': 'versionString',
    sort: '-uploadedDate',
    limit: '10',
  });
  const url = `https://api.appstoreconnect.apple.com/v1/builds?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch builds: ${response.statusText}`);
  }
  const data = await response.json();

  // Filter builds based on the heuristic to select the most recent build:
  // 1. Build is already selected for current version
  // 2. Build has no version assigned (null)
  // 3. Build belongs to a different version
  let hitPreviousVersion = false;
  const relevantBuilds = data.data.filter((build: AppStoreConnectBuild) => {
    const appStoreVersion = build.relationships.appStoreVersion.data;

    // Case 1: Build is already selected for current version
    if (appStoreVersion?.id === versionId) {
      return true;
    }

    // Case 2: Build belongs to a different version
    if (appStoreVersion?.id) {
      hitPreviousVersion = true;
      return false;
    }

    // If we've already hit a previous version, no longer consider this build
    if (hitPreviousVersion) {
      return false;
    }

    // Case 3: Build has no version assigned (null)
    if (appStoreVersion === null) {
      // Check if this is a recent build (within 3 days)
      const uploadedDate = new Date(build.attributes.uploadedDate);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      return uploadedDate >= threeDaysAgo;
    }

    // Case 4: Build belongs to a different version
    return false;
  });

  return relevantBuilds;
}

export async function selectBuildForVersion(
  token: string,
  versionId: string,
  buildId: string
) {
  const url = `https://api.appstoreconnect.apple.com/v1/appStoreVersions/${versionId}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        type: 'appStoreVersions',
        id: versionId,
        relationships: {
          build: {
            data: {
              type: 'builds',
              id: buildId,
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to select build: ${response.statusText} - ${text}`);
  }

  const data = await response.json();

  return data;
}

export async function getReviewSubmissions(
  token: string,
  appId: string,
  platform: Platform
) {
  const params = new URLSearchParams({
    'filter[app]': appId,
    'filter[platform]': platform,
    limit: '5',
  });
  const url = `https://api.appstoreconnect.apple.com/v1/reviewSubmissions?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}

export async function createReviewSubmission(
  token: string,
  appId: string,
  platform: Platform
) {
  const url = 'https://api.appstoreconnect.apple.com/v1/reviewSubmissions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        type: 'reviewSubmissions',
        attributes: {
          platform: platform,
        },
        relationships: {
          app: {
            data: {
              type: 'apps',
              id: appId,
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to create review submission: ${response.statusText} - ${text}`
    );
  }

  const data = await response.json();
  return data.data.id; // The ID of the created reviewSubmission
}

export async function getReviewSubmissionItems(
  token: string,
  reviewSubmissionId: string
) {
  const url = `https://api.appstoreconnect.apple.com/v1/reviewSubmissions/${reviewSubmissionId}/items`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}

export async function addAppStoreVersionToReviewSubmission(
  token: string,
  reviewSubmissionId: string,
  versionId: string
) {
  const url = 'https://api.appstoreconnect.apple.com/v1/reviewSubmissionItems';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: {
            data: {
              type: 'reviewSubmissions',
              id: reviewSubmissionId,
            },
          },
          appStoreVersion: {
            data: {
              type: 'appStoreVersions',
              id: versionId,
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to add App Store version to review submission: ${response.statusText} - ${text}`
    );
  }

  const data = await response.json();
  return data.data.id; // The ID of the created reviewSubmissionItem
}

export async function submitReviewSubmission(
  token: string,
  reviewSubmissionId: string
) {
  const url = `https://api.appstoreconnect.apple.com/v1/reviewSubmissions/${reviewSubmissionId}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        type: 'reviewSubmissions',
        id: reviewSubmissionId,
        attributes: {
          submitted: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to submit review: ${response.statusText} - ${text}`
    );
  }

  // If the request is successful, the submission has been triggered.
  console.log('App version has been successfully submitted for review.');
}

export async function submitAppForReview(
  token: string,
  appId: string,
  versionId: string,
  platform: Platform
) {
  const reviewSubmissions = await getReviewSubmissions(token, appId, platform);
  const readyReviewSubmission = reviewSubmissions.data.find(
    (submission: AppStoreReviewSubmission) =>
      submission.attributes.state === 'READY_FOR_REVIEW'
  );

  let reviewSubmissionId: string | null = null;
  if (readyReviewSubmission) {
    console.log(
      `Using existing review submission ${readyReviewSubmission.id} for platform ${platform}...`
    );
    reviewSubmissionId = readyReviewSubmission.id;
  } else {
    console.log(`Creating review submission for platform ${platform}...`);
    reviewSubmissionId = await createReviewSubmission(token, appId, platform);
  }

  if (!reviewSubmissionId) {
    throw new AppStoreConnectReviewSubmissionError(
      'No review submission ID found'
    );
  }

  const reviewSubmissionItems = await getReviewSubmissionItems(
    token,
    reviewSubmissionId
  );
  if (reviewSubmissionItems.data.length === 0) {
    console.log(
      `Adding App Store version ${versionId} to review submission ${reviewSubmissionId}...`
    );
    await addAppStoreVersionToReviewSubmission(
      token,
      reviewSubmissionId,
      versionId
    );
  }

  console.log('Submitting review submission...');
  await submitReviewSubmission(token, reviewSubmissionId);
  console.log('Review submission submitted successfully');
}
