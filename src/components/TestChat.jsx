import React, { useState, useEffect, useRef } from "react";
import { Loader2, StopCircle, Copy, Check } from "lucide-react";
import axios from "axios";

const TYPING_SPEED = {
  MIN_DELAY: 15,
  MAX_DELAY: 30,
  INITIAL_DELAY: 300,
};

const TestChat = () => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [displayResponse, setDisplayResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typeTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayResponse]);

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const stopTyping = () => {
    if (typeTimeoutRef.current) {
      clearTimeout(typeTimeoutRef.current);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { type: "assistant", content: displayResponse },
      ]);
    }
  };

  const typeResponse = (text) => {
    setIsTyping(true);
    let currentText = "";
    let index = 0;

    const typeChar = () => {
      if (index < text.length) {
        currentText += text[index];
        setDisplayResponse(currentText);
        index++;
        typeTimeoutRef.current = setTimeout(
          typeChar,
          TYPING_SPEED.MIN_DELAY +
            Math.random() * (TYPING_SPEED.MAX_DELAY - TYPING_SPEED.MIN_DELAY)
        );
      } else {
        setIsTyping(false);
        setMessages((prev) => [...prev, { type: "assistant", content: text }]);
      }
    };

    typeChar();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!prompt.trim()) return;

    const newPrompt = prompt.trim();
    setMessages((prev) => [...prev, { type: "user", content: newPrompt }]);
    setIsLoading(true);
    setError("");
    setDisplayResponse("");
    setPrompt("");

    try {
      const res = await axios.post("/api/v1/test/chat", { prompt: newPrompt });
      const responseText =
        res.data.data.response || "Response received successfully";
      typeResponse(responseText);
    } catch (error) {
      console.error("Error sending prompt:", error);
      setError("Unable to get a response from the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white shadow-sm p-4">
        <h1 className="text-2xl font-bold text-center">Chatbot SVIST</h1>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 max-w-full w-full">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.type === "user" ? "bg-blue-50" : "bg-gray-100"
              }`}
            >
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500">
                  {message.type === "user" ? "Your message:" : "Response:"}
                </p>
                {message.type === "assistant" && (
                  <button
                    onClick={() => handleCopy(message.content, index)}
                    className="p-1 hover:bg-gray-200 rounded-md"
                    title="Copy response"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                )}
              </div>
              <p className="mt-1">{message.content}</p>
            </div>
          ))}

          {isLoading && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Response:</p>
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500">Response:</p>
                <div className="flex gap-2">
                  <button
                    onClick={stopTyping}
                    className="p-1 hover:bg-gray-200 rounded-md"
                    title="Stop typing"
                  >
                    <StopCircle className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleCopy(displayResponse, "typing")}
                    className="p-1 hover:bg-gray-200 rounded-md"
                    title="Copy response"
                  >
                    {copiedIndex === "typing" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-1">{displayResponse}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 p-3 rounded-lg text-red-600">{error}</div>
          )}

          {messages.length === 0 && !displayResponse && !error && (
            <div className="text-center text-gray-500">
              Enter a prompt to start the conversation
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t">
        <div className="max-w-2xl mx-auto p-4 w-full">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading || isTyping}
            />
            <button
              type="submit"
              disabled={isLoading || isTyping || !prompt.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                "Send"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TestChat;
