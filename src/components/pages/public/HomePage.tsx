import {
  FAQSection,
  HeroSection,
  AboutUsSection,
  ProductsSection,
  // ServicesSection,
  TestimonialsSection,
} from '@/components/common';
import AuthCodeHandler from '@/components/common/AuthCodeHandler';

const HomePage = () => {
  return (
    <div>
      <AuthCodeHandler />
      <HeroSection />
      {/* <ServicesSection /> */}
      <AboutUsSection />
      <ProductsSection />
      {/* <WhyChooseUsSection /> */}
      <TestimonialsSection />
      <FAQSection />
    </div>
  );
};

export default HomePage;
