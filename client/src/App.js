import React, { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState([]);
  const [selectedMode, setSelectedMode] = useState("vi_male");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const voiceMap = {
    vi_male: "NamMinh",
    vi_female: "HoaiMy",
    en_male: "Eric",
    en_female: "Jenny",
  };

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  const getVoiceByName = (name) => {
    return voices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
  };

  const handleSpeak = () => {
    if (!text.trim()) {
      alert("Vui lòng nhập văn bản.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voiceName = voiceMap[selectedMode];
    const voice = getVoiceByName(voiceName);

    if (voice) {
      utterance.voice = voice;
    } else {
      alert(`Không tìm thấy giọng "${voiceName}" trên thiết bị.`);
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleDownloadMP3 = async () => {
    if (!text.trim()) {
      alert("Vui lòng nhập văn bản để tải về.");
      return;
    }

    try {
      const lang = selectedMode.startsWith("vi") ? "vi" : "en";

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 200), lang }),
      });

      const data = await res.json();
      if (data.success) {
        const a = document.createElement("a");
        a.href = data.file;
        a.download = "speech.mp3";
        a.click();
      } else {
        throw new Error(data.error || "Không thể tạo file");
      }
    } catch (err) {
      alert("Tải file thất bại.");
      console.error(err);
    }
  };

  const translateText = async (targetLang) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      alert("Vui lòng nhập văn bản để dịch.");
      return;
    }

    setIsTranslating(true);

    const sourceLang = targetLang === "vi" ? "en" : "vi";

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(
        trimmedText
      )}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`API lỗi: ${response.status}`);

      const data = await response.json();
      const translatedText = data[0][0][0];
      setText(translatedText);
      setSelectedMode(targetLang === "vi" ? "vi_female" : "en_female");
    } catch (error) {
      alert("Dịch thất bại. Vui lòng thử lại sau.");
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ ghi âm.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = selectedMode.startsWith("en") ? "en-US" : "vi-VN";

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setText((prev) => prev + finalTranscript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Lỗi ghi âm:", event.error);
      alert("Lỗi khi ghi âm: " + event.error);
      setIsRecording(false);
      recognitionRef.current.stop();
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };
  }, [selectedMode]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.lang = selectedMode.startsWith("en") ? "en-US" : "vi-VN";
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        alert("Không thể bắt đầu ghi âm: " + error.message);
      }
    }
  };
  const handleCopyText = async () => {
  if (!text.trim()) {
    alert("Không có nội dung để sao chép.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    alert("Nội dung đã được sao chép!");
  } catch (err) {
    console.error("Lỗi khi sao chép:", err);
    alert("Sao chép thất bại. Trình duyệt có thể không hỗ trợ.");
  }
};

  return (
    <div className="container">
      <h1>🔊 Đọc Văn Bản + Dịch + Ghi âm + Tải về MP3</h1>

      <textarea
        placeholder="Nhập nội dung cần đọc hoặc dịch hoặc ghi âm..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
      />
      <div style={{ marginBottom: "20px" }}>
        <button onClick={handleCopyText}>
          📋 Sao chép nội dung
        </button>
      </div>


      <div className="translate-buttons">
        <button disabled={isTranslating} onClick={() => translateText("en")}>
          🌐 Dịch sang tiếng Anh
        </button>
        <button disabled={isTranslating} onClick={() => translateText("vi")}>
          🌐 Dịch sang tiếng Việt
        </button>
      </div>

      <div className="mode-selector">
        <h3>🎙️ Chọn giọng đọc:</h3>
        <div className="buttons">
          <button
            className={selectedMode === "vi_male" ? "active" : ""}
            onClick={() => setSelectedMode("vi_male")}
          >
            Con trai (Tiếng Việt)
          </button>
          <button
            className={selectedMode === "vi_female" ? "active" : ""}
            onClick={() => setSelectedMode("vi_female")}
          >
            Con gái (Tiếng Việt)
          </button>
          <button
            className={selectedMode === "en_male" ? "active" : ""}
            onClick={() => setSelectedMode("en_male")}
          >
            Boy (English)
          </button>
          <button
            className={selectedMode === "en_female" ? "active" : ""}
            onClick={() => setSelectedMode("en_female")}
          >
            Girl (English)
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={toggleRecording}
          style={{
            backgroundColor: isRecording ? "#dc3545" : "#007bff",
            color: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            minWidth: "120px",
          }}
        >
          {isRecording ? "⏹️ Dừng ghi âm" : "🎤 Bắt đầu ghi âm"}
        </button>
      </div>

      <button className="speak-btn" onClick={handleSpeak}>
        ▶️ Đọc ngay
      </button>
            <button className="speak-btn" onClick={handleDownloadMP3}>
      💾 Tải về MP3
      </button>

      {/* CSS */}
      <style>{`
        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          border: 1px solid #ccc;
          border-radius: 10px;
          background: #f9f9f9;
        }
        h1 {
          text-align: center;
          margin-bottom: 20px;
        }
        textarea {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          border-radius: 6px;
          border: 1px solid #ccc;
          resize: vertical;
          box-sizing: border-box;
          margin-bottom: 20px;
        }
        .translate-buttons,
        .mode-selector .buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        button {
          flex: 1 1 auto;
          padding: 10px 14px;
          font-size: 16px;
          cursor: pointer;
          border: 2px solid #007bff;
          background-color: white;
          color: #007bff;
          border-radius: 6px;
          transition: background-color 0.3s ease, color 0.3s ease;
          min-width: 120px;
          text-align: center;
        }
        button:hover:not(:disabled) {
          background-color: #007bff;
          color: white;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .active {
          background-color: #007bff;
          color: white;
          border-color: #0056b3;
        }
        .speak-btn {
          width: 100%;
          padding: 14px 0;
          font-size: 18px;
          font-weight: bold;
          border-radius: 8px;
          border: none;
          background-color: #28a745;
          color: white;
          transition: background-color 0.3s ease;
        }
        .speak-btn:hover {
          background-color: #218838;
        }
        .mode-selector .buttons {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }

        .mode-selector .buttons button {
          min-width: unset;
        }
      `}</style>
    </div>
  );
}

export default App;