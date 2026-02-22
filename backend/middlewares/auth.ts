import { AuthenticationError } from 'apollo-server';
import type { GraphQLResolveInfo } from 'graphql/type';
import { IncomingMessage } from 'http';
import AuthService from '@/services/implementations/authService';
import UserService from '@/services/implementations/userService';
import IAuthService from '@/services/interfaces/authService';
import { Role } from '@/types';

export type GraphQLContext = { req: IncomingMessage };

const authService: IAuthService = new AuthService(new UserService(), null);

/* eslint-disable @typescript-eslint/no-explicit-any */
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

/* eslint-disable @typescript-eslint/no-explicit-any */

export const isAuthorizedByRole = (roles: Set<Role>) => {
  return async (
    resolve: (parent: any, args: any, context: GraphQLContext, info: GraphQLResolveInfo) => any,
    parent: any,
    args: any,
    context: GraphQLContext,
    info: GraphQLResolveInfo
  ) => {
    const accessToken = getAccessToken(context.req);

    const authorized = accessToken && (await authService.isAuthorizedByRole(accessToken, roles));

    if (!authorized) {
      throw new AuthenticationError('You are not authorized to perform this action');
    }

    return resolve(parent, args, context, info);
  };
};

export const isAuthorizedByUserId = () => {
  return async (
    resolve: (parent: any, args: any, context: GraphQLContext, info: GraphQLResolveInfo) => any,
    parent: any,
    args: { id: string },
    context: GraphQLContext,
    info: GraphQLResolveInfo
  ) => {
    const accessToken = getAccessToken(context.req);

    const authorized =
      accessToken && (await authService.isAuthorizedByUserId(accessToken, args.id));

    if (!authorized) {
      throw new AuthenticationError('You are not authorized to perform this action');
    }

    return resolve(parent, args, context, info);
  };
};

export const isAuthorizedByEmail = () => {
  return async (
    resolve: (parent: any, args: any, context: GraphQLContext, info: GraphQLResolveInfo) => any,
    parent: any,
    args: { email: string },
    context: GraphQLContext,
    info: GraphQLResolveInfo
  ) => {
    const accessToken = getAccessToken(context.req);

    const authorized =
      accessToken && (await authService.isAuthorizedByEmail(accessToken, args.email));

    if (!authorized) {
      throw new AuthenticationError('You are not authorized to perform this action');
    }

    return resolve(parent, args, context, info);
  };
};
