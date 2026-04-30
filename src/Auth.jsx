import { useState } from "react";
import { supabase } from "./supabase";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setErr(""); setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr("Email ou mot de passe incorrect");
    setLoading(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true); setErr(""); setMsg("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setErr(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, nom, email });
    }
    setMsg("✅ Compte créé ! Vérifiez votre email pour confirmer.");
    setLoading(false);
  }

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true); setErr(""); setMsg("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://agriprestas.vercel.app"
    });
    if (error) setErr(error.message);
    else setMsg("✅ Email de réinitialisation envoyé !");
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
      </div>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
              <circle cx="24" cy="24" r="24" fill="#2d5a27"/>
              <path d="M24 10 C24 10 14 18 14 26 C14 31.5 18.5 36 24 36 C29.5 36 34 31.5 34 26 C34 18 24 10 24 10Z" fill="#a8d5a2" opacity="0.6"/>
              <path d="M24 14 C24 14 17 21 17 27 C17 30.8 20.1 34 24 34 C27.9 34 31 30.8 31 27 C31 21 24 14 24 14Z" fill="#5a9e52"/>
              <path d="M24 18 C24 18 20 23 20 27 C20 29.2 21.8 31 24 31 C26.2 31 28 29.2 28 27 C28 23 24 18 24 18Z" fill="#fff" opacity="0.9"/>
              <line x1="24" y1="31" x2="24" y2="38" stroke="#2d5a27" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="auth-appname">FieldLog</h1>
          <p className="auth-tagline">Suivi des prestations · Indépendant</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "on" : ""}`} onClick={() => { setMode("login"); setErr(""); setMsg(""); }}>Connexion</button>
          <button className={`auth-tab ${mode === "signup" ? "on" : ""}`} onClick={() => { setMode("signup"); setErr(""); setMsg(""); }}>Créer un compte</button>
        </div>

        {mode === "login" && (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="votre@email.com" />
            </div>
            <div className="auth-field">
              <label>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {err && <div className="auth-err">{err}</div>}
            {msg && <div className="auth-msg">{msg}</div>}
            <button type="submit" className="auth-btn" disabled={loading}>{loading ? "Connexion…" : "Se connecter →"}</button>
            <button type="button" className="auth-link" onClick={() => { setMode("reset"); setErr(""); setMsg(""); }}>Mot de passe oublié ?</button>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignup} className="auth-form">
            <div className="auth-field">
              <label>Nom</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} required placeholder="Votre nom" />
            </div>
            <div className="auth-field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="votre@email.com" />
            </div>
            <div className="auth-field">
              <label>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 caractères" minLength={6} />
            </div>
            {err && <div className="auth-err">{err}</div>}
            {msg && <div className="auth-msg">{msg}</div>}
            <button type="submit" className="auth-btn" disabled={loading}>{loading ? "Création…" : "Créer mon compte →"}</button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={handleReset} className="auth-form">
            <p className="auth-reset-info">Entrez votre email pour recevoir un lien de réinitialisation.</p>
            <div className="auth-field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="votre@email.com" />
            </div>
            {err && <div className="auth-err">{err}</div>}
            {msg && <div className="auth-msg">{msg}</div>}
            <button type="submit" className="auth-btn" disabled={loading}>{loading ? "Envoi…" : "Envoyer le lien"}</button>
            <button type="button" className="auth-link" onClick={() => { setMode("login"); setErr(""); setMsg(""); }}>← Retour</button>
          </form>
        )}

        <p className="auth-footer">FieldLog © {new Date().getFullYear()} · Ar.T.Event & Fils</p>
      </div>
    </div>
  );
}
