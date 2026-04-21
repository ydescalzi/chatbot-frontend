import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Chat.css";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [suggestions, setSuggestions] = useState([
    "Retiro de ciclo",
    "Retiro de asignatura",
    "Reserva de matrícula",
    "Reactualización de matrícula",
    "Encuesta docentes",
  ]);

  const [messages, setMessages] = useState([
    {
      text: "👋 Hola, soy Bot San Martino 🤖. ¿En qué trámite te ayudo?",
      sender: "bot",
    },
  ]);

  // 🔥 Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (textCustom = null) => {
    const text = textCustom || message;

    if (!text.trim() || loading) return;

    // Mensaje usuario
    setMessages((prev) => [...prev, { text, sender: "user" }]);
    setLoading(true);

    try {
      const res = await axios.post(
        "https://chatbot-production-b969.up.railway.app/chat",
        {
          question: text,
          session_id: "user1",
        }
      );

      // Respuesta bot
      setMessages((prev) => [
        ...prev,
        {
          text: res.data.response,
          sender: "bot",
          image: res.data.image || null,
        },
      ]);

      // Botones dinámicos
      setSuggestions(res.data.options || []);

    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          text: "❌ Error de conexión con el servidor",
          sender: "bot",
        },
      ]);
    }

    setLoading(false);
    setMessage("");
  };

  return (
    <div className="chat-container">
      {/* HEADER */}
      <div className="chat-header">🎓 Bot San Martino</div>

      {/* BODY */}
      <div className="chat-body">
        {messages.map((m, i) => (
          <div key={i} className={`message-row ${m.sender}`}>
            <div className={`message ${m.sender}`}>
              {m.text}

              {/* 🔥 Imagen dinámica */}
              {m.image && (
                <div className="image-wrapper">
                  <img
                    src={m.image}
                    alt="Paso"
                    className="chat-image"
                    onLoad={() =>
                      chatEndRef.current?.scrollIntoView({
                        behavior: "smooth",
                      })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* LOADING */}
        {loading && (
          <div className="message-row bot">
            <div className="message bot">🤖 Escribiendo...</div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* SUGERENCIAS */}
      <div className="suggestions">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => sendMessage(s)}
            className="suggestion-btn"
            disabled={loading}
          >
            {s}
          </button>
        ))}
      </div>

      {/* FOOTER */}
      <div className="chat-footer">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Escribe tu consulta..."
          disabled={loading}
        />
        <button onClick={() => sendMessage()} disabled={loading}>
          Enviar
        </button>
      </div>
    </div>
  );
}