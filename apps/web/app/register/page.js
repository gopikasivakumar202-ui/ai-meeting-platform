"use client";
import { useState } from "react";
import { registerUser, saveTokens } from "../../lib/auth";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = await registerUser(form.name, form.email, form.password);
    setLoading(false);
    if (data.error) return setError(data.error);
    saveTokens(data.accessToken, data.refreshToken);
    router.push("/dashboard");
  };

  return (
    <main style={styles.bg}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.sub}>Join the AI Meeting Platform</p>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password (min 6 chars)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p style={styles.link}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#818cf8" }}>Sign in</a>
        </p>
      </div>
    </main>
  );
}

const styles = {
  bg: { minHeight:"100vh", background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center" },
  card: { background:"#1e293b", padding:"2.5rem", borderRadius:"12px", width:"100%", maxWidth:"400px" },
  title: { color:"#f1f5f9", fontSize:"1.8rem", marginBottom:"0.5rem" },
  sub: { color:"#94a3b8", marginBottom:"1.5rem" },
  input: { width:"100%", padding:"0.75rem", marginBottom:"1rem", borderRadius:"8px", border:"1px solid #334155", background:"#0f172a", color:"#f1f5f9", fontSize:"1rem", boxSizing:"border-box" },
  btn: { width:"100%", padding:"0.75rem", background:"#6366f1", color:"white", border:"none", borderRadius:"8px", fontSize:"1rem", cursor:"pointer" },
  error: { color:"#f87171", marginBottom:"1rem" },
  link: { color:"#94a3b8", marginTop:"1rem", textAlign:"center" },
};