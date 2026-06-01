# UddharSetu

UddharSetu is a verified disaster-relief coordination platform for Nepal. It connects approved social workers with public donors and volunteers through reviewed help requests and fundraising campaigns. The platform is built around a trust-first workflow: users sign in with Google, social workers complete KYC, admins review KYC and post submissions, and only approved posts become public.

## Project Structure

```text
.
├── client/                 # React + Vite frontend
│   ├── public/             # Public static assets
│   └── src/
│       ├── assets/         # Logo, landing image, landing video
│       ├── components/     # Shared UI components
│       ├── constants/      # Form options and UI constants
│       ├── pages/          # Page-level React views
│       ├── types/          # Shared frontend TypeScript types
│       ├── App.tsx         # Main application state and routing
│       └── styles.css      # Global styling
├── server/                 # Express + TypeScript API server
│   └── src/
│       ├── auth.ts         # Google user/session handling
│       ├── cloudinary.ts   # Signed upload configuration
│       ├── db.ts           # PostgreSQL connection and schema setup
│       ├── donations.ts    # Khalti payments and material pledges
│       ├── env.ts          # Environment loading
│       ├── helpRequests.ts # Legacy help-request helpers
│       ├── index.ts        # API routes and server boot
│       ├── kyc.ts          # KYC submission/review logic
│       ├── posts.ts        # Relief post creation/review/listing
│       └── validation.ts   # Request validation helpers
├── system.txt              # Product flow and design overview
├── package.json            # Workspace scripts
└── README.md
```

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Leaflet maps
- Google OAuth client
- Lucide React icons
- Plain CSS design system

### Backend

- Node.js
- Express 5
- TypeScript
- PostgreSQL
- `pg`
- Google Auth Library
- Cloudinary signed uploads
- Khalti payment API
- Cookie-based sessions

## Core Features

### Public Visitors

- Browse approved material help requests.
- Browse approved financial fundraising campaigns.
- View campaign/request images, proof documents, progress, location, and contacts.
- Pledge material support for help requests.
- Donate to fundraising campaigns through Khalti.
- See nearest posts first when browser location access is allowed.

### Social Workers

- Sign in with Google.
- Submit KYC with profile photo and government document.
- Create material help requests after KYC approval.
- Create financial fundraising campaigns after KYC approval.
- Upload a main image and verification document for each post.
- Pin locations using map search, map click, or live location.
- Track submitted posts from the dashboard.

### Admins

- Sign in with Google.
- Review pending KYC submissions.
- Review pending help requests and fundraising campaigns.
- Approve or reject submissions with optional admin notes.
- Keep unapproved content hidden from the public site.

## Application Flow

1. A user signs in with Google.
2. The backend verifies the Google ID token.
3. A session cookie is created and stored in the browser.
4. Social workers submit KYC.
5. Admins approve or reject KYC.
6. Approved social workers create help requests or fundraising campaigns.
7. Admins approve or reject posts.
8. Approved posts appear publicly.
9. Visitors pledge support or donate.
10. Progress updates are reflected on public cards and detail pages.

## Pages

### Home

Landing page for the platform. It introduces the verified relief workflow, shows platform counts, displays public relief activity, and routes logged-in users to the correct area.

### Help Requests

Public list of approved material help requests. Supported categories are:

- Food
- Clothes
- Volunteer
- Other

Cards show the main image, progress, category, location, contact actions, and proof link.

### Fundraising

Public list of approved fundraising campaigns. Supported categories are:

- Medical
- Supply
- Other

Cards show the campaign image, raised amount, target amount, progress, location, contact actions, and proof link.

### Post Detail

Detailed page for a single help request or fundraising campaign. It shows the full description, image, verification proof, location, beneficiary details, contact details, and the pledge or donation action.

### Dashboard

Worker dashboard for approved social workers. It contains post creation, post statistics, and the worker's submitted posts.

### KYC

KYC submission page for social workers. It collects identity information, phone number, profile photo, and government document.

### Admin Review Center

Admin-only page for reviewing KYC and post submissions.

## Environment Variables

Create environment files for both the backend and frontend.

### `server/.env`

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
KHALTI_SECRET_KEY=your-khalti-secret-key
CLIENT_BASE_URL=http://localhost:5175
```

### `client/.env`

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

Do not commit real `.env` secrets to Git.

## Installation

Install all workspace dependencies from the repository root:

```bash
npm install
```

## Development

Run the frontend and backend together:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5175`
- Backend API: `http://localhost:5000`

The Vite dev server proxies `/api` requests to the backend.

## Build

Build both workspaces:

```bash
npm run build
```

This runs:

```bash
npm run build --workspace client
npm run build --workspace server
```

## Production Start

After building, start the server:

```bash
npm run start
```

The server serves the API only. Deploy the built frontend separately or configure a static hosting layer for `client/dist`.

## Database

The backend uses PostgreSQL. On startup, `initializeDatabase()` creates required tables and indexes if they do not exist.

Main tables:

- `users`
- `user_sessions`
- `kyc_submissions`
- `relief_posts`
- `relief_pledges`
- `help_requests`

The active post system uses `relief_posts` for both material help requests and fundraising campaigns.

### User Roles

- `SOCIAL_WORKER`
- `SUPER_ADMIN`

### User Statuses

- `PENDING`
- `APPROVED`
- `REJECTED`

### Post Types

- `HELP`
- `FUNDRAISING`

### Post Review Statuses

- `PENDING`
- `APPROVED`
- `REJECTED`

## Authentication

Authentication uses Google OAuth on the frontend and server-side Google token verification on the backend.

Session flow:

1. Frontend receives a Google credential.
2. Frontend posts the credential to `/api/auth/google`.
3. Backend verifies the token against `GOOGLE_CLIENT_ID`.
4. Backend creates or updates the user.
5. Backend creates a session row in PostgreSQL.
6. Backend sets an HTTP-only cookie named `uddharsetu_session`.
7. Later authenticated requests read the cookie and resolve the current user.

Session cookies are:

- HTTP-only
- SameSite `lax`
- Secure only when `NODE_ENV=production`
- Valid for 7 days

## Media Uploads

Uploads use Cloudinary signed uploads.

Flow:

1. Authenticated user requests `/api/media/upload-signature`.
2. Backend returns Cloudinary upload parameters.
3. Frontend uploads directly to Cloudinary.
4. Frontend sends the returned file URL and public ID when submitting KYC or posts.

Upload folders:

- KYC files: `uddharsetu/kyc-documents`
- Post verification files: `uddharsetu/authority-documents`

## Payment Flow

Financial donations use Khalti.

1. Visitor submits donation details.
2. Frontend calls `/api/donations/initiate`.
3. Backend creates a financial pledge record.
4. Backend starts a Khalti payment.
5. Visitor completes payment on Khalti.
6. Frontend calls `/api/donations/verify` with the Khalti `pidx`.
7. Backend verifies payment with Khalti.
8. Backend marks the pledge as completed and increments the campaign raised amount.

## Material Pledge Flow

Material help requests do not use drop points or pledge-code verification.

1. Visitor submits name, phone number, and quantity.
2. Frontend calls `/api/pledges/material`.
3. Backend validates remaining quantity.
4. Backend creates a completed material pledge.
5. Backend increments the request fulfilled quantity immediately.

## API Reference

All API routes are mounted under `/api`.

### Health

#### `GET /api/health`

Checks API and database availability.

Authentication: public

Response:

```json
{
  "status": "ok",
  "service": "UddharSetu API",
  "database": "connected"
}
```

If the database is unavailable, returns HTTP `503`.

### Authentication

#### `POST /api/auth/google`

Signs in or creates a user using a Google credential.

Authentication: public

Request body:

```json
{
  "credential": "google-id-token"
}
```

Response:

```json
{
  "user": {
    "id": "uuid",
    "googleId": "google-user-id",
    "email": "user@example.com",
    "fullName": "User Name",
    "picture": "https://...",
    "role": "SOCIAL_WORKER",
    "status": "PENDING"
  }
}
```

Errors:

- `400` if `credential` is missing.
- `401` if Google verification fails.
- `500` if OAuth or session creation is not configured correctly.

#### `GET /api/auth/me`

Returns the currently authenticated user.

Authentication: session cookie required

Response:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "User Name",
    "role": "SOCIAL_WORKER",
    "status": "APPROVED"
  }
}
```

Errors:

- `401` if not authenticated.

#### `POST /api/auth/logout`

Deletes the current session and clears the session cookie.

Authentication: session cookie optional

Response:

- `204 No Content`

### Media

#### `POST /api/media/upload-signature`

Creates a signed Cloudinary upload payload.

Authentication: session cookie required

Request body:

```json
{
  "purpose": "kyc"
}
```

Supported purpose values:

- `kyc`
- Any other value defaults to authority document uploads.

Response:

```json
{
  "apiKey": "cloudinary-api-key",
  "cloudName": "cloud-name",
  "folder": "uddharsetu/kyc-documents",
  "signature": "signature",
  "timestamp": 1710000000
}
```

Errors:

- `401` if not authenticated.
- `500` if Cloudinary variables are missing.

### KYC

#### `POST /api/kyc`

Submits KYC for the current user.

Authentication: session cookie required

Request body:

```json
{
  "legalName": "Full Legal Name",
  "dateOfBirth": "2000-01-31",
  "governmentIdNumber": "ID-12345",
  "photoUrl": "https://res.cloudinary.com/...",
  "photoPublicId": "uddharsetu/kyc-documents/file",
  "phoneNumber": "9800000000",
  "governmentDocumentUrl": "https://res.cloudinary.com/...",
  "governmentDocumentPublicId": "uddharsetu/kyc-documents/document"
}
```

Response:

```json
{
  "submission": {
    "id": "uuid",
    "status": "PENDING",
    "legalName": "Full Legal Name",
    "phoneNumber": "9800000000",
    "createdAt": "2026-06-01T00:00:00.000Z"
  }
}
```

Errors:

- `401` if not authenticated.
- `400` if required fields are missing or a pending submission already exists.

#### `GET /api/kyc/me`

Returns the latest KYC submission for the current user.

Authentication: session cookie required

Response:

```json
{
  "submission": {
    "id": "uuid",
    "status": "APPROVED",
    "adminNotes": null
  }
}
```

If the user has not submitted KYC:

```json
{
  "submission": null
}
```

### Public Posts

#### `GET /api/posts`

Returns approved public relief posts.

Authentication: public

Response:

```json
{
  "posts": [
    {
      "id": "uuid",
      "authorName": "Worker Name",
      "postType": "HELP",
      "title": "Food support needed",
      "description": "Details about the need",
      "category": "FOOD",
      "urgency": "HIGH",
      "latitude": 27.7172,
      "longitude": 85.324,
      "beneficiaryName": "Beneficiary",
      "beneficiaryPhone": "9800000000",
      "pointOfContactName": "Contact Person",
      "pointOfContactPhone": "9800000001",
      "localRepresentativeName": "Representative",
      "localRepresentativePhone": "9800000002",
      "targetQuantity": 50,
      "targetAmount": null,
      "fulfilledQuantity": 5,
      "fulfilledAmount": 0,
      "imageUrl": "https://res.cloudinary.com/...",
      "authorityDocumentUrl": "https://res.cloudinary.com/...",
      "reviewStatus": "APPROVED",
      "createdAt": "2026-06-01T00:00:00.000Z"
    }
  ]
}
```

### Worker Posts

#### `GET /api/me/posts`

Returns posts created by the current user.

Authentication: session cookie required

Response:

```json
{
  "posts": []
}
```

Errors:

- `401` if not authenticated.

#### `POST /api/posts`

Creates a new help request or fundraising campaign.

Authentication: session cookie required and user status must be `APPROVED`

Request body for material help:

```json
{
  "postType": "HELP",
  "title": "Food support needed",
  "description": "Families need dry food support.",
  "category": "FOOD",
  "urgency": "HIGH",
  "latitude": 27.7172,
  "longitude": 85.324,
  "beneficiaryName": "Beneficiary Name",
  "beneficiaryPhone": "9800000000",
  "pointOfContactName": "Contact Name",
  "pointOfContactPhone": "9800000001",
  "localRepresentativeName": "Representative Name",
  "localRepresentativePhone": "9800000002",
  "targetQuantity": 50,
  "imageUrl": "https://res.cloudinary.com/...",
  "imagePublicId": "uddharsetu/authority-documents/image",
  "authorityDocumentUrl": "https://res.cloudinary.com/...",
  "authorityDocumentPublicId": "uddharsetu/authority-documents/document"
}
```

Request body for fundraising:

```json
{
  "postType": "FUNDRAISING",
  "title": "Medical support fundraiser",
  "description": "Fundraiser for urgent medical expenses.",
  "category": "MEDICAL",
  "urgency": "CRITICAL",
  "latitude": 27.7172,
  "longitude": 85.324,
  "beneficiaryName": "Beneficiary Name",
  "beneficiaryPhone": "9800000000",
  "pointOfContactName": "Contact Name",
  "pointOfContactPhone": "9800000001",
  "localRepresentativeName": "Representative Name",
  "localRepresentativePhone": "9800000002",
  "targetAmount": 100000,
  "imageUrl": "https://res.cloudinary.com/...",
  "imagePublicId": "uddharsetu/authority-documents/image",
  "authorityDocumentUrl": "https://res.cloudinary.com/...",
  "authorityDocumentPublicId": "uddharsetu/authority-documents/document"
}
```

Valid material help categories:

- `FOOD`
- `CLOTHES`
- `VOLUNTEER`
- `OTHER`

Valid fundraising categories:

- `MEDICAL`
- `SUPPLY`
- `OTHER`

Valid urgency values:

- `CRITICAL`
- `HIGH`
- `MEDIUM`

Response:

```json
{
  "post": {
    "id": "uuid",
    "postType": "HELP",
    "reviewStatus": "PENDING"
  }
}
```

Errors:

- `401` if not authenticated.
- `403` if user KYC is not approved.
- `400` if validation fails.

### Admin Review

Admin endpoints require a session user with role `SUPER_ADMIN`.

#### `GET /api/admin/kyc`

Returns pending KYC submissions.

Authentication: admin session required

Response:

```json
{
  "submissions": []
}
```

Errors:

- `403` if the user is not an admin.

#### `POST /api/admin/kyc/:id/review`

Approves or rejects a KYC submission.

Authentication: admin session required

Request body:

```json
{
  "status": "APPROVED",
  "adminNotes": "Verified."
}
```

Valid status values:

- `APPROVED`
- `REJECTED`

Response:

```json
{
  "submission": {
    "id": "uuid",
    "status": "APPROVED"
  }
}
```

Errors:

- `403` if not admin.
- `404` if submission is not found or already reviewed.
- `400` if validation fails.

#### `GET /api/admin/posts`

Returns pending relief posts for review.

Authentication: admin session required

Response:

```json
{
  "posts": []
}
```

#### `POST /api/admin/posts/:id/review`

Approves or rejects a relief post.

Authentication: admin session required

Request body:

```json
{
  "status": "APPROVED",
  "adminNotes": "Proof checked."
}
```

Response:

```json
{
  "post": {
    "id": "uuid",
    "reviewStatus": "APPROVED"
  }
}
```

Errors:

- `403` if not admin.
- `404` if post is not found or already reviewed.
- `400` if validation fails.

### Legacy Help Request Routes

These routes use the older `help_requests` table.

#### `GET /api/help-requests`

Returns open or partially fulfilled legacy help requests.

Authentication: public

Response:

```json
{
  "helpRequests": []
}
```

#### `GET /api/me/help-requests`

Returns legacy help requests created by the current user.

Authentication: session cookie required

Response:

```json
{
  "helpRequests": []
}
```

### Donations

#### `POST /api/donations/initiate`

Starts a Khalti payment for a fundraising campaign.

Authentication: public

Request body:

```json
{
  "postId": "uuid",
  "amount": 500,
  "donorPhone": "9800000000",
  "donorName": "Donor Name"
}
```

Response:

```json
{
  "paymentUrl": "https://...",
  "pidx": "khalti-payment-id",
  "pledgeId": "uuid"
}
```

Errors:

- `404` if the post does not exist.
- `400` if validation fails or Khalti rejects the request.

#### `POST /api/donations/verify`

Verifies a Khalti payment and credits the campaign.

Authentication: public

Request body:

```json
{
  "pidx": "khalti-payment-id"
}
```

Response:

```json
{
  "message": "Payment verified and credited successfully.",
  "status": "Completed",
  "campaignTitle": "Medical support fundraiser",
  "amountNPR": 500
}
```

Errors:

- `404` if the pledge is not found.
- `400` if payment verification fails.

### Material Pledges

#### `POST /api/pledges/material`

Creates and immediately completes a material pledge for a help request.

Authentication: public

Request body:

```json
{
  "postId": "uuid",
  "quantity": 5,
  "donorPhone": "9800000000",
  "donorName": "Supporter Name"
}
```

Response:

```json
{
  "message": "Material support pledged successfully.",
  "pledge": {
    "id": "uuid",
    "post_id": "uuid",
    "pledge_type": "MATERIAL",
    "quantity": 5,
    "donor_name": "Supporter Name",
    "donor_phone": "9800000000",
    "status": "COMPLETED"
  }
}
```

Errors:

- `400` if the request does not accept quantity pledges.
- `400` if the quantity is greater than the remaining need.

## Frontend Routing

Routing is handled in React state inside `client/src/App.tsx`, not by React Router.

Main page states:

- `home`
- `requests`
- `campaigns`
- `worker`
- `kyc`
- `admin`
- `profile`
- `detail`

## Location Behavior

Location behavior is browser-based.

- Post creation uses Leaflet map selection.
- Users can search a location.
- Users can click the map to pin a location.
- Users can use live browser location.
- Public lists sort nearest-first when the visitor grants location access.
- If location is denied or unavailable, the default server order is used.

## Design System

The interface uses a calm relief-operations style:

- Soft cream page backgrounds
- Warm brown typography and accents
- Green trust and completion states
- Restrained cards
- Clear form sections
- Consistent top navigation and footer
- Responsive layouts for public pages, dashboards, and review screens

## Security Notes

- Google ID tokens are verified on the backend.
- Sessions are stored server-side and referenced by an HTTP-only cookie.
- Admin routes check for `SUPER_ADMIN`.
- Worker post creation requires approved KYC status.
- Cloudinary uploads are signed by the backend.
- Khalti payment completion is verified server-side before crediting fundraising progress.
- Material pledges are applied in a database transaction.

## Common Development Commands

```bash
npm install
npm run dev
npm run build
npm run start
```

Workspace-specific commands:

```bash
npm run dev --workspace client
npm run dev --workspace server
npm run build --workspace client
npm run build --workspace server
```

## Troubleshooting

### Google login fails

Check:

- `GOOGLE_CLIENT_ID` in `server/.env`
- `VITE_GOOGLE_CLIENT_ID` in `client/.env`
- Authorized JavaScript origins in Google Cloud Console
- Authorized redirect/origin configuration for local development

### Database connection fails

Check:

- `DATABASE_URL`
- Database network access
- SSL requirements for hosted PostgreSQL providers

### Cloudinary upload fails

Check:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- The user is authenticated before requesting an upload signature

### Khalti payment fails

Check:

- `KHALTI_SECRET_KEY`
- `CLIENT_BASE_URL`
- Khalti test/live environment compatibility
- Donation amount is a positive number

### Admin page is forbidden

The logged-in user must have:

```text
role = SUPER_ADMIN
```

This is stored in the `users` table.

## Current Product Summary

UddharSetu provides a verified loop for public relief coordination:

```text
Google login -> KYC -> admin approval -> post creation -> admin review -> public listing -> pledge or donation -> visible progress
```

The goal is to make disaster-relief requests easier to trust, easier to review, and easier for the public to act on.
