import type { AsyncThunk, ActionCreator } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";

type Unwrap<T> = T extends Promise<infer U> ? U : T;

// obtain the type of the first argument of given function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Arg<T extends (...a: any[]) => any> =
    // no arguments expected ?
    T extends () => any
    ? void
    : // an argument is sent, infer away
    T extends (p: infer A, ...a: any[]) => any
    ? A
    : // could not infer
    never;

type ThunkAPI<State> = {
    getState: () => State;
    dispatch: <A = unknown>(action: ActionCreator<A>) => void;
    requestId: string;
    rejectWithValue: () => object;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CreateFetchers<
    T extends {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [K in keyof T]: (arg: any, thunkAPI: ThunkAPI<any>) => ReturnType<T[K]>;
    },
>(name: string, proto: T) {
    const conf = {};
    type Fetchers = {
        // Iterate all keys to construct a response with corresponding typings.
        [K in keyof T]: AsyncThunk<Unwrap<ReturnType<T[K]>>, Arg<T[K]>, typeof conf>;
    };
    return Object.keys(proto).reduce((acc, key) => {
        const thunk = proto[key as keyof Fetchers];
        return {
            ...acc,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            [key]: createAsyncThunk(`${name}/fetch/${key}`, thunk),
        };
    }, {} as Fetchers);
}
