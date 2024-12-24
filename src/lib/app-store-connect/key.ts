import prisma from '@/lib/prisma';

export async function checkAppStoreConnectKeyExists(
  teamId: string
): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { appStoreConnectPrivateKey: true },
  });

  return !!team?.appStoreConnectPrivateKey;
}

export const saveAppStoreConnectKeyToDB = async (
  teamId: string,
  p8File: string,
  issuerId: string,
  keyId: string
) => {
  await prisma.team.update({
    where: { id: teamId },
    data: {
      appStoreConnectPrivateKey: p8File,
      appStoreConnectKeyId: keyId,
      appStoreConnectIssuerId: issuerId,
    },
  });
};
