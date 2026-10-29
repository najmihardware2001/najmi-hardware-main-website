# Connecting the existing commerce backend

The initial Netlify function in this repository is a **public-catalogue API**. It deliberately does not impersonate a connected database or accept orders/login. Your local PostgreSQL cluster and existing admin password are not uploaded to GitHub.

The preserved `src/app.js` is the existing Express/PostgreSQL implementation. Netlify does not host a persistent local PostgreSQL server or a writable media directory. Complete these steps before activating account/admin/order functionality:

1. Choose a managed PostgreSQL provider and a Node/Express hosting service (or separately adapt and validate this app for Netlify Functions). Provision the database and set a private, pooled connection URL in the hosting environment.
2. Install with `npm ci`, configure `.env` privately from `.env.example`, run `npm run migrate:status`, back up the target database and run approved migrations. **Do not run `seed:demo` on the business database.**
3. Transfer the approved catalogue and necessary existing account records through a secure database migration process. Keep dumps, customer data and credentials out of Git. The public JSON export is not a database backup and is not a replacement for the variant/inventory/order tables.
4. Use distinct strong admin/customer/tracking signing secrets. Existing owner account: `owner@najmi.com.kw`. Its existing password is unchanged. This project does not provide a password or a hash in Git.
5. Configure Cloudinary or another persistent media adapter. The current public product images are already static Netlify assets. New admin uploads must use persistent storage; a serverless/local filesystem is not durable.
6. Keep payments and checkout closed until the real payment provider credentials, webhook verification, stock approvals, prices and operational checks are ready. The existing production config rejects mock payments and requires valid provider configuration; do not disable that validation merely to make login appear to work.
7. Configure the live API's exact allowed origins: `https://najmihardware.com,https://www.najmihardware.com`, secure HTTPS cookies, an appropriate trust-proxy setting and database TLS. Check cookie login/CSRF/CORS across the chosen hosts. Use a shared rate limiter if running multiple API instances.
8. Replace the `/api/*` rule in root `netlify.toml` with the **verified** API origin and an HTTP 200 reverse proxy, e.g. `to = "https://YOUR-VERIFIED-API-HOST/api/:splat"`. This example is documentation, not an active placeholder URL. Remove/disable the snapshot function after switching. Keep static `/uploads` assets or deliberately migrate their URLs too.
9. Test `/api/health` through the public website. It must report the actual database connection. Test owner sign-in, role permissions, reads/writes, variants, quote workflow and any enabled retail flow. A successful catalogue build alone does not confirm database operation.
10. Keep initial HTML/sitemaps fresh by refreshing the approved public catalogue export and rebuilding when published products change. Do not point SEO generation at an admin endpoint.

No cloud database or paid service has been created by this task. No production data has been migrated.
