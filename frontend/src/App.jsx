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
  text: "Hi! 👋 How can I help you today?",
};

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [sessionId] = useState(() => getSessionId());

  const [messages, setMessages] = useState([
    welcomeMessage,
  ]);

  // Reference to the bottom of the chat
  const messagesEndRef = useRef(null);

  // Automatically scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();

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
        "https://piecebyte-backend.vercel.app/api/chat",
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

  // Start a new conversation
  const startNewChat = async () => {
    if (isLoading) return;

    try {
      const response = await fetch(
        "https://piecebyte-backend.vercel.app/api/clear-chat",
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

      if (!response.ok) {
        throw new Error("Could not clear chat");
      }

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error("Clear chat error:", error);

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          sender: "bot",
          text: "Sorry, I couldn't start a new chat. Please try again.",
        },
      ]);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="app">

      <main className="demo-page">
        <h1>Piecebyte Chatbot</h1>
        <p>This is our chatbot testing environment.</p>
      </main>

      <div className="chatbot">

        {isOpen && (
          <div className="chat-window">

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
                  aria-label="Close chatbot"
                >
                  ×
                </button>

              </div>

            </div>

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

              {/* Professional typing animation */}
              {isLoading && (
                <div className="message-row bot">
                  <span className="bot-icon">🤖</span>

                  <div className="message-bubble typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef}></div>

            </div>

            <div className="chat-input-area">

              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />

              <button
                className="send-button"
                onClick={sendMessage}
                disabled={isLoading}
                aria-label="Send message"
              >
                ➤
              </button>

            </div>

          </div>
        )}

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