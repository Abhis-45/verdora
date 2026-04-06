import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import TestimonialCard from "./TestimonialCard";
import "swiper/css";
import "swiper/css/pagination";

type TestimonialsProps = {
  testimonials: string[];
};

export default function Testimonials({ testimonials }: TestimonialsProps) {
  return (
    <section className="mb-8 sm:mb-10">
      <h2 className="text-xl sm:text-xl font-bold mb-4 sm:mb-6 text-green-600">
        What Our Customers Say
      </h2>
      <Swiper
        modules={[Pagination, Autoplay]}
        slidesPerView={1}
        spaceBetween={12}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        breakpoints={{
          640: { slidesPerView: 1 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 3 },
        }}
        className="-mx-4 px-4 custom-swiper"
      >
        {testimonials.map((t, i) => (
          <SwiperSlide key={i} className="h-auto!">
            <div className="w-full">
              <TestimonialCard text={t} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
