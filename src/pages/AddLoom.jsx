import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLoomContext } from '../context/LoomContext';
import { api } from '../services/api';
import SetConfiguration from '../components/SetConfiguration';
import WifiConfiguration from '../components/WifiConfiguration';
import { AlertCircle, ArrowLeft, LoaderCircle } from 'lucide-react';

const createDefaultSets = (count = 4) =>
  Array.from({ length: Math.max(1, Number(count) || 1) }, (_, index) => ({
    setNumber: index + 1,
    takeup: index + 1,
    meter: 100,
  }));

const defaultWifi = {
  ssid: '',
  password: '',
  ipAddress: '192.168.1.10',
  port: 8080,
  connected: false,
};

export default function AddLoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { looms, addLoom, updateLoom, showToast, theme } = useLoomContext();

  const existingLoom = looms.find((l) => l.id === editId);

  const [loomNumber, setLoomNumber] = useState('');
  const [picNumber, setPicNumber] = useState('');
  const [status, setStatus] = useState('STOPPED');
  const [setCount, setSetCount] = useState(4);
  const [sets, setSets] = useState(() => createDefaultSets(4));
  const [wifi, setWifi] = useState({ ...defaultWifi });
  const [connectionState, setConnectionState] = useState('');
  const [testingWifi, setTestingWifi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Load existing loom data if in edit mode
  useEffect(() => {
    if (existingLoom) {
      setLoomNumber(String(existingLoom.loomNumber || ''));
      setPicNumber(existingLoom.picNumber || '');
      setStatus(existingLoom.status || 'STOPPED');
      const loadedSets = existingLoom.sets && existingLoom.sets.length > 0 ? existingLoom.sets : createDefaultSets(4);
      setSetCount(loadedSets.length);
      setSets(loadedSets);
      setWifi({
        ssid: existingLoom.wifi?.ssid || '',
        password: '', // never prefill sensitive password
        hasPassword: existingLoom.wifi?.hasPassword || false,
        ipAddress: existingLoom.wifi?.ipAddress || '192.168.1.10',
        port: existingLoom.wifi?.port || 8080,
        connected: Boolean(existingLoom.wifi?.connected),
      });
    }
  }, [existingLoom]);

  const handleSetCountChange = (val) => {
    const count = Math.max(1, Math.min(24, Number(val) || 1));
    setSetCount(count);
    setSets((prev) =>
      Array.from({ length: count }, (_, index) => {
        const existing = prev[index] || {};
        return {
          setNumber: index + 1,
          takeup: Number(existing.takeup) || index + 1,
          meter: Number(existing.meter) || 100,
        };
      }),
    );
  };

  const handleSetChange = (index, field, val) => {
    setSets((prev) =>
      prev.map((set, sIdx) =>
        sIdx === index ? { ...set, [field]: Math.max(0, Number(val) || 0) } : set,
      ),
    );
  };

  const handleWifiChange = (field, val) => {
    setWifi((prev) => ({
      ...prev,
      [field]: field === 'port' ? Number(val) || 8080 : val,
    }));
  };

  const handleTestConnection = async () => {
    setTestingWifi(true);
    setConnectionState('');
    try {
      const res = await api.testWifi(wifi);
      if (res && res.connected) {
        setConnectionState('Connection verified successfully.');
        setWifi((prev) => ({ ...prev, connected: true }));
      } else {
        setConnectionState(res?.message || 'Connection failed: Unable to reach controller.');
        setWifi((prev) => ({ ...prev, connected: false }));
      }
    } catch (err) {
      setConnectionState('Connection test failed: ' + (err.message || 'Controller unreachable.'));
      setWifi((prev) => ({ ...prev, connected: false }));
    } finally {
      setTestingWifi(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError('');

    const parsedLoomNum = Number(loomNumber);
    if (!loomNumber || isNaN(parsedLoomNum) || parsedLoomNum <= 0) {
      setValidationError('Please enter a valid positive Loom Number.');
      return;
    }

    if (!picNumber.trim()) {
      setValidationError('PIC Number is required.');
      return;
    }

    // Check for duplicate loom number on new entries
    if (!existingLoom) {
      const duplicate = looms.some((l) => Number(l.loomNumber) === parsedLoomNum);
      if (duplicate) {
        setValidationError(`Loom Number ${parsedLoomNum} already exists. Please choose a unique number.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        loomNumber: parsedLoomNum,
        picNumber: picNumber.trim(),
        status,
        sets: sets.map((s, idx) => ({
          setNumber: idx + 1,
          takeup: Number(s.takeup) || 1,
          meter: Number(s.meter) || 100,
        })),
        wifi: {
          ssid: wifi.ssid,
          password: wifi.password,
          ipAddress: wifi.ipAddress,
          port: Number(wifi.port) || 8080,
          connected: Boolean(wifi.connected),
        },
      };

      if (existingLoom) {
        await updateLoom(existingLoom.id, payload);
        showToast(`Loom ${parsedLoomNum} updated successfully.`, 'success');
      } else {
        await addLoom(payload);
        showToast(`Loom ${parsedLoomNum} registered successfully.`, 'success');
      }

      navigate('/settings?tab=looms');
    } catch (err) {
      setValidationError(err.message || 'Failed to save loom to backend database.');
      showToast(err.message || 'Error saving loom.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = theme === 'light'
    ? 'border-slate-300 bg-white text-slate-900 focus:border-cyan-500'
    : 'border-slate-700 bg-slate-900 text-slate-100 focus:border-cyan-500';

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="card-glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/settings?tab=looms')}
            className={`rounded-xl border p-2 transition ${
              theme === 'light'
                ? 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            aria-label="Back to Loom Configuration"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {existingLoom ? `Edit Loom ${existingLoom.loomNumber}` : 'Add New Loom'}
            </h1>
            <p className={`mt-0.5 text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              Define loom identification, set sequences, and controller network credentials
            </p>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
          <AlertCircle size={18} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Loom Attributes Card */}
        <div className="card-glass rounded-2xl p-5">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
            Loom Identification & Operating Status
          </h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Loom Number *</label>
              <input
                type="number"
                min="1"
                value={loomNumber}
                onChange={(e) => setLoomNumber(e.target.value)}
                placeholder="e.g. 101"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs ${fieldClass}`}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold">PIC Controller Number *</label>
              <input
                type="text"
                value={picNumber}
                onChange={(e) => setPicNumber(e.target.value)}
                placeholder="e.g. PIC-001"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs ${fieldClass}`}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs ${fieldClass}`}
              >
                <option value="STOPPED">Stopped</option>
                <option value="RUNNING">Running</option>
                <option value="WARNING">Warning</option>
                <option value="ALERT">Alert</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold">Number of Sets (1 – 24)</label>
              <input
                type="number"
                min="1"
                max="24"
                value={setCount}
                onChange={(e) => handleSetCountChange(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs ${fieldClass}`}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Set Configuration Table */}
        <SetConfiguration sets={sets} onChange={handleSetChange} />

        {/* Wi-Fi & Controller Network */}
        <WifiConfiguration
          wifi={wifi}
          onChange={handleWifiChange}
          onTestConnection={handleTestConnection}
          testing={testingWifi}
          connectionState={connectionState}
          onSave={() => showToast('Wi-Fi parameters updated in form.', 'info')}
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/settings?tab=looms')}
            disabled={isSubmitting}
            className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
              theme === 'light'
                ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-950 transition hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-75"
          >
            {isSubmitting && <LoaderCircle className="animate-spin" size={14} />}
            <span>{existingLoom ? 'Save Changes' : 'Register Loom'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
