import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/actions/auth";
import {
  ArrowRight,
  Layers,
  Users,
  Zap,
  BarChart3,
  CheckCircle2,
  Bot,
} from "lucide-react";
import { CosmicBackground } from "@/components/ui/CosmicBackground";

export default async function LandingPage() {
  const session = await getSession();

  // Redirect to dashboard if logged in
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-linear-to-br from-neutral-950 via-neutral-900 to-neutral-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent" />

      {/* Cosmic particle background - must be after gradients */}
      <CosmicBackground />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <Link href="/" className="group">
          <span className="text-xl font-light text-white tracking-widest uppercase hover:tracking-[0.3em] transition-all duration-300">
            Vibe
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/signin"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 text-sm font-medium bg-white text-neutral-950 rounded-full hover:bg-neutral-200 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-24 pb-32 max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/50 border border-neutral-800 mb-10">
            <Bot className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-neutral-400">
              AI-Native Project Management
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-display font-light tracking-tight max-w-4xl leading-[1.1] mb-8">
            Project management
            <br />
            <span className="text-neutral-500">reimagined.</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg text-neutral-500 max-w-xl mb-12 leading-relaxed font-light">
            Intelligent issue tracking, AI-powered insights, and seamless
            collaboration. Built for teams who move fast.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/signup"
              className="group flex items-center gap-3 px-8 py-4 bg-white text-neutral-950 rounded-full font-medium hover:bg-neutral-200 transition-all"
            >
              Start for Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/signin"
              className="flex items-center gap-2 px-8 py-4 rounded-full font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* App Preview */}
        <div className="mt-24 relative">
          <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="relative rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm overflow-hidden">
            {/* Mock window header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800 bg-neutral-900/80">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-neutral-700" />
                <div className="w-3 h-3 rounded-full bg-neutral-700" />
                <div className="w-3 h-3 rounded-full bg-neutral-700" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-full bg-neutral-800 text-xs text-neutral-500">
                  vibe.manhhung.app/dashboard
                </div>
              </div>
            </div>
            {/* Mock app content */}
            <div className="p-6 grid grid-cols-4 gap-4">
              {/* Sidebar mock */}
              <div className="col-span-1 space-y-3">
                <div className="h-8 rounded-lg bg-neutral-800/50" />
                <div className="h-6 rounded-lg bg-neutral-800/30 w-3/4" />
                <div className="h-6 rounded-lg bg-neutral-800 border border-neutral-700" />
                <div className="h-6 rounded-lg bg-neutral-800/30 w-2/3" />
                <div className="h-6 rounded-lg bg-neutral-800/30 w-4/5" />
              </div>
              {/* Content mock - Kanban board */}
              <div className="col-span-3 grid grid-cols-3 gap-4">
                {["Backlog", "In Progress", "Done"].map((col, i) => (
                  <div key={col} className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                      <div className="w-2 h-2 rounded-full bg-neutral-600" />
                      {col}
                    </div>
                    {[...Array(i === 1 ? 3 : 2)].map((_, j) => (
                      <div
                        key={j}
                        className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-800 space-y-2"
                      >
                        <div className="h-3 rounded bg-neutral-700/50 w-full" />
                        <div className="h-3 rounded bg-neutral-800 w-2/3" />
                        <div className="flex gap-1 mt-2">
                          <div className="h-4 w-12 rounded-full bg-neutral-700/30" />
                          <div className="h-4 w-8 rounded-full bg-neutral-700/30" />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-24 max-w-6xl mx-auto border-t border-neutral-800/50">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-display font-light mb-4 tracking-tight">
            Everything you need
          </h2>
          <p className="text-neutral-500 max-w-lg mx-auto font-light">
            Powerful features designed for modern teams.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-800/50 rounded-2xl overflow-hidden">
          {[
            {
              icon: Layers,
              title: "Kanban & List",
              description: "Flexible views to visualize your workflow.",
            },
            {
              icon: Bot,
              title: "AI Insights",
              description: "Smart summaries and suggestions.",
            },
            {
              icon: Users,
              title: "Team Collaboration",
              description: "Invite members and assign issues.",
            },
            {
              icon: Zap,
              title: "Real-time",
              description: "Instant notifications and updates.",
            },
            {
              icon: BarChart3,
              title: "Analytics",
              description: "Track progress with clear metrics.",
            },
            {
              icon: CheckCircle2,
              title: "Subtasks",
              description: "Break down complex work.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-8 bg-neutral-900/80 hover:bg-neutral-900 transition-colors"
            >
              <feature.icon className="w-5 h-5 text-neutral-500 mb-4" />
              <h3 className="text-base font-medium mb-2">{feature.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24 max-w-6xl mx-auto">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm p-12 md:p-20 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-light mb-4 tracking-tight">
            Ready to get started?
          </h2>
          <p className="text-neutral-500 max-w-md mx-auto mb-10 font-light">
            Join teams using Vibe to ship faster.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-neutral-950 rounded-full font-medium hover:bg-neutral-200 transition-colors"
          >
            Get Started for Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-neutral-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-sm font-light text-white tracking-widest uppercase">
            Vibe
          </span>
          <div className="text-center md:text-left">
            <p className="text-sm text-neutral-600">
              © 2025 Vibe. AI-native project management.
            </p>
            <p className="text-xs text-neutral-700 mt-1">
              Built by{" "}
              <a
                href="mailto:nmhp1903@gmail.com"
                className="text-neutral-500 hover:text-white transition-colors"
              >
                Hung Nguyen
              </a>
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-neutral-500">
            <Link href="/signin" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-white transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
