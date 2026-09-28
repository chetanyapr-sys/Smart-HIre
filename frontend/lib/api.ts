// Deployment me is env variable ko production backend URL pe set karo
// (Vercel dashboard me NEXT_PUBLIC_API_URL naam se add karna)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";