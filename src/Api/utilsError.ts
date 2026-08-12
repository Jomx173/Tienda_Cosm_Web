import type { Type } from "./namespaces/errorService";

/**Function: Generic service error */
export function isError<T>(response: Type.ErrorSchema | undefined | T): response is Type.ErrorSchema {
    return (
        Boolean(response) &&
        Boolean((response as Type.ErrorSchema).code || (response as Type.ErrorSchema).message)
    );
}
