"use client";

import { useEffect, useState } from "react";

export default function AnnouncementBar() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (active && s?.announcementEnabled && s?.announcement) {
          setText(s.announcement as string);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!text) return null;

  return (
    <div className="bg-emerald-800 px-4 py-2 text-center text-sm font-medium text-white">
      {text}
    </div>
  );
}
