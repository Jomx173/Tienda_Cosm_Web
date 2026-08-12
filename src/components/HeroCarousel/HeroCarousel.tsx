import { useEffect, useState } from "react";

import { Swiper, SwiperSlide } from "swiper/react";

import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { obtenerBanners } from "../../services/productoService";
import type { Banner } from "../../services/types";

import "./HeroCarousel.css";

function HeroCarousel() {
    const [banners, setBanners] = useState<Banner[]>([]);

    useEffect(() => {
        let activo = true;

        obtenerBanners()
            .then((data) => {
                if (activo) {
                    setBanners(data || []);
                }
            })
            .catch(() => {});

        return () => {
            activo = false;
        };
    }, []);

    const imagenDe = (banner: Banner) =>
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
                <SwiperSlide key={banner.id_banner ?? i}>
                    <div
                        className="hero-slide"
                        style={{ backgroundImage: `url(${imagenDe(banner)})` }}
                    >
                        <div className="hero-overlay">
                            <span>NUEVA COLECCIÓN</span>
                            <h1>{banner.titulo}</h1>
                            {banner.descripcion && <p>{banner.descripcion}</p>}
                        </div>
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    );
}

export default HeroCarousel;
