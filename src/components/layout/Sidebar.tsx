"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { motion } from "motion/react";
import { LayoutDashboard, Users, Layers } from "lucide-react";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  projects: { id: string; name: string }[];
  teams: { id: string; name: string }[];
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Teams",
    href: "/teams",
    icon: Users,
    type: "teams",
  },
  {
    name: "Projects",
    href: "/projects",
    icon: Layers,
    type: "projects",
  },
];

export function Sidebar({ user, projects, teams }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-700/50 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-neutral-700/50">
        <Link href="/dashboard" className="group">
          <span className="text-xl font-light text-white tracking-widest uppercase hover:tracking-[0.3em] transition-all duration-300 cursor-pointer">
            Vibe
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const subItems =
            item.type === "projects"
              ? projects
              : item.type === "teams"
              ? teams
              : [];

          return (
            <div key={item.name} className="space-y-1">
              <Link href={item.href} className="block">
                <motion.div
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    ${
                      isActive
                        ? "bg-neutral-800 text-white border border-neutral-700/50"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  whileHover={
                    !isActive
                      ? {
                          backgroundColor: "rgba(38, 38, 38, 1)",
                          x: 4,
                        }
                      : {}
                  }
                  whileTap={!isActive ? { x: 2 } : {}}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    whileHover={
                      !isActive
                        ? {
                            rotate: [0, -10, 10, -5, 0],
                            transition: { duration: 0.5 },
                          }
                        : {}
                    }
                  >
                    <Icon
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive
                          ? "text-violet-400"
                          : "group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                      }`}
                      strokeWidth={1.5}
                    />
                  </motion.div>
                  {item.name}
                </motion.div>
              </Link>

              {/* Quick Access Sub-items */}
              {subItems.length > 0 && (
                <div className="ml-9 space-y-1">
                  {subItems.map((subItem) => {
                    const subHref =
                      item.type === "projects"
                        ? `/projects/${subItem.id}`
                        : `/teams/${subItem.id}`;
                    const isSubActive = pathname === subHref;

                    return (
                      <Link key={subItem.id} href={subHref} className="block">
                        <motion.div
                          className={`
                            px-3 py-1.5 rounded-lg text-xs font-medium truncate
                            ${
                              isSubActive
                                ? "text-white bg-neutral-800/50"
                                : "text-neutral-500 hover:text-neutral-300"
                            }
                          `}
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          {subItem.name}
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-neutral-700/50">
        <Link href="/profile" className="block">
          <motion.div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            whileHover={{
              backgroundColor: "rgba(38, 38, 38, 1)",
              x: 4,
            }}
            whileTap={{ x: 2 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              whileHover={{
                boxShadow: "0 0 15px rgba(167, 139, 250, 0.5)",
                transition: { duration: 0.3 },
              }}
              className="rounded-full"
            >
              <Avatar src={user.image} name={user.name} size="md" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
            </div>
          </motion.div>
        </Link>
      </div>
    </aside>
  );
}
