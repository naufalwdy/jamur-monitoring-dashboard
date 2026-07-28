import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, set, push } from "firebase/database";
import { db } from "../lib/firebase";

// === Type Definitions ===
interface SensorsData { co2: number; temp: number; hum: number; evap: number; }
interface ActuatorData { mode: 'auto' | 'manual'; state: boolean; }
interface ActuatorsData { blower: ActuatorData; compressor: ActuatorData; exhaust: ActuatorData; mistmaker: ActuatorData; }
interface Setpoints { tempMin: number; tempMax: number; humMin: number; humMax: number; co2Min: number; co2Max: number; evapMin: number; evapMax: number; }
interface LogRow { date: string; co2: string; temp: string; hum: string; evap: string; }

type Page = 'dashboard' | 'logs' | 'settings';

// === Sidebar ===
function Sidebar({ activePage, onNavigate }: { activePage: Page; onNavigate: (p: Page) => void }) {
  const navItems: { id: Page; icon: string; label: string }[] = [
    { id: 'dashboard', icon: 'grid_view', label: 'Overview Dashboard' },
    { id: 'logs', icon: 'history_edu', label: 'Cultivation Logs' },
    { id: 'settings', icon: 'settings', label: 'System Settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 z-50 flex flex-col pt-8 border-r"
      style={{ background: 'color-mix(in srgb, var(--color-surface-container-low) 60%, transparent)', backdropFilter: 'blur(20px)', borderColor: 'color-mix(in srgb, var(--color-outline-variant) 10%, transparent)' }}>
      <div className="px-8 mb-10 flex items-center gap-3">
        <span className="text-2xl">🍄</span>
        <span className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-on-surface)' }}>Jamur Core</span>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map(item => {
          const isActive = activePage === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className="w-full flex items-center px-4 py-3 rounded-xl transition-all text-left"
              style={{
                background: isActive ? 'var(--color-primary-container)' : 'transparent',
                color: isActive ? 'var(--color-on-primary-container)' : 'var(--color-on-surface-variant)',
                fontWeight: isActive ? 600 : 400,
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--color-surface-container-high)'; e.currentTarget.style.color = 'var(--color-on-surface)'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-on-surface-variant)'; }}}
            >
              <span className="material-symbols-outlined mr-3 text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

// === Top Header ===
function TopHeader({ isConnected }: { isConnected: boolean }) {
  return (
    <header className="fixed top-0 left-72 right-0 h-16 z-40 px-6 flex items-center justify-between border-b"
      style={{ background: 'color-mix(in srgb, var(--color-surface) 70%, transparent)', backdropFilter: 'blur(20px)', borderColor: 'color-mix(in srgb, var(--color-outline-variant) 10%, transparent)' }}>
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold" style={{ color: 'var(--color-on-surface)' }}>Jamur Monitoring Dashboard</span>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: isConnected ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'color-mix(in srgb, var(--color-error) 10%, transparent)' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: isConnected ? 'var(--color-primary)' : 'var(--color-error)', animation: isConnected ? 'pulse 2s infinite' : 'none' }} />
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: isConnected ? 'var(--color-on-primary-fixed-variant)' : 'var(--color-error)' }}>
            {isConnected ? 'LIVE' : 'Offline'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Cultivator Admin</div>
          <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-on-surface-variant)' }}>Main Facility</div>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
          <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--color-on-primary)' }}>person</span>
        </div>
      </div>
    </header>
  );
}

// === KPI Card ===
function KpiCard({ label, value, unit, icon, iconColor, accent, trend, trendLabel, status, isActive, onClick }: {
  label: string; value: string; unit: string; icon: string; iconColor: string; accent: string;
  trend?: string; trendLabel?: string; status?: 'good' | 'warning' | 'critical'; isActive: boolean; onClick: () => void;
}) {
  const statusColors = { good: '#2e7d32', warning: 'var(--color-error)', critical: 'var(--color-error)' };
  const statusBg = { good: 'color-mix(in srgb, #2e7d32 10%, transparent)', warning: 'color-mix(in srgb, var(--color-error) 10%, transparent)', critical: 'color-mix(in srgb, var(--color-error) 15%, transparent)' };
  const statusLabel = { good: 'Optimal', warning: 'Warning', critical: 'Critical' };
  const color = status ? statusColors[status] : 'var(--color-on-surface-variant)';

  return (
    <button onClick={onClick}
      className={`glass-card rounded-xl p-4 text-left flex flex-col gap-2 relative overflow-hidden group focus:outline-none${isActive ? ' kpi-active' : ''}`}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-xl transition-colors"
        style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)` }} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-on-surface-variant)' }}>{label}</span>
        <span className="material-symbols-outlined text-[20px]" style={{ color: iconColor }}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-4xl font-bold tracking-tight" style={{ color: 'var(--color-on-surface)' }}>{value}</span>
        <span className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{unit}</span>
      </div>
      {trend && status && (
        <div className="flex items-center gap-2 mt-auto pt-2">
          <span className="material-symbols-outlined text-base" style={{ color }}>{status === 'good' ? 'trending_down' : 'trending_up'}</span>
          <span className="text-sm font-medium" style={{ color }}>{trend}</span>
          <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: statusBg[status], color: statusColors[status] }}>{statusLabel[status]}</span>
        </div>
      )}
    </button>
  );
}

// === Actuator Card ===
function ActuatorCard({ id, title, icon, act, onCommand }: {
  id: string; title: string; icon: string;
  act: ActuatorData; onCommand: (id: string, mode: 'auto' | 'manual', state: boolean) => void;
}) {
  const isAuto = act.mode === 'auto';
  const isOn = act.state;

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden"
      style={{ background: 'color-mix(in srgb, var(--color-surface-container-lowest) 50%, transparent)', border: '1px solid color-mix(in srgb, var(--color-outline-variant) 15%, transparent)' }}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: isOn ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'var(--color-surface-variant)', color: isOn ? 'var(--color-primary)' : 'var(--color-on-surface-variant)' }}>
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </div>
          <span className="font-medium" style={{ color: 'var(--color-on-surface)' }}>{title}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold${isOn ? ' status-on' : ''}`}
          style={{ background: isOn ? 'var(--color-primary)' : 'var(--color-surface-variant)', color: isOn ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)' }}>
          {isOn ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* Mode toggle */}
      <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'color-mix(in srgb, var(--color-outline-variant) 12%, transparent)' }}>
        <span className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Mode</span>
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'var(--color-surface-container)' }}>
          <button onClick={() => onCommand(id, 'auto', isOn)}
            className="px-3 py-1 text-xs rounded-md transition-all font-semibold"
            style={{ background: isAuto ? 'var(--color-surface-container-lowest)' : 'transparent', color: isAuto ? 'var(--color-primary)' : 'var(--color-on-surface-variant)', boxShadow: isAuto ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            Auto
          </button>
          <button onClick={() => onCommand(id, 'manual', isOn)}
            className="px-3 py-1 text-xs rounded-md transition-all font-semibold"
            style={{ background: !isAuto ? 'var(--color-surface-container-lowest)' : 'transparent', color: !isAuto ? 'var(--color-primary)' : 'var(--color-on-surface-variant)', boxShadow: !isAuto ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            Manual
          </button>
        </div>
      </div>

      {/* Power toggle (only when manual) */}
      <div className="flex justify-between items-center">
        <span className="text-sm" style={{ color: isAuto ? 'var(--color-on-surface-variant)' : 'var(--color-on-surface)' }}>Power</span>
        <button onClick={() => !isAuto && onCommand(id, 'manual', !isOn)} disabled={isAuto}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
          style={{ background: isOn ? (isAuto ? 'color-mix(in srgb, var(--color-primary) 50%, gray)' : 'var(--color-primary)') : 'var(--color-surface-container-high)', cursor: isAuto ? 'not-allowed' : 'pointer', opacity: isAuto ? 0.6 : 1 }}>
          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
            style={{ transform: isOn ? 'translateX(24px)' : 'translateX(4px)' }} />
        </button>
      </div>
    </div>
  );
}

// === Data Log Viewer ===
function DataLogViewer() {
  const [data, setData] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [logType, setLogType] = useState<'10m' | '1h'>('10m');
  const [error, setError] = useState('');

  const logLabels: Record<string, string> = { '10m': 'Per 10 Menit', '1h': 'Rata-rata 1 Jam' };

  useEffect(() => {
    setLoading(true); setError('');
    const logRef = ref(db, 'logs/' + logType);
    const unsubscribe = onValue(logRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        const parsed: LogRow[] = [];
        snapshot.forEach((child) => { parsed.push(child.val()); });
        setData(parsed.reverse());
      } else { setData([]); setError('Data masih kosong. Alat perlu terhubung dan berjalan.'); }
    }, (err) => { setLoading(false); setError(err.message); });
    return () => unsubscribe();
  }, [logType]);

  const downloadCSV = () => {
    if (data.length === 0) return;
    const header = "Waktu,CO2 (ppm),Suhu (°C),Kelembaban (%),Evaporator (°C)\n";
    const csv = data.map(r => `${r.date},${r.co2},${r.temp},${r.hum},${r.evap}`).join("\n");
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `log_${logType}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-fade-in flex flex-col gap-6">
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-end flex-wrap gap-4"
          style={{ borderColor: 'color-mix(in srgb, var(--color-outline-variant) 10%, transparent)' }}>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-on-surface)' }}>Cultivation Logs</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
              Riwayat data sensor dari Sensor Node 01 — <span className="font-medium">{logLabels[logType]}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={downloadCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors"
              style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }}>
              <span className="material-symbols-outlined text-base">download</span> Export CSV
            </button>
            <div className="flex gap-1 p-1 rounded-full" style={{ background: 'var(--color-surface-container-high)' }}>
              {(['10m', '1h'] as const).map(t => (
                <button key={t} onClick={() => setLogType(t)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-full transition-all"
                  style={{ background: logType === t ? 'var(--color-primary)' : 'transparent', color: logType === t ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)' }}>
                  {t === '10m' ? '10 Menit' : '1 Jam (Avg)'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 flex flex-col items-center gap-3" style={{ color: 'var(--color-on-surface-variant)' }}>
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
              <span className="text-sm font-semibold uppercase tracking-widest">Memuat Data...</span>
            </div>
          ) : error ? (
            <div className="p-16 flex flex-col items-center gap-2" style={{ color: 'var(--color-on-surface-variant)' }}>
              <span className="material-symbols-outlined text-4xl opacity-40">history_edu</span>
              <span className="text-sm font-semibold">{error}</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: 'color-mix(in srgb, var(--color-surface-container-lowest) 30%, transparent)' }}>
                  {['Timestamp', 'CO₂ (ppm)', 'Suhu (°C)', 'Kelembaban (%)', 'Evap (°C)'].map((h, i) => (
                    <th key={i} className={`py-3 px-6 text-xs font-semibold uppercase tracking-wider ${i > 0 ? 'text-right' : ''}`}
                      style={{ color: 'var(--color-on-surface-variant)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ color: 'var(--color-on-surface)' }}>
                {data.map((row, i) => (
                  <tr key={i} className="transition-colors border-t"
                    style={{ borderColor: 'color-mix(in srgb, var(--color-outline-variant) 8%, transparent)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-surface-container-lowest) 50%, transparent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <td className="py-3 px-6 font-mono text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>{row.date}</td>
                    <td className="py-3 px-6 text-right font-medium">{row.co2}</td>
                    <td className="py-3 px-6 text-right font-medium">{row.temp}</td>
                    <td className="py-3 px-6 text-right font-medium">{row.hum}</td>
                    <td className="py-3 px-6 text-right" style={{ color: 'var(--color-on-surface-variant)' }}>{row.evap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// === Settings / Setpoints ===
function SetpointsViewer({ currentSetpoints, onSave }: { currentSetpoints: Setpoints; onSave: (s: Setpoints) => void; }) {
  const [form, setForm] = useState<Record<keyof Setpoints, string>>({
    tempMin: String(currentSetpoints.tempMin), tempMax: String(currentSetpoints.tempMax),
    humMin: String(currentSetpoints.humMin), humMax: String(currentSetpoints.humMax),
    co2Min: String(currentSetpoints.co2Min), co2Max: String(currentSetpoints.co2Max),
    evapMin: String(currentSetpoints.evapMin), evapMax: String(currentSetpoints.evapMax),
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (key: keyof Setpoints, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parse = (val: string, cur: number) => { if (val.trim() === '') return cur; const n = parseFloat(val); return isNaN(n) ? cur : n; };
    const final: Setpoints = {
      tempMin: parse(form.tempMin, currentSetpoints.tempMin), tempMax: parse(form.tempMax, currentSetpoints.tempMax),
      humMin: parse(form.humMin, currentSetpoints.humMin), humMax: parse(form.humMax, currentSetpoints.humMax),
      co2Min: parse(form.co2Min, currentSetpoints.co2Min), co2Max: parse(form.co2Max, currentSetpoints.co2Max),
      evapMin: parse(form.evapMin, currentSetpoints.evapMin), evapMax: parse(form.evapMax, currentSetpoints.evapMax),
    };
    onSave(final);
    setForm({ tempMin: String(final.tempMin), tempMax: String(final.tempMax), humMin: String(final.humMin), humMax: String(final.humMax), co2Min: String(final.co2Min), co2Max: String(final.co2Max), evapMin: String(final.evapMin), evapMax: String(final.evapMax) });
    setSaved(true); setTimeout(() => setSaved(false), 4000);
  };

  const fields: { key: keyof Setpoints; label: string; icon: string; unit: string; iconColor: string }[] = [
    { key: 'tempMin', label: 'Suhu Ruangan Min', icon: 'device_thermostat', unit: '°C', iconColor: 'var(--color-secondary)' },
    { key: 'tempMax', label: 'Suhu Ruangan Max', icon: 'device_thermostat', unit: '°C', iconColor: 'var(--color-secondary)' },
    { key: 'humMin', label: 'Kelembaban Min', icon: 'water_drop', unit: '%', iconColor: 'var(--color-tertiary)' },
    { key: 'humMax', label: 'Kelembaban Max', icon: 'water_drop', unit: '%', iconColor: 'var(--color-tertiary)' },
    { key: 'co2Min', label: 'CO₂ Min', icon: 'air', unit: 'ppm', iconColor: 'var(--color-primary)' },
    { key: 'co2Max', label: 'CO₂ Max', icon: 'air', unit: 'ppm', iconColor: 'var(--color-primary)' },
    { key: 'evapMin', label: 'Evap Temp Min', icon: 'ac_unit', unit: '°C', iconColor: 'var(--color-primary-fixed-dim)' },
    { key: 'evapMax', label: 'Evap Temp Max', icon: 'ac_unit', unit: '°C', iconColor: 'var(--color-primary-fixed-dim)' },
  ];

  const pairs = [
    { title: 'Temperature', icon: 'device_thermostat', iconColor: 'var(--color-secondary)', unit: '°C', minKey: 'tempMin' as keyof Setpoints, maxKey: 'tempMax' as keyof Setpoints },
    { title: 'Humidity', icon: 'water_drop', iconColor: 'var(--color-tertiary)', unit: '%', minKey: 'humMin' as keyof Setpoints, maxKey: 'humMax' as keyof Setpoints },
    { title: 'CO₂ Concentration', icon: 'air', iconColor: 'var(--color-primary)', unit: 'ppm', minKey: 'co2Min' as keyof Setpoints, maxKey: 'co2Max' as keyof Setpoints },
    { title: 'Evap Temperature', icon: 'ac_unit', iconColor: 'var(--color-primary-fixed-dim)', unit: '°C', minKey: 'evapMin' as keyof Setpoints, maxKey: 'evapMax' as keyof Setpoints },
  ];

  return (
    <form onSubmit={handleSubmit} className="page-fade-in flex flex-col gap-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-on-surface)' }}>System Settings</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>Atur batas parameter operasional alat. Kosongkan untuk mempertahankan nilai sebelumnya.</p>
          </div>
          {saved && (
            <span className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: 'color-mix(in srgb, #2e7d32 12%, transparent)', color: '#2e7d32' }}>
              <span className="material-symbols-outlined text-base">check_circle</span> Tersimpan ke Perangkat!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pairs.map(pair => (
            <div key={pair.title} className="rounded-xl p-5"
              style={{ background: 'color-mix(in srgb, var(--color-surface-container-lowest) 50%, transparent)', border: '1px solid color-mix(in srgb, var(--color-outline-variant) 15%, transparent)' }}>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: 'color-mix(in srgb, var(--color-outline-variant) 12%, transparent)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-surface-container-high)' }}>
                  <span className="material-symbols-outlined text-base" style={{ color: pair.iconColor }}>{pair.icon}</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>{pair.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{ k: pair.minKey, label: `Min (${pair.unit})` }, { k: pair.maxKey, label: `Max (${pair.unit})` }].map(({ k, label }) => (
                  <div key={k} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-on-surface-variant)' }}>{label}</label>
                    <input type="number" step="any" value={form[k]}
                      onChange={e => handleChange(k, e.target.value)}
                      placeholder={`Mis. ${currentSetpoints[k]}`}
                      className="w-full rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none transition-all"
                      style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--color-outline-variant)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 shadow-lg"
            style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', boxShadow: 'color-mix(in srgb, var(--color-primary) 30%, transparent) 0 4px 16px' }}>
            <span className="material-symbols-outlined text-lg">save</span>
            Simpan & Terapkan ke Perangkat
          </button>
        </div>
      </div>
    </form>
  );
}

// === Main Dashboard ===
export default function RealtimeDashboard() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [activeKpi, setActiveKpi] = useState<string | null>('co2');
  const [sensors, setSensors] = useState<SensorsData>({ co2: 0, temp: 0, hum: 0, evap: 0 });
  const [actuators, setActuators] = useState<ActuatorsData>({
    blower: { mode: 'auto', state: false }, compressor: { mode: 'auto', state: false },
    exhaust: { mode: 'auto', state: false }, mistmaker: { mode: 'auto', state: false }
  });
  const [setpoints, setSetpoints] = useState<Setpoints>({
    tempMin: 20, tempMax: 28, humMin: 80, humMax: 95,
    co2Min: 600, co2Max: 1200, evapMin: 5, evapMax: 15
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const stateRef = ref(db, 'state');
    const unsubscribe = onValue(stateRef, (snapshot) => {
      if (snapshot.exists()) {
        const p = snapshot.val();
        if (p.sensors) setSensors(p.sensors);
        if (p.actuators) setActuators(p.actuators);
        if (p.setpoints) setSetpoints(p.setpoints);
      }
    });
    const connRef = ref(db, '.info/connected');
    const unsubConn = onValue(connRef, (snap) => setIsConnected(snap.val() === true));
    return () => { unsubscribe(); unsubConn(); };
  }, []);

  const sendCommand = (id: string, mode: 'auto' | 'manual', state: boolean) => {
    setActuators(prev => ({ ...prev, [id]: { mode, state } }));
    push(ref(db, 'commands'), `CMD,${id},${mode},${state ? 1 : 0}`);
  };

  const saveSetpoints = (newSp: Setpoints) => {
    setSetpoints(newSp);
    set(ref(db, 'state/setpoints'), newSp);
    push(ref(db, 'commands'), `SET,${newSp.tempMin},${newSp.tempMax},${newSp.humMin},${newSp.humMax},${Math.round(newSp.co2Min)},${Math.round(newSp.co2Max)},${newSp.evapMin},${newSp.evapMax}`);
  };

  const getTempStatus = (): 'good' | 'warning' | 'critical' => sensors.temp >= setpoints.tempMin && sensors.temp <= setpoints.tempMax ? 'good' : 'warning';
  const getHumStatus = (): 'good' | 'warning' | 'critical' => sensors.hum >= setpoints.humMin && sensors.hum <= setpoints.humMax ? 'good' : 'warning';
  const getCo2Status = (): 'good' | 'warning' | 'critical' => sensors.co2 >= setpoints.co2Min && sensors.co2 <= setpoints.co2Max ? 'good' : 'warning';
  const getEvapStatus = (): 'good' | 'warning' | 'critical' => sensors.evap >= setpoints.evapMin && sensors.evap <= setpoints.evapMax ? 'good' : 'warning';

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="pl-72 flex-1 flex flex-col">
        <TopHeader isConnected={isConnected} />

        <main className="relative pt-16 flex-1" style={{ background: 'var(--color-surface)' }}>
          <div className="flex flex-col w-full px-6 pb-12 gap-6 pt-6 page-fade-in">

            {activePage === 'dashboard' && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KpiCard label="CO₂ Concentration" value={Math.round(sensors.co2).toString()} unit="ppm"
                    icon="air" iconColor="var(--color-primary)" accent="var(--color-primary)"
                    trend={getCo2Status() === 'good' ? 'Dalam Batas' : 'Di Luar Batas'} status={getCo2Status()}
                    isActive={activeKpi === 'co2'} onClick={() => setActiveKpi('co2')} />
                  <KpiCard label="Temperature" value={sensors.temp.toFixed(1)} unit="°C"
                    icon="device_thermostat" iconColor="var(--color-secondary)" accent="var(--color-secondary)"
                    trend={getTempStatus() === 'good' ? 'Dalam Batas' : 'Di Luar Batas'} status={getTempStatus()}
                    isActive={activeKpi === 'temp'} onClick={() => setActiveKpi('temp')} />
                  <KpiCard label="Humidity" value={Math.round(sensors.hum).toString()} unit="%"
                    icon="water_drop" iconColor="var(--color-tertiary)" accent="var(--color-tertiary)"
                    trend={getHumStatus() === 'good' ? 'Stabil' : 'Perlu Perhatian'} status={getHumStatus()}
                    isActive={activeKpi === 'hum'} onClick={() => setActiveKpi('hum')} />
                  <KpiCard label="Evap Temperature" value={sensors.evap.toFixed(1)} unit="°C"
                    icon="ac_unit" iconColor="var(--color-primary-fixed-dim)" accent="var(--color-primary-fixed)"
                    trend={getEvapStatus() === 'good' ? 'Normal' : 'Periksa AC'} status={getEvapStatus()}
                    isActive={activeKpi === 'evap'} onClick={() => setActiveKpi('evap')} />
                </div>

                {/* Sensor Range Bars */}
                <div className="glass-card rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-on-surface)' }}>Sensor Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: 'CO₂', val: sensors.co2, min: setpoints.co2Min, max: setpoints.co2Max, unit: 'ppm', color: 'var(--color-primary)' },
                      { label: 'Temperature', val: sensors.temp, min: setpoints.tempMin, max: setpoints.tempMax, unit: '°C', color: 'var(--color-secondary)' },
                      { label: 'Humidity', val: sensors.hum, min: setpoints.humMin, max: setpoints.humMax, unit: '%', color: 'var(--color-tertiary)' },
                      { label: 'Evap Temp', val: sensors.evap, min: setpoints.evapMin, max: setpoints.evapMax, unit: '°C', color: 'var(--color-primary-fixed-dim)' },
                    ].map(s => {
                      const pct = Math.min(100, Math.max(0, ((s.val - s.min) / (s.max - s.min)) * 100));
                      const isIdeal = s.val >= s.min && s.val <= s.max;
                      return (
                        <div key={s.label}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>{s.label}</span>
                            <span className="text-sm font-bold" style={{ color: isIdeal ? s.color : 'var(--color-error)' }}>{s.val.toFixed(1)} {s.unit}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-container-high)' }}>
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: pct + '%', background: isIdeal ? s.color : 'var(--color-error)' }} />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Min: {s.min}</span>
                            <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Max: {s.max}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actuators */}
                <div className="glass-card rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-on-surface)' }}>Actuator Status</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ActuatorCard id="blower" title="Blower" icon="mode_fan" act={actuators.blower} onCommand={sendCommand} />
                    <ActuatorCard id="compressor" title="Compressor" icon="heat_pump" act={actuators.compressor} onCommand={sendCommand} />
                    <ActuatorCard id="exhaust" title="Exhaust Fan" icon="toys" act={actuators.exhaust} onCommand={sendCommand} />
                    <ActuatorCard id="mistmaker" title="Mist Maker" icon="blur_on" act={actuators.mistmaker} onCommand={sendCommand} />
                  </div>
                </div>
              </>
            )}

            {activePage === 'logs' && <DataLogViewer />}
            {activePage === 'settings' && <SetpointsViewer currentSetpoints={setpoints} onSave={saveSetpoints} />}
          </div>
        </main>
      </div>
    </div>
  );
}
