"use client";
import { useEffect, useState } from "react";
import { getToken, clearTokens } from "../../lib/auth";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return router.push("/login");
    fetch("http://localhost:4000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { clearTokens(); router.push("/login"); }
        else setUser(data.user);
      });
  }, []);

  const logout = () => { clearTokens(); router.push("/login"); };

  if (!user) return <div style={{ background:"#0f172a", minHeight:"100vh", color:"white", display:"flex", alignItems:"center", justifyContent:"center" }}>Loading...</div>;

  return (
    <main style={{ background:"#0f172a", minHeight:"100vh", padding:"2rem", color:"white" }}>
      <div style={{ maxWidth:"800px", margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"2rem" }}>
          <h1 style={{ color:"#818cf8", fontSize:"1.8rem" }}>AI Meeting Platform</h1>
          <button onClick={logout} style={{ padding:"0.5rem 1rem", background:"#334155", color:"white", border:"none", borderRadius:"8px", cursor:"pointer" }}>
            Logout
          </button>
        </div>
        <div style={{ background:"#1e293b", padding:"1.5rem", borderRadius:"12px", marginBottom:"1.5rem" }}>
          <h2 style={{ color:"#f1f5f9" }}>Welcome, {user.name}! 👋</h2>
          <p style={{ color:"#94a3b8" }}>{user.email}</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
          {[
            { label:"Start Meeting", icon:"🎥", color:"#6366f1" },
            { label:"Join Meeting", icon:"🔗", color:"#0d9488" },
            { label:"Schedule Meeting", icon:"📅", color:"#f59e0b" },
            { label:"View Recordings", icon:"📹", color:"#ec4899" },
          ].map((item) => (
            <div key={item.label} style={{ background:"#1e293b", padding:"1.5rem", borderRadius:"12px", cursor:"pointer", borderLeft:`4px solid ${item.color}` }}>
              <div style={{ fontSize:"2rem" }}>{item.icon}</div>
              <p style={{ color:"#f1f5f9", marginTop:"0.5rem", fontWeight:"600" }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}