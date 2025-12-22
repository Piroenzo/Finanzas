import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { monthNow, shiftMonth } from "../utils/date";

function Card({ label, value, variant = "neutral" }) {
  const variants = {
    income: "border-emerald-900/70 bg-emerald-950/30",
    expense: "border-rose-900/70 bg-rose-950/30",
    neutral: "border-slate-800 bg-slate-900/40",
  };

  return (
    <div className={`rounded-2xl border p-4 ${variants[variant]}`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">
        ${Number(value || 0).toLocaleString("es-AR")}
      </p>
    </div>
  );
}

function TopList({ title, items, variant }) {
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
              ${Number(x.total || 0).toLocaleString("es-AR")}
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
}

export default function Dashboard() {
  const { token } = useAuth();

  const [month, setMonth] = useState(monthNow());
  const [txs, setTxs] = useState([]);
  const [categories, setCategories] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [typeFilter, setTypeFilter] = useState("all"); // all | income | expense
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (!token) return;

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const [movs, cats] = await Promise.all([
          api(`/transactions?month=${month}`, { token }),
          api(`/categories`, { token }),
        ]);

        if (!alive) return;

        setTxs(Array.isArray(movs) ? movs : []);
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (e) {
        if (alive) setError(e?.message || "Error");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [month, token, refreshIndex]);

  const catNameById = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const handlePrevMonth = () => setMonth((current) => shiftMonth(current, -1));
  const handleNextMonth = () => setMonth((current) => shiftMonth(current, 1));
  const handleRefresh = () => setRefreshIndex((value) => value + 1);

  const filteredTxs = useMemo(() => {
    if (typeFilter === "all") return txs;
    return txs.filter((t) => t.type === typeFilter);
  }, [txs, typeFilter]);

  const summary = useMemo(() => {
    const incomes = filteredTxs
      .filter((t) => t.type === "income")
      .reduce((a, t) => a + (t.amount || 0), 0);

    const expenses = filteredTxs
      .filter((t) => t.type === "expense")
      .reduce((a, t) => a + (t.amount || 0), 0);

    const count = filteredTxs.length;

    return {
      incomes,
      expenses,
      balance: incomes - expenses,
      count,
      avgTicket: count === 0 ? 0 : (incomes + expenses) / count,
    };
  }, [filteredTxs]);

  // Top por categoría del mes completo (no lo afecto por el filtro "Últimos movimientos")
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

  const sortedByDate = useMemo(() => {
    return [...filteredTxs].sort((a, b) => {
      const aDate = new Date(a.date || 0).getTime();
      const bDate = new Date(b.date || 0).getTime();
      return bDate - aDate;
    });
  }, [filteredTxs]);

  const largestByType = useMemo(() => {
    const findLargest = (type) => {
      const candidates = txs.filter((t) => t.type === type);
      if (candidates.length === 0) return null;
      return candidates.reduce((max, t) =>
        (t.amount || 0) > (max.amount || 0) ? t : max
      );
    };

    return {
      income: findLargest("income"),
      expense: findLargest("expense"),
    };
  }, [txs]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            disabled={loading}
            className="rounded-xl border border-slate-800 px-2 py-2 text-sm text-slate-300 hover:bg-slate-900 disabled:opacity-50"
            title="Mes anterior"
          >
            ←
          </button>

          <span className="text-sm text-slate-400">Mes:</span>

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            disabled={loading}
            className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-sm outline-none focus:border-slate-600"
          />

          <button
            onClick={handleNextMonth}
            disabled={loading}
            className="rounded-xl border border-slate-800 px-2 py-2 text-sm text-slate-300 hover:bg-slate-900 disabled:opacity-50"
            title="Mes siguiente"
          >
            →
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 disabled:opacity-50"
          >
            Actualizar
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
          Cargando datos del mes...
        </div>
      )}

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

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 grid gap-3 sm:grid-cols-3 text-sm text-slate-300">
        <div>
          <p className="text-xs text-slate-400">Movimientos del mes</p>
          <p className="text-lg font-semibold text-white">{summary.count}</p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Ticket promedio</p>
          <p className="text-lg font-semibold text-white">
            ${Number(summary.avgTicket || 0).toLocaleString("es-AR")}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Relación ingreso/gasto</p>
          <p className="text-lg font-semibold text-white">
            {summary.expenses === 0
              ? "Sin gastos"
              : `${((summary.incomes / summary.expenses) * 100).toFixed(0)}%`}
          </p>
        </div>
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

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <p>Últimos movimientos</p>
              <span className="rounded-full border border-slate-800 bg-slate-950 px-2 py-0.5 text-xs text-slate-400">
                {filteredTxs.length} resultados
              </span>
            </div>

            <div className="flex items-center gap-2">
              {["all", "income", "expense"].map((option) => (
                <button
                  key={option}
                  onClick={() => setTypeFilter(option)}
                  className={[
                    "rounded-xl border px-3 py-1 text-xs",
                    typeFilter === option
                      ? "border-white bg-white text-slate-950"
                      : "border-slate-800 text-slate-200 hover:bg-slate-900",
                  ].join(" ")}
                >
                  {option === "all"
                    ? "Todos"
                    : option === "income"
                      ? "Ingresos"
                      : "Gastos"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            {sortedByDate.slice(0, 5).map((t) => {
              const catName = t.category_id
                ? catNameById.get(t.category_id) || `#${t.category_id}`
                : "Sin cat.";
              const isIncome = t.type === "income";
              const amountColor = isIncome ? "text-emerald-200" : "text-rose-200";

              return (
                <div
                  key={t.id}
                  className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${amountColor}`}>
                      ${Number(t.amount || 0).toLocaleString("es-AR")}
                    </span>
                    <span className="text-xs text-slate-400">{t.date}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-0.5">
                      {isIncome ? "Ingreso" : "Gasto"}
                    </span>
                    <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-0.5">
                      {catName}
                    </span>
                    {t.note && <span className="text-slate-400">• {t.note}</span>}
                  </div>
                </div>
              );
            })}

            {sortedByDate.length === 0 && (
              <p className="text-sm text-slate-400">
                Sin movimientos que coincidan con el filtro seleccionado.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 grid gap-3">
          <p className="text-sm text-slate-300">Movimientos destacados</p>

          {["income", "expense"].map((type) => {
            const largest = largestByType[type];
            const label = type === "income" ? "Ingreso más alto" : "Gasto más alto";
            const color = type === "income" ? "text-emerald-200" : "text-rose-200";

            return (
              <div
                key={type}
                className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"
              >
                <p className="text-xs text-slate-400">{label}</p>

                {largest ? (
                  <>
                    <p className={`text-xl font-semibold ${color}`}>
                      ${Number(largest.amount || 0).toLocaleString("es-AR")}
                    </p>
                    <p className="text-xs text-slate-400">{largest.date}</p>

                    <p className="text-sm text-slate-300">
                      {largest.category_id
                        ? catNameById.get(largest.category_id) ||
                          `#${largest.category_id}`
                        : "Sin categoría"}
                    </p>

                    {largest.note && (
                      <p className="text-xs text-slate-400 mt-1">{largest.note}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-400 mt-1">Sin datos disponibles.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

