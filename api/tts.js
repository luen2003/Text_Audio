import tts from 'google-tts-api';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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

    // Trả URL mp3 trực tiếp cho frontend
    res.status(200).json({ success: true, file: url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi tạo file âm thanh' });
  }
}
