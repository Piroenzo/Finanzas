import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function Register({ goLogin }) {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password);
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-bold">Crear cuenta</h2>
      <p className="mt-1 text-slate-400 text-sm">
        Registrate y empezá a controlar tu guita.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-3 outline-none focus:border-slate-600"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <input
          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-3 outline-none focus:border-slate-600"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />

        {error && (
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-white text-slate-950 py-3 font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>

      <button
        onClick={goLogin}
        className="mt-4 text-sm text-slate-300 underline"
      >
        Ya tengo cuenta → Login
      </button>
    </div>
  );
}
