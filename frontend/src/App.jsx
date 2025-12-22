import React, { useState } from "react";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";

function AppInner() {
  const { isAuthed } = useAuth();
  const [route, setRoute] = useState("dashboard");
  const [authRoute, setAuthRoute] = useState("login");

  if (!isAuthed) {
    return (
      <Layout
        title={authRoute === "login" ? "Login" : "Registro"}
        route=""
        setRoute={() => {}}
      >
        {authRoute === "login" ? (
          <Login goRegister={() => setAuthRoute("register")} />
        ) : (
          <Register goLogin={() => setAuthRoute("login")} />
        )}
      </Layout>
    );
  }

  return (
    <Layout title="Panel" route={route} setRoute={setRoute}>
      {route === "dashboard" && <Dashboard />}
      {route === "transactions" && <Transactions />}
      {route === "categories" && <Categories />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
