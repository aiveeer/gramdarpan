import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper: safe try/catch wrapper that returns empty data on failure
async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('Query error:', error);
    return fallback;
  }
}

// GET - auto-generated register data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // cash-book, bank-book, receipt-register, payment-register, demand-register, collection-register, asset-register, stock-register, grant-register
    const financialYear = searchParams.get('financialYear');

    if (!type) {
      return NextResponse.json({ error: 'Register type required' }, { status: 400 });
    }

    const fyFilter = financialYear ? { financialYear } : {};

    switch (type) {
      case 'cash-book': {
        // Namuna 3: Cash book - all receipt + payment entries combined
        const [receipts, payments] = await Promise.all([
          safeQuery(
            () => db.receiptEntry.findMany({
              where: fyFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'],
              orderBy: { receiptDate: 'asc' },
            }),
            []
          ),
          safeQuery(
            () => db.paymentEntry.findMany({
              where: fyFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'],
              orderBy: { paymentDate: 'asc' },
            }),
            []
          ),
        ]);

        // Calculate running balance
        let balance = 0;
        const entries = [];

        for (const r of receipts) {
          balance += r.amount;
          entries.push({
            date: r.receiptDate,
            particulars: r.receivedFrom || r.description || '',
            voucherNumber: r.voucherNumber,
            receiptAmount: r.amount,
            paymentAmount: 0,
            balance: Math.round(balance * 100) / 100,
            type: 'receipt' as const,
            headOfAccount: r.headOfAccount || '',
            paymentMethod: r.paymentMethod,
            id: r.id,
          });
        }

        for (const p of payments) {
          balance -= p.amount;
          entries.push({
            date: p.paymentDate,
            particulars: p.paidTo || p.description || '',
            voucherNumber: p.voucherNumber,
            receiptAmount: 0,
            paymentAmount: p.amount,
            balance: Math.round(balance * 100) / 100,
            type: 'payment' as const,
            headOfAccount: p.headOfAccount || '',
            paymentMethod: p.paymentMethod,
            id: p.id,
          });
        }

        // Sort by date
        entries.sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date.toISOString() : String(a.date);
          const dateB = b.date instanceof Date ? b.date.toISOString() : String(b.date);
          return dateA.localeCompare(dateB);
        });

        // Recalculate running balance in date order
        let runningBalance = 0;
        for (const entry of entries) {
          runningBalance += entry.receiptAmount - entry.paymentAmount;
          entry.balance = Math.round(runningBalance * 100) / 100;
        }

        const totalReceipts = receipts.reduce((sum, r) => sum + r.amount, 0);
        const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

        return NextResponse.json({
          type: 'cash-book',
          namuna: 'नमुना ३',
          financialYear: financialYear || 'All',
          entries,
          summary: {
            totalReceipts: Math.round(totalReceipts * 100) / 100,
            totalPayments: Math.round(totalPayments * 100) / 100,
            closingBalance: Math.round((totalReceipts - totalPayments) * 100) / 100,
            totalReceiptEntries: receipts.length,
            totalPaymentEntries: payments.length,
          },
        });
      }

      case 'bank-book': {
        // Namuna 4: Bank book - bank-related transactions
        const bankFilter = {
          ...fyFilter,
          bankAccountId: { not: null },
        };

        const [bankReceipts, bankPayments] = await Promise.all([
          safeQuery(
            () => db.receiptEntry.findMany({
              where: bankFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'],
              orderBy: { receiptDate: 'asc' },
            }),
            []
          ),
          safeQuery(
            () => db.paymentEntry.findMany({
              where: bankFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'],
              orderBy: { paymentDate: 'asc' },
            }),
            []
          ),
        ]);

        // Get bank account details
        const bankAccountIds = [
          ...new Set([
            ...bankReceipts.map(r => r.bankAccountId).filter(Boolean) as string[],
            ...bankPayments.map(p => p.bankAccountId).filter(Boolean) as string[],
          ]),
        ];

        const bankAccounts = bankAccountIds.length > 0
          ? await safeQuery(
              () => db.bankAccount.findMany({
                where: { id: { in: bankAccountIds } },
              }),
              []
            )
          : [];

        const bankMap = Object.fromEntries(bankAccounts.map(b => [b.id, b]));

        // Build entries
        let balance = 0;
        const entries = [];

        for (const r of bankReceipts) {
          balance += r.amount;
          entries.push({
            date: r.receiptDate,
            particulars: r.receivedFrom || r.description || '',
            voucherNumber: r.voucherNumber,
            depositAmount: r.amount,
            withdrawalAmount: 0,
            balance: Math.round(balance * 100) / 100,
            type: 'deposit' as const,
            bankAccount: r.bankAccountId ? bankMap[r.bankAccountId] : null,
            chequeNumber: r.chequeNumber,
            id: r.id,
          });
        }

        for (const p of bankPayments) {
          balance -= p.amount;
          entries.push({
            date: p.paymentDate,
            particulars: p.paidTo || p.description || '',
            voucherNumber: p.voucherNumber,
            depositAmount: 0,
            withdrawalAmount: p.amount,
            balance: Math.round(balance * 100) / 100,
            type: 'withdrawal' as const,
            bankAccount: p.bankAccountId ? bankMap[p.bankAccountId] : null,
            chequeNumber: p.chequeNumber,
            id: p.id,
          });
        }

        entries.sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date.toISOString() : String(a.date);
          const dateB = b.date instanceof Date ? b.date.toISOString() : String(b.date);
          return dateA.localeCompare(dateB);
        });

        let runningBalance = 0;
        for (const entry of entries) {
          runningBalance += entry.depositAmount - entry.withdrawalAmount;
          entry.balance = Math.round(runningBalance * 100) / 100;
        }

        const totalDeposits = bankReceipts.reduce((sum, r) => sum + r.amount, 0);
        const totalWithdrawals = bankPayments.reduce((sum, p) => sum + p.amount, 0);

        return NextResponse.json({
          type: 'bank-book',
          namuna: 'नमुना ४',
          financialYear: financialYear || 'All',
          bankAccounts,
          entries,
          summary: {
            totalDeposits: Math.round(totalDeposits * 100) / 100,
            totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
            closingBalance: Math.round((totalDeposits - totalWithdrawals) * 100) / 100,
            totalDepositEntries: bankReceipts.length,
            totalWithdrawalEntries: bankPayments.length,
          },
        });
      }

      case 'receipt-register': {
        // Receipt entries grouped by head of account
        const receipts = await safeQuery(
          () => db.receiptEntry.findMany({
            where: fyFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'],
            orderBy: { receiptDate: 'asc' },
          }),
          []
        );

        // Group by head of account
        const grouped: Record<string, { headOfAccount: string; headOfAccountMr: string; entries: typeof receipts; total: number }> = {};
        for (const r of receipts) {
          const key = r.headOfAccount || 'Unassigned';
          if (!grouped[key]) {
            grouped[key] = { headOfAccount: key, headOfAccountMr: r.headOfAccountMr || '', entries: [], total: 0 };
          }
          grouped[key].entries.push(r);
          grouped[key].total += r.amount;
        }

        const grandTotal = receipts.reduce((sum, r) => sum + r.amount, 0);

        return NextResponse.json({
          type: 'receipt-register',
          financialYear: financialYear || 'All',
          groups: Object.values(grouped).map(g => ({ ...g, total: Math.round(g.total * 100) / 100 })),
          summary: {
            totalEntries: receipts.length,
            grandTotal: Math.round(grandTotal * 100) / 100,
            totalGroups: Object.keys(grouped).length,
          },
        });
      }

      case 'payment-register': {
        // Payment entries grouped by head of account
        const payments = await safeQuery(
          () => db.paymentEntry.findMany({
            where: fyFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'],
            orderBy: { voucherDate: 'asc' },
          }),
          []
        );

        const grouped: Record<string, { headOfAccount: string; headOfAccountMr: string; entries: typeof payments; total: number }> = {};
        for (const p of payments) {
          const key = p.headOfAccount || 'Unassigned';
          if (!grouped[key]) {
            grouped[key] = { headOfAccount: key, headOfAccountMr: p.headOfAccountMr || '', entries: [], total: 0 };
          }
          grouped[key].entries.push(p);
          grouped[key].total += p.amount;
        }

        const grandTotal = payments.reduce((sum, p) => sum + p.amount, 0);

        return NextResponse.json({
          type: 'payment-register',
          financialYear: financialYear || 'All',
          groups: Object.values(grouped).map(g => ({ ...g, total: Math.round(g.total * 100) / 100 })),
          summary: {
            totalEntries: payments.length,
            grandTotal: Math.round(grandTotal * 100) / 100,
            totalGroups: Object.keys(grouped).length,
          },
        });
      }

      case 'demand-register': {
        // Namuna 9 data with property info
        const demands = await safeQuery(
          () => db.demandRegister.findMany({
            where: financialYear ? { financialYear } : {},
            include: {
              property: {
                include: {
                  ward: true,
                  owner: true,
                  owners: { include: { owner: true } },
                },
              },
              payments: true,
            },
            orderBy: { createdAt: 'desc' },
          }),
          []
        );

        const formattedDemands = demands.map(d => {
          const prop = d.property;
          const primaryOwner = prop?.owners?.find(o => o.ownershipType === 'मालक') || prop?.owners?.[0];
          const ownerName = primaryOwner?.owner ? `${primaryOwner.owner.firstName} ${primaryOwner.owner.lastName}` : (prop?.ownerName || '');
          const ownerNameMr = primaryOwner?.owner ? `${primaryOwner.owner.firstNameMr || primaryOwner.owner.firstName} ${primaryOwner.owner.lastNameMr || primaryOwner.owner.lastName}` : (prop?.ownerNameMr || '');
          const totalPaid = Array.isArray(d.payments) ? d.payments.reduce((sum: number, p: { amountPaid: number }) => sum + (p.amountPaid || 0), 0) : 0;

          return {
            id: d.id,
            propertyNo: prop?.propertyNo || '',
            ownerName,
            ownerNameMr,
            wardName: prop?.ward?.wardName || '',
            wardNameMr: prop?.ward?.wardNameMr || '',
            financialYear: d.financialYear,
            currentTax: d.currentTax,
            previousBalance: d.previousBalance,
            penalty: d.penalty,
            interest: d.interest,
            totalDemand: d.totalDemand,
            totalPaid,
            outstanding: d.totalDemand - totalPaid,
          };
        });

        const totalDemand = demands.reduce((sum, d) => sum + d.totalDemand, 0);
        const totalPaid = demands.reduce((sum, d) => {
          const paid = Array.isArray(d.payments) ? d.payments.reduce((s: number, p: { amountPaid: number }) => s + (p.amountPaid || 0), 0) : 0;
          return sum + paid;
        }, 0);

        return NextResponse.json({
          type: 'demand-register',
          namuna: 'नमुना ९',
          financialYear: financialYear || 'All',
          entries: formattedDemands,
          summary: {
            totalEntries: demands.length,
            totalDemand: Math.round(totalDemand * 100) / 100,
            totalPaid: Math.round(totalPaid * 100) / 100,
            totalOutstanding: Math.round((totalDemand - totalPaid) * 100) / 100,
          },
        });
      }

      case 'collection-register': {
        // Collection entries with property info
        const collections = await safeQuery(
          () => db.collectionEntry.findMany({
            where: fyFilter as Parameters<typeof db.collectionEntry.findMany>[0]['where'],
            orderBy: { collectionDate: 'asc' },
          }),
          []
        );

        // Get property details for collections that have propertyId
        const propertyIds = collections.map(c => c.propertyId).filter(Boolean) as string[];
        const properties = propertyIds.length > 0
          ? await safeQuery(
              () => db.propertyMaster.findMany({
                where: { id: { in: propertyIds } },
                include: {
                  ward: true,
                  owner: true,
                  owners: { include: { owner: true } },
                },
              }),
              []
            )
          : [];

        const propMap = Object.fromEntries(properties.map(p => [p.id, p]));

        const formattedCollections = collections.map(c => {
          const prop = c.propertyId ? propMap[c.propertyId] : null;
          const primaryOwner = prop?.owners?.find(o => o.ownershipType === 'मालक') || prop?.owners?.[0];
          return {
            id: c.id,
            collectionNumber: c.collectionNumber,
            propertyNo: prop?.propertyNo || '',
            ownerName: primaryOwner?.owner ? `${primaryOwner.owner.firstName} ${primaryOwner.owner.lastName}` : (prop?.ownerName || ''),
            ownerNameMr: primaryOwner?.owner ? `${primaryOwner.owner.firstNameMr || primaryOwner.owner.firstName} ${primaryOwner.owner.lastNameMr || primaryOwner.owner.lastName}` : (prop?.ownerNameMr || ''),
            wardName: prop?.ward?.wardName || '',
            wardNameMr: prop?.ward?.wardNameMr || '',
            collectionDate: c.collectionDate,
            amount: c.amount,
            collectionType: c.collectionType,
            receiptNumber: c.receiptNumber,
            paymentMethod: c.paymentMethod,
            description: c.description,
          };
        });

        const totalCollected = collections.reduce((sum, c) => sum + c.amount, 0);

        // Group by collection type
        const byType: Record<string, number> = {};
        for (const c of collections) {
          const key = c.collectionType || 'Other';
          byType[key] = (byType[key] || 0) + c.amount;
        }

        return NextResponse.json({
          type: 'collection-register',
          financialYear: financialYear || 'All',
          entries: formattedCollections,
          summary: {
            totalEntries: collections.length,
            totalCollected: Math.round(totalCollected * 100) / 100,
            byType: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, Math.round(v * 100) / 100])),
          },
        });
      }

      case 'asset-register': {
        // Namuna 5: Asset register
        const assets = await safeQuery(
          () => db.assetEntry.findMany({
            where: fyFilter as Parameters<typeof db.assetEntry.findMany>[0]['where'],
            orderBy: { assetNumber: 'asc' },
          }),
          []
        );

        const totalPurchaseCost = assets.reduce((sum, a) => sum + a.purchaseCost, 0);
        const totalCurrentValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
        const totalDepreciation = totalPurchaseCost - totalCurrentValue;

        // Group by asset type
        const byType: Record<string, { count: number; purchaseCost: number; currentValue: number }> = {};
        for (const a of assets) {
          const key = a.assetType || 'Other';
          if (!byType[key]) byType[key] = { count: 0, purchaseCost: 0, currentValue: 0 };
          byType[key].count++;
          byType[key].purchaseCost += a.purchaseCost;
          byType[key].currentValue += a.currentValue;
        }

        // Group by status
        const byStatus: Record<string, number> = {};
        for (const a of assets) {
          const key = a.status || 'Unknown';
          byStatus[key] = (byStatus[key] || 0) + 1;
        }

        return NextResponse.json({
          type: 'asset-register',
          namuna: 'नमुना ५',
          entries: assets,
          summary: {
            totalAssets: assets.length,
            totalPurchaseCost: Math.round(totalPurchaseCost * 100) / 100,
            totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
            totalDepreciation: Math.round(totalDepreciation * 100) / 100,
            byType,
            byStatus,
          },
        });
      }

      case 'stock-register': {
        // Namuna 6: Stock register
        const stocks = await safeQuery(
          () => db.stockEntry.findMany({
            where: fyFilter as Parameters<typeof db.stockEntry.findMany>[0]['where'],
            orderBy: { stockNumber: 'asc' },
          }),
          []
        );

        const totalValue = stocks.reduce((sum, s) => sum + s.totalValue, 0);
        const inStock = stocks.filter(s => s.status === 'In Stock');

        // Group by category
        const byCategory: Record<string, { count: number; totalValue: number; totalQuantity: number }> = {};
        for (const s of stocks) {
          const key = s.category || 'Other';
          if (!byCategory[key]) byCategory[key] = { count: 0, totalValue: 0, totalQuantity: 0 };
          byCategory[key].count++;
          byCategory[key].totalValue += s.totalValue;
          byCategory[key].totalQuantity += s.quantity;
        }

        // Group by status
        const byStatus: Record<string, number> = {};
        for (const s of stocks) {
          const key = s.status || 'Unknown';
          byStatus[key] = (byStatus[key] || 0) + 1;
        }

        return NextResponse.json({
          type: 'stock-register',
          namuna: 'नमुना ६',
          entries: stocks,
          summary: {
            totalItems: stocks.length,
            totalValue: Math.round(totalValue * 100) / 100,
            inStockCount: inStock.length,
            inStockValue: Math.round(inStock.reduce((sum, s) => sum + s.totalValue, 0) * 100) / 100,
            byCategory,
            byStatus,
          },
        });
      }

      case 'grant-register': {
        // Namuna 10: Grant register from SchemeFundEntry
        const schemeFunds = await safeQuery(
          () => db.schemeFundEntry.findMany({
            where: fyFilter as Parameters<typeof db.schemeFundEntry.findMany>[0]['where'],
            orderBy: { entryDate: 'asc' },
          }),
          []
        );

        // Get scheme details
        const schemeIds = schemeFunds.map(s => s.schemeId).filter(Boolean) as string[];
        const schemes = schemeIds.length > 0
          ? await safeQuery(
              () => db.schemeInfo.findMany({
                where: { id: { in: schemeIds } },
              }),
              []
            )
          : [];

        const schemeMap = Object.fromEntries(schemes.map(s => [s.id, s]));

        // Group by scheme
        const byScheme: Record<string, { schemeName: string; schemeNameMr: string; receipts: number; payments: number; balance: number; entries: typeof schemeFunds }> = {};
        for (const sf of schemeFunds) {
          const key = sf.schemeId || 'Unassigned';
          const scheme = sf.schemeId ? schemeMap[sf.schemeId] : null;
          if (!byScheme[key]) {
            byScheme[key] = {
              schemeName: scheme?.schemeName || 'Unassigned',
              schemeNameMr: scheme?.schemeNameMr || '',
              receipts: 0, payments: 0, balance: 0,
              entries: [],
            };
          }
          byScheme[key].entries.push(sf);
          if (sf.entryType === 'Receipt') {
            byScheme[key].receipts += sf.amount;
          } else {
            byScheme[key].payments += sf.amount;
          }
          byScheme[key].balance = byScheme[key].receipts - byScheme[key].payments;
        }

        const totalReceipts = schemeFunds.filter(sf => sf.entryType === 'Receipt').reduce((sum, sf) => sum + sf.amount, 0);
        const totalPayments = schemeFunds.filter(sf => sf.entryType === 'Payment').reduce((sum, sf) => sum + sf.amount, 0);

        return NextResponse.json({
          type: 'grant-register',
          namuna: 'नमुना १०',
          financialYear: financialYear || 'All',
          entries: schemeFunds.map(sf => ({
            ...sf,
            schemeName: sf.schemeId ? schemeMap[sf.schemeId]?.schemeName : '',
            schemeNameMr: sf.schemeId ? schemeMap[sf.schemeId]?.schemeNameMr : '',
          })),
          byScheme: Object.fromEntries(
            Object.entries(byScheme).map(([k, v]) => [k, {
              ...v,
              receipts: Math.round(v.receipts * 100) / 100,
              payments: Math.round(v.payments * 100) / 100,
              balance: Math.round(v.balance * 100) / 100,
            }])
          ),
          summary: {
            totalEntries: schemeFunds.length,
            totalReceipts: Math.round(totalReceipts * 100) / 100,
            totalPayments: Math.round(totalPayments * 100) / 100,
            balance: Math.round((totalReceipts - totalPayments) * 100) / 100,
            totalSchemes: Object.keys(byScheme).length,
          },
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid register type. Use: cash-book, bank-book, receipt-register, payment-register, demand-register, collection-register, asset-register, stock-register, grant-register' }, { status: 400 });
    }
  } catch (error) {
    console.error('Registers GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch register data' }, { status: 500 });
  }
}
