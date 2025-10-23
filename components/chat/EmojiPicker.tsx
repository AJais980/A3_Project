"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconMoodSmile } from "@tabler/icons-react";
import EmojiPickerReact, { EmojiClickData, Theme } from "emoji-picker-react";

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
}

export function EmojiPicker({ onSelectEmoji }: EmojiPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelectEmoji(emojiData.emoji);
  };

  return (
    <div className="relative">
      {/* Emoji Button */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700"
      >
        <IconMoodSmile className="w-6 h-6" />
      </button>

      {/* Emoji Picker Popup */}
      <AnimatePresence>
        {showPicker && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowPicker(false)}
            />
            
            {/* Picker */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full left-0 mb-2 z-50"
            >
              <EmojiPickerReact
                onEmojiClick={handleEmojiClick}
                theme={Theme.DARK}
                width={350}
                height={450}
                searchPlaceHolder="Search emoji..."
                previewConfig={{
                  showPreview: false
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
