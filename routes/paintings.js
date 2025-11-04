const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { Painting } = require('../config');

// ✅ Helper: Convert image to Base64
function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ✅ ADD PAINTING WITH IMAGE
router.post('/add', async (req, res) => {
  try {
    console.log('📥 Received painting data');
    
    const { name, artist, description, image, imageType } = req.body;

    if (!name || !artist || !description) {
      return res.status(400).json({ error: 'Name, artist, description required' });
    }

    // Generate QR code
    const qrCode = await QRCode.toDataURL(name);

    const painting = new Painting({
      name,
      artist,
      description,
      qrCode,
      image: image || null,      // Base64 encoded image
      imageType: imageType || null
    });

    await painting.save();
    console.log('✅ Painting saved with image');
    
    res.json({ success: true, painting, message: 'Painting added successfully' });
  } catch (err) {
    console.error('❌ Error adding painting:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET ALL PAINTINGS (for caching)
router.get('/all', async (req, res) => {
  try {
    console.log('📤 Fetching all paintings...');
    
    const paintings = await Painting.find().select(
      'name artist description qrCode image imageType scans'
    );
    console.log(`✅ Found ${paintings.length} paintings`);
    
    res.json({ data: paintings, count: paintings.length });
  } catch (err) {
    console.error('❌ Error fetching paintings:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ SEARCH PAINTING BY NAME
router.get('/search', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Name parameter required' });
    }
    
    console.log('🔍 Searching for painting:', name);
    
    const painting = await Painting.findOne({
      name: { $regex: name, $options: 'i' }
    }).select('name artist description qrCode image imageType scans');
    
    if (painting) {
      console.log('✅ Found:', painting.name);
      res.json(painting);
    } else {
      console.log('❌ Painting not found:', name);
      res.status(404).json({ error: 'Painting not found' });
    }
  } catch (err) {
    console.error('❌ Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET SINGLE PAINTING BY ID
router.get('/:id', async (req, res) => {
  try {
    console.log('📋 Getting painting:', req.params.id);
    
    const painting = await Painting.findById(req.params.id).select(
      'name artist description qrCode image imageType scans'
    );
    if (!painting) {
      return res.status(404).json({ error: 'Painting not found' });
    }
    res.json(painting);
  } catch (err) {
    console.error('❌ Error getting painting:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ EDIT PAINTING
router.put('/edit/:id', async (req, res) => {
  try {
    console.log('✏️ Editing painting:', req.params.id);
    
    const { name, artist, description, image, imageType } = req.body;

    if (!name || !artist || !description) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const qrCode = await QRCode.toDataURL(name);

    const painting = await Painting.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        artist, 
        description, 
        qrCode,
        image: image || undefined,  // Update image if provided
        imageType: imageType || undefined
      },
      { new: true }
    );

    if (!painting) {
      return res.status(404).json({ error: 'Painting not found' });
    }

    console.log('✅ Painting updated');
    res.json({ success: true, painting, message: 'Painting updated successfully' });
  } catch (err) {
    console.error('❌ Error editing painting:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE PAINTING
router.delete('/delete/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting painting:', req.params.id);
    
    const painting = await Painting.findByIdAndDelete(req.params.id);
    
    if (!painting) {
      return res.status(404).json({ error: 'Painting not found' });
    }

    console.log('✅ Painting deleted');
    res.json({ success: true, message: 'Painting deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting painting:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ LOG SCAN
router.post('/:id/scan', async (req, res) => {
  try {
    console.log('📊 Logging scan for painting:', req.params.id);
    
    const painting = await Painting.findById(req.params.id);
    
    if (!painting) {
      return res.status(404).json({ error: 'Painting not found' });
    }

    painting.scans = (painting.scans || 0) + 1;
    painting.lastScannedAt = new Date();
    
    await painting.save();
    
    console.log('✅ Scan logged. Total scans:', painting.scans);
    res.json({ success: true, scans: painting.scans });
  } catch (err) {
    console.error('❌ Error logging scan:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
