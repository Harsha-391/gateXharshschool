import { readDb, writeDb } from '../utils/db.js';

export const getAttendanceSettings = (req, res) => {
  try {
    const db = readDb();
    const settings = db.attendanceSettings || [];
    if (settings.length === 0) {
      return res.status(404).json({ error: 'Attendance settings not found.' });
    }
    res.json(settings[0]);
  } catch (err) {
    console.error('Error fetching attendance settings:', err);
    res.status(500).json({ error: 'Failed to load attendance settings.' });
  }
};

export const updateAttendanceSettings = (req, res) => {
  try {
    const { checkInStart, lateTime, halfDayTime, checkOutTime, minWorkingHours, gracePeriod } = req.body;
    const db = readDb();
    
    if (!db.attendanceSettings || db.attendanceSettings.length === 0) {
      return res.status(404).json({ error: 'Attendance settings record not found to update.' });
    }
    
    const settings = db.attendanceSettings[0];
    settings.checkInStart = checkInStart || settings.checkInStart;
    settings.lateTime = lateTime || settings.lateTime;
    settings.halfDayTime = halfDayTime || settings.halfDayTime;
    settings.checkOutTime = checkOutTime || settings.checkOutTime;
    settings.minWorkingHours = minWorkingHours !== undefined ? Number(minWorkingHours) : settings.minWorkingHours;
    settings.gracePeriod = gracePeriod !== undefined ? Number(gracePeriod) : settings.gracePeriod;
    settings.updatedAt = new Date().toISOString();
    
    writeDb(db);
    res.json(settings);
  } catch (err) {
    console.error('Error updating attendance settings:', err);
    res.status(500).json({ error: 'Failed to update attendance settings.' });
  }
};
