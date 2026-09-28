"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Search } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function ApplyToJob() {
  const params = useParams();
  const jobId = params.id as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please attach your resume (PDF).");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("resume", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/resume/apply/${jobId}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        {!submitted && (
          <Link
            href={`/jobs/${jobId}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-6"
          >
            <ArrowLeft size={15} /> Back to job
          </Link>
        )}

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/[0.02] dark:bg-[#12121a] border border-black/10 dark:border-white/10 rounded-2xl p-10 text-center"
          >
            <CheckCircle2 className="mx-auto mb-4 text-green-500" size={44} />
            <h2 className="text-xl font-bold mb-2">Application submitted!</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Thanks, {name}. The recruiter will review your resume and get back to you at {email} if there's a match.
            </p>

            {/* Status check link: candidate ko baad me email se apna status dekhne ke liye */}
            <Link
              href={`/jobs/${jobId}/status`}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all mb-3"
            >
              <Search size={14} /> Check application status
            </Link>
            <p className="text-xs text-gray-500 mb-6">
              Bookmark the status page and use <span className="font-medium">{email}</span> anytime to check.
            </p>

            <Link
              href="/jobs"
              className="text-violet-600 dark:text-violet-400 text-sm hover:underline"
            >
              ← Browse more jobs
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-8">
              <h1 className="text-2xl font-black mb-2">Apply for this role</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Fill in your details and attach your resume — no account needed.
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
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>

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

                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Resume (PDF)</label>
                  <div
                    className="border-2 border-dashed border-black/10 dark:border-white/10 hover:border-violet-500/40 rounded-xl p-6 text-center transition-all cursor-pointer"
                    onClick={() => document.getElementById("apply-resume-input")?.click()}
                  >
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {file ? file.name : "Click to attach your resume"}
                    </p>
                    <input
                      id="apply-resume-input"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-xl font-semibold transition-all hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application →"
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}