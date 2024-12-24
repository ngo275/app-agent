import {
  AppStoreAnalyticsReport,
  AppStoreAnalyticsReportRequest,
} from '@/types/app-store';

export async function requestReport(
  token: string,
  appId: string
): Promise<string> {
  const response = await fetch(
    'https://api.appstoreconnect.apple.com/v1/analyticsReportRequests',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: {
          type: 'analyticsReportRequests',
          attributes: {
            accessType: 'ONGOING',
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
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to request analytics report: ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.data.id;
}

export async function getAnalyticsReportRequests(
  token: string,
  appId: string
): Promise<AppStoreAnalyticsReportRequest[]> {
  const response = await fetch(
    `https://api.appstoreconnect.apple.com/v1/apps/${appId}/analyticsReportRequests`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get analytics report requests: ${response.statusText}`
    );
  }

  const respopnse = await response.json();
  return respopnse.data as AppStoreAnalyticsReportRequest[];
}

export async function getAnalyticsReport(
  token: string,
  appId: string,
  reportId: string
) {
  const response = await fetch(
    `https://api.appstoreconnect.apple.com/v1/analyticsReportRequests/${reportId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get analytics report: ${response.statusText}`);
  }

  return response.json();
}

// This checks available reports for a report request
export async function getAnalyticsReports(
  token: string,
  reportRequestId: string
) {
  const response = await fetch(
    `https://api.appstoreconnect.apple.com/v1/analyticsReportRequests/${reportRequestId}/reports`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get analytics reports: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data as AppStoreAnalyticsReport[];
}

// This gets the report data instances
export async function getAnalyticsReportInstances(
  token: string,
  reportId: string
) {
  const response = await fetch(
    `https://api.appstoreconnect.apple.com/v1/analyticsReports/${reportId}/instances`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get analytics report instances: ${response.statusText}`
    );
  }

  return response.json();
}

export async function readAnalyticsReport(
  token: string,
  reportInstanceId: string
) {
  const response = await fetch(
    `https://api.appstoreconnect.apple.com/v1/analyticsReportInstances/${reportInstanceId}/segments`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to read analytics report: ${response.statusText}`);
  }

  return response.json();
}
