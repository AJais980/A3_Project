"use client";

import React from "react";
import { IconX } from "@tabler/icons-react";

interface ReplyPreviewProps {
  replyTo: {
    id: string;
    content: string;
    sender: {
      name: string | null;
      username: string;
    };
  };
  onCancel: () => void;
}

export function ReplyPreview({ replyTo, onCancel }: ReplyPreviewProps) {
  return (
    <div className="bg-[#2a2a2a] border-l-4 border-purple-500 p-3 mx-4 mb-2 rounded-r-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-purple-400 text-sm font-medium mb-1">
            Replying to {replyTo.sender.name || replyTo.sender.username}
          </div>
          <div className="text-gray-300 text-sm line-clamp-2">
            {replyTo.content}
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white ml-2 p-1"
        >
          <IconX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
