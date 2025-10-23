"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";

interface OnlineStatusProps {
  isOnline: boolean;
  lastSeen?: Date | null;
  showText?: boolean;
}

export function OnlineStatus({ isOnline, lastSeen, showText = true }: OnlineStatusProps) {
  if (isOnline) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        {showText && <span className="text-xs text-green-500">Online</span>}
      </div>
    );
  }

  if (lastSeen) {
    const lastSeenText = formatDistanceToNow(new Date(lastSeen), { addSuffix: true });
    return showText ? (
      <span className="text-xs text-gray-500">Last seen {lastSeenText}</span>
    ) : (
      <div className="w-2 h-2 bg-gray-500 rounded-full" />
    );
  }

  return showText ? (
    <span className="text-xs text-gray-500">Offline</span>
  ) : (
    <div className="w-2 h-2 bg-gray-500 rounded-full" />
  );
}
