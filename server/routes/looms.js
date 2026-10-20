import express from 'express';
import net from 'net';
import { all, get, run } from '../db.js';

const router = express.Router();

// Helper to format loom record from DB tables into frontend format
async function formatLoom(loom) {
  if (!loom) return null;
  const sets = await all(`SELECT set_number as setNumber, takeup, meter FROM loom_sets WHERE loom_id = ? ORDER BY set_number ASC`, [loom.id]);
  const wifiRow = await get(`SELECT ssid, password, ip_address as ipAddress, port, connected FROM loom_wifi WHERE loom_id = ?`, [loom.id]);
  const historyRows = await all(`SELECT time, action, actor FROM loom_history WHERE loom_id = ? ORDER BY id DESC LIMIT 10`, [loom.id]);
  const chartRows = await all(`SELECT time, meters FROM loom_chart_data WHERE loom_id = ? ORDER BY id ASC`, [loom.id]);

  return {
    id: loom.id,
    loomNumber: Number(loom.loom_number),
    picNumber: loom.pic_number,
    status: loom.status,
    currentSet: Number(loom.current_set),
    currentMeter: Number(loom.current_meter),
    totalMeterRun: Number(loom.total_meter_run),
    totalMeterLeft: Number(loom.total_meter_left),
    totalMeterCapacity: Number(loom.total_meter_capacity),
    sets: sets.map((s) => ({ setNumber: Number(s.setNumber), takeup: Number(s.takeup), meter: Number(s.meter) })),
    wifi: wifiRow
      ? {
          ssid: wifiRow.ssid,
          hasPassword: Boolean(wifiRow.password),
          ipAddress: wifiRow.ipAddress,
          port: Number(wifiRow.port),
          connected: Boolean(wifiRow.connected),
        }
      : null,
    history: historyRows,
    chartData: chartRows.map((c) => ({ time: c.time, meters: Number(c.meters) })),
  };
}

// GET /api/looms - Get all looms
router.get('/', async (req, res) => {
  try {
    const looms = await all(`SELECT * FROM looms ORDER BY loom_number ASC`);
    const formatted = await Promise.all(looms.map((l) => formatLoom(l)));
    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching looms:', error);
    return res.status(500).json({ error: 'Failed to fetch looms' });
  }
});

// GET /api/looms/:id - Get single loom
router.get('/:id', async (req, res) => {
  try {
    const loom = await get(`SELECT * FROM looms WHERE id = ?`, [req.params.id]);
    if (!loom) {
      return res.status(404).json({ error: 'Loom not found' });
    }
    const formatted = await formatLoom(loom);
    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch loom details' });
  }
});

// POST /api/looms - Create a new loom
router.post('/', async (req, res) => {
  try {
    const { id, loomNumber, picNumber, status, sets, wifi } = req.body;
    if (!loomNumber || !picNumber) {
      return res.status(400).json({ error: 'Loom number and PIC number are required' });
    }

    const duplicate = await get(`SELECT id FROM looms WHERE loom_number = ?`, [Number(loomNumber)]);
    if (duplicate) {
      return res.status(400).json({ error: `Loom Number ${loomNumber} already exists. Please choose a unique number.` });
    }

    const loomId = id || `loom-${Date.now()}`;
    const initialStatus = status || 'STOPPED';

    await run(
      `INSERT INTO looms (id, loom_number, pic_number, status, current_set, current_meter, total_meter_run, total_meter_left, total_meter_capacity)
       VALUES (?, ?, ?, ?, 1, 0, 0, 11000, 11000)`,
      [loomId, Number(loomNumber), picNumber, initialStatus]
    );

    if (Array.isArray(sets)) {
      for (let i = 0; i < sets.length; i++) {
        const s = sets[i];
        await run(
          `INSERT INTO loom_sets (loom_id, set_number, takeup, meter) VALUES (?, ?, ?, ?)`,
          [loomId, i + 1, Number(s.takeup) || i + 1, Number(s.meter) || i + 1]
        );
      }
    }

    if (wifi) {
      await run(
        `INSERT INTO loom_wifi (loom_id, ssid, password, ip_address, port, connected) VALUES (?, ?, ?, ?, ?, ?)`,
        [loomId, wifi.ssid || '', wifi.password || '', wifi.ipAddress || '', Number(wifi.port) || 8080, wifi.connected ? 1 : 0]
      );
    }

    // Add initial history
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await run(
      `INSERT INTO loom_history (loom_id, time, action, actor) VALUES (?, ?, ?, ?)`,
      [loomId, timeLabel, 'CREATED', 'Admin']
    );

    // Add initial chart point
    await run(
      `INSERT INTO loom_chart_data (loom_id, time, meters) VALUES (?, ?, ?)`,
      [loomId, '09:00', 0]
    );

    const createdLoom = await get(`SELECT * FROM looms WHERE id = ?`, [loomId]);
    const formatted = await formatLoom(createdLoom);
    return res.status(201).json(formatted);
  } catch (error) {
    console.error('Error creating loom:', error);
    return res.status(500).json({ error: 'Failed to create loom' });
  }
});

// PUT /api/looms/:id - Update loom configuration
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { loomNumber, picNumber, status, sets, wifi } = req.body;

    const existing = await get(`SELECT * FROM looms WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Loom not found' });
    }

    if (loomNumber && Number(loomNumber) !== existing.loom_number) {
      const duplicate = await get(`SELECT id FROM looms WHERE loom_number = ? AND id != ?`, [Number(loomNumber), id]);
      if (duplicate) {
        return res.status(400).json({ error: `Loom Number ${loomNumber} is already in use by another loom.` });
      }
    }

    await run(
      `UPDATE looms SET loom_number = ?, pic_number = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [Number(loomNumber) || existing.loom_number, picNumber || existing.pic_number, status || existing.status, id]
    );

    if (Array.isArray(sets)) {
      await run(`DELETE FROM loom_sets WHERE loom_id = ?`, [id]);
      for (let i = 0; i < sets.length; i++) {
        const s = sets[i];
        await run(
          `INSERT INTO loom_sets (loom_id, set_number, takeup, meter) VALUES (?, ?, ?, ?)`,
          [id, i + 1, Number(s.takeup) || i + 1, Number(s.meter) || i + 1]
        );
      }
    }

    if (wifi) {
      const existingWifi = await get(`SELECT password FROM loom_wifi WHERE loom_id = ?`, [id]);
      const nextPassword = (wifi.password && wifi.password.trim() !== '') ? wifi.password : (existingWifi?.password || '');
      await run(`DELETE FROM loom_wifi WHERE loom_id = ?`, [id]);
      await run(
        `INSERT INTO loom_wifi (loom_id, ssid, password, ip_address, port, connected) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, wifi.ssid || '', nextPassword, wifi.ipAddress || '', Number(wifi.port) || 8080, wifi.connected ? 1 : 0]
      );
    }

    const updated = await get(`SELECT * FROM looms WHERE id = ?`, [id]);
    const formatted = await formatLoom(updated);
    return res.json(formatted);
  } catch (error) {
    console.error('Error updating loom:', error);
    return res.status(500).json({ error: 'Failed to update loom' });
  }
});

// DELETE /api/looms/:id - Delete loom
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await get(`SELECT * FROM looms WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Loom not found' });
    }

    await run(`DELETE FROM loom_sets WHERE loom_id = ?`, [id]);
    await run(`DELETE FROM loom_wifi WHERE loom_id = ?`, [id]);
    await run(`DELETE FROM loom_history WHERE loom_id = ?`, [id]);
    await run(`DELETE FROM loom_chart_data WHERE loom_id = ?`, [id]);
    await run(`DELETE FROM looms WHERE id = ?`, [id]);

    return res.json({ message: `Loom ${id} deleted successfully` });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete loom' });
  }
});

// POST /api/looms/:id/action - Execute loom action (START, STOP, REVERSE, SINGLE TAKE)
router.post('/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const loom = await get(`SELECT * FROM looms WHERE id = ?`, [id]);
    if (!loom) {
      return res.status(404).json({ error: 'Loom not found' });
    }

    let nextStatus = loom.status;
    let nextCurrentMeter = loom.current_meter;
    let nextTotalRun = loom.total_meter_run;
    let nextTotalLeft = loom.total_meter_left;

    if (action === 'START') nextStatus = 'RUNNING';
    if (action === 'STOP') nextStatus = 'STOPPED';
    if (action === 'REVERSE') nextStatus = 'WARNING';
    if (action === 'SINGLE TAKE') {
      nextStatus = 'RUNNING';
      nextCurrentMeter += 22;
      nextTotalRun += 22;
      nextTotalLeft = Math.max(0, nextTotalLeft - 22);
    }

    await run(
      `UPDATE looms SET status = ?, current_meter = ?, total_meter_run = ?, total_meter_left = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [nextStatus, nextCurrentMeter, nextTotalRun, nextTotalLeft, id]
    );

    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await run(
      `INSERT INTO loom_history (loom_id, time, action, actor) VALUES (?, ?, ?, ?)`,
      [id, timeLabel, action, 'Admin']
    );

    const updated = await get(`SELECT * FROM looms WHERE id = ?`, [id]);
    const formatted = await formatLoom(updated);
    return res.json(formatted);
  } catch (error) {
    console.error('Action error:', error);
    return res.status(500).json({ error: 'Failed to execute action' });
  }
});

// POST /api/looms/wifi/test - Probe physical controller connection
router.post('/wifi/test', (req, res) => {
  const { ssid, ipAddress, port } = req.body;
  if (!ssid || !ipAddress || !port) {
    return res.json({ connected: false, message: 'Invalid Wi-Fi credentials or missing parameters.' });
  }

  const socket = new net.Socket();
  const targetPort = Number(port) || 8080;
  let responded = false;

  socket.setTimeout(1200);

  socket.on('connect', () => {
    if (!responded) {
      responded = true;
      socket.destroy();
      return res.json({ connected: true, message: `Connected to physical controller at ${ipAddress}:${targetPort}.` });
    }
  });

  socket.on('timeout', () => {
    if (!responded) {
      responded = true;
      socket.destroy();
      return res.json({
        connected: false,
        message: `Hardware controller unreachable: Timed out connecting to ${ipAddress}:${targetPort}. Physical controller is offline or not linked.`,
      });
    }
  });

  socket.on('error', (err) => {
    if (!responded) {
      responded = true;
      socket.destroy();
      return res.json({
        connected: false,
        message: `Hardware status unavailable: Cannot reach controller at ${ipAddress}:${targetPort} (${err.code || 'Unreachable'}). Physical hardware is not connected.`,
      });
    }
  });

  try {
    socket.connect(targetPort, ipAddress);
  } catch (err) {
    if (!responded) {
      responded = true;
      return res.json({
        connected: false,
        message: `Hardware connection failed: ${err.message}. Controller not connected.`,
      });
    }
  }
});

// POST /api/looms/telemetry/tick - Telemetry tick for active looms
router.post('/telemetry/tick', async (req, res) => {
  try {
    const looms = await all(`SELECT * FROM looms WHERE status = 'RUNNING'`);
    for (const loom of looms) {
      const nextRun = loom.total_meter_run + 1;
      const nextLeft = Math.max(0, loom.total_meter_left - 1);
      const nextCurrentMeter = loom.current_meter + 1;

      await run(
        `UPDATE looms SET current_meter = ?, total_meter_run = ?, total_meter_left = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [nextCurrentMeter, nextRun, nextLeft, loom.id]
      );
    }

    const updatedLooms = await all(`SELECT * FROM looms ORDER BY loom_number ASC`);
    const formatted = await Promise.all(updatedLooms.map((l) => formatLoom(l)));
    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Telemetry update failed' });
  }
});

export default router;
