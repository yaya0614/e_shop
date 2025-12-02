# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## ⚠️Warning⚠️

Don't use `npm run prisma:migrate` or `npm run prisma:reset` please.
If you have any questions, please ask in group.

## Setup

Create a new file `.env.local` and copy `.env.example` to it.

```bash
# npm
cp .env.example .env
```

Fill all the environment variables in `.env` file.

Make sure to install dependencies:

```bash
# npm
npm install
npm run prisma:generate # generate prisma type

```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev
```

OpenAPI documentation is available at `http://localhost:3000/api-docs`.

## API Authentication

### 🔒 Protected Endpoints

APIs that require authentication are marked with a lock icon (🔒) in the summary name. For example:

- `Get order history 🔒`
- `Create Order 🔒`

### Token Storage

After successful sign-in, the JWT token is automatically stored in cookies. [Cookies](https://blog.trendmicro.com.tw/?p=63387) are small data files stored in your browser that help maintain your login state and provide a seamless user experience. Subsequent API calls will automatically include this token from cookies.

You can also manually provide the token using Bearer authentication in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Verification Priority

The backend authentication middleware verifies tokens in the following order:

1. **Authorization Header** - If a Bearer token is present in the request header, it will be used first
2. **Cookies** - If no header token is found, the system will look for the token in cookies

### Unauthorized Access (401)

The API will return a `401 Unauthorized` error in the following cases:

- No token is provided (missing in both header and cookies)
- The token has expired
- The token is invalid or malformed

Example error response:

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

## Production

Build the application for production:

```bash
# npm
npm run build

```

Locally preview production build:

```bash
# npm
npm run preview

```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## References

- [What is Cookie? - Trend Micro](https://blog.trendmicro.com.tw/?p=63387)
