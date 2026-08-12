import type * as Toolkit from "@reduxjs/toolkit";
import type { Dispatch, MiddlewareAPI, AnyAction } from "redux";

import { NAME, SEP, ACTION } from "./_namespace";

const { NODE_ENV } = import.meta.env;

enum ErrCode {
    E00 = "Expecting a valid root key.",
    E01 = "Could not find '%' on state.",
    E02 = "Driver '%s' is not available on the browser.",
    E03 = "Could not serialize state for: %s",
    E04 = "Could not unserialize state for: %s",
}

export enum StorageDriver {
    LOCAL = "localStorage",
    SESSION = "sessionStorage",
}

export type SliceCfg = {
    key: string;
    type: StorageDriver;
};

export type StorageState = {
    /** The rootname for the storage  */
    root: string;
    slices: SliceCfg[];
    /** The middleware function, it receives the middleware API */
    storageMiddleware: (
        api: MiddlewareAPI,
    ) => (next: Dispatch) => (action: AnyAction) => Promise<AnyAction>;
    /** Default set of action available to trigger */
    storageAction: {
        /** Removes slice from the storage */
        unload: (slice: string) => AnyAction;
    };
};

export type StorageReducerParam<S> = {
    store?: Toolkit.EnhancedStore<S>;
    self: StorageState;
    action: AnyAction;
    state: S;
};

/**
 * @param root - The key used to store the data on the storage.
 * @param slices - The slices to store.
 */
export function Storage(root: string, slices: SliceCfg[]): StorageState {
    if (!root) throw new StorageError(ErrCode.E00);

    return {
        slices,
        root,
        storageMiddleware(api) {
            return (next) => storageMiddleware.bind(null, api, next);
        },
        storageAction: {
            unload(slice) {
                return { type: `${NAME}/UNLOAD`, payload: slice };
            },
        },
    };

    async function storageMiddleware(api: MiddlewareAPI, next: Dispatch, action: AnyAction) {
        // nothing related to storage to do.
        if (!slices.length) return next(action);

        const { getState } = api;
        // the action matches one of the target slices?
        const sliceKey: string = action.type.split("/")[0] || "";
        const sliceCfg = slices.find(({ key }) => key === sliceKey);
        if (!sliceCfg) return next(action);

        // get the corresponding driver
        const storeKey = [root, sliceKey].join(SEP);
        const driver = StorageGetDriver(sliceCfg.type);
        const nextAction = next(action);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sliceState = (getState() as any)[sliceKey];

        if (!sliceState) throw new StorageError(ErrCode.E01, sliceKey);

        // update the storage, whenever the state of the slice changes
        const _action = mergeAction(nextAction, { type: nextAction.type, payload: sliceState });
        try {
            const serializedState = JSON.stringify(sliceState);
            await driver.set(storeKey, serializedState);
        } catch (e) {
            throw new StorageError(ErrCode.E03, sliceKey);
        }
        return _action;
    }
}

export function StorageReducer<S>({ store, self, state, action }: StorageReducerParam<S>): S {
    const { slices, root } = self;

    if (action.type === ACTION.STORAGE_HYDRATE) {
        const { key, slice } = action.payload;
        return { ...state, [key]: slice };
    }

    // Initial call
    if (action.type === ACTION.INIT) {
        // trigger population of all slices (if data available)
        slices.forEach((slice) =>
            StorageGetDriver(slice.type)
                .get([root, slice.key].join(SEP))
                .then((value) => {
                    if (!value) return;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    store?.dispatch({
                        type: ACTION.STORAGE_HYDRATE,
                        payload: { key: slice.key, slice: JSON.parse(value) },
                    });
                })
                .catch(() => {
                    throw new StorageError(ErrCode.E04, slice.key);
                }),
        );
    }

    return state;
}

export function StorageGetDriver(type: StorageDriver) {
    const driver: Storage = window[type as keyof Window];
    if (!driver) throw new StorageError(ErrCode.E02, type);
    return {
        get(key: string): Promise<string | null> {
            return new Promise((resolve) => {
                resolve(driver.getItem(key));
            });
        },
        set(key: string, val: string): Promise<void> {
            return new Promise((resolve) => {
                resolve(driver.setItem(key, val));
            });
        },
        del(key: string): Promise<void> {
            return new Promise((resolve) => {
                resolve(driver.removeItem(key));
            });
        },
    };
}

function mergeAction(curr: AnyAction, next: AnyAction) {
    const isObjectNext = Object.prototype.toString.call(next.payload) === "[object Object]";
    const isObjectCurr = Object.prototype.toString.call(curr.payload) === "[object Object]";
    // overwrite if payload isn't compatible
    if (!next.payload || !isObjectNext || !isObjectCurr) return { ...curr, payload: next.payload };
    return {
        ...curr,
        payload: { ...(curr.payload || {}), ...next.payload },
    };
}

class StorageError extends Error {
    public name = "StorageError";

    public constructor(code: ErrCode, ...repl: string[]) {
        super();
        type K = keyof typeof ErrCode;
        const key = Object.keys(ErrCode).reduce<string>((action, k) => {
            const val = ErrCode[k as K];
            if (val === code) return k;
            return action;
        }, "");
        const message = !repl.length
            ? ErrCode[key as K]
            : repl.reduce((action, rep) => action.replace("/%/", rep), ErrCode[key as K]);
        this.message = NODE_ENV === "production" ? code : message;
    }
}
