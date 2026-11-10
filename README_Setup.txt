ONE MART — MOBILE REDESIGN STARTER
=================================

Included:
- Code.gs: Apps Script server code. Keeps getCatalog() and submitOrder().
- Index.html: redesigned mobile-first sales interface.
- README_Setup.txt: deployment and testing guide.

BACKEND REQUIREMENTS
1. Open the Google Sheet used by the existing ONE MART project.
2. Confirm the product tab is named exactly: Product Master.
3. Required headers in row 1:
   Brand, Category, Model Name, DP Price
   Optional supported headers:
   SKU Code, Colour Options, Active? (Yes/No)
4. The Orders tab is created automatically on first submission if it does not exist.
5. If Orders already exists, retain the existing 16-column header structure.

INSTALL / UPDATE
1. Make a backup copy of your existing Apps Script project and spreadsheet.
2. Open the Apps Script project attached to the correct Google Sheet.
3. Replace Code.gs with the supplied Code.gs.
4. Open the existing Index HTML file and replace its contents with Index.html.
   If no HTML file exists, add an HTML file named exactly Index.
5. Save the project.
6. Run getCatalog from the Apps Script editor once and approve permissions.
7. Deploy > Manage deployments > Edit (pencil) the existing Web app deployment.
8. Select a new version and deploy. Keep Execute as: Me.
9. For the access setting, choose the narrowest option that works for your team.
   Do not grant salesmen Editor access to the Apps Script project.
10. Copy the /exec Web app URL and test it on an Android phone in Chrome.

ANDROID HOME SCREEN
1. Open the /exec URL in Chrome on Android.
2. Open Chrome's three-dot menu.
3. Choose "Add to Home screen" or "Install app" if offered.
4. Confirm the name ONE MART.

IMPORTANT LIMITATIONS / SECURITY
- This is an Apps Script web app with a mobile-first interface. Adding it to the home screen may create a shortcut; it is not a full offline-capable PWA and does not provide a native APK.
- This starter still asks the user to type a salesman name. It does NOT authenticate a person's identity. Do not expose customer/order history or confidential data until individual access control is implemented.
- "Anyone with the link" access means the URL can be forwarded. Use an appropriate Google sign-in / organisation restriction if available for your account and test with a non-owner account.
- Execute as: Me lets the script use the owner's spreadsheet permissions. Do not give users editor access to the spreadsheet or Apps Script project.
- The server now verifies each submitted product against the current Product Master and uses the master-sheet DP price rather than trusting the browser price.
- Test with a sample order and verify the Orders sheet before sharing widely.
