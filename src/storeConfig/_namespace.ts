export const NAME = "@@STORE";
export const NAME_STORAGE = "STORAGE";

export const SEP = ":";

export const ACTION = {
    INIT: [NAME, "INIT"].join(SEP),
    STORAGE_HYDRATE: [NAME, NAME_STORAGE, "HYDRATE"].join(SEP),
};
