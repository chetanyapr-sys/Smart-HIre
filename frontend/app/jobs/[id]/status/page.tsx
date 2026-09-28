"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Search, Clock, CheckCircle2, XCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function CheckApplicationStatus() {
  const params = useParams();
  const jobId = params.id as string;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ status: string; applied_at: string | null } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/resume/check-status/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Record<string, { label: string; desc: string; icon: any; color: string }> = {
    pending: {
      label: "Under Review",
      desc: "Your application has been received and the recruiter is yet to review it.",
      icon: Clock,
      color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    },
    shortlisted: {
      label: "Shortlisted",
      desc: "Good news! You have been shortlisted. The recruiter will contact you soon.",
      icon: CheckCircle2,
      color: "text-green-500 bg-green-500/10 border-green-500/20",
    },
    rejected: {
      label: "Not Selected",
      desc: "Thank you for applying. Unfortunately, you were not selected for this role.",
      icon: XCircle,
      color: "text-red-500 bg-red-500/10 border-red-500/20",
    },
  };

  const current = result ? statusConfig[result.status] || statusConfig.pending : null;
  const StatusIcon = current?.icon;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] text-gray-900 dark:text-white">
      <nav className="border-b border-black/10 dark:border-white/10 px-6 py-4 flex justify-between items-center sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">
            S
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-violet-500 to-indigo-500 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
            SmartHire
          </span>
        </Link>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-12">
        <Link
          href={`/jobs/${jobId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back to job
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-2xl font-black mb-2">Check application status</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Enter the email you used while applying — no account needed.
            </p>
          </div>

          <div className="bg-black/[0.02] dark:bg-[#12121a] border border-black/10 dark:border-white/10 rounded-2xl p-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-xl font-semibold transition-all hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Search size={16} /> {loading ? "Checking..." : "Check Status"}
              </button>
            </form>

            {current && result && StatusIcon && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 border rounded-xl p-5 ${current.color}`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  <StatusIcon size={18} /> {current.label}
                </div>
                <p className="text-sm opacity-90">{current.desc}</p>
                {result.applied_at && (
                  <p className="text-xs opacity-70 mt-3">
                    Applied on: {new Date(result.applied_at).toLocaleDateString()}
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}