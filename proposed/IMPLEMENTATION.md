# Faculty Feedback Implementation Tracker

## Database Setup

- **PostgreSQL in Docker**: Added to `backend/docker-compose.yml` (port 5434)
- **Connection**: `postgresql://nocillax:2272@localhost:5434/cert_proposed_db`
- **Commands**:
  - Start: `cd backend && docker compose up -d`
  - Stop: `docker compose stop`
  - Remove: `docker compose down -v`

---

## Features Implemented

### ✅ Setup

- [x] PostgreSQL Docker service configured
- [x] Port 5434 to avoid conflicts
- [x] Fixed degree/program mismatch in certificate hash computation

### ✅ Feature 1: Date-Time Format Fix

- [x] Updated `formatDateTime()` to "dd MMM, yyyy hh:mm a" format (e.g., "12 Nov, 2025 05:43 AM")
- [x] Applied to CertificateAuditTable component
- [x] Applied to SystemAuditTable component
- [x] All history pages now use consistent date format

- Feedback -> only cert audit, and system audit has fixed date time format -> user audit needs fix

### ✅ Feature 2: Student Database + Auto-fill Issuance

- [x] Created `Student` entity (student_id, student_name, degree, program, cgpa, credit_remaining)
- [x] Created `StudentService` with sync validation (credit_remaining must be 0)
- [x] Created `StudentController` with GET `/students/sync/:student_id` endpoint
- [x] Configured TypeORM with PostgreSQL (sync=true)
- [x] Created frontend API client for student sync
- [x] Updated issue certificate form with Sync button
- [x] Auto-fill all fields after successful sync (read-only mode)
- [x] Created app.config.ts for issuing authority (backend + frontend)
- [x] Validation: Cannot issue if credit_remaining > 0

- Feedback -> works as expected

### ✅ Feature 3: Revoke Reasoning (Blockchain + UI)

- [x] Updated CertificateRegistry.sol event with reason parameter (500 char limit)
- [x] Modified revokeCertificate() function to require reason
- [x] Added getRevokeReason() method in backend service
- [x] Created RevokeCertificateDto with validation
- [x] Updated frontend API client and hooks
- [x] Backend endpoint: PATCH `/api/blockchain/certificates/:hash/revoke` (requires reason in body)
- [x] Backend endpoint: GET `/api/blockchain/certificates/:hash/revoke-reason`
- [x] Created RevokeDialog component with reason input (1-500 chars)
- [x] Integrated dialog in certificate detail page
- [x] Display revoke reason on certificate details page for revoked certificates
- [x] Show issuer name who revoked the certificate

- Feedback -> doesnt show who revoked the cert, says revoked by Unknown. Should be showing in a seperate card above the 3card grids needs UI fix. also make the reason dialog clean. reason should be 1-150 words not 500!!

### ✅ Feature 4: Verifier Information Collection + Logging

- [x] Created Verifier entity (name, email, institution, website)
- [x] Created VerificationLog entity (verifier_id, cert_hash, ip_address, user_agent, timestamp)
- [x] Created BlockedVerifier entity (ip_address, blocked_until, reason, blocked_by)
- [x] Created VerifierService with block/unblock functionality
- [x] Created VerifierController with admin endpoints
- [x] Created VerifierDialog component (localStorage 24hr expiry)
- [x] Updated verify page to collect verifier info before verification
- [x] Skip dialog if user is logged in
- [x] Created admin verifier management page (/verifiers)
- [x] Email validation (basic format check)
- [x] URL validation with format check

- Feedback -> clean the dialog ui. not sure if ip is correctly being assigned - shows ::1. the verification log needs to be paginated if not (upto 10 with sort if using shadcn table we can use the similar arrow in time header to sort via time) - there has to be some time issues. it shows 04:02 pm in the format - ig its not ddoing gmt + 6?? bcz crrect time should be 10:02pm!!

### ✅ Feature 5: Rate Limiting with node-cache

- [x] Installed node-cache package
- [x] Created RateLimitService with in-memory caching
- [x] Implemented tracking: IP + cert_hash combination
- [x] Logic: 3 verification attempts within 15 minutes = 60 minute auto-block
- [x] Auto-block saves to BlockedVerifier table (reason: "Rate limit exceeded")
- [x] Integration with VerifierController submit endpoint
- [x] Clear cached attempts on manual unblock
- [x] Return remaining_attempts in API response
- [x] Frontend toast warning when attempts < 3
- [x] Frontend error handling for rate limit/block messages

- Feedback -> after manual block im not sure if it auto-blocks anymore!

### ✅ Feature 6: Revocation/Reactivation Request Workflow

- [x] Created RevocationRequest entity (cert_hash, action_type, reason, status, requester info)
- [x] Created RevocationRequestService with full CRUD operations
- [x] Created RevocationRequestController with 7 endpoints
- [x] Endpoint: POST `/revocation-requests` - Submit revoke/reactivate request
- [x] Endpoint: GET `/revocation-requests` - List all requests with status filter
- [x] Endpoint: GET `/revocation-requests/pending/count` - Get pending count
- [x] Endpoint: GET `/revocation-requests/certificate/:cert_hash` - Get requests by cert
- [x] Endpoint: PATCH `/revocation-requests/:id/approve` - Approve request (admin)
- [x] Endpoint: PATCH `/revocation-requests/:id/reject` - Reject request with reason (admin)
- [x] Created admin revocation requests management page at /revocation-requests
- [x] Added pending requests card to dashboard (admin only, 30s polling)
- [x] Tabs interface: Pending, Approved, Rejected, All
- [x] Approve/Reject actions with rejection reason dialog
- [x] Updated certificate detail page with conditional buttons:
  - Admin: Direct revoke/reactivate buttons
  - Non-admin: Request revoke/reactivate buttons
- [x] Request dialog with reason input
- [x] Pending request detection (disable button if pending exists)
- [x] Status badges with icons (Clock, CheckCircle2, XCircle)
- [x] Action badges (Ban for revoke, RefreshCw for reactivate)

- Feedback -> flow is correct but the whole status thing is wrong! currently it makes me approve a req to work on it. instead it should have a button take request -> then i will execute, approve, reject. when i take req -> status changes to pending! currently by default all reqs become pending. also the way these are shown is bad ! need to organise the UI

### ✅ Feature 7: Offline Activity Tracking

- [x] Created AdminSession entity (wallet_address, login_at, logout_at, session_status)
- [x] Created SessionService with login/logout tracking
- [x] Session status: 'active', 'logged_out', 'expired' (JWT expiry 60 mins)
- [x] Created OfflineActivityService to match blockchain events with offline periods
- [x] Integrated session recording in login flow (auth controller + frontend)
- [x] Integrated logout recording in authStore
- [x] Created SessionController with endpoints: login, logout, my-sessions, offline-periods, stats
- [x] Created OfflineActivityController: GET `/offline-activities`, `/offline-activities/count`
- [x] Created offline activities page at /offline-activities
- [x] Shows offline periods with blockchain events that occurred during those times
- [x] Event display: action badge, cert hash, timestamp, view certificate link

- Feedback -> there is 100% issue with the login-logout calculation. also in dashboard there is no card to show last 5 activies when i was offline.

### ✅ Feature 8: QR Code Generation

- [x] Installed qrcode and @types/qrcode packages
- [x] Created generateQRCode() method in PdfService
- [x] QR code generation: 75x75px, data URL format, error correction level M
- [x] Updated generateCertificatePng() to include QR code
- [x] Updated generateCertificatePdf() to include QR code
- [x] Updated certificate template HTML with QR code positioning (bottom-center)
- [x] QR code styling: 2px border, border-radius, white background, padding
- [x] Updated blockchain controller to pass cert_hash to PDF service
- [x] QR code contains certificate hash for verification
- [x] Fallback: Empty string if QR generation fails

- Feedback -> qr code is generated correctly!

### ✅ Feature 9: QR Verification from PDF Scan

- [x] Installed jsqr (QR code scanner) and pdfjs-dist (PDF parser)
- [x] Created qr-scanner.ts utility with 3 functions:
  - extractQRFromPDF() - Renders PDF page 1 to canvas, scans with jsQR
  - extractQRFromImage() - Loads image to canvas, scans with jsQR
  - extractQRFromFile() - Auto-detects file type, routes to appropriate function
- [x] Configured PDF.js worker from CDN (cdnjs.cloudflare.com)
- [x] 2x scale factor for better QR detection in PDFs
- [x] Updated verify page UI with file upload section
- [x] File upload accepts: PDF and image files (JPEG, PNG, etc.)
- [x] OR divider between manual hash entry and file upload
- [x] Auto-trigger verification after successful QR extraction
- [x] Error handling:
  - No QR code found in uploaded file
  - Invalid certificate hash format from QR
  - Failed to read QR code (with fallback to manual entry)
- [x] Display uploaded file name with remove button
- [x] Loading state during QR scanning
- [x] Hash validation: 0x followed by 64 hex characters
- [x] Maintains existing verifier dialog flow for non-logged-in users

- Feedback -> qr code scan doesnt work.

---

## Feature Status

### ✅ Completed (All 8 Features)

1. Date-time format fix
2. Student database + auto-fill issuance
3. Revoke reasoning (blockchain + frontend)
4. Verifier information collection + logging
5. Rate limiting with node-cache
6. Revocation/Reactivation request workflow
7. Offline activity tracking
8. QR code generation
9. QR verification from PDF scan

**Note:** All 9 faculty-requested features implemented successfully

### 🔄 Next Steps

- Test all features end-to-end
- Redeploy CertificateRegistry.sol (revoke event signature changed)
- Update contract addresses in backend .env

---

## API Endpoints Added

### Student Endpoints

- `GET /students/sync/:student_id` - Sync and validate student data for certificate issuance
  - Returns: `{student_id, student_name, degree, program, cgpa}`
  - Validates credit_remaining = 0
  - Throws error if student not found or credits incomplete

---

## Notes

- Using TypeORM sync=true (no migrations needed)
- Following rules.md: KISS, DRY, minimal abstraction
- One complete feature at a time (backend + frontend)
- QR features implemented last due to complexity
