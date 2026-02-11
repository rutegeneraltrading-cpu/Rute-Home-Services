import {
  FAQSection,
  HeroSection,
  AboutUsSection,
  ProductsSection,
  ServicesSection,
  TestimonialsSection,
} from '@/components/common';

const HomePage = () => {
  return (
    <div>
      <HeroSection />
      <ServicesSection />
      <ProductsSection />
      <AboutUsSection />
      {/* <WhyChooseUsSection /> */}
      <TestimonialsSection />
      <FAQSection />
    </div>
  );
};

export default HomePage;
