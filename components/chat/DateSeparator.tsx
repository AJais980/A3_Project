"use client";

import React from "react";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";

interface DateSeparatorProps {
  date: Date;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return "Today";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else if (isThisWeek(date)) {
      return format(date, "EEEE"); // Monday, Tuesday, etc.
    } else {
      return format(date, "dd-MM-yyyy");
    }
  };

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-[#2a2a2a] text-gray-400 text-xs px-3 py-1 rounded-full">
        {formatDate(date)}
      </div>
    </div>
  );
}
