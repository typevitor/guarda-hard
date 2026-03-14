"use client";

import { useState } from "react";

import { FeedbackBanner } from "@/components/ui/feedback-banner";

import { LoginForm } from "../forms/login-form";
import { RegisterForm } from "../forms/register-form";
import type { AuthEmpresa, LoginPayload, RegisterPayload } from "../schemas/auth-schema";

type AuthPageProps = {
  empresas: AuthEmpresa[];
  onLoginSubmit: (values: LoginPayload) => Promise<void>;
  onRegisterSubmit: (values: RegisterPayload) => Promise<void>;
};

export function AuthPage({ empresas, onLoginSubmit, onRegisterSubmit }: AuthPageProps) {
  const [activePanel, setActivePanel] = useState<"login" | "register">("login");
  const [registerFeedback, setRegisterFeedback] = useState<string | null>(null);

  const handleRegisterSubmit = async (values: RegisterPayload): Promise<void> => {
    await onRegisterSubmit(values);
    setRegisterFeedback("Conta criada com sucesso. Agora faca login.");
    setActivePanel("login");
  };

  return (
    <section className="auth-home" aria-label="Autenticacao">
      <header className="auth-home-header">
        <h1 className="panel-title">GuardaHard</h1>
        <p className="panel-text">Acesse sua conta ou crie um novo usuario.</p>
      </header>

      <div className="auth-panel-toggle" role="tablist" aria-label="Escolha de painel">
        <button
          type="button"
          role="tab"
          aria-selected={activePanel === "login"}
          className={activePanel === "login" ? "btn-primary" : "btn-ghost"}
          onClick={() => setActivePanel("login")}
        >
          Login
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activePanel === "register"}
          className={activePanel === "register" ? "btn-primary" : "btn-ghost"}
          onClick={() => {
            setRegisterFeedback(null);
            setActivePanel("register");
          }}
        >
          Registrar
        </button>
      </div>

      {activePanel === "login" ? (
        <div className="auth-panel" role="tabpanel" aria-label="Painel de login">
          {registerFeedback ? <FeedbackBanner type="success" message={registerFeedback} /> : null}
          <LoginForm onSubmit={onLoginSubmit} />
        </div>
      ) : (
        <div className="auth-panel" role="tabpanel" aria-label="Painel de registro">
          <RegisterForm empresas={empresas} onSubmit={handleRegisterSubmit} />
        </div>
      )}
    </section>
  );
}
