"use client";

import React from "react";
import { IconCheck, IconChecks } from "@tabler/icons-react";

interface MessageStatusProps {
  status: 'SENT' | 'DELIVERED' | 'READ';
  isOwnMessage: boolean;
}

export function MessageStatus({ status, isOwnMessage }: MessageStatusProps) {
  if (!isOwnMessage) return null;

  return (
    <div className="flex items-center ml-1">
      {status === 'SENT' && (
        <IconCheck className="w-3 h-3 text-gray-400" />
      )}
      {status === 'DELIVERED' && (
        <IconChecks className="w-3 h-3 text-gray-400" />
      )}
      {status === 'READ' && (
        <IconChecks className="w-3 h-3 text-blue-400" />
      )}
    </div>
  );
}
