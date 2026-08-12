import { CombineReducers } from "../storeConfig";

import {
    NAME as NAME_AUTH,
    Reducer as ReducerAuth,
} from "./slices/Auth";

import {
    NAME as NAME_CARRITO,
    Reducer as ReducerCarrito,
} from "./slices/Carrito";

import {
    NAME as NAME_CATALOGO,
    Reducer as ReducerCatalogo,
} from "./slices/Catalogo";

import {
    NAME as NAME_PEDIDOS,
    Reducer as ReducerPedidos,
} from "./slices/Pedidos";

export default CombineReducers({
    [NAME_AUTH]: ReducerAuth,
    [NAME_CARRITO]: ReducerCarrito,
    [NAME_CATALOGO]: ReducerCatalogo,
    [NAME_PEDIDOS]: ReducerPedidos,
});
