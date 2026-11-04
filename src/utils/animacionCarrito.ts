/**
 * Animación de "agregado al carrito": un carrito sale del botón, vuela hasta
 * el ícono del navbar y desaparece. Si no hay navbar (o no se pasa el botón),
 * hace una aparición y desvanecido en el centro.
 */

const SVG_CARRITO = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"></path>
</svg>`;

const bumpCarrito = (): void => {
    const carrito = document.querySelector<HTMLElement>(".navbar-cart");

    if (!carrito) return;

    carrito.classList.remove("navbar-cart--salto");
    // Reinicia la animación si se agrega varias veces seguidas.
    void carrito.offsetWidth;
    carrito.classList.add("navbar-cart--salto");

    window.setTimeout(() => {
        carrito.classList.remove("navbar-cart--salto");
    }, 700);
};

export const animarCarrito = (origen?: HTMLElement | null): void => {
    // Si el usuario pidió reducir movimiento, solo el salto del contador.
    if (
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
        bumpCarrito();
        return;
    }

    const puedeAnimar =
        typeof Element !== "undefined" && "animate" in Element.prototype;

    if (!puedeAnimar) {
        bumpCarrito();
        return;
    }

    const icono = document.createElement("div");
    icono.className = "carrito-animacion";
    icono.setAttribute("aria-hidden", "true");
    icono.innerHTML = SVG_CARRITO;

    const destino = document.querySelector<HTMLElement>(".navbar-cart");
    const desde = origen?.getBoundingClientRect();
    const hasta = destino?.getBoundingClientRect();

    document.body.appendChild(icono);

    // Red de seguridad: que nunca quede un icono colgado en pantalla.
    const limpiar = window.setTimeout(() => icono.remove(), 1400);

    if (desde && hasta && hasta.width > 0 && hasta.height > 0) {
        const x0 = desde.left + desde.width / 2;
        const y0 = desde.top + desde.height / 2;
        const x1 = hasta.left + hasta.width / 2;
        const y1 = hasta.top + hasta.height / 2;
        const dx = x1 - x0;
        const dy = y1 - y0;

        icono.style.left = `${x0}px`;
        icono.style.top = `${y0}px`;

        const animacion = icono.animate(
            [
                {
                    transform: "translate(-50%, -50%) scale(1)",
                    opacity: 1,
                    offset: 0,
                },
                {
                    transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${dy * 0.55 - 24}px)) scale(0.85)`,
                    opacity: 1,
                    offset: 0.6,
                },
                {
                    transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.3)`,
                    opacity: 0,
                    offset: 1,
                },
            ],
            {
                duration: 850,
                easing: "cubic-bezier(.2,.7,.3,1)",
                fill: "forwards",
            }
        );

        animacion.onfinish = () => {
            window.clearTimeout(limpiar);
            icono.remove();
            bumpCarrito();
        };

        return;
    }

    icono.style.left = "50%";
    icono.style.top = "62%";

    const animacion = icono.animate(
        [
            { transform: "translate(-50%, -50%) scale(.4)", opacity: 0 },
            {
                transform: "translate(-50%, -50%) scale(1.15)",
                opacity: 1,
                offset: 0.25,
            },
            {
                transform: "translate(-50%, -56%) scale(1)",
                opacity: 1,
                offset: 0.55,
            },
            {
                transform: "translate(-50%, -75%) scale(.85)",
                opacity: 0,
            },
        ],
        { duration: 950, easing: "ease-out", fill: "forwards" }
    );

    animacion.onfinish = () => {
        window.clearTimeout(limpiar);
        icono.remove();
    };
};
