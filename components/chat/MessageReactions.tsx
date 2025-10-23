"use client";

import React from "react";
import { motion } from "framer-motion";

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onReactionClick: (reaction: Reaction) => void;
  currentUserId: string;
}

export function MessageReactions({ reactions, onReactionClick, currentUserId }: MessageReactionsProps) {
  if (!reactions || reactions.length === 0) return null;

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const hasUserReacted = reactionList.some(r => r.userId === currentUserId);
        const userReaction = reactionList.find(r => r.userId === currentUserId);
        
        return (
          <motion.button
            key={emoji}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => userReaction && onReactionClick(userReaction)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
              hasUserReacted 
                ? "bg-purple-600/30 border border-purple-500" 
                : "bg-gray-700/50 border border-gray-600 hover:bg-gray-700"
            }`}
            title={reactionList.map(r => r.user.name || r.user.username).join(", ")}
          >
            <span>{emoji}</span>
            {reactionList.length > 1 && (
              <span className="text-gray-300 font-medium">{reactionList.length}</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
