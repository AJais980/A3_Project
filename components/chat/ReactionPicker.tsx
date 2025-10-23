"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ReactionPickerProps {
  onSelectReaction: (emoji: string) => void;
  show: boolean;
  onClose: () => void;
  isOwnMessage?: boolean;
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉"];

export function ReactionPicker({ onSelectReaction, show, onClose, isOwnMessage = false }: ReactionPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'left' | 'right'>('left');

  useEffect(() => {
    if (show && pickerRef.current) {
      const rect = pickerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      // Check if picker would overflow on the right
      if (rect.right > viewportWidth - 20) {
        setPosition('right');
      } else {
        setPosition('left');
      }
    }
  }, [show]);

  const handleSelect = (emoji: string) => {
    onSelectReaction(emoji);
    onClose();
  };

  // Determine positioning class based on message alignment and overflow detection
  const positionClass = isOwnMessage || position === 'right' 
    ? 'right-0' 
    : 'left-0';

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={onClose}
          />
          
          {/* Picker */}
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.15 }}
            className={`absolute bottom-full ${positionClass} mb-2 bg-[#2a2a2a] rounded-2xl shadow-2xl border border-gray-700 p-2 flex gap-1 z-50`}
          >
            {COMMON_EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSelect(emoji)}
                className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-700 rounded-lg transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
