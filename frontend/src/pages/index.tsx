/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/index.tsx
import Layout from "../components/common/layout";
import Head from "next/head";
import HeroSlider from "@/components/home/HeroSlider";
import AboutSection from "@/components/home/AboutSection";
import CorporateCombos from "@/components/home/CorporateCombos";
import DiscountSaleProducts from "@/components/home/DiscountSaleProducts";
import HerbalCombos from "@/components/home/HerbalCombos";
import PlantCareProducts from "@/components/home/PlantCareProducts";
import PremiumPlants from "@/components/home/PremiumPlants";
import ProductsByCharacteristics from "@/components/home/ProductsByCharacteristics";
import ProductsByColor from "@/components/home/ProductsByColor";
import ProductsByPrice from "@/components/home/ProductsByPrice";
import ProductsBySize from "@/components/home/ProductsBySize";
import ServicesPreview from "@/components/home/ServicesPreview";
import DynamicTestimonials from "@/components/home/DynamicTestimonials";
import TopCategories from "@/components/home/TopCategories";
import TrendingProducts from "@/components/home/TrendingProducts";

const promos = [
  {
    title: "Style Your Greens",
    desc: "Elegant pots, planters & accessories to elevate your garden style.",
    img: "/images/promo-style.jpg",
    cta: "Shop Now",
    href: "/products",
  },
  {
    title: "Nurture Your Plants",
    desc: "Fertilizers, soil & care essentials for healthy growth.",
    img: "/images/promo-nurture.jpg",
    cta: "Explore Essentials",
    href: "/products?category=Plant%20Care",
  },
  {
    title: "Gardening Tools & Accessories",
    desc: "Essential tools & accessories to make gardening easier.",
    img: "/images/promo-tools.jpg",
    cta: "Discover Tools",
    href: "/products?tag=tools,accessories",
  },
];

// Corporate products/offers data
const corporateProducts: any[] = [];

// --- Reusable Components ---

// --- Main Page ---
export default function Home() {
  return (
    <>
      <Head>
        <title>Home | Verdora</title>
        <meta
          name="description"
          content="Verdora marketplace for nursery plants and gardening services"
        />
      </Head>
      <Layout>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Hero + Discount Sale Section (shows/hides based on product availability) */}
          <HeroSlider promos={promos} />
          <DiscountSaleProducts />

          {/* Dynamic Product Sections - Each shows/hides based on product availability */}
          <TrendingProducts />
          <TopCategories />
          <HerbalCombos />
          <ProductsByCharacteristics />
          <ProductsByColor />

          {/* New Sections - Conditional rendering */}
          <CorporateCombos products={corporateProducts} />
          <PlantCareProducts />
          <ProductsBySize />
          <ProductsByPrice />
          <PremiumPlants />
          <ServicesPreview />
          <AboutSection />
          <DynamicTestimonials />
        </main>
      </Layout>
    </>
  );
}

// Optimize page for ISR (Incremental Static Regeneration) - revalidate every 3600 seconds (1 hour)
export const getStaticProps = async () => {
  return {
    props: {},
    revalidate: 3600, // ISR - revalidate every hour
  };
};
