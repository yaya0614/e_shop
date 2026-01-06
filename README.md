# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## ⚠️Warning⚠️

Don't use `npm run prisma:migrate` or `npm run prisma:reset` please.
If you have any questions, please ask in group.

## Setup

### Production Environment

Create a new file `.env` and copy `.docker.env.example` to it.

```bash
# npm
cp .docker.env.example .env
```

Run Docker Compose to start the application:

```bash
# npm
docker compose up -d
```

### Development Environment

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

### Vendor Authentication & Token Exchange

#### Overview

When a user needs to operate on vendor-related resources, they must first enter the vendor dashboard. This triggers a special authentication flow that exchanges their user token for an enhanced token containing vendor scope.

#### Token Exchange Flow

```
User Login (Basic Token)
       ↓
Navigate to Vendor Dashboard
       ↓
Call GET /api/vendor/{vendorId}
       ↓
Backend Verification:
  1. Verify user authentication
  2. Check vendor exists
  3. Verify user is employee of vendor
       ↓
Token Exchange (if verified)
  - Generate new JWT token
  - Include vendor scope (vendorId + employee role)
  - Set updated token in cookies
       ↓
Enhanced Token (with Vendor Scope)
```

#### Implementation Details

When entering a vendor dashboard, the frontend calls `GET /api/vendor/{vendorId}`. This endpoint performs:

1. **User Authentication Check**: Verifies the user has a valid authentication token

2. **Vendor Verification**: Confirms the requested vendor exists in the database

3. **Employee Authorization**: Checks if the authenticated user is an employee of the requested vendor

4. **Token Exchange**: If all checks pass, generates a new JWT token that includes:
   - Original user information (`userId`, `role`)
   - Vendor scope (`vendorId`, `employeeRole`)

5. **Token Update**: Sets the enhanced token in cookies, replacing the previous token

#### Token Structure

**Basic Token (After Login)**:

```json
{
  "sub": "user-id",
  "iss": "e-shop.ntut.edu.tw",
  "role": "USER",
  "vendor": null
}
```

**Enhanced Token (After Vendor Dashboard Entry)**:

```json
{
  "sub": "user-id",
  "iss": "e-shop.ntut.edu.tw",
  "role": "USER",
  "vendor": {
    "id": "vendor-id",
    "role": "MANAGER"
  }
}
```

#### Security Considerations

- The token exchange only occurs if the user is a verified employee of the vendor
- The vendor scope is added to the token, not replacing user information
- The enhanced token maintains the same expiration period (7 days)
- Unauthorized access returns `403 Forbidden` if user is not an employee

#### Example Usage

##### Using with Error Handling

```typescript
import { FetchError } from 'ofetch';

const enterVendorDashboard = async (vendorId: string) => {
  try {
    // Using Nuxt's $fetch (automatically handles cookies)
    const vendorData = await $fetch(`/api/vendor/${vendorId}`, {
      method: 'GET',
      credentials: 'include',
    });

    return vendorData;
  } catch (error) {
    if (error instanceof FetchError) {
      if (error.data.statusCode === 403) {
        // TODO: Show a message to the user
        return;
      }
      // TODO: Show a message to the user
    }
  }
};
```

##### After Token Exchange - Making Vendor Operations

```typescript
// After successfully entering vendor dashboard
// All subsequent API calls will include the enhanced token

// Example: Get vendor orders
const orders = await fetch('/api/vendor/orders', {
  method: 'GET',
  credentials: 'include', // Uses the enhanced token with vendor scope
});
```

#### Understanding `credentials: 'include'`

**Why is `credentials: 'include'` required?**

While browsers typically send cookies automatically for same-origin requests, explicitly setting `credentials: 'include'` is a best practice for several reasons:

1. **Cross-Origin Compatibility**: If your API is hosted on a different subdomain or domain in the future, cookies will still be sent
2. **Framework Consistency**: Different frameworks and environments may have different default behaviors
3. **Explicit Intent**: Makes it clear to other developers that this request requires authentication
4. **Server-Side Rendering**: Ensures cookies are properly handled in SSR contexts

**Available `credentials` Options**:

| Option                  | Behavior                                   | Use Case                                            |
| ----------------------- | ------------------------------------------ | --------------------------------------------------- |
| `omit`                  | Never send cookies                         | Public API endpoints that don't need authentication |
| `same-origin` (default) | Send cookies only for same-origin requests | Standard same-domain requests                       |
| `include`               | Always send cookies, even cross-origin     | Authentication required, future-proof               |

**Important Notes**:

- For cross-origin requests with `credentials: 'include'`, the server must set appropriate CORS headers:
  - `Access-Control-Allow-Credentials: true`
  - `Access-Control-Allow-Origin` cannot be `*` (must be specific origin)
- In this project, all authenticated API requests should use `credentials: 'include'` to ensure tokens are properly transmitted

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

### Forbidden Access (403)

The API will return a `403 Forbidden` error when:

- User is authenticated but not authorized to access the resource
- User is not an employee of the requested vendor

Example error response:

```json
{
  "statusCode": 403,
  "message": "Forbidden"
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
