import * as Toolkit from "@reduxjs/toolkit";

export default function CreateActions<T extends Record<string, unknown>>(
    name: string,
    keys: (keyof T)[],
) {
    type Actions = {
        [K in keyof T]: T[K] extends never
        ? Toolkit.ActionCreatorWithoutPayload<string>
        : Toolkit.ActionCreatorWithPayload<T[K], string>;
    };
    const reduced = [...new Set(keys)].reduce(
        (acc, key) => ({
            ...acc,
            [key]: Toolkit.createAction<T[typeof key]>(`${name}/${String(key)}`),
        }),
        {} as Actions,
    );
    return reduced;
}
