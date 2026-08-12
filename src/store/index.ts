import { CreateStore } from "../storeConfig";

import Reducer from "./_reducer";
import Storage from "./_storage";

export type StoreState = ReturnType<typeof Reducer>;

export const { Store, useDispatch, useSelector } = CreateStore<StoreState>({ Storage, Reducer });

export type Dispatch = typeof Store.dispatch;
