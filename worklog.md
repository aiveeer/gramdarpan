---
Task ID: 1
Agent: Main Agent
Task: Update Namuna 1-33 navigation data as per gppanchayat.com reference

Work Log:
- Fetched reference content from Facebook post by Adv Sanket Pise (same content as gppanchayat.com/1-te-33-namune/)
- Identified all 33 correct Namuna names as per Maharashtra Gram Panchayat Lekha Sanhita 2011
- Updated namunaReportSubGroups in page.tsx with 9 proper groups containing all 33 namuna
- Fixed wrong Namuna numbers in autoRegisterItems (e.g., Cash Book was labeled Namuna 3 instead of Namuna 5)
- Removed namuna-specific items from masterEntryItems (they belong in Namuna Reports section)
- Updated renderMainContent switch-case for all 33 namuna
- Added missing icon imports (Stamp, RotateCcw)
- Updated NAMUNA_DEFS in namuna-reports.tsx with correct names
- Updated CATEGORIES in namuna-reports.tsx with 9 proper groups
- Added parseNamunaKey() helper for sub-forms (5ka, 9ka, 20ka, etc.)
- Added formatNamunaNum() helper for Marathi display of sub-forms
- Fixed NamunaReports lookup logic to handle sub-forms properly
- Verified with agent browser - all 33 Namuna showing correctly in sidebar and report tabs
- Lint check passed with zero errors

Stage Summary:
- All 33 Namuna now correctly named per Lekha Sanhita 2011 reference
- Key corrections: Namuna 3 = जमा खर्च विवरण (not रोकड वही), Namuna 4 = मत्ता व दायित्वे (not बँक वही), Namuna 5 = सामान्य रोकड वही (Cash Book, was wrongly labeled Namuna 3)
- Sub-forms properly handled: 5-क, 9-क, 20-क, 20-ख, 26-क, 26-ख
- Pre-existing Prisma error in /api/namuna8 endpoint (not related to this change)
