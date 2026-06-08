---
Task ID: 3
Agent: namuna-reports-component
Task: Build comprehensive Namuna Reports component with all 33 Namuna auto-generated views

Work Log:
- Created `/api/auto-generate/route.ts` API endpoint for all 33 Namuna reports
  - Accepts `?namuna=X&financialYear=YYYY-YY` query params
  - Returns structured data with `title`, `titleEn`, `headers`, `rows`, `totals`, `meta`, `villageName`, `taluka`, `district`
  - All 33 Namuna handlers with proper Prisma queries
  - Marathi column headers matching government format
  - Currency fields detected and formatted with ₹ symbol in Indian number format
  - Running balance calculation for cash book (Namuna 3, 4, 11)
  - DCB calculation with collection efficiency % for Namuna 10
  - Debtor filtering for Namuna 22 (only outstanding > 0)
  - Scheme grouping and summary for Namuna 28-30
  - Financial summary aggregation for Namuna 25, 31-33
- Completely redesigned `/src/components/namuna-reports.tsx` component:
  - Grid View: All 33 Namuna displayed in responsive grid grouped by 8 categories
  - Category system: budget, accounts, asset, grant, tax, audit, scheme, final
  - Each category has distinct color, gradient, Marathi + English label
  - Category filter dropdown for quick filtering
  - Financial year selector in grid view
  - Each Namuna button shows icon, number badge, Marathi/English name
  - Report Detail View with back-to-grid button
  - Report header: Namuna title (Marathi + English), village info, category badge
  - Controls bar: FY selector, search input, reload, print, CSV export buttons
  - Professional data table with:
    - Indian flag tricolor bar above table
    - Category-colored table headers
    - Currency detection and ₹ formatting with Indian number system
    - Right-aligned numbers
    - Alternating row colors with category tint
    - Custom scrollbar styling
  - Totals footer with formatted values
  - Empty state with helpful hints about data entry
  - Loading state with skeleton table
  - Error state with retry button
  - Quick navigation row at bottom for switching between Namunas
  - Print template with Indian flag header, village info, table, totals, signature footer
  - CSV export with proper escaping and UTF-8 BOM
  - Search/filter across all rows with clear button
- All Prisma model names correctly matched (propertyMaster, assetEntry, etc.)
- Used VillageInfo.gramPanchayatNameMr for village name display
- Lint check passed with 0 errors
- All API endpoints tested and returning 200 status

Stage Summary:
- Comprehensive Namuna Reports component with grid selector and dynamic report display
- All 33 Namuna reports render with auto-fetched data from /api/auto-generate
- Professional government format with Indian flag tricolor, category colors, currency formatting
- Print/PDF and CSV export functionality
- Search/filter within report data
- Financial year selector
