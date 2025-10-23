"use client";

import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@radix-ui/react-context-menu";
import { IconTrash } from "@tabler/icons-react";

interface ChatContextMenuProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export function ChatContextMenu({ children, onDelete }: ChatContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent 
        className="min-w-[180px] bg-[#2a2a2a] border border-gray-700 rounded-lg p-1 shadow-lg z-50"
      >
        <ContextMenuItem
          onClick={onDelete}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded cursor-pointer outline-none"
        >
          <IconTrash className="w-4 h-4" />
          Delete Chat
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
