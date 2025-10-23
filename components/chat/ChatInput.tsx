"use client";

import React, { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isSending: boolean;
}

export default function ChatInput({ onSend, isSending }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isSending}
        placeholder="Type a message..."
        className="border p-2 rounded w-full focus:outline-none"
      />
      <button
        onClick={handleSend}
        disabled={isSending}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isSending ? "Sending..." : "Send"}
      </button>
    </div>
  );
}