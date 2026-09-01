import { useState, useRef, useEffect } from "react";
import "./App.css";

const getSessionId = () => {
  let sessionId = localStorage.getItem("piecebyte_session_id");

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("piecebyte_session_id", sessionId);
  }

  return sessionId;
};

const welcomeMessage = {
  sender: "bot",
  text: "Hi! 👋 Welcome to Piecebyte. How can I help you today?",
};

const suggestedQuestions = [
  "What services does Piecebyte provide?",
  "I need a website",
  "Tell me about app development",
  "What are VoIP solutions?",
];

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [sessionId] = useState(() => getSessionId());

  const [messages, setMessages] = useState([welcomeMessage]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const sendMessage = async (textToSend = message) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage = textToSend.trim();

    setMessages((previousMessages) => [
      ...previousMessages,
      {
        sender: "user",
        text: userMessage,
      },
    ]);

    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            sessionId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          sender: "bot",
          text: data.reply,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          sender: "bot",
          text: "Sorry, I couldn't connect to the server. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = async () => {
    if (isLoading) return;

    try {
      await fetch(
        "http://localhost:5000/api/clear-chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
          }),
        }
      );

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error("Clear chat error:", error);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="app">

      {/* Demo Page */}
      <main className="demo-page">
        <div className="demo-content">

          <div className="demo-badge">
            Enterprise Intelligence
          </div>

          <h1>
            Meet the <span>Piecebyte Assistant</span>
          </h1>

          <p>
            Get quick information about Piecebyte, its technology
            services, and business solutions through our intelligent
            domain-specific assistant.
          </p>

          <div className="demo-info">
            <span>💻 Software Development</span>
            <span>🌐 Web Development</span>
            <span>📱 App Development</span>
            <span>📞 VoIP Solutions</span>
          </div>

        </div>
      </main>

      {/* Chatbot */}
      <div className="chatbot">

        {isOpen && (
          <div className="chat-window">

            {/* Header */}
            <div className="chat-header">

              <div>
                <h3>Piecebyte Assistant</h3>
                <span>● Online</span>
              </div>

              <div className="header-buttons">

                <button
                  className="new-chat-button"
                  onClick={startNewChat}
                  disabled={isLoading}
                  title="Start new chat"
                >
                  ↻
                </button>

                <button
                  className="close-button"
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                >
                  ×
                </button>

              </div>

            </div>

            {/* Messages */}
            <div className="chat-body">

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-row ${msg.sender}`}
                >
                  {msg.sender === "bot" && (
                    <span className="bot-icon">🤖</span>
                  )}

                  <div className="message-bubble">
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Suggested Questions */}
              {messages.length === 1 && !isLoading && (
                <div className="suggested-section">

                  <p>Try asking:</p>

                  <div className="suggested-questions">

                    {suggestedQuestions.map((question) => (
                      <button
                        key={question}
                        onClick={() => sendMessage(question)}
                      >
                        {question}
                      </button>
                    ))}

                  </div>

                </div>
              )}

              {/* Professional Typing Indicator */}
              {isLoading && (
                <div className="message-row bot">

                  <span className="bot-icon">🤖</span>

                  <div className="typing-bubble">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                </div>
              )}

              <div ref={messagesEndRef}></div>

            </div>

            {/* Input */}
            <div className="chat-input-area">

              <input
                type="text"
                placeholder="Ask about Piecebyte..."
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />

              <button
                className="send-button"
                onClick={() => sendMessage()}
                disabled={isLoading}
                aria-label="Send message"
              >
                ➤
              </button>

            </div>

          </div>
        )}

        {/* Floating Button */}
        <button
          className={`chat-button ${isOpen ? "open" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open chatbot"
        >
          {isOpen ? "×" : "🤖"}
        </button>

      </div>

    </div>
  );
}

export default App;