import React from "react";
import { useAuth } from "../auth/AuthContext";

export default function Layout({ title, route, setRoute, children }) {
  const { isAuthed, logout } = useAuth();

  const NavBtn = ({ id, label }) => (
    <button
      onClick={() => setRoute(id)}
      className={[
        "rounded-xl px-3 py-2 text-sm border",
        route === id
          ? "bg-white text-slate-950 border-white"
          : "border-slate-800 text-slate-200 hover:bg-slate-900",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Fin de Mes</h1>
            <p className="text-xs text-slate-400">{title}</p>
          </div>

          <div className="flex items-center gap-2">
            {isAuthed && (
              <>
                <NavBtn id="dashboard" label="Dashboard" />
                <NavBtn id="transactions" label="Movimientos" />
                <NavBtn id="categories" label="Categorías" />
                <button
                  onClick={logout}
                  className="rounded-xl border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900"
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
