import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FaPaperPlane, FaImage, FaRobot } from "react-icons/fa";

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
    <div className="flex flex-col items-center max-w-4xl mx-auto h-[min(calc(100vh-10rem),800px)] pt-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
         <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
             <FaRobot className="text-white text-2xl" />
         </div>
         <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">AI Nutrition Assistant</h1>
            <p className="text-slate-500 font-medium text-sm">Always here to help you</p>
         </div>
      </div>

      <div className="w-full glass-card rounded-3xl shadow-2xl flex flex-col h-full overflow-hidden border border-white/50">

        {/* Messages Section */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 scroll-smooth">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`px-5 py-3 rounded-2xl max-w-[85%] sm:max-w-[70%] break-words whitespace-pre-line shadow-sm border border-white/20 ${
                  msg.sender === "user" 
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-none" 
                  : "glass text-slate-800 rounded-bl-none font-medium"
                }`}
              >
                {msg.text}
              </div>
              {msg.image && (
                <div className={`mt-2 p-1 rounded-2xl border border-white/40 shadow-sm ${msg.sender === "user" ? "bg-white/20" : "bg-white/40"} backdrop-blur-sm max-w-[70%]`}>
                  <img
                    src={msg.image}
                    alt="uploaded"
                    className="rounded-xl object-cover w-full h-auto"
                  />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
              <div className="flex items-start">
                  <div className="glass px-5 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-2">
                       <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                       <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                       <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
              </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="p-4 sm:p-6 bg-white/40 border-t border-white/30 backdrop-blur-md">
           
          {/* Image preview with remove button */}
          {previewURL && (
            <div className="mb-4 relative inline-block group">
              <div className="p-1 glass rounded-xl inline-block shadow-sm">
                <img
                  src={previewURL}
                  alt="preview"
                  className="w-16 h-16 rounded-lg object-cover"
                />
              </div>
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex items-center space-x-3">
              {/* File upload button */}
              <button
                onClick={() => fileInputRef.current.click()}
                className="flex-shrink-0 w-12 h-12 glass rounded-full flex items-center justify-center text-indigo-600 hover:bg-white/60 hover:text-indigo-700 hover:scale-105 transition-all shadow-sm group"
                title="Upload Image"
              >
                <FaImage className="text-xl group-hover:rotate-12 transition-transform" />
              </button>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />

              {/* Message input */}
              <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Ask anything or upload a food photo..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full glass-input pl-6 pr-14 py-4 rounded-full shadow-sm text-slate-800 placeholder-slate-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  
                  {/* Send button absolute positioned inside input */}
                  <button
                    onClick={handleSend}
                    disabled={isLoading || (!textInput.trim() && !selectedFile)}
                    className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors group"
                  >
                    <FaPaperPlane className="ml-1 text-sm group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
              </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Chatbot;
