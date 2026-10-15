/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import TrustBar from './components/TrustBar';
import SimplifiedProcessSection from './components/SimplifiedProcessSection';
import DashboardWorkflowSection from './components/DashboardWorkflowSection';
import BrandedPortalSection from './components/BrandedPortalSection';
import StepsWorkflowSection from './components/StepsWorkflowSection';
import CtaBanner from './components/CtaBanner';
import Footer from './components/Footer';
import FaqSection from './components/FaqSection';
import BuylistTicker from './components/BuylistTicker';
import RoiCalculatorSection from './components/RoiCalculatorSection';
import CustomerDashboard from './components/CustomerDashboard';
import DealerDashboard from './components/DealerDashboard';
import SubmissionTrackerModal from './components/SubmissionTrackerModal';
import {
  GetStartedModal,
  HowItWorksModal,
  ContactModal,
} from './components/Modals';
import { testFirestoreConnection } from './firebase';
import { subscribeToSubmissions, LiveSubmission } from './services/dealerSubmissionService';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'customer_portal' | 'dealer_dashboard'>('landing');
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerRef, setTrackerRef] = useState('#TCG-1047');
  const [submissionsList, setSubmissionsList] = useState<LiveSubmission[]>([]);

  // Test Firestore connection on boot and sync live submissions
  useEffect(() => {
    testFirestoreConnection();
    const unsubscribe = subscribeToSubmissions('the-card-vault', (list) => {
      setSubmissionsList(list);
    });
    return () => unsubscribe();
  }, []);

  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 1. DEDICATED PROPER CUSTOMER BUYING & CARD RECOGNITION PORTAL
  if (currentView === 'customer_portal') {
    return (
      <>
        <CustomerDashboard
          onBackToHome={() => setCurrentView('landing')}
          onOpenDealerDashboard={() => setCurrentView('dealer_dashboard')}
          onTrackSubmission={(ref) => {
            setTrackerRef(ref);
            setIsTrackerOpen(true);
          }}
          shopName="The Card Vault"
        />
        <SubmissionTrackerModal
          isOpen={isTrackerOpen}
          onClose={() => setIsTrackerOpen(false)}
          initialRef={trackerRef}
          submissions={submissionsList}
        />
      </>
    );
  }

  // 2. DEDICATED PROPER DEALER & ADMIN COMMAND DASHBOARD
  if (currentView === 'dealer_dashboard') {
    return (
      <>
        <DealerDashboard
          onBackToHome={() => setCurrentView('landing')}
          onOpenCustomerPortal={() => setCurrentView('customer_portal')}
          shopName="The Card Vault"
        />
        <SubmissionTrackerModal
          isOpen={isTrackerOpen}
          onClose={() => setIsTrackerOpen(false)}
          initialRef={trackerRef}
          submissions={submissionsList}
        />
      </>
    );
  }

  // 3. MAIN LANDING PAGE (Exact Mockup Design)
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        onGetStarted={() => setCurrentView('customer_portal')}
        onExploreFeatures={scrollToFeatures}
        onOpenDealerPortal={() => setCurrentView('dealer_dashboard')}
        onOpenCustomerPortal={() => setCurrentView('customer_portal')}
        onOpenTracker={() => setIsTrackerOpen(true)}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onGetStarted={() => setCurrentView('customer_portal')}
          onSeeHowItWorks={() => setIsHowItWorksOpen(true)}
          onOpenSubmissionDemo={() => setCurrentView('dealer_dashboard')}
        />

        {/* Live Buylist Ticker Marquee */}
        <BuylistTicker />

        {/* Trust Badges Bar */}
        <TrustBar />

        {/* The buying process, simplified */}
        <SimplifiedProcessSection />

        {/* Inside TCGBuyer: One buying workflow */}
        <DashboardWorkflowSection
          onSelectSubmission={() => setCurrentView('dealer_dashboard')}
        />

        {/* Made for your shop: Your buying process. Your brand. Your customers. */}
        <BrandedPortalSection onGetStarted={() => setCurrentView('customer_portal')} />

        {/* A clearer way to buy cards: 3 Step Cards */}
        <StepsWorkflowSection />

        {/* Store ROI & Staff Time Saved Calculator */}
        <RoiCalculatorSection onGetStarted={() => setCurrentView('dealer_dashboard')} />

        {/* Dark Navy CTA Banner */}
        <CtaBanner
          onGetStarted={() => setCurrentView('customer_portal')}
          onExploreFeatures={scrollToFeatures}
        />

        {/* Frequently Asked Questions */}
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenContact={() => setIsContactOpen(true)}
        onOpenTerms={() => alert('Terms of Service: Standard SaaS terms for licensed card game dealers.')}
        onOpenPrivacy={() => alert('Privacy Policy: TCGBuyer strictly protects dealer and collector data.')}
      />

      {/* Collector Live Submission Tracker & Offer Acceptance */}
      <SubmissionTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        initialRef={trackerRef}
        submissions={submissionsList}
      />

      {/* Product Walkthrough */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        onGetStarted={() => setCurrentView('customer_portal')}
      />

      {/* Contact Support */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}
