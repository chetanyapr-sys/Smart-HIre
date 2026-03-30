"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (prefersReduced) { setCount(target); return; }
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(target);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, prefersReduced]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

function FadeIn({ children, delay = 0, direction = "up" }: any) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  const variants = {
    hidden: {
      opacity: 0,
      y: prefersReduced ? 0 : direction === "up" ? 30 : direction === "down" ? -30 : 0,
      x: prefersReduced ? 0 : direction === "left" ? 30 : direction === "right" ? -30 : 0,
    },
    visible: { opacity: 1, y: 0, x: 0 },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function TypeWriter({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

  useEffect(() => {
    const current = words[index % words.length];
    if (phase === "typing") {
      if (text === current) {
        const t = setTimeout(() => setPhase("pausing"), 1800);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setText(current.slice(0, text.length + 1)), 160);
      return () => clearTimeout(t);
    }
    if (phase === "pausing") {
      const t = setTimeout(() => setPhase("deleting"), 500);
      return () => clearTimeout(t);
    }
    if (phase === "deleting") {
      if (text === "") { setIndex(i => i + 1); setPhase("typing"); return; }
      const t = setTimeout(() => setText(text.slice(0, -1)), 80);
      return () => clearTimeout(t);
    }
  }, [text, phase, index, words]);

  return (
    <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
      {text}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
      >|</motion.span>
    </span>
  );
}

const particles = Array.from({ length: 20 }, (_, i) => ({
  left: `${(i * 5.3) % 100}%`,
  top: `${(i * 7.7) % 100}%`,
  duration: 3 + (i % 4),
  delay: i % 3,
}));

const candidates = [
  { initials: "AP", name: "Arjun Patel", skills: "React, TypeScript, AWS", score: "95%", match: "bg-green-500/20 text-green-400", width: "95%" },
  { initials: "SP", name: "Sneha Rao", skills: "Python, ML, FastAPI", score: "87%", match: "bg-yellow-500/20 text-yellow-400", width: "87%" },
  { initials: "KM", name: "Kunal Mehta", skills: "Next.js, Node, MongoDB", score: "76%", match: "bg-orange-500/20 text-orange-400", width: "76%" },
];

const testimonials = [
  { name: "Priya Sharma", role: "Head of HR, Razorpay", text: "We screened 200 resumes in 20 minutes. Our hiring manager nearly cried tears of joy.", avatar: "PS" },
  { name: "Rohan Verma", role: "CTO, HealthStack", text: "The AI matching is scary good. It shortlisted exactly the candidates we'd have picked manually.", avatar: "RV" },
  { name: "Emily Chen", role: "Talent Lead, FinServe", text: "I've tried 5 other tools. SmartHire is the first one I'd actually recommend to a friend.", avatar: "EC" },
];

const pricing = [
  { plan: "Free", price: "0", desc: "Perfect for trying things out", features: ["10 resumes/month", "1 job posting", "Basic AI scoring", "Email support"], cta: "Get Started", highlight: false },
  { plan: "Pro", price: "999", desc: "For growing teams", features: ["Unlimited resumes", "10 job postings", "Advanced AI + NLP", "Priority support", "Analytics dashboard", "Export to CSV"], cta: "Start Free Trial", highlight: true },
  { plan: "Enterprise", price: "Custom", desc: "For serious hiring at scale", features: ["Everything in Pro", "Unlimited job postings", "Custom AI model", "Dedicated support", "API access", "SSO & Security"], cta: "Contact Us", highlight: false },
];

if (typeof window !== "undefined") {
  console.log("%c👋 Hey developer!", "font-size: 20px; font-weight: bold; color: #8b5cf6;");
  console.log("%cYou found the easter egg. SmartHire is built by Chetanya Prakash. We're hiring! 😄", "color: #a78bfa; font-size: 14px;");
}

export default function Home() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial(i => (i + 1) % testimonials.length), 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans overflow-x-hidden">

      {/* Navbar — same as original but z-[999] */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-[999] bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/10 px-8 py-4 flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold">S</div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">SmartHire</h1>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          {["Features", "How it Works", "Pricing", "Stats"].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="hover:text-white transition-colors">{item}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">Login</a>
          <a href="/signup" className="text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2 rounded-full transition-all hover:scale-105">
            Get Started
          </a>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-8 pt-24 pb-16 overflow-hidden">
        {!prefersReduced && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-violet-400/25 rounded-full"
                style={{ left: p.left, top: p.top }}
                animate={{ y: [0, -25, 0], opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
              />
            ))}
          </div>
        )}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[280px] h-[280px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm px-4 py-2 rounded-full mb-8"
          >
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
            AI-Powered Recruitment Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl md:text-8xl font-black mb-6 leading-[1.1] tracking-tight"
          >
            Hire the{" "}
            <TypeWriter words={["Best Talent", "Right People", "Top Engineers", "Dream Team"]} />
            <br />
            <span className="text-white">10x Faster</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload resumes, define requirements, and let AI rank every candidate instantly.
            Stop reading 200 resumes manually — that's what we're here for.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
          >
            <a href="/signup" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 hover:scale-105">
              Start Hiring Smarter →
            </a>
            <a href="#how-it-works" className="border border-white/10 hover:border-white/25 text-gray-300 hover:text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:bg-white/5">
              See How It Works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-4xl bg-[#12121a] border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/60"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-4 text-gray-500 text-xs">SmartHire — Candidate Rankings</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {candidates.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-[#1a1a2e] rounded-xl p-4 border border-white/5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold">
                      {c.initials}
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.match}`}>{c.score}</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{c.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{c.skills}</div>
                  <div className="mt-3 bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: c.width }}
                      transition={{ delay: 1.6 + i * 0.12, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-24 px-8 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { target: 10000, suffix: "+", label: "Resumes Analyzed", icon: "📄" },
            { target: 500, suffix: "+", label: "Companies Trust Us", icon: "🏢" },
            { target: 98, suffix: "%", label: "Accuracy Rate", icon: "🎯" },
          ].map((stat, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="bg-white/4 border border-white/10 rounded-2xl p-8 hover:border-violet-500/25 transition-all duration-300">
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-5xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                  <AnimatedCounter target={stat.target} />{stat.suffix}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Everything you need to{" "}
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">hire better</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Built for modern teams who'd rather be interviewing great candidates than reading bad resumes.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "🧠", title: "AI Resume Scoring", desc: "Advanced NLP scores every resume against your job description. No gut feeling required." },
              { icon: "⚡", title: "Instant Ranking", desc: "Process 100+ resumes in seconds. What used to take days now takes a coffee break." },
              { icon: "🎯", title: "Skill Extraction", desc: "Automatically pull skills, experience, and qualifications from any resume format." },
              { icon: "📊", title: "Analytics Dashboard", desc: "Visualize your hiring pipeline. Spot skill gaps before they become a problem." },
              { icon: "🔒", title: "Secure & Private", desc: "Enterprise-grade encryption. Your candidates' data stays yours, always." },
              { icon: "📄", title: "PDF Support", desc: "Upload any PDF — our parser handles every layout, font, and format out there." },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/3 border border-white/8 hover:border-violet-500/25 rounded-2xl p-6 cursor-default h-full"
                >
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-8 bg-white/2">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-black mb-3">
              How it <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-gray-400 text-lg mb-16">3 steps. No PhD required.</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: "📝", title: "Post a Job", desc: "Add your job title, required skills, and description. Takes 2 minutes." },
              { step: "02", icon: "📤", title: "Upload Resumes", desc: "Drop in any number of PDF resumes. We handle the rest." },
              { step: "03", icon: "🏆", title: "Get Rankings", desc: "AI scores and ranks every candidate. You just pick your top 3." },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.12}>
                <motion.div
                  whileHover={{ scale: 1.03, y: -3 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#12121a] border border-white/8 rounded-2xl p-8 hover:border-violet-500/25 transition-colors"
                >
                  <div className="text-violet-500/70 text-xs font-bold tracking-widest mb-4">STEP {s.step}</div>
                  <div className="text-4xl mb-4">{s.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-black mb-3">
              Loved by <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">recruiters</span>
            </h2>
            <p className="text-gray-400 text-lg mb-14">Don't take our word for it.</p>
          </FadeIn>
          <div className="relative min-h-[220px]">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{ opacity: activeTestimonial === i ? 1 : 0, y: activeTestimonial === i ? 0 : 10 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`${activeTestimonial === i ? "block" : "hidden"} bg-[#12121a] border border-white/8 rounded-2xl p-8`}
              >
                <div className="text-3xl text-violet-400/60 mb-4 text-left">"</div>
                <p className="text-lg text-gray-300 mb-6 leading-relaxed">{t.text}</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold">{t.avatar}</div>
                  <div className="text-left">
                    <div className="font-semibold text-white text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${activeTestimonial === i ? "bg-violet-400 w-6" : "bg-white/15 w-1.5"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-8 bg-white/2">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-3">
                Simple <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Pricing</span>
              </h2>
              <p className="text-gray-400 text-lg">Start free. No credit card needed. No surprises.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {pricing.map((p, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className={`relative rounded-2xl p-7 border h-full flex flex-col ${p.highlight ? "bg-gradient-to-b from-violet-600/15 to-indigo-600/8 border-violet-500/40" : "bg-white/3 border-white/8"}`}
                >
                  {p.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full tracking-wide">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-white mb-1">{p.plan}</h3>
                    <p className="text-gray-500 text-xs mb-3">{p.desc}</p>
                    <div className="flex items-end gap-1">
                      {p.price !== "Custom" && <span className="text-gray-400">₹</span>}
                      <span className="text-4xl font-black text-white">{p.price}</span>
                      {p.price !== "Custom" && <span className="text-gray-500 text-sm mb-1">/mo</span>}
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-gray-300 text-sm">
                        <span className="text-violet-400 text-xs">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <a href="/signup" className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 ${p.highlight ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white" : "border border-white/15 text-white hover:bg-white/8"}`}>
                    {p.cta}
                  </a>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/8 to-indigo-600/8 pointer-events-none" />
        <FadeIn>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black mb-5 leading-tight">
              Ready to hire{" "}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">smarter?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10">Join hundreds of teams who stopped drowning in resumes.</p>
            <motion.a
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              href="/signup"
              className="inline-block bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-10 py-4 rounded-xl text-lg font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-shadow"
            >
              Start Free Today →
            </motion.a>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-8 py-7 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-md" />
          <span className="font-semibold text-gray-500 text-sm">SmartHire</span>
        </div>
        <p className="text-gray-600 text-xs">© 2024 SmartHire · Built with ❤️ by Chetanya Prakash</p>
        <div className="flex gap-5 text-xs text-gray-600">
          <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
          <a href="#" className="hover:text-gray-400 transition-colors">Contact</a>
        </div>
      </footer>

    </div>
  );
}