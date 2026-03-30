"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";

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

export default function JobPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [statusMap, setStatusMap] = useState<{ [key: string]: string }>({});
  const [results, setResults] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }
    fetchJob(token);
    fetchResults(token);
  }, []);

  const fetchJob = async (token: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
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
      const res = await fetch(`http://localhost:5000/api/resume/results/${jobId}`, {
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
      const res = await fetch(`http://localhost:5000/api/resume/upload/${jobId}`, {
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400 bg-green-500/10 border-green-500/20";
    if (score >= 60) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    return "text-orange-400 bg-orange-500/10 border-orange-500/20";
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-amber-500";
    return "from-orange-500 to-red-500";
  };

  const handleStatus = (id: string, status: string) => {
  setStatusMap(prev => ({
    ...prev,
    [id]: status
  }));
  };

  const filteredResults = results.filter(candidate => {
  if (filter === "all") return true;
  return statusMap[candidate._id] === filter;
});

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Navbar */}
      <nav className="border-b border-white/10 px-8 py-4 flex justify-between items-center bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold">S</div>
          <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">SmartHire</span>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10">

        {/* Job Info */}
        {job && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#12121a] border border-white/10 rounded-2xl p-6 mb-8"
          >
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-white mb-2">{job.title}</h1>
                <p className="text-gray-400 text-sm mb-3">{job.description}</p>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills?.map((skill: string, i: number) => (
                    <span key={i} className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full">
                Active
              </span>
            </div>
          </motion.div>
        )}

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#12121a] border border-white/10 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-lg font-bold text-white mb-4">📤 Upload Resumes</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div
              className="border-2 border-dashed border-white/10 hover:border-violet-500/40 rounded-xl p-8 text-center transition-all cursor-pointer"
              onClick={() => document.getElementById("resume-input")?.click()}
            >
              <div className="text-4xl mb-3">📄</div>
              <p className="text-gray-400 mb-1">
                {files && files.length > 0
                  ? `${files.length} file(s) selected`
                  : "Click to upload resumes"}
              </p>
              <p className="text-gray-600 text-xs">PDF files only • Multiple files supported</p>
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

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-white">🏆 Candidate Rankings</h2>
            <span className="text-sm text-gray-500">{
            filter === "all"
              ? `${results.length} candidates`
              : `${
                  results.filter(c => statusMap[c._id] === filter).length
                } ${filter} candidates`
          }</span>
          </div>

          {/* 🔽 YAHI ADD KARNA HAI */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 text-xs rounded-full border ${
                filter === "all" ? "bg-white text-black" : "text-gray-400 border-white/10"
              }`}
            >
              All
            </button>

            <button
              onClick={() => setFilter("shortlisted")}
              className={`px-3 py-1 text-xs rounded-full border ${
                filter === "shortlisted" ? "bg-green-500 text-white" : "text-green-400 border-green-500/20"
              }`}
            >
              Shortlisted
            </button>

            <button
              onClick={() => setFilter("rejected")}
              className={`px-3 py-1 text-xs rounded-full border ${
                filter === "rejected" ? "bg-red-500 text-white" : "text-red-400 border-red-500/20"
              }`}
            >
              Rejected
            </button>
          </div>
          

          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading...</div>
          ) : results.length === 0 ? (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-bold text-white mb-2">No resumes yet</h3>
              <p className="text-gray-400 text-sm">Upload resumes above to see AI rankings</p>
            </div>
          ) : (
            
              <div className="space-y-4">
                {filteredResults.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    {filter === "shortlisted"
                      ? "No shortlisted candidates yet"
                      : filter === "rejected"
                      ? "No rejected candidates"
                      : "No candidates available"}
                  </div>
                ) : (
                  filteredResults
                    .sort((a, b) => b.score - a.score)
                    .map((candidate, i) => (
                  <motion.div
                    key={candidate._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-[#12121a] border rounded-2xl p-6 transition-all
                      ${i === 0 
                        ? "border-yellow-500/40 shadow-[0_0_20px_rgba(255,215,0,0.2)]" 
                        : "border-white/10 hover:border-violet-500/25"}
                    `}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`text-2xl font-black w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? "bg-yellow-500/20 text-yellow-400" : i === 1 ? "bg-gray-500/20 text-gray-400" : i === 2 ? "bg-orange-500/20 text-orange-400" : "bg-white/5 text-gray-500"}`}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                        </div>
                        <div>
                        <h3 className="font-bold text-white text-lg">
                          {candidate.filename?.replace(".pdf", "")}
                        </h3>

                        {i === 0 && (
                          <span className="inline-block mt-1 text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                            🔥 Best Match
                          </span>
                        )}

                        <p className="text-gray-500 text-sm mt-1">
                          Candidate Resume
                        </p>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {candidate.skills?.slice(0, 5).map((skill: string, j: number) => (
                            <span key={j} className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      </div>
                      <span className={`text-sm font-bold px-3 py-1.5 rounded-full border ${getScoreColor(candidate.score)}`}>
                        <AnimatedScore score={candidate.score} />
                      </span>
                    </div>

                    {/* Score Bar */}
                    <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleStatus(candidate._id, "shortlisted")}
                          className={`px-3 py-1 text-xs rounded-full border transition
                            ${
                              statusMap[candidate._id] === "shortlisted"
                                ? "bg-green-500 text-white shadow-md"
                                : "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                            }
                          `}
                        >
                          ✅ Shortlist
                        </button>

                        <button
                          onClick={() => handleStatus(candidate._id, "rejected")}
                          className={`px-3 py-1 text-xs rounded-full border transition
                            ${
                              statusMap[candidate._id] === "rejected"
                                ? "bg-red-500 text-white shadow-md"
                                : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                            }
                          `}
                        >
                          ❌ Reject
                        </button>
                    </div>
                    <div className="bg-white/5 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${getBarColor(candidate.score)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${candidate.score}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

