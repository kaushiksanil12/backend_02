const express = require('express');
const router = express.Router();
const { Scan, Painting } = require('../config');

// ✅ TRACK SCAN
router.post('/track-scan', async (req, res) => {
  try {
    console.log('📊 Tracking scan:', req.body);
    
    const { paintingId, scanType, viewingTime } = req.body;

    if (!paintingId || !scanType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const scan = new Scan({
      paintingId,
      scanType,
      viewingTime: viewingTime || 0
    });

    await scan.save();
    console.log('✅ Scan tracked');
    
    res.json({ success: true, message: 'Scan tracked successfully' });
  } catch (err) {
    console.error('❌ Error tracking scan:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET ANALYTICS
router.get('/stats', async (req, res) => {
  try {
    console.log('📈 Fetching analytics...');
    
    const paintings = await Painting.find();
    const scans = await Scan.find();

    console.log(`Found ${paintings.length} paintings and ${scans.length} scans`);

    // Calculate stats per painting
    const stats = paintings.map(painting => {
      const paintingScans = scans.filter(s => s.paintingId === painting.name);
      const qrScans = paintingScans.filter(s => s.scanType === 'qr').length;
      const imageScans = paintingScans.filter(s => s.scanType === 'image').length;
      const avgViewingTime = paintingScans.length > 0 
        ? paintingScans.reduce((sum, s) => sum + (s.viewingTime || 0), 0) / paintingScans.length 
        : 0;

      return {
        name: painting.name,
        artist: painting.artist,
        totalScans: paintingScans.length,
        qrScans,
        imageScans,
        avgViewingTime: Math.round(avgViewingTime)
      };
    });

    // Calculate traffic trends (by hour)
    const now = new Date();
    const trafficByHour = {};

    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.toLocaleString('en-US', { hour: '2-digit', hour12: true });
      
      const hourScans = scans.filter(s => {
        const scanHour = new Date(s.timestamp);
        return scanHour.getHours() === hour.getHours() && 
               scanHour.toDateString() === hour.toDateString();
      }).length;

      trafficByHour[hourKey] = hourScans;
    }

    console.log('✅ Analytics calculated');
    
    res.json({ 
      stats, 
      trafficByHour, 
      totalScans: scans.length,
      totalPaintings: paintings.length
    });
  } catch (err) {
    console.error('❌ Error fetching analytics:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
