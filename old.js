import React, { useState } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';

export default function OvertimeCalculator() {
  const [basicSalary, setBasicSalary] = useState(10000000);
  const [weekdayEntries, setWeekdayEntries] = useState([]);
  const [holidayEntries, setHolidayEntries] = useState([]);

  const hourlyRate = basicSalary / 173;

  const addEntry = (type) => {
    const newEntry = { hours: 0, date: '' };
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

  // Hitung overtime weekday (1 jam pertama 150%, sisanya 200%)
  const calculateWeekdayProgressive = () => {
    let total = 0;
    let rate150 = 0, rate200 = 0;

    weekdayEntries.forEach(entry => {
      const hours = parseFloat(entry.hours) || 0;
      let remaining = hours;

      // 1 jam pertama per hari: 150%
      if (remaining > 0) {
        const hours150 = Math.min(remaining, 1);
        total += hours150 * hourlyRate * 1.5;
        rate150 += hours150;
        remaining -= hours150;
      }

      // Sisanya: 200%
      if (remaining > 0) {
        total += remaining * hourlyRate * 2;
        rate200 += remaining;
      }
    });

    return { total, rate150, rate200 };
  };

  // Hitung overtime holiday (progresif 200%, 300%, 400%)
  const calculateHolidayProgressive = () => {
    let total = 0;
    let rate200 = 0, rate300 = 0, rate400 = 0;

    holidayEntries.forEach(entry => {
      const hours = parseFloat(entry.hours) || 0;
      let remaining = hours;

      // 8 jam pertama: 200%
      if (remaining > 0) {
        const hours200 = Math.min(remaining, 8);
        total += hours200 * hourlyRate * 2;
        rate200 += hours200;
        remaining -= hours200;
      }

      // 8 jam kedua: 300%
      if (remaining > 0) {
        const hours300 = Math.min(remaining, 8);
        total += hours300 * hourlyRate * 3;
        rate300 += hours300;
        remaining -= hours300;
      }

      // Sisanya: 400%
      if (remaining > 0) {
        total += remaining * hourlyRate * 4;
        rate400 += remaining;
      }
    });

    return { total, rate200, rate300, rate400 };
  };

  const [maxCap, setMaxCap] = useState(2500000);
  const [useMaxCap, setUseMaxCap] = useState(true);

  const weekdayCalc = calculateWeekdayProgressive();
  const holidayCalc = calculateHolidayProgressive();
  const calculatedTotal = weekdayCalc.total + holidayCalc.total;
  const grandTotal = useMaxCap ? Math.min(calculatedTotal, maxCap) : calculatedTotal;
  const isCapped = useMaxCap && calculatedTotal > maxCap;

  const weekdayHours = weekdayEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);
  const holidayHours = holidayEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Kalkulator Overtime Progresif</h1>
          </div>

          <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Gaji Pokok (Basic Salary)
            </label>
            <input
              type="number"
              value={basicSalary}
              onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-2">
              Tarif per jam: <span className="font-semibold text-indigo-600">{formatCurrency(hourlyRate)}</span>
            </p>
          </div>

          <div className="mb-6 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                checked={useMaxCap}
                onChange={(e) => setUseMaxCap(e.target.checked)}
                className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
              />
              <label className="text-sm font-semibold text-gray-700">
                Gunakan Batas Maksimal Overtime
              </label>
            </div>
            {useMaxCap && (
              <input
                type="number"
                value={maxCap}
                onChange={(e) => setMaxCap(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Maksimal overtime per bulan"
              />
            )}
            <p className="text-xs text-orange-700 mt-2">
              💡 Overtime akan dibatasi maksimal {formatCurrency(maxCap)} per bulan
            </p>
          </div>

          {/* Weekday Section - Progressive */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Overtime Weekday (Progresif)
                </h2>
                <p className="text-sm text-gray-600">Senin - Kamis</p>
              </div>
              <button
                onClick={() => addEntry('weekday')}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>

            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <h3 className="font-bold text-green-900 mb-2">⚡ Sistem Progresif Per Hari:</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• <strong>1 jam pertama:</strong> Rate 150%</li>
                <li>• <strong>Jam ke-2 dst:</strong> Rate 200%</li>
              </ul>
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
                  placeholder="Tanggal (14/10)"
                  value={entry.date}
                  onChange={(e) => updateEntry('weekday', idx, 'date', e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={() => removeEntry('weekday', idx)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg mt-3 space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-bold">Total Jam Weekday:</span> {weekdayHours} jam
              </p>
              {weekdayCalc.rate150 > 0 && (
                <p className="text-sm text-green-700">
                  • {weekdayCalc.rate150} jam @ 150% = {formatCurrency(weekdayCalc.rate150 * hourlyRate * 1.5)}
                </p>
              )}
              {weekdayCalc.rate200 > 0 && (
                <p className="text-sm text-emerald-700">
                  • {weekdayCalc.rate200} jam @ 200% = {formatCurrency(weekdayCalc.rate200 * hourlyRate * 2)}
                </p>
              )}
              <div className="border-t-2 border-gray-300 pt-2 mt-2">
                <p className="text-sm font-bold text-gray-800">
                  Total Weekday: {formatCurrency(weekdayCalc.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Holiday Section - Progressive */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Overtime Weekend/Holiday (Progresif)
                </h2>
                <p className="text-sm text-gray-600">Jumat - Minggu & Hari Libur</p>
              </div>
              <button
                onClick={() => addEntry('holiday')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="font-bold text-blue-900 mb-2">⚡ Sistem Progresif:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>8 jam pertama:</strong> Rate 200%</li>
                <li>• <strong>8 jam kedua:</strong> Rate 300%</li>
                <li>• <strong>Jam ke-17 dst:</strong> Rate 400%</li>
              </ul>
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
                  placeholder="Tanggal (11/10)"
                  value={entry.date}
                  onChange={(e) => updateEntry('holiday', idx, 'date', e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => removeEntry('holiday', idx)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mt-3 space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-bold">Total Jam Holiday:</span> {holidayHours} jam
              </p>
              {holidayCalc.rate200 > 0 && (
                <p className="text-sm text-blue-700">
                  • {holidayCalc.rate200} jam @ 200% = {formatCurrency(holidayCalc.rate200 * hourlyRate * 2)}
                </p>
              )}
              {holidayCalc.rate300 > 0 && (
                <p className="text-sm text-purple-700">
                  • {holidayCalc.rate300} jam @ 300% = {formatCurrency(holidayCalc.rate300 * hourlyRate * 3)}
                </p>
              )}
              {holidayCalc.rate400 > 0 && (
                <p className="text-sm text-rose-700">
                  • {holidayCalc.rate400} jam @ 400% = {formatCurrency(holidayCalc.rate400 * hourlyRate * 4)}
                </p>
              )}
              <div className="border-t-2 border-gray-300 pt-2 mt-2">
                <p className="text-sm font-bold text-gray-800">
                  Total Holiday: {formatCurrency(holidayCalc.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl">
            <h3 className="text-2xl font-bold mb-4">Total Overtime</h3>
            <div className="space-y-2 text-lg">
              <p>Weekday (Progresif): {formatCurrency(weekdayCalc.total)}</p>
              <p>Holiday (Progresif): {formatCurrency(holidayCalc.total)}</p>
              <div className="border-t-2 border-white/30 pt-3 mt-3">
                <p className="text-xl">
                  Subtotal: {formatCurrency(calculatedTotal)}
                </p>
                {isCapped && (
                  <>
                    <p className="text-sm text-yellow-200 mt-2">
                      ⚠️ Melebihi batas maksimal!
                    </p>
                    <p className="text-sm text-yellow-200">
                      Dipotong ke: {formatCurrency(maxCap)}
                    </p>
                  </>
                )}
                <p className="text-3xl font-bold mt-3">
                  TOTAL: {formatCurrency(grandTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formula Reference */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Rumus Perhitungan</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p><strong>Tarif per Jam:</strong> Gaji Pokok ÷ 173 jam = {formatCurrency(hourlyRate)}</p>
            
            <div className="border-t pt-3 mt-3">
              <p className="font-bold mb-2">Weekday (Senin - Kamis) - Progresif Per Hari:</p>
              <p className="ml-4">• Jam pertama: × {formatCurrency(hourlyRate)} × 1.5 (150%)</p>
              <p className="ml-4">• Jam ke-2 dst: × {formatCurrency(hourlyRate)} × 2 (200%)</p>
            </div>
            
            <div className="border-t pt-3 mt-3">
              <p className="font-bold mb-2">Weekend/Holiday (Jumat - Minggu & Libur) - Progresif:</p>
              <p className="ml-4">• Jam 1-8: × {formatCurrency(hourlyRate)} × 2 (200%)</p>
              <p className="ml-4">• Jam 9-16: × {formatCurrency(hourlyRate)} × 3 (300%)</p>
              <p className="ml-4">• Jam 17+: × {formatCurrency(hourlyRate)} × 4 (400%)</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-yellow-800 mb-3">
              <strong>💡 Contoh Weekday:</strong> Kerja 4 jam di Senin:<br/>
              • 1 jam @ 150% = 1 × {formatCurrency(hourlyRate)} × 1.5 = {formatCurrency(hourlyRate * 1.5)}<br/>
              • 3 jam @ 200% = 3 × {formatCurrency(hourlyRate)} × 2 = {formatCurrency(hourlyRate * 2 * 3)}<br/>
              • <strong>Total = {formatCurrency(hourlyRate * 1.5 + hourlyRate * 2 * 3)}</strong>
            </p>
            <p className="text-sm text-yellow-800">
              <strong>💡 Contoh Weekend:</strong> Kerja 18 jam di Jumat:<br/>
              • 8 jam @ 200% = 8 × {formatCurrency(hourlyRate)} × 2<br/>
              • 8 jam @ 300% = 8 × {formatCurrency(hourlyRate)} × 3<br/>
              • 2 jam @ 400% = 2 × {formatCurrency(hourlyRate)} × 4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}