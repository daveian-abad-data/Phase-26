# FundingTrack - Project TODO

## Database & Backend
- [x] Database schema: clientProfiles table with all funding fields
- [x] Database schema: clientCredentials table for username/password login
- [x] Backend: admin procedures (list, create, update, delete clients)
- [x] Backend: client procedures (view own profile only)
- [x] Backend: Google Sheets import procedure
- [x] Backend: admin credential management (create/reset client logins)
- [x] Role-based access control (admin vs client)

## Frontend - Auth & Layout
- [x] Elegant landing/login page with brand identity
- [x] Client username/password login form (separate from Manus OAuth)
- [x] DashboardLayout integration for authenticated pages
- [x] Role-based routing (admin vs client views)

## Frontend - Client Portal
- [x] Client profile page with all funding data fields
- [x] Funding progress indicators and status badges
- [x] Read-only data display with elegant card layout

## Frontend - Admin Dashboard
- [x] Admin overview with stats/metrics
- [x] Client list table with search and filter
- [x] Add new client form
- [x] Edit client data modal/form
- [x] Delete client with confirmation
- [x] Client credential management (set username/password)
- [x] Application status update

## Google Sheets Import
- [x] Google Sheets URL/ID input form
- [x] Column mapping interface
- [x] Import preview before committing
- [x] Bulk import execution

## Polish & Testing
- [x] Elegant color palette and typography (deep navy + gold accent)
- [x] Responsive design for all pages
- [x] Vitest unit tests for backend procedures
- [x] Empty states and loading skeletons

## Bug Fixes
- [x] Fix React setState-in-render error: navigate() called during render phase in Home and AdminDashboard
- [x] Fix Rules of Hooks violation in AdminDashboard: trpc hooks called after early return

## Phase 2 - Admin Client Detail Tabs

- [x] DB schema: underwriting table
- [x] DB schema: onboarding checklist items table
- [x] DB schema: credit report + credit accounts table
- [x] DB schema: funding rounds + funding applications table
- [x] DB schema: uploaded files table
- [x] DB schema: call logs table
- [x] Backend: underwriting CRUD routes
- [x] Backend: onboarding checklist CRUD routes
- [x] Backend: credit report CRUD routes
- [x] Backend: funding rounds CRUD routes
- [x] Backend: file upload/list/delete routes
- [x] Backend: call log CRUD routes
- [x] Backend: client profile photo upload route
- [x] UI: Client detail page with tabbed navigation (Home, Underwriting, Onboarding, Credit Reports, Funding, Uploaded Files, Calendar)
- [x] UI: Home Tab - profile card, quick status per section, tier type, total funded, invoice summary, chat mockup
- [x] UI: Underwriting Tab - editable form with all fields
- [x] UI: Onboarding Tab - document checklist with file links + bank relationships checklist
- [x] UI: Credit Reports Tab - editable credit data form + accounts table
- [x] UI: Funding Tab - computed summary tables + editable funding applications rows
- [x] UI: Uploaded Files Tab - file list with category, date, uploader + upload button
- [x] UI: Calendar Tab - call log table + simple calendar view
- [x] Admin can upload client profile photo
- [x] Wire client detail route into AdminDashboard (click client → open detail page)

## UX Fixes
- [x] AdminDashboard: make client rows clickable and add "View Details" button to navigate to 6-tab detail page

## Funding Tab Changes
- [x] Move "Add Application" button to below the Funding Applications table
- [x] Update card status options to: Approved, Conditionally Approved, Pending, Denied (in that order, remove "Approved (I)")

## Funding Timeline Changes
- [x] Replace "Date Client Acquired" with "Date Contract Signed" (from Underwriting tab, read-only)
- [x] "Days (Acquired to Current Date)" → computed as days since Date Contract Signed (live floating formula)

## UI Improvements - Client Focus & Safety
- [x] Add client name + overall status badge to header of every tab (Underwriting, Onboarding, Credit Reports, Funding, Uploaded Files, Calendar)
- [x] Add delete confirmation dialogs to all delete buttons: Funding Applications, Credit Reports, Credit Accounts, Call Logs, Uploaded Files

## Personal Info Tab
- [x] Create new "Personal Info" tab as the first tab in client detail page
- [x] Move all personal information editing (name, email, phone, business, status, FICO, income, etc.) into the new tab
- [x] Remove edit functionality from the Home/Overview tab (keep it read-only/summary only)
- [x] Add Personal Info to the Management Menu on the Overview tab

## Client ID System
- [x] Add clientId field to DB schema (varchar, nullable, unique)
- [x] Auto-generate clientId on client creation: format [Initials]-[MMDDYYYY]-[HHMM]
- [x] Allow admin to manually override clientId in Personal Info tab
- [x] Display clientId as small text under client name in Overview tab header and all tab headers
- [x] Show clientId in Management Menu quick status column

## Client ID Backfill & List Column
- [x] Backfill 6 existing sample clients with generated Client IDs
- [x] Add Client ID column to the main client list table

## Bug Fixes
- [x] Fix getUnderwriting returning undefined instead of null when no record exists (also fixed getClientProfileById, getClientCredentialByUsername, getClientCredentialByProfileId, getClientSessionByToken, getCreditReportById)

## Credit Accounts Restructure (Flat Schema)
- [x] Update credit_accounts schema: add clientId, creditUnion, reportDate, accountName, openClosed, responsibility, accountNumber, dateOpened, statusUpdated, accountType, status, balance, creditLimit, creditUsage, balanceUpdated, originalBalance, paidOff, monthlyPayment, lastPaymentDate, terms, dispute
- [x] Remove old fields: creditorName, currentBalance, accountStatus, paymentStatus, remarks, creditUtilization
- [x] Push schema migration
- [x] Update db helpers and router procedures for new fields (getCreditAccountsByClientId)
- [x] Update CreditReports tab UI: flat table with all 21 columns, Dispute as textarea, accounts loaded by clientId

## Credit Reports Tab - Minor Updates
- [x] Rename "Credit Accounts" subheader to "Accounts"
- [x] Add "Credit Account Category" column to credit_accounts DB schema and UI

## Bug Fixes - Responsive
- [x] Fix tab navigation bar overflow on smaller screens (tabs now scroll horizontally with hidden scrollbar)
- [x] Fix tab navigation text distortion on mobile/zoomed views (outer scroll wrapper + overflow-x-hidden on main layout)
- [x] Fix tab nav horizontal scroll blocked by overflow-x-hidden on parent layout (removed min-w-0 from page wrapper, used -mx-4 px-4 edge-to-edge scroll with touch support)

## Branding - Empower Theme
- [x] Upload Empower logo to CDN
- [x] Update CSS theme to black/grey/white palette (both light and dark modes)
- [x] Replace sidebar logo and app title with Empower branding
- [x] Update accent colors across UI to match brand (primary = black, accent = grey)

## Landing Page Redesign - Metallic Theme
- [x] Redesign Home.tsx with metallic black/white/grey theme
- [x] Use oversized Empower logo as hero background element (6% opacity watermark, right-aligned)
- [x] Remove gold/amber colors, use metallic gradients instead
- [x] Dark hero section with dramatic styling (deep black, metallic sheen lines, radial highlight)

## Recent Changes
- [x] Remove clientId manual-entry field from UI (Personal Info tab, Admin Dashboard table, Overview) — keep auto-generated only
- [x] Fix credit utilization pie chart text color to black (was invisible on dark background)
- [x] Build Client Portal with three read-only tabs: Personal Info, Credit Reports, Funding (no edit access)

## Dashboard & Credit Report Fixes
- [x] Update admin dashboard metrics: Total Clients, Total Funded Clients, Total Funded Amount, Total Billing Amount Issued, Total Billing Amount Collected
- [x] Fix credit utilization text in Credit Report Summary header back to white

## New Features & Fixes (Mar 2026)
- [ ] Fix Credit Report Summary block showing blank/missing for new clients (show empty state with blank fields)
- [ ] Fix Open/Closed Accounts section backgrounds - make lighter
- [ ] Make Open/Closed Accounts label text bold and black
- [ ] Fix Applied Limit figures not saving to database in Funding menu
- [ ] Add Billing menu with billing records table and dashboard metrics
- [ ] Add Client Task menu with task list and metrics header
- [ ] Add Team Task menu with task list and metrics header
- [ ] Update ClientDetail navigation to include new menus
- [ ] Add Billing read-only tab to client portal
- [ ] Add Client Task read-only tab to client portal
