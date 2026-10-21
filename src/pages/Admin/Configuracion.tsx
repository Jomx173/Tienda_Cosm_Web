import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Swal from "sweetalert2";

import {
    FaEye,
    FaEyeSlash,
    FaDownload,
    FaUpload,
    FaCheckCircle,
    FaExclamationTriangle,
    FaDatabase,
    FaFileCode,
    FaShieldAlt,
    FaLock,
    FaBoxOpen,
    FaTags,
    FaImages,
    FaDollarSign,
    FaSpinner,
} from "react-icons/fa";

import { toastExito, toastError } from "../../utils/toast";
import {
    obtenerPerfil,
    actualizarPerfil,
    cambiarPassword,
    getAdmin,
    guardarAdmin,
} from "../../services/authService";
import {
    descargarRespaldo,
    validarRespaldo,
    restaurarInventario,
} from "../../services/inventarioService";
import type { PlanRestauracion, ValidacionRespaldo } from "../../services/types";

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
    onInventarioRestaurado?: () => void;
};

function Configuracion({ onPerfilActualizado, onCerrarSesion, onInventarioRestaurado }: Props) {
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

    // Copias de seguridad
    const [descargando, setDescargando] = useState(false);
    const [archivoRespaldo, setArchivoRespaldo] = useState<File | null>(null);
    const [validando, setValidando] = useState(false);
    const [validacion, setValidacion] = useState<ValidacionRespaldo | null>(null);
    const [modoRestauracion, setModoRestauracion] = useState<"combinar" | "reemplazar">("combinar");
    const [confirmacionRestauracion, setConfirmacionRestauracion] = useState(false);
    const [restaurando, setRestaurando] = useState(false);

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

    /* =======================
       COPIAS DE SEGURIDAD
    ======================= */

    const handleDescargarRespaldo = async () => {
        setDescargando(true);

        try {
            const nombre = await descargarRespaldo();
            toastExito(`Copia descargada: ${nombre}`);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            toastError(
                axiosError?.response?.data?.mensaje || "No se pudo descargar la copia de seguridad"
            );
        } finally {
            setDescargando(false);
        }
    };

    const handleArchivoRespaldo = (e: ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0] || null;

        setArchivoRespaldo(archivo);
        setValidacion(null);
        setConfirmacionRestauracion(false);
    };

    const handleValidarRespaldo = async () => {
        if (!archivoRespaldo) return;

        setValidando(true);
        setValidacion(null);

        try {
            const resultado = await validarRespaldo(archivoRespaldo);

            setValidacion(resultado);
            setConfirmacionRestauracion(false);

            toastExito("Archivo de respaldo válido");
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            const errores = axiosError?.response?.data?.errores;

            if (Array.isArray(errores) && errores.length > 0) {
                await Swal.fire({
                    icon: "error",
                    title: "El archivo no es un respaldo válido",
                    html: errores.map((e: string) => `• ${e}`).join("<br>"),
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#7B1023",
                });
            } else {
                toastError(
                    axiosError?.response?.data?.mensaje || "No se pudo validar el archivo"
                );
            }
        } finally {
            setValidando(false);
        }
    };

    const handleRestaurar = async () => {
        if (!archivoRespaldo || !validacion) return;

        const plan: PlanRestauracion =
            modoRestauracion === "reemplazar" ? validacion.planReemplazar : validacion.planCombinar;

        const confirmacion = await Swal.fire({
            icon: modoRestauracion === "reemplazar" ? "warning" : "question",
            title:
                modoRestauracion === "reemplazar"
                    ? "¿Reemplazar todo el inventario?"
                    : "¿Restaurar el inventario?",
            html:
                `<strong>${validacion.conteos.productos}</strong> productos · ` +
                `<strong>${validacion.conteos.variantes}</strong> tonos · ` +
                `<strong>${validacion.conteos.imagenes}</strong> imágenes<br>` +
                `Se crearán ${plan.productos.crear} y se actualizarán ${plan.productos.actualizar}.` +
                (modoRestauracion === "reemplazar"
                    ? `<br><span style="color:#c0392b">Se eliminarán ${plan.productos.eliminar} productos y ${plan.variantes.eliminar} tonos que no están en el archivo (excepto los que tienen pedidos).</span>`
                    : "<br>No se eliminará nada.") +
                "<br><br>Antes de aplicar los cambios se guarda una copia automática del estado actual.",
            showCancelButton: true,
            confirmButtonText: "Sí, restaurar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: modoRestauracion === "reemplazar" ? "#c0392b" : "#7B1023",
        });

        if (!confirmacion.isConfirmed) return;

        setRestaurando(true);

        try {
            const resultado = await restaurarInventario(archivoRespaldo, modoRestauracion);

            await Swal.fire({
                icon: "success",
                title: "Inventario restaurado",
                text:
                    `${resultado.mensaje}` +
                    (resultado.respaldoSeguridad
                        ? `\nCopia de seguridad previa: ${resultado.respaldoSeguridad}`
                        : ""),
                confirmButtonText: "Entendido",
                confirmButtonColor: "#7B1023",
            });

            setArchivoRespaldo(null);
            setValidacion(null);
            setConfirmacionRestauracion(false);

            if (onInventarioRestaurado) onInventarioRestaurado();
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            toastError(
                axiosError?.response?.data?.mensaje ||
                    "No se pudo restaurar el inventario. No se modificó nada."
            );
        } finally {
            setRestaurando(false);
        }
    };

    const planActual: PlanRestauracion | null = validacion
        ? modoRestauracion === "reemplazar"
            ? validacion.planReemplazar
            : validacion.planCombinar
        : null;

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

            {/* =======================
                COPIAS DE SEGURIDAD
            ======================= */}
            <section className="configuracion-card configuracion-card--ancho respaldo-panel">
                <header className="respaldo-panel-cabecera">
                    <span className="respaldo-panel-icono">
                        <FaDatabase />
                    </span>

                    <div>
                        <h4>Copias de seguridad</h4>
                        <p>
                            Respalda el catálogo de MD Beauty y recupéralo cuando lo necesites, sin
                            perder productos ni tonos.
                        </p>
                    </div>
                </header>

                <div className="respaldo-cards">
                    <article className="respaldo-card">
                        <div className="respaldo-card-cabecera">
                            <span className="respaldo-icono-badge">
                                <FaDatabase />
                            </span>

                            <div>
                                <h5>Copias de seguridad</h5>
                                <p>Descarga el catálogo actual en un archivo .json.</p>
                            </div>
                        </div>

                        <ul className="respaldo-incluye">
                            <li>
                                <FaBoxOpen />
                                <span>
                                    <strong>Productos y tonos</strong>
                                    con sus códigos
                                </span>
                            </li>
                            <li>
                                <FaDollarSign />
                                <span>
                                    <strong>Precios y stock</strong>
                                    de cada referencia
                                </span>
                            </li>
                            <li>
                                <FaTags />
                                <span>
                                    <strong>Categorías</strong>
                                    del catálogo
                                </span>
                            </li>
                            <li>
                                <FaImages />
                                <span>
                                    <strong>Imágenes</strong>
                                    de los productos
                                </span>
                            </li>
                        </ul>

                        <div className="respaldo-acciones">
                            <button
                                type="button"
                                className="btn-guardar respaldo-btn-descargar"
                                onClick={handleDescargarRespaldo}
                                disabled={descargando}
                            >
                                <FaDownload /> {descargando ? "Preparando copia..." : "Descargar copia de seguridad"}
                            </button>
                        </div>

                        <p className="respaldo-seguridad">
                            <FaLock /> El archivo no incluye contraseñas, tokens de acceso ni datos
                            de los administradores.
                        </p>
                    </article>

                    <article className="respaldo-card respaldo-card--carga">
                        <div className="respaldo-card-cabecera">
                            <span className="respaldo-icono-badge respaldo-icono-badge--rosa">
                                <FaUpload />
                            </span>

                            <div>
                                <h5>Restaurar desde un archivo</h5>
                                <p>El sistema valida el archivo antes de modificar cualquier dato.</p>
                            </div>
                        </div>

                        <div className="respaldo-carga">
                            <label className="respaldo-dropzone">
                                <input
                                    type="file"
                                    accept=".json,application/json"
                                    onChange={handleArchivoRespaldo}
                                    aria-label="Archivo de respaldo"
                                />

                                <FaFileCode className="respaldo-dropzone-icono" />

                                <span className="respaldo-dropzone-texto">
                                    <strong>
                                        {archivoRespaldo
                                            ? archivoRespaldo.name
                                            : "Selecciona el archivo .json"}
                                    </strong>

                                    <small>
                                        {archivoRespaldo
                                            ? `${(archivoRespaldo.size / 1024).toFixed(1)} KB · listo para validar`
                                            : "Búscalo en este equipo para revisar su contenido"}
                                    </small>
                                </span>
                            </label>

                            <button
                                type="button"
                                className="btn-cancelar respaldo-btn-validar"
                                onClick={handleValidarRespaldo}
                                disabled={!archivoRespaldo || validando}
                            >
                                {validando ? (
                                    <FaSpinner className="respaldo-spinner" />
                                ) : (
                                    <FaCheckCircle />
                                )}{" "}
                                {validando
                                    ? "Validando..."
                                    : validacion
                                      ? "Validar de nuevo"
                                      : "Validar archivo"}
                            </button>
                        </div>

                        <ul className="respaldo-comprobaciones">
                            <li className={validacion ? "comprobado" : ""}>
                                <FaCheckCircle /> Formato y versión del archivo
                            </li>
                            <li className={validacion ? "comprobado" : ""}>
                                <FaCheckCircle /> Integridad de los datos
                            </li>
                            <li className={validacion ? "comprobado" : ""}>
                                <FaCheckCircle /> Resumen de los cambios
                            </li>
                            <li className="comprobado">
                                <FaShieldAlt /> Pedidos y usuarios protegidos
                            </li>
                        </ul>
                    </article>
                </div>

                {validacion && (
                    <div className="respaldo-preview">
                        <div className="respaldo-preview-cabecera">
                            <FaCheckCircle className="respaldo-ok" />
                            <div>
                                <strong>Archivo válido</strong>
                                <span>
                                    {validacion.conteos.productos} productos ·{" "}
                                    {validacion.conteos.variantes} tonos ·{" "}
                                    {validacion.conteos.categorias} categorías ·{" "}
                                    {validacion.conteos.imagenes} imágenes
                                </span>
                            </div>
                        </div>

                        {validacion.meta?.nota_imagenes && (
                            <p className="respaldo-nota">{validacion.meta.nota_imagenes}</p>
                        )}

                        <div className="respaldo-modos">
                            <label className={modoRestauracion === "combinar" ? "activo" : ""}>
                                <input
                                    type="radio"
                                    name="modo-restauracion"
                                    value="combinar"
                                    checked={modoRestauracion === "combinar"}
                                    onChange={() => setModoRestauracion("combinar")}
                                />
                                <strong>Combinar</strong>
                                <span>
                                    Actualiza lo que coincide y agrega lo que falta. No elimina nada.
                                </span>
                            </label>

                            <label className={modoRestauracion === "reemplazar" ? "activo" : ""}>
                                <input
                                    type="radio"
                                    name="modo-restauracion"
                                    value="reemplazar"
                                    checked={modoRestauracion === "reemplazar"}
                                    onChange={() => setModoRestauracion("reemplazar")}
                                />
                                <strong>Reemplazar</strong>
                                <span>
                                    Deja el inventario igual que el archivo. Los productos con
                                    pedidos asociados se conservan.
                                </span>
                            </label>
                        </div>

                        {planActual && (
                            <div className="respaldo-plan">
                                <div>
                                    <span>Productos a crear</span>
                                    <strong>{planActual.productos.crear}</strong>
                                </div>
                                <div>
                                    <span>Productos a actualizar</span>
                                    <strong>{planActual.productos.actualizar}</strong>
                                </div>
                                <div>
                                    <span>Productos a eliminar</span>
                                    <strong className={planActual.productos.eliminar > 0 ? "peligro" : ""}>
                                        {planActual.productos.eliminar}
                                    </strong>
                                </div>
                                {(planActual.productos.ambiguos ?? 0) > 0 && (
                                    <div>
                                        <span>Conservados por nombre repetido</span>
                                        <strong>{planActual.productos.ambiguos}</strong>
                                    </div>
                                )}
                                <div>
                                    <span>Tonos a crear</span>
                                    <strong>{planActual.variantes.crear}</strong>
                                </div>
                                <div>
                                    <span>Tonos a eliminar</span>
                                    <strong className={planActual.variantes.eliminar > 0 ? "peligro" : ""}>
                                        {planActual.variantes.eliminar}
                                    </strong>
                                </div>
                                <div>
                                    <span>Imágenes a recuperar</span>
                                    <strong>{planActual.imagenes.crear}</strong>
                                </div>
                            </div>
                        )}

                        {planActual && planActual.advertencias.length > 0 && (
                            <ul className="respaldo-advertencias">
                                {planActual.advertencias.map((a) => (
                                    <li key={a}>{a}</li>
                                ))}
                            </ul>
                        )}

                        {validacion.advertencias && validacion.advertencias.length > 0 && (
                            <ul className="respaldo-advertencias">
                                {validacion.advertencias.map((a) => (
                                    <li key={a}>{a}</li>
                                ))}
                            </ul>
                        )}

                        {modoRestauracion === "reemplazar" && (
                            <p className="respaldo-peligro">
                                <FaExclamationTriangle /> El modo reemplazar elimina los productos
                                y tonos que no estén en el archivo. Antes de aplicar los cambios se
                                guarda una copia automática de seguridad.
                            </p>
                        )}

                        <label className="respaldo-confirmacion">
                            <input
                                type="checkbox"
                                checked={confirmacionRestauracion}
                                onChange={(e) => setConfirmacionRestauracion(e.target.checked)}
                            />
                            Confirmo que revisé el resumen y deseo restaurar el inventario.
                        </label>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-guardar"
                                onClick={handleRestaurar}
                                disabled={!confirmacionRestauracion || restaurando}
                            >
                                {restaurando ? "Restaurando..." : "Restaurar inventario"}
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Configuracion;
