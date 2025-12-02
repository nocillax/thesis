# UI/UX Design Prompt for Blockchain Certificate Management System

## Project Context

You are designing the complete user interface and user experience for a **blockchain-based certificate management system**. This is an academic research project (thesis) that uses Quorum blockchain and smart contracts to issue, verify, and manage educational certificates in a decentralized manner.

---

## System Overview

### What is This System?

A **100% blockchain-powered certificate verification platform** where:

- Educational institutions can issue tamper-proof digital certificates
- Students and external organizations can verify certificates using cryptographic hashes
- All certificate data is stored on-chain (no traditional database)
- Users authenticate using Web3 wallet signatures (no passwords)
- Certificates support versioning (students can have multiple versions of certificates)
- Admin controls user authorization and privileges

### Core Technology Stack

- **Blockchain**: Quorum (private Ethereum-based network)
- **Smart Contracts**: Solidity 0.8.19
- **Authentication**: Web3 wallet signatures (Rabby wallet)
- **Backend**: NestJS with Ethers.js
- **Frontend**: Next.js + Tailwind CSS + shadcn/ui (to be built)

### Key Architectural Features

1. **Meta-transactions**: Admin wallet pays all gas fees, user wallets recorded for accountability
2. **Certificate Versioning**: Each student can have multiple certificate versions (v1, v2, v3...) identified by student_id
3. **UserRegistry Integration**: User data (username, email, authorization status, admin privileges) stored on blockchain
4. **Decentralized Authentication**: Users sign messages with their Ethereum wallet - no passwords
5. **Public Verification**: Anyone can verify certificates without authentication using certificate hash

---

## User Roles & Permissions

### 1. Public Users (Unauthenticated)

- **Can do**:
  - Verify certificates by entering certificate hash
  - Search certificates by student_id
  - View certificate details and version history
- **Cannot do**:
  - Issue, revoke, or reactivate certificates
  - Access user management

### 2. Authorized Users (Authenticated, `is_authorized=true`)

- **Can do**:
  - All public user capabilities
  - Issue new certificates (admin pays gas, their wallet recorded as issuer)
  - Revoke certificates
  - Reactivate certificates
  - Search and view all certificates in system
  - View own profile
- **Cannot do**:
  - Register new users
  - Manage user authorization
  - Grant/revoke admin privileges

### 3. Admin Users (Authenticated, `is_admin=true`)

- **Can do**:
  - All authorized user capabilities
  - Register new users (generates wallet automatically)
  - View all users in system
  - Revoke user authorization
  - Reactivate user authorization
  - Grant admin privileges to users
  - Revoke admin privileges from users (except primary admin)

---

## Design Requirements

### Visual Style

**CRITICAL REQUIREMENTS:**

- ✅ **Clean, modern, elegant, futuristic aesthetic**
- ✅ **Academic credibility** - must look professional and trustworthy
- ✅ **Blockchain-themed** - visual cues that this is a blockchain system (use blockchain/crypto visual elements tastefully)
- ✅ **Colorful and vibrant** - NOT boring corporate blue/gray/white
- ✅ **Modern typography** - clean, readable fonts (NOT Java enterprise software look)
- ✅ **Responsive design** - works on desktop, tablet, mobile

**Color Palette Guidelines:**

- Use vibrant, energetic colors that convey innovation and trust
- Consider: Deep purples, electric blues, bright greens, cyber oranges, neon accents
- Gradients and glass morphism effects encouraged
- High contrast for accessibility
- Color-coded status indicators (green for active/authorized, red for inactive/revoked)

**Typography:**

- Modern sans-serif fonts (e.g., Inter, Poppins, Space Grotesk, Manrope)
- Clear hierarchy (headings, body, captions)
- Monospace fonts for technical data (wallet addresses, certificate hashes, transaction hashes)

**Visual Elements:**

- Blockchain-inspired icons (chain links, blocks, nodes, cryptographic symbols)
- Subtle animations and transitions
- Cards with shadows/borders for content grouping
- Glass morphism or neumorphism where appropriate
- Visual feedback for loading states and blockchain transactions

---

## Page-by-Page Design Specifications

### Global Components

#### 1. Header (All Pages)

**Unauthenticated State:**

- Logo (left): "CertChain" or similar blockchain-themed name with icon
- Navigation links (center): Home | Verify Certificate | Search
- Login button (right): "Connect Wallet" with wallet icon

**Authenticated State:**

- Logo (left): Same as above
- Navigation links (center):
  - For Authorized Users: Issue Certificate | All Certificates | Verify | Search
  - For Admins: + User Management
- Search bar (center-right): Search by student_id with icon
- User menu (right):
  - Avatar icon (generic but colorful, could use blockchain-themed avatar like wallet address → unique pattern)
  - Username displayed next to avatar
  - Dropdown on click:
    - Header: Username + Email
    - "My Profile" option
    - "Sign Out" option

**Design Notes:**

- Sticky header that remains visible on scroll
- Subtle shadow or border at bottom
- Background: Semi-transparent or solid depending on theme
- Smooth transitions when switching between authenticated/unauthenticated

#### 2. Footer (All Pages)

**Content:**

- Copyright notice: "© 2025 CertChain. Powered by Quorum Blockchain."
- Links: About | Documentation | GitHub Repository
- Smart contract addresses (collapsed by default, expandable):
  - CertificateRegistry: 0xa1dc9167B1a8F201d15b48BdD5D77f8360845ceD
  - UserRegistry: 0xECB550dE5c73e6690AB4521C03EC9D476617167E
- Blockchain status indicator: "🟢 Network Online" or "🔴 Network Offline"

**Design Notes:**

- Minimal, unobtrusive
- Dark background with light text or vice versa depending on theme
- Links have hover effects

---

### Page 1: Landing Page (/)

**Purpose**: Welcome users and provide quick certificate verification access

**Hero Section:**

- Large heading: "Blockchain-Powered Certificate Verification"
- Subheading: "Immutable. Transparent. Trustless."
- Blockchain-themed illustration or animation (abstract chain, blocks, nodes)
- Primary CTA: Large search/input field for certificate hash with "Verify Now" button
- Secondary CTA: "Learn More" button scrolling to features section

**Features Section (Below Hero):**
Three feature cards side-by-side:

1. **Immutability Icon**: "Tamper-Proof Certificates"
   - Description: "Once issued, certificates cannot be altered or deleted"
2. **Transparency Icon**: "Public Verification"
   - Description: "Anyone can verify certificates without creating an account"
3. **Decentralization Icon**: "Blockchain Security"
   - Description: "Data stored across multiple nodes, no single point of failure"

**How It Works Section:**
Timeline or step-by-step visual:

1. Institution issues certificate → Blockchain transaction
2. Certificate hash generated → Stored on-chain
3. Student receives certificate → Can share hash
4. Anyone verifies → Public blockchain query

**Statistics Section (Optional):**

- Total Certificates Issued (dynamic from blockchain)
- Total Users Registered
- Total Transactions
- Network Uptime

**Footer**: Standard footer

**Design Notes:**

- Modern landing page with smooth scroll animations
- Gradient backgrounds or glass morphism effects
- Blockchain visual elements (hexagons, nodes, chains) as decorative graphics
- Responsive design for mobile

---

### Page 2: Wallet Login (/login)

**Content:**

- Centered card on clean background
- Heading: "Connect Your Wallet"
- Subheading: "Sign in securely using your Ethereum wallet"
- Wallet icon (large, colorful)
- "Connect Wallet" button (primary CTA)
- Instructions:
  - "1. Click 'Connect Wallet' button"
  - "2. Select your wallet (Rabby recommended)"
  - "3. Approve connection request"
  - "4. Sign the login message"
- Link: "Don't have a wallet? Contact your administrator"

**After Wallet Connected (Before Signature):**

- Show connected wallet address (truncated with copy button)
- "Sign Message" button
- Message to be signed displayed in code block:
  ```
  Login to Certificate System at 2025-11-29T12:30:00Z
  ```

**After Signature:**

- Loading spinner: "Verifying signature..."
- Success: Redirect to dashboard or appropriate page

**Error States:**

- Wallet not detected: "No wallet extension found. Please install Rabby wallet."
- Wrong network: "Please switch to Quorum network in your wallet."
- Signature rejected: "Signature rejected. Please try again."
- User not registered: "Wallet not registered in system. Contact administrator."

**Design Notes:**

- Clean, minimal design focused on wallet connection flow
- Large, clear buttons
- Visual feedback at each step (connecting → connected → signing → signed)
- Friendly error messages with actionable instructions

---

### Page 3: User Dashboard (After Login)

**Different Dashboard Views Based on Role:**

#### For Authorized Users:

- Welcome message: "Welcome back, [Username]!"
- Quick action cards:
  - Issue New Certificate (icon + text) → Links to /issue
  - Verify Certificate (icon + text) → Links to /verify
  - All Certificates (icon + text) → Links to /certificates
- Recent activity section:
  - Last 5 certificates issued by this user
  - Displayed as table with: student_id, student_name, version, date, status

#### For Admin Users:

- Same as authorized users PLUS:
- Admin quick action cards:
  - Register New User → Links to /register
  - Manage Users → Links to /users
- System statistics:
  - Total Users: X
  - Authorized Users: Y
  - Total Certificates: Z
  - Active Certificates: W

**Design Notes:**

- Card-based layout with hover effects
- Icons for each action (colorful, blockchain-themed)
- Smooth page transitions
- Loading skeletons while fetching data

---

### Page 4: Issue Certificate (/issue)

**Layout:**

- Page heading: "Issue New Certificate"
- Form in centered card:

**Form Fields:**

1. Student ID (required)
   - Input field with validation
   - Helper text: "Unique student identifier (e.g., 22-46734-1)"
2. Student Name (required)
   - Input field with validation
3. Degree Program (required)
   - Input field with validation
   - Examples: "Computer Science", "Business Administration"
4. CGPA (required)
   - Number input (0.00 - 4.00)
   - Helper text: "Grade point average (e.g., 3.85)"
5. Issuing Authority (required)
   - Input field with validation
   - Examples: "Tech University", "Engineering Department"

**Action Buttons:**

- Submit button: "Issue Certificate" (primary, large)
- Cancel button: "Cancel" (secondary)

**Important Notice (Above Form):**

- Warning box (yellow/orange):
  - "⚠️ Important: If student already has an active certificate, you must revoke it before issuing a new version."
  - "Check student's certificates" button → Search by student_id

**Loading State (After Submit):**

- Modal overlay with:
  - Spinner animation
  - "Submitting transaction to blockchain..."
  - "This may take 5-15 seconds"
  - Progress indicator (optional)

**Success State:**

- Success modal with:
  - ✅ "Certificate Issued Successfully!"
  - Certificate details displayed:
    - Student ID
    - Version: v2 (or whatever version)
    - Certificate Hash: 0xabcd... (with copy button)
    - Transaction Hash: 0x5678... (with copy button and blockchain explorer link)
    - Block Number: 123
  - Action buttons:
    - "View Certificate" → Links to certificate detail page
    - "Issue Another" → Clears form
    - "Back to Dashboard"

**Error States:**

- Student already has active certificate → Show error with "Revoke active certificate first" message and link to student's certificates
- User not authorized → Redirect to login
- Transaction failed → Show error details with "Try Again" button
- Network error → "Blockchain network unavailable. Please check your connection."

**Design Notes:**

- Clean form design with clear labels
- Inline validation (field turns red/green as user types)
- Helpful placeholder text in each field
- Blockchain transaction status clearly communicated
- Success state feels rewarding (animation, clear visual feedback)

---

### Page 5: All Certificates (/certificates)

**Layout:**

- Page heading: "All Certificates"
- Toolbar (above table):
  - Bulk actions:
    - "Revoke Selected" button (disabled unless checkboxes selected)
    - "Reactivate Selected" button (disabled unless checkboxes selected)
  - Filter dropdown: "Status: All | Active Only | Revoked Only"
  - Sort dropdown: "Sort by: Latest First | Oldest First | Student ID"
- Data table:

**Table Columns:**

1. Checkbox (left):
   - Header: Checkbox (select all / deselect all)
   - Rows: Individual checkboxes
2. Student ID:
   - Clickable → Links to student's certificates page
   - Primary column (bold or highlighted)
3. Student Name:
   - Regular text
4. Degree Program:
   - Regular text
5. Version:
   - Badge format: "v1", "v2", "v3"
6. Issue Date:
   - Human-readable format: "Nov 27, 2025"
7. Status:
   - Visual indicator:
     - 🟢 Active (deep green background badge)
     - 🔴 Revoked (deep red background badge)
8. Actions (right):
   - "View" button → Links to certificate detail page
   - "..." menu for Revoke/Reactivate

**Visual Design:**

- Row coloring:
  - Active certificates: Subtle green tint (light green background)
  - Revoked certificates: Subtle red tint (light red background)
- Hover effect on rows
- Pagination controls at bottom (if many certificates)
- Loading skeleton while fetching data

**Empty State:**

- Icon + message: "No certificates found"
- "Issue your first certificate" button

**Design Notes:**

- Clean, modern table design (not boring Excel-style)
- Clear visual distinction between active and revoked
- Bulk actions only appear when checkboxes selected
- Responsive: On mobile, table becomes card list

---

### Page 6: Certificate Detail Page (/certificates/:hash)

**Layout:**

**Option A: Certificate Template Display**
Design a clean certificate template with:

- Decorative border (academic/professional style)
- University logo placeholder area
- Certificate title: "Certificate of Completion"
- Body text: "This is to certify that [Student Name] has successfully completed [Degree Program] with a CGPA of [3.85]"
- Issued by: [Issuing Authority]
- Issuer: [Issuer Name] ([Issuer Wallet])
- Issue date: [Date]
- Certificate hash displayed at bottom (small, monospace)
- Blockchain verification badge: "✅ Verified on Blockchain"

**Option B: Field-by-Field Display**

- Card layout with sections:
  - **Student Information**:
    - Student ID: 22-46734-1
    - Student Name: Alice Johnson
    - Degree Program: Computer Science
    - CGPA: 3.85
  - **Certificate Information**:
    - Version: v2
    - Certificate Hash: 0xabcd... (with copy button)
    - Issuing Authority: Tech University
    - Issuer: john_doe (0x08Bd...) (with copy button)
    - Issue Date: Nov 27, 2025
    - Status: 🟢 Active or 🔴 Revoked
  - **Blockchain Verification**:
    - Transaction Hash: 0x5678... (with copy and explorer link)
    - Block Number: 123
    - Signature: 0x9abc... (truncated with copy button)

**Version History Section (If Multiple Versions):**

- Timeline view:
  - v3 (Active) - Nov 29, 2025
  - v2 (Revoked) - Nov 27, 2025
  - v1 (Revoked) - Nov 20, 2025
- Each version clickable to view full details

**Action Buttons (If User is Authorized):**

- "Revoke Certificate" button (if active)
- "Reactivate Certificate" button (if revoked and no other version active)
- "Download as PDF" button (future feature)

**Design Notes:**

- Choose Option A for formal certificate feel OR Option B for developer/technical feel
- Option A recommended for thesis demonstration (looks more official)
- Clear blockchain verification indicators
- Version history shows progression clearly

---

### Page 7: Search by Student ID (/search/:student_id)

**Layout:**

- Page heading: "Certificates for Student: [student_id]"
- Active certificate section (top):
  - Large card highlighting active certificate
  - Clear "ACTIVE" badge
  - Main certificate details displayed
  - "View Full Details" button
- All versions section (below):
  - Similar table format to "All Certificates" page
  - Only shows certificates for this student
  - Sorted by version (descending): v3, v2, v1
  - Visual distinction (green tint for active, red tint for revoked)

**Empty State:**

- "No certificates found for student ID: [student_id]"
- "Issue certificate" button (if user is authorized)

**Design Notes:**

- Active certificate visually prominent (larger, highlighted)
- Version history chronological
- Easy navigation back to all certificates

---

### Page 8: Verify Certificate (Public) (/verify)

**Layout:**

- Page heading: "Verify Certificate"
- Centered card with:
  - Input field: "Enter Certificate Hash"
  - Placeholder: "0xabcd1234..."
  - "Verify" button (primary, large)
  - Helper text: "Certificate hash can be found on the certificate document"

**Loading State (After Submit):**

- Spinner: "Verifying certificate on blockchain..."

**Success State (Certificate Found):**

- Display certificate details (similar to Certificate Detail Page)
- Large verification badge: "✅ VALID CERTIFICATE"
- All certificate information displayed
- Blockchain verification section (transaction hash, block number)

**Error State (Certificate Not Found):**

- Warning message: "❌ Certificate Not Found"
- "This certificate hash does not exist on the blockchain"
- "Please verify the hash and try again"

**Error State (Certificate Revoked):**

- Warning message: "⚠️ Certificate Revoked"
- "This certificate has been revoked and is no longer valid"
- Display certificate details but with clear revoked status
- Show revocation details (who revoked, when)

**Design Notes:**

- Simple, focused interface
- Large verification result (valid/invalid/revoked)
- Clear visual distinction between states (green for valid, red for invalid/revoked)
- Public page (no login required)

---

### Page 9: User Management (Admin Only) (/users)

**Layout:**

- Page heading: "User Management"
- Toolbar (above table):
  - "Register New User" button (primary CTA, top right)
  - Bulk actions:
    - "Revoke Selected" button
    - "Reactivate Selected" button
    - "Grant Admin" button
    - "Revoke Admin" button
  - Filter dropdown: "Status: All | Authorized Only | Revoked Only | Admins Only"

**User Table:**

**Table Columns:**

1. Checkbox (left):
   - Header: Select all / deselect all
   - Rows: Individual checkboxes
2. Wallet Address:
   - Truncated display: "0x08Bd...c733"
   - Copy button on hover
   - Monospace font
3. Username:
   - Regular text
   - Primary identifier
4. Email:
   - Regular text
5. Registration Date:
   - Human-readable: "Nov 27, 2025"
6. Status:
   - Badge format:
     - 🟢 Authorized (green)
     - 🔴 Revoked (red)
7. Role:
   - Badge format:
     - 👑 Admin (gold/yellow)
     - 👤 User (blue/gray)
8. Actions (right):
   - "..." dropdown menu:
     - View Profile
     - Revoke / Reactivate
     - Grant Admin / Revoke Admin

**Visual Design:**

- Row coloring:
  - Authorized users: Subtle green tint
  - Revoked users: Subtle red tint
  - Admin users: Subtle gold/yellow tint or crown icon
- Hover effects on rows
- Pagination controls

**Empty State:**

- "No users found"
- "Register first user" button

**Design Notes:**

- Similar table design to certificates table
- Clear visual indicators for authorization and admin status
- Bulk actions appear when checkboxes selected
- Cannot revoke primary admin (button disabled with tooltip)

---

### Page 10: Register New User (Admin Only) (/register)

**Layout:**

- Page heading: "Register New User"
- Form in centered card:

**Form Fields:**

1. Username (required):
   - Input field with validation
   - Helper text: "Alphanumeric, 3-30 characters"
2. Email (required):
   - Email input with validation
   - Helper text: "Must be unique in system"
3. Admin Privileges:
   - Checkbox: "Grant admin privileges"
   - Helper text: "Admin users can register and manage other users"

**Important Notice (Above Form):**

- Info box (blue):
  - "ℹ️ A new Ethereum wallet will be automatically generated for this user."
  - "The user must import the private key into their wallet app (Rabby recommended)."

**Action Buttons:**

- Submit button: "Register User" (primary, large)
- Cancel button: "Cancel"

**Loading State:**

- Modal: "Generating wallet and registering on blockchain..."
- "This may take 5-15 seconds"

**Success State:**

- Success modal with:
  - ✅ "User Registered Successfully!"
  - **CRITICAL**: Private key display:
    - Large warning: "⚠️ SAVE THIS PRIVATE KEY - IT WILL NOT BE SHOWN AGAIN"
    - Private key in code block (with copy button): 0xDEF456...
    - Wallet address (with copy button): 0xABC123...
  - User details:
    - Username
    - Email
    - Admin status
  - Transaction details:
    - Transaction Hash (with explorer link)
    - Block Number
  - Action buttons:
    - "Copy Private Key" (primary)
    - "Download as Text File"
    - "Register Another User"
    - "Back to User Management"

**Error States:**

- Email already exists → "This email is already registered"
- Transaction failed → Show error with "Try Again" button
- Network error → "Blockchain network unavailable"

**Design Notes:**

- Form validation prevents submission until all fields valid
- Private key display VERY prominent (cannot be missed)
- Multiple ways to save private key (copy, download)
- Security warning emphasized

---

### Page 11: My Profile (/profile)

**Layout:**

- Page heading: "My Profile"
- Profile card:

**Profile Information:**

- Avatar (blockchain-themed pattern based on wallet address)
- Username
- Email
- Wallet Address (full, with copy button)
- Registration Date
- Authorization Status:
  - Badge: 🟢 Authorized or 🔴 Revoked
- Role:
  - Badge: 👑 Admin or 👤 User

**Statistics (If Available):**

- Certificates Issued by Me: X
- Last Activity: [Date]

**Action Button:**

- "Sign Out" button (secondary)

**Design Notes:**

- Clean, simple profile view
- No edit functionality (user data is on blockchain, cannot be changed by user)
- Only admin can change authorization status

---

## Responsive Design Considerations

### Desktop (1280px+)

- Full sidebar navigation (if applicable)
- Multi-column layouts
- Tables display all columns

### Tablet (768px - 1279px)

- Collapsed sidebar or top navigation
- Two-column layouts where possible
- Tables may hide less important columns

### Mobile (< 768px)

- Hamburger menu navigation
- Single column layouts
- Tables become card lists:
  - Each row becomes a card
  - Key info displayed, "View More" expands full details
- Sticky "Connect Wallet" or user menu at bottom

---

## Loading States & Animations

### Global Loading Patterns

1. **Page Load:**

   - Skeleton screens for content areas
   - Pulsing animation on skeletons
   - Smooth fade-in when data loads

2. **Blockchain Transaction:**

   - Modal overlay with spinner
   - Progress message: "Submitting to blockchain..."
   - Animated blockchain visualization (blocks connecting, etc.)
   - Success animation when complete (checkmark, confetti, etc.)

3. **Button States:**

   - Default → Hover (slight scale up, color change)
   - Click → Loading spinner inside button
   - Success → Checkmark icon briefly
   - Error → Shake animation

4. **Form Validation:**
   - Real-time validation (field border changes color)
   - Error messages slide in below field
   - Success checkmarks appear next to valid fields

---

## Error Handling & User Feedback

### Error Types & Displays

1. **Network Errors:**

   - Toast notification (top right): "Network error. Please try again."
   - Retry button in notification

2. **Validation Errors:**

   - Inline below form fields
   - Red border around invalid field
   - Clear error message (e.g., "Email is required")

3. **Blockchain Errors:**

   - Modal overlay with error details
   - User-friendly message + technical details (collapsible)
   - "Try Again" and "Cancel" buttons

4. **Authorization Errors:**
   - Full-page message: "You are not authorized to view this page"
   - "Contact administrator" button
   - Automatic redirect to login

### Success Feedback

1. **Toast Notifications:**

   - Green toast (top right) for successful actions
   - Auto-dismiss after 5 seconds
   - Examples: "Certificate issued successfully!", "User registered!"

2. **Success Modals:**

   - For critical actions (certificate issuance, user registration)
   - Large checkmark animation
   - Detailed success information
   - Next action buttons

3. **Inline Success:**
   - Green checkmarks next to completed form fields
   - Status badges change color when action completes

---

## Accessibility Requirements

1. **Keyboard Navigation:**

   - All interactive elements accessible via Tab
   - Clear focus indicators (outline or highlight)
   - Logical tab order

2. **Screen Reader Support:**

   - Proper ARIA labels on all interactive elements
   - Alt text for all images/icons
   - Semantic HTML (headings, lists, etc.)

3. **Color Contrast:**

   - WCAG AA compliance minimum
   - Text readable on all backgrounds
   - Don't rely solely on color for status (use icons + text)

4. **Font Sizes:**
   - Minimum 16px for body text
   - Scalable fonts (rem units, not px)
   - Clear visual hierarchy

---

## Additional Design Elements

### Blockchain Visual Cues

- Chain link icons for navigation
- Block/hexagon patterns in backgrounds
- Cryptographic hash displays (monospace font, truncation with "...")
- Transaction status indicators (pending → confirmed)
- Network status indicator in footer (online/offline)

### Micro-interactions

- Hover effects on cards (slight lift, shadow increase)
- Button press animations (scale down slightly)
- Copy-to-clipboard feedback (tooltip: "Copied!")
- Loading spinners that match brand colors
- Smooth page transitions

### Empty States

- Friendly illustrations (blockchain-themed)
- Clear call-to-action ("Issue your first certificate")
- Helpful text explaining what should appear here

---

## Technical Constraints for Design

1. **Wallet Addresses:**

   - Always displayed in monospace font
   - Truncated for space: "0x08Bd...c733"
   - Copy button always available
   - Full address visible on hover or click

2. **Certificate Hashes:**

   - Same treatment as wallet addresses
   - Prominently displayed (primary identifier)
   - Link to blockchain explorer if possible

3. **CGPA Display:**

   - Backend sends as integer (385)
   - Frontend displays as decimal (3.85)
   - Validation: 0.00 - 4.00

4. **Dates:**

   - Backend sends as ISO string
   - Frontend displays human-readable: "Nov 27, 2025"
   - Relative time for recent items: "2 hours ago"

5. **Transaction Feedback:**
   - Blockchain transactions take 5-15 seconds
   - Always show loading state during this time
   - Clear success/failure feedback after transaction

---

## Design Deliverables Requested

Please provide the following in your response:

### Option 1: Visual Mockups (Preferred)

- High-fidelity UI mockups for each page listed above
- Include desktop and mobile versions for key pages
- Show different states (empty, loading, error, success)
- Specify color palette with hex codes
- Specify typography (font families, sizes, weights)

### Option 2: Detailed Design Specifications

If visual mockups are not possible, provide:

- Comprehensive written descriptions of visual design
- Color palette (hex codes) for all UI elements
- Typography system (fonts, sizes, line heights, weights)
- Spacing system (margins, padding)
- Component library recommendations
- Layout specifications for each page
- Interaction specifications (hover states, animations, transitions)

### Option 3: Figma/Design Tool Export

- If you can generate design files, export as:
  - Figma file (shareable link)
  - Adobe XD file
  - Sketch file
  - Or high-res PNG/SVG exports of all screens

---

## Example API Response Formats (For Design Reference)

### Certificate Object

```json
{
  "cert_hash": "0xabcd1234...",
  "student_id": "22-46734-1",
  "version": 2,
  "student_name": "Alice Johnson",
  "degree_program": "Computer Science",
  "cgpa": 3.85,
  "issuing_authority": "Tech University",
  "issuer": "0x08Bd40C733...",
  "issuer_name": "john_doe",
  "is_revoked": false,
  "signature": "0x9abc...",
  "issuance_date": "2025-11-27T01:28:41.000Z"
}
```

### User Object

```json
{
  "wallet_address": "0x1234...",
  "username": "john_doe",
  "email": "john@university.edu",
  "registration_date": "2025-11-29T12:30:00.000Z",
  "is_authorized": true,
  "is_admin": false
}
```

### Transaction Success Response

```json
{
  "success": true,
  "cert_hash": "0xabcd...",
  "transaction_hash": "0x5678...",
  "block_number": 123,
  "version": 2
}
```

---

## Final Notes for Designer

- **Target Audience**: University administrators, academic staff, students, external organizations
- **Primary Goal**: Make blockchain technology accessible to non-technical users
- **Tone**: Professional yet modern, trustworthy yet innovative
- **Must Avoid**: Looking like boring enterprise software, being too technical/intimidating
- **Must Achieve**: Academic credibility + modern tech aesthetic

This is a thesis project demonstrating blockchain use in education. The UI should impress thesis evaluators while being genuinely usable for real-world certificate management.

Please create a design that balances:

- **Innovation** (blockchain/crypto aesthetic)
- **Trust** (academic professionalism)
- **Usability** (clear, intuitive interface)
- **Delight** (pleasant to use, not boring)

Thank you for your creative vision on this project! 🚀
