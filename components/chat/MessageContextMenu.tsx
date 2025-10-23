"use client";

import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@radix-ui/react-context-menu";
import { IconTrash, IconArrowBackUp } from "@tabler/icons-react";

interface MessageContextMenuProps {
  children: React.ReactNode;
  isOwnMessage: boolean;
  canDeleteForEveryone: boolean;
  isDeleted?: boolean;
  onReply: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone?: () => void;
}

export function MessageContextMenu({ 
  children, 
  isOwnMessage, 
  canDeleteForEveryone,
  isDeleted = false,
  onReply,
  onDeleteForMe,
  onDeleteForEveryone 
}: MessageContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="min-w-[180px] bg-[#2a2a2a] border border-gray-700 rounded-lg p-1 shadow-lg">
        {!isDeleted && (
          <ContextMenuItem
            onClick={onReply}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded cursor-pointer outline-none"
          >
            <IconArrowBackUp className="w-4 h-4" />
            Reply
          </ContextMenuItem>
        )}
        
        <ContextMenuItem
          onClick={onDeleteForMe}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded cursor-pointer outline-none"
        >
          <IconTrash className="w-4 h-4" />
          Delete for me
        </ContextMenuItem>
        
        {isOwnMessage && canDeleteForEveryone && onDeleteForEveryone && (
          <ContextMenuItem
            onClick={onDeleteForEveryone}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded cursor-pointer outline-none"
          >
            <IconTrash className="w-4 h-4" />
            Delete for everyone
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
