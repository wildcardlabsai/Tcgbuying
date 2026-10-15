/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Search,
  Trash2,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sliders,
  HelpCircle,
  Package,
  Layers,
  ChevronRight,
  Eye,
  Info,
  FileText,
  Zap,
  Grid,
  Check,
  Plus,
  Minus,
  Video,
  VideoOff,
  SlidersHorizontal,
  Printer,
} from 'lucide-react';
import Logo from './Logo';
import {
  recognizeCardPhoto,
  scanMultiCardBinderPhoto,
  parseBuylistTextOrCsv,
  recalculateCardValuation,
  searchAlternativeCards,
  RecognizedCardItem,
  MatchedCard,
} from '../services/cardRecognitionService';
import { createCustomerSubmission, SubmittedCardItem, LiveSubmission } from '../services/dealerSubmissionService';
import PrintableManifestModal from './PrintableManifestModal';
import ConditionGuideModal from './ConditionGuideModal';

interface CustomerDashboardProps {
  onBackToHome: () => void;
  onOpenDealerDashboard: () => void;
  onTrackSubmission: (ref: string) => void;
  shopName?: string;
}

// Preset card samples for 1-click testing
const SAMPLE_PRESETS = [
  {
    name: 'Charizard Base Set',
    game: 'Pokémon',
    url: 'https://images.pokemontcg.io/base1/4_hires.png',
  },
  {
    name: 'Umbreon VMAX Alt Art',
    game: 'Pokémon',
    url: 'https://images.pokemontcg.io/swsh7/215_hires.png',
  },
  {
    name: 'Black Lotus',
    game: 'Magic: The Gathering',
    url: 'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
  },
  {
    name: 'Blue-Eyes White Dragon',
    game: 'Yu-Gi-Oh!',
    url: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
  },
];

// Sample multi-card binder page
const SAMPLE_BINDER_PAGE = {
  name: '9-Pocket Binder Page',
  url: 'https://images.pokemontcg.io/base1/4_hires.png',
};

// Preset text buylists
const PRESET_BUYLISTS = {
  pokemon: `4 Charizard Base Set #4/102 Holo Rare Raw NM
2 Umbreon VMAX Evolving Skies #215/203 Secret Alt Art Raw NM
1 Pikachu Illustrator CoroCoro Promo PSA 9
3 Mewtwo & Mew GX Unified Minds #71/236 Raw NM
5 Gengar VMAX Fusion Strike #157/264 Raw NM
4 Blastoise Base Set #2/102 Raw LP
2 Lugia V Alternate Art Silver Tempest #186/195 Raw NM`,
  mtg: `1 Black Lotus Unlimited Edition Rare Raw LP
2 Mana Crypt Double Masters Artifact Raw NM
4 Mox Diamond Stronghold Artifact Raw LP
4 Force of Will Alliances Rare Raw NM
2 Ragavan, Nimble Pilferer Modern Horizons 2 Mythic Raw NM`,
  ygo: `3 Blue-Eyes White Dragon Legend of Blue Eyes LOB-001 Ultra Rare Raw NM
2 Dark Magician Legend of Blue Eyes LOB-005 Ultra Rare Raw NM
1 Red-Eyes Black Dragon Legend of Blue Eyes Ultra Rare Raw LP
3 Exodia the Forbidden One LOB Ultra Rare Raw NM`,
};

export default function CustomerDashboard({
  onBackToHome,
  onOpenDealerDashboard,
  onTrackSubmission,
  shopName = 'The Card Vault',
}: CustomerDashboardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [intakeMode, setIntakeMode] = useState<'photos' | 'rapid_camera' | 'text_csv' | 'bulk_counter'>('photos');
  const [cardItems, setCardItems] = useState<RecognizedCardItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, text: '' });
  
  // Binder page mode toggle
  const [isBinderMode, setIsBinderMode] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isConditionGuideOpen, setIsConditionGuideOpen] = useState(false);

  // Rapid-Fire Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [rapidFireCaptured, setRapidFireCaptured] = useState<string[]>([]);
  const [shutterFlash, setShutterFlash] = useState(false);

  // Text / CSV Buylist state
  const [buylistText, setBuylistText] = useState(PRESET_BUYLISTS.pokemon);
  const [buylistGame, setBuylistGame] = useState('Pokémon');

  // Bulk Counter State (Tiered counts for commons/holos/etc.)
  const [bulkCounts, setBulkCounts] = useState({
    commons: 300,
    holos: 45,
    ultraRares: 12,
    sealedPacks: 2,
  });

  // Alternative match search modal
  const [searchModalCardIndex, setSearchModalCardIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MatchedCard[]>([]);

  // Expanded photo preview modal
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  // Step 2 & 3 filters and sorting
  const [cardSortBy, setCardSortBy] = useState<'value_desc' | 'value_asc' | 'name'>('value_desc');
  const [cardSearchFilter, setCardSearchFilter] = useState('');

  // Customer contact form
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [preferredPayout, setPreferredPayout] = useState<'cash' | 'credit'>('cash');
  const [payoutMethod, setPayoutMethod] = useState<'bank' | 'paypal' | 'in_store'>('bank');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'dropoff'>('shipping');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Calculated collection totals (including bulk counts)
  const bulkCashTotal =
    bulkCounts.commons * 0.012 +
    bulkCounts.holos * 0.05 +
    bulkCounts.ultraRares * 0.50 +
    bulkCounts.sealedPacks * 3.20;
  const bulkCreditTotal = Math.round(bulkCashTotal * 1.15);

  const singlesMarketValue = cardItems.reduce((acc, c) => acc + c.matchedCard.marketPrice, 0);
  const singlesCashOffer = cardItems.reduce((acc, c) => acc + c.matchedCard.storeCashOffer, 0);
  const singlesCreditOffer = cardItems.reduce((acc, c) => acc + c.matchedCard.storeCreditOffer, 0);

  const totalMarketValue = singlesMarketValue + Math.round(bulkCashTotal * 1.4);
  const totalCashOffer = singlesCashOffer + Math.round(bulkCashTotal);
  const totalCreditOffer = singlesCreditOffer + bulkCreditTotal;

  // Handle camera activation for Rapid-Fire Camera
  useEffect(() => {
    if (intakeMode === 'rapid_camera' && currentStep === 1) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [intakeMode, currentStep]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable. Using rapid test capture simulator.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Trigger rapid-fire shutter snapshot
  const handleRapidShutter = () => {
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 120);

    let photoData = '';
    if (videoRef.current && cameraActive) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        photoData = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    // Fallback if camera stream is empty or denied
    if (!photoData) {
      const sample = SAMPLE_PRESETS[rapidFireCaptured.length % SAMPLE_PRESETS.length];
      photoData = sample.url;
    }

    setRapidFireCaptured((prev) => [...prev, photoData]);
  };

  // Process all captured rapid-fire photos
  const handleProcessRapidPhotos = async () => {
    if (rapidFireCaptured.length === 0) return;
    stopCamera();
    setIsScanning(true);
    setScanProgress({
      current: 0,
      total: rapidFireCaptured.length,
      text: `Processing ${rapidFireCaptured.length} rapid camera captures...`,
    });

    const newItems: RecognizedCardItem[] = [];

    for (let i = 0; i < rapidFireCaptured.length; i++) {
      const photo = rapidFireCaptured[i];
      setScanProgress({
        current: i + 1,
        total: rapidFireCaptured.length,
        text: `Recognizing rapid card ${i + 1} of ${rapidFireCaptured.length}...`,
      });

      const recognized = await recognizeCardPhoto(photo, `Rapid Card #${i + 1}.jpg`);
      newItems.push(recognized);
    }

    setCardItems((prev) => [...prev, ...newItems]);
    setIsScanning(false);
    setRapidFireCaptured([]);
    setCurrentStep(2);
  };

  // Process File Uploads (Supports single cards and 9-pocket binder pages)
  const handleFilesSelected = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsScanning(true);
    setScanProgress({
      current: 0,
      total: fileArray.length,
      text: isBinderMode
        ? 'Scanning 9-pocket binder page for multiple cards...'
        : 'Preparing photos for AI vision scan...',
    });

    const newItems: RecognizedCardItem[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const base64 = await readFileAsBase64(file);

      if (isBinderMode) {
        setScanProgress({
          current: i + 1,
          total: fileArray.length,
          text: `Analyzing binder page ${i + 1} with AI vision: detecting all cards...`,
        });
        const binderCards = await scanMultiCardBinderPhoto(base64, file.name);
        newItems.push(...binderCards);
      } else {
        setScanProgress({
          current: i + 1,
          total: fileArray.length,
          text: `Recognizing card ${i + 1} of ${fileArray.length}: ${file.name}...`,
        });
        const recognized = await recognizeCardPhoto(base64, file.name);
        newItems.push(recognized);
      }
    }

    setCardItems((prev) => [...prev, ...newItems]);
    setIsScanning(false);
    setCurrentStep(2);
  };

  // Convert file to base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve((e.target?.result as string) || '');
      };
      reader.readAsDataURL(file);
    });
  };

  // Preset sample loader
  const handleAddSamplePreset = async (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setIsScanning(true);
    setScanProgress({ current: 1, total: 1, text: `Scanning sample ${preset.name}...` });

    const recognized = await recognizeCardPhoto(preset.url, `${preset.name}.jpg`, preset.name);
    setCardItems((prev) => [...prev, recognized]);
    setIsScanning(false);
    setCurrentStep(2);
  };

  // Preset 9-Pocket Binder Page Loader
  const handleAddBinderPageSample = async () => {
    setIsScanning(true);
    setScanProgress({ current: 1, total: 1, text: 'Scanning 9-pocket binder page for multiple cards...' });

    const multiCards = await scanMultiCardBinderPhoto(SAMPLE_BINDER_PAGE.url, 'Binder Page 1.jpg');
    setCardItems((prev) => [...prev, ...multiCards]);
    setIsScanning(false);
    setCurrentStep(2);
  };

  // Import Text / CSV Buylist
  const handleImportBuylist = async () => {
    if (!buylistText.trim()) return;
    setIsScanning(true);
    setScanProgress({ current: 1, total: 1, text: 'Parsing buylist & looking up eBay comps across TCG database...' });

    const items = await parseBuylistTextOrCsv(buylistText, buylistGame);
    setCardItems((prev) => [...prev, ...items]);
    setIsScanning(false);
    setCurrentStep(2);
  };

  // Confirm match for a specific card
  const handleConfirmCard = (index: number) => {
    setCardItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], confirmed: true };
      return updated;
    });
  };

  // Confirm all matches
  const handleConfirmAll = () => {
    setCardItems((prev) => prev.map((c) => ({ ...c, confirmed: true })));
  };

  // Bulk set condition for all cards
  const handleBulkSetCondition = (condition: string) => {
    setCardItems((prev) =>
      prev.map((c) => {
        const isGraded = condition.includes('PSA');
        const newPricing = recalculateCardValuation(
          c.matchedCard.ebayLastSoldAvg,
          condition,
          isGraded
        );
        return {
          ...c,
          selectedCondition: condition,
          matchedCard: {
            ...c.matchedCard,
            marketPrice: newPricing.marketPrice,
            storeCashOffer: newPricing.storeCashOffer,
            storeCreditOffer: newPricing.storeCreditOffer,
          },
        };
      })
    );
  };

  // Adjust condition for a single card
  const handleConditionChange = (index: number, newCondition: string) => {
    setCardItems((prev) => {
      const updated = [...prev];
      const target = updated[index];
      const isGraded = newCondition.includes('PSA') || newCondition.includes('BGS');
      const newPricing = recalculateCardValuation(
        target.matchedCard.ebayLastSoldAvg,
        newCondition,
        isGraded
      );

      updated[index] = {
        ...target,
        selectedCondition: newCondition,
        matchedCard: {
          ...target.matchedCard,
          marketPrice: newPricing.marketPrice,
          storeCashOffer: newPricing.storeCashOffer,
          storeCreditOffer: newPricing.storeCreditOffer,
        },
      };
      return updated;
    });
  };

  // Remove a card
  const handleRemoveCard = (index: number) => {
    setCardItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Open alternative match search modal
  const openSearchModal = (index: number) => {
    setSearchModalCardIndex(index);
    setSearchQuery(cardItems[index].matchedCard.name);
    searchAlternativeCards(cardItems[index].matchedCard.name, cardItems[index].matchedCard.game).then(
      (res) => setSearchResults(res)
    );
  };

  const handleSelectAlternative = (card: MatchedCard) => {
    if (searchModalCardIndex === null) return;
    setCardItems((prev) => {
      const updated = [...prev];
      const target = updated[searchModalCardIndex];
      const isGraded = target.selectedCondition.includes('PSA');
      const newPricing = recalculateCardValuation(
        card.marketPrice,
        target.selectedCondition,
        isGraded
      );

      updated[searchModalCardIndex] = {
        ...target,
        detection: {
          ...target.detection,
          name: card.name,
          game: card.game,
          setName: card.setName,
          cardNumber: card.cardNumber,
          rarity: card.rarity,
        },
        matchedCard: {
          ...card,
          marketPrice: newPricing.marketPrice,
          storeCashOffer: newPricing.storeCashOffer,
          storeCreditOffer: newPricing.storeCreditOffer,
        },
        confirmed: true,
      };
      return updated;
    });
    setSearchModalCardIndex(null);
  };

  // Sort and filter cards
  const sortedAndFilteredCards = cardItems
    .filter((c) => {
      if (!cardSearchFilter) return true;
      return (
        c.matchedCard.name.toLowerCase().includes(cardSearchFilter.toLowerCase()) ||
        c.matchedCard.setName.toLowerCase().includes(cardSearchFilter.toLowerCase()) ||
        c.matchedCard.game.toLowerCase().includes(cardSearchFilter.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (cardSortBy === 'value_desc') return b.matchedCard.marketPrice - a.matchedCard.marketPrice;
      if (cardSortBy === 'value_asc') return a.matchedCard.marketPrice - b.matchedCard.marketPrice;
      return a.matchedCard.name.localeCompare(b.matchedCard.name);
    });

  // Final submission to dealer portal
  const handleSubmitCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardItems.length === 0 && bulkCashTotal === 0) return;
    setIsSubmitting(true);

    const submissionItems: SubmittedCardItem[] = cardItems.map((c) => ({
      id: c.tempId,
      name: c.matchedCard.name,
      game: c.matchedCard.game,
      setName: c.matchedCard.setName,
      cardNumber: c.matchedCard.cardNumber,
      rarity: c.matchedCard.rarity,
      userPhoto: c.userPhoto,
      officialImageUrl: c.matchedCard.imageUrl,
      condition: c.selectedCondition,
      marketPrice: c.matchedCard.marketPrice,
      cashOffer: c.matchedCard.storeCashOffer,
      creditOffer: c.matchedCard.storeCreditOffer,
      confirmed: c.confirmed,
    }));

    // Add bulk counts as line items if present
    if (bulkCounts.commons > 0) {
      submissionItems.push({
        id: `bulk-commons-${Date.now()}`,
        name: `Common / Uncommon Bulk (${bulkCounts.commons} cards)`,
        game: 'Mixed TCG',
        setName: 'Bulk Stack',
        cardNumber: `${bulkCounts.commons}x`,
        rarity: 'Common/Uncommon',
        userPhoto: 'https://images.pokemontcg.io/base1/4_hires.png',
        condition: 'Raw Mixed',
        marketPrice: Math.round(bulkCounts.commons * 0.02),
        cashOffer: Math.round(bulkCounts.commons * 0.012),
        creditOffer: Math.round(bulkCounts.commons * 0.015),
        confirmed: true,
      });
    }

    if (bulkCounts.holos > 0) {
      submissionItems.push({
        id: `bulk-holos-${Date.now()}`,
        name: `Holo / Reverse Holo Bulk (${bulkCounts.holos} cards)`,
        game: 'Mixed TCG',
        setName: 'Bulk Holos',
        cardNumber: `${bulkCounts.holos}x`,
        rarity: 'Holo Rare',
        userPhoto: 'https://images.pokemontcg.io/swsh7/215_hires.png',
        condition: 'Raw NM/LP',
        marketPrice: Math.round(bulkCounts.holos * 0.08),
        cashOffer: Math.round(bulkCounts.holos * 0.05),
        creditOffer: Math.round(bulkCounts.holos * 0.06),
        confirmed: true,
      });
    }

    const totalCount = cardItems.length + bulkCounts.commons + bulkCounts.holos + bulkCounts.ultraRares;

    const result = await createCustomerSubmission({
      customerName: customerName.trim() || 'Valued Collector',
      customerEmail: customerEmail.trim() || 'collector@example.com',
      customerPhone: customerPhone.trim() || '+44 7700 900000',
      collection: `Bulk & High-Value TCG Collection (${totalCount} cards)`,
      cardCount: totalCount,
      estimatedValue: preferredPayout === 'credit' ? totalCreditOffer : totalCashOffer,
      totalCashOffer,
      totalCreditOffer,
      preferredPayout,
      payoutMethodDetails: `${payoutMethod.toUpperCase()}: ${payoutDetails || 'Direct to collector'}`,
      notes: `${deliveryMethod === 'shipping' ? 'Prefers Insured Mail Kit' : 'Dropping off in-store'}. ${customerNotes}`,
      photos: cardItems.map((c) => c.userPhoto),
      items: submissionItems,
    });

    setSubmittedRef(result.ref);
    setIsSubmitting(false);
    setCurrentStep(5);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#070d1e] border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors border border-slate-700/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-2.5">
            <Logo size="sm" variant="light" />
            <span className="text-slate-400 text-xs hidden sm:inline">|</span>
            <span className="font-bold text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              {shopName} <span className="text-blue-400 font-normal">Buying Portal</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onTrackSubmission('#TCG-1047')}
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 flex items-center gap-1.5 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span>Track Submission</span>
          </button>

          <button
            onClick={onOpenDealerDashboard}
            className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-sm transition-all"
          >
            Dealer Login
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Step Progress Bar */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-3xl mx-auto">
            {[
              { num: 1, label: 'Upload & Ingest' },
              { num: 2, label: 'AI Card Match' },
              { num: 3, label: 'Condition & Comps' },
              { num: 4, label: 'Submit Collection' },
            ].map((s) => {
              const isActive = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <div
                  key={s.num}
                  className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : isPast
                      ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
                      : 'border-slate-800 bg-slate-900/50 text-slate-500'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isPast
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPast ? '✓' : s.num}
                  </div>
                  <span className="text-[11px] sm:text-xs font-medium line-clamp-1">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 1: MULTI-MODE BULK INGESTION */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Step 1 of 4 • Ingestion Flow for Any Collection Size
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                How would you like to add your cards?
              </h1>
              <p className="text-sm text-slate-300 mt-2">
                Choose the fastest workflow: scan 9-pocket binder pages, rapid-fire camera shutter, text/CSV buylist paste, or flat-rate bulk counts.
              </p>
            </div>

            {/* Ingestion Mode Switcher Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto p-1.5 bg-slate-800/80 rounded-2xl border border-slate-700/80">
              <button
                type="button"
                onClick={() => setIntakeMode('photos')}
                className={`py-3 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  intakeMode === 'photos'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Photos & Binders</span>
              </button>

              <button
                type="button"
                onClick={() => setIntakeMode('rapid_camera')}
                className={`py-3 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  intakeMode === 'rapid_camera'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Rapid-Fire Camera</span>
              </button>

              <button
                type="button"
                onClick={() => setIntakeMode('text_csv')}
                className={`py-3 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  intakeMode === 'text_csv'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Text / CSV Buylist</span>
              </button>

              <button
                type="button"
                onClick={() => setIntakeMode('bulk_counter')}
                className={`py-3 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  intakeMode === 'bulk_counter'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Bulk Stacks Tier</span>
              </button>
            </div>

            {/* TAB 1: PHOTOS & 9-POCKET BINDER PAGE UPLOAD */}
            {intakeMode === 'photos' && (
              <div className="space-y-6 max-w-4xl mx-auto">
                {/* Binder Page Toggle Bar */}
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        9-Pocket Binder Page & Multi-Card Detection
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Photograph 9 cards in a binder page or tabletop grid at once. AI extracts each card individually.
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBinderMode}
                      onChange={(e) => setIsBinderMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Upload Zone */}
                <div className="bg-slate-800/60 border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-2xl p-8 sm:p-12 text-center transition-all group backdrop-blur-sm">
                  <input
                    type="file"
                    id="card-photo-input"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                  />
                  <label
                    htmlFor="card-photo-input"
                    className="cursor-pointer flex flex-col items-center justify-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">
                        {isBinderMode
                          ? 'Upload Binder Page Photos (Multiple Cards in 1 Image)'
                          : 'Click to browse card photos or drag and drop here'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Select multiple files at once. Supports high-resolution JPG, PNG, WEBP.
                      </p>
                    </div>
                    <span className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md">
                      {isBinderMode ? 'Select Binder Page Photos' : 'Select Card Photos'}
                    </span>
                  </label>
                </div>

                {/* 1-Click Test Samples */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      1-Click Instant Test Presets
                    </span>
                    <button
                      type="button"
                      onClick={handleAddBinderPageSample}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 underline"
                    >
                      Test 9-Pocket Binder Page Scan →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {SAMPLE_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleAddSamplePreset(p)}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-750 border border-slate-700/80 hover:border-blue-500/80 transition-all text-left group"
                      >
                        <img
                          src={p.url}
                          alt={p.name}
                          className="w-8 h-11 object-cover rounded shadow shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-400">{p.game}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: RAPID-FIRE CONTINUOUS CAMERA SHUTTER */}
            {intakeMode === 'rapid_camera' && (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 text-center relative overflow-hidden">
                  
                  {/* Shutter Flash Animation */}
                  {shutterFlash && (
                    <div className="absolute inset-0 bg-white z-30 pointer-events-none animate-out fade-out duration-100" />
                  )}

                  <div className="relative w-full aspect-4/3 max-w-md mx-auto bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                    />

                    {!cameraActive && (
                      <div className="p-6 text-center space-y-2">
                        <VideoOff className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400">
                          {cameraError || 'Camera connecting or simulator ready.'}
                        </p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 rounded-lg text-white"
                        >
                          Enable Camera Feed
                        </button>
                      </div>
                    )}

                    {/* Card Alignment Reticle */}
                    <div className="absolute inset-6 border-2 border-dashed border-blue-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                      <div className="flex justify-between text-[10px] font-mono text-blue-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs self-start">
                        ALIGN CARD IN FRAME
                      </div>
                      <div className="text-[10px] text-slate-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs self-center">
                        Tap Shutter Rapidly As You Flip Cards
                      </div>
                    </div>
                  </div>

                  {/* Shutter Button & Counter */}
                  <div className="mt-5 flex items-center justify-center gap-6">
                    <div className="text-left">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Captured</span>
                      <span className="text-xl font-black text-amber-400">
                        {rapidFireCaptured.length} cards
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRapidShutter}
                      className="w-18 h-18 rounded-full border-4 border-amber-400 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-lg transition-all cursor-pointer group"
                    >
                      <Zap className="w-8 h-8 fill-slate-950 group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                      type="button"
                      disabled={rapidFireCaptured.length === 0}
                      onClick={handleProcessRapidPhotos}
                      className="px-5 py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Process {rapidFireCaptured.length} Cards</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-3">
                    Tip: Keep cards in sleeves or binders. Rapidly tap the yellow shutter button for each card, then click "Process".
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: TEXT & CSV BUYLIST IMPORT */}
            {intakeMode === 'text_csv' && (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">Import Digital Buylist or CSV</h3>
                      <p className="text-xs text-slate-400">
                        Paste card names with quantities or drag a CSV exported from Collectr, TCGplayer, or Excel.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={buylistGame}
                        onChange={(e) => setBuylistGame(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="Pokémon">Pokémon</option>
                        <option value="Magic: The Gathering">Magic: The Gathering</option>
                        <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
                      </select>
                    </div>
                  </div>

                  {/* Preset quick loaders */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-semibold">Load Sample:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBuylistGame('Pokémon');
                        setBuylistText(PRESET_BUYLISTS.pokemon);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-750 text-blue-300 border border-slate-700 text-[11px]"
                    >
                      20x Vintage Pokémon
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBuylistGame('Magic: The Gathering');
                        setBuylistText(PRESET_BUYLISTS.mtg);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-750 text-blue-300 border border-slate-700 text-[11px]"
                    >
                      MTG Power Staples
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBuylistGame('Yu-Gi-Oh!');
                        setBuylistText(PRESET_BUYLISTS.ygo);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-750 text-blue-300 border border-slate-700 text-[11px]"
                    >
                      Yu-Gi-Oh 1st Edition
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={buylistText}
                    onChange={(e) => setBuylistText(e.target.value)}
                    placeholder="e.g.&#10;4 Charizard Base Set #4/102 Holo Rare Raw NM&#10;2 Umbreon VMAX Evolving Skies&#10;1 Black Lotus Unlimited"
                    className="w-full bg-slate-950 font-mono text-xs text-slate-200 border border-slate-700 rounded-xl p-3 focus:outline-hidden focus:border-blue-500"
                  />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">
                      Supports formats: <code className="text-blue-300">4x Card Name</code>, <code className="text-blue-300">Qty, Name, Set</code>, or raw lines.
                    </span>

                    <button
                      type="button"
                      onClick={handleImportBuylist}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Parse & Value Buylist</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: BULK STACKS FLAT-RATE COUNTER */}
            {intakeMode === 'bulk_counter' && (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 sm:p-6 space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white">Bulk Flat-Rate Counter</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Have shoe boxes of commons, uncommons, or bulk reverse holos? Add them in bulk at standard dealer cash rates without photographing each one.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Commons / Uncommons */}
                    <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white">Common / Uncommon Stacks</h4>
                        <p className="text-[11px] text-slate-400">Flat rate: £0.012 per card (NM/LP condition)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step={50}
                          value={bulkCounts.commons}
                          onChange={(e) =>
                            setBulkCounts({ ...bulkCounts, commons: Math.max(0, parseInt(e.target.value) || 0) })
                          }
                          className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-right font-bold"
                        />
                        <span className="text-xs font-mono font-bold text-emerald-400 w-16 text-right">
                          £{(bulkCounts.commons * 0.012).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Holo Rares / Reverse Holos */}
                    <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white">Holo Rares & Reverse Holos</h4>
                        <p className="text-[11px] text-slate-400">Flat rate: £0.05 per card</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step={10}
                          value={bulkCounts.holos}
                          onChange={(e) =>
                            setBulkCounts({ ...bulkCounts, holos: Math.max(0, parseInt(e.target.value) || 0) })
                          }
                          className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-right font-bold"
                        />
                        <span className="text-xs font-mono font-bold text-emerald-400 w-16 text-right">
                          £{(bulkCounts.holos * 0.05).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Ultra Rares / V / EX */}
                    <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white">Ultra Rares (V / EX / GX)</h4>
                        <p className="text-[11px] text-slate-400">Flat rate: £0.50 per card</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step={5}
                          value={bulkCounts.ultraRares}
                          onChange={(e) =>
                            setBulkCounts({ ...bulkCounts, ultraRares: Math.max(0, parseInt(e.target.value) || 0) })
                          }
                          className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-right font-bold"
                        />
                        <span className="text-xs font-mono font-bold text-emerald-400 w-16 text-right">
                          £{(bulkCounts.ultraRares * 0.50).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Sealed Packs */}
                    <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white">Sealed Booster Packs</h4>
                        <p className="text-[11px] text-slate-400">Standard set: £3.20 per pack</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step={1}
                          value={bulkCounts.sealedPacks}
                          onChange={(e) =>
                            setBulkCounts({ ...bulkCounts, sealedPacks: Math.max(0, parseInt(e.target.value) || 0) })
                          }
                          className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-right font-bold"
                        />
                        <span className="text-xs font-mono font-bold text-emerald-400 w-16 text-right">
                          £{(bulkCounts.sealedPacks * 3.20).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bulk Summary */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Total Bulk Cash Payout:</span>
                      <span className="text-xl font-black text-emerald-400">
                        £{bulkCashTotal.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      Save & Continue to Comps →
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* SCANNING OVERLAY MODAL */}
        {isScanning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <Sparkles className="w-7 h-7 text-blue-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Analyzing Trading Cards</h3>
              <p className="text-xs text-blue-300 font-mono mb-4">{scanProgress.text}</p>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{
                    width: `${Math.round((scanProgress.current / Math.max(1, scanProgress.total)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: AI CARD MATCH CONFIRMATION */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Step 2 of 4 • Vision Verification
                </span>
                <h2 className="text-2xl font-black text-white">
                  Confirm Recognized Cards ({cardItems.length})
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Side-by-side comparison of your uploaded photo with the official TCG database record.
                </p>
              </div>

              {/* Bulk Action Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmAll}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm All (✓)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBulkSetCondition('Raw NM')}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  Set All to NM
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  + Add More Cards
                </button>
              </div>
            </div>

            {/* Search and Sort Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={cardSearchFilter}
                  onChange={(e) => setCardSearchFilter(e.target.value)}
                  placeholder="Filter cards in list..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="text-[11px] text-slate-400">Sort by:</span>
                <select
                  value={cardSortBy}
                  onChange={(e) => setCardSortBy(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                >
                  <option value="value_desc">Highest Value First</option>
                  <option value="value_asc">Lowest Value First</option>
                  <option value="name">Card Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* List of matched cards */}
            <div className="grid grid-cols-1 gap-4">
              {sortedAndFilteredCards.map((item) => {
                const originalIndex = cardItems.findIndex((c) => c.tempId === item.tempId);
                return (
                  <div
                    key={item.tempId}
                    className={`bg-slate-800/60 rounded-xl border p-4 sm:p-5 transition-all ${
                      item.confirmed
                        ? 'border-emerald-500/40 bg-emerald-950/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      
                      {/* Left: Photos Comparison (User photo vs Official Matched image) */}
                      <div className="md:col-span-5 flex items-center gap-3 sm:gap-4">
                        {/* Customer Photo */}
                        <div className="relative group shrink-0">
                          <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shadow-md">
                            <img
                              src={item.userPhoto}
                              alt="Uploaded card"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/80 text-white backdrop-blur-xs">
                            Your Photo
                          </span>
                          <button
                            type="button"
                            onClick={() => setExpandedPhoto(item.userPhoto)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity rounded-lg"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="text-slate-500 text-xs font-bold">⇄</div>

                        {/* Official Matched Art */}
                        <div className="relative shrink-0">
                          <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-lg overflow-hidden bg-slate-900 border border-blue-500/50 shadow-md">
                            <img
                              src={item.matchedCard.imageUrl}
                              alt="Official card art"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600/90 text-white backdrop-blur-xs">
                            Official Match
                          </span>
                        </div>

                        {/* Match Confidence & Badges */}
                        <div className="min-w-0">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            {Math.round(item.detection.confidence * 100)}% AI Match
                          </span>
                          <p className="text-[11px] text-slate-400">{item.matchedCard.game}</p>
                          <p className="text-[11px] text-slate-400">{item.matchedCard.setName}</p>
                        </div>
                      </div>

                      {/* Middle: Details & Attributes */}
                      <div className="md:col-span-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white leading-tight">
                            {item.matchedCard.name}
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-700/80 border border-slate-600 font-mono">
                            #{item.matchedCard.cardNumber || 'Promo'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-700/80 border border-slate-600">
                            {item.matchedCard.rarity}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-700/80 border border-slate-600 text-amber-300">
                            {item.selectedCondition}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 italic line-clamp-1 pt-1">
                          "{item.detection.notes}"
                        </p>
                      </div>

                      {/* Right: Confirmation Actions */}
                      <div className="md:col-span-3 flex flex-col sm:flex-row md:flex-col items-end justify-center gap-2">
                        {item.confirmed ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg w-full justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Match Confirmed</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConfirmCard(originalIndex)}
                            className="w-full px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Match</span>
                          </button>
                        )}

                        <div className="flex items-center gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => openSearchModal(originalIndex)}
                            className="flex-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors text-center"
                          >
                            Change Match
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCard(originalIndex)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Remove card"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Ingestion</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md flex items-center gap-2 transition-all"
              >
                <span>Continue to Condition & Comps</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONDITION SELECTION & LIVE MARKET VALUATION */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Step 3 of 4 • Valuation & Comps
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  Card Condition & eBay Sold Comps
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Adjust each card's condition to calculate accurate payouts based on eBay average sold listings and store buy percentages.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsConditionGuideOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <span>Visual Condition Guide</span>
              </button>
            </div>

            {/* Live Collection Value Banner */}
            <div className="bg-gradient-to-r from-blue-900/50 via-indigo-900/40 to-slate-800/80 border border-blue-500/40 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                <div className="border-b sm:border-b-0 sm:border-r border-slate-700/80 pb-3 sm:pb-0 sm:pr-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Total Cards & Bulk
                  </span>
                  <p className="text-2xl font-black text-white mt-0.5">
                    {cardItems.length + bulkCounts.commons + bulkCounts.holos + bulkCounts.ultraRares}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {cardItems.length} singles + {bulkCounts.commons + bulkCounts.holos} bulk
                  </p>
                </div>

                <div className="border-b sm:border-b-0 sm:border-r border-slate-700/80 pb-3 sm:pb-0 sm:pr-4">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1 justify-center sm:justify-start">
                    <DollarSign className="w-3.5 h-3.5" />
                    Instant Cash Offer
                  </span>
                  <p className="text-2xl font-black text-emerald-400 mt-0.5">
                    £{totalCashOffer.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-300">Bank Transfer or PayPal (72% comp)</p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1 justify-center sm:justify-start">
                    <Sparkles className="w-3.5 h-3.5" />
                    Store Credit Offer
                  </span>
                  <p className="text-2xl font-black text-amber-400 mt-0.5">
                    £{totalCreditOffer.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-300">+12% Bonus Store Credit (84% comp)</p>
                </div>
              </div>
            </div>

            {/* Cards Condition Table & Comps */}
            <div className="space-y-4">
              {cardItems.map((item, idx) => (
                <div
                  key={item.tempId}
                  className="bg-slate-800/60 rounded-xl border border-slate-700 p-4 sm:p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Card Identity */}
                    <div className="flex items-center gap-3">
                      <img
                        src={item.userPhoto || item.matchedCard.imageUrl}
                        alt={item.matchedCard.name}
                        className="w-14 h-20 object-cover rounded-lg border border-slate-700 shadow shrink-0"
                      />
                      <div>
                        <h4 className="text-base font-bold text-white">{item.matchedCard.name}</h4>
                        <p className="text-xs text-slate-400">
                          {item.matchedCard.game} • {item.matchedCard.setName} • #{item.matchedCard.cardNumber}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs font-semibold text-blue-300">
                            eBay Last Sold Avg: £{item.matchedCard.marketPrice}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Condition Selector */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Condition / Slab:
                        </label>
                        <select
                          value={item.selectedCondition}
                          onChange={(e) => handleConditionChange(idx, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-blue-500"
                        >
                          <option value="Raw NM">Raw Near Mint (NM)</option>
                          <option value="Lightly Played">Lightly Played (LP)</option>
                          <option value="Moderately Played">Moderately Played (MP)</option>
                          <option value="Heavily Played">Heavily Played (HP)</option>
                          <option value="Damaged">Damaged (DMG)</option>
                          <option value="PSA 10 / Gem Mint">PSA 10 Gem Mint</option>
                          <option value="PSA 9 / Mint">PSA 9 Mint</option>
                          <option value="BGS 9.5 / Pristine">BGS 9.5 Pristine</option>
                        </select>
                      </div>

                      {/* Cash vs Credit offer breakdown for this card */}
                      <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg px-4 py-2 text-right">
                        <div className="text-xs font-bold text-emerald-400">
                          Cash: £{item.matchedCard.storeCashOffer}
                        </div>
                        <div className="text-[11px] text-amber-300">
                          Credit: £{item.matchedCard.storeCreditOffer}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Recent eBay comps list expandable */}
                  {item.matchedCard.ebayRecentComps && item.matchedCard.ebayRecentComps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/60 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Recent eBay Completed Sales:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
                        {item.matchedCard.ebayRecentComps.slice(0, 3).map((comp, cIdx) => (
                          <div
                            key={cIdx}
                            className="bg-slate-900/60 rounded p-2 text-[11px] border border-slate-800 text-slate-300"
                          >
                            <div className="font-semibold text-white">£{comp.price}</div>
                            <div className="truncate text-slate-400 text-[10px]">{comp.title}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5">Sold {comp.date}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Card Matches</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md flex items-center gap-2 transition-all"
              >
                <span>Proceed to Payout & Contact</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CONTACT & PAYOUT FORM */}
        {currentStep === 4 && (
          <form onSubmit={handleSubmitCollection} className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Step 4 of 4 • Finalize Submission
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Your Details & Payout Preference
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Choose how you want to be paid and enter your contact details. Dealer reviews within 24 hours.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Contact info */}
              <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
                  Collector Contact Information
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Alex Henderson"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. alex@example.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +44 7700 900142"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Fulfillment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('shipping')}
                      className={`p-3 rounded-lg border text-left text-xs transition-all ${
                        deliveryMethod === 'shipping'
                          ? 'border-blue-500 bg-blue-500/10 text-white font-semibold'
                          : 'border-slate-700 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <Package className="w-4 h-4 mb-1 text-blue-400" />
                      <div>Free Insured Mail Kit</div>
                      <div className="text-[10px] text-slate-400 font-normal">Prepaid tracked label sent</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('dropoff')}
                      className={`p-3 rounded-lg border text-left text-xs transition-all ${
                        deliveryMethod === 'dropoff'
                          ? 'border-blue-500 bg-blue-500/10 text-white font-semibold'
                          : 'border-slate-700 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 mb-1 text-emerald-400" />
                      <div>In-Store Counter Drop-off</div>
                      <div className="text-[10px] text-slate-400 font-normal">Bring cards to shop counter</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Additional Notes for Dealer (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="e.g. Vintage cards kept in smoke-free home in vault binders."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Right Column: Payout selection & breakdown */}
              <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300 mb-3">
                    Payout Choice
                  </h3>

                  {/* Payout Type Toggle */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setPreferredPayout('cash')}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        preferredPayout === 'cash'
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                          : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> Direct Cash Payout
                      </span>
                      <div className="text-xl font-black text-white mt-1">
                        £{totalCashOffer.toLocaleString()}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Bank transfer or PayPal</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreferredPayout('credit')}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        preferredPayout === 'credit'
                          ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                          : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> +12% Store Credit
                      </span>
                      <div className="text-xl font-black text-white mt-1">
                        £{totalCreditOffer.toLocaleString()}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Digital voucher for sealed & singles</p>
                    </button>
                  </div>

                  {preferredPayout === 'cash' && (
                    <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-lg border border-slate-700/80">
                      <label className="block text-xs font-medium text-slate-300">
                        Payout Method
                      </label>
                      <div className="flex gap-4 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="payoutMethod"
                            checked={payoutMethod === 'bank'}
                            onChange={() => setPayoutMethod('bank')}
                          />
                          <span>UK Faster Payments / IBAN</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="payoutMethod"
                            checked={payoutMethod === 'paypal'}
                            onChange={() => setPayoutMethod('paypal')}
                          />
                          <span>PayPal</span>
                        </label>
                      </div>

                      <input
                        type="text"
                        value={payoutDetails}
                        onChange={(e) => setPayoutDetails(e.target.value)}
                        placeholder={
                          payoutMethod === 'bank'
                            ? 'Sort Code & Account Number or IBAN'
                            : 'PayPal Email Address'
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-700/80">
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Submitted Cards Count:</span>
                    <span className="font-bold text-white">
                      {cardItems.length + bulkCounts.commons + bulkCounts.holos + bulkCounts.ultraRares} cards
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300 mb-2">
                    <span>Est. Market Comp Value:</span>
                    <span className="font-bold text-white">£{totalMarketValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-700">
                    <span>Selected Estimated Offer:</span>
                    <span className={preferredPayout === 'credit' ? 'text-amber-400' : 'text-emerald-400'}>
                      £
                      {(preferredPayout === 'credit'
                        ? totalCreditOffer
                        : totalCashOffer
                      ).toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting to Store Vault...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit Collection for Offer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Comps</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: SUBMITTED SUCCESS SCREEN */}
        {currentStep === 5 && (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-8 max-w-2xl mx-auto text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Reference: {submittedRef || '#TCG-1048'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-3">
                Collection Submitted Successfully!
              </h2>
              <p className="text-sm text-slate-300 mt-2">
                Thank you, <strong className="text-white">{customerName || 'Collector'}</strong>. We have received your submission.
              </p>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-4 text-left border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Cards:</span>
                <span className="text-white font-bold">
                  {cardItems.length + bulkCounts.commons + bulkCounts.holos + bulkCounts.ultraRares} cards
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Preferred Offer:</span>
                <span className="text-emerald-400 font-bold">
                  £{(preferredPayout === 'credit' ? totalCreditOffer : totalCashOffer).toLocaleString()}{' '}
                  ({preferredPayout.toUpperCase()})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fulfillment:</span>
                <span className="text-white">
                  {deliveryMethod === 'shipping' ? 'Insured Shipping Kit' : 'Counter Drop-off'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-blue-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  In Review by {shopName}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Print Packing Slip (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => onTrackSubmission(submittedRef || '#TCG-1048')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Track Live Progress</span>
              </button>

              <button
                type="button"
                onClick={onBackToHome}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                Return to Homepage
              </button>
            </div>
          </div>
        )}

      </main>

      {/* SEARCH ALTERNATIVE MODAL */}
      {searchModalCardIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Search Alternative Card Match</h3>
            <p className="text-xs text-slate-400 mb-4">
              Search by card name, set, or collector number from the TCG database.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Charizard, Black Lotus, Blue-Eyes..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={() =>
                  searchAlternativeCards(searchQuery, 'Pokémon').then((res) => setSearchResults(res))
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
              >
                Search
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {searchResults.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleSelectAlternative(card)}
                  className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 cursor-pointer border border-slate-700 transition-colors"
                >
                  <img src={card.imageUrl} alt={card.name} className="w-10 h-14 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{card.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {card.game} • {card.setName} • #{card.cardNumber}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-semibold">
                      Comp: £{card.marketPrice} (Cash £{card.storeCashOffer})
                    </p>
                  </div>
                  <span className="text-xs text-blue-400 font-semibold">Select</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setSearchModalCardIndex(null)}
                className="px-4 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO PREVIEW EXPANDER */}
      {expandedPhoto && (
        <div
          onClick={() => setExpandedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 cursor-pointer"
        >
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-2">
            <img src={expandedPhoto} alt="Full resolution" className="w-full max-h-[80vh] object-contain rounded-xl" />
            <p className="text-center text-xs text-slate-400 mt-2">Click anywhere to close inspection view</p>
          </div>
        </div>
      )}

      {/* PRINTABLE INTAKE MANIFEST MODAL */}
      <PrintableManifestModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        shopName={shopName}
        submission={{
          ref: submittedRef || '#TCG-1048',
          date: 'Today',
          collection: `TCG Collection (${cardItems.length} cards)`,
          cards: cardItems.length + bulkCounts.commons + bulkCounts.holos + bulkCounts.ultraRares,
          estValue: `£${(preferredPayout === 'credit' ? totalCreditOffer : totalCashOffer).toLocaleString()}`,
          totalCashOffer,
          totalCreditOffer,
          status: 'New',
          collector: customerName || 'Valued Collector',
          email: customerEmail || 'collector@example.com',
          phone: customerPhone,
          notes: customerNotes,
          preferredPayout,
          items: cardItems.map((c) => ({
            id: c.tempId,
            name: c.matchedCard.name,
            game: c.matchedCard.game,
            setName: c.matchedCard.setName,
            cardNumber: c.matchedCard.cardNumber,
            rarity: c.matchedCard.rarity,
            userPhoto: c.userPhoto,
            officialImageUrl: c.matchedCard.imageUrl,
            condition: c.selectedCondition,
            marketPrice: c.matchedCard.marketPrice,
            cashOffer: c.matchedCard.storeCashOffer,
            creditOffer: c.matchedCard.storeCreditOffer,
            confirmed: c.confirmed,
          })),
        }}
      />

      {/* VISUAL CONDITION STANDARDS GUIDE */}
      <ConditionGuideModal
        isOpen={isConditionGuideOpen}
        onClose={() => setIsConditionGuideOpen(false)}
      />
    </div>
  );
}
