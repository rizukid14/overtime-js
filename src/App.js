// --- 1. IMPORTS (Getting our Tools) ---
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, AlertCircle, Eye, EyeOff, Moon, Sun, X } from 'lucide-react';
import { TER_CATEGORIES } from './terData';

export default function OvertimeCalculator() {
  // --- 2. STATE & MEMORY (The App's Memory Boxes) ---
  const [basicSalary, setBasicSalary] = useState()
  const [weekdayEntries, setWeekdayEntries] = useState([]);
  const [holidayEntries, setHolidayEntries] = useState([]);
  const [additionalSalary, setAdditionalSalary] = useState('');
  const [maxCap, setMaxCap] = useState(2500000);
  const [useMaxCap, setUseMaxCap] = useState(true);
  const [showSalary, setShowSalary] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : false;
  });
  
  // Tax Modal State
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [ptkpCategory, setPtkpCategory] = useState('A');

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
      const hasData = basicSalary || weekdayEntries.length > 0 || holidayEntries.length > 0 || additionalSalary;
      if (hasData) {
        e.preventDefault();
        e.returnValue = ''; // Standard way to trigger browser confirmation
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [basicSalary, weekdayEntries, holidayEntries, additionalSalary]);

  const hourlyRate = (parseFloat(basicSalary) || 0) / 173;

  // --- 3. MATH & LOGIC (The Brain of the App) ---
  const addEntry = (type) => {
    const newEntry = { hours: '' };
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

  const updateEntry = (type, index, field, value) => {
    if (type === 'weekday') {
      const updated = [...weekdayEntries];
      updated[index][field] = value;
      setWeekdayEntries(updated);
    } else {
      const updated = [...holidayEntries];
      updated[index][field] = value;
      setHolidayEntries(updated);
    }
  };

  // Logic from App.js
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
  
  // Logic from App.js
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
    emp: { kes: 0.01, jht: 0.02, jp: 0.01 }, // Employee cuts
    co: { kes: 0.04, jkk: 0.0024, jkm: 0.003 } // Company paid (affects tax base)
  };

  // 1. BPJS Base is usually just Basic Salary for these types of allowances
  const bpjsBase = (parseFloat(basicSalary) || 0);
  
  // 2. Employee Deductions (Potongan Gaji)
  const bpjsKesEmp = Math.min(bpjsBase, 12000000) * RATES.emp.kes;
  const bpjsJHTEmp = bpjsBase * RATES.emp.jht;
  const bpjsJPEmp = Math.min(bpjsBase, 10047900) * RATES.emp.jp;
  const totalBpjsEmp = bpjsKesEmp + bpjsJHTEmp + bpjsJPEmp;

  // 3. Company Contributions (Used for Tax Base)
  const bpjsKesCo = Math.min(bpjsBase, 12000000) * RATES.co.kes;
  const bpjsJKKCo = bpjsBase * RATES.co.jkk;
  const bpjsJKMCo = bpjsBase * RATES.co.jkm;
  const totalBpjsCo = bpjsKesCo + bpjsJKKCo + bpjsJKMCo;

  // 4. Tax Calculation (Base = Gross + Company BPJS)
  const taxableGross = finalTotal + totalBpjsCo;
  
  const getTerRate = (income) => {
    const category = TER_CATEGORIES[ptkpCategory];
    const bracket = category.brackets.find(b => income >= b.min && (b.max === null || income <= b.max || b.max === Infinity));
    return bracket ? bracket.rate : 0;
  };

  const terRate = getTerRate(taxableGross);
  const taxAmount = taxableGross * terRate;

  // 5. Net Salary (Gross - Tax - Employee BPJS)
  const netSalary = finalTotal - taxAmount - totalBpjsEmp;

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // --- 4. VISUALS & JSX (The Blueprint for the Screen) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-6 transition-colors duration-300 border border-transparent dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Kalkulator Overtime MII JMK</h1>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-300"
              title={darkMode ? "Aktifkan Light Mode" : "Aktifkan Dark Mode"}
            >
              {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>

          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-900/50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-bold mb-1">⚠️ Perhitungan Estimasi</p>
                <p>Kalkulator ini mungkin tidak akurat. Silahkan  <code className="font-mono bg-yellow-200 dark:bg-yellow-800 px-1 rounded">tambah atau kurangi</code> jam lembur baik di Weekend atau Weekdays dengan <code className="font-mono bg-yellow-200 dark:bg-yellow-800 px-1 rounded">0,5 atau 1 jam.</code> Selamat mencoba!</p>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-300 mb-2">
              Gaji Pokok (Basic Salary)
            </label>
            <div className="relative group">
                          <input
                            type={showSalary ? "number" : "password"}
                            value={basicSalary}
                            onChange={(e) => setBasicSalary(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/50 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                            placeholder="Masukkan Gaji Pokok"
                          />              <button
                onClick={() => setShowSalary(!showSalary)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-indigo-400 hover:text-indigo-600 transition-colors"
                title={showSalary ? "Sembunyikan Gaji" : "Tampilkan Gaji"}
              >
                {showSalary ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Tarif per jam: <span className={`font-semibold text-indigo-600 dark:text-indigo-400 transition-all duration-300 ${!showSalary ? 'blur-sm select-none' : ''}`}>{formatCurrency(hourlyRate)}</span>
            </p>
          </div>

          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-900/50">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                checked={useMaxCap}
                onChange={(e) => setUseMaxCap(e.target.checked)}
                className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
              />
              <label className="text-sm font-semibold text-gray-700 dark:text-orange-300">
                Gunakan Batas Maksimal Overtime
              </label>
            </div>
            {useMaxCap && (
              <input
                type="number"
                value={maxCap}
                onChange={(e) => setMaxCap(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border-2 border-orange-200 dark:border-orange-900/50 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                placeholder="Maksimal overtime per bulan"
              />
            )}
          </div>

          {/* Weekday Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Overtime Weekday
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Senin - Kamis</p>
              </div>
              <button
                onClick={() => addEntry('weekday')}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-lg shadow-green-500/30"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
              <h3 className="font-bold text-green-900 dark:text-green-300 mb-2">⚡ Sistem Perhitungan Per Hari:</h3>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>• <strong>1 jam pertama:</strong> Rate 150%</li>
                <li>• <strong>Jam ke-2 dst:</strong> Rate 200%</li>
              </ul>
            </div>

            {weekdayEntries.map((entry, idx) => (
              <div key={idx} className="flex gap-3 mb-3 items-center">
                <div className="flex-1 flex items-center relative">
                  <input
                    type="number"
                    placeholder="Masukkan Jumlah Jam"
                    value={entry.hours}
                    onChange={(e) => updateEntry('weekday', idx, 'hours', e.target.value)}
                    className="w-full pl-3 pr-12 py-2 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                  />
                  <span className="absolute right-3 text-sm font-semibold text-gray-400">Jam</span>
                </div>
                <button
                  onClick={() => removeEntry('weekday', idx)}
                  className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500 dark:hover:bg-red-600 hover:text-white transition-colors"
                  title="Hapus baris"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg mt-3 space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-bold">Total Jam Weekday:</span> {weekdayHours} jam
              </p>
              {weekdayCalc.rate150 > 0 && (
                <p className="text-sm text-green-700 dark:text-green-400">
                  • {weekdayCalc.rate150.toFixed(2)} jam @ 150% = {formatCurrency(weekdayCalc.amount150)}
                </p>
              )}
              {weekdayCalc.rate200 > 0 && (
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  • {weekdayCalc.rate200.toFixed(2)} jam @ 200% = {formatCurrency(weekdayCalc.amount200)}
                </p>
              )}
              <div className="border-t-2 border-gray-300 dark:border-gray-700 pt-2 mt-2">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  Total Weekday: {formatCurrency(weekdayCalc.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Holiday Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Overtime Weekend/Holiday
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Jumat - Minggu & Hari Libur</p>
              </div>
              <button
                onClick={() => addEntry('holiday')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-lg shadow-blue-500/30"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">⚡ Sistem Perhitungan Per Hari (PP 35/2021):</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>Jam 1-8:</strong> Rate 200%</li>
                <li>• <strong>Jam ke-9:</strong> Rate 300%</li>
                <li>• <strong>Jam ke-10 dst:</strong> Rate 400%</li>
              </ul>
            </div>

            {holidayEntries.map((entry, idx) => (
              <div key={idx} className="flex gap-3 mb-3 items-center">
                <div className="flex-1 flex items-center relative">
                  <input
                    type="number"
                    placeholder="Masukkan Jumlah Jam"
                    value={entry.hours}
                    onChange={(e) => updateEntry('holiday', idx, 'hours', e.target.value)}
                    className="w-full pl-3 pr-12 py-2 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <span className="absolute right-3 text-sm font-semibold text-gray-400">Jam</span>
                </div>
                <button
                  onClick={() => removeEntry('holiday', idx)}
                  className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500 dark:hover:bg-red-600 hover:text-white transition-colors"
                  title="Hapus baris"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg mt-3 space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-bold">Total Jam Holiday:</span> {holidayHours} jam
              </p>
              {holidayCalc.rate200 > 0 && (
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  • {holidayCalc.rate200.toFixed(2)} jam @ 200% = {formatCurrency(holidayCalc.amount200)}
                </p>
              )}
              {holidayCalc.rate300 > 0 && (
                <p className="text-sm text-purple-700 dark:text-purple-400">
                  • {holidayCalc.rate300.toFixed(2)} jam @ 300% = {formatCurrency(holidayCalc.amount300)}
                </p>
              )}
              {holidayCalc.rate400 > 0 && (
                <p className="text-sm text-rose-700 dark:text-rose-400">
                  • {holidayCalc.rate400.toFixed(2)} jam @ 400% = {formatCurrency(holidayCalc.amount400)}
                </p>
              )}
              <div className="border-t-2 border-gray-300 dark:border-gray-700 pt-2 mt-2">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  Total Holiday: {formatCurrency(holidayCalc.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Salary Section */}
          <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border-2 border-teal-200 dark:border-teal-900/50">
            <label className="block text-sm font-semibold text-gray-700 dark:text-teal-300 mb-2">
              Tambahan Gaji/Tunjangan (jika ada)
            </label>
            <div className="relative">
              <input
                type="number"
                value={additionalSalary}
                onChange={(e) => setAdditionalSalary(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border-2 border-teal-200 dark:border-teal-900/50 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="Masukkan nominal tambahan (misal: Tunjangan)"
              />
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white p-6 rounded-xl shadow-xl shadow-indigo-500/20">
            <h3 className="text-2xl font-bold mb-4">Total Overtime</h3>
            <div className="space-y-2 text-lg">
              <div className="flex justify-between">
                <span>Weekday ({weekdayHours.toFixed(2)}h):</span>
                <span>{formatCurrency(weekdayCalc.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Holiday ({holidayHours.toFixed(2)}h):</span>
                <span>{formatCurrency(holidayCalc.total)}</span>
              </div>

              <div className="border-t-2 border-white/30 pt-3 mt-3 space-y-2">
                <div className="flex justify-between text-xl">
                  <p>Subtotal Lembur:</p>
                  <p>{formatCurrency(calculatedTotal)}</p>
                </div>

                {parseFloat(additionalSalary) > 0 && (
                  <div className="flex justify-between text-xl">
                    <span>Tambahan:</span>
                    <span>{formatCurrency(parseFloat(additionalSalary))}</span>
                  </div>
                )}
              </div>
              
              <div className="border-t-2 border-white/30 pt-3 mt-3">
                {isCapped && (
                  <p className="text-sm text-yellow-200 mb-2 text-right">
                    ⚠️ Melebihi batas maksimal, dipotong ke {formatCurrency(maxCap)}
                  </p>
                )}
                <div className="flex justify-between text-3xl font-bold">
                  <p>TOTAL:</p>
                  <p 
                    className="blur-md hover:blur-none transition-all duration-300 cursor-help select-none"
                    title="Hover untuk melihat total (Gaji + Lembur)"
                  >
                    {formatCurrency(finalTotal)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsTaxModalOpen(true)}
                className="w-full mt-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 border border-white/30 backdrop-blur-sm"
              >
                <Calculator className="w-5 h-5" />
                Lihat Estimasi Gaji Bersih (PPh 21)
              </button>
            </div>
          </div>
                  </div>
        
                {/* Formula Reference */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 transition-colors duration-300 border border-transparent dark:border-slate-700">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">📋 Rumus Perhitungan</h3>
                  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <p><strong>Tarif per Jam:</strong> Gaji Pokok ÷ 173 jam = {formatCurrency(hourlyRate)}</p>
                    
                    <div className="border-t dark:border-slate-700 pt-3 mt-3">
                      <p className="font-bold mb-2">Weekday (Senin - Kamis) - Progresif Per Hari:</p>
                      <p className="ml-4">• Jam pertama: × {formatCurrency(hourlyRate)} × 1.5 (150%)</p>
                      <p className="ml-4">• Jam ke-2 dst: × {formatCurrency(hourlyRate)} × 2 (200%)</p>
                    </div>
                    
                    <div className="border-t dark:border-slate-700 pt-3 mt-3">
                      <p className="font-bold mb-2">Weekend/Holiday (Jumat - Minggu & Libur) - Progresif Per Hari (PP 35/2021):</p>
                      <p className="ml-4">• Jam 1-8: × {formatCurrency(hourlyRate)} × 2 (200%)</p>
                      <p className="ml-4">• Jam ke-9: × {formatCurrency(hourlyRate)} × 3 (300%)</p>
                      <p className="ml-4">• Jam ke-10 dst: × {formatCurrency(hourlyRate)} × 4 (400%)</p>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4 mt-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                      <strong>💡 Contoh Weekday:</strong> Kerja 4 jam di Senin:<br/>
                      • 1 jam @ 150% = 1 × {formatCurrency(hourlyRate)} × 1.5 = {formatCurrency(hourlyRate * 1.5)}<br/>
                      • 3 jam @ 200% = 3 × {formatCurrency(hourlyRate)} × 2 = {formatCurrency(hourlyRate * 2 * 3)}<br/>
                      • <strong>Total = {formatCurrency(hourlyRate * 1.5 + hourlyRate * 2 * 3)}</strong>
                    </p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>💡 Contoh Weekend:</strong> Kerja 10 jam di Jumat:<br/>
                      • 8 jam @ 200% = 8 × {formatCurrency(hourlyRate)} × 2<br/>
                      • 1 jam @ 300% = 1 × {formatCurrency(hourlyRate)} × 3<br/>
                      • 1 jam @ 400% = 1 × {formatCurrency(hourlyRate)} × 4<br/>
                      • <strong>Total = {formatCurrency(hourlyRate * 2 * 8 + hourlyRate * 3 * 1 + hourlyRate * 4 * 1)}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <TaxModal 
                isOpen={isTaxModalOpen}
                onClose={() => setIsTaxModalOpen(false)}
                ptkpCategory={ptkpCategory}
                setPtkpCategory={setPtkpCategory}
                finalTotal={finalTotal}
                taxableGross={taxableGross}
                terRate={terRate}
                taxAmount={taxAmount}
                bpjs={{ kes: bpjsKesEmp, jht: bpjsJHTEmp, jp: bpjsJPEmp, total: totalBpjsEmp }}
                netSalary={netSalary}
                formatCurrency={formatCurrency}
              />
            </div>
          );
        }

        // --- 5. TAX MODAL COMPONENT (The Calculation Popup) ---
        function TaxModal({ isOpen, onClose, ptkpCategory, setPtkpCategory, finalTotal, taxableGross, terRate, taxAmount, bpjs, netSalary, formatCurrency }) {
          const [showAmounts, setShowAmounts] = useState(false);

          if (!isOpen) return null;

          return (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={(e) => e.target === e.currentTarget && onClose()}
            >
              <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Estimasi Gaji Bersih
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAmounts(!showAmounts)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                      title={showAmounts ? "Sembunyikan Nominal" : "Tampilkan Nominal"}
                    >
                      {showAmounts ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                      <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto">
                  {/* Category Selection */}
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Kategori PTKP
                      </label>
                      <select 
                        value={ptkpCategory}
                        onChange={(e) => setPtkpCategory(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white outline-none transition-all"
                      >
                        {Object.keys(TER_CATEGORIES).map(cat => (
                          <option key={cat} value={cat}>{TER_CATEGORIES[cat].label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold text-center">TER</p>
                      <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{(terRate * 100).toFixed(2)}%</p>
                    </div>
                  </div>

                  {/* Calculation Breakdown */}
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Total Gaji Bruto (Gross):</span>
                      <span className={`font-semibold transition-all duration-300 ${!showAmounts ? 'blur-sm select-none' : ''}`}>
                        {formatCurrency(finalTotal)}
                      </span>
                    </div>
                    
                    <div className="pt-2 border-t dark:border-slate-700 space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Potongan Wajib:</p>
                      
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 group relative">
                        <span className="flex items-center gap-1 border-b border-dotted border-gray-400 cursor-help" title={`Dihitung dari Bruto + Iuran BPJS Perusahaan (${formatCurrency(taxableGross)})`}>
                          PPh 21:
                        </span>
                        <span className={`font-semibold text-red-500 transition-all duration-300 ${!showAmounts ? 'blur-sm select-none' : ''}`}>
                          -{formatCurrency(taxAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>BPJS Kesehatan (1%):</span>
                        <span className={`font-semibold text-red-500 transition-all duration-300 ${!showAmounts ? 'blur-sm select-none' : ''}`}>
                          -{formatCurrency(bpjs.kes)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>BPJS TK - JHT (2%):</span>
                        <span className={`font-semibold text-red-500 transition-all duration-300 ${!showAmounts ? 'blur-sm select-none' : ''}`}>
                          -{formatCurrency(bpjs.jht)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>BPJS TK - JP (1%):</span>
                        <span className={`font-semibold text-red-500 transition-all duration-300 ${!showAmounts ? 'blur-sm select-none' : ''}`}>
                          -{formatCurrency(bpjs.jp)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300 border-t dark:border-slate-700 pt-1.5">
                      <span>Total Potongan:</span>
                      <span className={`transition-all duration-300 ${!showAmounts ? 'blur-sm select-none' : ''}`}>
                        {formatCurrency(taxAmount + bpjs.total)}
                      </span>
                    </div>
                  </div>

                  {/* Net Result */}
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl text-white text-center shadow-lg shadow-green-500/20 relative overflow-hidden">
                    <p className="text-xs font-medium opacity-90 mb-1">Take Home Pay (Estimasi)</p>
                    <p className={`text-2xl font-bold transition-all duration-500 ${!showAmounts ? 'blur-md scale-95 opacity-50 select-none' : ''}`}>
                      {formatCurrency(netSalary)}
                    </p>
                  </div>

                  <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center leading-tight">
                    *PPh 21 TER mengikuti standar Dirjen Pajak 2024 (Bruto + Iuran Perusahaan).<br/>
                    *BPJS dihitung dari Gaji Pokok saja.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-slate-900/80 text-center border-t dark:border-slate-700">
                  <button 
                    onClick={onClose}
                    className="px-6 py-1.5 text-sm bg-gray-800 dark:bg-slate-700 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-slate-600 transition-colors font-semibold"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          );
        }
        
