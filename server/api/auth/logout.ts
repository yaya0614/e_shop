export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  if (!config.jwtSecret) {
    throw createError({
      statusCode: 500,
      message: 'JWT secret not set in environment variables',
    });
  }

  setCookie(event, 'auth.token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1,
    path: '/',
  });
});
