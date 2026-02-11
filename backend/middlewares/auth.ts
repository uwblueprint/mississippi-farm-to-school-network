import { AuthenticationError, ExpressContext } from 'apollo-server-express';
import { GraphQLResolveInfo } from 'graphql';
import AuthService from '../services/implementations/authService';
import UserService from '../services/implementations/userService';
import IAuthService from '../services/interfaces/authService';
import { Role } from '../types';

const authService: IAuthService = new AuthService(new UserService());

/* eslint-disable @typescript-eslint/no-explicit-any */
export const getAccessToken = (req: any): string | null => {
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
    resolve: (parent: any, args: any, context: ExpressContext, info: GraphQLResolveInfo) => any,
    parent: any,
    args: any,
    context: ExpressContext,
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
    resolve: (parent: any, args: any, context: ExpressContext, info: GraphQLResolveInfo) => any,
    parent: any,
    args: { id: string },
    context: ExpressContext,
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
    resolve: (parent: any, args: any, context: ExpressContext, info: GraphQLResolveInfo) => any,
    parent: any,
    args: { email: string },
    context: ExpressContext,
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
