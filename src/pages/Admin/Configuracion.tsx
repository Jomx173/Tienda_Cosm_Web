import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Swal from "sweetalert2";

import { FaEye, FaEyeSlash } from "react-icons/fa";

import { toastExito, toastError } from "../../utils/toast";
import {
    obtenerPerfil,
    actualizarPerfil,
    cambiarPassword,
    getAdmin,
    guardarAdmin,
} from "../../services/authService";

import "./Configuracion.css";

const FORMATO_IDENTIDAD = /^\d{4}-\d{4}-\d{5}$/;

const formatearIdentidad = (valor: string) => {
    const digitos = String(valor || "").replace(/\D/g, "").slice(0, 13);

    if (digitos.length <= 4) {
        return digitos;
    }

    if (digitos.length <= 8) {
        return `${digitos.slice(0, 4)}-${digitos.slice(4)}`;
    }

    return `${digitos.slice(0, 4)}-${digitos.slice(4, 8)}-${digitos.slice(8)}`;
};

type PasswordForm = {
    passwordActual: string;
    passwordNueva: string;
    passwordConfirmar: string;
};

const passwordVacio: PasswordForm = {
    passwordActual: "",
    passwordNueva: "",
    passwordConfirmar: "",
};

type Props = {
    onPerfilActualizado?: () => void;
    onCerrarSesion?: () => void;
};

function Configuracion({ onPerfilActualizado, onCerrarSesion }: Props) {
    const [cargandoPerfil, setCargandoPerfil] = useState(true);

    const [datosUsuario, setDatosUsuario] = useState({
        nombre: "",
        identidad: "",
    });
    const [identidadOriginal, setIdentidadOriginal] = useState("");
    const [guardandoUsuario, setGuardandoUsuario] = useState(false);

    const [passwordForm, setPasswordForm] = useState<PasswordForm>(passwordVacio);
    const [guardandoPassword, setGuardandoPassword] = useState(false);
    const [verActual, setVerActual] = useState(false);
    const [verNueva, setVerNueva] = useState(false);
    const [verConfirmar, setVerConfirmar] = useState(false);

    useEffect(() => {
        let activo = true;

        const cargar = async () => {
            const local = getAdmin();

            try {
                const perfil = await obtenerPerfil();

                if (!activo) return;

                setDatosUsuario({ nombre: perfil.nombre || "", identidad: perfil.identidad || "" });
                setIdentidadOriginal(perfil.identidad || "");

                if (perfil.nombre && perfil.identidad) {
                    guardarAdmin(perfil);
                }
            } catch {
                if (!activo) return;

                setDatosUsuario({
                    nombre: local?.nombre || "",
                    identidad: local?.identidad || "",
                });
                setIdentidadOriginal(local?.identidad || "");
            } finally {
                if (activo) setCargandoPerfil(false);
            }
        };

        cargar();

        return () => {
            activo = false;
        };
    }, []);

    const handleUsuarioChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDatosUsuario((prev) => ({ ...prev, [name]: value }));
    };

    const handleIdentidadChange = (e: ChangeEvent<HTMLInputElement>) => {
        const formateado = formatearIdentidad(e.target.value);
        setDatosUsuario((prev) => ({ ...prev, identidad: formateado }));
    };

    const handleGuardarUsuario = async (e: FormEvent) => {
        e.preventDefault();

        const nombre = datosUsuario.nombre.trim();
        const identidad = datosUsuario.identidad.trim();

        if (!nombre) {
            toastError("El nombre es obligatorio");
            return;
        }

        if (!FORMATO_IDENTIDAD.test(identidad)) {
            toastError("El número de identidad debe tener el formato 0000-0000-00000");
            return;
        }

        setGuardandoUsuario(true);

        try {
            const perfil = await actualizarPerfil({ nombre, identidad });

            guardarAdmin(perfil);
            setDatosUsuario({ nombre: perfil.nombre, identidad: perfil.identidad });

            toastExito("Datos actualizados");

            if (identidad !== identidadOriginal) {
                await Swal.fire({
                    icon: "warning",
                    title: "Número de identidad actualizado",
                    html: `Tu nuevo número de identidad es <strong>${identidad}</strong>.<br><br>` +
                        "Es lo que usarás para iniciar sesión la próxima vez.",
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#7B1023",
                });

                setIdentidadOriginal(identidad);
            }

            if (onPerfilActualizado) onPerfilActualizado();
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            toastError(
                axiosError?.response?.data?.mensaje ||
                    "No se pudieron guardar los datos. Intenta de nuevo."
            );
        } finally {
            setGuardandoUsuario(false);
        }
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleGuardarPassword = async (e: FormEvent) => {
        e.preventDefault();

        const { passwordActual, passwordNueva, passwordConfirmar } = passwordForm;

        if (!passwordActual) {
            toastError("Debes ingresar tu contraseña actual");
            return;
        }

        if (!passwordNueva) {
            toastError("Debes ingresar la nueva contraseña");
            return;
        }

        if (passwordNueva.length < 8) {
            toastError("La nueva contraseña debe tener al menos 8 caracteres");
            return;
        }

        if (passwordNueva !== passwordConfirmar) {
            toastError("La nueva contraseña y su confirmación no coinciden");
            return;
        }

        setGuardandoPassword(true);

        try {
            await cambiarPassword({ passwordActual, passwordNueva });

            setPasswordForm(passwordVacio);

            await Swal.fire({
                icon: "success",
                title: "Contraseña actualizada",
                text: "Por seguridad, vuelve a iniciar sesión con tu nueva contraseña.",
                confirmButtonText: "Entendido",
                confirmButtonColor: "#7B1023",
            });

            if (onCerrarSesion) onCerrarSesion();
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            toastError(
                axiosError?.response?.data?.mensaje ||
                    "No se pudo cambiar la contraseña. Intenta de nuevo."
            );
        } finally {
            setGuardandoPassword(false);
        }
    };

    const campoPassword = (
        label: string,
        name: keyof PasswordForm,
        ver: boolean,
        alternar: () => void
    ) => (
        <label>
            {label} *
            <div className="password-wrapper">
                <input
                    type={ver ? "text" : "password"}
                    name={name}
                    value={passwordForm[name]}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                    required
                />
                <button
                    type="button"
                    className="password-toggle"
                    onClick={alternar}
                    title={ver ? "Ocultar" : "Ver"}
                >
                    {ver ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
        </label>
    );

    return (
        <div className="configuracion">
            <div className="configuracion-grid">
                <section className="configuracion-card">
                    <h4>Datos de usuario</h4>

                    <form className="admin-form" onSubmit={handleGuardarUsuario}>
                        <div className="form-grid">
                            <label>
                                Nombre visible *
                                <input
                                    name="nombre"
                                    value={datosUsuario.nombre}
                                    onChange={handleUsuarioChange}
                                    placeholder="Nombre que aparece en el panel"
                                    required
                                    disabled={cargandoPerfil}
                                />
                            </label>

                            <label>
                                Número de identidad *
                                <input
                                    name="identidad"
                                    value={datosUsuario.identidad}
                                    onChange={handleIdentidadChange}
                                    placeholder="0000-0000-00000"
                                    inputMode="numeric"
                                    maxLength={15}
                                    required
                                    disabled={cargandoPerfil}
                                />
                            </label>
                        </div>

                        <p className="configuracion-aviso">
                            Este número es tu <strong>usuario de acceso</strong>: con él inicias
                            sesión en el panel. Si lo cambias, la próxima vez entra con el nuevo
                            número. Formato: 0000-0000-00000.
                        </p>

                        <div className="form-actions">
                            <button type="submit" className="btn-guardar" disabled={guardandoUsuario || cargandoPerfil}>
                                {guardandoUsuario ? "Guardando..." : "Guardar datos"}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="configuracion-card">
                    <h4>Cambiar contraseña</h4>

                    <form className="admin-form" onSubmit={handleGuardarPassword}>
                        <div className="form-grid">
                            {campoPassword("Contraseña actual", "passwordActual", verActual, () => setVerActual(!verActual))}

                            {campoPassword("Nueva contraseña", "passwordNueva", verNueva, () => setVerNueva(!verNueva))}

                            {campoPassword("Confirmar nueva contraseña", "passwordConfirmar", verConfirmar, () => setVerConfirmar(!verConfirmar))}
                        </div>

                        <p className="configuracion-ayuda">
                            La nueva contraseña debe tener al menos 8 caracteres.
                        </p>

                        <div className="form-actions">
                            <button type="submit" className="btn-guardar" disabled={guardandoPassword}>
                                {guardandoPassword ? "Cambiando..." : "Cambiar contraseña"}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
}

export default Configuracion;
