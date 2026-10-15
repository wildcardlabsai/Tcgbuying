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
import DealerAuthScreen from './components/DealerAuthScreen';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { subscribeToSubmissions, LiveSubmission } from './services/dealerSubmissionService';
import { ensureDealerProfile, getDealerBySlug, DealerProfile } from './services/authService';

const shopSlugParam = new URLSearchParams(window.location.search).get('shop');

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'customer_portal' | 'dealer_dashboard'>(
    shopSlugParam ? 'customer_portal' : 'landing'
  );
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerRef, setTrackerRef] = useState('');
  const [submissionsList, setSubmissionsList] = useState<LiveSubmission[]>([]);

  // Dealer auth state
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [dealer, setDealer] = useState<DealerProfile | null>(null);

  // Shop whose public portal is being viewed (from ?shop=<slug>)
  const [linkedShop, setLinkedShop] = useState<DealerProfile | null>(null);
  const [shopLookupDone, setShopLookupDone] = useState(!shopSlugParam);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setDealer(null);
        setUserEmail('');
        setSubmissionsList([]);
        setAuthReady(true);
        return;
      }
      try {
        setDealer(await ensureDealerProfile(user));
        setUserEmail(user.email || '');
      } catch {
        setDealer(null);
      }
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!shopSlugParam) return;
    getDealerBySlug(shopSlugParam).then((d) => {
      setLinkedShop(d);
      setShopLookupDone(true);
    });
  }, []);

  // Live submissions for the signed-in dealer (also feeds the tracker for their own view)
  useEffect(() => {
    if (!dealer) return;
    return subscribeToSubmissions(dealer.id, setSubmissionsList);
  }, [dealer?.id]);

  // Portal/tracker target: the linked shop, otherwise the signed-in dealer previewing their own portal
  const portalDealer = linkedShop || dealer;

  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 1. DEDICATED PROPER CUSTOMER BUYING & CARD RECOGNITION PORTAL
  if (currentView === 'customer_portal') {
    if (!shopLookupDone) {
      return <div className="min-h-screen bg-slate-900 text-slate-300 flex items-center justify-center text-sm">Loading shop…</div>;
    }
    return (
      <>
        <CustomerDashboard
          dealerId={portalDealer?.id ?? null}
          onBackToHome={() => setCurrentView('landing')}
          onOpenDealerDashboard={() => setCurrentView('dealer_dashboard')}
          onTrackSubmission={(ref) => {
            setTrackerRef(ref);
            setIsTrackerOpen(true);
          }}
          shopName={portalDealer?.name ?? (shopSlugParam ? 'Shop not found' : 'Demo Shop')}
        />
        <SubmissionTrackerModal
          isOpen={isTrackerOpen}
          onClose={() => setIsTrackerOpen(false)}
          initialRef={trackerRef}
          submissions={linkedShop ? [] : submissionsList}
          dealerId={portalDealer?.id ?? null}
        />
      </>
    );
  }

  // 2. DEDICATED PROPER DEALER & ADMIN COMMAND DASHBOARD
  if (currentView === 'dealer_dashboard') {
    if (!authReady) {
      return <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">Loading…</div>;
    }
    if (!dealer) {
      return <DealerAuthScreen onBackToHome={() => setCurrentView('landing')} />;
    }
    return (
      <>
        <DealerDashboard
          onBackToHome={() => setCurrentView('landing')}
          onOpenCustomerPortal={() => setCurrentView('customer_portal')}
          shopName={dealer.name}
          dealerId={dealer.id}
          dealerSlug={dealer.slug}
          userEmail={userEmail}
        />
        <SubmissionTrackerModal
          isOpen={isTrackerOpen}
          onClose={() => setIsTrackerOpen(false)}
          initialRef={trackerRef}
          submissions={submissionsList}
          dealerId={dealer.id}
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
        dealerId={dealer?.id ?? null}
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
