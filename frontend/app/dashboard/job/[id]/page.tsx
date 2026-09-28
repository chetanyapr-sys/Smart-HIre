"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Copy, Check, Search } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

function AnimatedScore({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const stepTime = 20;
    const increment = score / (duration / stepTime);

    const counter = setInterval(() => {
      start += increment;
      if (start >= score) {
        start = score;
        clearInterval(counter);
      }
      setDisplay(parseFloat(start.toFixed(2)));
    }, stepTime);

    return () => clearInterval(counter);
  }, [score]);

  return <span>{display}%</span>;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-500 dark:text-green-400 bg-green-500/10 border-green-500/20";
  if (score >= 60) return "text-yellow-500 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  return "text-orange-500 dark:text-orange-400 bg-orange-500/10 border-orange-500/20";
}

function getBarColor(score: number) {
  if (score >= 80) return "from-green-500 to-emerald-500";
  if (score >= 60) return "from-yellow-500 to-amber-500";
  return "from-orange-500 to-red-500";
}

function CandidateCard({
  candidate,
  isTopMatch,
  jobId,
  onStatus,
}: {
  candidate: any;
  isTopMatch: boolean;
  jobId: string;
  onStatus: (id: string, status: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-black/[0.02] dark:bg-[#12121a] border rounded-xl p-4 ${isTopMatch
        ? "border-yellow-500/40 shadow-[0_0_16px_rgba(255,215,0,0.12)]"
        : "border-black/10 dark:border-white/10"
        }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/dashboard/job/${jobId}/candidate/${candidate._id}`}
          className="font-semibold text-sm hover:text-violet-600 dark:hover:text-violet-400 hover:underline line-clamp-1"
        >
          {candidate.name || candidate.filename?.replace(".pdf", "")}
        </Link>
        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreColor(candidate.score)}`}>
          <AnimatedScore score={candidate.score} />
        </span>
      </div>

      {isTopMatch && (
        <span className="inline-block mb-2 text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
          🔥 Best Match
        </span>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {candidate.skills?.slice(0, 3).map((skill: string, j: number) => (
          <span key={j} className="text-[10px] bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
            {skill}
          </span>
        ))}
      </div>

      <div className="bg-black/5 dark:bg-white/5 rounded-full h-1.5 overflow-hidden mb-3">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${getBarColor(candidate.score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${candidate.score}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="flex gap-1.5">
        {candidate.status !== "shortlisted" && (
          <button
            onClick={() => onStatus(candidate._id, "shortlisted")}
            className="flex-1 text-[11px] py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 transition"
          >
            ✅ Shortlist
          </button>
        )}
        {candidate.status !== "rejected" && (
          <button
            onClick={() => onStatus(candidate._id, "rejected")}
            className="flex-1 text-[11px] py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition"
          >
            ❌ Reject
          </button>
        )}
        {candidate.status !== "pending" && (
          <button
            onClick={() => onStatus(candidate._id, "pending")}
            className="flex-1 text-[11px] py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition"
          >
            ↩ Reset
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function JobPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }
    fetchJob(token);
    fetchResults(token);
  }, []);

  const fetchJob = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setJob(data);
    } catch {
      console.error("Failed to fetch job");
    }
  };

  const fetchResults = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/resume/results/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResults(data);
    } catch {
      console.error("Failed to fetch results");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("resumes", files[i]);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/resume/upload/${jobId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`✅ ${files.length} resume(s) analyzed successfully!`);
        fetchResults(token!);
        setFiles(null);
        const input = document.getElementById("resume-input") as HTMLInputElement;
        if (input) input.value = "";
      } else {
        setError(data.message || "Upload failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleStatus = async (id: string, status: string) => {
    setResults(prev =>
      prev.map(c => (c._id === id ? { ...c, status } : c))
    );

    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_BASE_URL}/api/resume/status/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
    } catch {
      console.error("Failed to save status");
    }
  };

  const handleExport = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/resume/export/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `candidates_${jobId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      console.error("Failed to export CSV");
    }
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/jobs/${jobId}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      console.error("Failed to copy link");
    }
  };

  const sortedResults = [...results].sort((a, b) => b.score - a.score);
  const topMatchId = sortedResults[0]?._id;

  // Search + score filter apply karo (Kanban columns isi filtered list se banenge)
  const searchFiltered = sortedResults.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.filename?.toLowerCase().includes(q) ||
      c.skills?.some((s: string) => s.toLowerCase().includes(q));
    const matchesScore = c.score >= minScore;
    return matchesSearch && matchesScore;
  });

  const pending = searchFiltered.filter(c => !c.status || c.status === "pending");
  const shortlisted = searchFiltered.filter(c => c.status === "shortlisted");
  const rejected = searchFiltered.filter(c => c.status === "rejected");

  const columns = [
    { key: "pending", title: "Pending", list: pending, dot: "bg-gray-400" },
    { key: "shortlisted", title: "Shortlisted", list: shortlisted, dot: "bg-green-500" },
    { key: "rejected", title: "Rejected", list: rejected, dot: "bg-red-500" },
  ];

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-8 py-10">

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </Link>

        {/* Job Info */}
        {job && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/[0.02] dark:bg-[#12121a] border border-black/10 dark:border-white/10 rounded-2xl p-6 mb-8"
          >
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black mb-2">{job.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{job.description}</p>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills?.map((skill: string, i: number) => (
                    <span key={i} className="text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-2 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-3 py-1 rounded-full">
                Active
              </span>
            </div>

            <button
              onClick={handleCopyLink}
              className="mt-4 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              {linkCopied ? (
                <>
                  <Check size={13} className="text-green-500" /> Link copied!
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy Application Link
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/[0.02] dark:bg-[#12121a] border border-black/10 dark:border-white/10 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-lg font-bold mb-4">📤 Upload Resumes</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-xl mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div
              className="border-2 border-dashed border-black/10 dark:border-white/10 hover:border-violet-500/40 rounded-xl p-8 text-center transition-all cursor-pointer"
              onClick={() => document.getElementById("resume-input")?.click()}
            >
              <div className="text-4xl mb-3">📄</div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                {files && files.length > 0
                  ? `${files.length} file(s) selected`
                  : "Click to upload resumes"}
              </p>
              <p className="text-gray-500 dark:text-gray-600 text-xs">PDF files only • Multiple files supported</p>
              <input
                id="resume-input"
                type="file"
                accept=".pdf"
                multiple
                onChange={e => setFiles(e.target.files)}
                className="hidden"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={uploading || !files || files.length === 0}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-xl font-semibold transition-all hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Analyzing with AI...
                </>
              ) : "🤖 Analyze Resumes"}
            </motion.button>
          </form>
        </motion.div>

        {/* Results - Kanban board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">🏆 Candidate Pipeline</h2>
            {results.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <Download size={13} /> Export CSV
              </button>
            )}
          </div>

          {results.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or skill..."
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Min score:</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMinScore(Math.min(100, Math.max(0, val || 0)));
                  }}
                  placeholder="0"
                  className="w-16 bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading...</div>
          ) : results.length === 0 ? (
            <div className="bg-black/[0.015] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-bold mb-2">No resumes yet</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Upload resumes above to see AI rankings</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {columns.map(col => (
                <div key={col.key} className="bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.06] rounded-2xl p-3">
                  <div className="flex items-center gap-2 px-2 py-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <h3 className="text-sm font-semibold">{col.title}</h3>
                    <span className="text-xs text-gray-500 ml-auto">{col.list.length}</span>
                  </div>

                  <div className="space-y-3 min-h-[80px]">
                    {col.list.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-500">No candidates here</div>
                    ) : (
                      col.list.map(candidate => (
                        <CandidateCard
                          key={candidate._id}
                          candidate={candidate}
                          isTopMatch={candidate._id === topMatchId}
                          jobId={jobId}
                          onStatus={handleStatus}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}