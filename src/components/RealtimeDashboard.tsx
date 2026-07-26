import React, { useState, useEffect, useRef } from 'react';

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
  const [logType, setLogType] = useState<'10m' | '1h' | '1d'>('10m');
  const [error, setError] = useState('');

  const logFiles: Record<string, string> = {
    '10m': '/log_10m.csv',
    '1h':  '/log_1h.csv',
    '1d':  '/log_1d.csv',
  };

  const logLabels: Record<string, string> = {
    '10m': 'Per 10 Menit',
    '1h':  'Per Jam',
    '1d':  'Per Hari',
  };

  const fetchData = () => {
    setLoading(true); setError('');
    const baseUrl = window.location.hostname === 'localhost' ? 'http://192.168.1.10' : '';
    fetch(baseUrl + logFiles[logType])
      .then(res => { if (!res.ok) throw new Error('Data belum tersedia.'); return res.text(); })
      .then(csv => {
        if (!csv || csv.trim() === '') throw new Error('Data masih kosong.');
        const lines = csv.trim().split('\n');
        const parsed: LogRow[] = lines
          .filter(line => line.trim() !== '' && !line.toLowerCase().startsWith('waktu') && !line.toLowerCase().startsWith('date'))
          .map(line => {
            const c = line.split(',');
            return { date: c[0] || '-', co2: c[1] || '-', temp: c[2] || '-', hum: c[3] || '-', evap: c[4] || '-' };
          });
        setData(parsed.reverse());
      })
      .catch(err => { setError(err.message); setData([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [logType]);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-wrap justify-between items-center gap-3 px-1">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recorded Data</h2>
        <div className="flex items-center gap-2">
          {/* Download Buttons */}
          <a href={(window.location.hostname === 'localhost' ? 'http://192.168.1.10' : '') + logFiles[logType]} download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors text-[10px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">download</span> Unduh
          </a>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors text-[10px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
          {/* Log Type Toggle */}
          <div className="flex bg-slate-200/70 p-0.5 rounded-lg border border-slate-200/50 shadow-inner">
            {(['10m', '1h', '1d'] as const).map(t => (
              <button key={t} onClick={() => setLogType(t)}
                className={"px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all " + (logType === t ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700')}>
                {t === '10m' ? '10M' : t === '1h' ? '1 Jam' : '1 Hari'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-400 px-1">Menampilkan data: <span className="font-semibold text-slate-500">{logLabels[logType]}</span></p>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3 text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
            <span className="text-sm font-semibold uppercase tracking-widest">Memuat Data...</span>
          </div>
        ) : error ? (
          <div className="p-10 flex flex-col items-center justify-center gap-2 text-slate-400">
            <span className="material-symbols-outlined text-4xl opacity-50">description</span>
            <span className="text-sm font-semibold">{error}</span>
            <span className="text-xs opacity-80 text-center max-w-xs">Data akan otomatis dicatat setiap interval. Silakan periksa kembali nanti.</span>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm shadow-sm z-10">
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  <th className="px-4 py-3 whitespace-nowrap">Waktu</th>
                  <th className="px-4 py-3 text-right">CO2</th>
                  <th className="px-4 py-3 text-right">Temp</th>
                  <th className="px-4 py-3 text-right">Hum</th>
                  <th className="px-4 py-3 text-right">Evap</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-slate-600">
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-slate-800 whitespace-nowrap font-mono text-xs">{row.date}</td>
                    <td className="px-4 py-3 text-right">{row.co2} <span className="text-[10px] text-slate-400 font-normal">ppm</span></td>
                    <td className="px-4 py-3 text-right">{row.temp} <span className="text-[10px] text-slate-400 font-normal">°C</span></td>
                    <td className="px-4 py-3 text-right">{row.hum} <span className="text-[10px] text-slate-400 font-normal">%</span></td>
                    <td className="px-4 py-3 text-right">{row.evap} <span className="text-[10px] text-slate-400 font-normal">°C</span></td>
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
  const [form, setForm] = useState<Setpoints>(currentSetpoints);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setForm(currentSetpoints);
  }, [currentSetpoints]);

  const handleChange = (key: keyof Setpoints, val: string) => {
    const num = parseFloat(val);
    setForm(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const renderInputCard = (
    title: string, icon: string, iconColor: string, unit: string,
    minKey: keyof Setpoints, maxKey: keyof Setpoints
  ) => (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 p-5 flex flex-col gap-4 transition-all hover:shadow-md">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <div className={"w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 " + iconColor}>
          <span className="material-symbols-outlined text-base">{icon}</span>
        </div>
        <span className="font-bold text-slate-800 tracking-tight">{title}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batas Min ({unit})</label>
          <input
            type="number" step="any"
            value={form[minKey]}
            onChange={e => handleChange(minKey, e.target.value)}
            className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batas Max ({unit})</label>
          <input
            type="number" step="any"
            value={form[maxKey]}
            onChange={e => handleChange(maxKey, e.target.value)}
            className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center px-1 flex-wrap gap-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pengaturan Batas Parameter (EEPROM)</h2>
        {savedSuccess && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-sm">check_circle</span> Tersimpan ke Arduino Mega & EEPROM!
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInputCard("Suhu Ruangan", "thermostat", "text-rose-500", "°C", "tempMin", "tempMax")}
        {renderInputCard("Kelembaban", "humidity_percentage", "text-amber-600", "%", "humMin", "humMax")}
        {renderInputCard("Kadar CO2", "cloud", "text-slate-600", "ppm", "co2Min", "co2Max")}
        {renderInputCard("Suhu Evaporator", "ac_unit", "text-blue-500", "°C", "evapMin", "evapMax")}
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
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = "ws://" + (window.location.hostname === 'localhost' ? '192.168.1.10' : window.location.host) + "/ws";
    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => setIsConnected(true);
      ws.onmessage = (event) => {
        try {
          const payload: WsUpdatePayload = JSON.parse(event.data);
          if (payload.type === 'update' && payload.data) {
            setSensors(payload.data.sensors);
            setActuators(payload.data.actuators);
            if (payload.data.setpoints) setSetpoints(payload.data.setpoints);
          }
        } catch (e) { console.error("Gagal mem-parsing data WS", e); }
      };
      ws.onclose = () => { setIsConnected(false); setTimeout(connectWebSocket, 3000); };
      ws.onerror = (err) => { console.error("WebSocket Error:", err); ws.close(); };
      wsRef.current = ws;
    };
    connectWebSocket();
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, []);

  const sendCommand = (id: string, mode: 'auto' | 'manual', state: boolean) => {
    setActuators(prev => ({ ...prev, [id]: { mode, state } }));
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send("CMD," + id + "," + mode + "," + (state ? 1 : 0));
    }
  };

  const saveSetpoints = (newSp: Setpoints) => {
    setSetpoints(newSp);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(`SET,${newSp.tempMin},${newSp.tempMax},${newSp.humMin},${newSp.humMax},${Math.round(newSp.co2Min)},${Math.round(newSp.co2Max)},${newSp.evapMin},${newSp.evapMax}`);
    }
  };

  // === Sensor Card with dynamic min/max from setpoints ===
  const renderSensorCard = (
    title: string, value: string, unit: string, icon: string, iconColorClass: string,
    currentVal: number, min: number, max: number
  ) => {
    const isIdeal = currentVal >= min && currentVal <= max;
    const pct = Math.min(100, Math.max(0, ((currentVal - min) / (max - min)) * 100));
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 p-5 flex flex-col relative transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className={"w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 " + iconColorClass}>
              <span className="material-symbols-outlined text-sm">{icon}</span>
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{title}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-bold text-slate-800 tracking-tight">{value}</span>
          <span className="text-sm font-medium text-slate-400">{unit}</span>
        </div>
        {/* Min/Max bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
            <span>Min: {min}{unit}</span>
            <span>Max: {max}{unit}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={"h-full rounded-full transition-all duration-500 " + (isIdeal ? "bg-green-400" : "bg-rose-400")}
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
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 p-5 flex flex-col gap-5 transition-all duration-300 hover:shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={"w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 " + iconColorClass}>
              <span className="material-symbols-outlined text-lg">{icon}</span>
            </div>
            <span className="font-semibold text-slate-800 tracking-tight">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{isOn ? 'Running' : 'Stopped'}</span>
            <span className="relative flex h-2.5 w-2.5">
              {isOn && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={"relative inline-flex rounded-full h-2.5 w-2.5 " + (isOn ? 'bg-emerald-500' : 'bg-slate-300')}></span>
            </span>
          </div>
        </div>
        <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Control Mode</span>
            <div className="bg-slate-200/80 p-0.5 rounded-lg flex items-center">
              <button onClick={() => sendCommand(id, 'auto', isOn)} className={"px-3 py-1 text-xs font-semibold rounded-md transition-all " + (isAuto ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700')}>Auto</button>
              <button onClick={() => sendCommand(id, 'manual', isOn)} className={"px-3 py-1 text-xs font-semibold rounded-md transition-all " + (!isAuto ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700')}>Manual</button>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
            <span className={"text-xs font-medium " + (isAuto ? 'text-slate-400' : 'text-slate-600')}>Power</span>
            <button onClick={() => sendCommand(id, act.mode, !isOn)} disabled={isAuto}
              className={"relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 "
                + (isOn ? (isAuto ? 'bg-emerald-300' : 'bg-emerald-500') : 'bg-slate-300')
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
      <div className="flex bg-slate-100 p-1.5 rounded-xl w-full max-w-md mx-auto shadow-inner border border-slate-200/60">
        <button onClick={() => setActiveTab('live')} className={"flex-1 flex items-center justify-center gap-1.5 py-2 text-xs md:text-sm font-bold rounded-lg transition-all " + (activeTab === 'live' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50')}>
          <span className="material-symbols-outlined text-sm">dashboard</span> Live
        </button>
        <button onClick={() => setActiveTab('logs')} className={"flex-1 flex items-center justify-center gap-1.5 py-2 text-xs md:text-sm font-bold rounded-lg transition-all " + (activeTab === 'logs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50')}>
          <span className="material-symbols-outlined text-sm">table_view</span> Data Logs
        </button>
        <button onClick={() => setActiveTab('settings')} className={"flex-1 flex items-center justify-center gap-1.5 py-2 text-xs md:text-sm font-bold rounded-lg transition-all " + (activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50')}>
          <span className="material-symbols-outlined text-sm">tune</span> Pengaturan
        </button>
      </div>

      {activeTab === 'live' ? (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <section className="w-full relative">
            <div className="flex justify-between items-end mb-4 px-1">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Environment Sensors</h2>
              <span className={"px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-sm border "
                + (isConnected ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200")}>
                <span className={"w-2 h-2 rounded-full block " + (isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500")}></span>
                {isConnected ? "WS Connected" : "Connecting..."}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderSensorCard("CO2", Math.round(sensors.co2).toString(), "ppm", "cloud", "text-slate-600", sensors.co2, setpoints.co2Min, setpoints.co2Max)}
              {renderSensorCard("Room Temp", sensors.temp.toFixed(1), "°C", "thermostat", "text-rose-500", sensors.temp, setpoints.tempMin, setpoints.tempMax)}
              {renderSensorCard("Humidity", Math.round(sensors.hum).toString(), "%", "humidity_percentage", "text-amber-600", sensors.hum, setpoints.humMin, setpoints.humMax)}
              {renderSensorCard("Evaporator", sensors.evap.toFixed(1), "°C", "ac_unit", "text-blue-500", sensors.evap, setpoints.evapMin, setpoints.evapMax)}
            </div>
          </section>
          <section className="w-full relative">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Actuators Control</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderActuatorCard("blower", "Blower", "ac_unit", "text-blue-600")}
              {renderActuatorCard("compressor", "Compressor", "local_fire_department", "text-rose-600")}
              {renderActuatorCard("exhaust", "Exhaust Fan", "air", "text-slate-600")}
              {renderActuatorCard("mistmaker", "Mist Maker", "water_drop", "text-teal-600")}
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
