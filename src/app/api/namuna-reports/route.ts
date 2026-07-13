import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Namuna 1-33 auto-generation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const namuna = searchParams.get('namuna');
    const financialYear = searchParams.get('financialYear');

    if (!namuna) {
      return NextResponse.json({ error: 'Namuna number required (1-33)' }, { status: 400 });
    }

    const namunaNum = parseInt(namuna, 10);
    if (isNaN(namunaNum) || namunaNum < 1 || namunaNum > 33) {
      return NextResponse.json({ error: 'Invalid Namuna number. Must be 1-33' }, { status: 400 });
    }

    const fyFilter = financialYear ? { financialYear } : {};

    // Get village info for all namunas
    const village = await db.villageInfo.findFirst();

    switch (namunaNum) {
      case 1: {
        // Namuna 1: Property Registration from PropertyMaster
        const properties = await db.propertyMaster.findMany({
          include: {
            ward: true,
            road: true,
            owners: { include: { owner: true } },
            taxRates: { include: { taxMaster: true } },
          },
          orderBy: { propertyNumber: 'asc' },
        });

        return NextResponse.json({
          namuna: 1,
          title: 'अर्थसंकल्प/अंदाजपत्रक',
          titleEn: 'Budget Estimate',
          village,
          financialYear: financialYear || 'All',
          entries: properties,
          summary: {
            totalProperties: properties.length,
            byConstructionType: groupBy(properties, 'constructionType'),
            byUsageType: groupBy(properties, 'usageType'),
            byWard: properties.reduce((acc: Record<string, number>, p) => {
              const key = p.ward?.wardName || 'Unassigned';
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {}),
          },
        });
      }

      case 2: {
        // Namuna 2: Property Valuation from PropertyMaster + ReadyReckoner
        const properties = await db.propertyMaster.findMany({
          include: {
            ward: true,
            owners: { include: { owner: true } },
            taxRates: { include: { taxMaster: true } },
          },
          orderBy: { propertyNumber: 'asc' },
        });

        const readyReckoner = await db.readyReckonerMaster.findMany();
        const namuna8s = await db.namuna8.findMany({
          where: financialYear ? { financialYear } : {},
          include: { property: { include: { ward: true } } },
        });

        // Calculate valuations
        const valuations = properties.map(p => {
          const rr = readyReckoner.find(r =>
            r.usageType === p.usageType && r.constructionType === p.constructionType
          );
          const area = p.area || 0;
          const rate = rr?.ratePerSqFt || 0;
          const depreciation = p.depreciationRate || 0;
          const usageFactor = p.usageFactor || 1;
          const capitalValue = area * rate * (1 - depreciation / 100) * usageFactor;
          const taxRate = p.taxRate || 0;
          const annualTax = capitalValue * taxRate / 1000;

          return {
            propertyId: p.id,
            propertyNumber: p.propertyNumber,
            wardName: p.ward?.wardName || '',
            usageType: p.usageType || '',
            constructionType: p.constructionType || '',
            area,
            ratePerSqFt: rate,
            depreciation,
            usageFactor,
            capitalValue: Math.round(capitalValue * 100) / 100,
            taxRate,
            annualTax: Math.round(annualTax * 100) / 100,
            namuna8: namuna8s.find(n => n.propertyId === p.id),
          };
        });

        const totalCapitalValue = valuations.reduce((sum, v) => sum + v.capitalValue, 0);
        const totalTax = valuations.reduce((sum, v) => sum + v.annualTax, 0);

        return NextResponse.json({
          namuna: 2,
          title: 'पुनर्विनियोजन व नियत वाटप (सुधारित अर्थसंकल्प)',
          titleEn: 'Re-appropriation & Revised Budget',
          village,
          financialYear: financialYear || 'All',
          entries: valuations,
          summary: {
            totalProperties: properties.length,
            totalCapitalValue: Math.round(totalCapitalValue * 100) / 100,
            totalAnnualTax: Math.round(totalTax * 100) / 100,
            averageTaxPerProperty: properties.length ? Math.round((totalTax / properties.length) * 100) / 100 : 0,
          },
        });
      }

      case 3: {
        // Namuna 3: Cash Book from ReceiptEntry + PaymentEntry
        const [receipts, payments] = await Promise.all([
          db.receiptEntry.findMany({
            where: fyFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'],
            orderBy: { receiptDate: 'asc' },
          }),
          db.paymentEntry.findMany({
            where: fyFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'],
            orderBy: { paymentDate: 'asc' },
          }),
        ]);

        const totalReceipts = receipts.reduce((sum, r) => sum + r.amount, 0);
        const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

        return NextResponse.json({
          namuna: 3,
          title: 'ग्रामपंचायत जमा-खर्च विवरण',
          titleEn: 'Income & Expenditure Statement',
          village,
          financialYear: financialYear || 'All',
          receipts,
          payments,
          summary: {
            totalReceipts: Math.round(totalReceipts * 100) / 100,
            totalPayments: Math.round(totalPayments * 100) / 100,
            closingBalance: Math.round((totalReceipts - totalPayments) * 100) / 100,
            receiptCount: receipts.length,
            paymentCount: payments.length,
          },
        });
      }

      case 4: {
        // Namuna 4: Bank Book from ReceiptEntry + PaymentEntry (bank transactions)
        const [bankReceipts, bankPayments] = await Promise.all([
          db.receiptEntry.findMany({
            where: { ...fyFilter, bankAccountId: { not: null } } as Parameters<typeof db.receiptEntry.findMany>[0]['where'],
            orderBy: { receiptDate: 'asc' },
          }),
          db.paymentEntry.findMany({
            where: { ...fyFilter, bankAccountId: { not: null } } as Parameters<typeof db.paymentEntry.findMany>[0]['where'],
            orderBy: { paymentDate: 'asc' },
          }),
        ]);

        const bankAccountIds = [
          ...new Set([
            ...bankReceipts.map(r => r.bankAccountId).filter(Boolean) as string[],
            ...bankPayments.map(p => p.bankAccountId).filter(Boolean) as string[],
          ]),
        ];

        const bankAccounts = bankAccountIds.length > 0
          ? await db.bankAccount.findMany({ where: { id: { in: bankAccountIds } } })
          : [];

        const totalDeposits = bankReceipts.reduce((sum, r) => sum + r.amount, 0);
        const totalWithdrawals = bankPayments.reduce((sum, p) => sum + p.amount, 0);

        return NextResponse.json({
          namuna: 4,
          title: 'ग्रामपंचायतीची मत्ता व दायित्वे',
          titleEn: 'Assets & Liabilities',
          village,
          financialYear: financialYear || 'All',
          bankAccounts,
          deposits: bankReceipts,
          withdrawals: bankPayments,
          summary: {
            totalDeposits: Math.round(totalDeposits * 100) / 100,
            totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
            closingBalance: Math.round((totalDeposits - totalWithdrawals) * 100) / 100,
            bankCount: bankAccounts.length,
          },
        });
      }

      case 5: {
        // Namuna 5: Asset Register from AssetEntry
        const assets = await db.assetEntry.findMany({
          orderBy: { assetNumber: 'asc' },
        });

        const totalPurchaseCost = assets.reduce((sum, a) => sum + a.purchaseCost, 0);
        const totalCurrentValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

        return NextResponse.json({
          namuna: 5,
          title: 'सामान्य रोकड वही',
          titleEn: 'General Cash Book',
          village,
          financialYear: financialYear || 'All',
          entries: assets,
          summary: {
            totalAssets: assets.length,
            totalPurchaseCost: Math.round(totalPurchaseCost * 100) / 100,
            totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
            totalDepreciation: Math.round((totalPurchaseCost - totalCurrentValue) * 100) / 100,
            byType: groupBy(assets, 'assetType'),
            byStatus: groupBy(assets, 'status'),
          },
        });
      }

      case 6: {
        // Namuna 6: Stock Register from StockEntry
        const stocks = await db.stockEntry.findMany({
          orderBy: { stockNumber: 'asc' },
        });

        const totalValue = stocks.reduce((sum, s) => sum + s.totalValue, 0);

        return NextResponse.json({
          namuna: 6,
          title: 'वर्गीकृत नोंदवही',
          titleEn: 'Classified Receipt Register',
          village,
          financialYear: financialYear || 'All',
          entries: stocks,
          summary: {
            totalItems: stocks.length,
            totalValue: Math.round(totalValue * 100) / 100,
            byCategory: groupBy(stocks, 'category'),
            byStatus: groupBy(stocks, 'status'),
          },
        });
      }

      case 7: {
        // Namuna 7: Revenue Collection from CollectionEntry
        const collections = await db.collectionEntry.findMany({
          where: fyFilter as Parameters<typeof db.collectionEntry.findMany>[0]['where'],
          orderBy: { collectionDate: 'asc' },
        });

        const totalCollected = collections.reduce((sum, c) => sum + c.amount, 0);

        return NextResponse.json({
          namuna: 7,
          title: 'सामान्य पावती',
          titleEn: 'General Receipt',
          village,
          financialYear: financialYear || 'All',
          entries: collections,
          summary: {
            totalEntries: collections.length,
            totalCollected: Math.round(totalCollected * 100) / 100,
            byType: groupBy(collections, 'collectionType'),
            byPaymentMethod: groupBy(collections, 'paymentMethod'),
          },
        });
      }

      case 8: {
        // Namuna 8: Tax Assessment Register
        const namuna8s = await db.namuna8.findMany({
          where: financialYear ? { financialYear } : {},
          include: {
            property: {
              include: {
                ward: true,
                owners: { include: { owner: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        const totalTax = namuna8s.reduce((sum, n) => sum + (n.totalTaxAmt || n.totalTax), 0);

        return NextResponse.json({
          namuna: 8,
          title: 'कर आकारणी नोंदवही',
          titleEn: 'Tax Assessment Register',
          village,
          financialYear: financialYear || 'All',
          entries: namuna8s,
          summary: {
            totalEntries: namuna8s.length,
            totalTax: Math.round(totalTax * 100) / 100,
          },
        });
      }

      case 9: {
        // Namuna 9: Demand Register
        const namuna9s = await db.namuna9.findMany({
          where: financialYear ? { financialYear } : {},
          include: {
            property: {
              include: {
                ward: true,
                owners: { include: { owner: true } },
              },
            },
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        const totalDemand = namuna9s.reduce((sum, n) => sum + n.totalDemand, 0);
        const totalPaid = namuna9s.reduce((sum, n) => sum + n.payments.reduce((s, p) => s + p.amountPaid, 0), 0);

        return NextResponse.json({
          namuna: 9,
          title: 'कर मागणी नोंदवही',
          titleEn: 'Tax Demand Register',
          village,
          financialYear: financialYear || 'All',
          entries: namuna9s,
          summary: {
            totalEntries: namuna9s.length,
            totalDemand: Math.round(totalDemand * 100) / 100,
            totalPaid: Math.round(totalPaid * 100) / 100,
            totalOutstanding: Math.round((totalDemand - totalPaid) * 100) / 100,
          },
        });
      }

      case 10: {
        // Namuna 10: Grant Register from SchemeFundEntry
        const schemeFunds = await db.schemeFundEntry.findMany({
          where: fyFilter as Parameters<typeof db.schemeFundEntry.findMany>[0]['where'],
          orderBy: { entryDate: 'asc' },
        });

        const totalReceipts = schemeFunds.filter(sf => sf.entryType === 'Receipt').reduce((sum, sf) => sum + sf.amount, 0);
        const totalPayments = schemeFunds.filter(sf => sf.entryType === 'Payment').reduce((sum, sf) => sum + sf.amount, 0);

        return NextResponse.json({
          namuna: 10,
          title: 'कर व फी बाबत पावती',
          titleEn: 'Tax & Fee Receipt',
          village,
          financialYear: financialYear || 'All',
          entries: schemeFunds,
          summary: {
            totalEntries: schemeFunds.length,
            totalReceipts: Math.round(totalReceipts * 100) / 100,
            totalPayments: Math.round(totalPayments * 100) / 100,
            balance: Math.round((totalReceipts - totalPayments) * 100) / 100,
          },
        });
      }

      case 11: {
        // Namuna 11: Income/Revenue Summary
        const receipts = await db.receiptEntry.findMany({
          where: fyFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'],
        });

        const grouped = groupAndSum(receipts, 'headOfAccount', 'amount');

        return NextResponse.json({
          namuna: 11,
          title: 'किरकोळ कर व फी आकारणी नोंदवही',
          titleEn: 'Miscellaneous Tax & Fee Assessment Register',
          village,
          financialYear: financialYear || 'All',
          entries: receipts,
          grouped,
          summary: {
            totalIncome: Math.round(receipts.reduce((s, r) => s + r.amount, 0) * 100) / 100,
            totalEntries: receipts.length,
          },
        });
      }

      case 12: {
        // Namuna 12: Expenditure Summary
        const payments = await db.paymentEntry.findMany({
          where: fyFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'],
        });

        const grouped = groupAndSum(payments, 'headOfAccount', 'amount');

        return NextResponse.json({
          namuna: 12,
          title: 'अकस्मात खर्चाचे प्रमाणक',
          titleEn: 'Contingent Expense Voucher',
          village,
          financialYear: financialYear || 'All',
          entries: payments,
          grouped,
          summary: {
            totalExpenditure: Math.round(payments.reduce((s, p) => s + p.amount, 0) * 100) / 100,
            totalEntries: payments.length,
          },
        });
      }

      case 13: {
        // Namuna 13: Income vs Expenditure
        const [receipts, payments] = await Promise.all([
          db.receiptEntry.findMany({
            where: fyFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'],
          }),
          db.paymentEntry.findMany({
            where: fyFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'],
          }),
        ]);

        const totalIncome = receipts.reduce((s, r) => s + r.amount, 0);
        const totalExpenditure = payments.reduce((s, p) => s + p.amount, 0);

        return NextResponse.json({
          namuna: 13,
          title: 'कर्मचारी नोंदवही',
          titleEn: 'Employee Register',
          village,
          financialYear: financialYear || 'All',
          incomeByHead: groupAndSum(receipts, 'headOfAccount', 'amount'),
          expenditureByHead: groupAndSum(payments, 'headOfAccount', 'amount'),
          summary: {
            totalIncome: Math.round(totalIncome * 100) / 100,
            totalExpenditure: Math.round(totalExpenditure * 100) / 100,
            surplus: Math.round((totalIncome - totalExpenditure) * 100) / 100,
            deficit: totalExpenditure > totalIncome ? Math.round((totalExpenditure - totalIncome) * 100) / 100 : 0,
          },
        });
      }

      case 14: {
        // Namuna 14: Budget vs Actual
        const [receipts, payments, budgetHeads] = await Promise.all([
          db.receiptEntry.findMany({
            where: fyFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'],
          }),
          db.paymentEntry.findMany({
            where: fyFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'],
          }),
          db.budgetHead.findMany({ where: { isActive: true } }),
        ]);

        const incomeByHead = groupAndSum(receipts, 'headOfAccount', 'amount');
        const expenditureByHead = groupAndSum(payments, 'headOfAccount', 'amount');

        return NextResponse.json({
          namuna: 14,
          title: 'मुद्रांक हिशोब नोंदवही',
          titleEn: 'Stamp Account Register',
          village,
          financialYear: financialYear || 'All',
          budgetHeads,
          incomeByHead,
          expenditureByHead,
          summary: {
            totalIncome: Math.round(receipts.reduce((s, r) => s + r.amount, 0) * 100) / 100,
            totalExpenditure: Math.round(payments.reduce((s, p) => s + p.amount, 0) * 100) / 100,
          },
        });
      }

      case 15: {
        // Namuna 15: Financial Overview
        const [receipts, payments, namuna8s, namuna9s, assets, collections, schemeFunds, bankAccounts] = await Promise.all([
          db.receiptEntry.findMany({ where: fyFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'] }),
          db.paymentEntry.findMany({ where: fyFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'] }),
          db.namuna8.findMany({ where: financialYear ? { financialYear } : {} }),
          db.namuna9.findMany({ where: financialYear ? { financialYear } : {}, include: { payments: true } }),
          db.assetEntry.findMany(),
          db.collectionEntry.findMany({ where: fyFilter as Parameters<typeof db.collectionEntry.findMany>[0]['where'] }),
          db.schemeFundEntry.findMany({ where: fyFilter as Parameters<typeof db.schemeFundEntry.findMany>[0]['where'] }),
          db.bankAccount.findMany({ where: { isActive: true } }),
        ]);

        const totalIncome = receipts.reduce((s, r) => s + r.amount, 0);
        const totalExpenditure = payments.reduce((s, p) => s + p.amount, 0);
        const totalTaxAssessed = namuna8s.reduce((s, n) => s + (n.totalTaxAmt || n.totalTax), 0);
        const totalDemand = namuna9s.reduce((s, n) => s + n.totalDemand, 0);
        const totalPaid = namuna9s.reduce((s, n) => s + n.payments.reduce((ps, p) => ps + p.amountPaid, 0), 0);
        const totalAssets = assets.reduce((s, a) => s + a.currentValue, 0);
        const totalCollections = collections.reduce((s, c) => s + c.amount, 0);
        const totalSchemeReceipts = schemeFunds.filter(sf => sf.entryType === 'Receipt').reduce((s, sf) => s + sf.amount, 0);
        const totalSchemePayments = schemeFunds.filter(sf => sf.entryType === 'Payment').reduce((s, sf) => s + sf.amount, 0);
        const totalBankBalance = bankAccounts.reduce((s, b) => s + b.balance, 0);

        return NextResponse.json({
          namuna: 15,
          title: 'उपभोग्य वस्तू साठा नोंदवही',
          titleEn: 'Consumable Stock Register',
          village,
          financialYear: financialYear || 'All',
          summary: {
            totalIncome: Math.round(totalIncome * 100) / 100,
            totalExpenditure: Math.round(totalExpenditure * 100) / 100,
            surplus: Math.round((totalIncome - totalExpenditure) * 100) / 100,
            totalTaxAssessed: Math.round(totalTaxAssessed * 100) / 100,
            totalDemand: Math.round(totalDemand * 100) / 100,
            totalPaid: Math.round(totalPaid * 100) / 100,
            totalOutstanding: Math.round((totalDemand - totalPaid) * 100) / 100,
            totalAssets: Math.round(totalAssets * 100) / 100,
            totalCollections: Math.round(totalCollections * 100) / 100,
            totalSchemeReceipts: Math.round(totalSchemeReceipts * 100) / 100,
            totalSchemePayments: Math.round(totalSchemePayments * 100) / 100,
            totalBankBalance: Math.round(totalBankBalance * 100) / 100,
          },
          bankAccounts,
        });
      }

      case 16: {
        // Namuna 16: Work Register
        const schemeFunds = await db.schemeFundEntry.findMany({
          where: { ...fyFilter, entryType: 'Payment' } as Parameters<typeof db.schemeFundEntry.findMany>[0]['where'],
          orderBy: { entryDate: 'asc' },
        });

        return NextResponse.json({
          namuna: 16,
          title: 'जडवस्तू संग्रह व जंगम मालमत्ता नोंदवही',
          titleEn: 'Dead Stock & Movable Property Register',
          village,
          financialYear: financialYear || 'All',
          entries: schemeFunds,
          summary: {
            totalWorks: schemeFunds.length,
            totalAmount: Math.round(schemeFunds.reduce((s, sf) => s + sf.amount, 0) * 100) / 100,
          },
        });
      }

      case 17: {
        // Namuna 17: Advance Register
        const payments = await db.paymentEntry.findMany({
          where: { ...fyFilter, headOfAccount: { contains: 'Advance' } } as Parameters<typeof db.paymentEntry.findMany>[0]['where'],
          orderBy: { paymentDate: 'asc' },
        });

        return NextResponse.json({
          namuna: 17,
          title: 'अग्रीम/अनामत रक्कम नोंदवही',
          titleEn: 'Advance & Deposit Register',
          village,
          financialYear: financialYear || 'All',
          entries: payments,
          summary: {
            totalAdvances: payments.length,
            totalAmount: Math.round(payments.reduce((s, p) => s + p.amount, 0) * 100) / 100,
          },
        });
      }

      case 18: {
        // Namuna 18: Deposit Register
        const receipts = await db.receiptEntry.findMany({
          where: { ...fyFilter, headOfAccount: { contains: 'Deposit' } } as Parameters<typeof db.receiptEntry.findMany>[0]['where'],
          orderBy: { receiptDate: 'asc' },
        });

        return NextResponse.json({
          namuna: 18,
          title: 'किरकोळ रोकडवही',
          titleEn: 'Petty Cash Book',
          village,
          financialYear: financialYear || 'All',
          entries: receipts,
          summary: {
            totalDeposits: receipts.length,
            totalAmount: Math.round(receipts.reduce((s, r) => s + r.amount, 0) * 100) / 100,
          },
        });
      }

      case 19: {
        // Namuna 19: Assessment Register from Namuna8
        const namuna8s = await db.namuna8.findMany({
          where: financialYear ? { financialYear } : {},
          include: {
            property: {
              include: {
                ward: true,
                owners: { include: { owner: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
          namuna: 19,
          title: 'हजेरीपट (मजुरांची हजेरी)',
          titleEn: 'Muster Roll / Attendance',
          village,
          financialYear: financialYear || 'All',
          entries: namuna8s,
          summary: {
            totalEntries: namuna8s.length,
            totalTax: Math.round(namuna8s.reduce((s, n) => s + (n.totalTaxAmt || n.totalTax), 0) * 100) / 100,
          },
        });
      }

      case 20: {
        // Namuna 20: Water Bill Register
        const waterBills = await db.waterBillEntry.findMany({
          where: fyFilter as Parameters<typeof db.waterBillEntry.findMany>[0]['where'],
          orderBy: { billDate: 'asc' },
        });

        return NextResponse.json({
          namuna: 20,
          title: 'कामाच्या अंदाजाची नोंदवही',
          titleEn: 'Estimate Register for Works',
          village,
          financialYear: financialYear || 'All',
          entries: waterBills,
          summary: {
            totalBills: waterBills.length,
            totalAmount: Math.round(waterBills.reduce((s, w) => s + w.totalAmount, 0) * 100) / 100,
            totalPaid: Math.round(waterBills.reduce((s, w) => s + w.paidAmount, 0) * 100) / 100,
            pending: waterBills.filter(w => w.status === 'Pending').length,
            byStatus: groupBy(waterBills, 'status'),
          },
        });
      }

      case 21: {
        // Namuna 21: House Tax Collection
        const collections = await db.collectionEntry.findMany({
          where: { ...fyFilter, collectionType: 'Tax' } as Parameters<typeof db.collectionEntry.findMany>[0]['where'],
        });
        const payments = await db.paymentEntry.findMany({
          where: { ...fyFilter, headOfAccount: { contains: 'House' } } as Parameters<typeof db.paymentEntry.findMany>[0]['where'],
        });

        return NextResponse.json({
          namuna: 21,
          title: 'कर्मचाऱ्याच्या देयकाची नोंदवही',
          titleEn: 'Employee Bill Register',
          village,
          financialYear: financialYear || 'All',
          collections,
          payments,
          summary: {
            totalCollected: Math.round(collections.reduce((s, c) => s + c.amount, 0) * 100) / 100,
            totalPayments: Math.round(payments.reduce((s, p) => s + p.amount, 0) * 100) / 100,
          },
        });
      }

      case 22: {
        // Namuna 22: Water Tax Collection
        const collections = await db.collectionEntry.findMany({
          where: { ...fyFilter, collectionType: 'Water' } as Parameters<typeof db.collectionEntry.findMany>[0]['where'],
        });

        return NextResponse.json({
          namuna: 22,
          title: 'स्थावर मालमत्ता नोंदवही',
          titleEn: 'Immovable Property Register',
          village,
          financialYear: financialYear || 'All',
          entries: collections,
          summary: {
            totalCollected: Math.round(collections.reduce((s, c) => s + c.amount, 0) * 100) / 100,
            totalEntries: collections.length,
          },
        });
      }

      case 23: {
        // Namuna 23: Light Tax Collection
        const collections = await db.collectionEntry.findMany({
          where: { ...fyFilter, collectionType: 'Light' } as Parameters<typeof db.collectionEntry.findMany>[0]['where'],
        });

        return NextResponse.json({
          namuna: 23,
          title: 'ताब्यातील रस्त्यांची नोंदवही',
          titleEn: 'Road Register',
          village,
          financialYear: financialYear || 'All',
          entries: collections,
          summary: {
            totalCollected: Math.round(collections.reduce((s, c) => s + c.amount, 0) * 100) / 100,
            totalEntries: collections.length,
          },
        });
      }

      case 24: {
        // Namuna 24: Health Tax Collection
        const collections = await db.collectionEntry.findMany({
          where: { ...fyFilter, collectionType: 'Health' } as Parameters<typeof db.collectionEntry.findMany>[0]['where'],
        });

        return NextResponse.json({
          namuna: 24,
          title: 'जमिनीची नोंदवही',
          titleEn: 'Land Register',
          village,
          financialYear: financialYear || 'All',
          entries: collections,
          summary: {
            totalCollected: Math.round(collections.reduce((s, c) => s + c.amount, 0) * 100) / 100,
            totalEntries: collections.length,
          },
        });
      }

      case 25: {
        // Namuna 25: Balance Sheet (computed from all data)
        const [receipts, payments, assets, bankAccounts, schemeFunds] = await Promise.all([
          db.receiptEntry.findMany({ where: fyFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'] }),
          db.paymentEntry.findMany({ where: fyFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'] }),
          db.assetEntry.findMany(),
          db.bankAccount.findMany({ where: { isActive: true } }),
          db.schemeFundEntry.findMany({ where: fyFilter as Parameters<typeof db.schemeFundEntry.findMany>[0]['where'] }),
        ]);

        const totalIncome = receipts.reduce((s, r) => s + r.amount, 0);
        const totalExpenditure = payments.reduce((s, p) => s + p.amount, 0);
        const totalAssetValue = assets.reduce((s, a) => s + a.currentValue, 0);
        const totalBankBalance = bankAccounts.reduce((s, b) => s + b.balance, 0);
        const totalSchemeBalance = schemeFunds.filter(sf => sf.entryType === 'Receipt').reduce((s, sf) => s + sf.amount, 0) -
          schemeFunds.filter(sf => sf.entryType === 'Payment').reduce((s, sf) => s + sf.amount, 0);

        return NextResponse.json({
          namuna: 25,
          title: 'गुंतवणूक नोंदवही',
          titleEn: 'Investment Register',
          village,
          financialYear: financialYear || 'All',
          assets: {
            fixedAssets: Math.round(totalAssetValue * 100) / 100,
            bankBalance: Math.round(totalBankBalance * 100) / 100,
            cashBalance: Math.round((totalIncome - totalExpenditure) * 100) / 100,
            totalAssets: Math.round((totalAssetValue + totalBankBalance + (totalIncome - totalExpenditure)) * 100) / 100,
          },
          liabilities: {
            schemeFundBalance: Math.round(totalSchemeBalance * 100) / 100,
            surplus: Math.round((totalIncome - totalExpenditure) * 100) / 100,
            totalLiabilities: Math.round((totalSchemeBalance + (totalIncome - totalExpenditure)) * 100) / 100,
          },
        });
      }

      case 26: {
        // Namuna 26: Income & Expenditure Account
        const [receipts, payments] = await Promise.all([
          db.receiptEntry.findMany({ where: fyFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'] }),
          db.paymentEntry.findMany({ where: fyFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'] }),
        ]);

        const incomeByHead = groupAndSum(receipts, 'headOfAccount', 'amount');
        const expenditureByHead = groupAndSum(payments, 'headOfAccount', 'amount');
        const totalIncome = receipts.reduce((s, r) => s + r.amount, 0);
        const totalExpenditure = payments.reduce((s, p) => s + p.amount, 0);

        return NextResponse.json({
          namuna: 26,
          title: 'मासिक विवरण',
          titleEn: 'Monthly Statement',
          village,
          financialYear: financialYear || 'All',
          income: incomeByHead,
          expenditure: expenditureByHead,
          summary: {
            totalIncome: Math.round(totalIncome * 100) / 100,
            totalExpenditure: Math.round(totalExpenditure * 100) / 100,
            surplus: Math.round((totalIncome - totalExpenditure) * 100) / 100,
          },
        });
      }

      case 27: {
        // Namuna 27: Receipts & Payments Account
        const [receipts, payments] = await Promise.all([
          db.receiptEntry.findMany({ where: fyFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'], orderBy: { receiptDate: 'asc' } }),
          db.paymentEntry.findMany({ where: fyFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'], orderBy: { paymentDate: 'asc' } }),
        ]);

        return NextResponse.json({
          namuna: 27,
          title: 'लेखापरीक्षण आक्षेपांच्या पुर्तेचे मासिक विवरण',
          titleEn: 'Audit Objection Compliance Monthly Statement',
          village,
          financialYear: financialYear || 'All',
          receipts,
          payments,
          summary: {
            totalReceipts: Math.round(receipts.reduce((s, r) => s + r.amount, 0) * 100) / 100,
            totalPayments: Math.round(payments.reduce((s, p) => s + p.amount, 0) * 100) / 100,
          },
        });
      }

      case 28: {
        // Namuna 28: Capital Account
        const [assets, receipts, payments] = await Promise.all([
          db.assetEntry.findMany(),
          db.receiptEntry.findMany({ where: fyFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'] }),
          db.paymentEntry.findMany({ where: fyFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'] }),
        ]);

        const totalAssetValue = assets.reduce((s, a) => s + a.currentValue, 0);
        const totalIncome = receipts.reduce((s, r) => s + r.amount, 0);
        const totalExpenditure = payments.reduce((s, p) => s + p.amount, 0);

        return NextResponse.json({
          namuna: 28,
          title: 'मागासवर्गीय 15% व महिला बालकल्याण 10% खर्चाचे मासिक विवरण',
          titleEn: 'SC 15% & Women/Child Welfare 10% Monthly Expenditure',
          village,
          financialYear: financialYear || 'All',
          fixedAssets: Math.round(totalAssetValue * 100) / 100,
          accumulatedSurplus: Math.round((totalIncome - totalExpenditure) * 100) / 100,
          totalCapital: Math.round((totalAssetValue + totalIncome - totalExpenditure) * 100) / 100,
        });
      }

      case 29: {
        // Namuna 29: Contingent Fund
        const [receipts, payments] = await Promise.all([
          db.receiptEntry.findMany({ where: { ...fyFilter, headOfAccount: { contains: 'Contingent' } } as Parameters<typeof db.receiptEntry.findMany>[0]['where'] }),
          db.paymentEntry.findMany({ where: { ...fyFilter, headOfAccount: { contains: 'Contingent' } } as Parameters<typeof db.paymentEntry.findMany>[0]['where'] }),
        ]);

        return NextResponse.json({
          namuna: 29,
          title: 'कर्जाची नोंदवही',
          titleEn: 'Loan Register',
          village,
          financialYear: financialYear || 'All',
          receipts,
          payments,
          summary: {
            totalReceipts: Math.round(receipts.reduce((s, r) => s + r.amount, 0) * 100) / 100,
            totalPayments: Math.round(payments.reduce((s, p) => s + p.amount, 0) * 100) / 100,
          },
        });
      }

      case 30: {
        // Namuna 30: Trust Fund
        const [receipts, payments] = await Promise.all([
          db.receiptEntry.findMany({ where: { ...fyFilter, headOfAccount: { contains: 'Trust' } } as Parameters<typeof db.receiptEntry.findMany>[0]['where'] }),
          db.paymentEntry.findMany({ where: { ...fyFilter, headOfAccount: { contains: 'Trust' } } as Parameters<typeof db.paymentEntry.findMany>[0]['where'] }),
        ]);

        return NextResponse.json({
          namuna: 30,
          title: 'लेखा परीक्षण आक्षेप पूर्तता नोंदवही',
          titleEn: 'Audit Objection Compliance Register',
          village,
          financialYear: financialYear || 'All',
          receipts,
          payments,
          summary: {
            totalReceipts: Math.round(receipts.reduce((s, r) => s + r.amount, 0) * 100) / 100,
            totalPayments: Math.round(payments.reduce((s, p) => s + p.amount, 0) * 100) / 100,
          },
        });
      }

      case 31: {
        // Namuna 31: Audit Report Summary
        const [receipts, payments, namuna8s, namuna9s, assets, collections, bankAccounts] = await Promise.all([
          db.receiptEntry.findMany({ where: fyFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'] }),
          db.paymentEntry.findMany({ where: fyFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'] }),
          db.namuna8.findMany({ where: financialYear ? { financialYear } : {} }),
          db.namuna9.findMany({ where: financialYear ? { financialYear } : {}, include: { payments: true } }),
          db.assetEntry.findMany(),
          db.collectionEntry.findMany({ where: fyFilter as Parameters<typeof db.collectionEntry.findMany>[0]['where'] }),
          db.bankAccount.findMany({ where: { isActive: true } }),
        ]);

        const totalDemand = namuna9s.reduce((s, n) => s + n.totalDemand, 0);
        const totalPaid = namuna9s.reduce((s, n) => s + n.payments.reduce((ps, p) => ps + p.amountPaid, 0), 0);

        return NextResponse.json({
          namuna: 31,
          title: 'प्रवास भत्ता देयक',
          titleEn: 'Travel Allowance Bill',
          village,
          financialYear: financialYear || 'All',
          financialSummary: {
            totalIncome: Math.round(receipts.reduce((s, r) => s + r.amount, 0) * 100) / 100,
            totalExpenditure: Math.round(payments.reduce((s, p) => s + p.amount, 0) * 100) / 100,
          },
          taxSummary: {
            totalAssessed: Math.round(namuna8s.reduce((s, n) => s + (n.totalTaxAmt || n.totalTax), 0) * 100) / 100,
            totalDemand: Math.round(totalDemand * 100) / 100,
            totalCollected: Math.round(totalPaid * 100) / 100,
            collectionEfficiency: totalDemand > 0 ? Math.round((totalPaid / totalDemand) * 10000) / 100 : 0,
          },
          assetSummary: {
            totalAssets: assets.length,
            totalValue: Math.round(assets.reduce((s, a) => s + a.currentValue, 0) * 100) / 100,
          },
          bankSummary: {
            totalAccounts: bankAccounts.length,
            totalBalance: Math.round(bankAccounts.reduce((s, b) => s + b.balance, 0) * 100) / 100,
          },
        });
      }

      case 32: {
        // Namuna 32: Annual Financial Statement
        const [receipts, payments, namuna8s, namuna9s, assets, schemeFunds, collections, bankAccounts] = await Promise.all([
          db.receiptEntry.findMany({ where: fyFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'] }),
          db.paymentEntry.findMany({ where: fyFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'] }),
          db.namuna8.findMany({ where: financialYear ? { financialYear } : {} }),
          db.namuna9.findMany({ where: financialYear ? { financialYear } : {}, include: { payments: true, property: { include: { ward: true } } } }),
          db.assetEntry.findMany(),
          db.schemeFundEntry.findMany({ where: fyFilter as Parameters<typeof db.schemeFundEntry.findMany>[0]['where'] }),
          db.collectionEntry.findMany({ where: fyFilter as Parameters<typeof db.collectionEntry.findMany>[0]['where'] }),
          db.bankAccount.findMany({ where: { isActive: true } }),
        ]);

        const totalIncome = receipts.reduce((s, r) => s + r.amount, 0);
        const totalExpenditure = payments.reduce((s, p) => s + p.amount, 0);
        const totalDemand = namuna9s.reduce((s, n) => s + n.totalDemand, 0);
        const totalPaid = namuna9s.reduce((s, n) => s + n.payments.reduce((ps, p) => ps + p.amountPaid, 0), 0);

        return NextResponse.json({
          namuna: 32,
          title: 'रकमेच्या परताव्यासाठीचा आदेश',
          titleEn: 'Refund Order',
          village,
          financialYear: financialYear || 'All',
          income: {
            taxRevenue: Math.round(namuna8s.reduce((s, n) => s + (n.totalTaxAmt || n.totalTax), 0) * 100) / 100,
            nonTaxRevenue: Math.round(collections.reduce((s, c) => s + c.amount, 0) * 100) / 100,
            grants: Math.round(schemeFunds.filter(sf => sf.entryType === 'Receipt').reduce((s, sf) => s + sf.amount, 0) * 100) / 100,
            otherIncome: Math.round(totalIncome * 100) / 100,
          },
          expenditure: {
            establishment: Math.round(payments.filter(p => p.headOfAccount?.includes('Salary') || p.headOfAccount?.includes('पगार')).reduce((s, p) => s + p.amount, 0) * 100) / 100,
            development: Math.round(schemeFunds.filter(sf => sf.entryType === 'Payment').reduce((s, sf) => s + sf.amount, 0) * 100) / 100,
            maintenance: Math.round(payments.filter(p => p.headOfAccount?.includes('Maintenance') || p.headOfAccount?.includes('देखभाल')).reduce((s, p) => s + p.amount, 0) * 100) / 100,
            otherExpenditure: Math.round(totalExpenditure * 100) / 100,
          },
          assets: {
            fixedAssets: Math.round(assets.reduce((s, a) => s + a.currentValue, 0) * 100) / 100,
            bankBalance: Math.round(bankAccounts.reduce((s, b) => s + b.balance, 0) * 100) / 100,
            cashInHand: Math.round((totalIncome - totalExpenditure) * 100) / 100,
          },
          collectionEfficiency: {
            totalDemand: Math.round(totalDemand * 100) / 100,
            totalCollected: Math.round(totalPaid * 100) / 100,
            efficiency: totalDemand > 0 ? Math.round((totalPaid / totalDemand) * 10000) / 100 : 0,
          },
        });
      }

      case 33: {
        // Namuna 33: Consolidated Final Accounts
        const [receipts, payments, namuna8s, namuna9s, assets, schemeFunds, collections, bankAccounts, stocks] = await Promise.all([
          db.receiptEntry.findMany({ where: fyFilter as Parameters<typeof db.receiptEntry.findMany>[0]['where'] }),
          db.paymentEntry.findMany({ where: fyFilter as Parameters<typeof db.paymentEntry.findMany>[0]['where'] }),
          db.namuna8.findMany({ where: financialYear ? { financialYear } : {} }),
          db.namuna9.findMany({ where: financialYear ? { financialYear } : {}, include: { payments: true, property: { include: { ward: true, owners: { include: { owner: true } } } } } }),
          db.assetEntry.findMany(),
          db.schemeFundEntry.findMany({ where: fyFilter as Parameters<typeof db.schemeFundEntry.findMany>[0]['where'] }),
          db.collectionEntry.findMany({ where: fyFilter as Parameters<typeof db.collectionEntry.findMany>[0]['where'] }),
          db.bankAccount.findMany({ where: { isActive: true } }),
          db.stockEntry.findMany(),
        ]);

        const totalIncome = receipts.reduce((s, r) => s + r.amount, 0);
        const totalExpenditure = payments.reduce((s, p) => s + p.amount, 0);
        const totalDemand = namuna9s.reduce((s, n) => s + n.totalDemand, 0);
        const totalPaid = namuna9s.reduce((s, n) => s + n.payments.reduce((ps, p) => ps + p.amountPaid, 0), 0);
        const totalAssetValue = assets.reduce((s, a) => s + a.currentValue, 0);
        const totalStockValue = stocks.reduce((s, st) => s + st.totalValue, 0);
        const totalBankBalance = bankAccounts.reduce((s, b) => s + b.balance, 0);

        return NextResponse.json({
          namuna: 33,
          title: 'वृक्ष नोंदवही',
          titleEn: 'Tree Register',
          village,
          financialYear: financialYear || 'All',
          receiptAndPayments: {
            openingBalance: 0,
            totalReceipts: Math.round(totalIncome * 100) / 100,
            totalPayments: Math.round(totalExpenditure * 100) / 100,
            closingBalance: Math.round((totalIncome - totalExpenditure) * 100) / 100,
          },
          incomeAndExpenditure: {
            totalIncome: Math.round(totalIncome * 100) / 100,
            totalExpenditure: Math.round(totalExpenditure * 100) / 100,
            surplus: Math.round((totalIncome - totalExpenditure) * 100) / 100,
          },
          balanceSheet: {
            assets: {
              fixedAssets: Math.round(totalAssetValue * 100) / 100,
              stock: Math.round(totalStockValue * 100) / 100,
              bankBalance: Math.round(totalBankBalance * 100) / 100,
              cashBalance: Math.round((totalIncome - totalExpenditure) * 100) / 100,
              totalAssets: Math.round((totalAssetValue + totalStockValue + totalBankBalance + (totalIncome - totalExpenditure)) * 100) / 100,
            },
            liabilities: {
              schemeFundBalance: Math.round((schemeFunds.filter(sf => sf.entryType === 'Receipt').reduce((s, sf) => s + sf.amount, 0) - schemeFunds.filter(sf => sf.entryType === 'Payment').reduce((s, sf) => s + sf.amount, 0)) * 100) / 100,
              accumulatedSurplus: Math.round((totalIncome - totalExpenditure) * 100) / 100,
            },
          },
          taxCollection: {
            totalAssessed: Math.round(namuna8s.reduce((s, n) => s + (n.totalTaxAmt || n.totalTax), 0) * 100) / 100,
            totalDemand: Math.round(totalDemand * 100) / 100,
            totalCollected: Math.round(totalPaid * 100) / 100,
            outstanding: Math.round((totalDemand - totalPaid) * 100) / 100,
            collectionEfficiency: totalDemand > 0 ? Math.round((totalPaid / totalDemand) * 10000) / 100 : 0,
          },
          propertyStats: {
            totalProperties: await db.propertyMaster.count(),
            totalWards: await db.wardMaster.count(),
          },
        });
      }

      default:
        return NextResponse.json({ error: `Namuna ${namunaNum} not implemented yet` }, { status: 501 });
    }
  } catch (error) {
    console.error('Namuna Reports GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch namuna report' }, { status: 500 });
  }
}

// Helper: Group array by a field
function groupBy(arr: Record<string, unknown>[], field: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of arr) {
    const key = String(item[field] || 'Unassigned');
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

// Helper: Group and sum by a field
function groupAndSum(arr: Record<string, unknown>[], groupField: string, sumField: string): { key: string; total: number; count: number }[] {
  const map: Record<string, { total: number; count: number }> = {};
  for (const item of arr) {
    const key = String(item[groupField] || 'Unassigned');
    const value = Number(item[sumField]) || 0;
    if (!map[key]) map[key] = { total: 0, count: 0 };
    map[key].total += value;
    map[key].count++;
  }
  return Object.entries(map).map(([key, val]) => ({
    key,
    total: Math.round(val.total * 100) / 100,
    count: val.count,
  }));
}
