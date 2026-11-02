import { usePushNotifications } from "./usePushNotifications";

/**
 * Componente sin interfaz que mantiene activa la lógica de notificaciones
 * push en todo el panel admin (comprueba al montar si la suscripción cambió
 * o venció y la vuelve a registrar sin duplicar).
 *
 * No renderiza nada visible. La tarjeta con el botón vive en la página
 * Configuración (src/pages/Admin/Configuracion.tsx).
 */
export default function PushNotifications() {
    // Invoca el hook para que su useEffect se ejecute al montar el admin,
    // aunque no se muestre ningún botón aquí.
    usePushNotifications();
    return null;
}
