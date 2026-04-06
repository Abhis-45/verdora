import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import PromoBanner from "./PromoBanner";
import "swiper/css";
import "swiper/css/pagination";

type Promo = {
  title: string;
  desc: string;
  img: string;
  cta: string;
  href: string;
};

type HeroSliderProps = {
  promos: Promo[];
};

export default function HeroSlider({ promos }: HeroSliderProps) {
  return (
    <section className="relative h-48 sm:h-60 md:h-72 rounded-lg overflow-hidden mb-8 sm:mb-10 bg-linear-to-r from-green-200 via-green-100 to-green-50">
      <Swiper
        modules={[Pagination, Autoplay]}
        slidesPerView={1}
        loop
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        className="h-full custom-swiper"
      >
        {promos.map((promo, index) => (
          <SwiperSlide key={index}>
            <PromoBanner {...promo} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
