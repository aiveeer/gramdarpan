# Task 6 - Namuna 1 Component

## Task
Create नमुना १ (Namuna 1) - मालमत्ता नोंदणी पत्र (Property Registration Form) component

## What was done
1. Created `/home/z/my-project/src/components/namuna1.tsx` - full Namuna 1 component with auto-fill from master tables
2. Updated `/home/z/my-project/src/app/page.tsx` - added Namuna 1 tab with ClipboardList icon

## Key Features
- Auto-fill from Property Master + Owner Master + Ward Master + VillageInfo
- All official नमुना १ fields (5 sections)
- Green "ऑटो-फिल" badge on each auto-filled field
- Process flow explanation card
- Print functionality (opens new window with print-friendly template)
- Search by property number / owner name
- Boundaries table (पूर्व, पश्चिम, उत्तर, दक्षिण)
- Owners list table with ownership type badges
- Tax rates table
- Signature footer section

## APIs Used
- GET /api/master?table=property (properties with ward, road, owners, taxRates)
- GET /api/master?table=village (village info)
- GET /api/namuna9?search=xxx (search by property number/owner name)

## Lint Result
0 errors, 4 pre-existing warnings (unrelated files)
