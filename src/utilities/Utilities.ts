import type { TypeUtilities, TypeGenericResponse } from "./TypeUtilities";
import { INIT } from "./TypeUtilities";
import api from "./axiosConfig";

// Crea un objeto de respuesta NUEVO e independiente en cada llamada,
// para evitar que peticiones en paralelo se pisen entre sí.
function crearRespuestaVacia(): TypeGenericResponse {
    return {
        ...INIT,
        error: { ...INIT.error },
    };
}

async function getData(props: TypeUtilities) {
    return await api.get(props.url).then(response => {
        const responseData = crearRespuestaVacia();
        if (response['status'] === 401) {
            responseData.status = 401;
            return responseData;
        };
        responseData.data = response.data;
        responseData.status = response.status;
        return responseData;
    }).catch(error => {
        const responseData = crearRespuestaVacia();
        const response = error["response"];
        if (response && (response["status"] === 401 || response["status"] === 404)) {
            responseData.error.code = parseInt(response["status"], 10);
            responseData.error.message = response["statusText"];
            return responseData;
        }
        responseData.error.code = 503;
        responseData.error.message = error["statusText"] || error.message;
        return responseData;
    });
};

async function getSingleData(props: TypeUtilities) {
    return await api.get(props.url).then(response => {
        const responseData = crearRespuestaVacia();
        const dataArray = response.data;
        if (response['status'] === 401) {
            responseData.status = 401;
            return responseData;
        };
        responseData.singleData = dataArray?.[0];
        responseData.status = response.status;
        return responseData;
    }).catch(error => {
        const responseData = crearRespuestaVacia();
        const response = error["response"];
        if (response && (response["status"] === 401 || response["status"] === 404)) {
            responseData.error.code = parseInt(response["status"], 10);
            responseData.error.message = response["statusText"];
            return responseData;
        }
        responseData.error.code = 503;
        responseData.error.message = error["statusText"] || error.message;
        return responseData;
    });
};

async function saveData(props: TypeUtilities) {
    const { data } = props;
    return await api.post(props.url, data)
        .then(response => {
            const responseData = crearRespuestaVacia();
            if (response['status'] === 401) {
                responseData.status = 401;
                return responseData;
            };
            responseData.data = response.data;
            responseData.status = response.status;
            return responseData;
        })
        .catch(error => {
            const responseData = crearRespuestaVacia();
            const response = error["response"];
            if (response && (response["status"] === 401 || response["status"] === 404)) {
                responseData.error.code = parseInt(response["status"], 10);
                responseData.error.message = response["statusText"];
                return responseData;
            }
            responseData.error.code = 503;
            responseData.error.message = error["statusText"] || error.message;
            return responseData;
        });
}

async function updateData(props: TypeUtilities) {
    const { data } = props;
    return await api.put(props.url, data)
        .then(response => {
            const responseData = crearRespuestaVacia();
            if (response['status'] === 401) {
                responseData.status = 401;
                return responseData;
            };
            responseData.data = response.data;
            responseData.status = response.status;
            return responseData;
        })
        .catch(error => {
            const responseData = crearRespuestaVacia();
            const response = error["response"];
            if (response && (response["status"] === 401 || response["status"] === 404)) {
                responseData.error.code = parseInt(response["status"], 10);
                responseData.error.message = response["statusText"];
                return responseData;
            }
            responseData.error.code = 503;
            responseData.error.message = error["statusText"] || error.message;
            return responseData;
        });
}

async function deleteData(props: TypeUtilities) {
    return await api.delete(props.url)
        .then(response => {
            const responseData = crearRespuestaVacia();
            if (response['status'] === 200 || response['status'] === 204) {
                responseData.status = 200;
                return responseData;
            };
            responseData.data = response.data;
            responseData.status = response.status;
            return responseData;
        })
        .catch(error => {
            const responseData = crearRespuestaVacia();
            const response = error["response"];
            if (response && (response["status"] === 401 || response["status"] === 404)) {
                responseData.error.code = parseInt(response["status"], 10);
                responseData.error.message = response["statusText"];
                return responseData;
            }
            responseData.error.code = 503;
            responseData.error.message = error["statusText"] || error.message;
            return responseData;
        });
}

async function LogIn(props: TypeUtilities) {
    const { data, url } = props;

    return await api.post(url, data)
        .then(response => {
            const responseData = crearRespuestaVacia();

            if (response.status === 401) {
                responseData.status = 401;
                return responseData;
            }

            responseData.data = response.data;
            responseData.status = response.status;

            const body = response.data?.data;

            if (body?.token) {
                localStorage.setItem("token", body.token);
                if (body.admin) {
                    localStorage.setItem("admin", JSON.stringify(body.admin));
                }
            }

            return responseData;
        })
        .catch(error => {
            const responseData = crearRespuestaVacia();
            const response = error.response;

            if (response?.status === 401 || response?.status === 404) {
                responseData.error.code = response.status;
                responseData.error.message = response.statusText;
                return responseData;
            }

            responseData.error.code = 503;
            responseData.error.message = error.message;
            return responseData;
        });
}

async function LogOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
}

function getToken() {
    const tokenStored = localStorage.getItem("token");
    return Boolean(tokenStored && tokenStored.length > 0);
}

export {
    getData,
    getSingleData,
    saveData,
    deleteData,
    updateData,
    LogIn,
    LogOut,
    getToken,
};
