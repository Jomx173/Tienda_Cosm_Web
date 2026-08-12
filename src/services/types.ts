export type Categoria = {
    id_categoria: number;
    nombre: string;
    descripcion?: string;
    imagen?: string | null;
    created_at?: string;
    updated_at?: string;
    productos?: Producto[];
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
    correo?: string;
    rolId: number;
};

export type RespuestaApi<T = unknown> = {
    ok: boolean;
    data: T;
    mensaje?: string;
};

export type ItemCarrito = {
    id: number;
    nombre: string;
    precio: number | string;
    imagen?: string;
    cantidad: number;
};
