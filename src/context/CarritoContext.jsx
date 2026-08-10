import { createContext, useContext, useEffect, useState } from "react";

const CarritoContext = createContext();

const CLAVE = "md_carrito";

function leerCarrito() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE)) || [];
    } catch {
        return [];
    }
}

export function CarritoProvider({ children }) {
    const [items, setItems] = useState(leerCarrito);

    useEffect(() => {
        localStorage.setItem(CLAVE, JSON.stringify(items));
    }, [items]);

    const agregar = (producto, cantidad = 1) => {
        const id = producto.id_producto ?? producto.id;

        setItems((prev) => {
            const existe = prev.find((item) => item.id === id);

            if (existe) {
                return prev.map((item) =>
                    item.id === id
                        ? { ...item, cantidad: item.cantidad + cantidad }
                        : item
                );
            }

            return [
                ...prev,
                {
                    id,
                    nombre: producto.nombre,
                    precio: producto.precio,
                    imagen: producto.imagen || "",
                    cantidad,
                },
            ];
        });
    };

    const cambiarCantidad = (id, cantidad) => {
        if (cantidad < 1) return;

        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, cantidad } : item
            )
        );
    };

    const quitar = (id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const vaciar = () => setItems([]);

    const total = items.reduce(
        (suma, item) => suma + Number(item.precio) * item.cantidad,
        0
    );

    const cantidadTotal = items.reduce(
        (suma, item) => suma + item.cantidad,
        0
    );

    return (
        <CarritoContext.Provider
            value={{
                items,
                agregar,
                cambiarCantidad,
                quitar,
                vaciar,
                total,
                cantidadTotal,
            }}
        >
            {children}
        </CarritoContext.Provider>
    );
}

export function useCarrito() {
    return useContext(CarritoContext);
}
