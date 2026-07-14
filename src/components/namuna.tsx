'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BookOpen, ArrowLeft, RefreshCw, AlertCircle, FileText,
  Calculator, Receipt, Landmark, Warehouse, Users, Building2,
  Wallet, ClipboardList, TrendingUp, CreditCard, Package,
  TreePine, Route, MapPin, Scale, HandCoins, Stamp, UserCheck,
  PiggyBank, ScrollText, ShieldCheck, Bus, RotateCcw, Trees,
  CircleDollarSign, Coins, BadgeIndianRupee,
} from 'lucide-react';

interface NamunaProps {
  financialYear: string;
}

interface NamunaInfo {
  number: number;
  name: string;
  nameMr: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  subNamunas?: { key: string; nameMr: string; description: string }[];
}

const NAMUNA_LIST: NamunaInfo[] = [
  {
    number: 1,
    name: 'Budget Estimate',
    nameMr: 'अंदाजपत्रक',
    description: 'कलम ६२ नुसार आर्थिक वर्षाकरिता जमाखर्चाचा अंदाजित अहवाल. सरपंच यांनी दि.३१ जानेवारी अखेर ग्रामपंचायतीस सादर करून मान्यता घेणे व २८ फेब्रुवारी अखेर ग्रामसभेची मान्यता घेऊन पंचायत समितीकडे सादर करणे बंधनकारक.',
    icon: Calculator,
    gradient: 'from-teal-500 to-teal-600',
  },
  {
    number: 2,
    name: 'Re-appropriation & Revised Allocation',
    nameMr: 'पुनर्विनियोजित नियतवाटप',
    description: 'ग्रामपंचायतीच्या मूळ मंजूर अंदाजपत्रकातील खर्चाचे पुनर्विनियोजित नियतवाटप करणे. मूळ अंदाजपत्रकात खर्चासाठी केलेल्या तरतुदीमध्ये त्या-त्या लेखा शिर्षकामध्ये घट किंवा वाढ होत असेल तर, अशा घट किंवा वाढीला बरोबरीत आणणे.',
    icon: Calculator,
    gradient: 'from-teal-600 to-teal-700',
  },
  {
    number: 3,
    name: 'Income & Expenditure Statement',
    nameMr: 'ग्रामपंचायत जमा खर्चाचे विवरण',
    description: 'ग्रामपंचायत जमा खर्च विवरण तयार करून आर्थिक वर्षातील पहिल्या ग्रामसभेस सादर करणे आवश्यक. वार्षिक जमा खर्चाचे विवरणपत्र दि.१ जून पूर्वी पंचायत समिती कार्यालयात सादर करणे आवश्यक.',
    icon: ClipboardList,
    gradient: 'from-orange-400 to-orange-600',
  },
  {
    number: 4,
    name: 'Assets & Liabilities',
    nameMr: 'ग्रामपंचायत मत्ता व दायित्वे',
    description: 'ग्रामपंचायतीकडून देय असलेल्या थकीत रकमा (दायित्व) आणि येणे असलेल्या रकमा यांचे वर्षाअखेरीस (दि.३१ मार्च पूर्वी) विवरणपत्र तयार केले पाहिजे. आर्थिक वर्षातील पहिल्या ग्रामसभेसमोर सरपंच ते सादर करावे.',
    icon: Scale,
    gradient: 'from-blue-500 to-blue-700',
  },
  {
    number: 5,
    name: 'General Cash Book',
    nameMr: 'सामान्य रोकड वही',
    description: 'नमुना ५ क-दैनिक रोकड वही मध्ये ज्या रकमा जमा झाल्या त्या रकमांची एकत्रित नोंद सामान्य रोकड वहीत लिहावी. धनादेशाद्वारे जमा होणाऱ्या रकमांची नोंद घ्यावी. खर्च बाजूला ₹५०० पेक्षा अधिकचा खर्च धनादेशानी अदा केलेल्यांच्या नोंदी घ्याव्यात.',
    icon: Wallet,
    gradient: 'from-emerald-400 to-emerald-600',
    subNamunas: [
      { key: '5ka', nameMr: 'दैनिक रोकडवही', description: 'नमुना १०, नमुना ७ अन्वये जमा रकमेची नोंद. दैनिक वसुलीची एकत्रित रक्कम बँक भरणा करून नमुना ५ मध्ये त्याची नोंद. या नमुन्यामध्ये खर्चाची रक्कम नोंदविता येणार नाही.' },
    ],
  },
  {
    number: 6,
    name: 'Monthly Income-Expenditure Register',
    nameMr: 'मासिक जमा-खर्चाची नोंदवही',
    description: 'सदरील नोंदवहीमध्ये मासिक जमा खर्चाचा तपशील दिनांकासह नोंदण्यात येतो. नमुना ५ सामान्य रोकड वहीतील सर्व रकमा यामध्ये समाविष्ट. प्रत्येक महिन्याचा हिशोब पूर्ण करून नमुना २६क व २६ख मध्ये जमा खर्चाचे विवरणपत्र तयार करून पंचायत समितीकडे सादर.',
    icon: ClipboardList,
    gradient: 'from-amber-400 to-amber-600',
  },
  {
    number: 7,
    name: 'General Receipt',
    nameMr: 'सामान्य पावती',
    description: 'ग्रामपंचायतीला प्राप्त झालेला विशिष्ठ रकमेसाठी — सर्व प्रकारची फी, अंशदान, देणगी व कर सोडून प्राप्त होणाऱ्या उत्पन्नाच्या रकमेची पोहोच. ₹५,००० पेक्षा अधिक रक्कम वसूल झाल्यास रेव्हेन्यू स्टॅम्प लावणे आवश्यक.',
    icon: Receipt,
    gradient: 'from-cyan-400 to-cyan-600',
  },
  {
    number: 8,
    name: 'Property Tax Assessment Register',
    nameMr: 'कर आकारणी नोंदवही',
    description: 'महाराष्ट्र ग्रामपंचायत अधिनियम १९५८ चे कलम १२४ नुसार ग्रामपंचायत हद्दीतील कर आकारणीस पात्र असलेल्या सर्व इमारती, जमिनीची नोंद. भांडवली मूल्यावर आधारित कर आकारणी करणे आवश्यक. नमुना ८ मधील एकूण मागणी नमुना ९ मधील चालू मागणीस जुळविणे आवश्यक.',
    icon: Building2,
    gradient: 'from-red-400 to-red-600',
  },
  {
    number: 9,
    name: 'Tax Demand Register',
    nameMr: 'कर मागणी नोंदवही',
    description: 'नमुना ८ प्रमाणे आकारणी केलेल्या कराच्या रकमेची नोंद वही. थकित कर, चालू मागणी व एकूण थकबाकी मागणी इत्यादींची नोंद व गोषवारा. एप्रिलच्या मासिक बैठकीत मान्यता घेण्यात यावी.',
    icon: ClipboardList,
    gradient: 'from-purple-500 to-purple-700',
  },
  {
    number: 10,
    name: 'Tax & Fee Collection Receipt',
    nameMr: 'कर व फी वसुली बाबत पावती',
    description: 'कर वसुली होणाऱ्या प्रत्येक रकमेसाठी करदात्यास नमुना १० कर वसुली पावती दिली जाते. प्रत्येक दिवशी जमा होणाऱ्या रकमांच्या नोंदी नमुना ५क मध्ये नोंद ठेवल्या जातात. पावती कार्बनचा दुहेरी वापर करून लिहिण्यात यावी.',
    icon: Receipt,
    gradient: 'from-pink-400 to-pink-600',
  },
  {
    number: 11,
    name: 'Miscellaneous Demand Register',
    nameMr: 'किरकोळ मागणी नोंदवही',
    description: 'शासनाकडून मिळालेले अनुदान — जमीन महसूल, मुद्रांक शुल्क, समानीकरण अनुदान, जिल्हा परिषद व पंचायत समितीकडून मिळालेल्या अनुदानाच्या नोंदी, गाळे भाडे, बाजार भाडे फी व इतर उत्पन्न इ. येणेबाकीच्या नोंदी. नमुना ७ पावतीने वसुली करण्यात येते.',
    icon: HandCoins,
    gradient: 'from-sky-400 to-sky-600',
  },
  {
    number: 12,
    name: 'Contingent Expenditure Voucher',
    nameMr: 'आकस्मिक खर्चाचे प्रमाण',
    description: 'ग्रामपंचायतीने खरेदी केलेल्या वस्तू किंवा दिलेल्या रकमांची नोंद. कोणतीही रक्कम काढावयाची असल्यास प्रमाणकाच्या आधारावर काढावी लागते. ₹५०० पेक्षा अधिक रक्कम धनादेशानेच काढण्यात येईल. नमुना १२ शाईच्या पेनाने लिहिण्यात यावा.',
    icon: CreditCard,
    gradient: 'from-yellow-400 to-yellow-600',
  },
  {
    number: 13,
    name: 'Employee List & Pay Scale Register',
    nameMr: 'कर्मचारी वर्गाची सूची व वेतनश्रेणी नोंदवही',
    description: 'ग्रामपंचायतीच्या कायम असलेल्या कर्मचाऱ्यांच्या नियुक्तीची नोंद. मंजूर पदे, कार्यरत कर्मचारी यामधील तफावत. ८.३३% रक्कम वेतनातून कपात करून भविष्य निर्वाह निधीत भरण्यात येईल.',
    icon: UserCheck,
    gradient: 'from-indigo-400 to-indigo-600',
  },
  {
    number: 14,
    name: 'Stamp Account Register',
    nameMr: 'मुद्रांक हिशोब नोंदवही',
    description: 'खरेदी केलेले मुद्रांक व वापर केलेल्या मुद्रांकांची नोंद. प्रत्येक महिन्यात सरपंच सदर साठा प्रमाणित करून साक्षांकीत करतील. ₹५,००० पुढची कोणतीही वसुली आल्यास महसूल मुद्रांक लावून पावती देणे बंधनकारक.',
    icon: Stamp,
    gradient: 'from-violet-400 to-violet-600',
  },
  {
    number: 15,
    name: 'Consumable Stock Account Register',
    nameMr: 'उपभोग्य वस्तू साठा लेखा नोंदवही',
    description: 'ग्रामपंचायतीने खरेदी केलेल्या उपभोग्य व आवश्यक वस्तूंची नोंद — पावती पुस्तके, नोंदवह्या, लेखन सामग्री, बांधकाम साहित्य. धनादेश पुस्तकांची नोंद या नमुन्यात घेणे बंधनकारक.',
    icon: Package,
    gradient: 'from-lime-500 to-lime-700',
  },
  {
    number: 16,
    name: 'Fixed Asset / Dead Stock Register',
    nameMr: 'जड वस्तू संग्रह / जंगम मालमत्ता नोंदवही',
    description: 'जड वस्तूंच्या नोंदी — टेबल, घड्याळ, खुर्ची, कपाट, विद्युत पंप, कायम टिकाऊ स्वरूपाच्या वस्तू. स्वतंत्र पानावर नोंद. आर्थिक वर्षातून दोन वेळा सरपंच सदर साठा पडताळणी करून दिनांकासह स्वाक्षरी करतील.',
    icon: Warehouse,
    gradient: 'from-stone-400 to-stone-600',
  },
  {
    number: 17,
    name: 'Advance & Deposit Register',
    nameMr: 'अग्रीम दिलेल्या/अनामत ठेवलेल्या रकमांची नोंदवही',
    description: 'ग्रामपंचायत वेगवेगळ्या कारणांसाठी कर्मचाऱ्यांना अग्रिम मंजूर करून नियमित वसुली करीत असते. अनामत रकमा जमा झाल्यास नमुना ५क मध्ये नोंद. मागील अग्रीम रक्कमेची पूर्ण वसुली झाल्याशिवाय पुढील अग्रीम रक्कम दिली जाऊ नये.',
    icon: HandCoins,
    gradient: 'from-rose-400 to-rose-600',
  },
  {
    number: 18,
    name: 'Petty Cash Book',
    nameMr: 'किरकोळ रोकड वही',
    description: 'नियम २४(२) अन्वये ₹५०० पेक्षा कमीचे प्रदान धनादेशानी करता येईल. नमुना ५ वरून सदरची जमा नमुना १८ च्या जमा बाजूस घेऊन केवळ नमुना १९ नुसार खर्च बाजूस खर्च नोंदविता येईल.',
    icon: Wallet,
    gradient: 'from-orange-500 to-orange-700',
  },
  {
    number: 19,
    name: 'Labour Attendance Register',
    nameMr: 'कामावर असलेल्या व्यक्तींचा हजेरीपट',
    description: 'नियम २४(२) नुसार ₹५०० पेक्षा कमी ची रक्कम नमुना १९ आधारे नमुना १८ मध्ये. नियम २४-ग नमुना १९ ची रक्कम वाटप करण्यासाठी प्रमाणका आधारेच काढता येईल. देयक नियम २४(५) नुसार नमुना १९ वरून काढण्यात येईल.',
    icon: Users,
    gradient: 'from-emerald-500 to-emerald-700',
  },
  {
    number: 20,
    name: 'Work Estimate Register',
    nameMr: 'कामाच्या अंदाजाची नोंदवही',
    description: 'ग्रामपंचायत प्रशासकीय मंजुरीसाठी प्रस्तावित असलेल्या कामाचा तपशीलवार मोजमापाचा आराखडा व अंदाजित खर्चाच्या तपशीलाची नोंद.',
    icon: ClipboardList,
    gradient: 'from-teal-400 to-teal-600',
    subNamunas: [
      { key: '20ka', nameMr: 'मोजमाप नोंदवही', description: 'ग्रामपंचायतीने केलेल्या किंवा कंत्राटदाराने केलेल्या कामाचे मोजमाप नोंदी पंचायत समितीच्या कनिष्ठ अभियंता/शाखा अभियंता यांचेकडून घेतल्या जातात.' },
      { key: '20kha', nameMr: 'कामाचे देयक', description: 'कामाचे मोजमाप करून नोंद केल्यानंतर कामाचे देयक नोंदवहीत करण्यात येईल. मोजमाप पुस्तिकेतील परिणाम व दर अचूक असल्याची खात्री करून सरपंच/ग्रामसेवक स्वाक्षरी करून प्रमाणित करतील.' },
    ],
  },
  {
    number: 21,
    name: 'Salary Bill Register',
    nameMr: 'कर्मचाऱ्यांच्या वेतन देयकाची नोंदवही',
    description: 'ग्रामपंचायतीने नेमलेल्या कायमस्वरूपी कर्मचाऱ्यांच्या वेतनाचे देयक. कर्मचाऱ्यांची वेतनश्रेणी, भत्ता, होणारी कपात, निव्वळ देय असणारी रक्कम यांचा हिशोब. सरपंचांची मंजुरी घेणे आवश्यक.',
    icon: BadgeIndianRupee,
    gradient: 'from-amber-500 to-amber-700',
  },
  {
    number: 22,
    name: 'Immovable Property Register (Excl. Roads & Land)',
    nameMr: 'स्थावर मालमत्ता नोंदवही (रस्ते व जमिनी व्यतिरिक्त)',
    description: 'ग्रामपंचायतीच्या मालकीच्या असलेल्या सर्व स्थावर मालमत्तेची नोंद. उदा. ग्रामपंचायत कार्यालय, विहीर, स्मशानभूमी, दुकान गाळे, इमारती, भूमिगत गटारे. प्रत्येक मालमत्तेसाठी स्वतंत्र पान.',
    icon: Building2,
    gradient: 'from-red-500 to-red-700',
  },
  {
    number: 23,
    name: 'Road Register',
    nameMr: 'रस्त्याची नोंदवही',
    description: 'ग्रामपंचायतीच्या ताब्यातील सर्व रस्त्यांच्या लांबी, रुंदी व इतर तपशिलासह नोंद. दरवर्षी एप्रिल मध्ये सरपंच/सचिव यांचेकडून प्रमाणित. नवीन रस्त्यांच्या नोंदी करताना सरपंच प्रत्यक्ष स्थळ पाहणी करून मोजमापे घ्यावीत.',
    icon: Route,
    gradient: 'from-sky-500 to-sky-700',
  },
  {
    number: 24,
    name: 'Land Register',
    nameMr: 'जमिनीची नोंदवही',
    description: 'पंचायतीने खरेदी, संपादित, शासनाकडून हस्तांतरीत केलेल्या सर्व जमिनी, मोकळ्या जागा, गाव, पडीक जमीन, गावरान इत्यादींच्या सविस्तर नोंदी. प्रत्येक जमिनीची नोंद स्वतंत्र पानावर. प्रतिवर्षी एप्रिल मध्ये प्रमाणित.',
    icon: MapPin,
    gradient: 'from-green-500 to-green-700',
  },
  {
    number: 25,
    name: 'Investment Register',
    nameMr: 'गुंतवणूक नोंदवही',
    description: 'महाराष्ट्र ग्रामपंचायत लेखा संहिता २०११ नियम १५ नुसार ग्रामपंचायतीने गुंतवणूक केलेल्या सर्व प्रकारच्या रकमा व त्यावर मिळणारे व्याज इत्यादींचा तपशिल. दरमहा नमुना ५ मध्ये ताळमेळ घालून प्रमाणित.',
    icon: PiggyBank,
    gradient: 'from-cyan-500 to-cyan-700',
  },
  {
    number: 26,
    name: 'Monthly Statement',
    nameMr: 'मासिक विवरण',
    description: 'प्रत्येक महिन्यात मासिक जमा/खर्च हिशोब पूर्ण केल्यानंतर मासिक विवरण तयार करून ग्रामसेवक प्रत्येक महिन्याचे १५ तारखेपर्यंत पंचायत समितीकडे सादर करतील.',
    icon: ClipboardList,
    gradient: 'from-fuchsia-400 to-fuchsia-600',
    subNamunas: [
      { key: '26ka', nameMr: 'जमा मासिक विवरण', description: 'प्रत्येक महिन्यात मासिक जमा हिशोब पूर्ण केल्यानंतर मासिक विवरण तयार करून ग्रामसेवक प्रत्येक महिन्याचे १५ तारखेपर्यंत पंचायत समितीकडे सादर करतील.' },
      { key: '26kha', nameMr: 'खर्चाचे मासिक विवरण', description: 'प्रत्येक महिन्यात मासिक खर्चाचा हिशोब पूर्ण केल्यानंतर मासिक विवरणपत्र तयार करून ग्रामसेवक प्रत्येक महिन्याच्या पंधरा तारखेपर्यंत पंचायत समितीकडे सादर करतील.' },
    ],
  },
  {
    number: 27,
    name: 'Audit Objection Compliance Statement',
    nameMr: 'लेखा परीक्षणातील आक्षेपांच्या पूर्ततेचे मासिक विवरण',
    description: 'ग्रामपंचायतीचा लेखा परीक्षणाचा अहवाल प्राप्त झाल्यानंतर तीन महिन्यात ग्रामसेवकांनी अनुपालन तयार करून पंचायत समितीकडे सादर करावा लागतो. पंचायत समितीच्या मान्यतेने मुख्य कार्यकारी अधिकारी, जिल्हा परिषद यांच्याकडे अनुपालन मान्यतेसाठी पाठविले जाते.',
    icon: ShieldCheck,
    gradient: 'from-emerald-400 to-teal-600',
  },
  {
    number: 28,
    name: 'SC 15% / Women & Child Welfare 10% Expenditure',
    nameMr: 'मागासवर्गीय १५% खर्च / महिला बालकल्याण १०% खर्चाचे मासिक विवरण',
    description: 'या नोंदवहीमध्ये १५ टक्के मागासवर्गीय खर्चाची व १० टक्के महिला बालकल्याण खर्चाचे मासिक विवरण असते. ग्रामसेवक पहिल्या आठवड्यात पंचायत समितीकडे सादर करतील.',
    icon: Users,
    gradient: 'from-orange-400 to-red-500',
  },
  {
    number: 29,
    name: 'Loan Register',
    nameMr: 'कर्जाची नोंदवही',
    description: 'ग्रामपंचायतीने घेतलेले कर्ज, त्याचे व्याज व कर्जाची केलेली परतफेड याचे विवरण. दर तीन महिन्यांने सरपंच यांनी प्रमाणित करणे आवश्यक.',
    icon: Coins,
    gradient: 'from-purple-400 to-purple-600',
  },
  {
    number: 30,
    name: 'Audit Objection Compliance Register',
    nameMr: 'ग्रामपंचायत लेखापरीक्षण आक्षेप पूर्तता नोंदवही',
    description: 'ग्रामपंचायतीने लेखा परीक्षकांच्या अहवाल प्राप्त झाल्यानंतर केलेली पूर्तता, झालेली वसुली पंचायतीच्या ठरावा सह पंचायत समितीकडे तीन महिन्याच्या आत पाठविण्यात येईल.',
    icon: ScrollText,
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    number: 31,
    name: 'Travel Allowance Bill',
    nameMr: 'प्रवास भत्ता देयक',
    description: 'ग्रामपंचायत अंतर्गत सरपंच, उपसरपंच, सदस्य व कर्मचारी यांना दिलेल्या प्रवासभत्त्याची नोंद. प्रशिक्षण, चर्चासत्र व शासनाने आयोजित केलेल्या कार्यक्रमाला उपस्थित राहण्यासाठी. ८ कि.मी. अंतराच्या आत प्रवास भत्ता घेता येणार नाही.',
    icon: Bus,
    gradient: 'from-teal-500 to-emerald-600',
  },
  {
    number: 32,
    name: 'Refund Order',
    nameMr: 'रकमेच्या परताव्यासाठीचा आदेश',
    description: 'ग्रामपंचायतीकडे नमुना १७ मध्ये नोंद घेऊन स्वीकारलेल्या ठेवी परत करताना केलेल्या कार्यवाहीची नोंद.',
    icon: RotateCcw,
    gradient: 'from-amber-400 to-orange-600',
  },
  {
    number: 33,
    name: 'Tree Register',
    nameMr: 'वृक्ष नोंदवही',
    description: 'ग्रामपंचायतीच्या ताब्यात असलेल्या जमिनीवर, रस्त्याच्या कडेला, शासकीय कार्यालयांच्या जागेवरील, अन्य ठिकाणी वृक्ष लागवड केलेल्या झाडांच्या नोंदी. झाडांपासून मिळणारे उत्पन्न, झाडे नष्ट/तोडल्याची नोंद कारणासह.',
    icon: TreePine,
    gradient: 'from-green-500 to-emerald-700',
  },
];

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'number') return val.toLocaleString('en-IN');
  if (typeof val === 'boolean') return val ? 'हो' : 'नाही';
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    return String(obj.nameMr || obj.name || obj.headNameMr || obj.headName || obj.schemeNameMr || obj.schemeName || JSON.stringify(val));
  }
  return String(val);
}

function formatHeader(key: string): string {
  return key
    .replace(/^_/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .replace('Sr', 'अ.क्र.')
    .replace('Code', 'कोड')
    .replace('Name', 'नाव')
    .replace('nameMr', 'नाव (मराठी)')
    .replace('Category', 'श्रेणी')
    .replace('Type', 'प्रकार')
    .replace('Section', 'विभाग')
    .replace('Original Budget', 'मूळ अंदाज')
    .replace('Revised Budget', 'दुरुस्तीत अंदाज')
    .replace('Actual', 'वास्तव')
    .replace('Reappropriation', 'पुनर्विनियोजन')
    .replace('Amount', 'रक्कम')
    .replace('Date', 'दिनांक')
    .replace('Voucher', 'वाउचर')
    .replace('Particulars', 'विवरण')
    .replace('Head', 'खाते शीर्ष')
    .replace('Debit', 'जमा')
    .replace('Credit', 'नामे')
    .replace('Description', 'वर्णन')
    .replace('Balance', 'शिल्लक')
    .replace('Total', 'एकूण')
    .replace('Count', 'संख्या')
    .replace('Demand', 'मागणी')
    .replace('Collection', 'वसूल')
    .replace('Outstanding', 'बकायपोरी')
    .replace('Tax', 'कर')
    .replace('Property', 'मालमत्ता')
    .replace('Owner', 'मालक')
    .replace('Area', 'क्षेत्रफळ')
    .replace('Rate', 'दर')
    .replace('Variance', 'फरक');
}

export default function Namuna({ financialYear }: NamunaProps) {
  const [activeNamuna, setActiveNamuna] = useState<number | null>(null);
  const [activeSubNamuna, setActiveSubNamuna] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNamuna = useCallback(async () => {
    if (!activeNamuna) return;
    setLoading(true);
    setError(null);
    try {
      const namunaKey = activeSubNamuna || String(activeNamuna);
      const res = await fetch(`/api/namuna-reports?namuna=${namunaKey}&financialYear=${financialYear}`);
      if (!res.ok) throw new Error('Fetch failed');
      const json = await res.json();
      setData(json);
    } catch {
      setError('नमुना डेटा लोड करताना त्रुटी');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeNamuna, activeSubNamuna, financialYear]);

  useEffect(() => {
    if (activeNamuna) fetchNamuna();
  }, [activeNamuna, activeSubNamuna, fetchNamuna]);

  // Namuna list view
  if (!activeNamuna) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="h-1 w-8 rounded-full bg-gradient-to-r from-gp-saffron to-gp-green" />
          नमुने (१-३३)
          <span className="h-1 w-8 rounded-full bg-gradient-to-r from-gp-green to-gp-teal" />
        </h2>
        <p className="text-sm text-muted-foreground">महाराष्ट्र ग्रामपंचायत लेखा संहिता २०११ नुसार ३३ अभिलेख नमुने</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {NAMUNA_LIST.map((n) => (
            <div
              key={n.number}
              onClick={() => { setActiveNamuna(n.number); setActiveSubNamuna(null); }}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${n.gradient} p-3 text-white cursor-pointer shadow-md hover:shadow-xl hover:scale-[1.04] transition-all duration-200 group`}
            >
              <div className="absolute -bottom-3 -right-3 h-16 w-16 rounded-full bg-white/10" />
              <div className="flex items-start gap-2 relative z-10">
                <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <n.icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white/80">नमुना {n.number}</p>
                  <p className="text-sm font-bold leading-tight line-clamp-2">{n.nameMr}</p>
                </div>
              </div>
              {/* Sub-namuna indicator */}
              {n.subNamunas && n.subNamunas.length > 0 && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-white/25 text-white text-[9px] px-1.5 py-0 border-0">
                    +{n.subNamunas.length} उप
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detail view for a specific Namuna
  const namunaInfo = NAMUNA_LIST.find(n => n.number === activeNamuna);
  const currentSubNamuna = namunaInfo?.subNamunas?.find(s => s.key === activeSubNamuna);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setActiveNamuna(null); setActiveSubNamuna(null); setData(null); }}
          className="border-gp-teal/30 text-gp-teal hover:bg-gp-teal/10"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />मागे
        </Button>
        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${namunaInfo?.gradient || 'from-teal-400 to-teal-600'} flex items-center justify-center shadow`}>
          {namunaInfo?.icon && <namunaInfo.icon className="h-4 w-4 text-white" />}
        </div>
        <div>
          <h2 className="text-lg font-bold">
            {currentSubNamuna
              ? `नमुना ${activeNamuna} ${currentSubNamuna.key.replace(/[0-9]/g, '').charAt(0) === 'k' ? 'क' : 'ख'}: ${currentSubNamuna.nameMr}`
              : `नमुना ${activeNamuna}: ${namunaInfo?.nameMr || ''}`}
          </h2>
          <p className="text-xs text-muted-foreground">{namunaInfo?.name || ''}</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={fetchNamuna}>
            <RefreshCw className="h-4 w-4 mr-1" />रीफ्रेश
          </Button>
        </div>
      </div>

      {/* Description Card */}
      {(namunaInfo?.description || currentSubNamuna?.description) && (
        <Card className="border-l-4 border-l-gp-saffron">
          <CardContent className="p-4">
            <div className="flex gap-2 items-start">
              <BookOpen className="h-4 w-4 text-gp-saffron flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentSubNamuna?.description || namunaInfo?.description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sub-namuna tabs */}
      {namunaInfo?.subNamunas && namunaInfo.subNamunas.length > 0 && !activeSubNamuna && (
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={activeSubNamuna === null ? 'default' : 'outline'}
            onClick={() => setActiveSubNamuna(null)}
            className={activeSubNamuna === null ? 'bg-gp-teal text-white' : 'border-gp-teal/30 text-gp-teal'}
          >
            मुख्य नमुना {activeNamuna}
          </Button>
          {namunaInfo.subNamunas.map(sub => (
            <Button
              key={sub.key}
              size="sm"
              variant={activeSubNamuna === sub.key ? 'default' : 'outline'}
              onClick={() => setActiveSubNamuna(sub.key)}
              className={activeSubNamuna === sub.key ? 'bg-gp-teal text-white' : 'border-gp-teal/30 text-gp-teal'}
            >
              नमुना {sub.key}
            </Button>
          ))}
        </div>
      )}

      {/* Back to main namuna from sub */}
      {activeSubNamuna && namunaInfo?.subNamunas && (
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveSubNamuna(null)}
            className="border-gp-teal/30 text-gp-teal"
          >
            ← मुख्य नमुना {activeNamuna}
          </Button>
          {namunaInfo.subNamunas.map(sub => (
            <Button
              key={sub.key}
              size="sm"
              variant={activeSubNamuna === sub.key ? 'default' : 'outline'}
              onClick={() => setActiveSubNamuna(sub.key)}
              className={activeSubNamuna === sub.key ? 'bg-gp-teal text-white' : 'border-gp-teal/30 text-gp-teal'}
            >
              नमुना {sub.key} — {sub.nameMr}
            </Button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" onClick={fetchNamuna}>
              <RefreshCw className="h-4 w-4 mr-2" />पुन्हा प्रयत्न करा
            </Button>
          </CardContent>
        </Card>
      ) : data ? (
        <NamunaDataView data={data} />
      ) : null}
    </div>
  );
}

function NamunaDataView({ data }: { data: Record<string, unknown> }) {
  // The API returns: { namuna, title, titleEn, village, financialYear, headers, rows, totals, meta }
  // Or legacy format: { entries, records, data, summary }
  const headers = data.headers as string[] | undefined;
  const rows = (data.rows || data.entries || data.records || data.data || null) as Record<string, unknown>[] | null;
  const totals = data.totals as Record<string, unknown> | undefined;
  const title = data.title as string | undefined;
  const meta = data.meta as Record<string, unknown> | undefined;
  const village = data.village as Record<string, unknown> | undefined;

  // Determine column keys from rows
  const columnKeys = rows && rows.length > 0
    ? Object.keys(rows[0]).filter(k => k !== 'id')
    : [];

  // Map header to column key (headers[i] corresponds to columnKeys[i] if headers exist)
  const displayHeaders = headers && headers.length > 0
    ? headers
    : columnKeys.map(formatHeader);

  return (
    <div className="space-y-4">
      {/* Title badge */}
      {title && (
        <Badge className="bg-gradient-to-r from-gp-teal to-gp-teal-dark text-white text-sm px-3 py-1">
          {title}
        </Badge>
      )}

      {/* Village Info */}
      {village && (
        <Card className="border-l-4 border-l-gp-teal bg-gp-teal/5">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {village.gramPanchayatNameMr && (
                <div><span className="text-muted-foreground">ग्रामपंचायत:</span> <span className="font-medium">{String(village.gramPanchayatNameMr)}</span></div>
              )}
              {village.taluka && (
                <div><span className="text-muted-foreground">तालुका:</span> <span className="font-medium">{String(village.taluka)}</span></div>
              )}
              {village.district && (
                <div><span className="text-muted-foreground">जिल्हा:</span> <span className="font-medium">{String(village.district)}</span></div>
              )}
              {village.sarpanchNameMr && (
                <div><span className="text-muted-foreground">सरपंच:</span> <span className="font-medium">{String(village.sarpanchNameMr)}</span></div>
              )}
              {village.secretaryNameMr && (
                <div><span className="text-muted-foreground">ग्रामसेवक:</span> <span className="font-medium">{String(village.secretaryNameMr)}</span></div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary / Totals Cards */}
      {totals && Object.keys(totals).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(totals).map(([key, value]) => {
            if (typeof value === 'object' && value !== null) return null;
            const label = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, s => s.toUpperCase())
              .replace('Total', 'एकूण')
              .replace('Count', 'संख्या')
              .replace('Amount', 'रक्कम')
              .replace('Balance', 'शिल्लक')
              .replace('Receipts', 'प्राप्ती')
              .replace('Payments', 'पावती')
              .replace('Deposits', 'ठेवी')
              .replace('Withdrawals', 'उत्तर्या')
              .replace('Demand', 'मागणी')
              .replace('Paid', 'वसूल')
              .replace('Outstanding', 'बकायपोरी')
              .replace('Collected', 'वसूल')
              .replace('Depreciation', 'घसारा')
              .replace('Purchase', 'खरेदी')
              .replace('Current', 'सध्याचे')
              .replace('Value', 'मूल्य')
              .replace('Cost', 'खर्च')
              .replace('Groups', 'गट')
              .replace('Schemes', 'योजना')
              .replace('Income', 'उत्पन्न')
              .replace('Expenditure', 'खर्च')
              .replace('Original', 'मूळ')
              .replace('Revised', 'दुरुस्तीत')
              .replace('Budget', 'अंदाज')
              .replace('Actual', 'वास्तव')
              .replace('Debit', 'जमा')
              .replace('Credit', 'नामे')
              .replace('Closing', 'शेवटचे')
              .replace('Assessed', 'आकारणी')
              .replace('Collection', 'वसूल')
              .replace('Asset', 'मालमत्ता')
              .replace('Liability', 'दायित्व')
              .replace('Reappropriation', 'पुनर्विनियोजन');
            return (
              <Card key={key} className="border-l-4 border-l-gp-teal">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-lg font-bold">
                    {typeof value === 'number'
                      ? value > 999
                        ? `₹${value.toLocaleString('en-IN')}`
                        : value.toLocaleString('en-IN')
                      : String(value)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Data Table */}
      {rows && rows.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gp-teal to-gp-teal-dark">
                    <TableHead className="text-xs text-white w-10">#</TableHead>
                    {displayHeaders.map((header, idx) => (
                      <TableHead key={idx} className="text-xs text-white whitespace-nowrap">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((rec, idx) => (
                    <TableRow key={String(rec.id || rec._sr || idx)} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      {columnKeys.map(key => (
                        <TableCell key={key} className="text-sm whitespace-nowrap max-w-[200px] truncate">
                          {formatValue(rec[key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">या नमुन्यात अद्याप डेटा नाही</p>
            <p className="text-xs text-muted-foreground/60 mt-1">संबंधित मास्टर डेटा आणि व्यवहार नोंदवल्यावर डेटा दिसेल</p>
          </CardContent>
        </Card>
      )}

      {/* Row count and meta */}
      <div className="flex items-center gap-3 flex-wrap">
        {rows && rows.length > 0 && (
          <Badge variant="outline" className="text-sm">एकूण नोंदी: {rows.length}</Badge>
        )}
        {meta?.financialYear && (
          <Badge variant="outline" className="text-sm">आर्थिक वर्ष: {String(meta.financialYear)}</Badge>
        )}
      </div>
    </div>
  );
}
