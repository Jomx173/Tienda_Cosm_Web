export type Categoria = {
    id_categoria: number;
    nombre: string;
    descripcion?: string;
    imagen?: string | null;
    created_at?: string;
    updated_at?: string;
    productos?: Producto[];
};

export type ProductoVariante = {
    id_variante: number;
    id_producto: number;
    tono: string;
    color?: string | null;
    precio: number | string;
    precio_anterior?: number | string | null;
    stock: number | string;
    codigo?: string | null;
    orden?: number;
    estado?: boolean;
    imagenes?: ProductoImagen[];
};

export type ProductoImagen = {
    id_imagen: number;
    id_producto?: number;
    id_variante?: number | null;
    imagen: string;
    orden?: number;
};

export type Producto = {
    id_producto: number;
    nombre: string;
    descripcion?: string | null;
    precio: number | string;
    precio_anterior?: number | string | null;
    stock: number | string;
    codigo?: string | null;
    subcategoria?: string | null;
    id_categoria: number | null;
    estado?: boolean;
    destacado?: boolean;
    imagen?: string | null;
    categoria?: Categoria | null;
    variantes?: ProductoVariante[];
    imagenes?: ProductoImagen[];
    stock_total?: number;
    created_at?: string;
    updated_at?: string;
    /** Alias heredado para compatibilidad con datos antiguos */
    precioAnterior?: number | string | null;
    /** Alias heredado para compatibilidad con datos antiguos */
    nuevo?: boolean;
};

export type Banner = {
    id_banner: number;
    titulo: string;
    descripcion?: string | null;
    orden?: number;
    estado?: boolean;
    imagen?: string | null;
    created_at?: string;
    updated_at?: string;
};

export type ItemPedido = {
    id_producto?: number;
    id_variante?: number | null;
    tono?: string | null;
    codigo?: string | null;
    nombre?: string;
    precio?: number | string;
    cantidad?: number;
};

export type Pedido = {
    id_pedido: number;
    nombre_cliente?: string;
    telefono_cliente?: string;
    direccion?: string;
    estado?: "pendiente" | "confirmado" | "completado" | "cancelado" | string;
    total: number | string;
    fecha?: string;
    productos?: ItemPedido[];
    created_at?: string;
};

export type AdminInfo = {
    id: number;
    nombre: string;
    identidad: string;
    rolId: number;
};

export type RespuestaApi<T = unknown> = {
    ok: boolean;
    data: T;
    mensaje?: string;
};

export type ItemCarrito = {
    /** Clave única de la linea: producto + variante */
    id: string;
    id_producto: number;
    id_variante: number | null;
    tono: string | null;
    nombre: string;
    precio: number | string;
    imagen?: string;
    cantidad: number;
    /** Stock disponible de la variante (o del producto si no tiene) */
    stock?: number;
};

/* =======================
   INVENTARIO Y RESPALDOS
   ======================= */

export type ResumenInventario = {
    productosActivos: number;
    productosStockBajo: number;
    productosAgotados: number;
    unidadesDisponibles: number;
    unidadesProductosSimples: number;
    unidadesVariantes: number;
    itemsStockBajo: number;
    itemsAgotados: number;
    itemsReposicion: number;
    variantesTotales: number;
    /** Umbral de stock bajo aplicado en el cálculo */
    umbral: number;
};

export type MovimientoInventario = {
    id_movimiento: number;
    tipo: "entrada" | "salida" | "correccion" | string;
    id_producto: number;
    id_variante: number | null;
    referencia?: string | null;
    cantidad: number;
    stock_anterior: number;
    stock_nuevo: number;
    motivo?: string | null;
    id_administrador: number | null;
    created_at: string;
};

export type ConteosPlan = {
    crear: number;
    actualizar: number;
    sinCambios: number;
    eliminar: number;
    protegidos?: number;
    protegidas?: number;
    ambiguos?: number;
};

export type PlanRestauracion = {
    modo: string;
    categorias: ConteosPlan;
    productos: ConteosPlan;
    variantes: ConteosPlan;
    imagenes: { crear: number; actualizar: number; omitidas: number };
    advertencias: string[];
    detalle?: {
        productosCrear: string[];
        productosActualizar: string[];
        productosEliminar: string[];
        variantesCrear: string[];
        variantesEliminar: string[];
    };
};

export type MetaRespaldo = {
    formato: string;
    version: number;
    generado_en: string;
    aplicacion: string;
    alcance: string[];
    almacenamiento_imagenes: string;
    imagenes_incluidas: boolean;
    imagenes_pendientes: number;
    nota_imagenes: string;
};

export type ValidacionRespaldo = {
    ok: boolean;
    mensaje: string;
    meta: MetaRespaldo;
    conteos: {
        categorias: number;
        productos: number;
        variantes: number;
        imagenes: number;
    };
    advertencias: string[];
    errores?: string[];
    planCombinar: PlanRestauracion;
    planReemplazar: PlanRestauracion;
};

export type ResultadoRestauracion = {
    ok: boolean;
    mensaje: string;
    modo: string;
    resultado?: {
        categorias: ConteosPlan;
        productos: ConteosPlan;
        variantes: ConteosPlan;
        productosEliminados: number;
        variantesEliminadas: number;
        productosProtegidos: number;
        variantesProtegidas: number;
        imagenesCreadas: number;
        imagenesRestauradas: number;
    };
    respaldoSeguridad?: string;
};
