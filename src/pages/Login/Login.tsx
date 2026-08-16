import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { FaEye, FaEyeSlash } from "react-icons/fa";

import { login } from "../../services/authService";
import { useDispatch } from "../../store";
import { Action as ActionAuth } from "../../store/slices/Auth";

import "../../pages/Admin/Admin.css";
import "./Login.css";

import logo from "../../assets/logo/logo-blanco.png";

const sanitizarIdentidad = (valor: string): string => valor.replace(/[^0-9-]/g, "");
const sanitizarPassword = (valor: string): string => valor.replace(/[^A-Za-z0-9]/g, "");
const VALIDAR_IDENTIDAD = /^[0-9-]+$/;
const VALIDAR_PASSWORD = /^[A-Za-z0-9]+$/;

const BRILLITOS = [
    { top: "6%", left: "12%", delay: 0, dur: 6, estrella: true },
    { top: "10%", left: "34%", delay: 1.2, dur: 7, estrella: false },
    { top: "5%", left: "58%", delay: 2.1, dur: 6.5, estrella: false },
    { top: "12%", left: "84%", delay: 0.6, dur: 7.5, estrella: false },
    { top: "20%", left: "91%", delay: 1.8, dur: 6, estrella: true },
    { top: "30%", left: "6%", delay: 2.6, dur: 8, estrella: false },
    { top: "40%", left: "93%", delay: 0.9, dur: 6.5, estrella: false },
    { top: "52%", left: "4%", delay: 3.2, dur: 7, estrella: false },
    { top: "58%", left: "95%", delay: 1.5, dur: 7.5, estrella: true },
    { top: "68%", left: "7%", delay: 2.4, dur: 6, estrella: false },
    { top: "76%", left: "92%", delay: 0.3, dur: 8, estrella: false },
    { top: "84%", left: "14%", delay: 1.1, dur: 6.5, estrella: false },
    { top: "88%", left: "40%", delay: 2.9, dur: 7, estrella: true },
    { top: "90%", left: "64%", delay: 0.7, dur: 6.5, estrella: false },
    { top: "86%", left: "86%", delay: 1.9, dur: 7.5, estrella: false },
    { top: "94%", left: "30%", delay: 3.4, dur: 8, estrella: false },
    { top: "24%", left: "18%", delay: 2.2, dur: 6, estrella: true },
    { top: "46%", left: "88%", delay: 1.6, dur: 7, estrella: false },
];

function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const adminRef = useRef<HTMLDivElement>(null);
    const figuraRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLImageElement>(null);
    const cardRef = useRef<HTMLFormElement>(null);

    const [identidad, setIdentidad] = useState("");
    const [password, setPassword] = useState("");
    const [verPassword, setVerPassword] = useState(false);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const [iniciando, setIniciando] = useState(true);

    useEffect(() => {
        const fig = figuraRef.current;
        const logo = logoRef.current;
        const card = cardRef.current;
        const admin = adminRef.current;
        if (!fig || !logo || !card || !admin) return;

        const raf = requestAnimationFrame(() => {
            const orig = card.style.transition;
            card.style.transition = "none";
            card.classList.remove("login-card--oculta");
            const cardRect = card.getBoundingClientRect();
            card.classList.add("login-card--oculta");
            card.style.transition = orig;

            const adminRect = admin.getBoundingClientRect();
            const containerCenter = adminRect.top + adminRect.height / 2;
            const gap = parseFloat(getComputedStyle(fig).marginBottom) || 26;
            const logoH = logo.offsetHeight || 92;
            const finalLogoCenter = cardRect.top - gap - logoH / 2;
            const desp = containerCenter - finalLogoCenter;

            admin.style.setProperty("--desp", `${desp}px`);
        });

        return () => cancelAnimationFrame(raf);
    }, []);

    useEffect(() => {
        if (!iniciando) return;
        const timer = setTimeout(() => setIniciando(false), 5000);
        return () => clearTimeout(timer);
    }, [iniciando]);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setCargando(true);
        setError("");

        if (!identidad || !VALIDAR_IDENTIDAD.test(identidad)) {
            setError("El usuario solo puede contener números y guiones.");
            setCargando(false);
            return;
        }

        if (!password || !VALIDAR_PASSWORD.test(password)) {
            setError("La contraseña solo puede contener letras y números.");
            setCargando(false);
            return;
        }

        try {
            const admin = await login(identidad, password);
            dispatch(ActionAuth.setAdmin(admin));
            dispatch(ActionAuth.setAutenticado(true));
            navigate("/admin");
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            setError(
                axiosError?.response?.data?.mensaje || "Error al iniciar sesión"
            );
        } finally {
            setCargando(false);
        }
    };

    return (
        <div ref={adminRef} className="admin-login">
            <div className={iniciando ? "login-glow" : "login-glow login-glow--oculto"}></div>

            <div
                ref={figuraRef}
                className={iniciando ? "login-figura login-figura--intro" : "login-figura"}
            >
                {[0, 1.65, 3.3].map((delay) => (
                    <span
                        key={delay}
                        className={iniciando ? "login-anillo" : "login-anillo login-anillo--oculto"}
                        style={{ animationDelay: `${delay}s` }}
                        aria-hidden="true"
                    />
                ))}
                <img ref={logoRef} src={logo} alt="MD" className="login-logo" />

                <div
                    className={iniciando ? "login-decor" : "login-decor login-decor--oculto"}
                >
                    <span className="login-linea"></span>
                    <p className="login-sub">Cosméticos y más</p>
                </div>
            </div>

            <div className="login-sparkles" aria-hidden="true">
                {BRILLITOS.map((b, i) => (
                    <span
                        key={i}
                        className={b.estrella ? "login-sparkle login-sparkle--estrella" : "login-sparkle"}
                        style={{
                            top: b.top,
                            left: b.left,
                            animationDelay: `${b.delay}s`,
                            animationDuration: `${b.dur}s`,
                        }}
                    />
                ))}
            </div>

            <form
                ref={cardRef}
                className={iniciando ? "login-card login-card--oculta" : "login-card"}
                onSubmit={handleLogin}
            >
                <h2>
                    M&amp;D <span>Admin</span>
                </h2>

                <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Número de identidad"
                    value={identidad}
                    onChange={(e) => {
                        setIdentidad(sanitizarIdentidad(e.target.value));
                        setError("");
                    }}
                    required
                />

                <div className="password-wrapper">
                    <input
                        type={verPassword ? "text" : "password"}
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => {
                            setPassword(sanitizarPassword(e.target.value));
                            setError("");
                        }}
                        required
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setVerPassword(!verPassword)}
                        title={verPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                        {verPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>

                {error && <p className="login-error">{error}</p>}

                <button type="submit" disabled={cargando}>
                    {cargando ? "Entrando..." : "Ingresar"}
                </button>

                <a href="/" className="login-back">← Volver a la tienda</a>
            </form>
        </div>
    );
}

export default Login;
