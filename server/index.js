const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const tts = require('google-tts-api');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Tạo thư mục chứa file âm thanh nếu chưa tồn tại
const audioDir = path.join(__dirname, 'audios');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
}

// API TTS: Nhận văn bản và tạo file MP3
app.post('/api/tts', async (req, res) => {
  const { text, lang } = req.body;

  if (!text || !lang) {
    return res.status(400).json({ error: 'Thiếu text hoặc lang' });
  }

  try {
    const url = await tts.getAudioUrl(text, {
      lang,
      slow: false,
      host: 'https://translate.google.com',
    });

    const fileName = `audio_${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(filePath, Buffer.from(response.data));

    res.json({ success: true, file: `/audios/${fileName}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tạo file âm thanh' });
  }
});

// Phục vụ file âm thanh tĩnh
app.use('/audios', express.static(audioDir));

// Phục vụ React build nếu có
const clientBuildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  // React fallback cho tất cả route khác
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại: http://localhost:${PORT}`);
});
