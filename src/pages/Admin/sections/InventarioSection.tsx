import { useEffect, useMemo, useState, type FormEvent } from "react";
import Swal from "sweetalert2";
import {
    FaSearch,
    FaSyncAlt,
    FaBoxes,
    FaExclamationTriangle,
    FaCheckCircle,
    FaHistory,
    FaSlidersH,
} from "react-icons/fa";

import { rutaImagen } from "../../../services/api";
import {
    obtenerResumenInventario,
    listarMovimientos,
    ajustarStock,
} from "../../../services/inventarioService";
import type { Categoria, MovimientoInventario, Producto, ResumenInventario } from "../../../services/types";
import {
    STOCK_MINIMO,
    construirItemsInventario,
    estadoInventario,
    ETIQUETA_ESTADO,
    type ItemInventario,
} from "../../../utils/inventario";
import { toastExito, toastError } from "../../../utils/toast";

import "./InventarioSection.css";

type Props = {
    productos: Producto[];
    categorias: Categoria[];
    onRecargar: () => Promise<void>;
    onNoAutorizado: (err: unknown) => void;
};

type Filtros = {
    texto: string;
    tono: string;
    categoria: string;
    estado: string;
};

const filtrosIniciales: Filtros = {
    texto: "",
    tono: "todos",
    categoria: "todas",
    estado: "todos",
};

type FormAjuste = {
    tipo: "entrada" | "salida" | "correccion";
    cantidad: string;
    motivo: string;
};

const formularioVacio: FormAjuste = {
    tipo: "entrada",
    cantidad: "",
    motivo: "",
};

const ETIQUETA_TIPO: Record<string, string> = {
    entrada: "Entrada",
    salida: "Salida",
    correccion: "Corrección",
};

const formatearFecha = (valor: string) => {
    if (!valor) return "—";

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) return valor;

    return fecha.toLocaleString("es", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

function InventarioSection({ productos, categorias, onRecargar, onNoAutorizado }: Props) {
    const [resumen, setResumen] = useState<ResumenInventario | null>(null);
    const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
    const [cargando, setCargando] = useState(true);
    const [filtros, setFiltros] = useState<Filtros>(filtrosIniciales);

    const [ajustando, setAjustando] = useState<ItemInventario | null>(null);
    const [formAjuste, setFormAjuste] = useState<FormAjuste>(formularioVacio);
    const [guardandoAjuste, setGuardandoAjuste] = useState(false);
    const [verHistorial, setVerHistorial] = useState(false);

    const items = useMemo(() => construirItemsInventario(productos), [productos]);

    const tonos = useMemo(() => {
        const lista = new Set<string>();

        for (const item of items) {
            if (item.tono) lista.add(item.tono);
        }

        return Array.from(lista).sort();
    }, [items]);

    const cargarDatos = async () => {
        try {
            const [res, movs] = await Promise.all([
                obtenerResumenInventario(STOCK_MINIMO),
                listarMovimientos(30),
            ]);

            setResumen(res);
            setMovimientos(movs);
        } catch (err) {
            onNoAutorizado(err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            toastError(axiosError?.response?.data?.mensaje || "No se pudo cargar el inventario");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const itemsFiltrados = useMemo(() => {
        const texto = filtros.texto.trim().toLowerCase();

        return items.filter((item) => {
            if (texto) {
                const coincide =
                    item.nombre.toLowerCase().includes(texto) ||
                    (item.tono || "").toLowerCase().includes(texto) ||
                    item.categoria.toLowerCase().includes(texto);

                if (!coincide) return false;
            }

            if (filtros.tono !== "todos" && item.tono !== filtros.tono) return false;

            if (filtros.categoria !== "todas") {
                const categoria = categorias.find((c) => String(c.id_categoria) === filtros.categoria);
                if (!categoria || item.categoria !== categoria.nombre) return false;
            }

            if (filtros.estado !== "todos") {
                const estado = estadoInventario(item.stock);

                if (filtros.estado === "inactivo" && item.estado) return false;
                if (filtros.estado === "activo" && !item.estado) return false;

                if (filtros.estado !== "inactivo" && filtros.estado !== "activo") {
                    if (estado !== filtros.estado) return false;
                }
            }

            return true;
        });
    }, [items, filtros, categorias]);

    const abrirAjuste = (item: ItemInventario) => {
        setAjustando(item);
        setFormAjuste({ ...formularioVacio, cantidad: String(item.stock) });
    };

    const cerrarAjuste = () => {
        setAjustando(null);
        setFormAjuste(formularioVacio);
    };

    const stockResultante = useMemo(() => {
        if (!ajustando) return 0;

        const cantidad = Number(formAjuste.cantidad);

        if (!Number.isFinite(cantidad) || cantidad < 0) return ajustando.stock;

        if (formAjuste.tipo === "entrada") return ajustando.stock + cantidad;
        if (formAjuste.tipo === "salida") return ajustando.stock - cantidad;

        return cantidad;
    }, [ajustando, formAjuste]);

    const handleAjuste = async (e: FormEvent) => {
        e.preventDefault();

        if (!ajustando) return;

        const cantidad = Number(formAjuste.cantidad);
        const motivo = formAjuste.motivo.trim();

        if (!Number.isInteger(cantidad) || cantidad < 0) {
            toastError("La cantidad debe ser un número entero igual o mayor que cero");
            return;
        }

        if (!motivo) {
            toastError("Indica el motivo del ajuste");
            return;
        }

        if (stockResultante < 0) {
            toastError("El stock no puede quedar en negativo");
            return;
        }

        const confirmacion = await Swal.fire({
            title: "Confirmar ajuste de stock",
            html:
                `<strong>${ajustando.nombre}</strong>${ajustando.tono ? ` — ${ajustando.tono}` : ""}<br>` +
                `Stock actual: <strong>${ajustando.stock}</strong> → Stock final: <strong>${stockResultante}</strong><br>` +
                `<span style="font-size:12px;opacity:.75">${ETIQUETA_TIPO[formAjuste.tipo]} · ${cantidad} unidad(es) · ${motivo}</span>`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, registrar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#7B1023",
        });

        if (!confirmacion.isConfirmed) return;

        setGuardandoAjuste(true);

        try {
            const respuesta = await ajustarStock({
                tipo: formAjuste.tipo,
                id_producto: ajustando.id_producto,
                id_variante: ajustando.id_variante,
                cantidad,
                motivo,
            });

            toastExito(respuesta.mensaje);

            cerrarAjuste();

            await onRecargar();
            await cargarDatos();
        } catch (err) {
            onNoAutorizado(err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            toastError(axiosError?.response?.data?.mensaje || "No se pudo registrar el ajuste");
        } finally {
            setGuardandoAjuste(false);
        }
    };

    const limpiarFiltros = () => setFiltros(filtrosIniciales);

    const hayFiltros =
        filtros.texto !== "" ||
        filtros.tono !== "todos" ||
        filtros.categoria !== "todas" ||
        filtros.estado !== "todos";

    return (
        <div className="inventario">
            {/* =======================
                RESUMEN
            ======================= */}
            <div className="inv-resumen">
                <div className="inv-resumen-card">
                    <span className="inv-resumen-icono"><FaBoxes /></span>
                    <div>
                        <strong>{resumen?.productosActivos ?? productos.length}</strong>
                        <span>Productos activos</span>
                    </div>
                </div>

                <div className="inv-resumen-card">
                    <span className="inv-resumen-icono ok"><FaCheckCircle /></span>
                    <div>
                        <strong>{resumen?.unidadesDisponibles ?? 0}</strong>
                        <span>Unidades disponibles</span>
                    </div>
                </div>

                <div className="inv-resumen-card">
                    <span className="inv-resumen-icono warn"><FaExclamationTriangle /></span>
                    <div>
                        <strong>{resumen?.itemsReposicion ?? 0}</strong>
                        <span>Por reponer</span>
                    </div>
                </div>

                <div className="inv-resumen-card">
                    <span className="inv-resumen-icono danger"><FaExclamationTriangle /></span>
                    <div>
                        <strong>{resumen?.itemsAgotados ?? 0}</strong>
                        <span>Agotados</span>
                    </div>
                </div>

                <div className="inv-resumen-card inv-resumen-card--umbral">
                    <span className="inv-resumen-icono"><FaSlidersH /></span>
                    <div>
                        <strong>{resumen?.umbral ?? STOCK_MINIMO}</strong>
                        <span>Umbral de stock bajo</span>
                    </div>
                </div>
            </div>

            {/* =======================
                FILTROS
            ======================= */}
            <div className="admin-toolbar inv-toolbar">
                <div className="admin-busqueda inv-busqueda">
                    <FaSearch className="admin-busqueda-icono" />
                    <input
                        type="text"
                        placeholder="Buscar producto, tono o categoría"
                        value={filtros.texto}
                        onChange={(e) => setFiltros((prev) => ({ ...prev, texto: e.target.value }))}
                    />
                </div>

                <select
                    className="admin-filtro-select"
                    value={filtros.tono}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, tono: e.target.value }))}
                    aria-label="Filtrar por tono"
                >
                    <option value="todos">Todos los tonos</option>
                    {tonos.map((tono) => (
                        <option key={tono} value={tono}>{tono}</option>
                    ))}
                </select>

                <select
                    className="admin-filtro-select"
                    value={filtros.categoria}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, categoria: e.target.value }))}
                    aria-label="Filtrar por categoría"
                >
                    <option value="todas">Todas las categorías</option>
                    {categorias.map((c) => (
                        <option key={c.id_categoria} value={String(c.id_categoria)}>
                            {c.nombre}
                        </option>
                    ))}
                </select>

                <select
                    className="admin-filtro-select"
                    value={filtros.estado}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, estado: e.target.value }))}
                    aria-label="Filtrar por estado de stock"
                >
                    <option value="todos">Todos los estados</option>
                    <option value="disponible">Disponibles</option>
                    <option value="bajo">Stock bajo</option>
                    <option value="agotado">Agotados</option>
                    <option value="activo">Solo activos</option>
                    <option value="inactivo">Solo deshabilitados</option>
                </select>

                {hayFiltros && (
                    <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>
                        Limpiar filtros
                    </button>
                )}

                <button
                    className="btn-nuevo inv-recargar"
                    onClick={cargarDatos}
                    disabled={cargando}
                    title="Recargar inventario"
                >
                    <FaSyncAlt /> Actualizar
                </button>
            </div>

            {/* =======================
                TABLA
            ======================= */}
            <div className="admin-table inv-tabla">
                <table>
                    <thead>
                        <tr>
                            <th>Imagen</th>
                            <th>Producto</th>
                            <th>Tono</th>
                            <th>Categoría</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsFiltrados.map((item) => {
                            const estado = estadoInventario(item.stock);

                            return (
                                <tr key={item.clave} className={!item.estado ? "fila-inactiva" : ""}>
                                    <td>
                                        {item.imagen ? (
                                            <img
                                                src={rutaImagen(item.imagen)}
                                                alt={item.nombre}
                                                className="tabla-img"
                                            />
                                        ) : (
                                            <span className="sin-imagen">-</span>
                                        )}
                                    </td>
                                    <td>
                                        {item.nombre}
                                        {item.esVariante && (
                                            <span className="inv-tag">Variante</span>
                                        )}
                                    </td>
                                    <td>
                                        {item.tono ? (
                                            <span className="inv-tono">
                                                {item.color && (
                                                    <span
                                                        className="inv-tono-punto"
                                                        style={{ background: item.color }}
                                                    />
                                                )}
                                                {item.tono}
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td>{item.categoria}</td>
                                    <td>
                                        <span className={`inv-stock inv-stock--${estado}`}>
                                            {item.stock}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`chip-estado ${estado}`}>
                                            {ETIQUETA_ESTADO[estado]}
                                        </span>
                                        {!item.estado && (
                                            <span className="chip-inactivo">Deshabilitado</span>
                                        )}
                                    </td>
                                    <td className="acciones">
                                        <button
                                            className="accion-ver"
                                            onClick={() => abrirAjuste(item)}
                                            title="Ajustar stock"
                                        >
                                            <FaSlidersH />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {itemsFiltrados.length === 0 && (
                    <p className="sin-productos">
                        {items.length === 0
                            ? "Aún no hay productos en el inventario."
                            : "No hay resultados para los filtros aplicados."}
                    </p>
                )}
            </div>

            <p className="inv-total">
                Mostrando {itemsFiltrados.length} de {items.length} referencias
                {hayFiltros && " (filtros aplicados)"}
            </p>

            {/* =======================
                HISTORIAL
            ======================= */}
            <div className="inv-historial">
                <button
                    className="inv-historial-boton"
                    onClick={() => setVerHistorial((v) => !v)}
                >
                    <FaHistory /> Historial de movimientos ({movimientos.length})
                </button>

                {verHistorial && (
                    <div className="admin-table inv-tabla">
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                    <th>Referencia</th>
                                    <th>Cantidad</th>
                                    <th>Stock</th>
                                    <th>Motivo</th>
                                    <th>Admin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movimientos.map((m) => (
                                    <tr key={m.id_movimiento}>
                                        <td>{formatearFecha(m.created_at)}</td>
                                        <td>
                                            <span className={`inv-mov inv-mov--${m.tipo}`}>
                                                {ETIQUETA_TIPO[m.tipo] || m.tipo}
                                            </span>
                                        </td>
                                        <td>{m.referencia || `Producto #${m.id_producto}`}</td>
                                        <td>{m.cantidad}</td>
                                        <td>
                                            {m.stock_anterior} → {m.stock_nuevo}
                                        </td>
                                        <td>{m.motivo || "—"}</td>
                                        <td>{m.id_administrador ? `#${m.id_administrador}` : "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {movimientos.length === 0 && (
                            <p className="sin-productos">Todavía no hay movimientos registrados.</p>
                        )}
                    </div>
                )}
            </div>

            {/* =======================
                MODAL DE AJUSTE
            ======================= */}
            {ajustando && (
                <div className="modal-overlay" onClick={cerrarAjuste}>
                    <div
                        className="modal-contenido modal-contenido--compacto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form className="admin-form" onSubmit={handleAjuste}>
                            <h4>Ajustar stock</h4>

                            <p className="inv-ajuste-producto">
                                <strong>{ajustando.nombre}</strong>
                                {ajustando.tono && ` — ${ajustando.tono}`}
                                <span>Stock actual: {ajustando.stock} unidad(es)</span>
                            </p>

                            <div className="form-grid">
                                <label>
                                    Tipo de movimiento *
                                    <select
                                        name="tipo"
                                        value={formAjuste.tipo}
                                        onChange={(e) =>
                                            setFormAjuste((prev) => ({
                                                ...prev,
                                                tipo: e.target.value as FormAjuste["tipo"],
                                            }))
                                        }
                                    >
                                        <option value="entrada">Entrada (sumar unidades)</option>
                                        <option value="salida">Salida (restar unidades)</option>
                                        <option value="correccion">Corrección (conteo físico)</option>
                                    </select>
                                </label>

                                <label>
                                    {formAjuste.tipo === "correccion"
                                        ? "Stock real (unidades) *"
                                        : "Cantidad *"}
                                    <input
                                        type="number"
                                        name="cantidad"
                                        min="0"
                                        step="1"
                                        value={formAjuste.cantidad}
                                        onChange={(e) =>
                                            setFormAjuste((prev) => ({
                                                ...prev,
                                                cantidad: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </label>

                                <label className="form-full">
                                    Motivo *
                                    <input
                                        type="text"
                                        name="motivo"
                                        maxLength={255}
                                        placeholder="Ej: Reposición de bodega, conteo de inventario..."
                                        value={formAjuste.motivo}
                                        onChange={(e) =>
                                            setFormAjuste((prev) => ({
                                                ...prev,
                                                motivo: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </label>
                            </div>

                            <p className={`inv-ajuste-preview ${stockResultante < 0 ? "error" : ""}`}>
                                Stock final: <strong>{stockResultante}</strong> unidad(es)
                                {stockResultante < 0 && " — no se puede dejar en negativo"}
                            </p>

                            <div className="form-actions">
                                <button type="submit" className="btn-guardar" disabled={guardandoAjuste}>
                                    {guardandoAjuste ? "Registrando..." : "Registrar ajuste"}
                                </button>
                                <button type="button" className="btn-cancelar" onClick={cerrarAjuste}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InventarioSection;
