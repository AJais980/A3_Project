"use client";

import React from "react";
import { motion } from "framer-motion";

interface UnreadBadgeProps {
  count: number;
}

export function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="min-w-[20px] h-5 px-1.5 bg-purple-600 rounded-full flex items-center justify-center"
    >
      <span className="text-xs font-semibold text-white">
        {count > 99 ? "99+" : count}
      </span>
    </motion.div>
  );
}
