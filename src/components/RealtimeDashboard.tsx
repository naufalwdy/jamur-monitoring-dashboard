import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, onValue, set, push, query, limitToLast } from "firebase/database";
import { db } from "../lib/firebase";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// === Type Definitions ===
interface SensorsData { co2: number; temp: number; hum: number; evap: number; }
interface ActuatorData { mode: 'auto' | 'manual'; state: boolean; }
interface ActuatorsData { blower: ActuatorData; compressor: ActuatorData; exhaust: ActuatorData; mistmaker: ActuatorData; }
interface Setpoints { tempMin: number; tempMax: number; humMin: number; humMax: number; co2Min: number; co2Max: number; evapMin: number; evapMax: number; }
interface LogRow { date: string; co2: string; temp: string; hum: string; evap: string; }

type Page = 'dashboard' | 'logs' | 'admin';

// === Fluid Island Nav ===
function FluidIslandNav({ activePage, onNavigate, isConnected, toggleTheme, isDark }: { 
  activePage: Page; onNavigate: (p: Page) => void;
  isConnected: boolean; toggleTheme: () => void; isDark: boolean; 
}) {
  const navItems: { id: Page; icon: string; label: string }[] = [
    { id: 'dashboard', icon: 'grid_view', label: 'Dashboard' },
    { id: 'logs', icon: 'history_edu', label: 'Logs' },
    { id: 'admin', icon: 'admin_panel_settings', label: 'Admin' },
  ];

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 md:gap-4 px-4 py-3 rounded-full"
      style={{ 
        background: 'color-mix(in srgb, var(--surface) 60%, transparent)', 
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid color-mix(in srgb, var(--outline-variant) 20%, transparent)',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.1)'
      }}>
      
      {/* Brand */}
      <div className="flex items-center gap-2 pr-4 border-r" style={{ borderColor: 'color-mix(in srgb, var(--outline-variant) 30%, transparent)' }}>
        <span className="text-xl">🍄</span>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/20">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: isConnected ? 'var(--primary)' : 'var(--error)', boxShadow: isConnected ? '0 0 10px var(--primary)' : 'none' }} />
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex items-center gap-1">
        {navItems.map(item => {
          const isActive = activePage === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className="relative px-4 py-2 rounded-full text-sm font-medium smooth-transition active:scale-95 group"
              style={{ color: isActive ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>
              {isActive && (
                <motion.div layoutId="nav-pill" className="absolute inset-0 rounded-full"
                  style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center pl-4 border-l gap-2" style={{ borderColor: 'color-mix(in srgb, var(--outline-variant) 30%, transparent)' }}>
        <button onClick={toggleTheme} className="w-9 h-9 rounded-full flex items-center justify-center smooth-transition hover:scale-110 active:scale-90 bg-black/20 border border-white/5"
          style={{ color: 'var(--on-surface-variant)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--on-surface)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}>
          <span className="material-symbols-outlined text-[18px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>
    </motion.nav>
  );
}

// === Admin Login Component ===
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'Petani' && pass === 'jamurku') {
      setError(false);
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 800);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] page-fade-in">
      <motion.form 
        onSubmit={handleSubmit}
        animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-2xl p-8 w-full max-w-sm flex flex-col gap-6"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
            <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--primary)' }}>lock</span>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>Admin Access</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>Silakan login untuk mengatur alat</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>Username</label>
            <input type="text" value={user} onChange={e => setUser(e.target.value)} required
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none transition-all"
              style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--outline-variant)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>Password</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} required
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none transition-all"
              style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--outline-variant)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          {error && <p className="text-xs text-center font-semibold" style={{ color: 'var(--error)' }}>Kredensial tidak valid!</p>}
        </div>

        <button type="submit"
          className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg mt-2"
          style={{ background: 'var(--primary)', color: 'var(--on-primary)', boxShadow: 'color-mix(in srgb, var(--primary) 30%, transparent) 0 4px 16px' }}>
          Login
        </button>
      </motion.form>
    </div>
  );
}



// === KPI Card ===
function KpiCard({ label, value, unit, icon, iconColor, accent, trend, trendLabel, status, isActive, onClick, currentVal, min, max }: {
  label: string; value: string; unit: string; icon: string; iconColor: string; accent: string;
  trend?: string; trendLabel?: string; status?: 'good' | 'warning' | 'critical'; isActive: boolean; onClick: () => void;
  currentVal: number; min: number; max: number;
}) {
  const statusColors = { good: '#2e7d32', warning: 'var(--error)', critical: 'var(--error)' };
  const statusBg = { good: 'color-mix(in srgb, #2e7d32 15%, transparent)', warning: 'color-mix(in srgb, var(--error) 15%, transparent)', critical: 'color-mix(in srgb, var(--error) 20%, transparent)' };
  const statusLabel = { good: 'Optimal', warning: 'Warning', critical: 'Critical' };
  const color = status ? statusColors[status] : 'var(--on-surface-variant)';
  
  const pct = Math.min(100, Math.max(0, ((currentVal - min) / (max - min)) * 100));

  return (
    <button onClick={onClick}
      className={`glass-card rounded-xl p-4 text-left flex flex-col gap-2 relative overflow-hidden group focus:outline-none${isActive ? ' kpi-active scale-[1.02]' : ''}`}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-xl transition-colors"
        style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)` }} />
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider z-10" style={{ color: 'var(--on-surface-variant)' }}>{label}</span>
        <span className="material-symbols-outlined text-[20px] z-10" style={{ color: iconColor }}>{icon}</span>
      </div>
      
      <div className="flex items-baseline gap-2 mt-1 z-10">
        <span className="text-4xl font-bold tracking-tight" style={{ color: 'var(--on-surface)' }}>{value}</span>
        <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{unit}</span>
      </div>

      {/* Inline Progress Bar */}
      <div className="mt-2 w-full z-10">
        <div className="flex justify-between text-[9px] font-semibold mb-1" style={{ color: 'var(--on-surface-variant)' }}>
          <span>Min: {min}</span>
          <span>Max: {max}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-container-high)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: pct + '%', background: status === 'good' ? statusColors.good : statusColors.warning }} />
        </div>
      </div>

      {trend && status && (
        <div className="flex items-center gap-1.5 mt-auto pt-2 z-10">
          <span className="material-symbols-outlined text-sm" style={{ color }}>{status === 'good' ? 'trending_down' : 'trending_up'}</span>
          <span className="text-[11px] font-medium" style={{ color }}>{trend}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full ml-auto font-semibold uppercase tracking-wider" style={{ background: statusBg[status], color: statusColors[status] }}>{statusLabel[status]}</span>
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
    <div className="rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden smooth-transition hover:scale-[1.01]"
      style={{ background: 'color-mix(in srgb, var(--surface-container-lowest) 50%, transparent)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid color-mix(in srgb, var(--outline-variant) 15%, transparent)', boxShadow: 'inset 0 1px 0 0 color-mix(in srgb, var(--surface-container-lowest) 40%, transparent)' }}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: isOn ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'var(--surface-variant)', color: isOn ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </div>
          <span className="font-medium" style={{ color: 'var(--on-surface)' }}>{title}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold${isOn ? ' status-on' : ''}`}
          style={{ background: isOn ? 'var(--primary)' : 'var(--surface-variant)', color: isOn ? 'var(--on-primary)' : 'var(--on-surface-variant)' }}>
          {isOn ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'color-mix(in srgb, var(--outline-variant) 12%, transparent)' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>Mode</span>
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'var(--surface-container)' }}>
          <button onClick={() => onCommand(id, 'auto', isOn)}
            className="px-3 py-1 text-xs rounded-md smooth-transition font-semibold hover:scale-105 active:scale-95"
            style={{ background: isAuto ? 'var(--surface-container-lowest)' : 'transparent', color: isAuto ? 'var(--primary)' : 'var(--on-surface-variant)', boxShadow: isAuto ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
            Auto
          </button>
          <button onClick={() => onCommand(id, 'manual', isOn)}
            className="px-3 py-1 text-xs rounded-md smooth-transition font-semibold hover:scale-105 active:scale-95"
            style={{ background: !isAuto ? 'var(--surface-container-lowest)' : 'transparent', color: !isAuto ? 'var(--primary)' : 'var(--on-surface-variant)', boxShadow: !isAuto ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
            Manual
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: isAuto ? 'var(--on-surface-variant)' : 'var(--on-surface)' }}>Power</span>
        <button onClick={() => !isAuto && onCommand(id, 'manual', !isOn)} disabled={isAuto}
          className="relative inline-flex h-6 w-11 items-center rounded-full smooth-transition active:scale-90"
          style={{ background: isOn ? (isAuto ? 'color-mix(in srgb, var(--primary) 50%, gray)' : 'var(--primary)') : 'var(--surface-container-high)', cursor: isAuto ? 'not-allowed' : 'pointer', opacity: isAuto ? 0.6 : 1 }}>
          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
            style={{ transform: isOn ? 'translateX(24px)' : 'translateX(4px)' }} />
        </button>
      </div>
    </div>
  );
}

// === Full Cultivation Logs Viewer ===
function DataLogViewer() {
  const [data, setData] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [logType, setLogType] = useState<'2m' | '1h'>('2m');
  const [error, setError] = useState('');

  const logLabels: Record<string, string> = { '2m': 'Per 2 Menit', '1h': 'Rata-rata 1 Jam' };

  useEffect(() => {
    setLoading(true); setError('');
    const logRef = query(ref(db, 'logs/' + logType), limitToLast(200));
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
      <div className="glass-card rounded-xl overflow-hidden hover:translate-y-0 hover:scale-100">
        <div className="p-6 border-b flex justify-between items-end flex-wrap gap-4"
          style={{ borderColor: 'color-mix(in srgb, var(--outline-variant) 10%, transparent)' }}>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--on-surface)' }}>Cultivation Logs</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
              Riwayat data sensor dari Sensor Node 01 — <span className="font-medium">{logLabels[logType]}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={downloadCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors"
              style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }}>
              <span className="material-symbols-outlined text-base">download</span> Export CSV
            </button>
            <div className="flex gap-1 p-1 rounded-full" style={{ background: 'var(--surface-container-high)' }}>
              {(['2m', '1h'] as const).map(t => (
                <button key={t} onClick={() => setLogType(t)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-full transition-all"
                  style={{ background: logType === t ? 'var(--primary)' : 'transparent', color: logType === t ? 'var(--on-primary)' : 'var(--on-surface-variant)' }}>
                  {t === '2m' ? '2 Menit' : '1 Jam (Avg)'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 flex flex-col items-center gap-3" style={{ color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
              <span className="text-sm font-semibold uppercase tracking-widest">Memuat Data...</span>
            </div>
          ) : error ? (
            <div className="p-16 flex flex-col items-center gap-2" style={{ color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined text-4xl opacity-40">history_edu</span>
              <span className="text-sm font-semibold">{error}</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: 'color-mix(in srgb, var(--surface-container-lowest) 30%, transparent)' }}>
                  {['Timestamp', 'CO₂ (ppm)', 'Suhu (°C)', 'Kelembaban (%)', 'Evap (°C)'].map((h, i) => (
                    <th key={i} className={`py-3 px-6 text-xs font-semibold uppercase tracking-wider ${i > 0 ? 'text-right' : ''}`}
                      style={{ color: 'var(--on-surface-variant)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ color: 'var(--on-surface)' }}>
                {data.map((row, i) => (
                  <tr key={i} className="transition-colors border-t"
                    style={{ borderColor: 'color-mix(in srgb, var(--outline-variant) 8%, transparent)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--surface-container-lowest) 50%, transparent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <td className="py-3 px-6 font-mono text-xs" style={{ color: 'var(--on-surface-variant)' }}>{row.date}</td>
                    <td className="py-3 px-6 text-right font-medium">{row.co2}</td>
                    <td className="py-3 px-6 text-right font-medium">{row.temp}</td>
                    <td className="py-3 px-6 text-right font-medium">{row.hum}</td>
                    <td className="py-3 px-6 text-right" style={{ color: 'var(--on-surface-variant)' }}>{row.evap}</td>
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

  const pairs = [
    { title: 'Temperature', icon: 'device_thermostat', iconColor: 'var(--secondary)', unit: '°C', minKey: 'tempMin' as keyof Setpoints, maxKey: 'tempMax' as keyof Setpoints },
    { title: 'Humidity', icon: 'water_drop', iconColor: 'var(--tertiary)', unit: '%', minKey: 'humMin' as keyof Setpoints, maxKey: 'humMax' as keyof Setpoints },
    { title: 'CO₂ Concentration', icon: 'air', iconColor: 'var(--primary)', unit: 'ppm', minKey: 'co2Min' as keyof Setpoints, maxKey: 'co2Max' as keyof Setpoints },
    { title: 'Evap Temperature', icon: 'ac_unit', iconColor: 'var(--primary-fixed-dim)', unit: '°C', minKey: 'evapMin' as keyof Setpoints, maxKey: 'evapMax' as keyof Setpoints },
  ];

  return (
    <form onSubmit={handleSubmit} className="page-fade-in flex flex-col gap-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--on-surface)' }}>System Settings</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>Atur batas parameter operasional alat. Kosongkan untuk mempertahankan nilai sebelumnya.</p>
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
              style={{ background: 'color-mix(in srgb, var(--surface-container-lowest) 50%, transparent)', border: '1px solid color-mix(in srgb, var(--outline-variant) 15%, transparent)' }}>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: 'color-mix(in srgb, var(--outline-variant) 12%, transparent)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-container-high)' }}>
                  <span className="material-symbols-outlined text-base" style={{ color: pair.iconColor }}>{pair.icon}</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--on-surface)' }}>{pair.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{ k: pair.minKey, label: `Min (${pair.unit})` }, { k: pair.maxKey, label: `Max (${pair.unit})` }].map(({ k, label }) => (
                  <div key={k} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>{label}</label>
                    <input type="number" step="any" value={form[k]}
                      onChange={e => handleChange(k, e.target.value)}
                      placeholder={`Mis. ${currentSetpoints[k]}`}
                      className="w-full rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none transition-all"
                      style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--outline-variant)'; e.target.style.boxShadow = 'none'; }}
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
            style={{ background: 'var(--primary)', color: 'var(--on-primary)', boxShadow: 'color-mix(in srgb, var(--primary) 30%, transparent) 0 4px 16px' }}>
            <span className="material-symbols-outlined text-lg">save</span>
            Simpan & Terapkan ke Perangkat
          </button>
        </div>
      </div>
    </form>
  );
}

// === Main Dashboard Component ===
export default function RealtimeDashboard() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [activeKpi, setActiveKpi] = useState<'co2' | 'temp' | 'hum' | 'evap'>('co2');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Layout states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Theme state
  const [isDark, setIsDark] = useState(true);

  // Data states
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
  
  // Recent 2m logs for dashboard charts
  const [recentLogs, setRecentLogs] = useState<LogRow[]>([]);

  // Initialize theme and auth
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
    if (sessionStorage.getItem('isAdmin') === 'true') setIsAdmin(true);
  }, []);

  const handleLogin = () => {
    setIsAdmin(true);
    sessionStorage.setItem('isAdmin', 'true');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('isAdmin');
    setActivePage('dashboard');
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  useEffect(() => {
    // Realtime state
    const stateRef = ref(db, 'state');
    const unsubscribeState = onValue(stateRef, (snapshot) => {
      if (snapshot.exists()) {
        const p = snapshot.val();
        if (p.sensors) setSensors(p.sensors);
        if (p.actuators) setActuators(p.actuators);
        if (p.setpoints) setSetpoints(p.setpoints);
      }
    });

    // Connection info
    const connRef = ref(db, '.info/connected');
    const unsubConn = onValue(connRef, (snap) => setIsConnected(snap.val() === true));
    
    // Fetch recent 2m logs for chart and preview table
    const log2mRef = query(ref(db, 'logs/2m'), limitToLast(200));
    const unsubLog = onValue(log2mRef, (snapshot) => {
      if (snapshot.exists()) {
        const parsed: LogRow[] = [];
        snapshot.forEach((child) => { parsed.push(child.val()); });
        setRecentLogs(parsed.reverse());
      }
    });

    return () => { unsubscribeState(); unsubConn(); unsubLog(); };
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

  // Chart preparation
  const chartData = [...recentLogs].reverse().slice(-20); // get last 20 points chronologically for chart
  const paramColors = { co2: 'var(--primary)', temp: 'var(--secondary)', hum: 'var(--tertiary)', evap: 'var(--primary-fixed-dim)' };
  const paramKeys = { co2: 'CO₂ ppm', temp: 'Temperature °C', hum: 'Humidity %', evap: 'Evap Temp °C' };

  // Convert string values to numbers for recharts safely
  const formattedChartData = chartData.map(log => ({
    time: log.date ? (log.date.split(' ')[1] || log.date) : '',
    value: log[activeKpi] !== undefined ? Number(log[activeKpi]) : 0
  }));

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden font-sans relative" style={{ background: 'transparent' }}>
      
      <FluidIslandNav 
        activePage={activePage} onNavigate={setActivePage} 
        isConnected={isConnected} toggleTheme={toggleTheme} isDark={isDark}
      />

      <main className="relative pt-32 pb-24 flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 md:px-8">
        
        <AnimatePresence mode="wait">
          {activePage === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-8 w-full">
              
              {/* Macro Whitespace Header */}
              <div className="py-8 md:py-12">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-block px-3 py-1 rounded-full border border-white/10 bg-black/20 text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--primary)] mb-4 shadow-sm backdrop-blur-md">
                  Live Telemetry
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-extrabold tracking-tighter" style={{ color: 'var(--on-surface)' }}>
                  Cultivation Core
                </motion.h1>
              </div>

              {/* Asymmetrical Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-min gap-4 md:gap-6">
                
                <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <KpiCard label="CO₂ Level" value={Math.round(sensors.co2).toString()} unit="ppm" icon="air" iconColor="var(--primary)" accent="var(--primary)" status={getCo2Status()} currentVal={sensors.co2} min={setpoints.co2Min} max={setpoints.co2Max} isActive={activeKpi === 'co2'} onClick={() => setActiveKpi('co2')} />
                  <KpiCard label="Room Temp" value={sensors.temp.toFixed(1)} unit="°C" icon="device_thermostat" iconColor="var(--secondary)" accent="var(--secondary)" status={getTempStatus()} currentVal={sensors.temp} min={setpoints.tempMin} max={setpoints.tempMax} isActive={activeKpi === 'temp'} onClick={() => setActiveKpi('temp')} />
                  <KpiCard label="Humidity" value={Math.round(sensors.hum).toString()} unit="%" icon="water_drop" iconColor="var(--tertiary)" accent="var(--tertiary)" status={getHumStatus()} currentVal={sensors.hum} min={setpoints.humMin} max={setpoints.humMax} isActive={activeKpi === 'hum'} onClick={() => setActiveKpi('hum')} />
                  <KpiCard label="Evaporator" value={sensors.evap.toFixed(1)} unit="°C" icon="ac_unit" iconColor="var(--primary-fixed-dim)" accent="var(--primary-fixed)" status={getEvapStatus()} currentVal={sensors.evap} min={setpoints.evapMin} max={setpoints.evapMax} isActive={activeKpi === 'evap'} onClick={() => setActiveKpi('evap')} />
                </div>
                
                {/* Chart Bento Box */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="md:col-span-12 rounded-[2rem] p-1.5" style={{ background: 'color-mix(in srgb, var(--surface-container-lowest) 40%, transparent)', border: '1px solid color-mix(in srgb, var(--outline-variant) 10%, transparent)' }}>
                  <div className="rounded-[calc(2rem-0.375rem)] p-6 md:p-8 flex flex-col min-h-[400px]" style={{ background: 'color-mix(in srgb, var(--surface-container-low) 40%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)' }}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--on-surface)' }}>{paramKeys[activeKpi]}</h2>
                        <p className="text-sm font-medium mt-1" style={{ color: 'var(--on-surface-variant)' }}>Realtime trend over last 2 minutes</p>
                      </div>
                      <div className="bg-black/20 p-1.5 rounded-full border border-white/5 flex gap-1">
                        {['co2', 'temp', 'hum', 'evap'].map(k => (
                           <button key={k} onClick={() => setActiveKpi(k as any)} className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider smooth-transition" style={{ background: activeKpi === k ? 'var(--surface-container-high)' : 'transparent', color: activeKpi === k ? 'var(--primary)' : 'var(--on-surface-variant)' }}>{k}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 w-full relative min-h-[300px]">
                      {formattedChartData.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-sm font-semibold uppercase tracking-widest gap-2" style={{ color: 'var(--on-surface-variant)' }}>
                          <span className="material-symbols-outlined text-4xl animate-pulse">hourglass_empty</span>
                          Menunggu Data Log...
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={paramColors[activeKpi]} stopOpacity={1}/>
                              <stop offset="95%" stopColor={paramColors[activeKpi]} stopOpacity={0.2}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in srgb, var(--outline-variant) 15%, transparent)" vertical={false} />
                          <XAxis dataKey="time" stroke="var(--on-surface-variant)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                          <YAxis stroke="var(--on-surface-variant)" fontSize={10} tickLine={false} axisLine={false} dx={-10} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', color: 'var(--on-surface)', fontWeight: 600 }} itemStyle={{ color: paramColors[activeKpi] }} cursor={{ stroke: 'color-mix(in srgb, var(--outline-variant) 30%, transparent)' }} />
                          <Line type="monotone" dataKey="value" stroke="url(#lineGrad)" strokeWidth={4} dot={formattedChartData.length === 1 ? { r: 5, fill: paramColors[activeKpi], stroke: 'transparent' } : false} activeDot={{ r: 6, fill: paramColors[activeKpi], stroke: '#fff', strokeWidth: 2 }} animationDuration={1000} />
                        </LineChart>
                      </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </motion.div>

              </div>
            </motion.div>
          )}

          {activePage === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="pt-8">
              <DataLogViewer />
            </motion.div>
          )}

          {activePage === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="pt-8">
              {!isAdmin ? (
                <AdminLogin onLogin={handleLogin} />
              ) : (
                <div className="flex flex-col gap-8">
                  <div className="flex justify-between items-end flex-wrap gap-4">
                    <div>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-block px-3 py-1 rounded-full border border-white/10 bg-black/20 text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--primary)] mb-4 shadow-sm backdrop-blur-md">
                        Admin Mode
                      </motion.div>
                      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-extrabold tracking-tighter" style={{ color: 'var(--on-surface)' }}>
                        Control Panel
                      </motion.h1>
                    </div>
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-sm"
                      style={{ background: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)' }}>
                      <span className="material-symbols-outlined text-base">logout</span> Keluar Admin
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Actuators Bento Stack */}
                    <div className="glass-card rounded-xl p-6 h-fit">
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--on-surface)' }}>Manual Override</h2>
                        <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>Kontrol langsung terhadap sistem kelistrikan dan relay aktuator.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <ActuatorCard id="mistmaker" title="Mist Maker" icon="water" act={actuators.mistmaker} onCommand={sendCommand} />
                        <ActuatorCard id="blower" title="Circulation" icon="mode_fan" act={actuators.blower} onCommand={sendCommand} />
                        <ActuatorCard id="exhaust" title="Exhaust Fan" icon="wind_power" act={actuators.exhaust} onCommand={sendCommand} />
                        <ActuatorCard id="compressor" title="Compressor" icon="ac_unit" act={actuators.compressor} onCommand={sendCommand} />
                      </div>
                    </div>

                    <SetpointsViewer currentSetpoints={setpoints} onSave={saveSetpoints} />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
