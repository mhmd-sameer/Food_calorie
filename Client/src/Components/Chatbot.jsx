import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! You can type or upload a food image for analysis 🍽️" },
  ]);
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedFile(null);
    if (previewURL) URL.revokeObjectURL(previewURL);
    setPreviewURL(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle sending text + image
  const handleSend = async () => {
    if (!textInput.trim() && !selectedFile) {
      alert("Please enter a message or upload an image.");
      return;
    }

    // Make local copies for message display
    const imageToSend = selectedFile;
    const previewToSend = previewURL;

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: textInput || (selectedFile ? "Uploaded an image" : ""),
        image: previewToSend || null,
      },
    ]);

    // Clear input box but keep image copy for sending
    setTextInput("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", textInput);
      if (imageToSend) formData.append("image", imageToSend);

      const response = await axios.post("http://localhost:5000/api/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const botReply = response.data.chatbot_response || "No response from server.";

      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (error) {
      console.error("API error:", error);
      setMessages((prev) => [...prev, { sender: "bot", text: "⚠️ Error connecting to server." }]);
    } finally {
      // Clear file input and preview after sending
      setSelectedFile(null);
      if (previewURL) URL.revokeObjectURL(previewURL);
      setPreviewURL(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen items-center bg-gray-100">
      <div className="w-full max-w-2xl bg-white shadow-md rounded-lg flex flex-col h-[90vh]">

        {/* Messages Section */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 mb-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-[80%] break-words whitespace-pre-line ${
                  msg.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                {msg.text}
              </div>
              {msg.image && (
                <img
                  src={msg.image}
                  alt="uploaded"
                  className="mt-2 rounded-xl max-w-[70%]"
                />
              )}
            </div>
          ))}
          {isLoading && <p className="text-gray-400 text-center mt-2">Bot is responding...</p>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="p-4 border-t flex items-center space-x-2 bg-gray-50">
          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-gray-200 hover:bg-gray-300 text-xl font-bold px-4 py-2 rounded-full relative"
          >
            +
          </button>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />

          {/* Image preview with remove button */}
          {previewURL && (
            <div className="relative">
              <img
                src={previewURL}
                alt="preview"
                className="w-12 h-12 rounded-lg object-cover mr-2"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          )}

          {/* Message input */}
          <input
            type="text"
            placeholder="Type your message..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
};

export default Chatbot;
