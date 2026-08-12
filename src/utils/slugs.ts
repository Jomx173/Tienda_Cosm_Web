// Convierte un nombre de categoría en un slug URL:
// "Cuidado Personal" -> "cuidado-personal", "Joyería" -> "joyeria"
export const slugify = (texto = "") =>
    texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

// Busca una categoría por su slug dentro de una lista
export const categoriaPorSlug = <T extends { nombre: string }>(categorias: T[], slug?: string) =>
    categorias.find((c) => slugify(c.nombre) === slug) ?? null;
