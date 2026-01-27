# Figure Specifications for Draw.io

# NXCertify Journal Paper Diagrams

This document contains detailed text-based specifications for all 10 figures needed in the manuscript. Each specification includes all nodes, connections, labels, and visual hierarchy needed to create the diagram in draw.io.

---

## Figure 1: High-Level System Architecture

**Diagram Type:** Layered Architecture Diagram (Horizontal layers)

**Layout:** Left-to-right flow with 4 main columns

### Components:

#### Column 1: Frontend (Left)

**Container:** Rectangle with light blue background

- **Label:** "Frontend Application (Next.js)"
- **Sub-components (vertical stack inside):**
  1. Box: "User Interface Components"
  2. Box: "Wallet Integration (MetaMask/Browser Wallet)"
  3. Box: "State Management (Zustand)"
  4. Box: "API Client (Axios)"

#### Column 2: Backend (Center-Left)

**Container:** Rectangle with light green background

- **Label:** "Backend Services (NestJS)"
- **Sub-components (vertical stack inside):**
  1. Box: "REST API Controllers"
  2. Box: "Business Logic Services"
  3. Box: "Authentication & Authorization"
  4. Box: "Blockchain Integration Layer"
  5. Box: "PDF Generation Service"

#### Column 3: Blockchain (Center-Right)

**Container:** Rectangle with orange background

- **Label:** "GoQuorum Private Network"
- **Sub-components (vertical stack inside):**
  1. Box: "Validator Node 1 (QBFT)"
  2. Box: "Validator Node 2 (QBFT)"
  3. Box: "Validator Node 3 (QBFT)"
  4. Box: "Smart Contracts Layer"
     - Inside this box, two smaller boxes:
       - "UserRegistry Contract"
       - "CertificateRegistry Contract"

#### Column 4: Database (Right)

**Container:** Rectangle with purple background

- **Label:** "PostgreSQL Database"
- **Sub-components (vertical stack inside):**
  1. Box: "Student Records"
  2. Box: "Verifier Information"
  3. Box: "Verification Logs"
  4. Box: "Admin Sessions"

### Connections:

1. **Frontend → Backend:**

   - Arrow from "API Client" to "REST API Controllers"
   - Label: "HTTPS/REST API"

2. **Backend → Blockchain:**

   - Arrow from "Blockchain Integration Layer" to "Smart Contracts Layer"
   - Label: "JSON-RPC / ethers.js"

3. **Backend → Database:**

   - Bidirectional arrow from "Business Logic Services" to "Student Records"
   - Label: "TypeORM / SQL Queries"

4. **Blockchain Internal:**
   - Arrows connecting the 3 validator nodes in a triangle formation
   - Label: "QBFT Consensus"

### External Actors (at the very left):

- Icon/Circle: "Admin User" → connects to Frontend
- Icon/Circle: "Student" → connects to Frontend
- Icon/Circle: "Verifier" → connects to Frontend

### Visual Notes:

- Use different colors for each major layer to distinguish concerns
- Add slight 3D effect or shadows to containers for depth
- Use solid arrows for synchronous communication, dashed for async
- Place legend at bottom explaining arrow types

---

## Figure 2: GoQuorum Network Topology

**Diagram Type:** Network Topology Diagram

**Layout:** Diamond/mesh formation showing node connectivity

### Nodes:

#### Validator Nodes (3 nodes arranged in triangle):

1. **Validator Node 1**

   - Shape: Large rounded rectangle
   - Icon: Server/computer icon
   - Labels inside:
     - "Validator 1"
     - "RPC Port: 8545"
     - "P2P Port: 30303"
     - "QBFT Validator"

2. **Validator Node 2**

   - Shape: Large rounded rectangle
   - Icon: Server/computer icon
   - Labels inside:
     - "Validator 2"
     - "RPC Port: 8546"
     - "P2P Port: 30304"
     - "QBFT Validator"

3. **Validator Node 3**
   - Shape: Large rounded rectangle
   - Icon: Server/computer icon
   - Labels inside:
     - "Validator 3"
     - "RPC Port: 8547"
     - "P2P Port: 30305"
     - "QBFT Validator"

#### Backend Connection (left side):

- **Backend Service Node**
  - Shape: Rounded rectangle (different color - blue)
  - Label: "NestJS Backend"
  - Sub-label: "ethers.js RPC Client"

#### Supporting Services (right side, vertical stack):

1. **Block Explorer**

   - Shape: Small rectangle
   - Label: "Block Explorer UI"
   - Sub-label: "Port: 25000"

2. **Monitoring**
   - Shape: Small rectangle
   - Label: "Prometheus/Grafana"
   - Sub-label: "Metrics Collection"

### Connections:

1. **Validator Triangle (Consensus Network):**

   - Thick bidirectional arrows connecting all 3 validators in full mesh
   - Label on arrows: "QBFT Block Proposals & Votes"
   - Sub-label: "Istanbul BFT Protocol"

2. **Backend → Validator 1:**

   - Arrow from Backend to Validator 1 (primary connection)
   - Label: "JSON-RPC (Port 8545)"
   - Sub-label: "Transaction Submission & Contract Calls"

3. **Backend → Validator 2 (dashed):**

   - Dashed arrow from Backend to Validator 2 (backup)
   - Label: "Failover Connection"

4. **Block Explorer → Validator 1:**

   - Arrow from Block Explorer to Validator 1
   - Label: "Read-only RPC"

5. **Monitoring → All Validators:**
   - Dashed arrows from Monitoring to each validator
   - Label: "Metrics Scraping"

### Network Information Box (bottom):

- **Container:** Dotted border rectangle
- **Title:** "Network Configuration"
- **Content (bullet points):**
  - Chain ID: 1337
  - Consensus: QBFT (Istanbul BFT)
  - Block Time: ~5 seconds
  - Gas Limit: 700M
  - Network Type: Private (Permissioned)

### Visual Notes:

- Use distinct colors: validators (orange), backend (blue), monitoring (green)
- Thick arrows for high-bandwidth connections (consensus)
- Add small icons for each node type (server, database, chart)
- Include port numbers prominently

---

## Figure 3: Backend Service Architecture

**Diagram Type:** Component Diagram (Module/Service breakdown)

**Layout:** Hierarchical structure with NestJS modules

### Top Layer: HTTP Entry Points

**Container:** Thin horizontal rectangle spanning full width

- **Components (left to right):**
  1. "Global Exception Filter"
  2. "Logging Interceptor"
  3. "Validation Pipe"

### Second Layer: Controllers (horizontal row)

**Container:** Rectangle with light blue background

- **Label:** "Controller Layer"
- **Components (5 boxes in a row):**
  1. "AuthController"
  2. "UsersController"
  3. "CertificatesController"
  4. "AuditController"
  5. "VerifierController"

### Third Layer: Services (horizontal row)

**Container:** Rectangle with green background

- **Label:** "Business Logic Layer"
- **Components (8 boxes in a row):**
  1. "AuthService"
  2. "UsersService"
  3. "CertificatesService"
  4. "PdfService"
  5. "AuditService"
  6. "VerifierService"
  7. "RateLimitService"
  8. "NotificationService"

### Fourth Layer: Integration Services (horizontal row)

**Container:** Rectangle with orange background

- **Label:** "Data Access & Integration Layer"
- **Components (left side - blockchain):**
  1. "BlockchainClientService" (larger box)
  2. "UserBlockchainService" (under it)
  3. "CertificateBlockchainService" (under it)
  4. "AuditBlockchainService" (under it)
- **Components (right side - database):** 5. "TypeORM Repositories" (larger box)
  - Inside: "StudentRepository", "VerifierRepository", "LogRepository"

### Bottom Layer: External Systems (horizontal row)

**Container:** Rectangle with gray background

- **Label:** "External Systems"
- **Components (left to right):**
  1. "GoQuorum Network" (with blockchain icon)
  2. "PostgreSQL Database" (with database icon)
  3. "Puppeteer (Headless Chrome)" (with browser icon)

### Vertical Cross-Cutting Concerns (right side)

**Container:** Vertical bar on far right

- **Label:** "Guards & Decorators"
- **Components (vertical stack):**
  1. "JwtAuthGuard"
  2. "RolesGuard"
  3. "@Roles() Decorator"
  4. "@Public() Decorator"

### Connections:

1. **Controllers → Services:**

   - Arrows from each controller to its corresponding service
   - Label: "Dependency Injection"

2. **Services → Integration Layer:**

   - Arrows from CertificatesService to both CertificateBlockchainService and TypeORM Repositories
   - Arrows from UsersService to UserBlockchainService
   - Arrows from AuditService to AuditBlockchainService
   - Label: "Service Calls"

3. **Integration Layer → External Systems:**

   - Arrows from BlockchainClientService to GoQuorum Network
   - Arrows from TypeORM Repositories to PostgreSQL
   - Arrow from PdfService to Puppeteer
   - Labels: "RPC Calls", "SQL Queries", "PDF Rendering"

4. **Guards → Controllers:**
   - Dashed arrows from Guards to Controllers
   - Label: "Route Protection"

### Configuration Module (floating box, top-right):

- **Shape:** Rounded rectangle (yellow background)
- **Label:** "ConfigModule"
- **Content:**
  - "Environment Variables"
  - "Contract Addresses"
  - "Database Config"
- **Connection:** Dashed arrows to all services (showing dependency)

### Visual Notes:

- Use consistent color coding for each layer
- Show dependency injection with dotted lines
- Use solid lines for direct method calls
- Add small icons for external systems (blockchain, database, browser)
- Group related services with subtle background shading

---

## Figure 4: Frontend Architecture and Data Flow

**Diagram Type:** Component Architecture with Data Flow

**Layout:** 3 layers from top to bottom

### Layer 1: Pages/Routes (Top)

**Container:** Light purple background

- **Label:** "Next.js Pages (App Router)"
- **Components (horizontal row, 6 boxes):**
  1. "/login"
  2. "/dashboard"
  3. "/certificates"
  4. "/students"
  5. "/audit"
  6. "/verify/[hash]"

### Layer 2: Components (Middle)

**Container:** Light blue background, subdivided into 3 sections

#### Section A: Layout Components (Left)

- **Box:** "Layout Components"
- **Content:**
  1. "Navbar"
  2. "Sidebar"
  3. "Footer"
  4. "ProtectedRoute"

#### Section B: Feature Components (Center)

- **Box:** "Feature Components"
- **Content:**
  1. "CertificateCard"
  2. "IssuanceForm"
  3. "StudentTable"
  4. "AuditTimeline"
  5. "VerificationDisplay"
  6. "QRCodeGenerator"
  7. "WalletButton"

#### Section C: Shared Components (Right)

- **Box:** "Shared Components"
- **Content:**
  1. "Button"
  2. "Modal"
  3. "Toast"
  4. "LoadingSpinner"
  5. "DataTable"

### Layer 3: State & Logic (Bottom)

**Container:** Three columns

#### Column 1: State Management (Left)

**Box:** "Zustand Stores" (green background)

- **Content:**
  1. "authStore"
     - state: user, isAuthenticated, token
     - actions: login(), logout()
  2. "certificateStore"
     - state: certificates[]
     - actions: fetchCerts(), issueCert()
  3. "auditStore"
     - state: logs[]
     - actions: fetchLogs()

#### Column 2: API Layer (Center)

**Box:** "API Client (Axios)" (orange background)

- **Content:**
  1. "authApi.ts"
  2. "userApi.ts"
  3. "certificateApi.ts"
  4. "auditApi.ts"
  5. "verifierApi.ts"
- **Sub-box inside:** "Interceptors"
  - JWT Token Injection
  - Error Handling

#### Column 3: Wallet Integration (Right)

**Box:** "Web3 Wallet Layer" (yellow background)

- **Content:**
  1. "Wallet Connection"
     - useWallet() hook
     - MetaMask detection
  2. "Message Signing"
     - signMessage() wrapper
     - Challenge signature

### Layer 4: External Systems (Bottom)

**Container:** Gray background

- **Components (horizontal row):**
  1. "Backend API (NestJS)" - Port 3000
  2. "Browser Wallet Extension" - MetaMask/Coinbase Wallet

### Data Flow Arrows:

1. **Pages → Components:**

   - Arrows from each page to relevant components
   - Label: "Component Composition"

2. **Components → Stores:**

   - Arrows from feature components to Zustand stores
   - Label: "State Read/Write"

3. **Stores → API Client:**

   - Arrows from stores to API client
   - Label: "API Calls"

4. **API Client → Backend:**

   - Arrow from API client to Backend API
   - Label: "HTTPS Requests"

5. **Components → Wallet:**

   - Arrow from WalletButton to Wallet Integration
   - Label: "Sign Transactions"

6. **Wallet Integration → Browser Wallet:**
   - Arrow to Browser Wallet Extension
   - Label: "window.ethereum API"

### Side Annotations (right margin):

- **Data Flow Direction:** Large arrow pointing downward
- **Labels:** "View Layer → State → API → Backend"

### Visual Notes:

- Use color gradients from top (UI) to bottom (external)
- Add small icons for pages (page icon), components (puzzle piece), stores (database), API (cloud)
- Show data flow with thick arrows
- Add "Read" (green) and "Write" (red) labels on bidirectional arrows

---

## Figure 5: Authentication Flow Sequence Diagram

**Diagram Type:** UML Sequence Diagram

**Layout:** 5 vertical lifelines (actors/systems)

### Lifelines (left to right):

1. **User** (Actor)

   - Icon: Person/user icon
   - Lifeline: Dashed vertical line

2. **Frontend** (System)

   - Label: "Next.js App"
   - Lifeline: Dashed vertical line

3. **Backend** (System)

   - Label: "NestJS API"
   - Lifeline: Dashed vertical line

4. **Smart Contract** (System)

   - Label: "UserRegistry"
   - Lifeline: Dashed vertical line

5. **Browser Wallet** (System)
   - Label: "MetaMask"
   - Lifeline: Dashed vertical line

### Sequence Steps (top to bottom):

1. **User → Frontend**

   - Arrow: →
   - Label: "1. Click 'Connect Wallet'"

2. **Frontend → Browser Wallet**

   - Arrow: →
   - Label: "2. Request account access"

3. **Browser Wallet → User**

   - Arrow: ←
   - Label: "3. Prompt for permission"

4. **User → Browser Wallet**

   - Arrow: →
   - Label: "4. Approve connection"

5. **Browser Wallet → Frontend**

   - Arrow: ←
   - Label: "5. Return wallet address"

6. **Frontend → Backend**

   - Arrow: →
   - Label: "6. POST /auth/challenge"
   - Sub-label: "{ address: '0x...' }"

7. **Backend internal** (self-message)

   - Arrow: Loop back to itself
   - Label: "7. Generate challenge"
   - Note: "Timestamp + nonce + address"

8. **Backend → Frontend**

   - Arrow: ←
   - Label: "8. Return challenge"
   - Sub-label: "{ message: 'Sign this...' }"

9. **Frontend → Browser Wallet**

   - Arrow: →
   - Label: "9. Request signature"
   - Sub-label: "personal_sign(challenge)"

10. **Browser Wallet → User**

    - Arrow: ←
    - Label: "10. Show signing prompt"

11. **User → Browser Wallet**

    - Arrow: →
    - Label: "11. Approve signature"

12. **Browser Wallet internal** (self-message)

    - Arrow: Loop back to itself
    - Label: "12. Sign with private key"
    - Note: "ECDSA signature"

13. **Browser Wallet → Frontend**

    - Arrow: ←
    - Label: "13. Return signature"
    - Sub-label: "{ signature: '0x...' }"

14. **Frontend → Backend**

    - Arrow: →
    - Label: "14. POST /auth/login"
    - Sub-label: "{ address, signature }"

15. **Backend internal** (self-message)

    - Arrow: Loop back to itself
    - Label: "15. Verify signature"
    - Note: "ecrecover(message, signature)"

16. **Backend → Smart Contract**

    - Arrow: →
    - Label: "16. getUserByAddress()"
    - Sub-label: "View call (no gas)"

17. **Smart Contract → Backend**

    - Arrow: ←
    - Label: "17. Return user data"
    - Sub-label: "{ isAuthorized, isAdmin }"

18. **Backend internal** (self-message)

    - Arrow: Loop back to itself
    - Label: "18. Generate JWT"
    - Note: "Include roles & expiry"

19. **Backend → Frontend**

    - Arrow: ←
    - Label: "19. Return JWT token"
    - Sub-label: "{ token, user, expiresIn }"

20. **Frontend internal** (self-message)

    - Arrow: Loop back to itself
    - Label: "20. Store token"
    - Note: "Save in Zustand store"

21. **Frontend → User**
    - Arrow: ←
    - Label: "21. Redirect to dashboard"

### Visual Elements:

- **Activation boxes:** Draw activation rectangles on lifelines when processing
- **Decision diamond** (after step 15): "Signature Valid?"

  - Yes path: Continue to step 16
  - No path: Return 401 error

- **Alternative path** (dotted box around steps 16-17): "opt [User is authorized]"

  - If not authorized: Skip to error response

- **Note boxes:**
  - After step 7: "Challenge expires in 5 minutes"
  - After step 12: "Private key never leaves wallet"
  - After step 18: "Token expires in 30 minutes"

### Visual Notes:

- Use different colors for arrows: request (blue), response (green), internal (orange)
- Add return arrows with dashed lines
- Place timing annotations on the left margin (0s, 1s, 2s... ~5s total)
- Highlight critical security steps (signature verification, authorization check) with yellow background

---

## Figure 6: Backend Layer Architecture

**Diagram Type:** Layered Architecture (Horizontal layers with detail)

**Layout:** 5 horizontal layers stacked vertically

### Layer 1: HTTP Layer (Top)

**Container:** Thin rectangle, red background

- **Label:** "HTTP Request/Response Layer"
- **Components (left to right):**
  1. "Client Request" → "Validation Pipe" → "Exception Filter" → "Logging Interceptor"
- **Flow:** Single horizontal arrow showing request entry point

### Layer 2: Presentation Layer

**Container:** Blue background

- **Label:** "Presentation Layer - Controllers"
- **Components (5 columns, each a controller):**

  **Column 1:** AuthController

  - Endpoints: POST /auth/challenge, POST /auth/login, POST /auth/logout

  **Column 2:** UsersController

  - Endpoints: POST /users/register, GET /users/:address, POST /users/:address/revoke

  **Column 3:** CertificatesController

  - Endpoints: POST /certificates/issue, GET /certificates/:hash, POST /certificates/:hash/revoke

  **Column 4:** AuditController

  - Endpoints: GET /audit/logs, GET /audit/certificate/:hash

  **Column 5:** VerifierController

  - Endpoints: POST /verifier/register, POST /verifier/verify

### Layer 3: Business Logic Layer

**Container:** Green background

- **Label:** "Business Logic Layer - Services"
- **Components (8 boxes):**
  1. "AuthService" - Challenge generation & JWT validation
  2. "UsersService" - User lifecycle management
  3. "CertificatesService" - Certificate orchestration
  4. "PdfService" - Document generation
  5. "AuditService" - Log aggregation
  6. "VerifierService" - Verifier management
  7. "RateLimitService" - Rate limiting logic
  8. "EmailService" - Notifications

### Layer 4: Data Access Layer

**Container:** Orange background

- **Label:** "Data Access Layer - Integration Services"

**Left Section:** Blockchain Integration

- **Container:** Sub-box
  - "BlockchainClientService" (main connection manager)
  - "UserBlockchainService" (smart contract: UserRegistry)
  - "CertificateBlockchainService" (smart contract: CertificateRegistry)
  - "AuditBlockchainService" (event queries)

**Right Section:** Database Integration

- **Container:** Sub-box
  - "TypeORM Entity Managers"
  - "StudentRepository"
  - "VerifierRepository"
  - "VerificationLogRepository"
  - "AdminSessionRepository"

### Layer 5: External Systems (Bottom)

**Container:** Gray background

- **Label:** "External Systems & Infrastructure"
- **Components (left to right):**

  1. **GoQuorum Network**

     - Icon: Blockchain/network icon
     - "Port 8545 (JSON-RPC)"

  2. **PostgreSQL Database**

     - Icon: Database cylinder
     - "Port 5432"

  3. **Puppeteer/Chrome**
     - Icon: Browser icon
     - "Headless Browser"

### Cross-Cutting Concerns (Vertical bars on sides):

**Left Side Bar:** "Security Layer"

- JwtAuthGuard
- RolesGuard
- @Roles() decorator
- @Public() decorator

**Right Side Bar:** "Configuration & Utilities"

- ConfigService
- LoggerService
- CacheManager

### Connections Between Layers:

1. **Layer 1 → Layer 2:**

   - Arrows from HTTP Layer to each controller
   - Label: "Route HTTP requests"

2. **Layer 2 → Layer 3:**

   - Arrows from each controller to corresponding service(s)
   - Label: "Inject & call services"

3. **Layer 3 → Layer 4:**

   - Arrows from services to integration services
   - Example: CertificatesService → CertificateBlockchainService
   - Example: UsersService → TypeORM Repositories

4. **Layer 4 → Layer 5:**
   - Arrows from integration services to external systems
   - Label: "RPC calls / SQL queries"

### Annotations:

- **Arrow from Security Layer:** Crosses all layers showing "Guards execute before controller methods"
- **Arrow from Configuration:** Crosses all layers showing "Configuration injected into all services"

### Visual Notes:

- Use gradient colors getting darker towards bottom layers
- Show layer boundaries clearly with thick horizontal lines
- Add small icons for each service type (shield for auth, file for pdf, etc.)
- Use different arrow styles: solid for synchronous calls, dashed for configuration injection

---

## Figure 7: Frontend Component Architecture

**Diagram Type:** Component Hierarchy Tree

**Layout:** Tree structure showing component relationships

### Root Level: App Layout

**Container:** Large rectangle at top

- **Label:** "App Layout (layout.tsx)"
- **Contains:**
  - "Global Providers"
  - "Theme Provider"
  - "Toast Container"

### Level 1: Pages (Branches from root)

**Branch 1:** Login Page

- **Node:** "/login" page
- **Children:**
  - WalletConnectButton
  - LoginForm
  - LoadingSpinner

**Branch 2:** Dashboard Page

- **Node:** "/dashboard" page
- **Children:**
  - DashboardStats
  - RecentActivity
  - QuickActions
  - UserProfileCard

**Branch 3:** Certificates Page

- **Node:** "/certificates" page
- **Children:**
  - CertificateList
    - └─ CertificateCard (repeated)
      - └─ StatusBadge
      - └─ ActionMenu
      - └─ QRCodeDisplay
  - IssueCertificateModal
    - └─ IssuanceForm
      - └─ StudentSearch
      - └─ DegreeSelector
      - └─ CGPAInput
  - FilterPanel
  - PaginationControls

**Branch 4:** Students Page

- **Node:** "/students" page
- **Children:**
  - StudentTable
    - └─ TableHeader
    - └─ TableRow (repeated)
      - └─ EditButton
      - └─ DeleteButton
  - AddStudentModal
  - ImportCSVButton

**Branch 5:** Audit Page

- **Node:** "/audit" page
- **Children:**
  - AuditTimeline
    - └─ TimelineEvent (repeated)
      - └─ EventIcon
      - └─ EventDetails
      - └─ Timestamp
  - FilterSidebar
    - └─ DateRangePicker
    - └─ EventTypeFilter
    - └─ ActorFilter
  - ExportButton

**Branch 6:** Verification Page

- **Node:** "/verify/[hash]" page (public)
- **Children:**
  - VerificationDisplay
    - └─ CertificatePreview
    - └─ VerificationStatus
    - └─ BlockchainProof
      - └─ TransactionHash
      - └─ BlockNumber
      - └─ IssuerAddress
    - └─ QRCode
  - DownloadPDFButton
  - VerifierRegistrationForm

### Level 2: Shared Components (Used across pages)

**Sidebar Section:** "Shared UI Components"

- **Container:** Separate box on right side
- **Components (vertical list):**

  1. **Navigation**

     - Navbar
       - └─ Logo
       - └─ NavLinks
       - └─ WalletStatus
       - └─ UserMenu
     - Sidebar
       - └─ MenuItems
       - └─ RoleBadge

  2. **Forms & Inputs**

     - Input
     - TextArea
     - Select
     - DatePicker
     - FileUpload
     - SearchBar

  3. **Feedback**

     - Toast
     - Modal
     - ConfirmDialog
     - LoadingSpinner
     - ProgressBar
     - ErrorBoundary

  4. **Data Display**

     - DataTable
     - Card
     - Badge
     - Tooltip
     - Accordion

  5. **Actions**
     - Button
     - IconButton
     - DropdownMenu
     - ToggleSwitch

### Level 3: Hooks & Utilities (Bottom layer)

**Container:** Horizontal bar at bottom

- **Custom Hooks:**
  - useWallet() - Wallet connection state
  - useAuth() - Authentication state from store
  - useCertificates() - Certificate data fetching
  - useAudit() - Audit logs fetching
  - useToast() - Toast notifications
  - useModal() - Modal state management

### State Flow Annotations:

**Arrows showing data flow:**

1. **Pages → Stores:** "Read state via hooks"
2. **Components → API Client:** "Trigger API calls"
3. **API Client → Stores:** "Update state with responses"
4. **Stores → Components:** "Re-render on state change"

### Styling Layers (Right sidebar):

**Box:** "Styling Architecture"

- Tailwind CSS (utility classes)
- shadcn/ui (component library)
- CSS Variables (theme tokens)
- Responsive breakpoints

### Visual Notes:

- Use tree structure with connecting lines
- Color-code by feature: Auth (blue), Certificates (green), Audit (orange), Public (gray)
- Show component reusability with dashed lines connecting to multiple parents
- Add small icons for component types (page, form, button, etc.)
- Indent child components clearly

---

## Figure 8: Certificate Issuance Sequence Diagram

**Diagram Type:** UML Sequence Diagram

**Layout:** 7 vertical lifelines

### Lifelines (left to right):

1. **Admin User** (Actor)
2. **Frontend** (System)
3. **Backend API** (System)
4. **CertificatesService** (Component)
5. **CertificateBlockchainService** (Component)
6. **Smart Contract** (System)
7. **Database** (System)

### Sequence Steps:

**Phase 1: Initiation**

1. Admin User → Frontend

   - "1. Fill issuance form"
   - Data: student address, degree, CGPA

2. Admin User → Frontend

   - "2. Click 'Issue Certificate'"

3. Frontend → Backend API
   - "3. POST /certificates/issue"
   - Body: { studentAddress, degree, cgpa, issuerAddress }

**Phase 2: Validation**

4. Backend API → CertificatesService

   - "4. Call issueCertificate()"

5. CertificatesService → Database

   - "5. Query student record"
   - "SELECT \* FROM students WHERE address = ?"

6. Database → CertificatesService

   - "6. Return student data"

7. CertificatesService (self-loop)
   - "7. Validate student eligibility"
   - Note: "Check credits, existing certs"

**Decision Box:** "Student Eligible?"

- NO path: Jump to error response (step 22)
- YES path: Continue to step 8

**Phase 3: Certificate Hash Generation**

8. CertificatesService → CertificateBlockchainService

   - "8. Call issueCertificate()"

9. CertificateBlockchainService (self-loop)

   - "9. Get current version for student"
   - Note: "Query contract view function"

10. CertificateBlockchainService (self-loop)
    - "10. Compute certificate hash"
    - Note: "solidityPacked + keccak256"
    - Formula: "hash(student, degree, cgpa, issueDate, version)"

**Phase 4: Signature Generation**

11. CertificateBlockchainService (self-loop)
    - "11. Sign hash with issuer wallet"
    - Note: "ECDSA signature via ethers.js"
    - "wallet.signMessage(hash)"

**Phase 5: Blockchain Transaction**

12. CertificateBlockchainService → Smart Contract

    - "12. Call issueCertificate()"
    - TX params: studentAddr, degree, cgpa, issuerAddr, signature

13. Smart Contract (self-loop)

    - "13. Validate signature"
    - Note: "ecrecover(hash, signature) == issuer"

14. Smart Contract (self-loop)

    - "14. Store certificate"
    - Note: "Save to mapping, emit event"

15. Smart Contract → CertificateBlockchainService
    - "15. Return transaction receipt"
    - Data: { txHash, blockNumber, gasUsed }

**Phase 6: Database Update**

16. CertificateBlockchainService → CertificatesService

    - "16. Return certificate data"
    - Data: { hash, txHash, timestamp }

17. CertificatesService → Database

    - "17. Update student record"
    - SQL: "UPDATE students SET certificate_issued = true"

18. Database → CertificatesService
    - "18. Confirm update"

**Phase 7: PDF Generation**

19. CertificatesService (self-loop)
    - "19. Trigger PDF generation"
    - Note: "Async job, doesn't block response"

**Phase 8: Response**

20. CertificatesService → Backend API

    - "20. Return success result"

21. Backend API → Frontend

    - "21. HTTP 201 Created"
    - Response: { certificateHash, txHash, pdfUrl }

22. Frontend → Admin User
    - "22. Show success message"
    - Display: "Certificate issued successfully"

**Alternative Flow (Error Path):**

22. CertificatesService → Backend API

    - "22a. Throw validation error"

23. Backend API → Frontend

    - "23a. HTTP 400 Bad Request"
    - Error: { message: "Student not eligible" }

24. Frontend → Admin User
    - "24a. Show error toast"

### Timing Annotations (left margin):

- Step 1-7: ~500ms (validation)
- Step 8-11: ~200ms (hash & signature)
- Step 12-15: ~5s (blockchain confirmation)
- Step 16-22: ~300ms (database & response)
- **Total:** ~6 seconds

### Visual Elements:

- **Activation boxes** on lifelines during processing
- **Decision diamond** after step 7: "Eligible?"
- **Parallel execution box** around step 19: "par [PDF generation runs async]"
- **Critical section box** around steps 12-15: "Blockchain transaction (atomic)"

### Notes:

- Add note after step 10: "Hash is deterministic - same inputs = same hash"
- Add note after step 11: "Private key never sent to backend"
- Add note after step 14: "Event emitted: CertificateIssued(hash, student, issuer, timestamp)"
- Add note after step 15: "QBFT provides instant finality"

### Visual Notes:

- Color-code phases: Validation (yellow), Computation (blue), Blockchain (orange), Database (green)
- Use thick arrows for blockchain transactions
- Add return dashed arrows for all responses
- Highlight error path in red

---

## Figure 9: Audit Trail Timeline Visualization

**Diagram Type:** Timeline/Event Flow Diagram

**Layout:** Horizontal timeline with events stacked vertically at time points

### Timeline Structure:

**Main Timeline:** Horizontal line spanning full width

- **Time markers:** T0, T1, T2, T3, T4, T5, T6 (evenly spaced)
- **Labels:** Dates (e.g., "Jan 1, 2026", "Jan 5", "Jan 10", etc.)

### Events (positioned along timeline):

#### Event 1 (T0 - January 1, 2026 10:00 AM):

**Event Card:** Rectangle above timeline

- **Icon:** User-plus icon (top-left)
- **Title:** "User Registered"
- **Details:**
  - Actor: Admin (0x1a2b...3c4d)
  - Target: Student Alice (0x5e6f...7g8h)
  - Action: Registered new user
  - Transaction: 0xabc123...
  - Block: #1234
- **Event Type Badge:** Blue badge "USER_EVENT"
- **Connector:** Vertical line to timeline

#### Event 2 (T1 - January 5, 2026 2:30 PM):

**Event Card:** Rectangle below timeline (alternate side)

- **Icon:** File-plus icon
- **Title:** "Certificate Issued"
- **Details:**
  - Actor: Dr. Smith (0x9a8b...7c6d)
  - Target: Student Alice (0x5e6f...7g8h)
  - Certificate: CS-Bachelor-V1
  - Hash: 0xdef456...
  - Transaction: 0xghi789...
  - Block: #2456
- **Event Type Badge:** Green badge "CERTIFICATE_EVENT"
- **Connector:** Vertical line to timeline

#### Event 3 (T2 - January 8, 2026 9:15 AM):

**Event Card:** Rectangle above timeline

- **Icon:** Eye icon
- **Title:** "Certificate Verified"
- **Details:**
  - Actor: Employer XYZ
  - Certificate: 0xdef456...
  - Verification Result: ✓ Valid
  - IP: 192.168.1.100
- **Event Type Badge:** Gray badge "VERIFICATION_EVENT"
- **Connector:** Vertical line to timeline

#### Event 4 (T3 - January 10, 2026 4:45 PM):

**Event Card:** Rectangle below timeline

- **Icon:** Shield-alert icon
- **Title:** "User Privileges Granted"
- **Details:**
  - Actor: Super Admin (0x1a1a...2b2b)
  - Target: Dr. Smith (0x9a8b...7c6d)
  - New Role: Admin
  - Transaction: 0xjkl012...
  - Block: #3678
- **Event Type Badge:** Blue badge "USER_EVENT"
- **Connector:** Vertical line to timeline

#### Event 5 (T4 - January 15, 2026 11:20 AM):

**Event Card:** Rectangle above timeline

- **Icon:** File-plus icon
- **Title:** "Certificate Issued"
- **Details:**
  - Actor: Dr. Smith (0x9a8b...7c6d)
  - Target: Student Bob (0x3c3c...4d4d)
  - Certificate: CS-Bachelor-V1
  - Hash: 0xmno345...
  - Transaction: 0xpqr678...
  - Block: #4890
- **Event Type Badge:** Green badge "CERTIFICATE_EVENT"
- **Connector:** Vertical line to timeline

#### Event 6 (T5 - January 18, 2026 3:00 PM):

**Event Card:** Rectangle below timeline (RED background)

- **Icon:** X-circle icon (red)
- **Title:** "Certificate Revoked"
- **Details:**
  - Actor: Dr. Smith (0x9a8b...7c6d)
  - Certificate: 0xmno345...
  - Reason: "Data entry error - wrong student"
  - Transaction: 0xstu901...
  - Block: #5102
- **Event Type Badge:** Red badge "CERTIFICATE_EVENT"
- **Connector:** Vertical line to timeline (dashed, red)

#### Event 7 (T6 - January 20, 2026 10:30 AM):

**Event Card:** Rectangle above timeline (ORANGE background)

- **Icon:** Rotate-ccw icon
- **Title:** "Certificate Reactivated"
- **Details:**
  - Actor: Super Admin (0x1a1a...2b2b)
  - Certificate: 0xmno345...
  - Reason: "Error resolved - reactivating"
  - Transaction: 0xvwx234...
  - Block: #5314
- **Event Type Badge:** Orange badge "CERTIFICATE_EVENT"
- **Connector:** Vertical line to timeline

### Filter Panel (Top-right corner):

**Container:** Rounded rectangle

- **Title:** "Active Filters"
- **Filter Tags:**
  - "Event Type: ALL" (dropdown)
  - "Date Range: Jan 1-20" (date picker)
  - "Actor: All Users" (user selector)
  - "Certificate: 0xdef456" (hash input)

### Legend (Bottom-right corner):

**Container:** Small box

- **Icons with labels:**
  - Blue circle: User Events
  - Green circle: Certificate Issued
  - Red circle: Certificate Revoked
  - Orange circle: Certificate Reactivated
  - Gray circle: Verification Events

### Interactive Elements Annotations:

- **Hover State:** Dotted box around Event 2 showing "Click for transaction details"
- **Expand Icon:** Small "+" icon on Event 6 showing expandable details
- **Chain Link:** Small blockchain icon next to each transaction hash

### Data Summary Box (Top-left):

**Container:** Rounded rectangle

- **Statistics:**
  - Total Events: 7
  - User Events: 2
  - Certificates Issued: 2
  - Verifications: 1
  - Revocations: 1
  - Reactivations: 1
- **Time Range:** Jan 1-20, 2026

### Visual Notes:

- Alternate event cards above/below timeline for readability
- Color-code events: Blue (user), Green (issue), Red (revoke), Orange (reactivate), Gray (verify)
- Use consistent card layout for all events
- Add subtle shadows to cards for depth
- Connect cards to timeline with vertical lines (solid for normal, dashed for revoke)
- Make timeline scrollable horizontally for long histories
- Add small profile images/icons for actors

---

## Figure 10: Multi-Layer Security Architecture

**Diagram Type:** Concentric Circles (Defense in Depth)

**Layout:** 5 concentric circles/layers radiating outward from center

### Center (Core): Protected Assets

**Circle 1 (innermost):** Purple background

- **Label:** "Protected Assets"
- **Icons arranged in center:**
  - Document icon: "Certificate Data"
  - Key icon: "Private Keys"
  - User icon: "User Identities"
  - Shield icon: "Authorization Records"

### Layer 2: Blockchain Security

**Circle 2:** Orange background

- **Label:** "Blockchain Security Layer"
- **Segments (4 sections around circle):**

  **Segment A (Top):** "Cryptographic Integrity"

  - ECDSA Signatures
  - Keccak-256 Hashing
  - Public/Private Key Pairs

  **Segment B (Right):** "Consensus Security"

  - QBFT Byzantine Fault Tolerance
  - 3 Validator Nodes (2F+1)
  - Instant Finality

  **Segment C (Bottom):** "Smart Contract Security"

  - Access Control Modifiers
  - Reentrancy Guards
  - Integer Overflow Protection

  **Segment D (Left):** "Immutability"

  - Append-Only Ledger
  - Event-Based Audit Trail
  - No Data Deletion

### Layer 3: Application Security

**Circle 3:** Blue background

- **Label:** "Application Security Layer"
- **Segments (6 sections):**

  **Segment A:** "Authentication"

  - Wallet-Based Auth
  - Challenge-Response
  - Signature Verification

  **Segment B:** "Authorization"

  - Role-Based Access Control (RBAC)
  - Admin/User Separation
  - JWT Claims

  **Segment C:** "API Security"

  - HTTPS/TLS Encryption
  - CORS Configuration
  - Request Validation

  **Segment D:** "Session Management"

  - JWT Tokens (30min expiry)
  - Stateless Sessions
  - Token Refresh

  **Segment E:** "Rate Limiting"

  - IP-Based Throttling
  - 5 attempts/15min
  - DDoS Prevention

  **Segment F:** "Input Validation"

  - DTO Validation Pipes
  - SQL Injection Prevention
  - XSS Protection

### Layer 4: Infrastructure Security

**Circle 4:** Green background

- **Label:** "Infrastructure Security Layer"
- **Segments (4 sections):**

  **Segment A:** "Network Security"

  - Private Blockchain Network
  - Firewall Rules
  - VPN Access (optional)

  **Segment B:** "Database Security"

  - Encrypted Connections
  - Principle of Least Privilege
  - Backup Encryption

  **Segment C:** "Environment Isolation"

  - Docker Containers
  - Development/Production Separation
  - Secrets Management

  **Segment D:** "Monitoring & Logging"

  - Activity Logging
  - Anomaly Detection
  - Audit Trail Recording

### Layer 5: Operational Security

**Circle 5 (outermost):** Gray background

- **Label:** "Operational Security Layer"
- **Segments (6 sections):**

  **Segment A:** "Access Control"

  - Physical Security
  - Admin Credential Management
  - Multi-Factor Authentication (future)

  **Segment B:** "Incident Response"

  - Emergency Procedures
  - Breach Detection
  - Recovery Plans

  **Segment C:** "Security Updates"

  - Dependency Patching
  - Security Advisories
  - Version Management

  **Segment D:** "Compliance"

  - Data Privacy Regulations
  - Audit Requirements
  - Documentation

  **Segment E:** "User Education"

  - Security Best Practices
  - Phishing Awareness
  - Wallet Safety

  **Segment F:** "Testing & Audits"

  - Security Audits
  - Penetration Testing
  - Code Reviews

### External Threats (Outside all circles):

**Threat Vectors (positioned around perimeter with arrows pointing inward):**

- **Top-Left:** "Phishing Attacks" (blocked by Layer 5 & Wallet Security)
- **Top-Right:** "DDoS Attacks" (blocked by Layer 4 & Rate Limiting)
- **Right:** "Man-in-the-Middle" (blocked by Layer 3 & TLS)
- **Bottom-Right:** "SQL Injection" (blocked by Layer 3 & Validation)
- **Bottom:** "Smart Contract Exploits" (blocked by Layer 2 & Audits)
- **Bottom-Left:** "Unauthorized Access" (blocked by Layer 2 & RBAC)
- **Left:** "Data Tampering" (blocked by Layer 2 & Blockchain Immutability)
- **Top:** "Replay Attacks" (blocked by Layer 3 & Challenge Nonce)

Each threat has an arrow pointing toward the circles but being stopped at the relevant layer.

### Security Principles (Corner annotations):

**Top-Right Corner:** "Defense in Depth"

- Multiple security layers
- No single point of failure
- Layered redundancy

**Bottom-Right Corner:** "Principle of Least Privilege"

- Minimal access rights
- Role-based restrictions
- Need-to-know basis

**Bottom-Left Corner:** "Zero Trust Architecture"

- Verify every request
- Never assume trust
- Continuous validation

**Top-Left Corner:** "Cryptographic Foundation"

- End-to-end encryption
- Digital signatures
- Tamper-evident logs

### Visual Notes:

- Use gradient colors from center (dark) to outer (light) showing increasing exposure
- Add small icons for each security mechanism
- Draw arrows showing threat vectors being blocked at appropriate layers
- Use semi-transparent layers to show all layers simultaneously
- Add small lock icons at layer boundaries
- Make the diagram radial/circular to emphasize comprehensive protection
- Use red for threats, green for protections, yellow for warnings

---

## Additional Diagram Notes:

### General Design Guidelines for All Figures:

1. **Color Palette:**

   - Primary: Blue (#3B82F6) for frontend/UI elements
   - Secondary: Green (#10B981) for backend/services
   - Accent: Orange (#F59E0B) for blockchain components
   - Neutral: Gray (#6B7280) for databases/external systems
   - Warning: Red (#EF4444) for errors/security threats
   - Success: Green (#22C55E) for validations/success states

2. **Typography:**

   - Titles: Bold, 14-16pt
   - Labels: Regular, 10-12pt
   - Annotations: Italic, 8-10pt
   - Monospace for addresses/hashes

3. **Icons:**

   - Use consistent icon library (e.g., Lucide, Heroicons)
   - Size: 16x16px or 24x24px depending on context
   - Place icons to the left of labels

4. **Spacing:**

   - Maintain consistent padding (8-16px) inside containers
   - Use adequate white space between components
   - Align related elements on grid

5. **Arrows:**

   - Solid: Synchronous calls/requests
   - Dashed: Asynchronous calls/responses
   - Thick: High-bandwidth/critical paths
   - Color-code by data type

6. **Containers:**
   - Rounded corners (8px radius)
   - Subtle shadows for depth
   - Clear borders (1-2px)
   - Background opacity ~80% for nested layers

### Export Settings:

- **Format:** PNG (high-resolution, 300dpi) or SVG (vector)
- **Size:** Width ~1200-1600px for journal publication
- **Background:** White or transparent
- **File Naming:** `Figure_X_Description.png`

---

## Summary:

This document provides complete specifications for all 10 figures:

1. **Figure 1:** High-Level System Architecture (4-layer system overview)
2. **Figure 2:** GoQuorum Network Topology (3-node QBFT network)
3. **Figure 3:** Backend Service Architecture (NestJS module structure)
4. **Figure 4:** Frontend Architecture (Next.js component hierarchy)
5. **Figure 5:** Authentication Flow (sequence diagram, 21 steps)
6. **Figure 6:** Backend Layer Architecture (5-layer detailed breakdown)
7. **Figure 7:** Frontend Component Architecture (component tree)
8. **Figure 8:** Certificate Issuance Sequence (7 actors, 22 steps)
9. **Figure 9:** Audit Trail Timeline (horizontal event timeline)
10. **Figure 10:** Multi-Layer Security (concentric circles, 5 layers)

Each specification includes:

- Diagram type and layout
- All components/nodes with labels
- Connections and relationships
- Visual styling notes
- Annotations and legends

You can now create these diagrams in draw.io following these specifications!
