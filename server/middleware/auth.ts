import jwt from 'jsonwebtoken';
import type { TokenPayload } from '~/types/auth';

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);

  event.context.auth = {
    authenticated: false,
    userId: null,
    role: null,
    error: {
      code: null,
      message: null,
    },
  };

  const authorization = event.headers.get('Authorization');
  if (!authorization) {
    return;
  }

  const token = authorization.replace('Bearer ', '');

  if (!token) {
    event.context.auth.error = {
      code: 401,
      message: 'Authorization is required',
    };
  } else {
    try {
      const decoded = jwt.verify(
        token,
        config.jwtSecret,
      ) as unknown as TokenPayload;

      if (decoded.iss !== 'e-shop.ntut.edu.tw') {
        event.context.auth.error = {
          code: 401,
          message: 'Invalid token',
        };
      } else if (!decoded.role) {
        event.context.auth.error = {
          code: 401,
          message: 'Invalid token',
        };
      } else {
        event.context.auth.authenticated = true;
        event.context.auth.userId = decoded.sub;
        event.context.auth.role = decoded.role;
      }
    } catch {
      event.context.auth.error = {
        code: 401,
        message: 'Invalid token',
      };
    }
  }
});
