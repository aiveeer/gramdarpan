---
Task ID: 1
Agent: Main Agent
Task: Fix database connection error and master data save failure

Work Log:
- Diagnosed root cause: Prisma schema had `provider = "postgresql"` but runtime DATABASE_URL was `file:/home/z/my-project/db/custom.db` (SQLite)
- Changed `prisma/schema.prisma` provider from "postgresql" to "sqlite" and removed `directUrl` line
- Updated `src/lib/db.ts` to simplify PrismaClient creation for SQLite (removed PostgreSQL-specific env var lookups)
- Ran `npx prisma generate` and `npx prisma db push` successfully
- Fixed `apiGet` function in `src/components/masters.tsx` to properly unwrap `{ success: true, data: ... }` API response format
- Fixed `apiCreate` and `apiUpdate` functions to check both `!res.ok` and `!json.success`
- Added missing short table name mappings to `src/app/api/master/route.ts` tableAlias: village→villageInfo, ward→wardMaster, owner→ownerMaster, property→propertyMaster, road→roadMaster, employee→employeeMaster, tax→taxMaster, floor→floorInfo
- Restarted dev server and verified all APIs work via curl
- Verified full application in browser via Agent Browser: login, dashboard, master data CRUD, namuna 1-33 all working

Stage Summary:
- Database connection fixed: Changed from PostgreSQL to SQLite provider to match runtime environment
- Master data save now works: Fixed API response parsing and table name mapping
- All 33 Namuna registers verified working
- No JS errors, no API failures
- Application fully functional at http://localhost:3000
