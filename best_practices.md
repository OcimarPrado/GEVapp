# 📘 Project Best Practices

## 1. Project Purpose
GEV App is a simple sales and inventory management system (Gestão Empresarial de Vendas) designed for small businesses. It consists of:
- A mobile frontend built with React Native (Expo + TypeScript)
- A Node.js/Express backend using SQLite for persistence, with product management, sales registration, simple reports, image uploads, and basic authentication flows (register, login, password reset).

## 2. Project Structure
- Root
  - backend/
    - server.js: Single-file Express server, REST API under /api, SQLite DB initialization, file uploads via Multer, auth endpoints, product and sales endpoints, simple reports and backup endpoints
    - package.json: Backend dependencies and scripts
    - uploads/: Directory for uploaded images (served at /uploads)
    - gev_app.db: SQLite database file
  - frontend/
    - App.tsx: App entry with NavigationContainer and stack navigator
    - app/
      - api/index.ts: Axios client configuration and API wrappers (partial usage across app)
      - components/: Reusable UI components (e.g., ProductItem, SaleItem)
      - navigation/AppNavigator.tsx: Optional central navigator (some routes defined here too)
      - screens/: Screens for Dashboard, Products, NewProduct, NewSale, SalesHistory, Auth, etc.
      - utils/debug.ts: Debug helpers, backend URL resolution, configuration, common utilities
    - assets/, constants/, hooks/: Additional RN/Expo app scaffolding
    - package.json: Expo RN app dependencies and scripts
  - uploads/: Publicly served uploaded product images (also mirrored inside backend/uploads)
  - README.md: Top-level information

Notes:
- The frontend currently mixes two navigator definitions: App.tsx (primary) and app/navigation/AppNavigator.tsx (defined but not wired in App.tsx). Prefer a single source for navigation.
- The API consumption mixes centralized axios client (app/api/index.ts) and raw fetch() calls with hardcoded base URLs. Centralize on a single API layer.

## 3. Test Strategy
Current status: No tests are present.

Recommended strategy:
- Frontend
  - Unit/UI: @testing-library/react-native for components and screens
  - Utilities: Jest unit tests for functions in utils/debug.ts (e.g., formatting/validation helpers)
  - Navigation flows: Use mocks for react-navigation to test basic flows
- Backend
  - Unit: Jest for pure functions (e.g., helpers for validation)
  - Integration/API: supertest to test Express routes (products, sales, auth)
  - DB: Use a temporary SQLite database per test run (in-memory SQLITE ':memory:')
- General
  - Use a __tests__ folder colocated per package (frontend/backend) or colocate test files next to source files with *.test.ts(x)/.test.js
  - Aim for coverage on core flows: product CRUD, sale registration (stock decrement), auth flows, and basic error handling
  - Mock network and file uploads in frontend tests

## 4. Code Style
- Languages
  - Frontend: TypeScript with React Native functional components and hooks
  - Backend: Node.js (CommonJS). Prefer async/await over nested callbacks where possible
- Naming
  - Files: PascalCase for React components/screens (ProductItem.tsx, ProductsScreen.tsx)
  - Variables/functions: camelCase
  - Components: PascalCase
  - Routes: snake_case in DB schema; consistent kebab/snake in API paths
- State and data
  - Type interfaces for props/data models in TS files
  - Keep local component state minimal and derived values computed memoized when needed
- API calls
  - Use a single axios instance (app/api/index.ts) with baseURL from getBackendUrl()
  - Do not hardcode 'http://localhost:3000' in screens/components; derive from utils/debug.getBackendUrl() (or .env)
  - Handle errors with try/catch and return consistent shapes
- Logging and debugging
  - Use utils/debug.ts (debugLog, errorLog, showError, showSuccess, runDiagnostics)
  - Gate debug UI/actions behind __DEV__
- Styling
  - React Native StyleSheet.create with consistent spacing, elevation/shadows
- Error handling
  - Frontend: Standardize user-friendly error alerts via showError/showSuccess
  - Backend: Return JSON with { success: boolean, data?, error?, message? }; use proper status codes (400, 404, 500)
- Data validation
  - Frontend: Validate inputs before requests (numbers, required fields)
  - Backend: Validate request bodies and files (types/sizes) before DB ops
- Currency and numbers
  - Prefer integer cents or a decimal library for price math; avoid floating errors from toFixed()/binary floats

## 5. Common Patterns
- Frontend
  - Functional components with hooks (useState/useEffect/useCallback/useFocusEffect)
  - Centralized helpers for formatting (formatCurrency), validation, and debug utilities
  - Pull-to-refresh via RefreshControl; optimistic UI where reasonable
  - Navigation via react-navigation with typed route params
  - FormData + multipart uploads for product images
  - Axios interceptors for logging requests/responses
- Backend
  - Express single app with middleware: cors, express.json, static /uploads
  - Multer diskStorage for product image uploads to uploads/produtos
  - SQLite schema initialization on startup (users, produtos, vendas, vendas_itens)
  - Stock decrement on sale creation; simple reports endpoints
  - Password reset token generation stored in DB with expiry

## 6. Do's and Don'ts
- Do
  - Centralize API base URL and calls in app/api/index.ts; use getBackendUrl() for all network requests
  - Keep request/response shapes consistent across app and server
  - Validate and sanitize inputs on both client and server
  - Use proper status codes and structured error messages from the backend
  - Add file type/size validation for uploads; clean up old images when replacing a product image
  - Add missing backend dependencies (bcrypt is used in server.js but is not declared in backend/package.json)
  - Implement environment-based configuration (.env) for server port and database path; hydration for frontend base URL
  - Extract Express routers by domain (auth, produtos, vendas, relatorios) as app grows
  - Use async/await with sqlite3 via a small promise wrapper or migrate to better-suited libs (better-sqlite3, knex)
  - Add constraints and indexes to DB (e.g., unique product name if desired, foreign keys for vendas_itens)
  - Document API endpoints and align with frontend expectations
- Don't
  - Do not hardcode 'http://localhost:3000' in screens/components; avoid duplicating base URLs across files
  - Do not mix fetch and axios randomly; prefer the centralized axios client to manage headers, timeouts, and logs
  - Do not compute monetary margins with naive floating math; avoid rounding issues
  - Do not silently ignore errors; always surface actionable messages
  - Do not keep multiple navigator definitions out of sync; use one AppNavigator wired through App.tsx

## 7. Tools & Dependencies
- Backend
  - express: HTTP server and routing
  - sqlite3: Embedded database
  - multer: Multipart handling for image uploads
  - cors: CORS headers
  - bcrypt: Password hashing (used in server.js; add to package.json)
  - nodemon (dev)
  - Scripts: npm run start (node server.js), npm run dev (nodemon)
- Frontend (Expo RN)
  - expo, react-native, react-native-web
  - @react-navigation/native, @react-navigation/native-stack, @react-navigation/stack (prefer one stack approach)
  - axios for HTTP
  - @react-native-async-storage/async-storage (present but not yet used broadly)
  - TypeScript, @types/react
  - Scripts: npm run start (expo), npm run android, npm run ios, npm run web

Setup and Run
- Backend
  1) cd backend && npm install
  2) Ensure bcrypt is installed: npm install bcrypt
  3) npm run dev to start on http://localhost:3000
- Frontend
  1) cd frontend && npm install
  2) Configure backend URL in utils/debug.ts (getBackendUrl / AppConfig). For device testing, use your machine IP
  3) npm run start and choose platform

## 8. Other Notes
- API endpoint mismatches and normalization tasks
  - Frontend expects /api/dashboard (DashboardScreen) and /api/relatorios/dashboard (api/index.ts), but backend does not implement these. Either implement endpoints or update the client to use existing ones (/api/relatorios/lucro, /api/vendas, etc.)
  - Backup endpoint: frontend createBackup() uses POST /backup; backend exposes GET /api/backup
  - Sales registration (POST /api/vendas): backend returns { success, message, venda_id }, while NewSaleScreen expects result.data.total and result.data.lucro for the success alert. Align shapes or adapt client
  - Sales listing filters: SalesHistoryScreen queries /api/vendas?periodo=...; backend ignores periodo. Implement filtering or remove param
  - Product image URLs: some places assume http://localhost:3000/...; always compose URLs from getBackendUrl() and expose full URLs from backend responses where possible
- Auth payload mismatches
  - Register/Login screens send { name, email, password }, but backend expects { nome, email, senha }. Align field names and shapes consistently
- Security and robustness
  - Add express-rate-limit, helmet, and input validation (e.g., zod/joi) to mitigate abuse
  - Sanitize filenames and validate MIME types for uploads; consider storing images with hashed names
  - Consider JWT-based auth and protecting endpoints for authenticated users
  - Avoid exposing sensitive tokens in reset password responses; integrate email delivery for password reset links
- Database
  - Consider migrations (e.g., with knex) instead of CREATE TABLE IF NOT EXISTS at startup
  - Add foreign key constraints (vendas_itens.venda_id -> vendas.id, vendas_itens.produto_id -> produtos.id)
- Developer experience
  - Add ESLint/Prettier for both frontend and backend
  - Add tsconfig tweaks (strict true) and consistent path aliases for frontend imports
  - Consolidate navigation into a single source (AppNavigator) and use typed stacks
- For LLM-generated code in this repo
  - Always use app/api/index.ts for HTTP; do not hardcode base URLs
  - Respect existing response envelope { success, data, error, message }
  - Keep UI/UX consistent (colors, spacing, shadow style)
  - Add types for all new components/screens and API payloads
  - Follow existing debug patterns with __DEV__ guards
