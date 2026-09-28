"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Briefcase, Clock, Search } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function PublicJobDetail() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jobs/public/${jobId}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => setJob(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [jobId]);

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

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back to all jobs
        </Link>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : notFound || !job ? (
          <div className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl p-16 text-center">
            <h3 className="text-lg font-bold mb-2">Job not found</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              This job may have been closed or removed.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-black/[0.02] dark:bg-[#12121a] border border-black/10 dark:border-white/10 rounded-2xl p-8">
              <h1 className="text-2xl font-black mb-3">{job.title}</h1>

              <div className="flex flex-wrap gap-3 mb-6 text-sm text-gray-600 dark:text-gray-400">
                {job.experience && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> {job.experience}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} /> Full-time
                </span>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 whitespace-pre-line">
                {job.description}
              </p>

              {job.required_skills?.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/jobs/${jobId}/apply`}
                  className="inline-block bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                  Apply Now →
                </Link>

                {/* Apply kar chuke candidates ke liye application track karne ka link */}
                <Link
                  href={`/jobs/${jobId}/status`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-violet-500/40 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 hover:scale-105 transition-all"
                >
                  <Search size={16} /> Track Application 
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}