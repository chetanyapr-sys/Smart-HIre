"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Calendar, Sun, Moon, Users, Copy, Check, Shield } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useTheme } from "@/components/theme-provider";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    created_at?: string;
    role?: string;
    team_id?: string;
  } | null>(null);
  const [teammates, setTeammates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_BASE_URL}/api/auth/me`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/auth/team`, { headers }).then((r) => r.json()),
    ])
      .then(([me, team]) => {
        setProfile(me);
        setTeammates(Array.isArray(team) ? team : []);
      })
      .catch(() => console.error("Failed to fetch profile/team"))
      .finally(() => setLoading(false));
  }, []);

  const handleCopyInvite = async () => {
    if (!profile?.team_id) return;
    const link = `${window.location.origin}/signup?team=${profile.team_id}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      console.error("Failed to copy invite link");
    }
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="max-w-2xl mx-auto px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-black mb-2">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your account, team, and preferences</p>
          </div>

          {/* Account Info */}
          <div className="bg-black/[0.02] dark:bg-[#12121a] border border-black/10 dark:border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Account
            </h2>

            {loading ? (
              <div className="text-gray-500 text-sm py-4">Loading...</div>
            ) : profile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Name</p>
                    <p className="font-medium">{profile.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                    <Shield size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Role</p>
                    <p className="font-medium capitalize">{profile.role || "admin"}</p>
                  </div>
                </div>

                {profile.created_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Member since</p>
                      <p className="font-medium">
                        {new Date(profile.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-red-500">Failed to load profile.</p>
            )}
          </div>

          {/* Team */}
          <div className="bg-black/[0.02] dark:bg-[#12121a] border border-black/10 dark:border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Team
              </h2>
              <button
                onClick={handleCopyInvite}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                {linkCopied ? (
                  <>
                    <Check size={13} className="text-green-500" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Copy Invite Link
                  </>
                )}
              </button>
            </div>

            {loading ? (
              <div className="text-gray-500 text-sm py-4">Loading...</div>
            ) : teammates.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sirf tum ho abhi is team me — invite link share karke teammates add karo.
              </p>
            ) : (
              <div className="space-y-3">
                {teammates.map((member, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{member.email}</p>
                    </div>
                    <span className="text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full capitalize">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appearance */}
          <div className="bg-black/[0.02] dark:bg-[#12121a] border border-black/10 dark:border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Appearance
            </h2>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                  {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Currently using {theme === "dark" ? "Dark" : "Light"} mode
                  </p>
                </div>
              </div>

              <button
                onClick={toggleTheme}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  theme === "dark" ? "bg-violet-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    theme === "dark" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}