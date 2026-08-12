import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { FaEye, FaEyeSlash } from "react-icons/fa";

import { login } from "../../services/authService";
import { useDispatch } from "../../store";
import { Action as ActionAuth } from "../../store/slices/Auth";

import "../../pages/Admin/Admin.css";

function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [identidad, setIdentidad] = useState("");
    const [password, setPassword] = useState("");
    const [verPassword, setVerPassword] = useState(false);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setCargando(true);
        setError("");

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
        <div className="admin-login">
            <form className="login-card" onSubmit={handleLogin}>
                <h2>
                    MD <span>Admin</span>
                </h2>
                <p>Inicia sesión para administrar la tienda</p>

                <input
                    type="text"
                    placeholder="Número de identidad"
                    value={identidad}
                    onChange={(e) => setIdentidad(e.target.value)}
                    required
                />

                <div className="password-wrapper">
                    <input
                        type={verPassword ? "text" : "password"}
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
