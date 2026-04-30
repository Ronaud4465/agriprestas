import { useState } from "react";
import { supabase } from "./supabase";

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset"
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
    if (error) setErr(error.message);
    setLoading(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true); setErr(""); setMsg("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setErr(error.message); setLoading(false); return; }
    // Créer le profil
    if (data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, nom, email });
    }
    setMsg("✅ Compte créé ! Vérifiez votre email pour confirmer.");
    setLoading(false);
  }

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true); setErr(""); setMsg("");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setErr(error.message);
    else setMsg("✅ Email de réinitialisation envoyé !");
    setLoading(false);
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-logo">🌿</div>
        <h1 className="auth-title">FieldLog</h1>
        <p className="auth-sub">Suivi des prestations · Indépendant</p>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "on" : ""}`} onClick={() => { setMode("login"); setErr(""); setMsg(""); }}>
            Connexion
          </button>
          <button className={`auth-tab ${mode === "signup" ? "on" : ""}`} onClick={() => { setMode("signup"); setErr(""); setMsg(""); }}>
            Créer un compte
          </button>
        </div>

        {mode === "login" && (
          <form onSubmit={handleLogin} className="auth-form">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="votre@email.com" />
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            {err && <div className="auth-err">{err}</div>}
            {msg && <div className="auth-msg">{msg}</div>}
            <button type="submit" className="btn auth-btn" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>
            <button type="button" className="auth-link" onClick={() => { setMode("reset"); setErr(""); setMsg(""); }}>
              Mot de passe oublié ?
            </button>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignup} className="auth-form">
            <label>Nom</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)} required placeholder="Votre nom" />
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="votre@email.com" />
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 caractères" minLength={6} />
            {err && <div className="auth-err">{err}</div>}
            {msg && <div className="auth-msg">{msg}</div>}
            <button type="submit" className="btn auth-btn" disabled={loading}>
              {loading ? "Création…" : "Créer mon compte"}
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={handleReset} className="auth-form">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="votre@email.com" />
            {err && <div className="auth-err">{err}</div>}
            {msg && <div className="auth-msg">{msg}</div>}
            <button type="submit" className="btn auth-btn" disabled={loading}>
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>
            <button type="button" className="auth-link" onClick={() => { setMode("login"); setErr(""); setMsg(""); }}>
              ← Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
