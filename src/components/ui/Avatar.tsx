"use client";

import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({
  src,
  name,
  size = "md",
  className = "",
}: AvatarProps) {
  const sizes = {
    xs: { class: "w-5 h-5 text-[10px]", pixels: 20 },
    sm: { class: "w-6 h-6 text-xs", pixels: 24 },
    md: { class: "w-8 h-8 text-sm", pixels: 32 },
    lg: { class: "w-10 h-10 text-base", pixels: 40 },
    xl: { class: "w-12 h-12 text-lg", pixels: 48 },
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getColorFromName = (name: string) => {
    const colors = [
      "bg-neutral-600",
      "bg-emerald-600",
      "bg-amber-600",
      "bg-rose-600",
      "bg-violet-600",
      "bg-pink-600",
      "bg-indigo-600",
      "bg-teal-600",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={sizes[size].pixels}
        height={sizes[size].pixels}
        className={`${sizes[size].class} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size].class} ${getColorFromName(
        name
      )} rounded-full flex items-center justify-center text-white font-medium ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
