export const formatearPrecio = (valor: number | string): string => {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return "L 0";
    return `L ${Math.round(numero).toLocaleString("es-HN")}`;
};
