"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Dashboard() {
  const [name, setName] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 1. LIVE STATS STATE
  const [dashboardStats, setDashboardStats] = useState({
    totalJobs: 0,
    totalResumes: 0,
    ranked: 0
  });

  useEffect(() => {
    const storedName = localStorage.getItem("name");
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setName(storedName || "User");
    
    // Dono cheezein fetch karo
    fetchJobs(token);
    fetchStats(token); 
  }, []);

  const fetchJobs = async (token: string) => {
    try {
      const res = await fetch("http://localhost:5000/api/jobs/all", {
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

  // 2. FETCH LIVE STATS FUNCTION
  const fetchStats = async (token: string) => {
    try {
      const res = await fetch("http://localhost:5000/api/jobs/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDashboardStats({
        totalJobs: data.totalJobs || 0,
        totalResumes: data.totalResumes || 0,
        ranked: data.ranked || 0
      });
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    window.location.href = "/login";
  };

  // 3. UPDATED STATS ARRAY (Using dynamic values)
  const stats = [
    { label: "Total Jobs", value: dashboardStats.totalJobs, icon: "💼", change: "+12%" },
    { label: "Resumes", value: dashboardStats.totalResumes, icon: "📄", change: "+5%" },
    { label: "Ranked", value: dashboardStats.ranked, icon: "🏆", change: "+18%" },
  ];

  const chartData = [
    { name: "Mon", jobs: 2 },
    { name: "Tue", jobs: 5 },
    { name: "Wed", jobs: 3 },
    { name: "Thu", jobs: 6 },
    { name: "Fri", jobs: 4 },
    { name: "Sat", jobs: 7 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a1a2e] text-white">

      {/* Navbar - Kept Exactly Same */}
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold">S</div>
          <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">SmartHire</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">👋 {name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-4 py-1.5 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header - Kept Exactly Same */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-10"
        >
          <div>
            <h1 className="text-3xl font-black mb-1">Dashboard</h1>
            <p className="text-gray-400">Manage your job postings</p>
          </div>

          <Link
            href="/dashboard/create-job"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 rounded-xl font-semibold hover:scale-105 transition"
          >
            + New Job
          </Link>
        </motion.div>

        {/* Stats - Animations and Style Preserved */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.04 }}
              className="relative bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 opacity-0 hover:opacity-100 transition" />

              <div className="relative z-10">
                <div className="text-3xl mb-3">{stat.icon}</div>

                <div className="flex items-center gap-2">
                  <div className="text-3xl font-black text-white">
                    {stat.value}
                  </div>
                  <span className="text-green-400 text-sm font-semibold">
                    {stat.change}
                  </span>
                </div>

                <div className="text-gray-400 text-sm mt-1">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Chart - Kept Exactly Same */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10">
          <h2 className="text-lg font-bold mb-4">Hiring Activity</h2>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: "#111", border: "none" }} />
                <Line
                  type="monotone"
                  dataKey="jobs"
                  stroke="url(#gradient)"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Jobs List - Kept Exactly Same with Animations */}
        <div>
          <h2 className="text-xl font-bold mb-5">Your Jobs</h2>

          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
              <div className="text-5xl mb-4">💼</div>
              <h3 className="text-xl font-bold mb-2">No jobs yet</h3>
              <p className="text-gray-400 mb-6">Create your first job</p>
              <Link
                href="/dashboard/create-job"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 rounded-xl font-semibold"
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
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-violet-500/30"
                >
                  <h3 className="font-bold text-lg mb-2">{job.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{job.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.required_skills?.slice(0, 3).map((skill: string, j: number) => (
                      <span key={j} className="text-xs bg-white/10 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/dashboard/job/${job._id}`}
                    className="text-violet-400 text-sm hover:underline"
                  >
                    View Candidates →
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}