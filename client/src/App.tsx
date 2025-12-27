import React, { useState, useEffect, useRef } from "react";
import "./styles/index.css";

interface ProductInput {
  id: string;
  name: string;
  url: string;
}

interface Message {
  sender: string;
  content: string;
  type: string;
}

const API_URL = "http://localhost:3005/api";

function App() {
  const [products, setProducts] = useState<ProductInput[]>([
    { id: "1", name: "iphone 15", url: "" },
    { id: "2", name: "samsung s24", url: "" }, // Start with 2 slots
  ]);
  const [analyzing, setAnalyzing] = useState(false);
  const [debating, setDebating] = useState(false);
  const [debateId, setDebateId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [round, setRound] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- TTS State ---
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const lastMsgCount = useRef(0);

  // --- TTS Logic ---
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (!audioEnabled || messages.length === 0) return;

    // Only speak new messages
    if (messages.length > lastMsgCount.current) {
      const newMsg = messages[messages.length - 1];
      speak(newMsg);
      lastMsgCount.current = messages.length;
    }
  }, [messages, audioEnabled]);

  const speak = (msg: Message) => {
    window.speechSynthesis.cancel();
    setSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(msg.content);
    const voices = window.speechSynthesis.getVoices();

    // Voice Strategy
    let voice = voices.find((v) => v.lang.includes("en"));

    if (msg.sender === "Moderator") {
      voice = voices.find((v) => v.name.includes("Google US English")) || voice;
      utterance.pitch = 1.0;
      utterance.rate = 1.1;
    } else {
      const hash = msg.sender
        .split("")
        .reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const available = voices.filter(
        (v) => v.lang.includes("en") && !v.name.includes("Google US English")
      );
      if (available.length > 0) {
        voice = available[hash % available.length];
      }
      utterance.pitch = 1.0 + (hash % 5) / 10;
      utterance.rate = 1.2;
    }

    if (voice) utterance.voice = voice;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleAudio = () => {
    if (audioEnabled) {
      window.speechSynthesis.cancel();
      setAudioEnabled(false);
      setSpeaking(false);
    } else {
      setAudioEnabled(true);
      if (messages.length > 0) {
        speak(messages[messages.length - 1]);
      }
    }
  };

  const addProduct = () => {
    setProducts([
      ...products,
      { id: Date.now().toString(), name: "", url: "" },
    ]);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const updateProduct = (id: string, field: "name" | "url", value: string) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const startDebate = async () => {
    const validProducts = products.filter((p) => p.name.trim() !== "");
    if (validProducts.length < 2) {
      alert("Please enter at least 2 products.");
      return;
    }

    setAnalyzing(true);
    setMessages([]); // Clear previous
    setAudioEnabled(true); // Auto-enable audio on start for better UX

    try {
      // 1. Analyze
      const analyzeRes = await fetch(`${API_URL}/products/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: validProducts }),
      });
      const analyzedData = await analyzeRes.json();

      if (
        analyzedData.error ||
        (analyzedData.length && analyzedData[0].error)
      ) {
        throw new Error("Analysis failed: " + JSON.stringify(analyzedData));
      }

      // 2. Start Debate (Round 1)
      setDebating(true);
      setAnalyzing(false);

      const startRes = await fetch(`${API_URL}/debate/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: analyzedData }),
      });
      const startData = await startRes.json();

      setDebateId(startData.debateId);
      setMessages(startData.messages);
      lastMsgCount.current = startData.messages.length;
      // Manually trigger first speech since useEffect dependent on length change won't catch init
      if (startData.messages.length > 0) speak(startData.messages[0]);

      setRound(startData.round);
    } catch (e) {
      console.error(e);
      setAnalyzing(false);
      setDebating(false);
      alert("Failed to start debate. Check backend.");
    }
  };

  // Auto-advance rounds
  useEffect(() => {
    if (!debateId || round >= 99) return;

    const advance = async () => {
      // Small delay for readability
      await new Promise((r) => setTimeout(r, 4000));

      try {
        const res = await fetch(`${API_URL}/debate/next`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ debateId }),
        });
        const data = await res.json();

        setMessages((prev) => [...prev, ...data.messages]);
        setRound(data.round);
      } catch (e) {
        console.error("Round failed", e);
      }
    };

    advance();
  }, [round, debateId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <span>⚖️</span> AI Product Debate
        </div>

        <div className="product-form">
          {products.map((p, idx) => (
            <div key={p.id} className="input-group">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label>Product {idx + 1}</label>
                {products.length > 2 && (
                  <button
                    className="btn-remove"
                    onClick={() => removeProduct(p.id)}
                  >
                    X
                  </button>
                )}
              </div>
              <input
                placeholder="Name (e.g. iPhone 15)"
                value={p.name}
                onChange={(e) => updateProduct(p.id, "name", e.target.value)}
                disabled={debating || analyzing}
              />
              <input
                placeholder="URL (Optional)"
                value={p.url}
                onChange={(e) => updateProduct(p.id, "url", e.target.value)}
                disabled={debating || analyzing}
              />
            </div>
          ))}

          <button
            className="btn-add"
            onClick={addProduct}
            disabled={debating || analyzing}
          >
            + Add Competitor
          </button>
        </div>

        <div
          style={{
            marginTop: "1rem",
            padding: "0.5rem",
            background: "#2b2c2f",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.9rem" }}>🔊 Audio Debate</span>
          <button
            onClick={toggleAudio}
            style={{
              background: audioEnabled ? "#10a37f" : "#555",
              border: "none",
              color: "#fff",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            {audioEnabled ? (speaking ? "🗣️ Speaking" : "ON") : "OFF"}
          </button>
        </div>

        <button
          className="btn-primary"
          onClick={startDebate}
          disabled={
            debating || analyzing || products.filter((p) => p.name).length < 2
          }
        >
          {analyzing
            ? "Analyzing Data..."
            : debating
            ? "Debate in Progress..."
            : "Start Debate"}
        </button>
      </aside>

      <main className="chat-area">
        <div className="messages-list">
          {messages.length === 0 && !analyzing && (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "#555",
                marginTop: "20vh",
              }}
            >
              <h2>Welcome to the Arena</h2>
              <p>Add products on the left to start a debate.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`message-row ${
                msg.sender === "Moderator" ? "moderator" : ""
              }`}
            >
              <div
                className="avatar"
                style={{
                  backgroundColor:
                    msg.sender === "Moderator"
                      ? "#ffd700"
                      : getRandomColor(msg.sender),
                }}
              >
                {msg.sender === "Moderator" ? "⚖️" : msg.sender[0]}
              </div>
              <div className="msg-content">
                <div className="msg-sender">
                  {msg.sender}{" "}
                  <span style={{ opacity: 0.5, fontSize: "0.8em" }}>
                    • {msg.type.toUpperCase()}
                  </span>
                  {audioEnabled && i === messages.length - 1 && speaking && (
                    <span style={{ marginLeft: "10px" }}>🔊</span>
                  )}
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {(analyzing || (debating && round < 99)) && (
          <div className="status-bar">
            <div className="round-indicator">
              {analyzing ? "Gathering Intelligence" : `Round ${round} of 5`}
              <span className="loading-dots"></span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper for consistent avatar colors
function getRandomColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

export default App;
