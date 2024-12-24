import {
  checkAppStoreConnectKeyExists,
  saveAppStoreConnectKeyToDB,
} from '@/lib/app-store-connect/key';
import { validateTeamAccess } from '@/lib/auth';
import { handleAppError, InvalidParamsError } from '@/types/errors';
import { NextResponse } from 'next/server';

// Check if a user has uploaded credentials of App Store Connect.
export async function GET(request: Request) {
  const { userId, teamId, session } = await validateTeamAccess(request);

  try {
    const keyExists = await checkAppStoreConnectKeyExists(teamId);
    return NextResponse.json({ hasKey: keyExists }, { status: 200 });
  } catch (error) {
    console.error('Error checking App Connect key:', error);
    return handleAppError(error as Error);
  }
}

// Upload the credentials of App Store Connect.
export async function POST(request: Request) {
  const { userId, teamId, session } = await validateTeamAccess(request);

  const formData = await request.formData();
  const p8File = formData.get('p8File');
  const issuerId = formData.get('issuerId') as string;
  const keyId = formData.get('keyId') as string;

  if (!p8File || !issuerId || !keyId) {
    return NextResponse.json(
      new InvalidParamsError('Missing required fields'),
      { status: 400 }
    );
  }

  if (typeof p8File !== 'object' || !('arrayBuffer' in p8File)) {
    return NextResponse.json(new InvalidParamsError('Invalid p8 file'), {
      status: 400,
    });
  }

  const fileName = (p8File as File).name;
  if (!fileName || !fileName.endsWith('.p8')) {
    return NextResponse.json(
      new InvalidParamsError('File must have a .p8 extension'),
      { status: 400 }
    );
  }

  try {
    const p8FileContents = await (p8File as Blob).text();
    await saveAppStoreConnectKeyToDB(teamId, p8FileContents, issuerId, keyId);

    return NextResponse.json(
      { message: 'App Store Connect key saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving App Connect key:', error);
    return handleAppError(error as Error);
  }
}
