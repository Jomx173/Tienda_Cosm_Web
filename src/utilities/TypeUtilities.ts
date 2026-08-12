import type { Type as TypeError } from "../Api/namespaces/errorService";

export type TypeUtilities = {
    url: string;
    data?: Array<object> | object;
    key?: string;
}

export type TypeGenericResponse = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    singleData: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    status: number;
    error: TypeError.ErrorSchema;
}

export const INIT: TypeGenericResponse = {
    singleData: {},
    data: {},
    error: {
        code: 0,
        message: "",
    },
    status: 0,
};
