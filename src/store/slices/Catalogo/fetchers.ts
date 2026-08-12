import { CreateFetchers } from "../../../storeConfig";
import { NAME } from "./namespace";
import { obtenerProductos, obtenerCategorias, obtenerBanners } from "../../../services/productoService";

export default CreateFetchers(NAME, {
    async getProductos(todos: boolean) {
        const data = await obtenerProductos(todos);
        return { productos: data ?? [] };
    },
    async getCategorias(todos: boolean) {
        const data = await obtenerCategorias(todos);
        return { categorias: data ?? [] };
    },
    async getBanners(todos: boolean) {
        const data = await obtenerBanners(todos);
        return { banners: data ?? [] };
    },
});
