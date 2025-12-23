import React, { useState } from 'react';
import { Plus, Trash2, Calculator, AlertCircle } from 'lucide-react';

export default function OvertimeCalculator() {
  const [basicSalary, setBasicSalary] = useState(6792000);
  const [weekdayEntries, setWeekdayEntries] = useState([]);
  const [holidayEntries, setHolidayEntries] = useState([]);
  const [maxCap, setMaxCap] = useState(2500000);
  const [useMaxCap, setUseMaxCap] = useState(true);

  const hourlyRate = basicSalary / 173;

  const addEntry = (type) => {
    const newEntry = { hours: '', date: '' };
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

  // Hitung overtime weekday dengan pembulatan per hari
  const calculateWeekdayProgressive = () => {
    let total150 = 0, total200 = 0;
    let hours150 = 0, hours200 = 0;
    const details = [];

    weekdayEntries.forEach((entry, idx) => {
      const hours = parseFloat(entry.hours) || 0;
      if (hours === 0) return;

      let amount150 = 0, amount200 = 0;
      let h150 = 0, h200 = 0;

      if (hours > 0) {
        h150 = Math.min(hours, 1);
        amount150 = h150 * hourlyRate * 1.5;
        hours150 += h150;
      }

      if (hours > 1) {
        h200 = hours - 1;
        amount200 = h200 * hourlyRate * 2;
        hours200 += h200;
      }

      const dailyTotal = amount150 + amount200;
      total150 += amount150;
      total200 += amount200;

      details.push({
        day: idx + 1,
        date: entry.date,
        hours: hours,
        hours150: h150,
        hours200: h200,
        amount150: amount150,
        amount200: amount200,
        total: dailyTotal
      });
    });

    return { 
      total150, 
      total200, 
      total: total150 + total200,
      hours150,
      hours200,
      details 
    };
  };

  // Hitung overtime holiday - PERBAIKAN LOGIKA SESUAI PERMINTAAN
  const calculateHolidayProgressive = () => {
    let total200 = 0, total300 = 0, total400 = 0;
    let sumH200 = 0, sumH300 = 0, sumH400 = 0;
    let totalHours = 0;
    const details = [];

    holidayEntries.forEach((entry, idx) => {
      const hours = parseFloat(entry.hours) || 0;
      if (hours === 0) return;

      let h200 = 0, h300 = 0, h400 = 0;
      let a200 = 0, a300 = 0, a400 = 0;

      // Jam 1–8 → 200%
      h200 = Math.min(hours, 8);
      a200 = h200 * hourlyRate * 2;

      // Jam ke-9 → 300%
      if (hours > 8) {
        h300 = Math.min(hours - 8, 1);
        a300 = h300 * hourlyRate * 3;
      }

      // Jam ke-10 dst → 400%
      if (hours > 9) {
        h400 = hours - 9;
        a400 = h400 * hourlyRate * 4;
      }

      totalHours += hours;
      sumH200 += h200;
      sumH300 += h300;
      sumH400 += h400;

      total200 += a200;
      total300 += a300;
      total400 += a400;

      details.push({
        day: idx + 1,
        date: entry.date,
        hours,
        h200, h300, h400,
        a200, a300, a400,
        total: a200 + a300 + a400
      });
    });

    return {
      totalHours,
      hours200: sumH200,
      hours300: sumH300,
      hours400: sumH400,
      amount200: total200,
      amount300: total300,
      amount400: total400,
      total: total200 + total300 + total400,
      details
    };
  };

  const weekdayCalc = calculateWeekdayProgressive();
  const holidayCalc = calculateHolidayProgressive();
  const calculatedTotal = weekdayCalc.total + holidayCalc.total;
  const grandTotal = useMaxCap ? Math.min(calculatedTotal, maxCap) : calculatedTotal;
  const isCapped = useMaxCap && calculatedTotal > maxCap;

  const weekdayHours = weekdayEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatNumber = (num) => num.toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Kalkulator Overtime Pro</h1>
          </div>

          {/* Warning Alert */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-bold mb-1">⚠️ Perhitungan Estimasi</p>
                <p>Kalkulator ini menggunakan rumus progresif standar (PP 35/2021). Hasil mungkin berbeda dengan sistem payroll perusahaan Anda.</p>
              </div>
            </div>
          </div>

          {/* Basic Salary Input */}
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Gaji Pokok (Basic Salary)</label>
            <input
              type="number"
              value={basicSalary}
              onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-2">
              Tarif per jam: <span className="font-semibold text-indigo-600">{formatCurrency(hourlyRate)}</span> (Basic ÷ 173)
            </p>
          </div>

          {/* Max Cap Toggle */}
          <div className="mb-6 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                checked={useMaxCap}
                onChange={(e) => setUseMaxCap(e.target.checked)}
                className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
              />
              <label className="text-sm font-semibold text-gray-700">Gunakan Batas Maksimal Overtime</label>
            </div>
            {useMaxCap && (
              <input
                type="number"
                value={maxCap}
                onChange={(e) => setMaxCap(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            )}
          </div>

          {/* Weekday Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Overtime Weekday</h2>
                <p className="text-sm text-gray-600">Senin - Kamis</p>
              </div>
              <button onClick={() => addEntry('weekday')} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>

            {weekdayEntries.map((entry, idx) => (
              <div key={idx} className="flex gap-3 mb-3">
                <input
                  type="number"
                  placeholder="Jam"
                  value={entry.hours}
                  onChange={(e) => updateEntry('weekday', idx, 'hours', e.target.value)}
                  className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  placeholder="Tanggal/Keterangan"
                  value={entry.date}
                  onChange={(e) => updateEntry('weekday', idx, 'date', e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <button onClick={() => removeEntry('weekday', idx)} className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {weekdayCalc.details.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg mt-3 space-y-3">
                <p className="text-sm font-bold text-gray-800">Detail Per Hari (Weekday):</p>
                {weekdayCalc.details.map((detail, idx) => (
                  <div key={idx} className="text-xs text-gray-700 bg-white p-2 rounded shadow-sm border-l-4 border-green-400">
                    <p className="font-semibold">Hari {detail.day} {detail.date && `(${detail.date})`}: {detail.hours}h</p>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <span>• {formatNumber(detail.hours150)}h @ 150%</span>
                      <span className="text-right">{formatCurrency(detail.amount150)}</span>
                      {detail.hours200 > 0 && (
                        <>
                          <span>• {formatNumber(detail.hours200)}h @ 200%</span>
                          <span className="text-right">{formatCurrency(detail.amount200)}</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 border-t pt-1 text-right font-bold">Total: {formatCurrency(detail.total)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Holiday Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Overtime Weekend/Holiday</h2>
                <p className="text-sm text-gray-600">Jumat - Minggu & Hari Libur</p>
              </div>
              <button onClick={() => addEntry('holiday')} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>

            {holidayEntries.map((entry, idx) => (
              <div key={idx} className="flex gap-3 mb-3">
                <input
                  type="number"
                  placeholder="Jam"
                  value={entry.hours}
                  onChange={(e) => updateEntry('holiday', idx, 'hours', e.target.value)}
                  className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Tanggal/Keterangan"
                  value={entry.date}
                  onChange={(e) => updateEntry('holiday', idx, 'date', e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => removeEntry('holiday', idx)} className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {holidayCalc.details.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg mt-3 space-y-3">
                <p className="text-sm font-bold text-gray-800">Detail Per Hari (Holiday):</p>
                {holidayCalc.details.map((detail, idx) => (
                  <div key={idx} className="text-xs text-gray-700 bg-white p-2 rounded shadow-sm border-l-4 border-blue-400">
                    <p className="font-semibold">Hari {detail.day} {detail.date && `(${detail.date})`}: {detail.hours}h</p>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <span>• {formatNumber(detail.h200)}h @ 200%</span>
                      <span className="text-right">{formatCurrency(detail.a200)}</span>
                      {detail.h300 > 0 && (
                        <>
                          <span>• {formatNumber(detail.h300)}h @ 300% (Jam ke-9)</span>
                          <span className="text-right">{formatCurrency(detail.a300)}</span>
                        </>
                      )}
                      {detail.h400 > 0 && (
                        <>
                          <span>• {formatNumber(detail.h400)}h @ 400% (Jam ke-10+)</span>
                          <span className="text-right">{formatCurrency(detail.a400)}</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 border-t pt-1 text-right font-bold">Total: {formatCurrency(detail.total)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grand Total Card */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold mb-4">Total Overtime Bulan Ini</h3>
            <div className="space-y-2 text-lg">
              <div className="flex justify-between">
                <span>Weekday ({weekdayHours}h):</span>
                <span>{formatCurrency(weekdayCalc.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Holiday ({holidayCalc.totalHours}h):</span>
                <span>{formatCurrency(holidayCalc.total)}</span>
              </div>
              <div className="border-t-2 border-white/30 pt-3 mt-3">
                <div className="flex justify-between text-xl opacity-90">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculatedTotal)}</span>
                </div>
                {isCapped && (
                  <div className="text-sm text-yellow-200 mt-1 italic">
                    ⚠️ Melebihi batas maksimal, dipotong ke {formatCurrency(maxCap)}
                  </div>
                )}
                <div className="flex justify-between text-3xl font-bold mt-3">
                  <span>TOTAL AKHIR:</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formula Reference Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Dasar Perhitungan</h3>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="font-bold text-green-700 mb-1">Logika Weekday:</p>
              <ul className="list-disc ml-5">
                <li>Jam pertama: 1.5x upah per jam</li>
                <li>Jam berikutnya: 2x upah per jam</li>
              </ul>
            </div>
            <div className="border-t pt-3">
              <p className="font-bold text-blue-700 mb-1">Logika Holiday (PP 35/2021):</p>
              <ul className="list-disc ml-5">
                <li>Jam 1 s/d 8: <span className="font-semibold text-blue-800">200% (2x)</span></li>
                <li>Jam ke-9: <span className="font-semibold text-blue-800">300% (3x)</span></li>
                <li>Jam ke-10 dan seterusnya: <span className="font-semibold text-blue-800">400% (4x)</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}