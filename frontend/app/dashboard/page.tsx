"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

export default function Dashboard() {
  const [name, setName] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [dashboardStats, setDashboardStats] = useState({
    totalJobs: 0,
    totalResumes: 0,
    ranked: 0,
    statusBreakdown: { pending: 0, shortlisted: 0, rejected: 0 },
  });

  useEffect(() => {
    const storedName = localStorage.getItem("name");
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setName(storedName || "User");
    fetchJobs(token);
    fetchStats(token);
  }, []);

  const fetchJobs = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDashboardStats({
        totalJobs: data.totalJobs || 0,
        totalResumes: data.totalResumes || 0,
        ranked: data.ranked || 0,
        statusBreakdown: data.statusBreakdown || { pending: 0, shortlisted: 0, rejected: 0 },
      });
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const stats = [
    { label: "Total Jobs", value: dashboardStats.totalJobs, icon: "💼", change: "+12%" },
    { label: "Resumes", value: dashboardStats.totalResumes, icon: "📄", change: "+5%" },
    { label: "Ranked", value: dashboardStats.ranked, icon: "🏆", change: "+18%" },
  ];

  // Real data - candidates ka status breakdown (fake chart hata diya)
  const chartData = [
    { name: "Pending", count: dashboardStats.statusBreakdown.pending, color: "#a1a1aa" },
    { name: "Shortlisted", count: dashboardStats.statusBreakdown.shortlisted, color: "#22c55e" },
    { name: "Rejected", count: dashboardStats.statusBreakdown.rejected, color: "#ef4444" },
  ];

  return (
    <div className="min-h-screen px-6 py-10 max-w-6xl mx-auto text-gray-900 dark:text-white">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-10"
      >
        <div>
          <h1 className="text-3xl font-black mb-1">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">👋 {name} — manage your job postings</p>
        </div>

        <Link
          href="/dashboard/create-job"
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:scale-105 transition"
        >
          + New Job
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.04 }}
            className="relative bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-6 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 opacity-0 hover:opacity-100 transition" />

            <div className="relative z-10">
              <div className="text-3xl mb-3">{stat.icon}</div>

              <div className="flex items-center gap-2">
                <div className="text-3xl font-black text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <span className="text-green-500 dark:text-green-400 text-sm font-semibold">
                  {stat.change}
                </span>
              </div>

              <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart - ab real candidate pipeline data dikhata hai */}
      <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-6 mb-10">
        <h2 className="text-lg font-bold mb-1">Candidate Pipeline</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Kitne candidates har status me hain (saari jobs milaake)
        </p>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#111", border: "none", borderRadius: 8 }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Jobs List */}
      <div>
        <h2 className="text-xl font-bold mb-5">Your Jobs</h2>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">💼</div>
            <h3 className="text-xl font-bold mb-2">No jobs yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first job</p>
            <Link
              href="/dashboard/create-job"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Create Job →
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {jobs.map((job, i) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-6 hover:border-violet-500/30"
              >
                <h3 className="font-bold text-lg mb-2">{job.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.required_skills?.slice(0, 3).map((skill: string, j: number) => (
                    <span key={j} className="text-xs bg-black/10 dark:bg-white/10 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/dashboard/job/${job._id}`}
                  className="text-violet-600 dark:text-violet-400 text-sm hover:underline"
                >
                  View Candidates →
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}