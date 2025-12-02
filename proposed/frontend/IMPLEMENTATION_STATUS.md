# Frontend Implementation Progress

## ✅ COMPLETED

### 1. Project Setup

- ✅ Next.js 14 with TypeScript initialized
- ✅ Tailwind CSS v4 configured
- ✅ shadcn/ui components installed
- ✅ All dependencies installed (zustand, react-query, ethers, etc.)
- ✅ Folder structure created
- ✅ Environment variables configured

### 2. Styling & Theme

- ✅ Custom color palette from Gemini's design (Purple/Blue gradient)
- ✅ Light/dark mode support with CSS variables
- ✅ Custom gradient classes
- ✅ Certificate status row colors

### 3. Type Definitions

- ✅ `types/certificate.ts` - Certificate, IssueCertificateDTO, PaginatedResponse
- ✅ `types/user.ts` - User, RegisterUserDTO
- ✅ `types/auth.ts` - WalletLoginRequest, WalletLoginResponse

### 4. Utility Functions

- ✅ `lib/utils/format.ts` - truncateAddress, truncateHash, formatDate, formatCGPA, copyToClipboard

### 5. API Layer

- ✅ `lib/api/client.ts` - Axios client with interceptors
- ✅ `lib/api/auth.ts` - walletLogin
- ✅ `lib/api/certificates.ts` - getAll (with pagination), issue, verify, revoke, reactivate, getActiveByStudentId, getAllVersions
- ✅ `lib/api/users.ts` - getAll (with pagination), register, revoke, reactivate, grantAdmin, revokeAdmin

### 6. State Management

- ✅ `stores/authStore.ts` - Zustand store with persist, auth state, user fetching

---

## 🚧 IN PROGRESS / TODO

### Critical Next Steps

1. **Blockchain Wallet Integration** (`lib/blockchain/wallet.ts`)

   - Connect to Rabby wallet via window.ethereum
   - Sign messages with ethers.js
   - Handle wallet connection errors

2. **React Query Hooks** (`lib/hooks/`)

   - useCertificates with infinite query
   - useUsers with infinite query
   - useAuth hook

3. **Common Components** (`components/common/`)

   - LoadingSpinner
   - StatusBadge (active/revoked with colors)
   - CopyButton with toast notification
   - EmptyState

4. **Layout Components** (`components/layout/`)

   - Header with navigation, search, user menu
   - Footer with blockchain status
   - Root layout with providers

5. **Landing Page** (`app/page.tsx`)

   - Replicate Gemini's hero section with gradient
   - Features section (3 cards)
   - How it works section
   - Verify certificate input

6. **Login Page** (`app/login/page.tsx`)

   - Wallet connect button
   - Sign message flow
   - Error handling

7. **Dashboard** (`app/dashboard/page.tsx`)

   - Role-based view (user vs admin)
   - Quick action cards
   - Recent activity

8. **Certificate Table** (`components/certificates/CertificateTable.tsx`) **CRITICAL FIX**

   - TanStack Table integration
   - Always-visible toolbar (greyed out)
   - Bulk actions (Revoke/Reactivate) enabled on selection
   - Icon buttons with tooltips
   - Row colors (green for active, red for revoked)
   - Clickable student_id

9. **Certificates Page** (`app/certificates/page.tsx`)

   - Use CertificateTable
   - Infinite scroll / Load More button
   - Filters (active/revoked)

10. **Certificate Detail** (`app/certificates/[hash]/page.tsx`)

    - Beautiful certificate template (separate file)
    - Version history timeline
    - Action buttons (revoke/reactivate)

11. **Issue Certificate Form** (`app/certificates/issue/page.tsx`)

    - React Hook Form + Zod validation
    - Transaction modal with loading
    - Success state with details

12. **User Management Table** (`components/users/UserTable.tsx`) **CRITICAL FIX**

    - TanStack Table integration
    - Always-visible toolbar (greyed out)
    - 4 bulk actions (Revoke/Reactivate/Grant Admin/Revoke Admin)
    - Icon buttons with tooltips
    - Row colors based on status

13. **Users Page** (`app/users/page.tsx`)

    - Admin-only
    - Use UserTable
    - Filters (authorized/revoked/admin)

14. **Register User Form** (`app/users/register/page.tsx`)

    - Admin-only
    - Form with username, email, is_admin checkbox
    - Private key display modal (CRITICAL WARNING)
    - Download/copy private key

15. **Backend Pagination Endpoints**

    - Update `certificate.controller.ts` with pagination
    - Update `users.controller.ts` with pagination
    - Update `TESTING_GUIDE.md` with new endpoints

16. **Mobile Responsiveness**

    - Tables → Card lists on mobile
    - Fixed bottom toolbar
    - Hamburger menu

17. **Polish & Animations**
    - Framer Motion transitions
    - Loading skeletons
    - Hover effects

---

## 📝 INSTRUCTIONS FOR CONTINUATION

### File Structure Reference

```
frontend/
├── app/
│   ├── layout.tsx                 # Root layout (add providers)
│   ├── page.tsx                   # Landing page
│   ├── login/page.tsx             # Wallet login
│   ├── dashboard/page.tsx         # User dashboard
│   ├── certificates/
│   │   ├── page.tsx               # List all certificates
│   │   ├── issue/page.tsx         # Issue form
│   │   ├── [hash]/page.tsx        # Certificate detail
│   │   └── student/[studentId]/page.tsx  # Student versions
│   └── users/
│       ├── page.tsx               # User management (admin)
│       └── register/page.tsx      # Register user (admin)
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── certificates/
│   │   ├── CertificateTable.tsx   # TanStack Table with toolbar
│   │   └── CertificateTemplate.tsx  # Separate template file
│   ├── users/
│   │   └── UserTable.tsx          # TanStack Table with toolbar
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── StatusBadge.tsx
│       └── CopyButton.tsx
├── lib/
│   ├── api/                       # ✅ DONE
│   ├── blockchain/
│   │   └── wallet.ts              # TODO: ethers.js wallet connection
│   ├── hooks/
│   │   ├── useCertificates.ts     # TODO: React Query infinite
│   │   └── useUsers.ts            # TODO: React Query infinite
│   └── utils/                     # ✅ DONE
├── stores/                        # ✅ DONE (auth)
└── types/                         # ✅ DONE
```

### Key Implementation Notes

1. **Toolbar Pattern (CRITICAL)**:

   ```tsx
   // Always visible, grayed out when nothing selected
   <div className="flex gap-2 mb-4">
     <TooltipProvider>
       <Tooltip>
         <TooltipTrigger asChild>
           <Button
             disabled={selectedRows.length === 0}
             onClick={handleBulkRevoke}
           >
             <Ban className="h-4 w-4" />
           </Button>
         </TooltipTrigger>
         <TooltipContent>
           Revoke Selected ({selectedRows.length})
         </TooltipContent>
       </Tooltip>
     </TooltipProvider>
   </div>
   ```

2. **TanStack Table**:

   - Use `@tanstack/react-table`
   - Enable row selection
   - Built-in sorting
   - Use shadcn's Table components for UI

3. **Infinite Scroll**:

   ```tsx
   const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
     queryKey: ["certificates"],
     queryFn: ({ pageParam = 1 }) => certificatesAPI.getAll(pageParam, 20),
     getNextPageParam: (lastPage) =>
       lastPage.meta.has_more ? lastPage.meta.current_page + 1 : undefined,
   });

   // Intersection Observer for auto-load
   <div ref={loadMoreRef}>
     {hasNextPage && <Button onClick={fetchNextPage}>Load More</Button>}
   </div>;
   ```

4. **Color Coding**:
   - Active certificates: `className="row-active"`
   - Revoked certificates: `className="row-revoked"`
   - Success badge: `<Badge variant="outline" className="cert-active">Active</Badge>`
   - Danger badge: `<Badge variant="outline" className="cert-revoked">Revoked</Badge>`

---

## 🔧 BACKEND CHANGES NEEDED

### 1. Add Pagination to Certificate Controller

**File**: `proposed/backend/src/blockchain/blockchain.controller.ts`

```typescript
@Get('/certificates')
async getAllCertificates(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 20,
  @Query('status') status?: 'active' | 'revoked',
) {
  const allCerts = await this.blockchainService.getAllCertificates();

  // Filter by status if provided
  const filtered = status
    ? allCerts.filter(c => status === 'active' ? !c.is_revoked : c.is_revoked)
    : allCerts;

  // Paginate
  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const data = filtered.slice(start, end);

  return {
    data,
    meta: {
      current_page: page,
      total_pages: Math.ceil(total / limit),
      total_count: total,
      has_more: end < total,
    },
  };
}
```

### 2. Add Pagination to User Controller

Same pattern for users endpoint.

### 3. Update TESTING_GUIDE.md

Add new response format examples with pagination meta.

---

## 🎨 DESIGN ASSETS FROM GEMINI

Located in `/proposed/frontend/inspo/`:

- `landing.html` - Hero, features, gradient backgrounds
- `login.html` - Wallet connect UI
- `dashboard.html` - Quick actions, recent activity
- `cert-details.html` - Beautiful certificate template
- `admin.html` - User management table

Extract colors, spacing, component designs from these files.

---

## 🚀 READY TO CONTINUE

The foundation is solid. Next steps:

1. Create blockchain wallet utilities
2. Build React Query hooks
3. Build common components
4. Build layout (Header/Footer)
5. Build pages one by one, starting with landing page
6. Fix toolbar issues in tables
7. Add backend pagination
8. Polish and test

All the hard setup work is done. Now it's systematic implementation of each component!
