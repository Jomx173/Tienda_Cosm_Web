import Swal from "sweetalert2";

const BASE = {
    toast: true,
    position: "top-end",
    showCancelButton: false,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
};

export const toastExito = (titulo) => {
    Swal.fire({
        ...BASE,
        icon: "success",
        title: titulo,
        showConfirmButton: false,
        timer: 3000,
        background: "#eaf7ee",
        color: "#1e7e45",
        iconColor: "#2d8a4e",
    });
};

export const toastError = (titulo) => {
    Swal.fire({
        ...BASE,
        icon: "error",
        title: titulo,
        showConfirmButton: true,
        confirmButtonText: "Cerrar",
        confirmButtonColor: "#c0392b",
        timer: undefined,
        timerProgressBar: false,
        background: "#fdeaea",
        color: "#c0392b",
        iconColor: "#c0392b",
    });
};
