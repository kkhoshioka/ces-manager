// Relative path allows it to work on any host/port (localhost, IP, tunnel)
// But for Vercel -> Render, we need absolute path from ENV
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
