"use client";

import React from "react";
import { Database } from "@/types/supabase";

type Message = Database["public"]["Tables"]["Message"]["Row"];

interface ChatMessagesProps {
  messages: Message[];
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="flex flex-col gap-2 p-4 max-h-[70vh] overflow-y-auto">
      {messages.length === 0 && (
        <p className="text-gray-500 text-center">No messages yet</p>
      )}
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${
            msg.senderId === "me" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`px-3 py-2 rounded-lg ${
              msg.senderId === "me"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
    </div>
  );
}