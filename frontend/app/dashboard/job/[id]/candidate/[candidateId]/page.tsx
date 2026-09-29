"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, User, FileText, Globe, Eye, StickyNote, Send } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function CandidateDetail() {
  const params = useParams();
  const jobId = params.id as string;
  const candidateId = params.candidateId as string;

  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const loadCandidate = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/resume/candidate/${candidateId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Token expire ho gaya ya invalid hai -> dobara login
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        // Candidate nahi mila (galat ID ya dusri team ka) -> "not found" dikhao
        if (!res.ok) {
          setCandidate(null);
          setNotesLoading(false);
          return;
        }

        const data = await res.json();
        setCandidate(data);
        fetchNotes();
      } catch {
        console.error("Failed to fetch candidate");
        setCandidate(null);
        setNotesLoading(false);
      } finally {
        setLoading(false);
      }
    };

    loadCandidate();
  }, [candidateId]);

  const fetchNotes = async () => {
    setNotesLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/resume/notes/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch notes");
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setNoteError("");
    setAddingNote(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/resume/notes/${candidateId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newNote.trim() }),
      });

      if (!res.ok) {
        setNoteError("Failed to add note.");
        return;
      }

      const data = await res.json();
      // Naya note list ke top pe daal do (newest-first order)
      setNotes((prev) => [data.note, ...prev]);
      setNewNote("");
    } catch {
      setNoteError("Failed to add note.");
    } finally {
      setAddingNote(false);
    }
  };

  const handleStatus = async (status: string) => {
    const previousStatus = candidate?.status;
    // Pehle screen pe turant badlo (optimistic update)
    setCandidate((prev: any) => ({ ...prev, status }));
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/resume/status/${candidateId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      // Save fail hua toh screen pe purana status wapas dikhao
      if (!res.ok) {
        setCandidate((prev: any) => ({ ...prev, status: previousStatus }));
      }
    } catch {
      console.error("Failed to update status");
      setCandidate((prev: any) => ({ ...prev, status: previousStatus }));
    }
  };

  // PDF ko naye tab me kholna hai, lekin route protected (@token_required) hai
  // isliye plain <a href> se nahi khul sakta (token header nahi bhej sakta) -
  // isliye fetch karke blob banate hain, phir usse naye tab me kholte hain
  const handleViewPdf = async () => {
    setPdfError("");
    setPdfLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/resume/pdf/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setPdfError("Resume PDF not available for this candidate.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      setPdfError("Failed to load resume PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500 dark:text-green-400 bg-green-500/10 border-green-500/20";
    if (score >= 60) return "text-yellow-500 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    return "text-orange-500 dark:text-orange-400 bg-orange-500/10 border-orange-500/20";
  };

  const formatNoteTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="max-w-3xl mx-auto px-8 py-10">
        <Link
          href={candidate ? `/dashboard/job/${jobId}` : "/dashboard"}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-6"
        >
          <ArrowLeft size={15} /> {candidate ? "Back to candidates" : "Back to dashboard"}
        </Link>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : !candidate ? (
          <div className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl p-16 text-center">
            <h3 className="text-lg font-bold mb-2">Candidate not found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This candidate doesn&apos;t exist, or you don&apos;t have access to it.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-full bg-violet-500 text-white hover:bg-violet-600 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header card */}
            <div className="bg-black/[0.02] dark:bg-[#12121a] border border-black/10 dark:border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-black mb-1">
                    {candidate.name || candidate.filename?.replace(".pdf", "")}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    {candidate.source === "public_application" ? (
                      <span className="flex items-center gap-1">
                        <Globe size={12} /> Applied via job listing
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <FileText size={12} /> Uploaded by recruiter
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-sm font-bold px-3 py-1.5 rounded-full border shrink-0 ${getScoreColor(candidate.score)}`}>
                  {candidate.score}% match
                </span>
              </div>

              {(candidate.name || candidate.email) && (
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {candidate.name && (
                    <span className="flex items-center gap-1.5">
                      <User size={14} /> {candidate.name}
                    </span>
                  )}
                  {candidate.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail size={14} /> {candidate.email}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-5">
                {candidate.skills?.map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatus("shortlisted")}
                  className={`px-4 py-2 text-sm rounded-full border transition ${
                    candidate.status === "shortlisted"
                      ? "bg-green-500 text-white border-transparent"
                      : "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20"
                  }`}
                >
                  ✅ Shortlist
                </button>
                <button
                  onClick={() => handleStatus("rejected")}
                  className={`px-4 py-2 text-sm rounded-full border transition ${
                    candidate.status === "rejected"
                      ? "bg-red-500 text-white border-transparent"
                      : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20"
                  }`}
                >
                  ❌ Reject
                </button>
                <button
                  onClick={handleViewPdf}
                  disabled={pdfLoading}
                  className="px-4 py-2 text-sm rounded-full border border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Eye size={14} /> {pdfLoading ? "Opening..." : "View Original PDF"}
                </button>
              </div>

              {pdfError && (
                <p className="text-xs text-red-500 mt-3">{pdfError}</p>
              )}
            </div>

            {/* Full resume text */}
            <div className="bg-black/[0.02] dark:bg-[#12121a] border border-black/10 dark:border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Full Resume Text
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed max-h-[500px] overflow-y-auto">
                {candidate.text || "No resume text extracted."}
              </p>
            </div>

            {/* Internal notes */}
            <div className="bg-black/[0.02] dark:bg-[#12121a] border border-black/10 dark:border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <StickyNote size={14} /> Internal Notes
              </h2>

              {/* Add note form */}
              <div className="flex flex-col gap-2 mb-5">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this candidate (only your team can see this)..."
                  rows={3}
                  className="w-full text-sm bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 resize-none"
                />
                <div className="flex items-center justify-between">
                  {noteError && <p className="text-xs text-red-500">{noteError}</p>}
                  <button
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="ml-auto px-4 py-2 text-sm rounded-full bg-violet-500 text-white hover:bg-violet-600 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send size={13} /> {addingNote ? "Adding..." : "Add Note"}
                  </button>
                </div>
              </div>

              {/* Notes list */}
              {notesLoading ? (
                <p className="text-sm text-gray-500">Loading notes...</p>
              ) : notes.length === 0 ? (
                <p className="text-sm text-gray-500">No notes yet. Add one above.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                  {notes.map((note, i) => (
                    <div
                      key={i}
                      className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3"
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line mb-2">
                        {note.text}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium text-violet-600 dark:text-violet-400">
                          {note.author_name || "Unknown"}
                        </span>
                        <span>•</span>
                        <span>{formatNoteTime(note.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}