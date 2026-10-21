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
