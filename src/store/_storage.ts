import { CreateStorage, StorageDriver } from "../storeConfig";

import { NAME as NAME_CARRITO } from "./slices/Carrito";

const CLAVE_VIEJA_CARRITO = "md_carrito";
const CLAVE_NUEVA_CARRITO = ["root", NAME_CARRITO].join(":");

type ItemLegado = {
    id: number;
    nombre: string;
    precio: number | string;
    cantidad: number;
    imagen?: string;
};

function esObjeto(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function normalizarItems(entradas: unknown[]): ItemLegado[] {
    const items: ItemLegado[] = [];

    for (const entrada of entradas) {
        const fuente = esObjeto(entrada) ? entrada : null;
        if (!fuente) continue;

        const producto = esObjeto(fuente.producto) ? fuente.producto : fuente;

        const id = Number(producto.id_producto ?? producto.id ?? fuente.id_producto ?? fuente.id);
        if (!Number.isFinite(id) || id <= 0) continue;

        const nombre = String(producto.nombre ?? fuente.nombre ?? "");
        if (!nombre) continue;

        const cantidad = Math.max(1, Number(fuente.cantidad) || 1);
        const precio = producto.precio ?? fuente.precio ?? 0;
        const imagen = producto.imagen ?? fuente.imagen;

        items.push({
            id,
            nombre,
            precio: typeof precio === "number" || typeof precio === "string" ? precio : 0,
            cantidad,
            imagen: typeof imagen === "string" && imagen ? imagen : undefined,
        });
    }

    return items;
}

function migrarCarritoLegado(): void {
    try {
        const viejo = window.localStorage.getItem(CLAVE_VIEJA_CARRITO);
        if (viejo == null) return;

        // La migración es única: si ya existe la clave nueva, solo limpiar la vieja.
        if (window.localStorage.getItem(CLAVE_NUEVA_CARRITO) != null) {
            window.localStorage.removeItem(CLAVE_VIEJA_CARRITO);
            return;
        }

        let parseado: unknown;
        try {
            parseado = JSON.parse(viejo);
        } catch {
            window.localStorage.removeItem(CLAVE_VIEJA_CARRITO);
            return;
        }

        const entradas = Array.isArray(parseado)
            ? parseado
            : esObjeto(parseado) && Array.isArray(parseado.items)
                ? parseado.items
                : [];

        const items = normalizarItems(entradas);

        if (items.length > 0) {
            window.localStorage.setItem(CLAVE_NUEVA_CARRITO, JSON.stringify({ items }));
        }

        window.localStorage.removeItem(CLAVE_VIEJA_CARRITO);
    } catch {
        // Si algo falla, no bloquear el arranque de la app.
    }
}

migrarCarritoLegado();

export default CreateStorage([
    { key: NAME_CARRITO, type: StorageDriver.LOCAL },
]);
