import React, { useState, useEffect } from 'react';
import { ref, onValue, set, push } from "firebase/database";
import { db } from "../lib/firebase";

// === Type Definitions ===
interface SensorsData { co2: number; temp: number; hum: number; evap: number; }
interface ActuatorData { mode: 'auto' | 'manual'; state: boolean; }
interface ActuatorsData { blower: ActuatorData; compressor: ActuatorData; exhaust: ActuatorData; mistmaker: ActuatorData; }
interface Setpoints { tempMin: number; tempMax: number; humMin: number; humMax: number; co2Min: number; co2Max: number; evapMin: number; evapMax: number; }
interface WsUpdatePayload { type: string; data: { sensors: SensorsData; actuators: ActuatorsData; setpoints: Setpoints; } }

interface LogRow { date: string; co2: string; temp: string; hum: string; evap: string; }

// === Data Log Viewer ===
function DataLogViewer() {
  const [data, setData] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [logType, setLogType] = useState<'10m' | '1h'>('10m');
  const [error, setError] = useState('');

  const logFiles: Record<string, string> = {
    '10m': '/log_10m.csv',
    '1h':  '/log_1h.csv',
  };

  const logLabels: Record<string, string> = {
    '10m': 'Per 10 Menit',
    '1h':  'Rata-rata 1 Jam',
  };

  useEffect(() => {
    setLoading(true); setError('');
    const logRef = ref(db, 'logs/' + logType);
    const unsubscribe = onValue(logRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        const parsed: LogRow[] = [];
        snapshot.forEach((childSnapshot) => {
          parsed.push(childSnapshot.val());
        });
        setData(parsed.reverse());
      } else {
        setData([]);
        setError('Data masih kosong.');
      }
    }, (err) => {
      setLoading(false);
      setError(err.message);
    });

    return () => unsubscribe();
  }, [logType]);

  const downloadCSV = () => {
    if (data.length === 0) return;
    const header = "Waktu,CO2 (ppm),Suhu (°C),Kelembaban (%),Evaporator (°C)\\n";
    const csv = data.map(r => `${r.date},${r.co2},${r.temp},${r.hum},${r.evap}`).join("\\n");
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log_${logType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-wrap justify-between items-center gap-3 px-1">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Recorded Data</h2>
        <div className="flex items-center gap-2">
          {/* Download Buttons */}
          <button onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-[10px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">download</span> Unduh
          </button>
          <button onClick={() => setLogType(logType)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-[10px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
          {/* Log Type Toggle */}
          <div className="flex bg-slate-200/70 dark:bg-slate-800/70 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
            {(['10m', '1h'] as const).map(t => (
              <button key={t} onClick={() => setLogType(t)}
                className={"px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all " + (logType === t ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300')}>
                {t === '10m' ? '10M' : '1 Jam (Avg)'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 px-1">Menampilkan data: <span className="font-semibold text-slate-500 dark:text-slate-400">{logLabels[logType]}</span></p>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
            <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
            <span className="text-sm font-semibold uppercase tracking-widest">Memuat Data...</span>
          </div>
        ) : error ? (
          <div className="p-10 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
            <span className="material-symbols-outlined text-4xl opacity-50">description</span>
            <span className="text-sm font-semibold">{error}</span>
            <span className="text-xs opacity-80 text-center max-w-xs">Data akan otomatis dicatat setiap interval. Silakan periksa kembali nanti.</span>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm z-10">
                <tr className="border-b border-slate-200 dark:border-slate-700/80 text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">
                  <th className="px-4 py-3 whitespace-nowrap">Waktu</th>
                  <th className="px-4 py-3 text-right">CO2</th>
                  <th className="px-4 py-3 text-right">Temp</th>
                  <th className="px-4 py-3 text-right">Hum</th>
                  <th className="px-4 py-3 text-right">Evap</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 whitespace-nowrap font-mono text-xs">{row.date}</td>
                    <td className="px-4 py-3 text-right">{row.co2} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">ppm</span></td>
                    <td className="px-4 py-3 text-right">{row.temp} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">°C</span></td>
                    <td className="px-4 py-3 text-right">{row.hum} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">%</span></td>
                    <td className="px-4 py-3 text-right">{row.evap} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">°C</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// === Setpoints Configuration Viewer ===
function SetpointsViewer({
  currentSetpoints,
  onSave
}: {
  currentSetpoints: Setpoints;
  onSave: (newSetpoints: Setpoints) => void;
}) {
  // Gunakan string untuk form agar user bisa mengosongkan field
  const [form, setForm] = useState<Record<keyof Setpoints, string>>({
    tempMin: String(currentSetpoints.tempMin),
    tempMax: String(currentSetpoints.tempMax),
    humMin: String(currentSetpoints.humMin),
    humMax: String(currentSetpoints.humMax),
    co2Min: String(currentSetpoints.co2Min),
    co2Max: String(currentSetpoints.co2Max),
    evapMin: String(currentSetpoints.evapMin),
    evapMax: String(currentSetpoints.evapMax),
  });
  
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (key: keyof Setpoints, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Fungsi untuk mem-parse string ke angka, menggunakan current value jika kosong
    const parse = (val: string, current: number) => {
      if (val.trim() === '') return current;
      const num = parseFloat(val);
      return isNaN(num) ? current : num;
    };
    
    const finalSetpoints: Setpoints = {
      tempMin: parse(form.tempMin, currentSetpoints.tempMin),
      tempMax: parse(form.tempMax, currentSetpoints.tempMax),
      humMin: parse(form.humMin, currentSetpoints.humMin),
      humMax: parse(form.humMax, currentSetpoints.humMax),
      co2Min: parse(form.co2Min, currentSetpoints.co2Min),
      co2Max: parse(form.co2Max, currentSetpoints.co2Max),
      evapMin: parse(form.evapMin, currentSetpoints.evapMin),
      evapMax: parse(form.evapMax, currentSetpoints.evapMax),
    };

    onSave(finalSetpoints);
    
    // Kembalikan form ke nilai yang sebenarnya tersimpan (agar user tau kalo kosong jadi nilai lama)
    setForm({
      tempMin: String(finalSetpoints.tempMin),
      tempMax: String(finalSetpoints.tempMax),
      humMin: String(finalSetpoints.humMin),
      humMax: String(finalSetpoints.humMax),
      co2Min: String(finalSetpoints.co2Min),
      co2Max: String(finalSetpoints.co2Max),
      evapMin: String(finalSetpoints.evapMin),
      evapMax: String(finalSetpoints.evapMax),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const renderInputCard = (
    title: string, icon: string, iconColor: string, unit: string,
    minKey: keyof Setpoints, maxKey: keyof Setpoints
  ) => (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-5 flex flex-col gap-4 transition-all hover:shadow-md">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/50 pb-3">
        <div className={"w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700/50 " + iconColor}>
          <span className="material-symbols-outlined text-base">{icon}</span>
        </div>
        <span className="font-bold text-slate-800 dark:text-slate-200 tracking-tight">{title}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Batas Min ({unit})</label>
          <input
            type="number" step="any"
            value={form[minKey]}
            onChange={e => handleChange(minKey, e.target.value)}
            placeholder={`Mis. ${currentSetpoints[minKey]}`}
            className="w-full bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Batas Max ({unit})</label>
          <input
            type="number" step="any"
            value={form[maxKey]}
            onChange={e => handleChange(maxKey, e.target.value)}
            placeholder={`Mis. ${currentSetpoints[maxKey]}`}
            className="w-full bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center px-1 flex-wrap gap-2">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pengaturan Batas Parameter</h2>
        {savedSuccess && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-sm">check_circle</span> Tersimpan ke Arduino Mega!
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInputCard("Suhu Ruangan", "thermostat", "text-rose-500 dark:text-rose-400", "°C", "tempMin", "tempMax")}
        {renderInputCard("Kelembaban", "humidity_percentage", "text-amber-600 dark:text-amber-500", "%", "humMin", "humMax")}
        {renderInputCard("Kadar CO2", "cloud", "text-slate-600 dark:text-slate-400", "ppm", "co2Min", "co2Max")}
        {renderInputCard("Suhu Evaporator", "ac_unit", "text-blue-500 dark:text-blue-400", "°C", "evapMin", "evapMax")}
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all text-sm">
          <span className="material-symbols-outlined text-lg">save</span> Simpan & Terapkan ke Perangkat
        </button>
      </div>
    </form>
  );
}

// === Main Dashboard ===
export default function RealtimeDashboard() {
  const [activeTab, setActiveTab] = useState<'live' | 'logs' | 'settings'>('live');
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
        const payload = snapshot.val();
        if (payload.sensors) setSensors(payload.sensors);
        if (payload.actuators) setActuators(payload.actuators);
        if (payload.setpoints) setSetpoints(payload.setpoints);
      }
    }, (error) => {
      console.error("Firebase Error:", error);
    });

    const connectedRef = ref(db, '.info/connected');
    const unsubConn = onValue(connectedRef, (snap) => {
      setIsConnected(snap.val() === true);
    });

    return () => {
      unsubscribe();
      unsubConn();
    };
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

  // === Sensor Card with dynamic min/max from setpoints ===
  const renderSensorCard = (
    title: string, value: string, unit: string, icon: string, iconColorClass: string,
    currentVal: number, min: number, max: number
  ) => {
    const isIdeal = currentVal >= min && currentVal <= max;
    const pct = Math.min(100, Math.max(0, ((currentVal - min) / (max - min)) * 100));
    return (
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-5 flex flex-col relative transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className={"w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-700/50 " + iconColorClass}>
              <span className="material-symbols-outlined text-sm">{icon}</span>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{value}</span>
          <span className="text-sm font-medium text-slate-400 dark:text-slate-500">{unit}</span>
        </div>
        {/* Min/Max bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-1">
            <span>Min: {min}{unit}</span>
            <span>Max: {max}{unit}</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={"h-full rounded-full transition-all duration-500 " + (isIdeal ? "bg-green-400 dark:bg-green-500" : "bg-rose-400 dark:bg-rose-500")}
              style={{ width: pct + "%" }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderActuatorCard = (id: keyof ActuatorsData, title: string, icon: string, iconColorClass: string) => {
    const act = actuators[id]; const isAuto = act.mode === 'auto'; const isOn = act.state;
    return (
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-5 flex flex-col gap-5 transition-all duration-300 hover:shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={"w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700/50 " + iconColorClass}>
              <span className="material-symbols-outlined text-lg">{icon}</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 tracking-tight">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">{isOn ? 'Running' : 'Stopped'}</span>
            <span className="relative flex h-2.5 w-2.5">
              {isOn && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={"relative inline-flex rounded-full h-2.5 w-2.5 " + (isOn ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600')}></span>
            </span>
          </div>
        </div>
        <div className="bg-slate-50/50 dark:bg-slate-700/20 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Control Mode</span>
            <div className="bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg flex items-center">
              <button onClick={() => sendCommand(id, 'auto', isOn)} className={"px-3 py-1 text-xs font-semibold rounded-md transition-all " + (isAuto ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300')}>Auto</button>
              <button onClick={() => sendCommand(id, 'manual', isOn)} className={"px-3 py-1 text-xs font-semibold rounded-md transition-all " + (!isAuto ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300')}>Manual</button>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
            <span className={"text-xs font-medium " + (isAuto ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300')}>Power</span>
            <button onClick={() => sendCommand(id, act.mode, !isOn)} disabled={isAuto}
              className={"relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 "
                + (isOn ? (isAuto ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-emerald-500') : 'bg-slate-300 dark:bg-slate-600')
                + (isAuto ? ' cursor-not-allowed opacity-60' : ' cursor-pointer')}>
              <span className={"inline-block h-4 w-4 transform rounded-full bg-white transition-transform " + (isOn ? 'translate-x-6' : 'translate-x-1')} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* TABS NAVIGATION */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-full max-w-md mx-auto shadow-inner border border-slate-200/60 dark:border-slate-700/60">
        <button onClick={() => setActiveTab('live')} className={"flex-1 flex items-center justify-center gap-1.5 py-2 text-xs md:text-sm font-bold rounded-lg transition-all " + (activeTab === 'live' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50')}>
          <span className="material-symbols-outlined text-sm">dashboard</span> Live
        </button>
        <button onClick={() => setActiveTab('logs')} className={"flex-1 flex items-center justify-center gap-1.5 py-2 text-xs md:text-sm font-bold rounded-lg transition-all " + (activeTab === 'logs' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50')}>
          <span className="material-symbols-outlined text-sm">table_view</span> Data Logs
        </button>
        <button onClick={() => setActiveTab('settings')} className={"flex-1 flex items-center justify-center gap-1.5 py-2 text-xs md:text-sm font-bold rounded-lg transition-all " + (activeTab === 'settings' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50')}>
          <span className="material-symbols-outlined text-sm">tune</span> Pengaturan
        </button>
      </div>

      {activeTab === 'live' ? (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <section className="w-full relative">
            <div className="flex justify-between items-end mb-4 px-1">
              <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Environment Sensors</h2>
              <span className={"px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-sm border "
                + (isConnected ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50")}>
                <span className={"w-2 h-2 rounded-full block " + (isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500")}></span>
                {isConnected ? "Cloud Connected" : "Connecting..."}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderSensorCard("CO2", Math.round(sensors.co2).toString(), "ppm", "cloud", "text-slate-600 dark:text-slate-400", sensors.co2, setpoints.co2Min, setpoints.co2Max)}
              {renderSensorCard("Room Temp", sensors.temp.toFixed(1), "°C", "thermostat", "text-rose-500 dark:text-rose-400", sensors.temp, setpoints.tempMin, setpoints.tempMax)}
              {renderSensorCard("Humidity", Math.round(sensors.hum).toString(), "%", "humidity_percentage", "text-amber-600 dark:text-amber-500", sensors.hum, setpoints.humMin, setpoints.humMax)}
              {renderSensorCard("Evaporator", sensors.evap.toFixed(1), "°C", "ac_unit", "text-blue-500 dark:text-blue-400", sensors.evap, setpoints.evapMin, setpoints.evapMax)}
            </div>
          </section>
          <section className="w-full relative">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-1">Actuators Control</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderActuatorCard("blower", "Blower", "ac_unit", "text-blue-600 dark:text-blue-400")}
              {renderActuatorCard("compressor", "Compressor", "local_fire_department", "text-rose-600 dark:text-rose-400")}
              {renderActuatorCard("exhaust", "Exhaust Fan", "air", "text-slate-600 dark:text-slate-400")}
              {renderActuatorCard("mistmaker", "Mist Maker", "water_drop", "text-teal-600 dark:text-teal-400")}
            </div>
          </section>
        </div>
      ) : activeTab === 'logs' ? (
        <DataLogViewer />
      ) : (
        <SetpointsViewer currentSetpoints={setpoints} onSave={saveSetpoints} />
      )}
    </div>
  );
}
