# Chapter 5: Experimental Results & Analysis - Structured Outline

**Purpose:** Present empirical findings from comparative experiments on centralized (PostgreSQL) vs blockchain (Quorum) certificate verification systems.

---

## 5.1 Introduction to Experimental Results

**Content:**

- Brief recap of research questions and experimental objectives (2-3 sentences)
- Overview of 7 experiments conducted (Phases 0-7 from methodology)
- Summary of data collection approach (Node.js scripts, JSON logs, statistical tools)
- Structure of this chapter (what reader can expect in each section)

**Visuals:** None (introductory text only)

**Analysis Notes:**

- Reference back to methodology chapter for experimental procedures
- Set expectations: "This chapter presents quantitative results followed by comparative analysis"
- Mention reproducibility: experiments repeated 3 times, aggregate results presented

---

## 5.2 Baseline Performance Characteristics (Phase 0)

### 5.2.1 System Resource Utilization at Rest

**Content:**

- CPU, RAM, disk I/O for both systems during idle state
- Establish normal operating parameters before introducing load

**Visuals:**

- **Table 5.1:** System resource comparison (Centralized vs Blockchain)
  - Columns: System, CPU%, Memory (MB), Disk I/O (MB/s), Network (KB/s)
- **Figure 5.1:** Stacked bar chart showing resource distribution across components
  - Centralized: NestJS backend + PostgreSQL
  - Blockchain: NestJS backend + 4 Quorum validators + RPC node

**Analysis Notes:**

- Blockchain has higher baseline resource usage (4 validators vs 1 database)
- Quantify overhead: "Blockchain system consumes X% more RAM but distributes load across nodes"
- Discuss trade-off: resource cost vs fault tolerance benefits

---

### 5.2.2 Certificate Issuance Latency (Normal Conditions)

**Content:**

- Response time for issuing certificates under no load (10 samples each)
- Measure end-to-end latency: API request → database/blockchain write → response

**Visuals:**

- **Table 5.2:** Latency statistics for certificate issuance
  - Columns: System, Mean (ms), Median (ms), SD, Min, Max, p95, p99
- **Figure 5.2:** Box plot comparison (centralized vs blockchain)
  - Show outliers, quartiles, median line

**Analysis Notes:**

- Expected result: Centralized faster (10-50ms) vs Blockchain slower (~5-7 seconds due to IBFT block time)
- Explain blockchain latency: "Finality requires consensus among 3/4 validators"
- Reference IBFT block time from genesis.json configuration
- Statistical test: Mann-Whitney U test (likely non-normal distribution)
- Report effect size (Cohen's d): magnitude of difference, not just significance

---

### 5.2.3 Certificate Verification Latency (Normal Conditions)

**Content:**

- Response time for verifying existing certificates (100 samples each)
- Read-only operations (SELECT vs smart contract view function)

**Visuals:**

- **Table 5.3:** Latency statistics for certificate verification
  - Same structure as Table 5.2
- **Figure 5.3:** Histogram overlay (centralized in blue, blockchain in orange)
  - Shows latency distribution patterns

**Analysis Notes:**

- Both operations are fast (read-only, no consensus needed for blockchain)
- Centralized: Database indexed queries (5-20ms expected)
- Blockchain: RPC call to view function (50-200ms expected)
- Discuss why blockchain reads are slower: network overhead, contract execution
- Compare to literature: cite similar blockchain read performance studies

---

## 5.3 Experiment 1: Forgery Attack Detection (Phase 1)

### 5.3.1 Detection Rate for Fake Identifiers

**Content:**

- Results from submitting 50 random UUIDs (centralized) and 50 random hashes (blockchain)
- Binary outcome: detected (404/400 error) vs undetected (200 OK with fake data)

**Visuals:**

- **Table 5.4:** Forgery detection summary
  - Columns: System, Total Attempts, Detected, Undetected, Detection Rate (%), 95% CI
- **Figure 5.4:** Side-by-side bar chart with error bars (CI)
  - X-axis: System, Y-axis: Detection Rate %

**Analysis Notes:**

- Expected: Both systems 100% detection (UUIDs/hashes don't exist in DB/blockchain)
- Statistical test: Chi-square (but likely no difference to test if both are 100%)
- Key point: "Both systems correctly reject non-existent identifiers"
- Differentiation: Blockchain adds cryptographic proof (hash verification), centralized relies on DB lookup only

---

### 5.3.2 Malformed Input Handling

**Content:**

- Results from submitting 10 malformed inputs (empty string, SQL injection payloads, XSS attempts)
- Tests input validation layer

**Visuals:**

- **Table 5.5:** Malformed input test results
  - Columns: Input Type, Centralized Response, Blockchain Response, Status Code
  - Rows: Empty string, SQL injection (`' OR 1=1--`), XSS (`<script>`), Negative CGPA, etc.

**Analysis Notes:**

- Both systems should reject via validation layer (NestJS DTO validators)
- Check if any payloads cause different behavior (error messages, logging)
- Security note: TypeORM protects against SQL injection via parameterized queries
- Discuss defense-in-depth: validation at API layer prevents malicious data from reaching DB/blockchain

---

### 5.3.3 Detection Latency for Invalid Requests

**Content:**

- How long it takes to reject forged/malformed requests
- Measures efficiency of validation/lookup

**Visuals:**

- **Table 5.6:** Detection latency comparison
  - Columns: System, Mean (ms), Median, p95
- **Figure 5.5:** Box plot showing detection time distribution

**Analysis Notes:**

- Centralized: Fast DB lookup → 404 (expect 5-20ms)
- Blockchain: Contract call → revert (expect 50-150ms)
- Discuss: "Blockchain detection slightly slower but provides cryptographic certainty"

---

## 5.4 Experiment 2: Data Tampering Simulation (Phase 2)

### 5.4.1 Centralized Database Tampering

**Content:**

- Results of directly modifying PostgreSQL data (CGPA, issuance_date)
- Verify API returns tampered data (proves mutability)

**Visuals:**

- **Table 5.7:** Centralized tampering test
  - Columns: Certificate ID, Original CGPA, Tampered CGPA, API Response CGPA, Tamper Success
  - Show 5-10 sample rows
- **Figure 5.6:** Before/After comparison (bar chart or table visualization)

**Analysis Notes:**

- **Critical finding:** 100% tamper success (all modifications reflected in API responses)
- Discuss vulnerability: "Admin with database access can rewrite certificate data without detection"
- Check audit logs: Were audit entries also modified? (If yes, proves audit trail is mutable)
- Security implication: Centralized systems require external audit mechanisms (backups, write-once logs)

---

### 5.4.2 Blockchain Tamper Resistance

**Content:**

- Results of attempting to verify altered certificate data
- Recompute hash with modified CGPA → try to verify → should fail

**Visuals:**

- **Table 5.8:** Blockchain tampering test
  - Columns: Original Hash, Altered Data, Recomputed Hash, Verification Result, Tamper Detected
- **Figure 5.7:** Flowchart showing tamper detection mechanism
  - Original data → Hash A → Stored on-chain
  - Altered data → Hash B → Lookup fails (cert_exists[Hash B] == false)

**Analysis Notes:**

- **Critical finding:** 0% tamper success (all attempts detected via hash mismatch)
- Explain immutability: "Once recorded on blockchain, data cannot be modified; any alteration invalidates cryptographic proof"
- Compare to centralized: "Blockchain provides built-in tamper detection; centralized requires external verification"
- Discuss practical implications for certificate systems: trust in data integrity

---

### 5.4.3 Audit Log Integrity Comparison

**Content:**

- Can audit logs themselves be tampered with?
- Centralized: Modify audit_logs table entries
- Blockchain: Verify events cannot be altered

**Visuals:**

- **Table 5.9:** Audit trail tampering test
  - Columns: System, Audit Tampering Attempted, Tamper Success, Detection Method
- **Figure 5.8:** Diagram showing audit architecture differences
  - Centralized: audit_logs table (same DB, mutable)
  - Blockchain: CertificateIssued/Revoked events (immutable, part of block)

**Analysis Notes:**

- **Key differentiation:** Centralized audit logs vulnerable (same attack surface as data)
- Blockchain: Audit trail is cryptographically sealed in blocks (part of consensus)
- Discuss: "Even if certificate data is questioned, blockchain provides verifiable history"
- Reference literature: cite blockchain audit trail advantages (supply chain, healthcare studies)

---

## 5.5 Experiment 3: Node Failure & Availability (Phase 3)

### 5.5.1 Single Point of Failure (Centralized)

**Content:**

- Results of stopping PostgreSQL database
- Measure time to first failed request, system downtime

**Visuals:**

- **Table 5.10:** Centralized failure test
  - Columns: Event, Timestamp, System Status, Request Success Rate
  - Rows: Baseline, DB stopped (t=60s), Requests failing (t=61s), DB restarted (t=180s), Service restored (t=185s)
- **Figure 5.9:** Timeline graph showing availability over time
  - X-axis: Time (seconds), Y-axis: Request success rate (%)

**Analysis Notes:**

- Expected: Immediate 100% failure (database is single point of failure)
- Calculate MTTF (Mean Time To Failure): Time from DB stop to first 500 error
- Calculate MTTR (Mean Time To Recovery): Time from DB restart to first successful request
- Discuss: "Centralized architecture vulnerable to single component failure"

---

### 5.5.2 Byzantine Fault Tolerance (Blockchain)

**Content:**

- Results of stopping 1 validator (3/4 remain → quorum maintained)
- Results of stopping 2 validators (2/4 remain → quorum lost)

**Visuals:**

- **Table 5.11:** Blockchain failure test
  - Columns: Validators Active, Quorum Status, Request Success Rate, Latency Impact
  - Rows: 4/4 (baseline), 3/4 (1 stopped), 2/4 (2 stopped), 4/4 (recovery)
- **Figure 5.10:** Availability comparison chart
  - X-axis: Failure scenario (Centralized DB down, 1 validator down, 2 validators down)
  - Y-axis: Availability %
  - Color code: Green (operational), Red (failed)

**Analysis Notes:**

- Expected: System continues with 3/4 validators (BFT threshold f=1, need 2f+1=3)
- Expected: System halts with 2/4 validators (below consensus threshold)
- Discuss resilience: "Blockchain tolerates single node failure without service disruption"
- Compare MTTR: Centralized requires DB restart, blockchain self-heals when validator returns

---

### 5.5.3 Recovery Time Analysis

**Content:**

- Time to restore full functionality after node recovery
- Measure transaction backlog processing (if any)

**Visuals:**

- **Table 5.12:** Recovery metrics comparison
  - Columns: System, Failure Duration (s), MTTR (s), Backlog Transactions, Recovery Success
- **Figure 5.11:** Bar chart comparing MTTR (centralized vs blockchain)

**Analysis Notes:**

- Blockchain: Validators sync state automatically (consensus protocol)
- Centralized: Database must restart, check for corruption, rebuild connections
- Discuss operational implications: maintenance windows, planned vs unplanned downtime

---

## 5.6 Experiment 4: Replay Attack (JWT Token Reuse) (Phase 4)

### 5.6.1 Token Expiration Enforcement

**Content:**

- Results of attempting to reuse JWT token after expiration/logout
- Tests authentication layer security (identical in both systems)

**Visuals:**

- **Table 5.13:** Replay attack test results
  - Columns: System, Token Status (Valid/Expired/Invalidated), Request Outcome, HTTP Status
- **Figure 5.12:** Sequence diagram showing attack flow
  - Login → Token issued → Logout → Replay attempt → 401 Unauthorized

**Analysis Notes:**

- Expected: Both systems reject expired/invalidated tokens (same JWT implementation)
- **Key finding:** Blockchain doesn't inherently solve application-layer security
- Discuss defense mechanisms: JWT expiration time, token blacklisting (if implemented)
- Security lesson: "Blockchain provides data integrity, but authentication still requires traditional security controls"

---

### 5.6.2 Time Window Vulnerability

**Content:**

- If tokens remain valid for X minutes after logout, measure vulnerability window
- Test if token blacklisting is implemented

**Visuals:**

- **Table 5.14:** Token lifetime analysis
  - Columns: System, JWT Expiration (minutes), Logout Invalidation, Vulnerability Window

**Analysis Notes:**

- Check if logout endpoint exists and invalidates tokens
- Discuss: "Both systems share same authentication vulnerability profile"
- Recommendation: Implement token blacklisting or short expiration times

---

## 5.7 Experiment 5: Audit Trail Integrity (Phase 5)

### 5.7.1 Audit Log Modification Success Rate

**Content:**

- Consolidates findings from Experiment 2 (Section 5.4.3) with additional detail
- Focus on ability to rewrite history (change action types, timestamps, actors)

**Visuals:**

- **Table 5.15:** Audit integrity test summary
  - Columns: System, Modification Attempts, Successful Modifications, Detection Mechanism
- **Figure 5.13:** Comparative architecture diagram
  - Centralized: Audit logs in mutable database (red warning icon)
  - Blockchain: Audit events in immutable blocks (green checkmark)

**Analysis Notes:**

- **Core thesis contribution:** Demonstrates blockchain's audit trail advantage
- Centralized: Audit logs can be modified after the fact (erasing evidence)
- Blockchain: Events are part of consensus, cannot be altered without invalidating entire chain
- Real-world implication: Regulatory compliance (GDPR, SOX) requires audit integrity
- Cite literature: blockchain audit applications (supply chain transparency, financial records)

---

### 5.7.2 Audit Completeness Verification

**Content:**

- Can audit records be deleted? (Centralized: yes, Blockchain: no)
- Test if all operations are logged consistently

**Visuals:**

- **Table 5.16:** Audit completeness comparison
  - Columns: System, Total Operations, Logged Operations, Missing Logs, Completeness %

**Analysis Notes:**

- Centralized: Audit logging depends on application code (can be bypassed)
- Blockchain: Events are emitted by smart contract (guaranteed by protocol)
- Discuss: "Blockchain provides cryptographic proof of audit completeness"

---

## 5.8 Experiment 6: Concurrent Transaction Performance (Phase 6)

### 5.8.1 Throughput Under Increasing Load

**Content:**

- Results of issuing certificates with 10, 25, 50 concurrent requests
- Measure transactions per second (TPS) at each concurrency level

**Visuals:**

- **Table 5.17:** Throughput comparison
  - Columns: Concurrency Level, Centralized TPS, Blockchain TPS, Success Rate (%)
- **Figure 5.14:** Line graph showing TPS vs concurrency
  - X-axis: Concurrent requests, Y-axis: Throughput (TPS)
  - Two lines: Centralized (higher, steeper decline), Blockchain (lower, flatter)

**Analysis Notes:**

- Expected: Centralized higher initial TPS (100-200), degrades sharply with connection pool exhaustion
- Expected: Blockchain lower TPS (20-50), remains consistent (consensus bottleneck, not load-dependent)
- Discuss scalability: "Centralized scales vertically (add CPU/RAM), blockchain scales with network size"
- Statistical test: Two-way ANOVA (System × Concurrency → Throughput)

---

### 5.8.2 Latency Degradation Analysis

**Content:**

- How response time changes as concurrency increases
- Identify saturation points (when latency spikes)

**Visuals:**

- **Table 5.18:** Latency under load
  - Columns: Concurrency Level, Centralized p50/p95/p99 (ms), Blockchain p50/p95/p99 (ms)
- **Figure 5.15:** Box plot grid (3×2: concurrency levels × systems)
  - Shows latency distribution at each concurrency level

**Analysis Notes:**

- Centralized: Latency increases exponentially after connection pool limit
- Blockchain: Latency remains stable (limited by block time, not concurrent load)
- Discuss predictability: "Blockchain offers more consistent performance under variable load"

---

### 5.8.3 Error Rate and Failure Modes

**Content:**

- % of requests that fail (timeout, 500 error, connection refused)
- Identify failure thresholds

**Visuals:**

- **Table 5.19:** Error rates by concurrency
  - Columns: Concurrency Level, Centralized Errors (%), Blockchain Errors (%)
- **Figure 5.16:** Stacked bar chart showing success/failure breakdown

**Analysis Notes:**

- Centralized: Errors increase as connection pool depletes
- Blockchain: Errors remain low (transactions queued in mempool)
- Discuss failure modes: Database connection limit vs blockchain gas limit per block

---

## 5.9 Experiment 7: Certificate Versioning (Phase 7 - Optional)

### 5.9.1 Version History Retrieval

**Content:**

- Test retrieval of all certificate versions for a student
- Measure completeness and access time

**Visuals:**

- **Table 5.20:** Version history comparison
  - Columns: System, Student ID, Versions Found, Revoked Visible?, Retrieval Time (ms)
- **Figure 5.17:** Timeline visualization showing certificate versions
  - V1 (issued) → V1 (revoked) → V2 (issued)

**Analysis Notes:**

- Blockchain: Native versioning via `student_to_latest_version` mapping
- Centralized: Depends on implementation (soft delete with `is_revoked` flag or hard delete)
- Discuss use case: "Version history enables audit of credential changes over time"

---

### 5.9.2 Storage Overhead for Versioning

**Content:**

- Measure storage consumed by version history
- Compare database row count vs blockchain state size

**Visuals:**

- **Table 5.21:** Storage overhead comparison
  - Columns: System, Total Certificates, Total Versions, Storage Used (MB), Overhead per Version (KB)

**Analysis Notes:**

- Blockchain: Each version is full certificate record (higher storage)
- Centralized: Versions may share common data (lower storage if designed well)
- Trade-off: Storage cost vs completeness of historical record

---

## 5.10 Statistical Significance Summary

### 5.10.1 Hypothesis Testing Results

**Content:**

- Summary table of all statistical tests performed
- Report p-values, effect sizes, confidence intervals

**Visuals:**

- **Table 5.22:** Statistical test summary
  - Columns: Comparison, Test Used, Test Statistic, p-value, Effect Size (Cohen's d / OR), Significance
  - Rows: Each hypothesis tested (e.g., "H1: Blockchain verification slower than centralized")

**Analysis Notes:**

- Interpret p-values: p < 0.05 indicates statistically significant difference
- Interpret effect sizes: Cohen's d (0.2 small, 0.5 medium, 0.8 large)
- Bonferroni correction if multiple comparisons (adjust α = 0.05 / number of tests)
- Discuss practical significance vs statistical significance: "Large effect size indicates meaningful real-world difference"

---

### 5.10.2 Confidence Intervals and Uncertainty

**Content:**

- Report 95% confidence intervals for key metrics
- Discuss measurement uncertainty and reproducibility

**Visuals:**

- **Figure 5.18:** Forest plot showing effect sizes with confidence intervals
  - X-axis: Effect size, Y-axis: Comparison type
  - Error bars showing 95% CI

**Analysis Notes:**

- Narrow CI indicates precise measurement, wide CI indicates high variability
- Discuss reproducibility: "Experiments repeated 3 times with consistent results"

---

## 5.11 Cross-Experiment Synthesis

### 5.11.1 Security vs Performance Trade-offs

**Content:**

- Synthesize findings across experiments
- Blockchain advantages: immutability, fault tolerance, audit integrity
- Blockchain disadvantages: higher latency, lower throughput

**Visuals:**

- **Figure 5.19:** Radar chart comparing systems across dimensions
  - Axes: Security, Availability, Performance, Scalability, Audit Integrity
  - Two overlays: Centralized (blue), Blockchain (orange)

**Analysis Notes:**

- "Blockchain sacrifices performance for security guarantees"
- "Centralized offers speed but requires trust in single authority"
- Discuss context-dependent choices: high-security use cases vs high-throughput scenarios

---

### 5.11.2 Alignment with Literature Findings

**Content:**

- Compare results to prior blockchain studies (cite literature review)
- Confirm or contradict expected outcomes

**Visuals:**

- **Table 5.23:** Literature comparison
  - Columns: Finding, This Study, Prior Study A (citation), Prior Study B (citation), Agreement?

**Analysis Notes:**

- "Our latency findings align with [Author, Year] who reported similar IBFT block times"
- "Our throughput results differ from [Author, Year] due to different consensus mechanisms (IBFT vs PoW)"
- Discuss unique contributions: audit trail tampering test, concurrent load comparison

---

## 5.12 Limitations of Experimental Results

**Content:**

- Acknowledge experimental constraints
- Small network size (4 validators), localhost latency, synthetic data
- No testing of cryptographic attacks, side-channels, or advanced threats

**Visuals:** None (text discussion)

**Analysis Notes:**

- "Results generalize to small consortium blockchains, not public networks"
- "Latency measurements exclude network latency (Docker localhost = 0ms)"
- "Future work should test geo-distributed nodes and larger transaction volumes"

---

## 5.13 Chapter Summary

**Content:**

- Recap key findings from each experiment (bullet list)
- Preview transition to discussion chapter (interpretation, implications)

**Visuals:** None (summary text)

**Analysis Notes:**

- Emphasize most impactful findings: audit integrity, tamper resistance, availability trade-offs
- Set up discussion: "These quantitative results provide foundation for evaluating blockchain suitability for certificate verification systems"

---

## Meta-Notes for Writing Chapter 5

### Data Presentation Guidelines:

1. **Tables:** Use for precise numerical data, statistical test results
2. **Bar charts:** Use for categorical comparisons (detection rates, success rates)
3. **Box plots:** Use for latency distributions (show outliers, quartiles)
4. **Line graphs:** Use for trends over time or load (throughput vs concurrency)
5. **Diagrams/Flowcharts:** Use for conceptual explanations (tamper detection mechanism)

### Analysis Flow for Each Section:

1. **Present raw results** (tables, figures)
2. **Interpret findings** (what do numbers mean?)
3. **Compare systems** (centralized vs blockchain)
4. **Statistical validation** (p-values, effect sizes)
5. **Relate to literature** (cite similar studies)
6. **Discuss implications** (practical significance)

### Writing Tips:

- Use past tense ("The centralized system achieved...")
- Report exact values with precision ("Mean latency: 5.23ms ± 0.15ms")
- Avoid speculation in results chapter (save for discussion)
- Label all figures/tables consistently
- Cross-reference tables/figures in text ("As shown in Figure 5.2...")

### Statistical Reporting Standards:

- Always report: sample size (n), mean, SD, test statistic, p-value, effect size
- Example: "Blockchain latency (M = 5234ms, SD = 245ms) was significantly higher than centralized (M = 23ms, SD = 5ms), t(98) = 47.3, p < .001, d = 3.2"
- Report exact p-values unless p < .001

---

**This outline provides a complete structure for Chapter 5. Fill in actual data from experiments, create visuals using Python (matplotlib/seaborn) or R (ggplot2), and follow the analysis guidance for each section.**
