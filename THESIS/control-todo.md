Complete list of all control system endpoints (16 total):

✅ POST /api/auth/login
✅ POST /api/users (register)
✅ GET /api/users (list all)
✅ GET /api/users/:id (get by ID)
✅ PATCH /api/users/:id/revoke (revoke user)
✅ PATCH /api/users/:id/reactivate (reactivate user)
✅ POST /api/certificates
✅ GET /api/certificates (list all)
✅ GET /api/certificates/:id (JWT required - shows all certs regardless of revocation)
✅ PATCH /api/certificates/:id (update)
✅ PATCH /api/certificates/:id/revoke
✅ PATCH /api/certificates/:id/reactivate
✅ GET /api/certificates/audit-logs (optional ?certificate_id query param)
✅ GET /api/certificates/verify/:student_id (public - only shows active certs)
✅ GET /api/audit-logs (system-wide audit logs)
✅ GET /api/audit-logs/certificate/:id (certificate-specific audit logs)

**Key Changes:**

- Removed: GET /api/certificates/student/:student_id/active (redundant)
- Removed: GET /api/certificates/student/:student_id/versions (no versioning in control system)
- Updated: GET /api/certificates/verify/:student_id now returns 404 for revoked/not found
- Updated: GET /api/certificates/:id now requires JWT authentication
- Fixed: GET /api/audit-logs/certificate/:id now works correctly
