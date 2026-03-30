"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CreateJob() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);

    try {
      const res = await fetch("http://localhost:5000/api/jobs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          required_skills: skillsArray,
          experience,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        setError(data.message || "Failed to create job");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="max-w-2xl mx-auto px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Create New Job</h1>
            <p className="text-gray-400">Fill in the details to start screening candidates</p>
          </div>

          <div className="bg-[#12121a] border border-white/10 rounded-2xl p-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Job Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Full Stack Developer"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Job Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  required
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Required Skills</label>
                <input
                  type="text"
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                  placeholder="e.g. React, Node.js, MongoDB (comma separated)"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
                {skills && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.split(",").map((s, i) => s.trim() && (
                      <span key={i} className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-1 rounded-full">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Experience Required</label>
                <input
                  type="text"
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  placeholder="e.g. 2+ years"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
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
                    Creating...
                  </>
                ) : "Create Job →"}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}