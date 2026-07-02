"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Posições fixas dos blobs — determinísticas para evitar random no
  // render (regra de pureza do React) e qualquer mismatch de hidratação.
  const blobsData = useMemo(
    () => [
      { size: 320, left: 12, top: 18, animationDelay: -2, animationDuration: 22 },
      { size: 220, left: 68, top: 12, animationDelay: -8, animationDuration: 26 },
      { size: 280, left: 78, top: 62, animationDelay: -14, animationDuration: 19 },
      { size: 190, left: 22, top: 70, animationDelay: -5, animationDuration: 28 },
      { size: 240, left: 45, top: 40, animationDelay: -18, animationDuration: 24 },
      { size: 300, left: 88, top: 30, animationDelay: -11, animationDuration: 20 },
    ],
    []
  );

  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      blobRefs.current.forEach((blob, index) => {
        if (blob) {
          const speed = (index + 1) * 20;
          blob.style.marginLeft = `${x * speed}px`;
          blob.style.marginTop = `${y * speed}px`;
        }
      });
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="yx-login">
      <style>{`
        .yx-login {
          --bg: #071132;
          --bg-2: #0a1a44;
          --brand: #b4c5ff;
          --brand-strong: #dbe1ff;
          --accent: #ffffff;
          --text-dim: rgba(219, 225, 255, 0.55);
          --filter-goo: url('#yx-gooey');
          background: radial-gradient(circle at 30% 20%, var(--bg-2), var(--bg) 70%);
          color: var(--accent);
          height: 100vh;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .yx-login * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }

        .yx-stage {
          position: absolute; inset: 0; z-index: 0;
          filter: var(--filter-goo); opacity: 0.5;
        }
        .yx-blob {
          position: absolute;
          background: linear-gradient(135deg, #004ac6, #2563eb 60%, #7aa2ff);
          border-radius: 50%;
          filter: blur(20px);
          animation: yx-float 20s infinite alternate ease-in-out;
          box-shadow: inset -10px -10px 20px rgba(0,0,0,0.4),
                      10px 10px 30px rgba(122,162,255,0.18);
          transition: margin 0.1s ease-out;
        }
        @keyframes yx-float {
          0% { transform: translate(0,0) scale(1); }
          33% { transform: translate(10vw,20vh) scale(1.2); }
          66% { transform: translate(-5vw,10vh) scale(0.8); }
          100% { transform: translate(5vw,-10vh) scale(1.1); }
        }

        .yx-auth {
          position: relative; z-index: 10;
          width: 100%; max-width: 440px; padding: 40px;
        }
        .yx-brandrow {
          display: flex; align-items: center; gap: 12px; margin-bottom: 40px;
        }
        .yx-logo {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg, #004ac6, #2563eb);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 22px; color: #fff;
          box-shadow: 0 8px 24px rgba(37,99,235,0.4);
        }
        .yx-brandname { font-weight: 800; font-size: 26px; letter-spacing: -1px; }
        .yx-brandsub {
          font-size: 10px; letter-spacing: 3px; text-transform: uppercase;
          color: var(--text-dim); display: block; margin-top: 2px;
        }
        .yx-title {
          font-weight: 800; font-size: 2.6rem; line-height: 1;
          letter-spacing: -1.5px; margin: 0 0 8px;
        }
        .yx-subtitle { color: var(--text-dim); font-size: 14px; margin-bottom: 40px; }

        .yx-group {
          position: relative; margin-bottom: 26px;
          transition: transform 0.4s cubic-bezier(0.2,1,0.3,1);
        }
        .yx-group:focus-within { transform: translateX(8px); }
        .yx-group label {
          display: block; font-size: 11px; letter-spacing: 1px;
          color: var(--text-dim); margin-bottom: 10px; text-transform: uppercase;
          font-weight: 600;
        }
        .yx-field { position: relative; }
        .yx-group input {
          width: 100%; background: transparent; border: none;
          border-bottom: 1px solid rgba(180,197,255,0.18);
          color: var(--accent); padding: 12px 36px 12px 0;
          font-size: 17px; outline: none; transition: border-color 0.4s;
        }
        .yx-group input::placeholder { color: rgba(219,225,255,0.3); }
        /* Mata o fundo branco do autofill do Chrome/Safari e mantém texto claro */
        .yx-group input:-webkit-autofill,
        .yx-group input:-webkit-autofill:hover,
        .yx-group input:-webkit-autofill:focus,
        .yx-group input:-webkit-autofill:active {
          -webkit-text-fill-color: var(--accent);
          caret-color: var(--accent);
          transition: background-color 9999s ease-in-out 0s;
          box-shadow: 0 0 0 1000px transparent inset;
        }
        .yx-glow {
          position: absolute; bottom: 0; left: 0; width: 0%; height: 2px;
          background: var(--brand);
          transition: width 0.6s cubic-bezier(0.2,1,0.3,1);
          box-shadow: 0 0 15px var(--brand);
        }
        .yx-group input:focus ~ .yx-glow { width: 100%; }
        .yx-toggle {
          position: absolute; right: 0; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: var(--text-dim);
          cursor: pointer; padding: 4px; display: flex;
        }
        .yx-toggle:hover { color: var(--brand-strong); }

        .yx-row {
          display: flex; align-items: center; justify-content: space-between;
          margin: -6px 0 30px; font-size: 13px;
        }
        .yx-check { display: flex; align-items: center; gap: 8px; color: var(--text-dim); cursor: pointer; }
        .yx-check input { accent-color: #2563eb; width: 15px; height: 15px; }
        .yx-link { color: var(--brand); text-decoration: none; font-weight: 600; }
        .yx-link:hover { color: var(--brand-strong); text-decoration: underline; }

        .yx-error {
          color: #ffb4ab; font-size: 13px; margin-bottom: 20px;
          background: rgba(186,26,26,0.15); border: 1px solid rgba(255,180,171,0.25);
          padding: 10px 14px; border-radius: 10px;
        }

        .yx-submit-wrap { position: relative; filter: var(--filter-goo); }
        .yx-btn {
          position: relative; z-index: 2; width: 100%;
          background: transparent; color: #fff; border: none;
          padding: 18px 40px; font-size: 14px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 2px; cursor: pointer;
          transition: letter-spacing 0.3s; display: flex;
          align-items: center; justify-content: center; gap: 10px;
        }
        .yx-btn:hover:not(:disabled) { letter-spacing: 4px; }
        .yx-btn:disabled { cursor: not-allowed; opacity: 0.75; }
        .yx-drop {
          position: absolute; top: 50%; left: 50%;
          width: 100%; height: 100%;
          background: linear-gradient(135deg, #004ac6, #2563eb);
          transform: translate(-50%,-50%); z-index: 1; border-radius: 40px;
          transition: all 0.5s cubic-bezier(0.175,0.885,0.32,1.275);
        }
        .yx-submit-wrap:hover .yx-drop {
          transform: translate(-50%,-50%) scale(1.05,1.2); filter: brightness(1.15);
        }
        .yx-submit-wrap:active .yx-drop {
          transform: translate(-50%,-50%) scale(0.98,0.95);
        }

        .yx-foot {
          margin-top: 34px; padding-top: 24px;
          border-top: 1px solid rgba(180,197,255,0.12);
          font-size: 13px; color: var(--text-dim); text-align: center;
        }
        .yx-svg-hidden { position: absolute; width: 0; height: 0; }
      `}</style>

      <svg className="yx-svg-hidden">
        <defs>
          <filter id="yx-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="yx-stage">
        {blobsData.map((data, index) => (
          <div
            key={index}
            ref={(el) => {
              blobRefs.current[index] = el;
            }}
            className="yx-blob"
            style={{
              width: `${data.size}px`,
              height: `${data.size}px`,
              left: `${data.left}%`,
              top: `${data.top}%`,
              animationDelay: `${data.animationDelay}s`,
              animationDuration: `${data.animationDuration}s`,
            }}
          />
        ))}
      </div>

      <main className="yx-auth">
        <div className="yx-brandrow">
          <div className="yx-logo">Y</div>
          <div>
            <div className="yx-brandname">Yuntrix</div>
            <span className="yx-brandsub">CRM de Prospecção</span>
          </div>
        </div>

        <h1 className="yx-title">Bem-vindo de volta</h1>
        <p className="yx-subtitle">Acesse o painel para acompanhar sua prospecção.</p>

        <form action={formAction} autoComplete="on">
          <div className="yx-group">
            <label htmlFor="email">E-mail corporativo</label>
            <div className="yx-field">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nome@empresa.com"
                required
              />
              <div className="yx-glow" />
            </div>
          </div>

          <div className="yx-group">
            <label htmlFor="senha">Senha</label>
            <div className="yx-field">
              <input
                id="senha"
                name="senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="yx-toggle"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                <span className="material-symbols-outlined">
                  {mostrarSenha ? "visibility_off" : "visibility"}
                </span>
              </button>
              <div className="yx-glow" />
            </div>
          </div>

          <div className="yx-row">
            <label className="yx-check">
              <input type="checkbox" name="lembrar" />
              Lembrar neste dispositivo
            </label>
            <a className="yx-link" href="/recuperar-senha">
              Esqueceu a senha?
            </a>
          </div>

          {state?.erro && (
            <p className="yx-error" role="alert">
              {state.erro}
            </p>
          )}

          <div className="yx-submit-wrap">
            <div className="yx-drop" />
            <button type="submit" className="yx-btn" disabled={pending}>
              {pending ? "Entrando..." : "Acessar painel"}
              {!pending && (
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  arrow_forward
                </span>
              )}
            </button>
          </div>
        </form>

        <p className="yx-foot">
          Não tem uma conta? Solicite acesso ao administrador.
        </p>
      </main>
    </div>
  );
}
