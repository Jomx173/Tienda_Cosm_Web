import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Swal from "sweetalert2";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

import {
    crearBanner,
    actualizarBanner,
    eliminarBanner,
} from "../../../services/productoService";
import type { Banner } from "../../../services/types";
import { rutaImagen } from "../../../services/api";
import { toastExito, toastError } from "../../../utils/toast";

type FormularioBanner = {
    titulo: string;
    descripcion: string;
    orden: string;
    estado: boolean;
    imagen: File | null;
};

const bannerVacio: FormularioBanner = {
    titulo: "",
    descripcion: "",
    orden: "0",
    estado: true,
    imagen: null,
};

type Props = {
    banners: Banner[];
    onRecargar: () => Promise<void>;
    onNoAutorizado: (err: unknown) => void;
};

function BannersSection({ banners, onRecargar, onNoAutorizado }: Props) {
    const [bannerForm, setBannerForm] = useState<FormularioBanner>(bannerVacio);
    const [editando, setEditando] = useState<Banner | null>(null);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [imagenPrevia, setImagenPrevia] = useState("");
    const [cargando, setCargando] = useState(false);

    const abrirNuevo = () => {
        setEditando(null);
        setBannerForm(bannerVacio);
        setImagenPrevia("");
        setMostrarForm(true);
    };

    const abrirEdicion = (banner: Banner) => {
        setEditando(banner);
        setBannerForm({
            titulo: banner.titulo,
            descripcion: banner.descripcion || "",
            orden: String(banner.orden ?? 0),
            estado: Boolean(banner.estado),
            imagen: null,
        });
        setImagenPrevia(banner.imagen ? rutaImagen(banner.imagen) : "");
        setMostrarForm(true);
    };

    const cancelar = () => {
        setMostrarForm(false);
        setEditando(null);
        setBannerForm(bannerVacio);
        setImagenPrevia("");
    };

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setBannerForm((prev) => ({
            ...prev,
            [name]: name === "estado" ? value === "1" : type === "checkbox" ? checked : value,
        }));
    };

    useEffect(() => {
        if (!mostrarForm) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") cancelar();
        };

        document.addEventListener("keydown", onKey);

        return () => document.removeEventListener("keydown", onKey);
    }, [mostrarForm]);

    const handleImagen = (e: ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0] ?? null;
        setBannerForm((prev) => ({ ...prev, imagen: archivo }));

        if (archivo) {
            setImagenPrevia(URL.createObjectURL(archivo));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setCargando(true);

        try {
            const formData = new FormData();
            formData.append("titulo", bannerForm.titulo);
            formData.append("descripcion", bannerForm.descripcion);
            formData.append("orden", bannerForm.orden);
            formData.append("estado", bannerForm.estado ? "1" : "0");

            if (bannerForm.imagen) {
                formData.append("imagen", bannerForm.imagen);
            }

            if (editando) {
                await actualizarBanner(editando.id_banner, formData);
                toastExito("Banner actualizado");
            } else {
                await crearBanner(formData);
                toastExito("Banner creado");
            }

            cancelar();
            await onRecargar();
        } catch (err) {
            onNoAutorizado(err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            toastError(axiosError?.response?.data?.mensaje || "No se pudo guardar el banner. Intenta de nuevo.");
        } finally {
            setCargando(false);
        }
    };

    const handleEliminar = async (banner: Banner) => {
        const confirmacion = await Swal.fire({
            title: "¿Eliminar banner?",
            html: `¿Seguro que quieres eliminar "<strong>${banner.titulo}</strong>"? Esta acción no se puede deshacer.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
        });

        if (!confirmacion.isConfirmed) return;

        try {
            await eliminarBanner(banner.id_banner);
            toastExito("Banner eliminado");
            await onRecargar();
        } catch (err) {
            onNoAutorizado(err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            toastError(axiosError?.response?.data?.mensaje || "No se pudo eliminar el banner");
        }
    };

    return (
        <>
            <div className="admin-toolbar">
                <button className="btn-nuevo" onClick={abrirNuevo}>
                    <FaPlus /> Nuevo banner
                </button>
            </div>

            <p className="banner-ayuda">
                Estas imágenes se muestran como portada en la tienda. Sube fotos anchas (1200px o más) para que se vean bien.
            </p>

            {mostrarForm && (
                <div className="modal-overlay" onClick={cancelar}>
                    <div
                        className="modal-contenido"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form className="admin-form" onSubmit={handleSubmit}>
                            <h4>{editando ? "Editar banner" : "Nuevo banner"}</h4>

                            <div className="form-grid">
                                <label>
                                    Título *
                                    <input
                                        name="titulo"
                                        value={bannerForm.titulo}
                                        onChange={handleChange}
                                        placeholder="Ej: Maquillaje Profesional"
                                        required
                                    />
                                </label>

                                <label>
                                    Orden
                                    <input
                                        name="orden"
                                        type="number"
                                        min="0"
                                        value={bannerForm.orden}
                                        onChange={handleChange}
                                        placeholder="0"
                                    />
                                </label>

                                <label>
                                    Estado
                                    <select
                                        name="estado"
                                        value={bannerForm.estado ? "1" : "0"}
                                        onChange={handleChange}
                                    >
                                        <option value="1">Activo</option>
                                        <option value="0">Deshabilitado</option>
                                    </select>
                                </label>

                                <label className="form-full">
                                    Descripción
                                    <textarea
                                        name="descripcion"
                                        rows={2}
                                        value={bannerForm.descripcion}
                                        onChange={handleChange}
                                        placeholder="Descripción del banner"
                                    />
                                </label>

                                <label className="form-full">
                                    Imagen
                                    <input type="file" accept="image/*" onChange={handleImagen} />
                                    {imagenPrevia && (
                                        <img src={imagenPrevia} alt="Vista previa" className="form-preview" />
                                    )}
                                </label>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-guardar" disabled={cargando}>
                                    {cargando ? "Guardando..." : "Guardar"}
                                </button>
                                <button type="button" className="btn-cancelar" onClick={cancelar}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="admin-table">
                <table>
                    <thead>
                        <tr>
                            <th>Imagen</th>
                            <th>Título</th>
                            <th>Orden</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {banners.map((b) => (
                            <tr key={b.id_banner} className={!b.estado ? "fila-inactiva" : ""}>
                                <td>
                                    {b.imagen ? (
                                        <img src={rutaImagen(b.imagen)} alt={b.titulo} className="tabla-img" />
                                    ) : (
                                        <span className="sin-imagen">—</span>
                                    )}
                                </td>
                                <td>{b.titulo}</td>
                                <td>{b.orden}</td>
                                <td>
                                    <span className={b.estado ? "chip-activo" : "chip-inactivo"}>
                                        {b.estado ? "Activo" : "Deshabilitado"}
                                    </span>
                                </td>
                                <td className="acciones">
                                    <button onClick={() => abrirEdicion(b)} title="Editar">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => handleEliminar(b)} title="Eliminar">
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {banners.length === 0 && (
                    <p className="sin-productos">Aún no hay banners. Crea el primero.</p>
                )}
            </div>
        </>
    );
}

export default BannersSection;
