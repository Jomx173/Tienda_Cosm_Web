import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Swal from "sweetalert2";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

import {
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
} from "../../../services/productoService";
import type { Categoria, Producto } from "../../../services/types";
import { toastExito, toastError } from "../../../utils/toast";

type FormularioCategoria = {
    id_categoria: number | null;
    nombre: string;
    descripcion: string;
};

const categoriaVacia: FormularioCategoria = {
    id_categoria: null,
    nombre: "",
    descripcion: "",
};

type Props = {
    categorias: Categoria[];
    productos: Producto[];
    onRecargar: () => Promise<void>;
    onNoAutorizado: (err: unknown) => void;
};

function CategoriasSection({ categorias, productos, onRecargar, onNoAutorizado }: Props) {
    const [catForm, setCatForm] = useState<FormularioCategoria>(categoriaVacia);
    const [editando, setEditando] = useState<Categoria | null>(null);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [cargando, setCargando] = useState(false);

    const abrirNueva = () => {
        setEditando(null);
        setCatForm(categoriaVacia);
        setMostrarForm(true);
    };

    const abrirEdicion = (categoria: Categoria) => {
        setEditando(categoria);
        setCatForm({
            id_categoria: categoria.id_categoria,
            nombre: categoria.nombre,
            descripcion: categoria.descripcion || "",
        });
        setMostrarForm(true);
    };

    const cancelar = () => {
        setMostrarForm(false);
        setEditando(null);
        setCatForm(categoriaVacia);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCatForm((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        if (!mostrarForm) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") cancelar();
        };

        document.addEventListener("keydown", onKey);

        return () => document.removeEventListener("keydown", onKey);
    }, [mostrarForm]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setCargando(true);

        try {
            const datos = {
                nombre: catForm.nombre,
                descripcion: catForm.descripcion,
            };

            if (editando) {
                await actualizarCategoria(editando.id_categoria, datos);
                toastExito("Categoría actualizada");
            } else {
                await crearCategoria(datos);
                toastExito("Categoría creada");
            }

            cancelar();
            await onRecargar();
        } catch (err) {
            onNoAutorizado(err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            toastError(axiosError?.response?.data?.mensaje || "No se pudo guardar la categoría. Intenta de nuevo.");
        } finally {
            setCargando(false);
        }
    };

    const handleEliminar = async (categoria: Categoria) => {
        const confirmacion = await Swal.fire({
            title: "¿Eliminar categoría?",
            text: `${categoria.nombre}. Los productos seguirán existiendo.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
        });

        if (!confirmacion.isConfirmed) return;

        try {
            await eliminarCategoria(categoria.id_categoria);
            toastExito("Categoría eliminada");
            await onRecargar();
        } catch (err) {
            onNoAutorizado(err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            toastError(axiosError?.response?.data?.mensaje || "No se pudo eliminar la categoría");
        }
    };

    const productosDeCategoria = (id: number) =>
        productos.filter((p) => p.id_categoria === id).length;

    return (
        <>
            <div className="admin-toolbar">
                <button className="btn-nuevo" onClick={abrirNueva}>
                    <FaPlus /> Nueva categoría
                </button>
            </div>

            {mostrarForm && (
                <div className="modal-overlay" onClick={cancelar}>
                    <div
                        className="modal-contenido modal-contenido--compacto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form className="admin-form" onSubmit={handleSubmit}>
                            <h4>{editando ? "Editar categoría" : "Nueva categoría"}</h4>

                            <div className="form-grid">
                                <label>
                                    Nombre *
                                    <input
                                        name="nombre"
                                        value={catForm.nombre}
                                        onChange={handleChange}
                                        placeholder="Ej: Cuidado Facial"
                                        required
                                    />
                                </label>

                                <label>
                                    Descripción
                                    <input
                                        name="descripcion"
                                        value={catForm.descripcion}
                                        onChange={handleChange}
                                        placeholder="Opcional"
                                    />
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
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Productos</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categorias.map((c) => (
                            <tr key={c.id_categoria}>
                                <td>{c.nombre}</td>
                                <td>{c.descripcion || "—"}</td>
                                <td>{productosDeCategoria(c.id_categoria)}</td>
                                <td className="acciones">
                                    <button onClick={() => abrirEdicion(c)} title="Editar">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => handleEliminar(c)} title="Eliminar">
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {categorias.length === 0 && (
                    <p className="sin-productos">Aún no hay categorías.</p>
                )}
            </div>
        </>
    );
}

export default CategoriasSection;
