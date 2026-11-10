ONE MART — ANDROID PWA + GOOGLE APPS SCRIPT / SHEETS
===================================================

WHAT THIS PACKAGE DOES
- Keeps the existing mobile-first ONE MART screens and cart behaviour.
- Keeps Product Master lookup and server-side price validation.
- Adds JSON API routes to Apps Script, protected by a shared secret.
- Hosts the PWA frontend on Cloudflare Pages; Pages Functions proxy requests to Apps Script.
- Adds a PWA manifest, icons, service worker and install prompt.
- App shell can load from cache after first visit; catalogue refresh and order submission require internet. Orders are NOT queued offline.

PACKAGE LAYOUT
- Code.gs: updated Apps Script code.
- index.html: PWA frontend (Cloudflare Pages root).
- manifest.webmanifest, sw.js, icons/: install assets.
- functions/api/catalog.js and order.js: Cloudflare Pages Functions.

IMPORTANT: BEFORE DEPLOYING
1. Make a backup of your current Apps Script project and Google Sheet.
2. Confirm the spreadsheet is the one used by the existing ONE MART app.
3. Confirm Product Master headers exactly include Brand, Category, Model Name, DP Price. Optional: SKU Code, Colour Options, Active? (Yes/No).
4. Existing Orders sheet should retain the same 16-column structure described in the old README.
5. This starter expects the same `getCatalog()` and `submitOrder()` logic included in Code.gs. Do not paste this into a different project without checking.

PART A — GOOGLE APPS SCRIPT
1. Open the Apps Script project attached to the ONE MART spreadsheet.
2. Back up its existing Code.gs and HTML files.
3. Replace Code.gs with this package's Code.gs. Keep the Index HTML file if you still want the Apps Script fallback page.
4. In Apps Script: Project Settings > Script Properties > Add script property.
   Property: ONE_MART_API_KEY
   Value: create a long random secret (at least 32 characters). Store it securely. Never put it in index.html or share it with salesmen.
5. Save. Run getCatalog once in the editor and approve permissions if required.
6. Deploy > Manage deployments > Edit the existing Web app deployment > New version.
   Execute as: Me.
   Access: choose a setting that permits Cloudflare's server to reach the endpoint. For consumer accounts this may require Anyone. If your organisation blocks public Apps Script web apps, stop and ask the Workspace administrator.
7. Copy the deployed URL ending in /exec. Do not use /dev.
8. Test only after Cloudflare is configured. A direct browser visit to the API URL without the secret should return Unauthorized.

PART B — GITHUB + CLOUDFLARE PAGES
1. Create a private GitHub repository named one-mart-pwa.
2. Upload the CONTENTS of this package to the repository root (not an extra enclosing folder).
3. In Cloudflare Dashboard > Workers & Pages > Create > Pages > Connect to Git. Select the repository.
4. Framework preset: None. Build command: leave blank. Build output directory: . (repository root). Deploy.
5. In the Pages project settings, add these environment variables for Production (and Preview only if needed):
   GAS_WEB_APP_URL = your deployed Apps Script /exec URL
   GAS_API_KEY = the exact ONE_MART_API_KEY Script Property value
   These are server-side Pages Function environment variables. Do not use VITE_ or NEXT_PUBLIC_ prefixes.
6. Trigger a new deployment after adding variables.
7. Open the assigned https://....pages.dev URL.

PART C — TEST
1. Open the Pages URL on desktop and Android Chrome. Confirm the catalogue count and product dropdowns load.
2. Submit one clearly marked TEST order. Confirm the order ID appears and the corresponding rows are written to the Orders sheet.
3. Delete or mark the test rows as appropriate.
4. Test a bad secret by temporarily changing the Pages secret; catalogue should fail with Unauthorized. Restore the correct secret and redeploy.
5. On Android Chrome, open the Pages URL > menu (⋮) > Install app / Add to Home screen.

SECURITY / LIMITATIONS
- The shared API key protects Apps Script from casual unauthenticated calls, but it does NOT identify individual salesmen. The current form still asks the salesman to type their name. Add individual sign-in / authorization before exposing sensitive customer/order history.
- If the Apps Script web app is configured for Anyone, its URL is public; the API key is the application-level gate. Do not expose the key in frontend files, URLs shared with users, screenshots or chat.
- Apps Script web app access may be restricted by Google Workspace administrator policies.
- Orders are online-only. Do not assume a displayed offline screen means an order has been saved.
- Keep the existing spreadsheet sharing restricted; salesmen do not need spreadsheet editor access.
- Cloudflare free plan limits and product terms can change; check the current dashboard pricing/limits before production use.

ROLLBACK
If anything fails, restore the backed-up Code.gs and redeploy the previous Apps Script version. The old Apps Script /exec frontend can remain available while you test the PWA.
