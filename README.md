# AppAgent

AppAgent is an open-source tool for app store optimization (ASO), multilingual
metadata, and App Store Connect release workflows. It is intended to run in your
own local environment, using your own database and API accounts.

**The hosted offering is being discontinued. Use the local setup below instead
of signing up for a hosted AppAgent account.** The OSS project remains available
under AGPL-3.0-or-later. This change in direction is not a claim that old hosting,
credentials, or stored data have already been removed.

## What it does

- Research keywords and competitors, and generate localized store metadata.
- Generate descriptions and release notes with OpenAI.
- Import App Store Connect apps and metadata, prepare changes locally, and
  explicitly push updates or submit a version for review.

App Store Connect is the primary release workflow. Google Play support is
partial; do not assume feature parity. This is not an offline application:
AI generation, store searches, and store updates call external services. Review
changes before pushing or submitting them to an app store.

## Requirements

- Node.js **24.22.1 or a newer 24.x release** (`.nvmrc` and `package.json`).
- Yarn **1.22.22**, through Corepack or your own installation.
- PostgreSQL and an empty database for a new installation.
- An OpenAI API key for AI features, with access to the models used by the code
  (including `gpt-4.1`, `gpt-4o`, and `o3-mini`). API charges are yours.
- Upstash Redis REST URL/token for keyword and store-search caching. These
  features currently use Upstash directly; a plain local Redis TCP URL is not a
  drop-in replacement.
- Your App Store Connect API key for importing or modifying your apps. Enter
  these credentials in the app's team settings, not in this repository.

Stripe, Vercel, Resend, Google OAuth, and analytics accounts are **not required
for the recommended local development setup**. Authentication is still enabled.

## Local setup

### 1. Get the code and install dependencies

```bash
git clone https://github.com/ngo275/app-agent.git
cd app-agent
nvm install
nvm use
corepack yarn install --frozen-lockfile
cp .env.sample .env
```

If you do not use nvm, install the Node.js version above another way. Package
installation and Prisma engine downloads require network access.

### 2. Configure your local environment

Edit `.env`:

- `DATABASE_URL`: your local PostgreSQL connection string. Use a new database,
  not a production/hosted database copied from an old deployment.
- `NEXTAUTH_SECRET`: generate a fresh value with `openssl rand -base64 32`.
  Do not use a checked-in example secret.
- `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL`: keep
  `http://localhost:3000` for the instructions below.
- `OPENAI_API_KEY`: your own key for AI requests.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: your own cache.
- `NEXT_PUBLIC_FREE_PLAN_ENABLED=true`: keep this enabled. It disables the
  subscription gate, billing UI, and Stripe checkout/portal/webhook endpoints.
  It does not make third-party APIs free.

For example, if you use Docker and do not already have PostgreSQL:

```bash
docker run --name appagent-postgres \
  -e POSTGRES_USER=appagent \
  -e POSTGRES_PASSWORD=replace-with-your-local-password \
  -e POSTGRES_DB=appagent \
  -p 127.0.0.1:5432:5432 \
  -v appagent-postgres:/var/lib/postgresql/data \
  -d postgres:16
```

Set `DATABASE_URL` to match your chosen password. The named volume persists
across container restarts; do not delete it if you need to keep your data.
You can also use an existing PostgreSQL installation.

### 3. Initialize the database explicitly

```bash
corepack yarn prisma generate
corepack yarn db:migrate:deploy
```

The migration command changes the database selected by `DATABASE_URL`. Check the
connection before running it, and back up an existing database before upgrading.
No install, build, or start hook runs database migrations automatically.

### 4. Start the app and sign in

```bash
corepack yarn dev
```

Open <http://localhost:3000>. The default scripts bind to `127.0.0.1`, not your
LAN. The home page opens the local dashboard/login flow rather than a hosted
pricing page.

1. Enter your email on the login page.
2. In development mode, find `[Login URL]` in the terminal running AppAgent.
3. Open that complete link in the same browser. It is a real, expiring NextAuth
   sign-in token backed by your database, not a disabled-auth mode.
4. Your first dashboard visit creates a personal team. Connect your own store
   account and import an app to use store features.

No email is sent for this development login. Anyone with access to your terminal
can use its login links. Do not publish the terminal logs or expose the dev
server through a tunnel/LAN. Do not use the development login flow for shared
or public hosting.

## Optional production-mode local build

```bash
corepack yarn build
corepack yarn start
```

This still binds to loopback and does not migrate the database. Unlike `yarn dev`,
production mode does **not** print login links. Configure one working sign-in
method before using it:

- Google OAuth: set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and configure
  `http://localhost:3000/api/auth/callback/google` as an allowed redirect URI in
  your own OAuth application. Google sign-in is hidden when unconfigured.
- Email: set `RESEND_API_KEY` and `EMAIL_FROM` to a sender verified in your own
  Resend account. The old AppAgent sender domain is not used. Email delivery
  failure is reported as a sign-in error.

The code retains optional analytics and legacy billing integrations for forks,
but they are not needed for local use. Leave their keys blank and free mode on.
Public/multi-user hosting requires a separate security and operational review;
this README is not a production-hosting guide.

## Data and security

- `.env` is ignored by Git. Never commit API keys, OAuth secrets, private keys,
  service-account JSON, login links, or database backups.
- The database contains user/team data and store credentials, including private
  keys and service-account data. These fields do not currently have an additional
  application-level encryption layer. Protect the machine, database, and backups.
- Using a local UI does not keep all data local. OpenAI receives AI inputs;
  Upstash receives cached search/keyword data; Apple/Google receive store API
  requests. Optional email/auth/analytics services receive data when configured.
- Store actions can modify real app metadata or submit releases. Use credentials
  with the minimum permissions you need, and review the action before confirming.
- Automatic Vercel Git deployments are disabled for **all branches** in
  `vercel.json`. This does not itself pause/delete an existing deployment or
  prevent an explicit manual deployment. The former hosted analytics cron is
  disabled and returns HTTP 410 without touching the database or store APIs.
- The runtime/dependency update includes Node.js 24.x and Next.js 15.5.x fixes.
  It is not a guarantee that all advisories are resolved. Review dependency
  audits and keep your local runtime current.

## Development checks

```bash
corepack yarn test
corepack yarn lint
corepack yarn typecheck
corepack yarn build:check
```

The Node test suite uses offline fixtures for security/compatibility and local
configuration checks. It does not verify your live database, store credentials,
OAuth, email delivery, or third-party services. `build:check` generates the Prisma
client and builds Next.js without database migrations. Use test-only credentials
when building or testing in CI. The bundled font does not require Google Fonts.

## Contributing and license

Issues and pull requests are welcome. Please keep local setup, authentication,
explicit database migrations, and default no-billing behavior intact.

AppAgent is licensed under [AGPL-3.0-or-later](LICENSE).
