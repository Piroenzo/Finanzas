import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { monthNow, todayISO } from "../utils/date";

export default function Transactions() {
  const { token } = useAuth();
  const [month, setMonth] = useState(monthNow());
  const [categories, setCategories] = useState([]);
  const [txs, setTxs] = useState([]);
  const [error, setError] = useState("");

  // form
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const catsForType = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  // id -> name para pintar categorías en el listado
  const catNameById = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const loadAll = async () => {
    const [cats, movements] = await Promise.all([
      api("/categories", { token }),
      api(`/transactions?month=${month}`, { token }),
    ]);
    setCategories(cats);
    setTxs(movements);
  };

  useEffect(() => {
    loadAll().catch((e) => setError(e.message || "Error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const create = async (e) => {
    e.preventDefault();
    try {
      setError("");

      await api("/transactions", {
        method: "POST",
        token,
        body: {
          type,
          amount: Number(amount),
          date,
          note: note.trim() || null,
          category_id: categoryId ? Number(categoryId) : null,
        },
      });

      setAmount("");
      setNote("");
      setCategoryId("");
      await loadAll();
    } catch (e2) {
      setError(e2.message || "Error");
    }
  };

  const del = async (id) => {
    try {
      setError("");
      await api(`/transactions/${id}`, { method: "DELETE", token });
      await loadAll();
    } catch (e2) {
      setError(e2.message || "Error");
    }
  };

  const Pill = ({ children, variant = "neutral" }) => {
    const base =
      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium";
    const variants = {
      income: "border-emerald-900/70 bg-emerald-950/40 text-emerald-200",
      expense: "border-rose-900/70 bg-rose-950/40 text-rose-200",
      neutral: "border-slate-800 bg-slate-950/40 text-slate-200",
    };
    return (
      <span className={`${base} ${variants[variant] || variants.neutral}`}>
        {children}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Movimientos</h2>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Mes:</span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-sm outline-none focus:border-slate-600"
          />
        </div>
      </div>

      <form
        onSubmit={create}
        className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3"
      >
        <div className="grid gap-3 sm:grid-cols-6">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setCategoryId("");
            }}
            className="sm:col-span-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-3 outline-none focus:border-slate-600"
          >
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Monto"
            type="number"
            min="0"
            step="0.01"
            className="sm:col-span-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-3 outline-none focus:border-slate-600"
            required
          />

          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            className="sm:col-span-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-3 outline-none focus:border-slate-600"
          />

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="sm:col-span-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-3 outline-none focus:border-slate-600"
          >
            <option value="">Sin cat.</option>
            {catsForType.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota (opcional)"
          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-3 outline-none focus:border-slate-600"
        />

        {error && (
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm">
            {error}
          </div>
        )}

        <button className="rounded-xl bg-white text-slate-950 px-4 py-2 font-semibold hover:opacity-90">
          Agregar movimiento
        </button>
      </form>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-300">Listado</p>
          <button
            onClick={() =>
              loadAll().catch((e) => setError(e.message || "Error"))
            }
            className="text-sm underline text-slate-300"
          >
            Refrescar
          </button>
        </div>

        <div className="grid gap-2">
          {txs.map((t) => {
            const catName = t.category_id
              ? catNameById.get(t.category_id) || `#${t.category_id}`
              : "Sin cat.";

            const isIncome = t.type === "income";
            const amountClass = isIncome ? "text-emerald-200" : "text-rose-200";

            return (
              <div
                key={t.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3"
              >
                <div className="space-y-1">
                  {/* LINEA GRANDE */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill variant={isIncome ? "income" : "expense"}>
                      {isIncome ? "Ingreso" : "Gasto"}
                    </Pill>

                    <p className={`font-semibold ${amountClass}`}>
                      ${Number(t.amount).toLocaleString("es-AR")}
                    </p>

                    <Pill variant="neutral">{catName}</Pill>
                  </div>

                  {/* LINEA CHICA */}
                  <p className="text-xs text-slate-400">
                    {t.date}
                    {t.note ? ` • ${t.note}` : ""}
                  </p>
                </div>

                <button
                  onClick={() => del(t.id)}
                  className="self-start sm:self-auto rounded-xl border border-slate-800 px-3 py-2 text-sm hover:bg-slate-900"
                >
                  Borrar
                </button>
              </div>
            );
          })}

          {txs.length === 0 && (
            <p className="text-sm text-slate-400">
              No hay movimientos en este mes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
