import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { monthNow } from "../utils/date";

export default function Dashboard() {
  const { token } = useAuth();
  const [month, setMonth] = useState(monthNow());
  const [txs, setTxs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError("");
        const [movs, cats] = await Promise.all([
          api(`/transactions?month=${month}`, { token }),
          api(`/categories`, { token }),
        ]);
        if (!alive) return;
        setTxs(movs);
        setCategories(cats);
      } catch (e) {
        if (alive) setError(e.message || "Error");
      }
    })();
    return () => (alive = false);
  }, [month, token]);

  const catNameById = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const summary = useMemo(() => {
    const incomes = txs
      .filter((t) => t.type === "income")
      .reduce((a, t) => a + (t.amount || 0), 0);

    const expenses = txs
      .filter((t) => t.type === "expense")
      .reduce((a, t) => a + (t.amount || 0), 0);

    return {
      incomes,
      expenses,
      balance: incomes - expenses,
      count: txs.length,
    };
  }, [txs]);

  const topByCategory = useMemo(() => {
    const build = (type) => {
      const totals = new Map(); // catId -> total
      txs
        .filter((t) => t.type === type && t.category_id)
        .forEach((t) => {
          const prev = totals.get(t.category_id) || 0;
          totals.set(t.category_id, prev + (t.amount || 0));
        });

      return Array.from(totals.entries())
        .map(([category_id, total]) => ({
          category_id,
          name: catNameById.get(category_id) || `#${category_id}`,
          total,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    };

    return {
      expense: build("expense"),
      income: build("income"),
    };
  }, [txs, catNameById]);

  const Card = ({ label, value, variant = "neutral" }) => {
    const variants = {
      income: "border-emerald-900/70 bg-emerald-950/30",
      expense: "border-rose-900/70 bg-rose-950/30",
      neutral: "border-slate-800 bg-slate-900/40",
    };

    return (
      <div className={`rounded-2xl border p-4 ${variants[variant]}`}>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold">
          ${Number(value).toLocaleString("es-AR")}
        </p>
      </div>
    );
  };

  const TopList = ({ title, items, variant }) => {
    const titleColor =
      variant === "expense" ? "text-rose-200" : "text-emerald-200";
    const borderColor =
      variant === "expense" ? "border-rose-900/70" : "border-emerald-900/70";
    const bgColor =
      variant === "expense" ? "bg-rose-950/20" : "bg-emerald-950/20";

    return (
      <div className={`rounded-2xl border ${borderColor} ${bgColor} p-4`}>
        <p className={`text-sm font-semibold ${titleColor}`}>{title}</p>
        <div className="mt-3 grid gap-2">
          {items.map((x) => (
            <div
              key={x.category_id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2"
            >
              <span className="text-sm text-slate-200">{x.name}</span>
              <span className="text-sm font-semibold">
                ${Number(x.total).toLocaleString("es-AR")}
              </span>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-slate-400">
              Todavía no hay movimientos con categoría.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>

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

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card label="Ingresos" value={summary.incomes} variant="income" />
        <Card label="Gastos" value={summary.expenses} variant="expense" />
        <Card label="Balance" value={summary.balance} variant="neutral" />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
        Movimientos del mes: <b>{summary.count}</b>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TopList
          title="Top gastos por categoría"
          items={topByCategory.expense}
          variant="expense"
        />
        <TopList
          title="Top ingresos por categoría"
          items={topByCategory.income}
          variant="income"
        />
      </div>
    </div>
  );
}
