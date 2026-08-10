import TopBar from "../../components/TopBar/TopBar";
import Navbar from "../../components/Navbar/Navbar";
import HeroCarousel from "../../components/HeroCarousel/HeroCarousel";
import Products from "../../components/Products/Products";
import Footer from "../../components/Footer/Footer";
import WhatsAppButton from "../../components/WhatsAppButton/WhatsAppButton";

import "./Home.css";

function Home() {
  return (
    <div id="inicio">
      <TopBar />

      <Navbar />

      <HeroCarousel />

      <Products />

      <Footer />

      <WhatsAppButton />
    </div>
  );
}

export default Home;
