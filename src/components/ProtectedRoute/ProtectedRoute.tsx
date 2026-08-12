import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { estaAutenticado } from "../../services/authService";

type Props = {
    children: ReactNode;
};

const ProtectedRoute = ({ children }: Props) => {
    if (!estaAutenticado()) {
        return <Navigate to="/login" replace />;
    }

    const token = localStorage.getItem("token");

    const tokenExpirado = (() => {
        try {
            const payload = JSON.parse(atob((token || "").split(".")[1]));
            return payload.exp && payload.exp * 1000 < Date.now();
        } catch (error) {
            return true;
        }
    })();

    if (tokenExpirado) {
        localStorage.removeItem("token");
        localStorage.removeItem("admin");
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
