import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaTimes,
    FaStar,
    FaRegStar,
    FaArrowLeft,
    FaArrowRight,
    FaImage,
} from "react-icons/fa";

import {
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    buscarProductoDuplicado,
    crearVariante,
    actualizarVariante,
    eliminarVariante,
    subirImagenProducto,
    type DatosVariante,
} from "../../../services/productoService";
import type { Categoria, Producto, ProductoImagen, ProductoVariante } from "../../../services/types";
import { rutaImagen } from "../../../services/api";
import { comprimirImagen } from "../../../utils/comprimirImagen";
import { toastExito, toastError } from "../../../utils/toast";
import ProductoCard from "../../../components/ProductoCard/ProductoCard";
import ProductosInventario from "./ProductosInventario";

type FotoProducto = {
    id?: number;
    url: string;
    archivo?: File;
    esPrincipal: boolean;
    esNueva: boolean;
};

type FormularioVariante = {
    id_variante: number | null;
    tono: string;
    color: string;
    precio: string;
    precio_anterior: string;
    stock: string;
    codigo: string;
    estado: boolean;
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
});

type FormularioProducto = {
    nombre: string;
    descripcion: string;
    precio: string;
    precio_anterior: string;
    stock: string;
    subcategoria: string;
    id_categoria: string;
    estado: boolean;
    destacado: boolean;
    fotos: FotoProducto[];
    fotosEliminar: number[];
    variantes: FormularioVariante[];
};

const formularioVacio: FormularioProducto = {
    nombre: "",
    descripcion: "",
    precio: "",
    precio_anterior: "",
    stock: "",
    subcategoria: "",
    id_categoria: "",
    estado: true,
    destacado: false,
    fotos: [],
    fotosEliminar: [],
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
    const [productoVisto, setProductoVisto] = useState<Producto | null>(null);
    const [cargando, setCargando] = useState(false);
    const [subiendoFotos, setSubiendoFotos] = useState<{
        completadas: number;
        total: number;
        avance: number;
        nombre: string;
    } | null>(null);

    const abrirNuevo = () => {
        setEditando(null);
        setFormulario(formularioVacio);
        setMostrarForm(true);
        navegar("/admin/productos");
    };

    const abrirEdicion = (producto: Producto) => {
        setEditando(producto);

        const fotosExistentes: FotoProducto[] = [];
        const imagenesGenerales = (producto.imagenes ?? []).filter((i) => !i.id_variante);

        if (imagenesGenerales.length > 0) {
            imagenesGenerales.forEach((img, idx) => {
                const esPrincipal = producto.imagen ? img.imagen === producto.imagen : idx === 0;
                fotosExistentes.push({
                    id: img.id_imagen,
                    url: rutaImagen(img.imagen),
                    esPrincipal,
                    esNueva: false,
                });
            });
        } else if (producto.imagen) {
            fotosExistentes.push({
                id: undefined,
                url: rutaImagen(producto.imagen),
                esPrincipal: true,
                esNueva: false,
            });
        }

        if (fotosExistentes.length > 0 && !fotosExistentes.some((f) => f.esPrincipal)) {
            fotosExistentes[0].esPrincipal = true;
        }

        setFormulario({
            nombre: producto.nombre,
            descripcion: producto.descripcion || "",
            precio: String(producto.precio ?? ""),
            precio_anterior:
                producto.precio_anterior !== null && producto.precio_anterior !== undefined
                    ? String(producto.precio_anterior)
                    : "",
            stock: String(producto.stock ?? ""),
            subcategoria: producto.subcategoria || "",
            id_categoria:
                producto.id_categoria !== null && producto.id_categoria !== undefined
                    ? String(producto.id_categoria)
                    : "",
            estado: Boolean(producto.estado),
            destacado: Boolean(producto.destacado),
            fotos: fotosExistentes,
            fotosEliminar: [],
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
            })),
        });
        setMostrarForm(true);
        navegar("/admin/productos");
    };

    const cancelarForm = () => {
        // No permitir cerrar el modal mientras se guarda o se suben fotos
        if (cargando) return;

        formulario.fotos.forEach((f) => {
            if (f.esNueva && f.url.startsWith("blob:")) {
                URL.revokeObjectURL(f.url);
            }
        });
        setMostrarForm(false);
        setEditando(null);
        setFormulario(formularioVacio);
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

    // ------- Gestión de Fotos del Producto (Hasta 8 fotos) -------

    const handleFotosSeleccionadas = async (e: ChangeEvent<HTMLInputElement>) => {
        const archivos = Array.from(e.target.files ?? []);
        e.target.value = "";
        if (archivos.length === 0) return;

        const maxTotal = 8;
        const cupoDisponible = maxTotal - formulario.fotos.length;

        if (cupoDisponible <= 0) {
            toastError("Ya alcanzaste el máximo de 8 fotos para este producto.");
            return;
        }

        const permitidas = ["jpg", "jpeg", "jpe", "jfif", "png", "gif", "webp"];
        const maxBytesOriginal = 25 * 1024 * 1024; // 25 MB (se comprimen antes de subir)

        const validos: File[] = [];

        for (const archivo of archivos) {
            const ext = (archivo.name.split(".").pop() || "").toLowerCase();

            if (!permitidas.includes(ext)) {
                toastError(`"${archivo.name}" tiene un formato no soportado (usa JPG, PNG, WEBP, GIF o JFIF).`);
                continue;
            }

            if (archivo.size > maxBytesOriginal) {
                toastError(
                    `"${archivo.name}" es demasiado grande (${(
                        archivo.size /
                        (1024 * 1024)
                    ).toFixed(1)} MB). Elige una foto de hasta 25 MB.`
                );
                continue;
            }

            validos.push(archivo);
        }

        if (validos.length === 0) return;

        let aAgregar = validos;
        if (validos.length > cupoDisponible) {
            toastError(
                `Solo se pueden agregar hasta ${cupoDisponible} foto(s) más (máx. 8 por producto). Se agregaron las primeras ${cupoDisponible}.`
            );
            aAgregar = validos.slice(0, cupoDisponible);
        }

        // Comprimir en el navegador para que cada foto quepa en su propia petición (< 4 MB)
        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "info",
            title: `Comprimiendo ${aAgregar.length} foto(s)…`,
            showConfirmButton: false,
        });

        const problemas: string[] = [];
        const nuevasFotos: FotoProducto[] = [];

        try {
            for (const archivo of aAgregar) {
                const resultado = await comprimirImagen(archivo);

                if (!resultado.ok) {
                    problemas.push(`"${archivo.name}" ${resultado.motivo}`);
                    continue;
                }

                nuevasFotos.push({
                    url: URL.createObjectURL(resultado.archivo),
                    archivo: resultado.archivo,
                    esPrincipal: false,
                    esNueva: true,
                });
            }
        } finally {
            Swal.close();
        }

        problemas.forEach((motivo) => toastError(motivo));

        if (nuevasFotos.length === 0) return;

        setFormulario((prev) => {
            const yaTienePrincipal = prev.fotos.some((f) => f.esPrincipal);
            if (!yaTienePrincipal && nuevasFotos.length > 0) {
                nuevasFotos[0].esPrincipal = true;
            }

            return {
                ...prev,
                fotos: [...prev.fotos, ...nuevasFotos],
            };
        });
    };

    const quitarFoto = (indice: number) => {
        setFormulario((prev) => {
            const foto = prev.fotos[indice];
            if (!foto) return prev;

            if (foto.esNueva && foto.url.startsWith("blob:")) {
                URL.revokeObjectURL(foto.url);
            }

            const nuevasEliminar = [...prev.fotosEliminar];
            if (!foto.esNueva && foto.id) {
                nuevasEliminar.push(foto.id);
            }

            let restantes = prev.fotos.filter((_, idx) => idx !== indice);

            if (foto.esPrincipal && restantes.length > 0) {
                restantes = restantes.map((f, idx) => ({
                    ...f,
                    esPrincipal: idx === 0,
                }));
            }

            return {
                ...prev,
                fotos: restantes,
                fotosEliminar: nuevasEliminar,
            };
        });
    };

    const hacerFotoPrincipal = (indice: number) => {
        setFormulario((prev) => ({
            ...prev,
            fotos: prev.fotos.map((f, idx) => ({
                ...f,
                esPrincipal: idx === indice,
            })),
        }));
    };

    const moverFoto = (origen: number, destino: number) => {
        setFormulario((prev) => {
            if (destino < 0 || destino >= prev.fotos.length) return prev;
            const copia = [...prev.fotos];
            const [item] = copia.splice(origen, 1);
            copia.splice(destino, 0, item);
            return {
                ...prev,
                fotos: copia,
            };
        });
    };

    // ------- Variantes dentro del formulario (Sin imágenes por tono) -------

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

    /**
     * Sube las fotos nuevas una por una (cada petición debe pesar < 4.5 MB por el
     * límite de Vercel). Un fallo en una foto no cancela las demás: se reintenta
     * una vez y, si aún falla, se anota para avisar al final.
     */
    const subirFotosNuevas = async (idProducto: number, fotosNuevas: FotoProducto[]) => {
        const total = fotosNuevas.length;
        const fallidas: string[] = [];
        let idPrincipalNueva: number | null = null;

        setSubiendoFotos({ completadas: 0, total, avance: 0, nombre: fotosNuevas[0]?.archivo?.name ?? "" });

        for (let i = 0; i < total; i++) {
            const foto = fotosNuevas[i];
            const nombre = foto.archivo?.name || `Foto ${i + 1}`;

            const subirUna = () =>
                subirImagenProducto(idProducto, foto.archivo!, (avance) => {
                    setSubiendoFotos({ completadas: i, total, avance, nombre });
                });

            try {
                let creadas: ProductoImagen[] | null = null;

                try {
                    creadas = await subirUna();
                } catch {
                    // Un reintento por si fue un fallo pasajero de red
                    creadas = await subirUna();
                }

                const creada = creadas?.[0];
                if (foto.esPrincipal && creada?.id_imagen) {
                    idPrincipalNueva = creada.id_imagen;
                }
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const eAny = err as any;
                const status = eAny?.response?.status;

                if (status === 401 || status === 403) {
                    setSubiendoFotos(null);
                    onNoAutorizado(err);
                    throw err;
                }

                fallidas.push(nombre);
            }

            setSubiendoFotos({ completadas: i + 1, total, avance: 1, nombre });
        }

        setSubiendoFotos(null);
        return { fallidas, idPrincipalNueva };
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setCargando(true);

        try {
            // Comprobación de duplicados
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
                        confirmButtonText: "Sí, guardar de todas formas",
                        cancelButtonText: "Cancelar y revisar",
                        confirmButtonColor: "#7B1023",
                        cancelButtonColor: "#8A7A63",
                    });

                    if (!continuar.isConfirmed) {
                        setCargando(false);
                        return;
                    }
                }
            } catch (dupErr) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const d = dupErr as any;
                const statusDup = d?.response?.status;
                if (statusDup === 404) {
                    // Endpoint ausente: ignorar
                } else if (statusDup === 401 || statusDup === 403) {
                    onNoAutorizado(dupErr);
                    throw dupErr;
                } else if (statusDup >= 400) {
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
            formData.append("subcategoria", formulario.subcategoria || "");
            formData.append("id_categoria", formulario.id_categoria);
            formData.append("estado", formulario.estado ? "1" : "0");
            formData.append("destacado", formulario.destacado ? "1" : "0");

            // Las fotos NO se adjuntan al guardar el producto: se suben una por una
            // después (cada petición debe pesar menos de 4.5 MB por el límite de Vercel).
            const fotosNuevas = formulario.fotos.filter((f) => f.esNueva && f.archivo);
            const fotoPrincipal = formulario.fotos.find((f) => f.esPrincipal);
            const esEdicion = Boolean(editando);

            // Definir foto principal solo si ya existe en la galería; si es una foto
            // nueva se asigna después, cuando tenga su id.
            if (fotoPrincipal && !fotoPrincipal.esNueva) {
                if (fotoPrincipal.id) {
                    formData.append("id_imagen_principal", String(fotoPrincipal.id));
                } else if (fotoPrincipal.url) {
                    formData.append("imagen_principal", fotoPrincipal.url);
                }
            }

            // Fotos existentes marcadas para eliminar
            if (formulario.fotosEliminar.length > 0) {
                formData.append("imagenes_eliminar", JSON.stringify(formulario.fotosEliminar));
            }

            // Orden final de las fotos existentes
            const ordenExistentes = formulario.fotos
                .map((f, orden) => ({ id_imagen: f.id, orden }))
                .filter((item): item is { id_imagen: number; orden: number } => Boolean(item.id_imagen));

            if (ordenExistentes.length > 0) {
                formData.append("imagenes_orden", JSON.stringify(ordenExistentes));
            }

            let idProducto: number;

            if (editando) {
                await actualizarProducto(editando.id_producto, formData);
                idProducto = editando.id_producto;
            } else {
                const creado = await crearProducto(formData);
                idProducto = creado.id_producto;
            }

            // Sincronizar variantes (tonos sin campo de imagen)
            const datosVariante = (v: FormularioVariante): DatosVariante => ({
                tono: v.tono.trim(),
                color: v.color || null,
                precio: v.precio,
                precio_anterior: v.precio_anterior || null,
                stock: v.stock || "0",
                codigo: v.codigo || null,
                estado: v.estado,
            });

            const hayVariantes = formulario.variantes.some((v) => v.tono.trim());
            const hayVariantesEliminar = variantesEliminar.length > 0;

            if (hayVariantes || hayVariantesEliminar) {
                for (const v of formulario.variantes) {
                    if (!v.tono.trim()) continue;

                    if (v.id_variante) {
                        await actualizarVariante(v.id_variante, datosVariante(v));
                    } else {
                        const creada = await crearVariante(idProducto, datosVariante(v));
                        v.id_variante = creada.id_variante;
                    }
                }

                for (const idVariante of variantesEliminar) {
                    try {
                        await eliminarVariante(idVariante);
                    } catch {
                        // Ignorar si ya fue eliminada
                    }
                }
            }

            // Subir las fotos nuevas una por una, con progreso y reintento por foto
            let fotosFallidas: string[] = [];
            let idPrincipalNueva: number | null = null;

            if (fotosNuevas.length > 0) {
                const subida = await subirFotosNuevas(idProducto, fotosNuevas);
                fotosFallidas = subida.fallidas;
                idPrincipalNueva = subida.idPrincipalNueva;
            }

            // Si la portada marcada es una foto recién subida, asignarla por su id
            if (idPrincipalNueva) {
                try {
                    const datosPrincipal = new FormData();
                    datosPrincipal.append("id_imagen_principal", String(idPrincipalNueva));
                    await actualizarProducto(idProducto, datosPrincipal);
                } catch {
                    // No fatal: la portada queda como la determine la API (primera foto)
                }
            }

            setMostrarForm(false);
            setEditando(null);
            setFormulario(formularioVacio);
            setVariantesEliminar([]);
            await onRecargar();

            if (fotosFallidas.length > 0) {
                await Swal.fire({
                    icon: "warning",
                    title: esEdicion ? "Producto actualizado con avisos" : "Producto creado con avisos",
                    html:
                        `El producto se guardó correctamente, pero ` +
                        (fotosFallidas.length === 1
                            ? "esta foto no se pudo subir:"
                            : `estas ${fotosFallidas.length} fotos no se pudieron subir:`) +
                        `<br><strong>${fotosFallidas.join("<br>")}</strong><br><br>` +
                        "Puedes agregarlas de nuevo desde la edición del producto.",
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#7B1023",
                });
            } else {
                toastExito(esEdicion ? "Producto actualizado" : "Producto creado");
            }
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const eAny = err as any;
            if (eAny?.response?.status === 401 || eAny?.response?.status === 403) {
                onNoAutorizado(err);
                return;
            }
            toastError(eAny?.response?.data?.mensaje || "Error al procesar el producto.");
        } finally {
            setSubiendoFotos(null);
            setCargando(false);
        }
    };

    const handleEliminar = async (producto: Producto) => {
        const confirmar = await Swal.fire({
            icon: "warning",
            title: `¿Eliminar "${producto.nombre}"?`,
            text: "Esta acción no se puede deshacer. Se eliminarán sus variantes y fotos asociadas.",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#7B1023",
            cancelButtonColor: "#8A7A63",
        });

        if (!confirmar.isConfirmed) return;

        try {
            await eliminarProducto(producto.id_producto);
            toastExito("Producto eliminado");
            await onRecargar();
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const eAny = err as any;
            if (eAny?.response?.status === 401 || eAny?.response?.status === 403) {
                onNoAutorizado(err);
                return;
            }
            toastError(eAny?.response?.data?.mensaje || "No se pudo eliminar el producto.");
        }
    };

    const productosOferta = productos.filter(
        (p) =>
            p.precio_anterior !== null &&
            p.precio_anterior !== undefined &&
            Number(p.precio_anterior) > Number(p.precio)
    );

    return (
        <>
            {mostrarForm && (
                <div className="modal-overlay" onClick={cancelarForm}>
                    <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
                        <form className="admin-form" onSubmit={handleSubmit}>
                            <h4>{editando ? "Editar producto" : "Nuevo producto"}</h4>

                            <div className="form-grid">
                                <label className="form-full">
                                    Nombre *
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formulario.nombre}
                                        onChange={handleChange}
                                        placeholder="Nombre del producto"
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
                                    Subcategoría
                                    <input
                                        type="text"
                                        name="subcategoria"
                                        value={formulario.subcategoria}
                                        onChange={handleChange}
                                        placeholder="Ej: Labiales, Sombras..."
                                    />
                                </label>

                                <label>
                                    Precio (L) *
                                    <input
                                        type="number"
                                        name="precio"
                                        step="0.01"
                                        min="0"
                                        value={formulario.precio}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        required
                                    />
                                </label>

                                <label>
                                    Precio anterior (L)
                                    <input
                                        type="number"
                                        name="precio_anterior"
                                        step="0.01"
                                        min="0"
                                        value={formulario.precio_anterior}
                                        onChange={handleChange}
                                        placeholder="Opcional (para ofertas)"
                                    />
                                </label>

                                <label>
                                    Stock *
                                    <input
                                        type="number"
                                        name="stock"
                                        min="0"
                                        value={formulario.stock}
                                        onChange={handleChange}
                                        placeholder="0"
                                        required
                                    />
                                </label>

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

                                <label className="form-checkbox">
                                    <input
                                        type="checkbox"
                                        name="destacado"
                                        checked={formulario.destacado}
                                        onChange={handleChange}
                                    />
                                    <span>Producto destacado</span>
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

                                {/* Galería de fotos del producto */}
                                <div className="form-full fotos-galeria-contenedor">
                                    <div className="fotos-galeria-cabecera">
                                        <label className="fotos-galeria-titulo">
                                            <FaImage /> Fotos del producto ({formulario.fotos.length}/8)
                                        </label>
                                        <span className="form-ayuda-imagen">
                                            Formatos admitidos: <strong>JPG, JPEG, PNG, WEBP, GIF, JFIF</strong> &bull; Hasta <strong>8 fotos</strong>.<br />
                                            Las fotos se <strong>reducen y comprimen automáticamente</strong> antes de subirse (máx. ~4 MB por foto). La foto con el distintivo <strong style={{ color: "#c69214" }}>★ Principal</strong> es la portada del producto.
                                        </span>
                                    </div>

                                    {formulario.fotos.length < 8 && (
                                        <div className="fotos-galeria-input-wrap">
                                            <label className="btn-agregar-fotos">
                                                <FaPlus /> {formulario.fotos.length === 0 ? "Seleccionar fotos" : "Agregar más fotos"}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleFotosSeleccionadas}
                                                    style={{ display: "none" }}
                                                />
                                            </label>
                                            <span className="fotos-disponibles-texto">
                                                Puedes agregar hasta {8 - formulario.fotos.length} foto(s) más.
                                            </span>
                                        </div>
                                    )}

                                    {formulario.fotos.length > 0 && (
                                        <div className="fotos-galeria-grid">
                                            {formulario.fotos.map((foto, index) => (
                                                <div
                                                    key={`${foto.url}-${index}`}
                                                    className={`foto-galeria-card ${foto.esPrincipal ? "es-principal" : ""}`}
                                                >
                                                    <div className="foto-galeria-img-wrap">
                                                        <img src={foto.url} alt={`Foto ${index + 1}`} />
                                                        {foto.esPrincipal && (
                                                            <span className="foto-badge-principal" title="Foto principal de portada">
                                                                ★ Principal
                                                            </span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="foto-btn-eliminar"
                                                            onClick={() => quitarFoto(index)}
                                                            title="Quitar esta foto"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </div>

                                                    <div className="foto-galeria-acciones">
                                                        <div className="foto-reordenar-btns">
                                                            <button
                                                                type="button"
                                                                disabled={index === 0}
                                                                onClick={() => moverFoto(index, index - 1)}
                                                                title="Mover hacia la izquierda"
                                                            >
                                                                <FaArrowLeft />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={index === formulario.fotos.length - 1}
                                                                onClick={() => moverFoto(index, index + 1)}
                                                                title="Mover hacia la derecha"
                                                            >
                                                                <FaArrowRight />
                                                            </button>
                                                        </div>

                                                        {!foto.esPrincipal ? (
                                                            <button
                                                                type="button"
                                                                className="foto-btn-hacer-principal"
                                                                onClick={() => hacerFotoPrincipal(index)}
                                                                title="Marcar como foto principal"
                                                            >
                                                                <FaRegStar /> Hacer principal
                                                            </button>
                                                        ) : (
                                                            <span className="foto-texto-principal">
                                                                <FaStar /> Principal
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sección Variantes (Tonos sin campo de imagen) */}
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
                                    Añade cada tono o variante con su precio, stock y código. El producto se registra una sola vez.
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

                                            <label>
                                                Código
                                                <input
                                                    type="text"
                                                    value={v.codigo}
                                                    onChange={(e) =>
                                                        cambiarVarianteForm(i, "codigo", e.target.value)
                                                    }
                                                    placeholder="Opcional"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {subiendoFotos && (
                                <div className="fotos-subida-progreso" role="status" aria-live="polite">
                                    <div className="fotos-subida-barra">
                                        <span
                                            style={{
                                                width: `${Math.min(
                                                    100,
                                                    Math.round(
                                                        ((subiendoFotos.completadas + subiendoFotos.avance) /
                                                            subiendoFotos.total) *
                                                            100
                                                    )
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="fotos-subida-texto">
                                        Subiendo foto {Math.min(subiendoFotos.completadas + 1, subiendoFotos.total)} de{" "}
                                        {subiendoFotos.total}
                                        {subiendoFotos.avance < 1
                                            ? ` — ${Math.round(subiendoFotos.avance * 100)}%`
                                            : ""}
                                        {subiendoFotos.nombre ? ` · ${subiendoFotos.nombre}` : ""}
                                    </span>
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="submit" className="btn-guardar" disabled={cargando}>
                                    {cargando
                                        ? subiendoFotos
                                            ? "Subiendo fotos..."
                                            : "Guardando..."
                                        : "Guardar"}
                                </button>
                                <button type="button" className="btn-cancelar" onClick={cancelarForm} disabled={cargando}>
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
                                <FaTimes /> Cerrar
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
