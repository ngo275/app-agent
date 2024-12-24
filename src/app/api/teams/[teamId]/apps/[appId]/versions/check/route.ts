import { NextResponse } from 'next/server';
import { checkIfVersionUpToDate } from '@/lib/app-store-connect/versions';
import { validateTeamAccess } from '@/lib/auth';
import {
  AppStoreConnectAgreementError,
  AppError,
  AppErrorType,
  handleAppError,
  InvalidParamsError,
  UnknownError,
} from '@/types/errors';

export const maxDuration = 20;

// Check if the current database is obsolted compared with the status of App Store Connect.
export async function GET(
  request: Request,
  { params }: { params: { teamId: string; appId: string } }
) {
  try {
    const { appStoreConnectJWT } = await validateTeamAccess(request);
    const { appId } = params;

    if (!appId) {
      throw new InvalidParamsError('App ID is required');
    }

    // TODO: support multiple platforms
    const versionStatus = await checkIfVersionUpToDate(
      appStoreConnectJWT,
      appId
    );

    return NextResponse.json(versionStatus);
  } catch (error) {
    return handleAppError(error as Error);
  }
}
