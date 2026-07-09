# Task 2-b: Dashboard Metrics Clickability Fix

## Agent: dashboard-metrics-fixer

## Summary
Fixed the "मुख्य मेट्रिक्स क्लिक होत नाही" (main metrics not clickable) issue by making Financial Summary Cards and Process Flow Steps clickable, fixing view ID mismatches, and adding visual feedback to all clickable elements.

## Changes Made

### `/home/z/my-project/src/components/erp-dashboard.tsx`
1. **Financial Summary Cards** — Added `view` property to each card data object:
   - एकूण उत्पन्न (Income) → `txn-receipt`
   - एकूण खर्च (Expenditure) → `txn-payment`
   - शिल्लक रक्कम (Balance) → `registers-receipt-payment`
   - Converted from static `Card` to clickable Card with `onClick`, `cursor-pointer`, `hover:shadow-xl hover:scale-[1.02]`, `active:scale-[0.98]`, and `ChevronRight` indicator

2. **Key Metrics Grid** — Fixed view ID mismatch:
   - ठेकेदार (Contractors) card: `master-disability` → `master-contractor`
   - Added `active:scale-95`, `group` class, and `ChevronRight` indicator with hover brightness

3. **Process Flow Steps** — Added `view` property to each step:
   - मास्टर एंट्री → `master-village`
   - दैनंदिन एंट्री → `txn-receipt`
   - रजिस्टर अपडेट → `registers-receipt-payment`
   - खाते पोस्टिंग → `registers-ledger`
   - ऑटो गणना → `namuna-11-15`
   - नमुना निर्मिती → `namuna-11-15`
   - PDF/Excel निर्यात → `excel`
   - Converted from `div` to `button` with `onClick`, `cursor-pointer`, `hover:shadow-md hover:scale-105`, `active:scale-95`, and `ChevronRight` indicator

4. **Quick Actions** — Enhanced with `hover:scale-105 active:scale-95 cursor-pointer` and `ChevronRight` indicator

### `/home/z/my-project/src/app/page.tsx`
Added 3 new route cases for missing view IDs:
- `master-contractor` → `MasterData initialTab="contractor"`
- `registers-receipt-payment` → `AutoRegisters initialTab="receipt"`
- `registers-ledger` → `AutoRegisters initialTab="ledger"`

## Lint Status
✅ `bun run lint` passes cleanly

## Dev Server Status
✅ No compilation errors
