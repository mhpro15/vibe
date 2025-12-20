"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, SunMoon, MapPin } from "lucide-react";

interface DashboardHeaderProps {
  userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  const hours = time.getHours();
  const greeting = 
    hours < 12 ? "morning" : 
    hours < 17 ? "afternoon" : 
    hours < 21 ? "evening" : "night";

  const getTimeIcon = () => {
    if (hours >= 6 && hours < 12) return <Sun className="w-4 h-4 text-amber-400" />;
    if (hours >= 12 && hours < 17) return <SunMoon className="w-4 h-4 text-orange-400" />;
    if (hours >= 17 && hours < 21) return <Moon className="w-4 h-4 text-indigo-300" />;
    return <Moon className="w-4 h-4 text-slate-400" />;
  };

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()?.replace("_", " ");

  return (
    <div className="mb-6 md:mb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1.5 tracking-tight">
            Good {greeting}, {userName.split(" ")[0]}
          </h1>
          <p className="text-sm md:text-lg text-neutral-500 font-medium">
            {time.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        
        <div className="flex flex-col items-start md:items-end gap-1">
          <div className="flex items-center gap-2 text-neutral-400 font-medium">
            {getTimeIcon()}
            <span className="text-lg md:text-xl tabular-nums">
              {time.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
          {timeZone && (
            <div className="flex items-center gap-1 text-[10px] md:text-xs text-neutral-500 font-medium uppercase tracking-wider">
              <MapPin className="w-3 h-3" />
              <span>{timeZone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
