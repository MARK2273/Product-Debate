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
  const [speakingId, setSpeakingId] = useState<number | null>(null); // Index of message being spoken
  const lastMsgCount = useRef(0);
  const [speaking, setSpeaking] = useState(false);

  /* New Error State */
  const [error, setError] = useState<string | null>(null);

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
      // Speak all new messages in sequence
      for (let i = lastMsgCount.current; i < messages.length; i++) {
        speak(messages[i], i);
      }
      lastMsgCount.current = messages.length;
    }
  }, [messages, audioEnabled]);

  const speak = (msg: Message, index: number) => {
    // REMOVED: window.speechSynthesis.cancel();  <-- This allows queuing!

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

    utterance.onstart = () => setSpeakingId(index);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

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
        // Speak from last message or all? Let's just speak the very last one to resume context
        speak(messages[messages.length - 1], messages.length - 1);
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
    setError(null); // Clear previous errors
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
      // Manually trigger first speech
      if (startData.messages.length > 0) {
        startData.messages.forEach((m: Message, i: number) => speak(m, i));
      }

      setRound(startData.round);
    } catch (e: any) {
      console.error(e);
      setAnalyzing(false);
      setDebating(false);
      setError(
        e.message || "An unexpected error occurred. Please check the backend."
      );
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
      } catch (e: any) {
        console.error("Round failed", e);
        // Don't fully crash, just stop debating
        setDebating(false);
        // Optional: add error message if critical, or just let user restart
        // setError("Connection lost. Round could not complete.");
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
          <span>⚡</span> DEBATE ARENA
        </div>

        <div className="product-form">
          <div className="form-title">Contenders</div>
          {products.map((p, idx) => (
            <div key={p.id} className="input-group">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label>FIGHTER {idx + 1}</label>
                {products.length > 2 && (
                  <button
                    className="btn-remove"
                    onClick={() => removeProduct(p.id)}
                    title="Remove Fighter"
                  >
                    ×
                  </button>
                )}
              </div>
              <input
                placeholder="Product Name (e.g. RTX 4090)"
                value={p.name}
                onChange={(e) => updateProduct(p.id, "name", e.target.value)}
                disabled={debating || analyzing}
              />
              <input
                placeholder="Reference URL (Optional)"
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
            + ADD CONTENDER
          </button>
        </div>

        <div className="audio-controls">
          <span
            style={{ fontSize: "0.9rem", fontWeight: 600, color: "#a0a0b0" }}
          >
            AUDIO COMMENTARY
          </span>
          <button
            onClick={toggleAudio}
            style={{
              background: audioEnabled
                ? "var(--gradient-primary)"
                : "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s",
            }}
          >
            {audioEnabled ? (speaking ? "🔊 LIVE" : "ON") : "MUTED"}
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
            ? "INITIALIZING..."
            : debating
            ? "DEBATE IN PROGRESS"
            : "START SHOWDOWN"}
        </button>
      </aside>

      <main className="chat-area">
        <div className="messages-list">
          {error && (
            <div className="welcome-msg" style={{ marginTop: "10vh" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚠️</div>
              <h2
                style={{
                  color: "#ff4d4f",
                  background: "none",
                  WebkitTextFillColor: "initial",
                }}
              >
                System Failure
              </h2>
              <p
                style={{
                  color: "#ff4d4f",
                  maxWidth: "400px",
                  margin: "0 auto",
                  background: "rgba(255,0,0,0.1)",
                  padding: "1rem",
                  borderRadius: "8px",
                }}
              >
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                style={{
                  marginTop: "2rem",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid #555",
                  color: "#fff",
                  padding: "0.5rem 1.5rem",
                  borderRadius: "20px",
                }}
              >
                Dismiss & Retry
              </button>
            </div>
          )}

          {!error && messages.length === 0 && !analyzing && (
            <div className="welcome-msg">
              <h2>READY TO FIGHT?</h2>
              <p style={{ color: "#a0a0b0" }}>
                Configure your contenders on the left and start the showdown.
              </p>
            </div>
          )}

          {!error &&
            messages.map((msg, i) => {
              const isLast = i === messages.length - 1;
              const accentColor = getSenderColor(msg.sender);

              return (
                <div
                  key={i}
                  className={`message-row ${
                    msg.sender === "Moderator" ? "moderator" : ""
                  } ${isLast ? "active" : "history"}`}
                  style={{
                    // Pass dynamic color to CSS variable
                    ["--accent-color" as any]: accentColor,
                  }}
                >
                  <div
                    className={`avatar ${speakingId === i ? "speaking" : ""}`}
                  >
                    {msg.sender === "Moderator" ? "⚖️" : msg.sender[0]}
                  </div>
                  <div className="msg-content">
                    <div
                      className="msg-sender"
                      style={{
                        color:
                          msg.sender !== "Moderator" ? accentColor : undefined,
                      }}
                    >
                      {msg.sender}
                      {msg.type !== "statement" && (
                        <span
                          style={{
                            opacity: 0.6,
                            fontSize: "0.85em",
                            fontWeight: 400,
                            color: "var(--text-secondary)",
                          }}
                        >
                          • {msg.type.toUpperCase()}
                        </span>
                      )}
                      {audioEnabled && speakingId === i && (
                        <span
                          style={{ marginLeft: "10px", color: accentColor }}
                        >
                          🔊
                        </span>
                      )}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                  </div>
                </div>
              );
            })}
          {/* Scroll anchor with padding to clear status bar */}
          <div ref={scrollRef} style={{ height: "100px" }} />
        </div>

        {(analyzing || (debating && round < 99)) && (
          <div className="status-bar">
            <div className="round-indicator">
              {analyzing ? (
                <>
                  <span>GATHERING INTEL</span>
                  <span className="loading-dots"></span>
                </>
              ) : (
                <>
                  <span style={{ color: "#f5576c" }}>● LIVE</span>
                  <span>ROUND {round} / 5</span>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Consistent Color Helper
const getSenderColor = (sender: string) => {
  if (sender === "Moderator") return "#ffd700";
  const colors = [
    "#667eea",
    "#f5576c",
    "#00f260",
    "#e100ff",
    "#00c6ff",
    "#f093fb",
  ];
  let hash = 0;
  for (let i = 0; i < sender.length; i++) {
    hash = sender.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default App;
