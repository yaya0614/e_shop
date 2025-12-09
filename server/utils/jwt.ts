import jwt from 'jsonwebtoken';
import type { H3Event } from 'h3';
import type { UserRole, EmployeeRole } from '~/prisma/generated/enums';

interface TokenPayloadInput {
  userId: string;
  role: UserRole;
  vendor?: {
    id: string;
    role: EmployeeRole;
  } | null;
}

export function generateToken(
  payload: TokenPayloadInput,
  secret: string,
): string {
  return jwt.sign(
    {
      sub: payload.userId,
      iss: 'e-shop.ntut.edu.tw',
      role: payload.role,
      vendor: payload.vendor || null,
    },
    secret,
    {
      expiresIn: '7d',
    },
  );
}

export function setTokenCookie(
  event: H3Event,
  token: string,
  maxAge: number = 7 * 24 * 60 * 60, // 7 days
): void {
  setCookie(event, 'auth.token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

export function generateAndSetToken(
  event: H3Event,
  payload: TokenPayloadInput,
): string {
  const config = useRuntimeConfig(event);

  if (!config.jwtSecret) {
    throw createError({
      statusCode: 500,
      message: 'JWT secret not set in environment variables',
    });
  }

  const token = generateToken(payload, config.jwtSecret);
  setTokenCookie(event, token);

  return token;
}

export function getUserFromEvent(event: H3Event) {
  const config = useRuntimeConfig(event);
  const token = getCookie(event, 'auth.token');

  if (!token) {
    throw createError({ statusCode: 401, message: '未登入 (No token found)' });
  }

  try {
    const decoded = jwt.verify(
      token,
      config.jwtSecret as string,
    ) as jwt.JwtPayload;

    return {
      userId: decoded.sub as string,
      role: decoded.role,
      vendor: decoded.vendor,
    };
  } catch {
    throw createError({ statusCode: 401, message: 'Token 無效或過期' });
  }
}
