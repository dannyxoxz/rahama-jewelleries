# Rahama Essentials — Easy Windows Setup

1. Install Node.js LTS from https://nodejs.org/ if it is not installed.
2. Extract this ZIP.
3. Double-click `setup.bat` and wait. On first setup it creates a secure admin password and displays it. Save the credentials.
4. Double-click `start.bat` and keep its terminal window open.
5. Open the shop at http://localhost:5173 and admin at http://localhost:5173/admin.

The backend API must also be running at http://localhost:5000. The screenshot's `ERR_CONNECTION_REFUSED` means the browser cannot reach that API — usually because only the frontend was started. `start.bat` now starts both services together.

For VS Code users: run `npm run setup` once, then `npm run dev`.

If you already have `backend/.env`, setup keeps it unchanged. Preserve your existing `backend/data` folder and `.env` when moving from an older installation.

---

# Rahama Essentials — Owner-friendly shop system

<<<<<<< HEAD
A responsive jewellery and accessories catalogue with a midnight-blue and purple luxury storefront, champagne-gold details, high-contrast product text and buttons, a Three.js / GSAP-inspired 3D hero showcase, WhatsApp product enquiries, and a protected, mobile-friendly admin dashboard. The owner can manage the store without editing source code.
=======
A responsive jewellery and accessories catalogue with a dark navy / glowing purple-blue storefront, WhatsApp product enquiries, and a protected, mobile-friendly admin dashboard. The owner can manage the store without editing source code.
>>>>>>> origin/main

## Main features

### Customer storefront
- Product catalogue with search and luminous category filters.
<<<<<<< HEAD
- A fixed multi-product 3D hero showcase with animated purple silk, moving gold ribbons, floating gemstone accents and pointer-responsive depth. The jewellery products remain individually visible rather than rotating as a slideshow.
=======
- Hero slideshow that rotates automatically.
>>>>>>> origin/main
- Product photo click opens WhatsApp with the product name, description and direct image URL in the message.
- Quick-view product panel, favourites saved in the visitor's browser, and recently viewed products.
- Special-offer section appears when the owner adds an offer price.
- Product availability and draft status are respected by the public catalogue.
- No cart, checkout, online payment, Paystack or Flutterwave integration.

### Owner dashboard (`/admin`)
- Secure admin login with bcrypt password verification and JWT sessions.
- Overview with live product count, category count, low-stock count, new enquiries and items needing attention.
- Bulk photo upload from a phone or computer (up to 30 images at once). For WhatsApp photos, save them to the device first, then choose them in the dashboard.
- New bulk-uploaded items are created as drafts so the owner can correct names and categories before publishing.
- Exact-file duplicate detection using SHA-256. It detects identical file bytes, not every visually similar or resized image.
- Product editor: name, category, description, photo, regular price, offer price, stock quantity, low-stock threshold, featured status, visibility and draft status.
- Keyword-based category suggestions when the product name is typed. The owner can always choose a different category.
- Categories page with glowing category tiles.
- Inventory page with low-stock warnings. Unknown stock stays marked “Not set”; it is not falsely treated as zero.
- Enquiry log: manually record WhatsApp enquiries and mark them New, Contacted or Resolved.
- Order log: manually record confirmed WhatsApp orders, amounts and Pending / Completed / Cancelled status. The dashboard calculates today, this month and all-time totals from completed records.
- Recently deleted area with product restore.
- CSV catalogue export (opens in Excel), browser print / Save as PDF, and full JSON backup download.
- Automatic daily JSON snapshots on the backend, retaining up to 14 days.
- Shop settings: store name, tagline, WhatsApp number, announcement, email, Instagram, hero heading and introduction.
- Responsive layout for mobile and desktop.

## Requirements
- Node.js 18 or newer
- npm

## 1. Set up the backend

Open a terminal in the project folder:

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and set your own values:

```env
JWT_SECRET=replace_with_a_random_secret_at_least_32_characters_long
ADMIN_EMAIL=the_owner_email@example.com
ADMIN_PASSWORD=choose_a_unique_password_at_least_12_characters
```

Use a private password that is not shared with customers. Do not upload `.env` to GitHub or share it in screenshots. The backend refuses to start if the secret or password is still the example value.

Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

## 2. Start the storefront

Open a second terminal in VS Code, from the project root:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

Admin dashboard: `http://localhost:5173/admin`.

## 3. How the owner adds products

1. Receive a product photo in WhatsApp.
2. Save/download the photo to the phone or computer.
3. Sign in to `/admin`.
4. On Overview, choose **Choose product photos** and select one or many photos.
5. Open Products and edit each new draft: enter the real product name, confirm its suggested category, write/adjust the description, enter the correct price and stock if known.
6. Untick **Save as draft** and make sure **Available for enquiries** is selected when ready to publish.

A normal website cannot read private WhatsApp chats directly. The owner must save the picture to the device and select it in the dashboard.

## 4. Product and image behaviour

- Uploaded image files are stored under `backend/uploads` and served by the backend.
- Existing catalogue images use the Cloudinary links supplied for this project. The `frontend/scripts/import-images.mjs` script can copy these to `frontend/public/images` on a computer with internet access (`cd frontend`, then `npm run images:import`).
- Product image click opens WhatsApp. The message contains the product's photo URL. A standard `wa.me` link cannot attach an image file automatically; the customer can open the link or send the image separately.
- Duplicate upload checking is exact-file checking. Two photos that look alike but have different bytes (for example, one is cropped or compressed) may not be identified as duplicates.
- Category suggestions use keywords in the product name; they are not AI image recognition. Confirm the category before publishing.
- Do not publish unverified claims about materials, sizes, brand or quality. Enter product specifications only after the owner confirms them.
- Prices are blank until the owner enters them. The public shop displays “Ask for price” when no price is set.

## 5. Enquiries, reports and backups

WhatsApp does not automatically expose the owner's private conversations to this website. To keep enquiry records, the owner can enter the customer's name, phone, product and notes in the Enquiries tab after receiving a message. The dashboard then tracks its follow-up status.

The website does not process payments and cannot know whether a WhatsApp conversation became a completed sale. The owner should record confirmed orders in the Orders tab; only records marked Completed contribute to sales totals. These are manually recorded figures, not bank-verified payment data.

Use Reports & backup to:
- Export products as CSV for Excel.
- Print the catalogue/report or choose “Save as PDF” in the browser print dialog.
- Download a full JSON backup of products, settings, enquiries and recently deleted items.

The backend also writes one automatic JSON snapshot per day in `backend/backups` and retains up to 14 snapshots. Snapshots include products, settings, enquiries, orders and recently deleted products. Keep the `backend/data`, `backend/uploads` and `backend/backups` folders on persistent storage. Download backups and store a copy somewhere separate from the server.

## 6. Important deployment notes

For a public live shop, deploy the frontend and backend to hosting that supports a persistent backend disk. Set `CLIENT_URL` in the backend `.env` to the exact public frontend origin, and set `VITE_API_URL` in the frontend build environment to the public backend API URL. Use HTTPS and a strong unique JWT secret. Do not use a temporary server filesystem for uploads or backups.

This starter uses JSON files on a single backend instance to keep setup simple. It is suitable for a small catalogue on one persistent server. For a larger shop, multiple backend instances or high traffic, migrate storage to a managed database and object storage such as Cloudinary or S3.

## WhatsApp contact

Default WhatsApp destination: `+234 705 430 1807` (editable from Shop settings). The owner can change it without changing code.


## Cart update
The storefront now includes a cart saved in the visitor's browser, quantity controls, item removal, and a WhatsApp checkout message. This is an enquiry cart: it does not take payments or create a verified order.

## Vercel deployment note — important
The root `vercel.json` and `api/[...path].js` route the Vite storefront and Express API through one Vercel project. The Express app now exports a handler for Vercel and only starts a local listener outside Vercel.

**This package is a deployment scaffold, not a production-ready persistent store yet.** The current backend still stores catalogue, orders, settings, enquiries and uploaded files in local JSON/filesystem paths. Vercel function filesystems are ephemeral and must not be used as the permanent database or image store. Before accepting real customer data or relying on admin changes, migrate these records to MongoDB Atlas and product uploads to Cloudinary (or another durable object store). The current backend code does not yet read `MONGODB_URI` or upload to Cloudinary. Do not assume the environment variables alone enable those integrations.

Set `VITE_API_URL=/api` in the Vercel project if required by the build. Set backend secrets only in Vercel Environment Variables; never commit `.env` files. Redeploy after changing variables.
<<<<<<< HEAD


## Production storage (required on Vercel)

The production API stores catalogue, settings, enquiries, orders and deleted-product records in MongoDB, and product images in Cloudinary. Admin uploads use short-lived signed upload instructions so image files travel directly from the browser to Cloudinary rather than through the Vercel function. Vercel's local filesystem is temporary and must not be used for permanent shop data.

Set these variables in the **Vercel backend service**:

- `MONGODB_URI` — MongoDB Atlas connection string
- `MONGODB_DB_NAME` — `rahama_essentials`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `JWT_SECRET` — a unique random value of at least 32 characters
- `JWT_EXPIRES_IN` — for example `8h`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` — unique, at least 12 characters
- `WHATSAPP_NUMBER` — digits only, including country code

The app migrates the existing JSON data files into MongoDB the first time each data collection is read. Keep a backup of your existing catalogue before deploying the upgraded API.

For local backend development, run `npm install` inside `backend` after pulling these changes. If using MongoDB and Cloudinary locally, copy `.env.example` to `.env` and enter your own values. Do not commit `.env`.

## Adding product photos from WhatsApp

On your phone, open WhatsApp, save the product photos to your device, then open Admin → Overview → Choose product photos. Select one or several photos from your Gallery/Downloads. The uploaded photos are stored in Cloudinary and published products are created so they appear in the public collection after the API refreshes. Edit the generated product names, descriptions, prices and categories from the Products tab.

A website cannot read private WhatsApp chats or download chat attachments directly. Photos must first be saved to the phone or computer and then selected in the admin upload control.
=======
>>>>>>> origin/main
