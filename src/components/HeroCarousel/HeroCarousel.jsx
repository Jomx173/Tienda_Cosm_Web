import { useEffect, useState } from "react";

import { Swiper, SwiperSlide } from "swiper/react";

import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import bannersData from "../../data/banners";
import { obtenerBanners } from "../../services/productoService";

import "./HeroCarousel.css";

function HeroCarousel() {
    const [banners, setBanners] = useState(bannersData);

    useEffect(() => {
        let activo = true;

        obtenerBanners()
            .then((data) => {
                if (activo && data && data.length > 0) {
                    setBanners(data);
                }
            })
            .catch(() => {});

        return () => {
            activo = false;
        };
    }, []);

    const imagenDe = (banner) =>
        banner.imagen || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&auto=format&fit=crop&q=80";

    if (banners.length === 0) {
        return null;
    }

    return (
        <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={banners.length > 1}
            spaceBetween={0}
            className="heroSwiper"
        >
            {banners.map((banner, i) => (
                <SwiperSlide key={banner.id_banner ?? banner.id ?? i}>
                    <div
                        className="hero-slide"
                        style={{ backgroundImage: `url(${imagenDe(banner)})` }}
                    >
                        <div className="hero-overlay">
                            <span>NUEVA COLECCIÓN</span>
                            <h1>{banner.titulo}</h1>
                            {banner.descripcion && <p>{banner.descripcion}</p>}
                            {banner.boton && (
                                <a href="#productos" className="btn-primary">
                                    {banner.boton}
                                </a>
                            )}
                        </div>
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    );
}

export default HeroCarousel;
