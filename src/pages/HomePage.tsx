import React from 'react';
import { WebsiteBannerSlider } from '../components/home/WebsiteBannerSlider';
import { CategoryIconStrip } from '../components/home/CategoryIconStrip';
import { FlashSaleSection } from '../components/home/FlashSaleSection';
import { JustForYouSection } from '../components/home/JustForYouSection';
import { AppDownloadBanner } from '../components/home/AppDownloadBanner';

export const HomePage: React.FC = () => {
  return (
    <main className="w-full">
      {/* Dynamic Website Banner Slider (ABOVE Category Section) */}
      <WebsiteBannerSlider />

      {/* Category Icon Strip ("ক্যাটাগরি সমূহ") */}
      <CategoryIconStrip />

      {/* Flash Sale Section */}
      <FlashSaleSection />

      {/* Just For You Products */}
      <JustForYouSection />

      {/* App Download Banner */}
      <AppDownloadBanner />
    </main>
  );
};
