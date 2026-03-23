import { IncomingMessage } from 'http';

export type AuthContext = { firebaseUid?: string };

export type GraphQLContext = AuthContext & { req: IncomingMessage };

export const getAccessToken = (req: IncomingMessage): string | null => {
  const authHeaderParts = req.headers.authorization?.split(' ');
  if (
    authHeaderParts &&
    authHeaderParts.length >= 2 &&
    authHeaderParts[0].toLowerCase() === 'bearer'
  ) {
    return authHeaderParts[1];
  }
  return null;
};
