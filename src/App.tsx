/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { ArrowRight } from 'lucide-react';
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
const CustomerDashboard = lazy(() => import('./components/CustomerDashboard'));
const DealerDashboard = lazy(() => import('./components/DealerDashboard'));
import SubmissionTrackerModal from './components/SubmissionTrackerModal';
import {
  GetStartedModal,
  HowItWorksModal,
  ContactModal,
} from './components/Modals';
import { CurrencyProvider, useMoney } from './CurrencyContext';
import LegalModal, { LegalDoc } from './components/LegalModal';
import DealerAuthScreen from './components/DealerAuthScreen';
import DealerOnboarding from './components/DealerOnboarding';
import CustomerAuthScreen from './components/CustomerAuthScreen';
import CustomerAccount from './components/CustomerAccount';
import { subscribeToSubmissions, LiveSubmission, MySubmission } from './services/dealerSubmissionService';
import { LOGIN_BYPASS } from './config';
import { Storefront, getStorefront } from './services/storefrontService';
import { signOutUser, subscribeToAuth, getDealerBySlug, DealerProfile, DEMO_DEALER } from './services/authService';

const shopSlugParam = new URLSearchParams(window.location.search).get('shop');

export default function App() {
  return (
    <CurrencyProvider>
      <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">Loading…</div>}>
        <AppInner />
      </Suspense>
    </CurrencyProvider>
  );
}

function AppInner() {
  type View = 'landing' | 'customer_portal' | 'dealer_dashboard' | 'dealer_signup' | 'customer_auth' | 'customer_account';
  const [currentView, setCurrentView] = useState<View>(shopSlugParam ? 'customer_portal' : 'landing');
  const [authReturnView, setAuthReturnView] = useState<View>('customer_account');
  const [accountTrack, setAccountTrack] = useState<{ dealerId: string; shopName: string } | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);
  const [trackerRef, setTrackerRef] = useState('');
  const [submissionsList, setSubmissionsList] = useState<LiveSubmission[]>([]);

  // Dealer auth state
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [dealer, setDealer] = useState<DealerProfile | null>(null);
  // Anyone signed in (dealer or collector); collectors use this for "My submissions"
  const [authUser, setAuthUser] = useState<{ uid: string; email: string; name: string } | null>(null);

  // Shop whose public portal is being viewed (from ?shop=<slug>)
  const [linkedShop, setLinkedShop] = useState<DealerProfile | null>(null);
  const [shopLookupDone, setShopLookupDone] = useState(!shopSlugParam);

  useEffect(() => {
    return subscribeToAuth((state) => {
      setDealer(state?.dealer ?? null);
      setAuthUser(state ? { uid: state.uid, email: state.email, name: state.displayName } : null);
      setUserEmail(state?.email ?? '');
      if (!state) setSubmissionsList([]);
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

  // While login is bypassed, the dashboard falls back to a demo shop
  const activeDealer = dealer ?? (LOGIN_BYPASS ? DEMO_DEALER : null);

  // The signed-in (or demo) dealer's own page settings, for previewing and for packing slips
  const [ownStorefront, setOwnStorefront] = useState<Storefront | null>(null);
  useEffect(() => {
    setOwnStorefront(null);
    if (activeDealer) getStorefront(activeDealer.id).then(setOwnStorefront);
  }, [activeDealer?.id]);

  // After onboarding (sign-up), go straight to the dashboard
  useEffect(() => {
    if (currentView === 'dealer_signup' && dealer) setCurrentView('dealer_dashboard');
  }, [currentView, dealer]);

  // Leave the collector sign-in screen once signed in; leave the account page once signed out
  useEffect(() => {
    if (currentView === 'customer_auth' && authUser) setCurrentView(authReturnView);
    if (currentView === 'customer_account' && authReady && !authUser) setCurrentView('landing');
  }, [currentView, authUser, authReady, authReturnView]);

  const openCollectorSignIn = (returnTo: View) => {
    setAuthReturnView(returnTo);
    setCurrentView(authUser ? returnTo : 'customer_auth');
  };

  // Live submissions for the signed-in dealer (also feeds the tracker for their own view)
  useEffect(() => {
    if (!activeDealer) return;
    return subscribeToSubmissions(activeDealer.id, setSubmissionsList);
  }, [activeDealer?.id]);

  // The shop's currency is the default for whoever is viewing (a viewer's own choice still wins)
  const { setDefaultCurrency } = useMoney();
  const shopStorefront = currentView === 'dealer_dashboard' ? ownStorefront : linkedShop ? linkedShop.storefront : ownStorefront;
  useEffect(() => {
    if (shopStorefront) setDefaultCurrency(shopStorefront.pricing.currency);
  }, [shopStorefront?.pricing.currency, setDefaultCurrency]);

  // Portal/tracker target: the linked shop, otherwise the signed-in dealer previewing their own portal
  const portalDealer = linkedShop || activeDealer;
  const portalStorefront = linkedShop ? (linkedShop.storefront ?? null) : ownStorefront;

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
          storefront={portalStorefront}
          shopSlug={portalDealer?.slug}
          customer={authUser}
          onSignIn={() => openCollectorSignIn('customer_portal')}
          onOpenAccount={() => setCurrentView('customer_account')}
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
          shopName={portalDealer?.name}
          storefront={portalStorefront}
        />
      </>
    );
  }

  // 2. DEDICATED PROPER DEALER & ADMIN COMMAND DASHBOARD
  if (currentView === 'dealer_dashboard') {
    if (!authReady) {
      return <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">Loading…</div>;
    }
    if (!activeDealer) {
      return <DealerAuthScreen onBackToHome={() => setCurrentView('landing')} onCreateAccount={() => setCurrentView('dealer_signup')} />;
    }
    return (
      <>
        <DealerDashboard
          onBackToHome={() => setCurrentView('landing')}
          onOpenCustomerPortal={() => setCurrentView('customer_portal')}
          shopName={activeDealer.name}
          dealerId={activeDealer.id}
          dealerSlug={activeDealer.slug}
          userEmail={dealer ? userEmail : 'Demo mode (login off)'}
          storefront={ownStorefront}
          onStorefrontSaved={setOwnStorefront}
        />
        <SubmissionTrackerModal
          isOpen={isTrackerOpen}
          onClose={() => setIsTrackerOpen(false)}
          initialRef={trackerRef}
          submissions={submissionsList}
          dealerId={activeDealer.id}
          shopName={activeDealer.name}
          storefront={ownStorefront}
        />
      </>
    );
  }

  // Dealer onboarding / account creation
  if (currentView === 'dealer_signup') {
    if (!authReady) {
      return <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">Loading…</div>;
    }
    return (
      <>
        <DealerOnboarding
          onBackToHome={() => setCurrentView('landing')}
          onSignIn={() => setCurrentView('dealer_dashboard')}
          onOpenLegal={setLegalDoc}
        />
        <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
      </>
    );
  }

  // Collector sign-in / sign-up
  if (currentView === 'customer_auth') {
    return (
      <CustomerAuthScreen
        shopName={portalDealer?.name}
        onBack={() => setCurrentView(authReturnView === 'customer_account' ? 'landing' : authReturnView)}
      />
    );
  }

  // Collector account: submissions across all shops
  if (currentView === 'customer_account' && authUser) {
    return (
      <>
        <CustomerAccount
          uid={authUser.uid}
          name={authUser.name}
          email={authUser.email}
          onBack={() => setCurrentView(shopSlugParam ? 'customer_portal' : 'landing')}
          onSignOut={() => signOutUser()}
          onTrack={(s: MySubmission) => {
            setAccountTrack({ dealerId: s.dealerId, shopName: s.shopName });
            setTrackerRef(s.ref);
            setIsTrackerOpen(true);
          }}
          onOpenShop={(slug) => {
            window.location.href = `/?shop=${encodeURIComponent(slug)}`;
          }}
        />
        <SubmissionTrackerModal
          isOpen={isTrackerOpen}
          onClose={() => setIsTrackerOpen(false)}
          initialRef={trackerRef}
          submissions={[]}
          dealerId={accountTrack?.dealerId ?? null}
          shopName={accountTrack?.shopName}
        />
      </>
    );
  }

  // 3. MAIN LANDING PAGE (Exact Mockup Design)
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        onGetStarted={() => setCurrentView('dealer_signup')}
        onExploreFeatures={scrollToFeatures}
        onOpenDealerPortal={() => setCurrentView('dealer_dashboard')}
        onOpenCustomerPortal={() => setCurrentView('customer_portal')}
        onOpenTracker={() => setIsTrackerOpen(true)}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onGetStarted={() => setCurrentView('dealer_signup')}
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
        <BrandedPortalSection onGetStarted={() => setCurrentView('dealer_signup')} />

        {/* A clearer way to buy cards: 3 Step Cards */}
        <StepsWorkflowSection />

        {/* Store ROI & Staff Time Saved Calculator */}
        <RoiCalculatorSection onGetStarted={() => setCurrentView('dealer_signup')} />

        {/* Dark Navy CTA Banner */}
        <CtaBanner
          onGetStarted={() => setCurrentView('dealer_signup')}
          onExploreFeatures={scrollToFeatures}
        />

        {/* Frequently Asked Questions */}
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenContact={() => setIsContactOpen(true)}
        onOpenCollectorLogin={() => openCollectorSignIn('customer_account')}
        onOpenTerms={() => setLegalDoc('terms')}
        onOpenPrivacy={() => setLegalDoc('privacy')}
      />

      {/* Spacer so the sticky bar never covers the footer (mobile only) */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* Sticky Get Started bar (mobile only) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-6px_18px_rgba(15,23,42,0.08)] px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] flex justify-center">
        <button
          onClick={() => setCurrentView('dealer_signup')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:opacity-95 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Collector Live Submission Tracker & Offer Acceptance */}
      <SubmissionTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        initialRef={trackerRef}
        submissions={submissionsList}
        dealerId={activeDealer?.id ?? null}
      />

      {/* Product Walkthrough */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        onGetStarted={() => setCurrentView('dealer_signup')}
      />

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />

      {/* Contact Support */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}
