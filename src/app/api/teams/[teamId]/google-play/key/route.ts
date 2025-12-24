import {
  checkGooglePlayKeyExists,
  saveGooglePlayKeyToDB,
} from '@/lib/google-play/key';
import { validateTeamAccess } from '@/lib/auth';
import { handleAppError, InvalidParamsError } from '@/types/errors';
import { NextResponse } from 'next/server';

// Check if a user has uploaded Google Play service account key
export async function GET(request: Request) {
  const { userId, teamId, session } = await validateTeamAccess(request);

  try {
    const keyExists = await checkGooglePlayKeyExists(teamId);
    return NextResponse.json({ hasKey: keyExists }, { status: 200 });
  } catch (error) {
    console.error('Error checking Google Play key:', error);
    return handleAppError(error as Error);
  }
}

// Upload the Google Play service account key
export async function POST(request: Request) {
  const { userId, teamId, session } = await validateTeamAccess(request);

  try {
    const formData = await request.formData();
    const jsonFile = formData.get('jsonFile');

    if (!jsonFile) {
      return NextResponse.json(
        new InvalidParamsError('Missing service account key file'),
        { status: 400 }
      );
    }

    if (typeof jsonFile !== 'object' || !('arrayBuffer' in jsonFile)) {
      return NextResponse.json(
        new InvalidParamsError('Invalid service account key file'),
        { status: 400 }
      );
    }

    const fileName = (jsonFile as File).name;
    if (!fileName || !fileName.endsWith('.json')) {
      return NextResponse.json(
        new InvalidParamsError('File must have a .json extension'),
        { status: 400 }
      );
    }

    const jsonFileContents = await (jsonFile as Blob).text();

    // Validate JSON format
    try {
      JSON.parse(jsonFileContents);
    } catch (e) {
      return NextResponse.json(
        new InvalidParamsError('Invalid JSON file format'),
        { status: 400 }
      );
    }

    await saveGooglePlayKeyToDB(teamId, jsonFileContents);

    return NextResponse.json(
      { message: 'Google Play service account key saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving Google Play key:', error);
    return handleAppError(error as Error);
  }
}
