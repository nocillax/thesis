# Development Rules (rules.md)

These rules apply to ALL backend, frontend, and blockchain code. Follow them strictly.

## 1. Code Simplicity

- Keep code as simple as possible. Avoid unnecessary abstraction.
- Avoid complex validation chains — use built-in validators (DTOs, Guards, decorators).
- Do NOT implement features no one asked for. (Follow YAGNI.)
- Keep functions small and readable.

## 2. Best Practices

- Follow DRY (Don’t Repeat Yourself).
- Follow KISS (Keep It Simple, Stupid).
- Follow SOLID at a light, practical level (clarity > over-engineering).
- Use standard libraries/tools instead of building custom ones (e.g., use JWT, bcrypt, ethers.js, TypeORM).

## 3. Code Structure

- Always use modular architecture.
- Separate concerns: controllers → services → repositories.
- For blockchain: clean separation between backend API → blockchain service → contract interactions.
- Keep folder structure predictable and minimal.

## 4. Comments

- Only comment code that is:
  - Non-obvious
  - Cryptography-related logic
  - Unique to this project
  - Has a workaround worth documenting
- Do NOT comment basic code (“this function returns X”).

## 5. UI/Frontend Rules

- Use clean + minimalism (Tailwind, shadcn, Radix UI).
- One consistent color system (light/dark mode support).
- Use responsive layout and semantic HTML.
- Reusable components for:
  - form inputs
  - table/list views
  - alerts/toasts
  - navbar/footer
- Keep UX flow extremely simple — no popups unless necessary.

## 6. API & Security

- Keep JWT guard + Role guard only.
- DTO validation where appropriate, nothing beyond that.
- Backend must always return consistent JSON structure.
- Do not introduce unnecessary layers like overly complex middlewares.

## 7. Blockchain Rules

- Use ethers.js.
- Keep contract small and focused.
- No complicated inheritance or multi-contract systems.
- Use readable variable names.
- Emit clear events for major operations.

## 8. Don’t Reinvent the Wheel

- If a library already solves a problem cleanly, use it.
- Examples:
  - JWT instead of custom tokenization
  - TypeORM instead of raw query builders
  - Ethers.js instead of manually encoding transactions

## 9. Testing & Debugging

- Minimal unit tests for critical functions ONLY.
- No need for large complicated test suites.

## 10. Output Format

- Use .ts for backend.
- Use .sol for blockchain.
- Use .tsx for frontend Next.js pages/components.
