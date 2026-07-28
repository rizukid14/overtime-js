import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Moon, 
  Sun, 
  RotateCcw,
  TrendingUp,
  ShieldCheck,
  Clock,
  Briefcase,
  HelpCircle,
  FileSpreadsheet,
  Target,
  Sparkles,
  X,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { TER_CATEGORIES } from './terData';
import * as XLSX from 'xlsx';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Switch } from './components/ui/switch';

export default function OvertimeCalculator() {
  // --- STATE ---
  const [basicSalary, setBasicSalary] = useState(''); // Default null / empty
  const [weekdayEntries, setWeekdayEntries] = useState([]);
  const [holidayEntries, setHolidayEntries] = useState([]);
  const [additionalSalary, setAdditionalSalary] = useState('');
  const [maxCap, setMaxCap] = useState(2500000);
  const [useMaxCap, setUseMaxCap] = useState(true);
  
  // Fully Decoupled & Independent Privacy States:
  const [showBasicSalary, setShowBasicSalary] = useState(true); // Independent toggle for Gaji Pokok input
  const [showGrossPrivacy, setShowGrossPrivacy] = useState(false); // Independent toggle ONLY for Total Bruto (Gaji + Lembur)
  const [showTaxCardPrivacy, setShowTaxCardPrivacy] = useState(false); // Independent toggle ONLY for Estimasi PPh 21 & Take Home Pay card

  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false); // Default collapsed
  const [showFormula, setShowFormula] = useState(false); // Collapsible formula reference state
  
  // Reverse Solver Modal States:
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [targetAmountInput, setTargetAmountInput] = useState('');
  const [targetType, setTargetType] = useState('overtime'); // 'overtime' or 'net'
  const [solveStrategy, setSolveStrategy] = useState('mixed'); // 'weekday', 'weekend', 'mixed'
  const [solvedResult, setSolvedResult] = useState(null);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : false;
  });
  
  // Tax & PTKP Category State
  const [ptkpCategory, setPtkpCategory] = useState('A');

  // Dark Mode Sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Warn before closing tab if data exists
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasData = Boolean(basicSalary) || weekdayEntries.length > 0 || holidayEntries.length > 0 || additionalSalary;
      if (hasData) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [basicSalary, weekdayEntries, holidayEntries, additionalSalary]);

  // Reset function
  const handleReset = () => {
    setBasicSalary('');
    setWeekdayEntries([]);
    setHolidayEntries([]);
    setAdditionalSalary('');
    setSolvedResult(null);
    setTargetAmountInput('');
  };

  const hourlyRate = (parseFloat(basicSalary) || 0) / 173;

  // --- ENTRY MANAGERS ---
  const addEntry = (type, defaultHours = '') => {
    const newEntry = { hours: String(defaultHours) };
    if (type === 'weekday') {
      setWeekdayEntries([...weekdayEntries, newEntry]);
    } else {
      setHolidayEntries([...holidayEntries, newEntry]);
    }
  };

  const removeEntry = (type, index) => {
    if (type === 'weekday') {
      setWeekdayEntries(weekdayEntries.filter((_, i) => i !== index));
    } else {
      setHolidayEntries(holidayEntries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (type, index, value) => {
    // Sanitize to max 2 digits / valid hours (0-24)
    let sanitized = value.replace(/[^0-9.]/g, '');
    if (sanitized.length > 4) sanitized = sanitized.slice(0, 4);
    const numVal = parseFloat(sanitized);
    if (numVal > 24) sanitized = '24';

    if (type === 'weekday') {
      const updated = [...weekdayEntries];
      updated[index].hours = sanitized;
      setWeekdayEntries(updated);
    } else {
      const updated = [...holidayEntries];
      updated[index].hours = sanitized;
      setHolidayEntries(updated);
    }
  };

  // Helper to format input string with thousand dots e.g. 1000000 -> 1.000.000
  const formatNumberWithDots = (val) => {
    if (!val) return '';
    const clean = String(val).replace(/\D/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('id-ID').format(clean);
  };

  // Handle salary input change with dot formatting
  const handleSalaryChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    setBasicSalary(rawDigits);
  };

  // --- MATH & LOGIC ---
  const calculateWeekdayProgressive = () => {
    let total150 = 0, total200 = 0;
    let hours150 = 0, hours200 = 0;
    
    weekdayEntries.forEach(entry => {
      const hours = parseFloat(entry.hours) || 0;
      if (hours === 0) return;

      if (hours > 0) {
        const h150 = Math.min(hours, 1);
        total150 += h150 * hourlyRate * 1.5;
        hours150 += h150;
      }

      if (hours > 1) {
        const h200 = hours - 1;
        total200 += h200 * hourlyRate * 2;
        hours200 += h200;
      }
    });

    return { 
      total: total150 + total200,
      rate150: hours150, 
      rate200: hours200,
      amount150: total150,
      amount200: total200
    };
  };
  
  const calculateHolidayProgressive = () => {
    let total200 = 0, total300 = 0, total400 = 0;
    let sumH200 = 0, sumH300 = 0, sumH400 = 0;

    holidayEntries.forEach(entry => {
      const hours = parseFloat(entry.hours) || 0;
      if (hours === 0) return;

      // Jam 1–8 → 200%
      const h200 = Math.min(hours, 8);
      total200 += h200 * hourlyRate * 2;
      sumH200 += h200;

      // Jam ke-9 → 300%
      if (hours > 8) {
        const h300 = Math.min(hours - 8, 1);
        total300 += h300 * hourlyRate * 3;
        sumH300 += h300;
      }

      // Jam ke-10 dst → 400%
      if (hours > 9) {
        const h400 = hours - 9;
        total400 += h400 * hourlyRate * 4;
        sumH400 += h400;
      }
    });
    
    return {
      total: total200 + total300 + total400,
      rate200: sumH200,
      rate300: sumH300,
      rate400: sumH400,
      amount200: total200,
      amount300: total300,
      amount400: total400,
    };
  };

  const weekdayCalc = calculateWeekdayProgressive();
  const holidayCalc = calculateHolidayProgressive();
  const calculatedTotal = weekdayCalc.total + holidayCalc.total;
  
  const parsedMaxCap = parseFloat(maxCap) || 0;
  const grandTotal = useMaxCap ? Math.min(calculatedTotal, parsedMaxCap) : calculatedTotal;
  const finalTotal = (parseFloat(basicSalary) || 0) + (parseFloat(additionalSalary) || 0) + grandTotal;
  const isCapped = useMaxCap && calculatedTotal > parsedMaxCap;

  const weekdayHours = weekdayEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);
  const holidayHours = holidayEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);

  // Constants for BPJS
  const RATES = {
    emp: { kes: 0.01, jht: 0.02, jp: 0.01 },
    co: { kes: 0.04, jkk: 0.0024, jkm: 0.003 }
  };

  const bpjsBase = (parseFloat(basicSalary) || 0);
  
  const bpjsKesEmp = Math.min(bpjsBase, 12000000) * RATES.emp.kes;
  const bpjsJHTEmp = bpjsBase * RATES.emp.jht;
  const bpjsJPEmp = Math.min(bpjsBase, 10047900) * RATES.emp.jp;
  const totalBpjsEmp = bpjsKesEmp + bpjsJHTEmp + bpjsJPEmp;

  const bpjsKesCo = Math.min(bpjsBase, 12000000) * RATES.co.kes;
  const bpjsJKKCo = bpjsBase * RATES.co.jkk;
  const bpjsJKMCo = bpjsBase * RATES.co.jkm;
  const totalBpjsCo = bpjsKesCo + bpjsJKKCo + bpjsJKMCo;

  const taxableGross = finalTotal + totalBpjsCo;
  
  const getTerRate = (income) => {
    const category = TER_CATEGORIES[ptkpCategory];
    const bracket = category.brackets.find(b => income >= b.min && (b.max === null || income <= b.max || b.max === Infinity));
    return bracket ? bracket.rate : 0;
  };

  const terRate = getTerRate(taxableGross);
  const taxAmount = taxableGross * terRate;
  const netSalary = finalTotal - taxAmount - totalBpjsEmp;

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // --- REVERSE SOLVER ALGORITHM ---
  const handleSolveOvertime = () => {
    const rate = hourlyRate;
    const target = parseFloat(targetAmountInput.replace(/\D/g, '')) || 0;

    if (!rate || rate <= 0) {
      alert("Silahkan isi Gaji Pokok terlebih dahulu untuk menentukan tarif per jam.");
      return;
    }
    if (!target || target <= 0) {
      alert("Silahkan masukkan nominal target aktual yang valid.");
      return;
    }

    let requiredOtPay = target;

    // If target type is Take Home Pay (net)
    if (targetType === 'net') {
      const basePlusAdd = (parseFloat(basicSalary) || 0) + (parseFloat(additionalSalary) || 0);
      let low = 0, high = 100000000;
      for (let i = 0; i < 50; i++) {
        let mid = (low + high) / 2;
        let testGross = basePlusAdd + mid;
        let testTaxable = testGross + totalBpjsCo;
        let testRate = getTerRate(testTaxable);
        let testTax = testTaxable * testRate;
        let testNet = testGross - testTax - totalBpjsEmp;
        if (testNet < target) {
          low = mid;
        } else {
          high = mid;
        }
      }
      requiredOtPay = Math.max(0, high);
    }

    const getWdPay = (h) => {
      if (h <= 0) return 0;
      const h150 = Math.min(h, 1);
      const h200 = Math.max(0, h - 1);
      return (h150 * 1.5 + h200 * 2.0) * rate;
    };

    const getHolPay = (h) => {
      if (h <= 0) return 0;
      const h200 = Math.min(h, 8);
      const h300 = Math.min(Math.max(0, h - 8), 1);
      const h400 = Math.max(0, h - 9);
      return (h200 * 2.0 + h300 * 3.0 + h400 * 4.0) * rate;
    };

    let bestWd = [];
    let bestHol = [];
    let bestTotal = 0;
    let bestDiff = Infinity;

    if (solveStrategy === 'weekday') {
      const unit2h = getWdPay(2);
      let days = Math.floor(requiredOtPay / unit2h);
      let rem = requiredOtPay - (days * unit2h);
      let wd = Array(days).fill(2);
      if (rem > 0) {
        let extraHours = Math.min(24, Math.round((rem / (rate * 2)) * 2) / 2);
        if (extraHours > 0) wd.push(extraHours);
      }
      let tot = wd.reduce((s, h) => s + getWdPay(h), 0);
      bestWd = wd;
      bestHol = [];
      bestTotal = tot;
      bestDiff = Math.abs(tot - requiredOtPay);
    } else if (solveStrategy === 'weekend') {
      const unit8h = getHolPay(8);
      let days = Math.floor(requiredOtPay / unit8h);
      let rem = requiredOtPay - (days * unit8h);
      let hol = Array(days).fill(8);
      if (rem > 0) {
        let extraHours = Math.min(24, Math.round((rem / (rate * 2)) * 2) / 2);
        if (extraHours > 0) hol.push(extraHours);
      }
      let tot = hol.reduce((s, h) => s + getHolPay(h), 0);
      bestWd = [];
      bestHol = hol;
      bestTotal = tot;
      bestDiff = Math.abs(tot - requiredOtPay);
    } else {
      // Mixed Strategy
      const hol8 = getHolPay(8);
      let holCount = Math.min(2, Math.floor(requiredOtPay / hol8));
      let rem = requiredOtPay - (holCount * hol8);
      const wd2 = getWdPay(2);
      let wdCount = Math.floor(rem / wd2);
      let rem2 = rem - (wdCount * wd2);
      let wd = Array(wdCount).fill(2);
      let hol = Array(holCount).fill(8);
      if (rem2 > 0) {
        let extraH = Math.min(24, Math.round((rem2 / (rate * 2)) * 2) / 2);
        if (extraH > 0) wd.push(extraH);
      }
      let tot = wd.reduce((s, h) => s + getWdPay(h), 0) + hol.reduce((s, h) => s + getHolPay(h), 0);
      bestWd = wd;
      bestHol = hol;
      bestTotal = tot;
      bestDiff = Math.abs(tot - requiredOtPay);
    }

    setSolvedResult({
      targetInput: target,
      requiredOtPay,
      weekday: bestWd,
      holiday: bestHol,
      calculatedOtPay: bestTotal,
      diff: bestDiff
    });
  };

  const applySolvedResult = () => {
    if (!solvedResult) return;
    setWeekdayEntries(solvedResult.weekday.map(h => ({ hours: String(h) })));
    setHolidayEntries(solvedResult.holiday.map(h => ({ hours: String(h) })));
    setShowReverseModal(false);
  };

  // Independent Privacy Helpers
  const renderGrossAmount = (amount, maskText = 'Rp •••••••••') => {
    if (showGrossPrivacy) {
      return formatCurrency(amount);
    }
    return (
      <span 
        onClick={(e) => { e.stopPropagation(); setShowGrossPrivacy(true); }}
        className="inline-block font-mono tracking-widest text-slate-300 dark:text-slate-500 filter blur-[2.5px] select-none cursor-pointer hover:blur-none transition-all duration-200"
        title="Klik untuk membuka Total Bruto"
      >
        {maskText}
      </span>
    );
  };

  const renderTaxCardAmount = (amount, maskText = 'Rp •••••••••') => {
    if (showTaxCardPrivacy) {
      return formatCurrency(amount);
    }
    return (
      <span 
        onClick={(e) => { e.stopPropagation(); setShowTaxCardPrivacy(true); }}
        className="inline-block font-mono tracking-widest text-slate-300 dark:text-slate-500 filter blur-[2.5px] select-none cursor-pointer hover:blur-none transition-all duration-200"
        title="Klik untuk membuka nominal PPh 21 / Take Home Pay"
      >
        {maskText}
      </span>
    );
  };

  // --- EXCEL DOWNLOAD ---
  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    
    const summaryData = [
      ["RINGKASAN ESTIMASI GAJI & LEMBUR", ""],
      ["Tanggal", new Date().toLocaleDateString('id-ID')],
      ["", ""],
      ["1. PENDAPATAN", ""],
      ["Gaji Pokok", parseFloat(basicSalary) || 0],
      ["Tambahan Gaji", parseFloat(additionalSalary) || 0],
      ["Total Lembur (Weekday)", weekdayCalc.total],
      ["Total Lembur (Holiday)", holidayCalc.total],
      ["Lembur (Kalkulasi)", calculatedTotal],
      ["Batas Maksimal Overtime", useMaxCap ? parseFloat(maxCap) : "Tidak Ada"],
      ["Lembur (Setelah Batas)", grandTotal],
      ["TOTAL BRUTO", finalTotal],
      ["", ""],
      ["2. POTONGAN (ESTIMASI)", ""],
      ["Kategori TER", TER_CATEGORIES[ptkpCategory].label],
      ["Tarif TER (%)", (terRate * 100).toFixed(2)],
      ["PPh 21 (TER)", taxAmount],
      ["BPJS Kesehatan (1%)", bpjsKesEmp],
      ["BPJS TK - JHT (2%)", bpjsJHTEmp],
      ["BPJS TK - JP (1%)", bpjsJPEmp],
      ["TOTAL POTONGAN", (taxAmount + totalBpjsEmp)],
      ["", ""],
      ["3. ESTIMASI BERSIH", ""],
      ["TAKE HOME PAY", netSalary]
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Gaji");

    const detailedData = [["RINCIAN JAM LEMBUR"]];
    detailedData.push(["Tipe", "Jam"]);
    weekdayEntries.forEach((e, i) => {
      if (e.hours) detailedData.push([`Weekday Entry ${i + 1}`, parseFloat(e.hours)]);
    });
    holidayEntries.forEach((e, i) => {
      if (e.hours) detailedData.push([`Holiday Entry ${i + 1}`, parseFloat(e.hours)]);
    });

    if (detailedData.length > 2) {
      const wsDetail = XLSX.utils.aoa_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(wb, wsDetail, "Rincian Jam");
    }

    XLSX.writeFile(wb, `Kalkulasi_Gaji_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3.5 shadow-sm">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Kalkulator Overtime & TER Gaji
                </h1>
                <Badge variant="default" className="hidden sm:inline-flex">MII JMK</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hitung overtime progresif (PP 35/2021) & estimasi PPh 21 TER (Dirjen Pajak)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {/* Reverse Overtime Pay Solver Button */}
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setShowReverseModal(true)}
              title="Cari jam lembur otomatis dari nominal aktual slip gaji"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
            >
              <Target className="w-3.5 h-3.5 mr-1.5" />
              Cari Jam (Reverse Solver)
            </Button>

            <Button variant="outline" size="sm" onClick={handleReset} title="Reset semua data">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset
            </Button>
            <Button variant="emerald" size="sm" onClick={downloadExcel} title="Download Laporan Excel">
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Fullscreen Dashboard Workspace */}
      <main className="max-w-[1700px] mx-auto p-4 md:p-6 lg:p-8">
        {/* Info Banner */}
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              <span className="font-bold">⚠️ Perhitungan Estimasi:</span> Silahkan sesuaikan jam lembur di Weekend / Weekday dalam kelipatan 0,5 atau 1 jam untuk hasil optimal. 
              Punya nominal aktual slip gaji? Gunakan fitur <span className="font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer underline" onClick={() => setShowReverseModal(true)}>Cari Jam (Reverse Solver)</span>.
            </div>
          </div>
          <Button 
            variant="outline" 
            size="xs"
            onClick={() => setShowReverseModal(true)}
            className="text-xs font-bold text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 bg-white/60 dark:bg-slate-900/60 shrink-0"
          >
            <Target className="w-3.5 h-3.5 mr-1" />
            Cari Jam
          </Button>
        </div>

        {/* 12-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Input Forms & Overtime Entry Grids (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Salary & Configuration Card */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle className="text-lg">Gaji Pokok & Konfigurasi</CardTitle>
                  </div>
                  <Badge variant="secondary">Langkah 1</Badge>
                </div>
                <CardDescription>Masukkan Gaji Pokok untuk menentukan tarif per jam (Gaji / 173)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Salary Input with dot separator & placeholder Contoh: 1.000.000 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Gaji Pokok (Basic Salary)
                    </label>
                    <div className="relative">
                      <Input
                        type={showBasicSalary ? "text" : "password"}
                        value={showBasicSalary ? formatNumberWithDots(basicSalary) : basicSalary}
                        onChange={handleSalaryChange}
                        placeholder="Contoh: 1.000.000"
                        className="pr-10 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowBasicSalary(!showBasicSalary)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title={showBasicSalary ? "Sembunyikan Input Gaji Pokok" : "Tampilkan Input Gaji Pokok"}
                      >
                        {showBasicSalary ? <EyeOff className="w-4 h-4 text-indigo-500" /> : <Eye className="w-4 h-4 text-indigo-500" />}
                      </button>
                    </div>
                  </div>

                  {/* Additional Salary Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tambahan Gaji / Tunjangan (Opsional)
                    </label>
                    <Input
                      type="text"
                      value={formatNumberWithDots(additionalSalary)}
                      onChange={(e) => setAdditionalSalary(e.target.value.replace(/\D/g, ''))}
                      placeholder="Contoh: 500.000"
                      className="font-medium"
                    />
                  </div>
                </div>

                {/* Hourly Rate Pill & Max Cap Configuration */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Tarif per Jam:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-200/50 dark:border-indigo-900/50">
                      {formatCurrency(hourlyRate)} / jam
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={useMaxCap}
                        onChange={setUseMaxCap}
                        id="max-cap-switch"
                      />
                      <label htmlFor="max-cap-switch" className="text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                        Batas Maks Overtime
                      </label>
                    </div>

                    {useMaxCap && (
                      <Input
                        type="text"
                        value={formatNumberWithDots(maxCap)}
                        onChange={(e) => setMaxCap(e.target.value.replace(/\D/g, ''))}
                        className="w-32 h-8 text-xs font-medium"
                        placeholder="Maks (Rp)"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekday Overtime Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <CardTitle className="text-lg">Overtime Weekday</CardTitle>
                      <CardDescription>Senin - Kamis (Progresif: Jam 1 @ 150%, Jam 2+ @ 200%)</CardDescription>
                    </div>
                  </div>
                  
                  {/* Quick Choice Buttons: 1H, 2H, 3H, 4H, 5H */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-block">Quick Add:</span>
                    {[1, 2, 3, 4, 5].map((h) => (
                      <Button
                        key={h}
                        variant="outline"
                        size="xs"
                        onClick={() => addEntry('weekday', h)}
                        className="h-7 px-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                        title={`Tambah ${h} Jam`}
                      >
                        +{h}H
                      </Button>
                    ))}
                    <Button variant="emerald" size="xs" onClick={() => addEntry('weekday', 2)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Baris
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Compact Entries Grid */}
                {weekdayEntries.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400">
                    Belum ada jam lembur weekday. Klik tombol pilihan cepat di atas.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {weekdayEntries.map((entry, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-1.5 p-1.5 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
                      >
                        <span className="text-[11px] font-semibold text-slate-500 w-10 text-center">H-{idx + 1}</span>
                        <Input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          placeholder="0"
                          value={entry.hours}
                          onChange={(e) => updateEntry('weekday', idx, e.target.value)}
                          className="w-16 h-8 text-center font-bold text-xs p-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                        />
                        <span className="text-xs text-slate-400 font-medium">jam</span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeEntry('weekday', idx)}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subtotal Chips */}
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Total Weekday: <strong className="text-emerald-700 dark:text-emerald-400">{weekdayHours} jam</strong>
                    </span>
                    {weekdayCalc.rate150 > 0 && (
                      <Badge variant="emerald" className="text-[11px]">
                        150%: {weekdayCalc.rate150}h ({formatCurrency(weekdayCalc.amount150)})
                      </Badge>
                    )}
                    {weekdayCalc.rate200 > 0 && (
                      <Badge variant="emerald" className="text-[11px]">
                        200%: {weekdayCalc.rate200}h ({formatCurrency(weekdayCalc.amount200)})
                      </Badge>
                    )}
                  </div>

                  <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                    {formatCurrency(weekdayCalc.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Weekend / Holiday Overtime Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <CardTitle className="text-lg">Overtime Weekend / Libur</CardTitle>
                      <CardDescription>Jumat - Minggu (Progresif: 1-8h @ 200%, 9h @ 300%, 10h+ @ 400%)</CardDescription>
                    </div>
                  </div>

                  {/* Quick Choice Buttons for Weekend: 4H, 6H, 10H, 12H */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-block">Quick Add:</span>
                    {[4, 6, 10, 12].map((h) => (
                      <Button
                        key={h}
                        variant="outline"
                        size="xs"
                        onClick={() => addEntry('holiday', h)}
                        className="h-7 px-2 text-xs font-bold text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        title={`Tambah ${h} Jam`}
                      >
                        +{h}H
                      </Button>
                    ))}
                    <Button variant="blue" size="xs" onClick={() => addEntry('holiday', 8)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Baris
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Compact Entries Grid */}
                {holidayEntries.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400">
                    Belum ada jam lembur weekend. Klik tombol pilihan cepat di atas.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {holidayEntries.map((entry, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-1.5 p-1.5 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                      >
                        <span className="text-[11px] font-semibold text-slate-500 w-10 text-center">H-{idx + 1}</span>
                        <Input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          placeholder="0"
                          value={entry.hours}
                          onChange={(e) => updateEntry('holiday', idx, e.target.value)}
                          className="w-16 h-8 text-center font-bold text-xs p-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                        />
                        <span className="text-xs text-slate-400 font-medium">jam</span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeEntry('holiday', idx)}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subtotal Chips */}
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Total Weekend: <strong className="text-blue-700 dark:text-blue-400">{holidayHours} jam</strong>
                    </span>
                    {holidayCalc.rate200 > 0 && (
                      <Badge variant="blue" className="text-[11px]">
                        200%: {holidayCalc.rate200}h ({formatCurrency(holidayCalc.amount200)})
                      </Badge>
                    )}
                    {holidayCalc.rate300 > 0 && (
                      <Badge variant="purple" className="text-[11px]">
                        300%: {holidayCalc.rate300}h ({formatCurrency(holidayCalc.amount300)})
                      </Badge>
                    )}
                    {holidayCalc.rate400 > 0 && (
                      <Badge variant="amber" className="text-[11px]">
                        400%: {holidayCalc.rate400}h ({formatCurrency(holidayCalc.amount400)})
                      </Badge>
                    )}
                  </div>

                  <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">
                    {formatCurrency(holidayCalc.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: Real-Time Summary & Inline Tax Breakdown (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">

            {/* Overtime Summary Card */}
            <Card className="border-indigo-200/60 dark:border-indigo-900/60 overflow-hidden shadow-md">
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-5 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Ringkasan Overtime</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-none backdrop-blur-md">
                    Total
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-indigo-100 mt-3">
                  <div className="flex justify-between">
                    <span>Weekday ({weekdayHours} jam):</span>
                    <span className="font-semibold">{formatCurrency(weekdayCalc.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekend ({holidayHours} jam):</span>
                    <span className="font-semibold">{formatCurrency(holidayCalc.total)}</span>
                  </div>

                  {parseFloat(additionalSalary) > 0 && (
                    <div className="flex justify-between text-teal-200">
                      <span>Tambahan Gaji:</span>
                      <span className="font-semibold">{formatCurrency(parseFloat(additionalSalary))}</span>
                    </div>
                  )}

                  {isCapped && (
                    <div className="p-2 rounded bg-amber-500/20 text-amber-200 text-[11px] mt-2 border border-amber-400/30">
                      ⚠️ Kalkulasi ({formatCurrency(calculatedTotal)}) dipotong ke batas maksimal ({formatCurrency(maxCap)})
                    </div>
                  )}

                  {/* TOTAL OVERTIME (Always visible, not blurred) */}
                  <div className="border-t border-white/20 pt-2.5 mt-2 flex justify-between items-center text-sm font-bold text-white">
                    <span>TOTAL OVERTIME:</span>
                    <span className="text-base text-yellow-300 font-extrabold">{formatCurrency(grandTotal)}</span>
                  </div>

                  {/* INDEPENDENT PRIVACY 1: Total Bruto (Gaji + Lembur) */}
                  <div className="border-t border-white/20 pt-3 mt-2 flex items-end justify-between">
                    <div className="w-full">
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <p className="text-[11px] uppercase tracking-wider text-indigo-200 font-medium">
                          Total Bruto (Gaji + Lembur)
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowGrossPrivacy(!showGrossPrivacy)}
                          className="flex items-center gap-1 text-[11px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-white transition-colors"
                          title={showGrossPrivacy ? "Sembunyikan Total Bruto" : "Tampilkan Total Bruto"}
                        >
                          {showGrossPrivacy ? <EyeOff className="w-3.5 h-3.5 text-yellow-300" /> : <Eye className="w-3.5 h-3.5 text-yellow-300" />}
                          <span className="text-[10px]">{showGrossPrivacy ? "Hide" : "Show"}</span>
                        </button>
                      </div>

                      <p 
                        onClick={() => setShowGrossPrivacy(!showGrossPrivacy)}
                        className="text-2xl font-black cursor-pointer hover:opacity-90 transition-opacity"
                        title="Klik untuk toggle privasi Total Bruto"
                      >
                        {renderGrossAmount(finalTotal, 'Rp •••••••••')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Inline Tax & Net Salary Breakdown Panel */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle className="text-base">Estimasi PPh 21 TER & Gaji Bersih</CardTitle>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
                    className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 border-indigo-200 dark:border-indigo-800 shadow-2xs transition-all"
                  >
                    {showTaxBreakdown ? "Sembunyikan Rincian ▲" : "Tampilkan Rincian ▼"}
                  </Button>
                </div>
                <CardDescription>Rincian potongan PPh 21 (Standar TER 2024) & BPJS Ketenagakerjaan/Kesehatan</CardDescription>
              </CardHeader>

              {showTaxBreakdown && (
                <CardContent className="space-y-4 pt-1">
                  {/* PTKP Category Selector */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Kategori PTKP
                      </label>
                      <select 
                        value={ptkpCategory}
                        onChange={(e) => setPtkpCategory(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {Object.keys(TER_CATEGORIES).map(cat => (
                          <option key={cat} value={cat}>{TER_CATEGORIES[cat].label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="text-center bg-indigo-50 dark:bg-indigo-950/80 p-2 rounded-lg border border-indigo-200/60 dark:border-indigo-900/60 min-w-[70px]">
                      <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">TER</span>
                      <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">{(terRate * 100).toFixed(2)}%</span>
                    </div>
                  </div>

                  {/* Deduction Breakdown Table */}
                  <div className="space-y-2 text-xs">
                    {/* INDEPENDENT PRIVACY 2: Penghasilan Bruto (Kena Pajak) */}
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="flex items-center gap-1.5 font-medium">
                        Penghasilan Bruto (Kena Pajak):
                        <button
                          type="button"
                          onClick={() => setShowTaxCardPrivacy(!showTaxCardPrivacy)}
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-0.5"
                          title={showTaxCardPrivacy ? "Sembunyikan Nominal Pajak" : "Tampilkan Nominal Pajak"}
                        >
                          {showTaxCardPrivacy ? <EyeOff className="w-3.5 h-3.5 text-indigo-500" /> : <Eye className="w-3.5 h-3.5 text-indigo-500" />}
                        </button>
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {renderTaxCardAmount(taxableGross, 'Rp •••••••••')}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">PPh 21 TER ({(terRate * 100).toFixed(2)}%):</span>
                        <span className="font-bold text-red-500">-{formatCurrency(taxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>BPJS Kesehatan (1%):</span>
                        <span className="font-semibold text-red-500">-{formatCurrency(bpjsKesEmp)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>BPJS TK - JHT (2%):</span>
                        <span className="font-semibold text-red-500">-{formatCurrency(bpjsJHTEmp)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>BPJS TK - JP (1%):</span>
                        <span className="font-semibold text-red-500">-{formatCurrency(bpjsJPEmp)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800 pt-2">
                      <span>Total Potongan:</span>
                      <span className="text-red-600 dark:text-red-400">
                        -{formatCurrency(taxAmount + totalBpjsEmp)}
                      </span>
                    </div>
                  </div>

                  {/* INDEPENDENT PRIVACY 2 (Cont.): ESTIMASI TAKE HOME PAY (BERSIH) Callout */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-xl text-white shadow-md shadow-emerald-600/20 text-center relative overflow-hidden">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <p className="text-xs text-emerald-100 font-bold tracking-wider">ESTIMASI TAKE HOME PAY (BERSIH)</p>
                      <button
                        type="button"
                        onClick={() => setShowTaxCardPrivacy(!showTaxCardPrivacy)}
                        className="bg-white/20 hover:bg-white/30 text-white p-1 rounded-md transition-colors flex items-center gap-1 text-[10px] px-2 font-medium"
                        title={showTaxCardPrivacy ? "Sembunyikan Take Home Pay" : "Tampilkan Take Home Pay"}
                      >
                        {showTaxCardPrivacy ? <EyeOff className="w-3.5 h-3.5 text-yellow-300" /> : <Eye className="w-3.5 h-3.5 text-yellow-300" />}
                        <span>{showTaxCardPrivacy ? "Privasi On" : "Lihat Nominal"}</span>
                      </button>
                    </div>

                    <p 
                      onClick={() => setShowTaxCardPrivacy(!showTaxCardPrivacy)}
                      className="text-2xl md:text-3xl font-black cursor-pointer hover:opacity-90 transition-opacity mt-1"
                      title="Klik untuk toggle privasi"
                    >
                      {renderTaxCardAmount(netSalary, 'Rp •••••••••')}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Collapsible Formula Reference Card with Hint */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-3 cursor-pointer select-none" onClick={() => setShowFormula(!showFormula)}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>📋</span> Rumus Perhitungan
                    </CardTitle>
                    <CardDescription className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mt-1">
                      💡 Hint: Rate per jam = Gaji ÷ 173 ({formatCurrency(hourlyRate)}). Weekday: 150-200% | Weekend: 200-400%
                    </CardDescription>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setShowFormula(!showFormula); }}
                    className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 border-indigo-200 dark:border-indigo-800 shrink-0 shadow-2xs"
                  >
                    {showFormula ? "Sembunyikan ▲" : "Lihat Detail ▼"}
                  </Button>
                </div>
              </CardHeader>

              {showFormula && (
                <CardContent className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                  <p>
                    <strong>Tarif per Jam:</strong> Gaji Pokok ÷ 173 jam = <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(hourlyRate)}</span>
                  </p>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    <p className="font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                      Weekday (Senin - Kamis) - Progresif Per Hari:
                    </p>
                    <ul className="space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
                      <li>• <strong>Jam pertama:</strong> × {formatCurrency(hourlyRate)} × 1.5 (150%)</li>
                      <li>• <strong>Jam ke-2 dst:</strong> × {formatCurrency(hourlyRate)} × 2 (200%)</li>
                    </ul>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    <p className="font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                      Weekend/Holiday (Jumat - Minggu & Libur) - Progresif Per Hari (PP 35/2021):
                    </p>
                    <ul className="space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
                      <li>• <strong>Jam 1-8:</strong> × {formatCurrency(hourlyRate)} × 2 (200%)</li>
                      <li>• <strong>Jam ke-9:</strong> × {formatCurrency(hourlyRate)} × 3 (300%)</li>
                      <li>• <strong>Jam ke-10 dst:</strong> × {formatCurrency(hourlyRate)} × 4 (400%)</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 mt-2 text-amber-900 dark:text-amber-200 space-y-2">
                    <p className="text-[11px] font-bold">💡 Contoh Perhitungan:</p>
                    <p className="text-[11px] leading-relaxed">
                      • <strong>Weekday (4 jam):</strong> 1h × {formatCurrency(hourlyRate)} × 1.5 + 3h × {formatCurrency(hourlyRate)} × 2
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      • <strong>Weekend (10 jam):</strong> 8h × {formatCurrency(hourlyRate)} × 2 + 1h × {formatCurrency(hourlyRate)} × 3 + 1h × {formatCurrency(hourlyRate)} × 4
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

          </div>

        </div>
      </main>

      {/* --- REVERSE OVERTIME SOLVER MODAL --- */}
      {showReverseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Reverse Overtime Solver
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cari kombinasi jam lembur dari nominal aktual slip gaji
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowReverseModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Target Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Pilih Jenis Nominal Target:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('overtime')}
                    className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                      targetType === 'overtime'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="block text-xs font-bold">💰 Total Lembur</span>
                    <span className="text-[10px] text-slate-500">Berdasarkan nominal lembur diterima</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('net')}
                    className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                      targetType === 'net'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="block text-xs font-bold">💵 Take Home Pay (Bersih)</span>
                    <span className="text-[10px] text-slate-500">Berdasarkan total gaji bersih ditransfer</span>
                  </button>
                </div>
              </div>

              {/* Target Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. Masukkan Nominal Aktual Slip Gaji (Rp):
                </label>
                <Input
                  type="text"
                  value={formatNumberWithDots(targetAmountInput)}
                  onChange={(e) => setTargetAmountInput(e.target.value.replace(/\D/g, ''))}
                  placeholder={targetType === 'overtime' ? "Contoh: 1.500.000" : "Contoh: 8.500.000"}
                  className="font-bold text-sm"
                />
              </div>

              {/* Strategy Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  3. Pola Jam Lembur Yang Diinginkan:
                </label>
                <select
                  value={solveStrategy}
                  onChange={(e) => setSolveStrategy(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-medium"
                >
                  <option value="mixed">⚡ Kombinasi Seimbang (Weekday 2h + Weekend 8h)</option>
                  <option value="weekday">📅 Hanya Weekday (Senin - Kamis)</option>
                  <option value="weekend">🏖️ Hanya Weekend / Libur (Jumat - Minggu)</option>
                </select>
              </div>

              <Button
                variant="default"
                size="default"
                onClick={handleSolveOvertime}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md mt-2"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Cari Kombinasi Jam Lembur
              </Button>

              {/* Solved Results Section */}
              {solvedResult && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-indigo-200 dark:border-indigo-900/60 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Hasil Kalkulasi Kombinasi:</span>
                    <Badge variant="emerald" className="text-[11px]">
                      Akurasi Tepat
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimasi Lembur Dihasilkan:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(solvedResult.calculatedOtPay)}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Selisih dengan Target:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrency(solvedResult.diff)}
                      </span>
                    </div>
                  </div>

                  {/* Calculated Entries List */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                    {solvedResult.weekday.length > 0 && (
                      <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        • Weekday: {solvedResult.weekday.length} hari ({solvedResult.weekday.join(' jam, ')} jam)
                      </p>
                    )}
                    {solvedResult.holiday.length > 0 && (
                      <p className="text-blue-700 dark:text-blue-400 font-semibold">
                        • Weekend: {solvedResult.holiday.length} hari ({solvedResult.holiday.join(' jam, ')} jam)
                      </p>
                    )}
                  </div>

                  <Button
                    variant="emerald"
                    size="default"
                    onClick={applySolvedResult}
                    className="w-full font-bold text-xs shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Terapkan Hasil ke Tabel Lembur Utama
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
