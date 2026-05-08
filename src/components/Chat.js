import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  Send, 
  Bot, 
  User, 
  GraduationCap, 
  AlertCircle,
  BookOpen,
  Calendar,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  ArrowRight,
  Sparkles,
  X 
} from "lucide-react";
import "./Chat.css";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null); 
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      text: "👋 Hola, soy **Bot San Martino** 🤖\n\nEstoy aquí para ayudarte con tus trámites académicos. \n\n**Indícame quién eres:**",
      sender: "bot",
      type: "welcome",
      options: ["Estudiante", "Docente", "Persona externa"]
    },
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const detectMessageType = (text, options) => {
    if (!text) return "default";
    const textStr = String(text).toLowerCase();
    if (options && options.length > 0) {
      const tramites = ["retiro", "reserva", "foto", "inasistencia", "reactualizacion", "condicionada", "encuesta", "asistencia", "soporte", "carreras", "contacto"];
      const isTramite = options.some(opt => tramites.some(t => opt.toLowerCase().includes(t)));
      if (isTramite) return "tramites";
      if (options.includes("Volver al inicio")) return "action";
    }
    if (textStr.includes("✅") || textStr.includes("completada") || textStr.includes("exitoso")) return "success";
    if (textStr.includes("❌") || textStr.includes("error")) return "error";
    return "default";
  };

  const renderTextWithLinks = (text) => {
    if (typeof text !== 'string') return text;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="chat-link">{part}</a>;
      }
      const parts = part.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((p, j) => {
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={`${i}-${j}`}>{p.slice(2, -2)}</strong>;
        return p;
      });
    });
  };

  const sendMessage = async (textCustom = null) => {
    const text = textCustom || message;
    if (!text.trim() || loading) return;

    setMessages((prev) => [...prev, { text, sender: "user" }]);
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/chat", {
        question: text,
        session_id: "user1",
      });

      const { response, options, image } = res.data;
      const msgType = detectMessageType(response, options);

      setMessages((prev) => [
        ...prev,
        {
          text: response,
          sender: "bot",
          image: image || null,
          type: msgType,
          options: options || []
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { text: "😱 Error al conectar con el servidor.", sender: "bot", type: "error" },
      ]);
    }
    setLoading(false);
  };

  const renderSection = (section, idx) => (
    <div className="section-card" key={idx}>
      <div className="section-header">
        <span className="section-icon">{section.icon}</span>
        <span className="section-title">{section.title}</span>
      </div>
      <div className="section-content">
        {Array.isArray(section.content) ? (
          <ul>{section.content.map((item, i) => (<li key={i}>{renderTextWithLinks(item)}</li>))}</ul>
        ) : (
          <span>{renderTextWithLinks(section.content)}</span>
        )}
      </div>
    </div>
  );

  const renderMessageContent = (msg) => {
    if (Array.isArray(msg.text)) {
      return (
        <div className="sections-wrapper">
          {msg.text.map((section, idx) => renderSection(section, idx))}
        </div>
      );
    }

    const content = renderTextWithLinks(msg.text);

    const imageElement = msg.image && (
      <div className="message-image-container">
        <img 
          src={msg.image} 
          alt="Soporte visual" 
          className="chat-image clickable" 
          onClick={() => setSelectedImg(msg.image)} 
          onLoad={() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" })}
        />
      </div>
    );

    // NUEVO: RENDERIZADO COMPACTO DE TRÁMITES
    if (msg.type === "tramites" && msg.options.length > 0) {
      return (
        <div className="tramites-compact-wrapper">
          <div className="text-content mb-3">{content}</div>
          {imageElement}
          <div className="tramites-list-container">
            {msg.options.map((opt, idx) => {
              if (opt.toLowerCase().includes("volver")) return null;
              return (
                <div 
                  key={idx} 
                  className="tramite-item-row" 
                  onClick={() => sendMessage(String(idx + 1))}
                >
                  <div className="tramite-number-badge">{idx + 1}</div>
                  <div className="tramite-icon-mini">
                    {opt.toLowerCase().includes("ciclo") && <Calendar size={16} />}
                    {opt.toLowerCase().includes("asignatura") && <BookOpen size={16} />}
                    {opt.toLowerCase().includes("reserva") && <FileText size={16} />}
                    {opt.toLowerCase().includes("foto") && <ImageIcon size={16} />}
                    {opt.toLowerCase().includes("inasistencia") && <AlertCircle size={16} />}
                    {opt.toLowerCase().includes("reactualizacion") && <Sparkles size={16} />}
                    {opt.toLowerCase().includes("condicionada") && <CheckCircle size={16} />}
                    {opt.toLowerCase().includes("asistencia") && <CheckCircle size={16} />}
                  </div>
                  <span className="tramite-label-text">{opt}</span>
                  <ArrowRight size={14} className="tramite-arrow-hint" />
                </div>
              );
            })}
          </div>
          {msg.options.some(opt => opt.toLowerCase().includes("volver")) && (
            <button className="btn-simple-back" onClick={() => sendMessage("Volver al inicio")}>
               ↩ Regresar al menú principal
            </button>
          )}
        </div>
      );
    }

    // RENDERIZADO POR DEFECTO PARA OTROS MENSAJES
    return (
      <div className={`msg-content-wrapper ${msg.type}`}>
        {msg.type === "success" && <div className="success-icon">🎉</div>}
        {msg.type === "error" && <AlertCircle size={20} />}
        <div className="text-content">{content}</div>
        {imageElement}
        {msg.options && msg.options.length > 0 && (
          <div className="action-buttons">
            {msg.options.map((opt, idx) => (
              <button 
                key={idx} 
                className={opt.includes("Siguiente") ? "next-btn-main" : "action-btn"} 
                onClick={() => sendMessage(opt)} 
                disabled={loading}
              >
                {opt} {opt.includes("Siguiente") && <ArrowRight size={16} />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="chat-page-container">
      {selectedImg && (
        <div className="image-modal-overlay" onClick={() => setSelectedImg(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedImg(null)}>
              <X size={32} />
            </button>
            <img src={selectedImg} alt="Visualización ampliada" />
          </div>
        </div>
      )}

      <div className="chat-card">
        <header className="chat-header">
          <div className="header-content">
            <div className="header-avatar"><GraduationCap size={28} /></div>
            <div className="header-text">
              <h2>Bot San Martino</h2>
              <div className="online-indicator"><span className="dot"></span> en línea</div>
            </div>
          </div>
        </header>

        <main className="chat-body">
          {messages.map((m, i) => (
            <div key={i} className={`message-row ${m.sender}`}>
              <div className="message-icon">
                <div className={`icon-circle ${m.sender === "bot" ? "bot-icon" : "user-icon"}`}>
                  {m.sender === "bot" ? <Bot size={18} /> : <User size={18} />}
                </div>
              </div>
              <div className={`message-bubble ${m.sender} ${m.type || 'default'}`}>
                {renderMessageContent(m)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message-row bot">
              <div className="message-icon"><div className="icon-circle bot-icon"><Bot size={18} /></div></div>
              <div className="typing-indicator"><span></span><span></span><span></span></div>
            </div>
          )}
          <div ref={chatEndRef}></div>
        </main>

        <footer className="chat-footer">
          <div className="input-wrapper">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Escribe tu consulta o el número de opción..."
              disabled={loading}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={!message.trim() || loading}>
              <Send size={20} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}