# Task 8 - Registers API Fixer

## Summary
Fixed the registers API route (`/api/registers/route.ts`) and the auto-registers component (`/components/auto-registers.tsx`) to use correct Prisma model references, field names, and proper error handling.

## Changes Made

### 1. `/src/app/api/registers/route.ts`

**Critical Fixes:**
- **bank-book**: Removed invalid `include: { bankAccountId: true }` — `bankAccountId` is a scalar String field, not a relation. This was causing Prisma query errors.
- **demand-register**: 
  - Added missing `payments: true` to the Namuna9 include — without this, `d.payments` was always `undefined`, causing `totalPaid` and `outstanding` to be 0.
  - Added `owner: true` to the property include per the standard PropertyMaster include pattern.
  - Fixed `d.property.propertyNumber` → `d.property.propertyNo` (PropertyMaster has `propertyNo`, not `propertyNumber`).
  - Added `Array.isArray(d.payments)` validation before accessing payments data.
  - Added fallback to `prop.ownerName` / `prop.ownerNameMr` when no PropertyOwnerMaster records exist.
- **collection-register**: 
  - Fixed `prop?.propertyNumber` → `prop?.propertyNo` (correct field name in PropertyMaster).
  - Added `owner: true` to property include.
  - Added fallback to `prop.ownerName` when no PropertyOwnerMaster records exist.
- **payment-register**: Changed `orderBy: { paymentDate: 'asc' }` → `orderBy: { voucherDate: 'asc' }` (PaymentEntry uses `voucherDate`).
- **asset-register**: Added `where: fyFilter` to apply financial year filtering (was missing).
- **stock-register**: Added `where: fyFilter` to apply financial year filtering (was missing).

**Error Handling:**
- Added `safeQuery()` helper function that wraps each database query in try/catch and returns empty fallback data on failure.
- All 9 register types now use `safeQuery()` for their database operations.
- Empty arrays are returned on query failure instead of crashing with a 500 error.
- Bank account and property detail queries are also wrapped in `safeQuery()`.
- Added date comparison safety with `instanceof Date` checks before calling `toISOString()`.

### 2. `/src/components/auto-registers.tsx`

**Data Validation Fixes:**
- Replaced `data?.rows || []` with explicit `Array.isArray(data?.rows) ? data.rows : []` for `rawRows`.
- `filteredRows` now derived from `rawRows` which is guaranteed to be an array.
- Column keys: Added `Array.isArray(data?.rows) && data.rows.length > 0` check before `Object.keys()`.
- Headers validation: Added `Array.isArray(data?.headers)` check before iterating.
- Totals object: Added `data.totals || {}` fallback to prevent iteration errors on undefined.
- CSV export: Added `Array.isArray(filteredRows)` guard and `Array.isArray(data.headers)` check.
- Summary cards generic case: Added `Object.entries(t || {})` safety for iteration.
- Table rendering: Changed `data.headers || []` to `Array.isArray(data.headers) ? data.headers : []`.

## No Schema Changes
The Prisma schema was NOT modified. All fixes were made in the API route and component code to match the existing schema.
