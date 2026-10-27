import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaTimes,
} from "react-icons/fa";

import {
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    buscarProductoDuplicado,
    crearVariante,
    actualizarVariante,
    eliminarVariante,
    subirImagenesProducto,
    eliminarImagenProducto,
    type DatosVariante,
} from "../../../services/productoService";
import type { Categoria, Producto, ProductoVariante } from "../../../services/types";
import { rutaImagen } from "../../../services/api";
import { toastExito, toastError } from "../../../utils/toast";
import ProductoCard from "../../../components/ProductoCard/ProductoCard";
import ProductosInventario from "./ProductosInventario";

type FormularioVariante = {
    id_variante: number | null;
    tono: string;
    color: string;
    precio: string;
    precio_anterior: string;
    stock: string;
    codigo: string;
    estado: boolean;
    /** Ya existentes en el servidor (no se vuelven a subir) */
    imagenesExistentes: { id_imagen: number; imagen: string }[];
    imagenesNuevas: File[];
    imagenesPrevia: string[];
    /** Imagenes existentes marcadas para eliminar */
    imagenesEliminar: number[];
};

/** Color vino de MD Beauty por defecto para nuevas variantes */
const COLOR_VARIANTE_POR_DEFECTO = "#701522";

const varianteVacia = (): FormularioVariante => ({
    id_variante: null,
    tono: "",
    color: COLOR_VARIANTE_POR_DEFECTO,
    precio: "",
    precio_anterior: "",
    stock: "0",
    codigo: "",
    estado: true,
    imagenesExistentes: [],
    imagenesNuevas: [],
    imagenesPrevia: [],
    imagenesEliminar: [],
});

type FormularioProducto = {
    nombre: string;
    descripcion: string;
    precio: string;
    precio_anterior: string;
    stock: string;
    codigo: string;
    subcategoria: string;
    id_categoria: string;
    estado: boolean;
    destacado: boolean;
    imagen: File | null;
    variantes: FormularioVariante[];
};

const formularioVacio: FormularioProducto = {
    nombre: "",
    descripcion: "",
    precio: "",
    precio_anterior: "",
    stock: "",
    codigo: "",
    subcategoria: "",
    id_categoria: "",
    estado: true,
    destacado: false,
    imagen: null,
    variantes: [],
};

type Props = {
    pestana: "productos" | "ofertas";
    productos: Producto[];
    categorias: Categoria[];
    onRecargar: () => Promise<void>;
    onNoAutorizado: (err: unknown) => void;
};

function ProductosSection({
    pestana,
    productos,
    categorias,
    onRecargar,
    onNoAutorizado,
}: Props) {
    const navegar = useNavigate();

    const [formulario, setFormulario] = useState<FormularioProducto>(formularioVacio);
    const [editando, setEditando] = useState<Producto | null>(null);
    const [variantesEliminar, setVariantesEliminar] = useState<number[]>([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [imagenPrevia, setImagenPrevia] = useState("");
    const [productoVisto, setProductoVisto] = useState<Producto | null>(null);
    const [cargando, setCargando] = useState(false);

    const abrirNuevo = () => {
        setEditando(null);
        setFormulario(formularioVacio);
        setImagenPrevia("");
        setMostrarForm(true);
        navegar("/admin/productos");
    };

    const abrirEdicion = (producto: Producto) => {
        setEditando(producto);
        setFormulario({
            nombre: producto.nombre,
            descripcion: producto.descripcion || "",
            precio: String(producto.precio ?? ""),
            precio_anterior:
                producto.precio_anterior !== null && producto.precio_anterior !== undefined
                    ? String(producto.precio_anterior)
                    : "",
            stock: String(producto.stock ?? ""),
            codigo: producto.codigo || "",
            subcategoria: producto.subcategoria || "",
            id_categoria:
                producto.id_categoria !== null && producto.id_categoria !== undefined
                    ? String(producto.id_categoria)
                    : "",
            estado: Boolean(producto.estado),
            destacado: Boolean(producto.destacado),
            imagen: null,
            variantes: (producto.variantes ?? []).map((v: ProductoVariante) => ({
                id_variante: v.id_variante,
                tono: v.tono,
                color: v.color || COLOR_VARIANTE_POR_DEFECTO,
                precio: String(v.precio ?? ""),
                precio_anterior:
                    v.precio_anterior !== null && v.precio_anterior !== undefined
                        ? String(v.precio_anterior)
                        : "",
                stock: String(v.stock ?? "0"),
                codigo: v.codigo || "",
                estado: v.estado !== false,
                imagenesExistentes: (v.imagenes ?? []).map((img) => ({
                    id_imagen: img.id_imagen,
                    imagen: img.imagen,
                })),
                imagenesNuevas: [],
                imagenesPrevia: (v.imagenes ?? []).map((img) => rutaImagen(img.imagen)),
                imagenesEliminar: [],
            })),
        });
        setImagenPrevia(producto.imagen ? rutaImagen(producto.imagen) : "");
        setMostrarForm(true);
        navegar("/admin/productos");
    };

    const cancelarForm = () => {
        setMostrarForm(false);
        setEditando(null);
        setFormulario(formularioVacio);
        setImagenPrevia("");
        setVariantesEliminar([]);
    };

    const cerrarVistaProducto = () => {
        setProductoVisto(null);
    };

    const editarProductoVisto = () => {
        const producto = productoVisto;
        cerrarVistaProducto();
        if (producto) abrirEdicion(producto);
    };

    useEffect(() => {
        if (!productoVisto) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") cerrarVistaProducto();
        };

        document.addEventListener("keydown", onKey);

        return () => document.removeEventListener("keydown", onKey);
    }, [productoVisto]);

    useEffect(() => {
        if (!mostrarForm) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") cancelarForm();
        };

        document.addEventListener("keydown", onKey);

        return () => document.removeEventListener("keydown", onKey);
    }, [mostrarForm]);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormulario((prev) => ({
            ...prev,
            [name]: name === "estado" ? value === "1" : type === "checkbox" ? checked : value,
        }));
    };

    const handleImagen = (e: ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0] ?? null;

        if (archivo) {
            const ext = (archivo.name.split(".").pop() || "").toLowerCase();
            const permitidas = ["jpg", "jpeg", "jpe", "jfif", "png", "gif", "webp"];

            if (!permitidas.includes(ext)) {
                toastError("Formato de imagen no soportado. Usa JPG, PNG, GIF, WEBP o JFIF.");
                e.target.value = "";
                return;
            }

            setFormulario((prev) => ({ ...prev, imagen: archivo }));
            setImagenPrevia(URL.createObjectURL(archivo));
        }
    };

    // ------- Variantes dentro del formulario -------

    const agregarVarianteForm = () => {
        setFormulario((prev) => ({
            ...prev,
            variantes: [...prev.variantes, varianteVacia()],
        }));
    };

    const cambiarVarianteForm = (
        indice: number,
        campo: keyof FormularioVariante,
        valor: string | boolean
    ) => {
        setFormulario((prev) => ({
            ...prev,
            variantes: prev.variantes.map((v, i) =>
                i === indice ? { ...v, [campo]: valor } : v
            ),
        }));
    };

    const eliminarVarianteForm = (indice: number) => {
        const variante = formulario.variantes[indice];

        // Variante ya guardada en el servidor: se elimina al confirmar
        if (variante?.id_variante) {
            setVariantesEliminar((prev) =>
                prev.includes(variante.id_variante as number)
                    ? prev
                    : [...prev, variante.id_variante as number]
            );
        }

        setFormulario((prev) => ({
            ...prev,
            variantes: prev.variantes.filter((_, i) => i !== indice),
        }));
    };

    const handleImagenesVariante = (indice: number, e: ChangeEvent<HTMLInputElement>) => {
        const archivos = Array.from(e.target.files ?? []);
        if (archivos.length === 0) return;

        const permitidas = ["jpg", "jpeg", "jpe", "jfif", "png", "gif", "webp"];
        const validas = archivos.filter((a) => {
            const ext = (a.name.split(".").pop() || "").toLowerCase();
            return permitidas.includes(ext);
        });

        if (validas.length !== archivos.length) {
            toastError("Algunas imágenes no tienen un formato soportado y se omitieron.");
        }

        setFormulario((prev) => ({
            ...prev,
            variantes: prev.variantes.map((v, i) =>
                i === indice
                    ? {
                        ...v,
                        imagenesNuevas: [...v.imagenesNuevas, ...validas],
                        imagenesPrevia: [
                            ...v.imagenesPrevia,
                            ...validas.map((a) => URL.createObjectURL(a)),
                        ],
                    }
                    : v
            ),
        }));

        e.target.value = "";
    };

    const quitarImagenVariante = (indice: number, posicion: number) => {
        setFormulario((prev) => ({
            ...prev,
            variantes: prev.variantes.map((v, i) => {
                if (i !== indice) return v;

                const existentes = v.imagenesExistentes.length;

                // Si la posicion cae dentro de las existentes, se marca para borrar
                if (posicion < existentes) {
                    const idImagen = v.imagenesExistentes[posicion].id_imagen;
                    return {
                        ...v,
                        imagenesExistentes: v.imagenesExistentes.filter((_, p) => p !== posicion),
                        imagenesEliminar: [...v.imagenesEliminar, idImagen],
                        imagenesPrevia: v.imagenesPrevia.filter((_, p) => p !== posicion),
                    };
                }

                const posNueva = posicion - existentes;

                return {
                    ...v,
                    imagenesNuevas: v.imagenesNuevas.filter((_, p) => p !== posNueva),
                    imagenesPrevia: v.imagenesPrevia.filter((_, p) => p !== posicion),
                };
            }),
        }));
    };

    // Sube las imagenes nuevas de una variante ya existente en el servidor
    const sincronizarImagenesVariante = async (
        idProducto: number,
        v: FormularioVariante
    ) => {
        for (const idImagen of v.imagenesEliminar) {
            try {
                await eliminarImagenProducto(idImagen);
            } catch {
                // Si ya no existe, se ignora
            }
        }

        if (v.imagenesNuevas.length > 0) {
            await subirImagenesProducto(idProducto, v.imagenesNuevas, v.id_variante);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setCargando(true);

        // Bandera para saber si el producto base ya fue guardado
        let productoBaseGuardado = false;

        try {
            // Comprobación de duplicados: solo para endpoints opcionales ausentes (404)
            try {
                const duplicado = await buscarProductoDuplicado({
                    nombre: formulario.nombre,
                    id_categoria: formulario.id_categoria,
                    subcategoria: formulario.subcategoria || "",
                    excluir: editando?.id_producto,
                });

                if (duplicado) {
                    const continuar = await Swal.fire({
                        icon: "warning",
                        title: "Posible producto duplicado",
                        html: `⚠️ Ya existe un producto similar: <strong>'${duplicado.nombre}'</strong> (${duplicado.categoria?.nombre || duplicado.categoria || ""}${duplicado.subcategoria ? ` / ${duplicado.subcategoria}` : ""}).<br><br>¿Quieres continuar de todas formas?`,
                        showCancelButton: true,
                        confirmButtonText: "Sí, crear de todas formas",
                        cancelButtonText: "Cancelar y revisar",
                        confirmButtonColor: "#7B1023",
                        cancelButtonColor: "#8A7A63",
                    });

                    if (!continuar.isConfirmed) {
                        return;
                    }
                }
            } catch (dupErr) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const d = dupErr as any;
                const statusDup = d?.response?.status;
                // Solo degradar si el endpoint no existe (404). NO ignorar 401/403/500/errores de validación
                if (statusDup === 404) {
                    toastError("No fue posible comprobar duplicados (función no disponible con la API actual).");
                } else if (statusDup === 401 || statusDup === 403) {
                    onNoAutorizado(dupErr);
                    throw dupErr;
                } else if (statusDup >= 400) {
                    // Errores reales/validación: no continuar silenciosamente
                    throw dupErr;
                } else {
                    // Error de red sin respuesta
                    throw dupErr;
                }
            }

            const formData = new FormData();
            formData.append("nombre", formulario.nombre);
            formData.append("descripcion", formulario.descripcion);
            formData.append("precio", formulario.precio);
            if (formulario.precio_anterior) {
                formData.append("precio_anterior", formulario.precio_anterior);
            }
            formData.append("stock", formulario.stock);
            formData.append("codigo", formulario.codigo || "");
            formData.append("subcategoria", formulario.subcategoria || "");
            formData.append("id_categoria", formulario.id_categoria);
            formData.append("estado", formulario.estado ? "1" : "0");
            formData.append("destacado", formulario.destacado ? "1" : "0");

            if (formulario.imagen) {
                formData.append("imagen", formulario.imagen);
            }

            let idProducto: number;

            if (editando) {
                await actualizarProducto(editando.id_producto, formData);
                idProducto = editando.id_producto;
                productoBaseGuardado = true;
                toastExito("Producto actualizado");
            } else {
                const creado = await crearProducto(formData);
                idProducto = creado.id_producto;
                productoBaseGuardado = true;
                toastExito("Producto creado");
            }

            // Sincronizar variantes: crear las nuevas, actualizar las existentes (SOLO si hay variantes o si hay que eliminar)
            const datosVariante = (v: FormularioVariante): DatosVariante => ({
                tono: v.tono.trim(),
                color: v.color || null,
                precio: v.precio,
                precio_anterior: v.precio_anterior || null,
                stock: v.stock || "0",
                codigo: v.codigo || null,
                estado: v.estado,
            });

            let variantesFallidas = false;
            const hayVariantes = formulario.variantes.some((v) => v.tono.trim());
            const hayVariantesEliminar = variantesEliminar.length > 0;

            if (hayVariantes || hayVariantesEliminar) {
                try {
                    for (const v of formulario.variantes) {
                        if (!v.tono.trim()) continue;

                        try {
                            if (v.id_variante) {
                                await actualizarVariante(v.id_variante, datosVariante(v));
                            } else {
                                const creada = await crearVariante(idProducto, datosVariante(v));
                                v.id_variante = creada.id_variante;
                            }

                            // Sincronizar imágenes por variante
                            try {
                                await sincronizarImagenesVariante(idProducto, v);
                            } catch (imgErr) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const ie = imgErr as any;
                                const st = ie?.response?.status;
                                if (st === 404) {
                                    variantesFallidas = true;
                                    // No afirmamos que se guardaron
                                } else {
                                    variantesFallidas = true;
                                    throw imgErr;
                                }
                            }
                        } catch (varErr) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const ve = varErr as any;
                            const sv = ve?.response?.status;
                            if (sv === 404) {
                                variantesFallidas = true;
                                // Endpoints de variantes no disponibles con API antigua - NO reintentar
                                continue;
                            } else if (sv === 401 || sv === 403) {
                                onNoAutorizado(varErr);
                                throw varErr;
                            } else {
                                variantesFallidas = true;
                                throw varErr;
                            }
                        }
                    }

                    // Eliminar las variantes que el administrador quitó del formulario
                    for (const idVariante of variantesEliminar) {
                        try {
                            await eliminarVariante(idVariante);
                        } catch (delVarErr) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const dve = delVarErr as any;
                            const sdv = dve?.response?.status;
                            if (sdv === 404) {
                                variantesFallidas = true;
                                continue;
                            } else if (sdv === 401 || sdv === 403) {
                                onNoAutorizado(delVarErr);
                                throw delVarErr;
                            }
                            // Si ya no existe, se ignora; otros errores reales se marcan
                            variantesFallidas = true;
                        }
                    }
                } catch (syncErr) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const se = syncErr as any;
                    const sse = se?.response?.status;
                    if (sse === 401 || sse === 403) {
                        onNoAutorizado(syncErr);
                        // El producto base ya fue guardado, informar claramente
                        toastError("El producto base se guardó correctamente, pero no fue posible completar la sincronización por un problema de autorización. Las variantes/imágenes no se sincronizaron.");
                        cancelarForm();
                        await onRecargar();
                        return;
                    }
                    // Error real no-404
                    variantesFallidas = true;
                    throw syncErr;
                }
            }

            if (variantesFallidas && (hayVariantes || hayVariantesEliminar)) {
                toastError("El producto base se guardó correctamente, pero las variantes/imágenes todavía no pudieron sincronizarse con la API actual.");
            }

            cancelarForm();
            await onRecargar();
        } catch (err) {
            // Si el producto base YA fue guardado, NO mostrar error genérico de fallo total
            if (productoBaseGuardado) {
                onNoAutorizado(err);
                toastError("El producto base se guardó correctamente, pero ocurrió un error durante la sincronización posterior de variantes/imágenes. Las variantes no se garantizan guardadas.");
                try {
                    cancelarForm();
                    await onRecargar();
                } catch {
                    // Ignorar errores secundarios
                }
                return;
            }

            onNoAutorizado(err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            toastError(axiosError?.response?.data?.mensaje || "No se pudo guardar el producto. Intenta de nuevo.");
        } finally {
            setCargando(false);
        }
    };

    const handleEliminar = async (producto: Producto) => {
        const confirmacion = await Swal.fire({
            title: "¿Eliminar producto?",
            text: `¿Seguro que quieres eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
        });

        if (!confirmacion.isConfirmed) return;

        try {
            await eliminarProducto(producto.id_producto);
            toastExito("Producto eliminado");
            await onRecargar();
        } catch (err) {
            onNoAutorizado(err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            toastError(axiosError?.response?.data?.mensaje || "No se pudo eliminar el producto");
        }
    };

    const productosOferta = productos.filter(
        (p) => p.precio_anterior && Number(p.precio_anterior) > Number(p.precio)
    );

    return (
        <>
            {pestana === "ofertas" && (
                <>
                    <div className="admin-toolbar">
                        <button className="btn-nuevo" onClick={abrirNuevo}>
                            <FaPlus /> Nueva oferta
                        </button>
                    </div>

                    <p className="banner-ayuda">
                        Productos con precio anterior (descuento activo). Edítalos para
                        ajustar la oferta o quitar el precio anterior.
                    </p>
                </>
            )}

            {mostrarForm && (
                <div className="modal-overlay" onClick={cancelarForm}>
                    <div
                        className="modal-contenido"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form className="admin-form" onSubmit={handleSubmit}>
                            <h4>{editando ? "Editar producto" : "Nuevo producto"}</h4>

                            <div className="form-grid">
                                <label>
                                    Nombre *
                                    <input
                                        name="nombre"
                                        value={formulario.nombre}
                                        onChange={handleChange}
                                        placeholder="Ej: Labial Mate"
                                        required
                                    />
                                </label>

                                <label>
                                    Categoría *
                                    <select
                                        name="id_categoria"
                                        value={formulario.id_categoria}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Selecciona una categoría</option>
                                        {categorias.map((c) => (
                                            <option key={c.id_categoria} value={c.id_categoria}>
                                                {c.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Precio (L) *
                                    <input
                                        name="precio"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formulario.precio}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        required
                                    />
                                </label>

                                {editando && (
                                    <label>
                                        Precio anterior (L)
                                        <input
                                            name="precio_anterior"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formulario.precio_anterior}
                                            onChange={handleChange}
                                            placeholder="Opcional, se muestra tachado"
                                        />
                                    </label>
                                )}

                                <label>
                                    Stock *
                                    <input
                                        name="stock"
                                        type="number"
                                        min="0"
                                        value={formulario.stock}
                                        onChange={handleChange}
                                        placeholder="0"
                                        required
                                    />
                                </label>

                                <label>
                                    Subcategoría
                                    <input
                                        name="subcategoria"
                                        value={formulario.subcategoria}
                                        onChange={handleChange}
                                        placeholder="Ej: Labiales, Bases, Perfumes"
                                    />
                                </label>

                                {editando && (
                                    <label>
                                        Estado
                                        <select
                                            name="estado"
                                            value={formulario.estado ? "1" : "0"}
                                            onChange={handleChange}
                                        >
                                            <option value="1">Activo</option>
                                            <option value="0">Deshabilitado</option>
                                        </select>
                                    </label>
                                )}

                                <label className="form-checkbox">
                                    <input
                                        type="checkbox"
                                        name="destacado"
                                        checked={formulario.destacado}
                                        onChange={handleChange}
                                    />
                                    <span>Marcar como nuevo (etiqueta "Nuevo")</span>
                                </label>

                                <label className="form-full">
                                    Descripción
                                    <textarea
                                        name="descripcion"
                                        rows={3}
                                        value={formulario.descripcion}
                                        onChange={handleChange}
                                        placeholder="Descripción del producto"
                                    />
                                </label>

                                <label className="form-full">
                                    <span>Imagen</span>
                                    <span className="form-ayuda-imagen">
                                        Formatos admitidos: <strong>JPG, JPEG, PNG, WEBP, GIF, JFIF</strong> &bull; Tamaño máx: <strong>10 MB</strong><br />
                                        Dimensiones libres: <strong>Cualquier proporción</strong> (cuadrada 1:1, vertical 3:4, horizontal o alta resolución como 3000 × 4000 px). El sistema se adapta automáticamente.
                                    </span>
                                    <input type="file" accept="image/*" onChange={handleImagen} />
                                    {imagenPrevia && (
                                        <img src={imagenPrevia} alt="Vista previa" className="form-preview" />
                                    )}
                                </label>
                            </div>

                            <div className="variantes-seccion">
                                <div className="variantes-cab">
                                    <h5>Variantes del producto</h5>
                                    <button
                                        type="button"
                                        className="btn-variante-agregar"
                                        onClick={agregarVarianteForm}
                                    >
                                        <FaPlus /> Agregar tono
                                    </button>
                                </div>

                                <p className="variantes-ayuda">
                                    Añade cada tono o variante con su precio, stock, código e
                                    imágenes. El producto se registra una sola vez.
                                </p>

                                {formulario.variantes.length === 0 && (
                                    <p className="variantes-vacio">
                                        Este producto no tiene variantes. Se venderá como un
                                        producto simple.
                                    </p>
                                )}

                                {formulario.variantes.map((v, i) => (
                                    <div className="variante-bloque" key={v.id_variante ?? `n-${i}`}>
                                        <div className="variante-bloque-cab">
                                            <strong>Tono {i + 1}</strong>

                                            <div className="variante-bloque-acciones">
                                                <label className="variante-activa">
                                                    <input
                                                        type="checkbox"
                                                        checked={v.estado}
                                                        onChange={(e) =>
                                                            cambiarVarianteForm(i, "estado", e.target.checked)
                                                        }
                                                    />
                                                    Activa
                                                </label>

                                                <button
                                                    type="button"
                                                    className="variante-quitar"
                                                    onClick={() => eliminarVarianteForm(i)}
                                                    title="Eliminar variante"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="variante-grid">
                                            <label>
                                                Tono *
                                                <input
                                                    value={v.tono}
                                                    onChange={(e) =>
                                                        cambiarVarianteForm(i, "tono", e.target.value)
                                                    }
                                                    placeholder="Ej: Supermodel"
                                                />
                                            </label>

                                            <label>
                                                Color
                                                <input
                                                    type="color"
                                                    value={v.color || "#cccccc"}
                                                    onChange={(e) =>
                                                        cambiarVarianteForm(i, "color", e.target.value)
                                                    }
                                                />
                                            </label>

                                            <label>
                                                Precio (L) *
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={v.precio}
                                                    onChange={(e) =>
                                                        cambiarVarianteForm(i, "precio", e.target.value)
                                                    }
                                                    placeholder="0.00"
                                                />
                                            </label>

                                            <label>
                                                Precio anterior (L)
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={v.precio_anterior}
                                                    onChange={(e) =>
                                                        cambiarVarianteForm(i, "precio_anterior", e.target.value)
                                                    }
                                                    placeholder="Opcional"
                                                />
                                            </label>

                                            <label>
                                                Stock *
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={v.stock}
                                                    onChange={(e) =>
                                                        cambiarVarianteForm(i, "stock", e.target.value)
                                                    }
                                                    placeholder="0"
                                                />
                                            </label>

                                            <label className="form-full">
                                                <span>Imágenes de este tono</span>
                                                <span className="form-ayuda-imagen">
                                                    Formatos admitidos: <strong>JPG, JPEG, PNG, WEBP, GIF, JFIF</strong> &bull; Hasta 12 fotos &bull; Máx. <strong>10 MB</strong> c/u<br />
                                                    Dimensiones libres: <strong>Cualquier proporción</strong> (cuadrada 1:1, vertical 3:4, horizontal, etc., desde estándar hasta 3000 × 4000 px).
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={(e) => handleImagenesVariante(i, e)}
                                                />
                                            </label>
                                        </div>

                                        {v.imagenesPrevia.length > 0 && (
                                            <div className="variante-previa">
                                                {v.imagenesPrevia.map((src, p) => (
                                                    <div className="variante-previa-item" key={`${src}-${p}`}>
                                                        <img src={src} alt="" />
                                                        <button
                                                            type="button"
                                                            onClick={() => quitarImagenVariante(i, p)}
                                                            title="Quitar imagen"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-guardar" disabled={cargando}>
                                    {cargando ? "Guardando..." : "Guardar"}
                                </button>
                                <button type="button" className="btn-cancelar" onClick={cancelarForm}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {productoVisto && (
                <div className="modal-overlay" onClick={cerrarVistaProducto}>
                    <div
                        className="modal-contenido modal-contenido--vista"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="producto-vista-titulo">
                            {productoVisto.nombre}
                        </h3>

                        <div className="producto-vista">
                            <div className="producto-vista-card">
                                <ProductoCard producto={productoVisto} soloLectura />
                            </div>

                            <div className="producto-vista-detalles">
                                <div className="producto-vista-dato">
                                    <span className="producto-vista-etiqueta">Categoría</span>
                                    <span className="producto-vista-valor">
                                        {productoVisto.categoria?.nombre || "—"}
                                    </span>
                                </div>

                                <div className="producto-vista-dato">
                                    <span className="producto-vista-etiqueta">Subcategoría</span>
                                    <span className="producto-vista-valor">
                                        {productoVisto.subcategoria || "—"}
                                    </span>
                                </div>

                                <div className="producto-vista-dato">
                                    <span className="producto-vista-etiqueta">Stock</span>
                                    <span className="producto-vista-valor">
                                        {productoVisto.stock}
                                    </span>
                                </div>

                                <div className="producto-vista-dato">
                                    <span className="producto-vista-etiqueta">Estado</span>
                                    <span
                                        className={
                                            productoVisto.estado
                                                ? "chip-activo"
                                                : "chip-inactivo"
                                        }
                                    >
                                        {productoVisto.estado ? "Activo" : "Deshabilitado"}
                                    </span>
                                </div>

                                <div className="producto-vista-desc">
                                    <span className="producto-vista-etiqueta">Descripción</span>
                                    <p>
                                        {productoVisto.descripcion || "Sin descripción."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-guardar"
                                onClick={editarProductoVisto}
                            >
                                <FaEdit /> Editar
                            </button>
                            <button
                                type="button"
                                className="btn-cancelar"
                                onClick={cerrarVistaProducto}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {pestana === "productos" ? (
                <ProductosInventario
                    productos={productos}
                    categorias={categorias}
                    onRecargar={onRecargar}
                    onNoAutorizado={onNoAutorizado}
                    onNuevo={abrirNuevo}
                    onEditar={abrirEdicion}
                    onEliminar={handleEliminar}
                    onVer={setProductoVisto}
                />
            ) : (
                <div className="admin-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Imagen</th>
                                <th>Nombre</th>
                                <th>Precio</th>
                                <th>Antes</th>
                                <th>Descuento</th>
                                <th>Stock</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productosOferta.map((p) => {
                                const descuento = Math.round(
                                    ((Number(p.precio_anterior) - Number(p.precio)) /
                                        Number(p.precio_anterior)) *
                                        100
                                );

                                return (
                                    <tr key={p.id_producto}>
                                        <td>
                                            {p.imagen ? (
                                                <img src={rutaImagen(p.imagen)} alt={p.nombre} className="tabla-img" />
                                            ) : (
                                                <span className="sin-imagen">—</span>
                                            )}
                                        </td>
                                        <td>{p.nombre}</td>
                                        <td>L {p.precio}</td>
                                        <td>
                                            <span className="precio-tachado">L {p.precio_anterior}</span>
                                        </td>
                                        <td>
                                            <span className="chip-oferta">-{descuento}%</span>
                                        </td>
                                        <td>{p.stock}</td>
                                        <td className="acciones">
                                            <button onClick={() => abrirEdicion(p)} title="Editar">
                                                <FaEdit />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {productosOferta.length === 0 && (
                        <p className="sin-productos">Aún no hay ofertas activas.</p>
                    )}
                </div>
            )}
        </>
    );
}

export default ProductosSection;
