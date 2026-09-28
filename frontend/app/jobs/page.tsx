"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Briefcase, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function PublicJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jobs/public`)
      .then((res) => res.json())
      .then((data) => setJobs(data))
      .catch(() => console.error("Failed to fetch jobs"))
      .finally(() => setLoading(false));
  }, []);

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
        <Link
          href="/login"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Recruiter Login →
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-black mb-2">Open Positions</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse current openings and apply directly — no account needed
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl p-16 text-center">
            <Briefcase className="mx-auto mb-4 text-gray-400" size={40} />
            <h3 className="text-lg font-bold mb-2">No open positions right now</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Check back soon for new openings.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job, i) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/jobs/${job._id}`}
                  className="block bg-black/[0.02] dark:bg-[#12121a] border border-black/10 dark:border-white/10 rounded-2xl p-6 hover:border-violet-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{job.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {job.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {job.required_skills?.slice(0, 5).map((skill: string, j: number) => (
                          <span
                            key={j}
                            className="text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-2 py-1 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    {job.experience && (
                      <span className="shrink-0 text-xs bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full text-gray-600 dark:text-gray-400">
                        {job.experience}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}