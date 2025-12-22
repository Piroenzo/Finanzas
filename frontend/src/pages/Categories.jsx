import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Categories() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [error, setError] = useState("");

  const load = async () => {
    const data = await api("/categories", { token });
    setItems(data);
  };

  useEffect(() => {
    load().catch((e) => setError(e.message || "Error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      setError("");
      await api("/categories", { method: "POST", token, body: { name, type } });
      setName("");
      await load();
    } catch (e2) {
      setError(e2.message || "Error");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Categorías</h2>

      <form
        onSubmit={create}
        className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre (ej: Comida, Sueldo)"
            className="sm:col-span-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-3 outline-none focus:border-slate-600"
            required
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-3 outline-none focus:border-slate-600"
          >
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
        </div>

        {error && (
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm">
            {error}
          </div>
        )}

        <button className="rounded-xl bg-white text-slate-950 px-4 py-2 font-semibold hover:opacity-90">
          Agregar categoría
        </button>
      </form>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-300">Listado</p>
          <button
            onClick={() => load().catch((e) => setError(e.message || "Error"))}
            className="text-sm underline text-slate-300"
          >
            Refrescar
          </button>
        </div>

        <div className="grid gap-2">
          {items.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-slate-400">
                  {c.type === "income" ? "Ingreso" : "Gasto"}
                </p>
              </div>
              <span className="text-xs text-slate-500">#{c.id}</span>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-sm text-slate-400">No hay categorías todavía.</p>
          )}
        </div>
      </div>
    </div>
  );
}
