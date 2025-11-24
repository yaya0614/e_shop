# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## ⚠️Warning⚠️

Don't use `npm run prisma:migrate` or `npm run prisma:reset` please.
If you have any questions, please ask in group.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install
npm run prisma:generate # generate prisma type

```

Create a new file `.env.local` and copy `.env.example` to it.

```bash
# npm
cp .env.example .env
```

Fill all the environment variables in `.env` file.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev
```

OpenAPI documentation is available at `http://localhost:3000/api-docs`.

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
