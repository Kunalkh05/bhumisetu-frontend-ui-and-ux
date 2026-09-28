import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  MapPin, 
  Map,
  Calendar, 
  FileText, 
  IndianRupee, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Send, 
  Upload, 
  ShieldCheck, 
  Download, 
  User, 
  Phone, 
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
  Filter,
  RefreshCw,
  FolderKanban,
  Building,
  Check,
  HelpCircle,
  BookOpen,
  Landmark,
  Eye,
  FileCheck
} from 'lucide-react';
import { formatCurrencyINR, formatDate } from '../../lib/utils';
import { GisMapViewer } from '../officer/GisMapViewer';
import { NationalEmblem } from '../common/NationalEmblem';
import { IndianFlag } from '../common/IndianFlag';
import { PublicTab } from '../common/GovNavigation';
import { MOCK_PROJECTS } from '../../data/mockData';

interface PublicPortalProps {
  activeTab: PublicTab;
  setActiveTab: (tab: PublicTab) => void;
  onNavigateToOfficerCase?: (caseId: string) => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({ 
  activeTab, 
  setActiveTab,
  onNavigateToOfficerCase
}) => {
  const { cases, submitCitizenObjection, language, addToast, setSelectedCaseId } = useApp();

  // Search State
  const [searchState, setSearchState] = useState('Maharashtra');
  const [searchDistrict, setSearchDistrict] = useState('ALL');
  const [searchTehsil, setSearchTehsil] = useState('ALL');
  const [searchVillage, setSearchVillage] = useState('ALL');
  const [searchProject, setSearchProject] = useState('ALL');
  const [searchGatNumber, setSearchGatNumber] = useState('');
  const [searchCaseRef, setSearchCaseRef] = useState('');
  const [selectedCaseDetailId, setSelectedCaseDetailId] = useState<string | null>(null);

  // Section 15 Objection Form State
  const [objectorName, setObjectorName] = useState('Tukaram Bapu Jadhav');
  const [objectorContact, setObjectorContact] = useState('+91 98231 44521');
  const [objectorAadhaar, setObjectorAadhaar] = useState('XXXX-XXXX-4819');
  const [surveyGat, setSurveyGat] = useState('142/A');
  const [selectedCaseForObjection, setSelectedCaseForObjection] = useState(cases[0].id);
  const [groundsCategory, setGroundsCategory] = useState<'Valuation & Compensation' | 'Measurement / Boundary Dispute' | 'Ownership / Title Claim' | 'Environmental / Religious Structure'>('Valuation & Compensation');
  const [objectionSubstance, setObjectionSubstance] = useState('');
  const [attachedFile, setAttachedFile] = useState<string | null>('comparable_registered_sale_instance_2025.pdf');
  const [submittedTrackingId, setSubmittedTrackingId] = useState<string | null>(null);

  // Objection Tracker State
  const [trackAckNumber, setTrackAckNumber] = useState('OBJ-2026-8812');
  const [trackResult, setTrackResult] = useState<{
    id: string;
    objector: string;
    caseRef: string;
    hearingDate: string;
    officer: string;
    status: string;
    remarks: string;
  } | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Filtered cases based on search criteria
  const filteredCases = cases.filter(c => {
    if (searchDistrict !== 'ALL' && c.district !== searchDistrict) return false;
    if (searchTehsil !== 'ALL' && c.tehsil !== searchTehsil) return false;
    if (searchVillage !== 'ALL' && c.village !== searchVillage) return false;
    if (searchProject !== 'ALL' && c.projectId !== searchProject) return false;
    if (searchCaseRef && !c.caseReference.toLowerCase().includes(searchCaseRef.toLowerCase())) return false;
    if (searchGatNumber && !c.parcels.some(p => p.surveyNumber.toLowerCase().includes(searchGatNumber.toLowerCase()))) return false;
    return true;
  });

  const handleResetSearch = () => {
    setSearchDistrict('ALL');
    setSearchTehsil('ALL');
    setSearchVillage('ALL');
    setSearchProject('ALL');
    setSearchGatNumber('');
    setSearchCaseRef('');
  };

  const handleSubmitObjection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objectionSubstance.trim()) {
      addToast({
        type: 'warning',
        message: 'Please provide detailed grounds and substance for the objection under Section 15.',
      });
      return;
    }

    const trackingId = submitCitizenObjection(selectedCaseForObjection, {
      objectorName,
      objectorContact,
      surveyNumber: surveyGat,
      groundsCategory,
      substance: objectionSubstance,
    });

    setSubmittedTrackingId(trackingId);
    setObjectionSubstance('');
    addToast({
      type: 'success',
      message: `Section 15 Objection registered successfully. Ack ID: ${trackingId}`,
      messageHi: `आपत्ति सफलतापूर्वक दर्ज की गई। पावती क्रमांक: ${trackingId}`,
    });
  };

  const handleTrackObjection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackAckNumber.trim()) return;

    // Simulate search in registered objections
    setTrackResult({
      id: trackAckNumber.toUpperCase(),
      objector: 'Tukaram Bapu Jadhav (Survey Gat No. 142/A)',
      caseRef: 'MH-PUN-2026-LA-001 (Pune-Bengaluru Expressway)',
      hearingDate: '15-Sept-2026 at 11:00 AM',
      officer: 'Shri R. K. Shinde, Sub-Divisional Officer / LAO Haveli',
      status: 'HEARING_SCHEDULED',
      remarks: 'Notice served under Section 15(2). Valuation report requisitioned from District Town Planner.',
    });
  };

  const selectedCaseForModal = cases.find(c => c.id === selectedCaseDetailId);

  return (
    <div id="main-content" className="w-full bg-[#f4f6f9] text-slate-800 text-xs">
      {/* 1. Official Government News Marquee Ticker */}
      <div className="bg-[#fff9e6] border-b border-[#ffd27f] text-slate-900 py-1.5 px-3 flex items-center gap-2 overflow-hidden">
        <div className="bg-[#f37021] text-white px-2 py-0.5 font-bold text-[10px] uppercase flex-shrink-0 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
          <span>{language === 'en' ? 'LATEST UPDATES' : 'नवीनतम समाचार'}</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap flex-1 text-[11px] font-medium text-slate-800">
          <span className="animate-gov-marquee">
            📢 [31-Aug-2026] Joint measurement survey for Pune Ring Road Phase 2 notified in Government Gazette • 
            Section 11 Preliminary Notification issued for Solapur-Hubli Highway corridor • 
            Public hearing for Section 15 objections scheduled before Collector Pune • 
            Direct Benefit Transfer (DBT) compensation disbursed to 1,420 Khatedars via PFMS • 
            DPDP Act 2023 citizen rights self-service portal now operational.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-5">
        {/* ============================================================ */}
        {/* VIEW 1: HOME (MAIN GOVERNMENT PORTAL HOMEPAGE) */}
        {/* ============================================================ */}
        {activeTab === 'HOME' && (
          <div className="space-y-5">
            {/* Top Leadership & Ministry Banner (Authentic Old Fashioned NIC Web Style) */}
            <div className="bg-white border border-slate-300 shadow-xs">
              <div className="tiranga-strip"></div>
              
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                  {/* Left Main Overview */}
                  <div className="lg:col-span-8 space-y-2">
                    <div className="inline-flex items-center gap-1.5 bg-[#e8f1f8] text-[#002b49] border border-[#002b49]/30 px-2 py-0.5 text-[11px] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#138808]" />
                      <span>RFCTLARR ACT, 2013 • STATUTORY REGULATORY E-GOVERNANCE PORTAL</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#002b49] leading-tight">
                      {language === 'en'
                        ? 'National Land Acquisition Management & Compensation Tracking System'
                        : 'राष्ट्रीय भूमि अधिग्रहण, मुआवजा निर्धारण एवं पुनर्वास प्रबंधन प्रणाली'}
                    </h2>

                    <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Official single-window portal of the Government of India for transparent, time-bound execution of land acquisition under the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013 (RFCTLARR). Integrated with cadastral GIS records (BhuNaksha), PFMS direct benefit transfer, and public grievance disposal.'
                        : 'भूमि अधिग्रहण में उचित मुआवजा एवं पारदर्शिता का अधिकार अधिनियम, २०१३ के अंतर्गत भूमि अधिग्रहण, राजपत्र अधिसूचनाओं, धारा १५ आपत्तियों एवं बैंक खातों में प्रत्यक्ष मुआवजा अंतरण का आधिकारिक राष्ट्रीय पोर्टल।'}
                    </p>
                    
                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveTab('SEARCH')}
                        className="gov-button-classic text-xs flex items-center gap-1.5"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Search Acquisition Records' : 'भू-अधिग्रहण अभिलेख खोजें'}</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('GRIEVANCE')}
                        className="gov-button-saffron text-xs flex items-center gap-1.5"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'File / Track Section 15 Objection' : 'धारा १५ आपत्ति दर्ज करें / स्थिति देखें'}</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('GIS_MAP')}
                        className="gov-button-green text-xs flex items-center gap-1.5"
                      >
                        <Map className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Cadastral GIS Map' : 'भू-नक्शा / GIS देखें'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Side: Traditional Leadership & Quick Notice Box */}
                  <div className="lg:col-span-4 bg-[#fbfcfd] border border-slate-300 p-3 space-y-2.5">
                    {/* Leadership Profile snippet */}
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-2 bg-slate-50 p-2">
                      <div className="w-13 h-17 bg-white p-1 flex flex-col items-center justify-center border border-slate-300 shadow-xs flex-shrink-0">
                        <NationalEmblem size={34} color="#002b49" showSlogan={false} />
                      </div>
                      <div className="text-[10px] leading-tight">
                        <div className="font-bold text-[#002b49] uppercase">Department of Land Resources</div>
                        <div className="text-slate-600 font-medium">Ministry of Rural Development</div>
                        <div className="text-[9px] text-[#FF9933] font-bold mt-0.5">Government of India</div>
                      </div>
                    </div>

                    {/* Notice Items */}
                    <div className="space-y-1.5 text-[11px] text-slate-700">
                      <div className="font-bold text-[#002b49] text-xs flex justify-between items-center">
                        <span>{language === 'en' ? 'Statutory Notice to Landowners' : 'खातेदारों हेतु महत्वपूर्ण सूचना'}</span>
                        <span className="px-1.5 py-0.2 bg-[#138808] text-white text-[9px] font-bold">Active</span>
                      </div>
                      <p className="flex items-start gap-1 text-[10px]">
                        <span className="text-[#FF9933] font-bold">▪</span>
                        <span>Sec 15 objections must be filed within <strong>60 days</strong> of preliminary notification.</span>
                      </p>
                      <p className="flex items-start gap-1 text-[10px]">
                        <span className="text-[#FF9933] font-bold">▪</span>
                        <span>Statutory <strong>100% Solatium</strong> &amp; 12% interest mandated by RFCTLARR Act.</span>
                      </p>
                    </div>

                    <div className="pt-1.5 text-[10px] text-slate-600 border-t border-slate-200 flex justify-between items-center font-semibold">
                      <span>Toll-Free Helpline:</span>
                      <span className="text-[#002b49] font-mono font-bold bg-amber-50 px-1.5 py-0.5 border border-amber-200">1800-11-2013</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rectangular Key Statistics Grid (Authentic Gov Style with Tricolour Header) */}
            <div className="border border-slate-300 bg-white">
              <div className="bg-[#002b49] text-white px-3 py-1.5 font-bold text-xs flex justify-between items-center border-b-2 border-[#FF9933]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF9933]"></div>
                  <span>{language === 'en' ? 'NATIONAL LAND ACQUISITION KEY STATISTICS (PAN-INDIA)' : 'राष्ट्रीय भूमि अधिग्रहण मुख्य सांख्यिकी'}</span>
                </div>
                <span className="text-[10px] font-normal text-slate-200 font-mono">As on: 31-Aug-2026</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-slate-300">
                <div className="bg-white p-3 text-center hover:bg-slate-50">
                  <div className="text-[10px] font-bold uppercase text-slate-600 font-serif">Total Projects</div>
                  <div className="text-lg font-black text-[#002b49] mt-0.5">128</div>
                  <div className="text-[9px] text-slate-500">Highways, Rail &amp; Energy</div>
                </div>
                <div className="bg-white p-3 text-center hover:bg-slate-50">
                  <div className="text-[10px] font-bold uppercase text-slate-600 font-serif">Land Acquired</div>
                  <div className="text-lg font-black text-[#002b49] mt-0.5">42,850.4 Ha</div>
                  <div className="text-[9px] text-slate-500">Across 18 States</div>
                </div>
                <div className="bg-white p-3 text-center hover:bg-slate-50">
                  <div className="text-[10px] font-bold uppercase text-slate-600 font-serif">Gazette Notices</div>
                  <div className="text-lg font-black text-[#002b49] mt-0.5">4,892</div>
                  <div className="text-[9px] text-slate-500">Sec 4, 11, 19 &amp; 23</div>
                </div>
                <div className="bg-white p-3 text-center hover:bg-slate-50">
                  <div className="text-[10px] font-bold uppercase text-slate-600 font-serif">Disbursed (PFMS)</div>
                  <div className="text-lg font-black text-[#138808] mt-0.5">₹ 14,820 Cr</div>
                  <div className="text-[9px] text-slate-500">Direct Benefit Transfer</div>
                </div>
                <div className="bg-white p-3 text-center hover:bg-slate-50">
                  <div className="text-[10px] font-bold uppercase text-slate-600 font-serif">Khatedars Paid</div>
                  <div className="text-lg font-black text-[#002b49] mt-0.5">1,84,320</div>
                  <div className="text-[9px] text-slate-500">Beneficiary Families</div>
                </div>
                <div className="bg-white p-3 text-center hover:bg-slate-50">
                  <div className="text-[10px] font-bold uppercase text-slate-600 font-serif">Sec 15 Disposal</div>
                  <div className="text-lg font-black text-[#FF9933] mt-0.5">94.8%</div>
                  <div className="text-[9px] text-slate-500">Objections Resolved</div>
                </div>
              </div>
            </div>

            {/* Prominent Government Search Panel (Bhoomi Rashi & LACRRIS style) */}
            <div className="bg-white border border-slate-300">
              <div className="bg-[#0b3866] text-white px-3 py-1.5 font-bold text-xs flex justify-between items-center border-b-2 border-[#f37021]">
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#f37021]" />
                  <span>{language === 'en' ? 'SEARCH LAND ACQUISITION NOTIFICATIONS & RECORDS' : 'भूमि अधिग्रहण अधिसूचनाएं एवं अभिलेख खोजें'}</span>
                </div>
                <span className="text-[10px] font-normal text-slate-200">Bhoomi Rashi &amp; LACRRIS Registry</span>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">State / राज्य:</label>
                    <select
                      value={searchState}
                      onChange={(e) => setSearchState(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 bg-white font-medium text-xs focus:ring-1 focus:ring-[#0b3866]"
                    >
                      <option value="Maharashtra">Maharashtra (महाराष्ट्र)</option>
                      <option value="Karnataka">Karnataka (कर्नाटक)</option>
                      <option value="Gujarat">Gujarat (गुजरात)</option>
                      <option value="Madhya Pradesh">Madhya Pradesh (मध्य प्रदेश)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">District / जिला:</label>
                    <select
                      value={searchDistrict}
                      onChange={(e) => setSearchDistrict(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 bg-white font-medium text-xs focus:ring-1 focus:ring-[#0b3866]"
                    >
                      <option value="ALL">-- All Districts (सभी जिले) --</option>
                      <option value="Pune">Pune (पुणे)</option>
                      <option value="Nashik">Nashik (नासिक)</option>
                      <option value="Solapur">Solapur (सोलापूर)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tehsil / तहसील:</label>
                    <select
                      value={searchTehsil}
                      onChange={(e) => setSearchTehsil(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 bg-white font-medium text-xs focus:ring-1 focus:ring-[#0b3866]"
                    >
                      <option value="ALL">-- All Tehsils (सभी तहसीलें) --</option>
                      <option value="Haveli">Haveli (हवेली)</option>
                      <option value="Niphad">Niphad (निफाड)</option>
                      <option value="Daund">Daund (दौंड)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Village / ग्राम:</label>
                    <select
                      value={searchVillage}
                      onChange={(e) => setSearchVillage(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 bg-white font-medium text-xs focus:ring-1 focus:ring-[#0b3866]"
                    >
                      <option value="ALL">-- All Villages (सभी ग्राम) --</option>
                      <option value="Wagholi">Wagholi (वाघोली)</option>
                      <option value="Pimpalgaon">Pimpalgaon (पिंपळगाव)</option>
                      <option value="Kasurdi">Kasurdi (कासुर्डी)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Project / परियोजना:</label>
                    <select
                      value={searchProject}
                      onChange={(e) => setSearchProject(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 bg-white font-medium text-xs focus:ring-1 focus:ring-[#0b3866]"
                    >
                      <option value="ALL">-- All Projects (सभी परियोजनाएं) --</option>
                      {MOCK_PROJECTS.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Survey / Gat No (सर्वे/गट क्र):</label>
                    <input
                      type="text"
                      placeholder="e.g. 142/A, 201/1"
                      value={searchGatNumber}
                      onChange={(e) => setSearchGatNumber(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 bg-white font-medium text-xs focus:ring-1 focus:ring-[#0b3866]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Case Ref (प्रकरण क्रमांक):</label>
                    <input
                      type="text"
                      placeholder="e.g. MH-PUN-2026-LA-001"
                      value={searchCaseRef}
                      onChange={(e) => setSearchCaseRef(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 bg-white font-medium text-xs focus:ring-1 focus:ring-[#0b3866]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-slate-200">
                  <div className="text-[11px] text-slate-600">
                    Showing <strong>{filteredCases.length}</strong> matching land acquisition case records
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleResetSearch}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{language === 'en' ? 'Reset Filters' : 'रीसेट करें'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('SEARCH')}
                      className="px-4 py-1.5 bg-[#0b3866] hover:bg-[#002b49] text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Search Records' : 'खोजें'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Latest Gazette Notifications & Case Records Table */}
            <div className="bg-white border border-slate-300">
              <div className="bg-[#0b3866] text-white px-3 py-1.5 font-bold text-xs flex justify-between items-center border-b border-[#0b3866]">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#f37021]" />
                  <span>{language === 'en' ? 'LATEST STATUTORY GAZETTE NOTIFICATIONS & CASE DIRECTORY' : 'नवीनतम सांविधिक राजपत्र अधिसूचनाएं एवं प्रकरण पंजी'}</span>
                </div>
                <button 
                  onClick={() => setActiveTab('NOTICES')}
                  className="text-[10px] text-yellow-300 hover:underline font-semibold"
                >
                  {language === 'en' ? 'View All Gazette Notices →' : 'सभी राजपत्र देखें →'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>Sr No</th>
                      <th>Case Reference / Notif ID</th>
                      <th>Project Name</th>
                      <th>Location (Dist / Tehsil / Village)</th>
                      <th>Statutory Stage</th>
                      <th>Sanctioned Extent</th>
                      <th>Hearing / Response Deadline</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((c, index) => (
                      <tr key={c.id}>
                        <td className="text-center font-bold text-slate-500">{index + 1}</td>
                        <td className="font-mono font-bold text-[#0b3866]">
                          {c.caseReference}
                        </td>
                        <td className="font-medium text-slate-900 max-w-[220px]">
                          {language === 'en' ? c.projectName : c.projectNameHi}
                        </td>
                        <td className="text-slate-600">
                          {c.district}, {c.tehsil}, <strong>{c.village}</strong>
                        </td>
                        <td>
                          <span className="px-2 py-0.5 bg-[#e8f1f8] text-[#0b3866] border border-[#0b3866]/20 font-bold text-[10px]">
                            {c.stage.replace('STAGE_', '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="font-mono">{c.totalExtentHa} Ha</td>
                        <td>
                          <span className="font-semibold text-slate-800">
                            {formatDate(c.stageDeadline)}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            ({c.daysRemaining} days remaining)
                          </span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedCaseDetailId(c.id)}
                            className="px-2.5 py-1 bg-[#0b3866] hover:bg-[#002b49] text-white font-bold text-[11px] mr-1"
                          >
                            {language === 'en' ? 'View Details' : 'विवरण देखें'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCaseForObjection(c.id);
                              setActiveTab('GRIEVANCE');
                            }}
                            className="px-2.5 py-1 bg-[#f37021] hover:bg-[#d95e14] text-white font-bold text-[11px]"
                          >
                            {language === 'en' ? 'File Objection' : 'आपत्ति करें'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Allied Government Land Portals & Integration Grid */}
            <div className="bg-white border border-slate-300 p-4 space-y-3">
              <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                <span className="font-bold text-[#0b3866] text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-[#f37021]" />
                  <span>{language === 'en' ? 'NATIONAL LAND & SPATIAL INFRASTRUCTURE PORTALS (GOI INTEGRATIONS)' : 'संबद्ध राष्ट्रीय भूमि एवं स्थानिक अवसंरचना पोर्टल'}</span>
                </span>
                <span className="text-[10px] text-slate-500">Government of India / State Revenue Portals</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <a 
                  href="https://bhoomirashi.gov.in" 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-3 bg-slate-50 border border-slate-200 hover:border-[#0b3866] hover:bg-slate-100 transition-colors text-center block"
                >
                  <div className="text-[11px] font-bold text-[#0b3866]">BHOOMI RASHI</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">MoRTH Highway Land</div>
                  <div className="text-[9px] text-[#f37021] font-semibold mt-1 flex items-center justify-center gap-0.5">
                    <span>Visit Portal</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                </a>

                <a 
                  href="https://gatishakti.gov.in" 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-3 bg-slate-50 border border-slate-200 hover:border-[#0b3866] hover:bg-slate-100 transition-colors text-center block"
                >
                  <div className="text-[11px] font-bold text-[#138808]">PM GATI SHAKTI</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">National Master Plan</div>
                  <div className="text-[9px] text-[#f37021] font-semibold mt-1 flex items-center justify-center gap-0.5">
                    <span>Visit Portal</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                </a>

                <a 
                  href="https://bhunaksha.gov.in" 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-3 bg-slate-50 border border-slate-200 hover:border-[#0b3866] hover:bg-slate-100 transition-colors text-center block"
                >
                  <div className="text-[11px] font-bold text-[#0b3866]">BHUNAKSHA (NIC)</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Cadastral Map GIS</div>
                  <div className="text-[9px] text-[#f37021] font-semibold mt-1 flex items-center justify-center gap-0.5">
                    <span>Visit Portal</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                </a>

                <a 
                  href="https://mahabhulekh.maharashtra.gov.in" 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-3 bg-slate-50 border border-slate-200 hover:border-[#0b3866] hover:bg-slate-100 transition-colors text-center block"
                >
                  <div className="text-[11px] font-bold text-[#0b3866]">MAHABHULEKH</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">7/12 Land Records</div>
                  <div className="text-[9px] text-[#f37021] font-semibold mt-1 flex items-center justify-center gap-0.5">
                    <span>Visit Portal</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                </a>

                <a 
                  href="https://pfms.nic.in" 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-3 bg-slate-50 border border-slate-200 hover:border-[#0b3866] hover:bg-slate-100 transition-colors text-center block"
                >
                  <div className="text-[11px] font-bold text-[#0b3866]">PFMS DBT</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Direct Benefit Transfer</div>
                  <div className="text-[9px] text-[#f37021] font-semibold mt-1 flex items-center justify-center gap-0.5">
                    <span>Visit Portal</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                </a>

                <a 
                  href="https://dilrmp.gov.in" 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-3 bg-slate-50 border border-slate-200 hover:border-[#0b3866] hover:bg-slate-100 transition-colors text-center block"
                >
                  <div className="text-[11px] font-bold text-[#0b3866]">DILRMP</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Land Records Modernisation</div>
                  <div className="text-[9px] text-[#f37021] font-semibold mt-1 flex items-center justify-center gap-0.5">
                    <span>Visit Portal</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: SEARCH ACQUISITION RECORDS */}
        {/* ============================================================ */}
        {activeTab === 'SEARCH' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-300 p-4">
              <div className="border-b-2 border-[#f37021] pb-2 mb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-[#0b3866]">
                    {language === 'en' ? 'SEARCH LAND ACQUISITION & COMPENSATION RECORDS' : 'भूमि अधिग्रहण एवं मुआवजा अभिलेख खोजें'}
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {language === 'en'
                      ? 'Query statutory records across all Gazette Notifications, Cadastral survey numbers (Gat No), Khatedars and PFMS DBT Payouts'
                      : 'राजपत्र अधिसूचनाएं, भू-सर्वे क्रमांक (गट नंबर), खातेदार एवं बैंक अंतरण विवरण खोजें'}
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 border border-slate-200 mb-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">District / जिला:</label>
                  <select
                    value={searchDistrict}
                    onChange={(e) => setSearchDistrict(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 bg-white font-medium text-xs"
                  >
                    <option value="ALL">-- All Districts --</option>
                    <option value="Pune">Pune</option>
                    <option value="Nashik">Nashik</option>
                    <option value="Solapur">Solapur</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tehsil / तहसील:</label>
                  <select
                    value={searchTehsil}
                    onChange={(e) => setSearchTehsil(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 bg-white font-medium text-xs"
                  >
                    <option value="ALL">-- All Tehsils --</option>
                    <option value="Haveli">Haveli</option>
                    <option value="Niphad">Niphad</option>
                    <option value="Daund">Daund</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Survey / Gat No:</label>
                  <input
                    type="text"
                    placeholder="e.g. 142/A"
                    value={searchGatNumber}
                    onChange={(e) => setSearchGatNumber(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 bg-white font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Case Reference ID:</label>
                  <input
                    type="text"
                    placeholder="e.g. MH-PUN-2026-LA-001"
                    value={searchCaseRef}
                    onChange={(e) => setSearchCaseRef(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 bg-white font-medium text-xs"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Case Reference</th>
                      <th>Project</th>
                      <th>Village / Tehsil</th>
                      <th>Parcels &amp; Extent</th>
                      <th>Stage</th>
                      <th>Deadline</th>
                      <th>Award Total</th>
                      <th>Disbursed</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map(c => (
                      <tr key={c.id}>
                        <td className="font-mono font-bold text-[#0b3866]">{c.caseReference}</td>
                        <td className="font-semibold text-slate-900">{c.projectName}</td>
                        <td>{c.village}, {c.tehsil}</td>
                        <td className="font-mono">{c.totalParcelsCount} parcels ({c.totalExtentHa} Ha)</td>
                        <td>
                          <span className="px-2 py-0.5 bg-[#e8f1f8] text-[#0b3866] border border-[#0b3866]/30 font-bold text-[10px]">
                            {c.stage.replace('STAGE_', '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>{formatDate(c.stageDeadline)}</td>
                        <td className="font-mono">{formatCurrencyINR(c.totalAwardedAmount)}</td>
                        <td className="font-mono font-bold text-[#138808]">{formatCurrencyINR(c.totalDisbursedAmount)}</td>
                        <td className="text-right">
                          <button
                            onClick={() => setSelectedCaseDetailId(c.id)}
                            className="px-2.5 py-1 bg-[#0b3866] text-white font-bold text-[11px]"
                          >
                            View Record
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 3: PROJECTS DIRECTORY */}
        {/* ============================================================ */}
        {activeTab === 'PROJECTS' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-300 p-4 space-y-4">
              <div className="border-b-2 border-[#f37021] pb-2 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-[#0b3866]">
                    {language === 'en' ? 'MAJOR INFRASTRUCTURE PROJECTS DIRECTORY' : 'प्रमुख अवसंरचना परियोजनाएं निर्देशिका'}
                  </h2>
                  <p className="text-slate-500 text-xs">
                    {language === 'en'
                      ? 'National and State Land Acquisition Projects under NHAI, Railways, Industrial Corridors and PWD'
                      : 'भारतीय राष्ट्रीय राजमार्ग प्राधिकरण, रेलवे एवं राज्य लोक निर्माण विभाग की स्वीकृत परियोजनाएं'}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Project Code</th>
                      <th>Project Name</th>
                      <th>Implementing Authority</th>
                      <th>Category</th>
                      <th>Administrative Area</th>
                      <th>Sanctioned Extent</th>
                      <th>Total Budget</th>
                      <th>Active Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_PROJECTS.map(p => (
                      <tr key={p.id}>
                        <td className="font-mono font-bold text-[#0b3866]">{p.id}</td>
                        <td className="font-bold text-slate-900">{p.name}</td>
                        <td className="text-slate-700">{p.implementingAuthority}</td>
                        <td>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-[10px]">
                            {p.purposeCategory}
                          </span>
                        </td>
                        <td>{p.administrativeArea}</td>
                        <td className="font-mono font-semibold">{p.sanctionedExtentHa} Ha</td>
                        <td className="font-mono text-[#138808] font-bold">{formatCurrencyINR(p.totalBudgetINR)}</td>
                        <td className="font-bold text-slate-900">{p.activeCases} active ({p.completedCases} completed)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 4: GAZETTE NOTIFICATIONS */}
        {/* ============================================================ */}
        {activeTab === 'NOTICES' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-300 p-4 space-y-4">
              <div className="border-b-2 border-[#f37021] pb-2 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-[#0b3866]">
                    {language === 'en' ? 'STATUTORY GAZETTE NOTIFICATIONS REPOSITORY' : 'सांविधिक राजपत्र अधिसूचनाएं एवं सार्वजनिक सूचनाएं'}
                  </h2>
                  <p className="text-slate-500 text-xs">
                    {language === 'en'
                      ? 'Authentic Gazette copies published under Sections 4 (SIA), 11 (Preliminary Notification), 19 (Declaration) and 23 (Award)'
                      : 'धारा ४, ११, १९ एवं २३ के अंतर्गत जारी आधिकारिक राजपत्र प्रतियां'}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Notice ID</th>
                      <th>Statutory Section</th>
                      <th>Publication Mode</th>
                      <th>Issuing Authority</th>
                      <th>Issue Date</th>
                      <th>Response Deadline</th>
                      <th>Status</th>
                      <th className="text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.flatMap(c => c.notices.map(n => ({ ...n, caseRef: c.caseReference, projectName: c.projectName }))).map(n => (
                      <tr key={n.id}>
                        <td className="font-mono font-bold text-[#0b3866]">{n.id}</td>
                        <td className="font-bold text-slate-900">{n.noticeType}</td>
                        <td className="text-slate-600">{n.publicationMode}</td>
                        <td className="text-slate-700">{n.issuingAuthority}</td>
                        <td>{formatDate(n.issueDate)}</td>
                        <td>
                          <span className="font-semibold text-[#f37021]">{formatDate(n.responseDeadline)}</span>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 text-[10px] font-bold ${
                            n.isBreached 
                              ? 'bg-red-100 text-red-800 border border-red-300' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            {n.isBreached ? 'Expired' : 'Active Window'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => {
                              addToast({
                                type: 'info',
                                message: `Downloading certified official gazette copy for ${n.id}...`,
                              });
                            }}
                            className="px-2.5 py-1 bg-[#0b3866] hover:bg-[#002b49] text-white font-bold text-[10px] flex items-center gap-1 ml-auto"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 5: CADASTRAL GIS MAP */}
        {/* ============================================================ */}
        {activeTab === 'GIS_MAP' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-300 p-4 space-y-3">
              <div className="border-b-2 border-[#f37021] pb-2 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-[#0b3866]">
                    {language === 'en' ? 'CADASTRAL GIS SPATIAL VIEWER (POSTGIS ENGINE)' : 'भू-नक्शा एवं जीआईएस स्थानिक मानचित्र'}
                  </h2>
                  <p className="text-slate-500 text-xs">
                    {language === 'en'
                      ? 'Interactive spatial parcel viewer with PostGIS ST_Area, ST_Perimeter, buffer zones, and high-resolution cadastral survey boundaries'
                      : 'भू-सर्वे सीमाएं, पोस्टजीआईएस क्षेत्रफल गणना, बफर जोन एवं उपग्रह मानचित्र'}
                  </p>
                </div>
              </div>

              {/* GIS Map Viewer Container */}
              <div className="border border-slate-300 bg-white">
                <GisMapViewer 
                  onSelectCase={(caseId) => {
                    setSelectedCaseDetailId(caseId);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 6: ACTS & RULES */}
        {/* ============================================================ */}
        {activeTab === 'ACTS_RULES' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-300 p-4 space-y-4">
              <div className="border-b-2 border-[#f37021] pb-2 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-[#0b3866]">
                    {language === 'en' ? 'STATUTORY ACTS, RULES, CIRCULARS & NOTIFICATIONS' : 'सांविधिक अधिनियम, नियम, परिपत्र एवं दिशानिर्देश'}
                  </h2>
                  <p className="text-slate-500 text-xs">
                    {language === 'en'
                      ? 'Authoritative legal framework governing land acquisition, market value determination, Solatium computation, and citizen rights'
                      : 'भूमि अधिग्रहण अधिनियम 2013 एवं संबंधित विधिक नियम संग्रह'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-300 p-3 bg-slate-50 space-y-2">
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-5 h-5 text-[#0b3866] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">
                        The RFCTLARR Act, 2013 (Act No. 30 of 2013)
                      </h3>
                      <p className="text-slate-600 text-[11px] mt-1">
                        Comprehensive legislation ensuring transparent land acquisition, social impact assessment, enhanced compensation, and rehabilitation and resettlement.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button 
                          onClick={() => addToast({ type: 'info', message: 'Downloading Full RFCTLARR Act 2013 PDF (Gazette of India)...' })}
                          className="px-2 py-1 bg-[#0b3866] text-white font-bold text-[10px] flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Act (English / Hindi)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-300 p-3 bg-slate-50 space-y-2">
                  <div className="flex items-start gap-2">
                    <FileText className="w-5 h-5 text-[#f37021] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">
                        First Schedule: Multipliers &amp; 100% Solatium (Sec 30)
                      </h3>
                      <p className="text-slate-600 text-[11px] mt-1">
                        Statutory compensation formula: Base Market Value × Rural Multiplier (1.0 - 2.0) + 100% Solatium + 12% annual interest under Section 30(3).
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button 
                          onClick={() => addToast({ type: 'info', message: 'Downloading First Schedule Multiplier Guidelines PDF...' })}
                          className="px-2 py-1 bg-[#0b3866] text-white font-bold text-[10px] flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Multipliers Schedule</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-300 p-3 bg-slate-50 space-y-2">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#138808] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">
                        Section 15 Objections &amp; Public Hearing SOP
                      </h3>
                      <p className="text-slate-600 text-[11px] mt-1">
                        Standard Operating Procedure for Collectors and LAOs conducting Section 15 personal hearings and passing reasoned statutory disposal orders.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button 
                          onClick={() => addToast({ type: 'info', message: 'Downloading Section 15 Hearing SOP PDF...' })}
                          className="px-2 py-1 bg-[#0b3866] text-white font-bold text-[10px] flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Hearing SOP</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-300 p-3 bg-slate-50 space-y-2">
                  <div className="flex items-start gap-2">
                    <Landmark className="w-5 h-5 text-[#0b3866] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">
                        Digital Personal Data Protection (DPDP) Act 2023
                      </h3>
                      <p className="text-slate-600 text-[11px] mt-1">
                        Citizen data privacy safeguards, masked Aadhaar storage, data subject rights (access, correction, erasure) and statutory compliance.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button 
                          onClick={() => addToast({ type: 'info', message: 'Downloading DPDP Act 2023 Guidelines PDF...' })}
                          className="px-2 py-1 bg-[#0b3866] text-white font-bold text-[10px] flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download DPDP Guidelines</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 7: PUBLIC GRIEVANCE & SECTION 15 OBJECTIONS */}
        {/* ============================================================ */}
        {activeTab === 'GRIEVANCE' && (
          <div className="space-y-4">
            {/* Objection Tracker Section */}
            <div className="bg-white border border-slate-300 p-4 space-y-3">
              <div className="border-b-2 border-[#0b3866] pb-2 flex justify-between items-center">
                <h3 className="font-bold text-[#0b3866] text-sm">
                  {language === 'en' ? 'TRACK SECTION 15 OBJECTION / GRIEVANCE STATUS' : 'आपत्ति / शिकायत की स्थिति जानें'}
                </h3>
              </div>

              <form onSubmit={handleTrackObjection} className="flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  required
                  placeholder="Enter Acknowledgement Tracking No (e.g. OBJ-2026-8812)"
                  value={trackAckNumber}
                  onChange={(e) => setTrackAckNumber(e.target.value)}
                  className="p-2 border border-slate-300 font-mono text-xs w-72"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0b3866] text-white font-bold text-xs flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Track Status' : 'स्थिति देखें'}</span>
                </button>
              </form>

              {trackResult && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-300 space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                    <span className="font-bold font-mono text-[#0b3866]">Tracking ID: {trackResult.id}</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px]">
                      {trackResult.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div><strong>Objector:</strong> {trackResult.objector}</div>
                    <div><strong>Case Reference:</strong> {trackResult.caseRef}</div>
                    <div><strong>Scheduled Hearing:</strong> <span className="text-[#f37021] font-bold">{trackResult.hearingDate}</span></div>
                    <div><strong>Presiding Authority:</strong> {trackResult.officer}</div>
                  </div>
                  <div className="pt-1 text-[11px] text-slate-700 border-t border-slate-200">
                    <strong>Official Remarks:</strong> {trackResult.remarks}
                  </div>
                </div>
              )}
            </div>

            {/* Objection Registration Form */}
            <div className="bg-white border border-slate-300 p-4 space-y-4">
              <div className="border-b-2 border-[#f37021] pb-2">
                <h2 className="text-base font-bold text-[#0b3866]">
                  {language === 'en' ? 'SECTION 15 STATUTORY OBJECTION REGISTRATION FORM' : 'धारा १५ सांविधिक आपत्ति दर्ज करने का प्रपत्र'}
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  {language === 'en'
                    ? 'Affected land owners and interested persons may register formal representations regarding valuation, area measurement, title claim, or public purpose.'
                    : 'भू-स्वामी अथवा हितबद्ध व्यक्ति धारा १५ के अंतर्गत मूल्यांकन, क्षेत्रफल या स्वामित्व के संबंध में आपत्ति दर्ज कर सकते हैं।'}
                </p>
              </div>

              {submittedTrackingId ? (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-500 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="font-bold text-sm text-emerald-900">
                    {language === 'en' ? 'Section 15 Representation Registered' : 'आपत्ति सफलतापूर्वक दर्ज की गई'}
                  </h3>
                  <div className="inline-block p-2 bg-white border border-emerald-300 font-mono font-bold text-sm text-emerald-800">
                    Acknowledgement No: {submittedTrackingId}
                  </div>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto">
                    An SMS confirmation with the personal hearing notice has been transmitted to {objectorContact}. A digital stamped receipt is available below.
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <button
                      onClick={() => addToast({ type: 'info', message: `Downloaded stamped acknowledgement: ${submittedTrackingId}.pdf` })}
                      className="px-3 py-1.5 bg-[#0b3866] text-white font-bold text-xs flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Stamped Receipt PDF</span>
                    </button>
                    <button
                      onClick={() => setSubmittedTrackingId(null)}
                      className="px-3 py-1.5 bg-slate-200 text-slate-800 font-bold text-xs"
                    >
                      Submit Another Representation
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitObjection} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Target Acquisition Case:</label>
                      <select
                        value={selectedCaseForObjection}
                        onChange={(e) => setSelectedCaseForObjection(e.target.value)}
                        className="w-full p-2 border border-slate-300 bg-white font-semibold text-xs"
                      >
                        {cases.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.caseReference} - {c.projectName} ({c.village}, {c.tehsil})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Survey / Gat Number:</label>
                      <input
                        type="text"
                        required
                        value={surveyGat}
                        onChange={(e) => setSurveyGat(e.target.value)}
                        className="w-full p-2 border border-slate-300 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Objector / Khatedar Full Name:</label>
                      <input
                        type="text"
                        required
                        value={objectorName}
                        onChange={(e) => setObjectorName(e.target.value)}
                        className="w-full p-2 border border-slate-300 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mobile Number (SMS Updates):</label>
                      <input
                        type="text"
                        required
                        value={objectorContact}
                        onChange={(e) => setObjectorContact(e.target.value)}
                        className="w-full p-2 border border-slate-300 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Aadhaar (Masked):</label>
                      <input
                        type="text"
                        value={objectorAadhaar}
                        onChange={(e) => setObjectorAadhaar(e.target.value)}
                        className="w-full p-2 border border-slate-300 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Grounds of Statutory Objection:</label>
                    <select
                      value={groundsCategory}
                      onChange={(e) => setGroundsCategory(e.target.value as any)}
                      className="w-full p-2 border border-slate-300 bg-white font-bold text-xs"
                    >
                      <option value="Valuation & Compensation">Valuation &amp; Compensation (Ready Reckoner discrepancy, Tree/Structure undervaluation)</option>
                      <option value="Measurement / Boundary Dispute">Measurement / Boundary Dispute (Joint survey overlap, area deficit)</option>
                      <option value="Ownership / Title Claim">Ownership / Title Claim (Khatedar succession, registered partition pending)</option>
                      <option value="Environmental / Religious Structure">Environmental / Religious Structure (Temple, Cremation ground, Irrigation well)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Detailed Substance &amp; Legal Grounds:</label>
                    <textarea
                      required
                      rows={3}
                      value={objectionSubstance}
                      onChange={(e) => setObjectionSubstance(e.target.value)}
                      placeholder="Specify registered sale instances within 3 years, horticulture details, or boundary demarcation records..."
                      className="w-full p-2 border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Supporting Document Attachment (7/12, Sale Deed, Valuation Map):</label>
                    <div className="p-3 border border-dashed border-slate-300 bg-slate-50 flex items-center justify-between">
                      <div className="text-[11px] text-slate-600">
                        {attachedFile ? `Selected: ${attachedFile}` : 'No file attached'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedFile('registered_comparable_sale_instance_2025.pdf')}
                        className="px-2.5 py-1 bg-slate-200 text-slate-800 font-bold text-[10px]"
                      >
                        Attach Sample Document
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#0b3866] hover:bg-[#002b49] text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Submit Formal Section 15 Objection' : 'आपत्ति प्रपत्र प्रेषित करें'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 8: STATISTICS & REPORTS */}
        {/* ============================================================ */}
        {activeTab === 'STATISTICS' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-300 p-4 space-y-4">
              <div className="border-b-2 border-[#f37021] pb-2 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-[#0b3866]">
                    {language === 'en' ? 'NATIONAL LAND ACQUISITION ANALYTICS & STATISTICAL REPORTS' : 'राष्ट्रीय भूमि अधिग्रहण सांख्यिकी एवं विश्लेषणात्मक रिपोर्ट'}
                  </h2>
                  <p className="text-slate-500 text-xs">
                    {language === 'en'
                      ? 'Comprehensive state-wise and project-wise distribution of land acquired, Solatium disbursed, and stage compliance rates'
                      : 'राज्यवार एवं परियोजनावार भूमि अधिग्रहण प्रगति व मुआवजा अंतरण विश्लेषण'}
                  </p>
                </div>
              </div>

              {/* State-wise table */}
              <div className="overflow-x-auto">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>State / Union Territory</th>
                      <th>Total Projects</th>
                      <th>Acquired Extent (Ha)</th>
                      <th>Total Award Amount</th>
                      <th>Disbursed via PFMS</th>
                      <th>Disbursement %</th>
                      <th>Pending Sec 15 Objections</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-bold text-slate-900">Maharashtra</td>
                      <td>42</td>
                      <td className="font-mono">14,280.5 Ha</td>
                      <td className="font-mono">₹ 5,820 Cr</td>
                      <td className="font-mono text-[#138808] font-bold">₹ 5,240 Cr</td>
                      <td><span className="font-bold text-[#138808]">90.0%</span></td>
                      <td>18</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-900">Gujarat</td>
                      <td>28</td>
                      <td className="font-mono">9,840.0 Ha</td>
                      <td className="font-mono">₹ 3,450 Cr</td>
                      <td className="font-mono text-[#138808] font-bold">₹ 3,210 Cr</td>
                      <td><span className="font-bold text-[#138808]">93.0%</span></td>
                      <td>12</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-900">Karnataka</td>
                      <td>24</td>
                      <td className="font-mono">8,620.2 Ha</td>
                      <td className="font-mono">₹ 2,890 Cr</td>
                      <td className="font-mono text-[#138808] font-bold">₹ 2,640 Cr</td>
                      <td><span className="font-bold text-[#138808]">91.3%</span></td>
                      <td>15</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-900">Madhya Pradesh</td>
                      <td>20</td>
                      <td className="font-mono">6,410.0 Ha</td>
                      <td className="font-mono">₹ 1,780 Cr</td>
                      <td className="font-mono text-[#138808] font-bold">₹ 1,620 Cr</td>
                      <td><span className="font-bold text-[#138808]">91.0%</span></td>
                      <td>8</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-900">Uttar Pradesh</td>
                      <td>14</td>
                      <td className="font-mono">3,699.7 Ha</td>
                      <td className="font-mono">₹ 880 Cr</td>
                      <td className="font-mono text-[#138808] font-bold">₹ 780 Cr</td>
                      <td><span className="font-bold text-[#138808]">88.6%</span></td>
                      <td>11</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 9: ABOUT PORTAL */}
        {/* ============================================================ */}
        {activeTab === 'ABOUT' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-300 shadow-xs">
              <div className="tiranga-strip"></div>
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#002b49] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-white border border-slate-300 shadow-2xs">
                      <NationalEmblem size={38} color="#002b49" showSlogan={false} />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-[#002b49] font-serif">
                        {language === 'en' ? 'ABOUT BHUMISETU NATIONAL LAND ACQUISITION PORTAL' : 'भूमिसेतु राष्ट्रीय भूमि अधिग्रहण पोर्टल परिचय'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Department of Land Resources • Ministry of Rural Development • Government of India
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianFlag width={48} showBorder={true} />
                  </div>
                </div>

                <div className="space-y-3 text-slate-700 leading-relaxed text-xs">
                  <p>
                    <strong>BHUMISETU</strong> is an integrated National Land Acquisition Information System developed for the <strong>Department of Land Resources, Ministry of Rural Development, Government of India</strong> in collaboration with the <strong>National Informatics Centre (NIC)</strong>.
                  </p>
                  <p>
                    The platform is modelled on the proven architecture of <strong>Bhoomi Rashi</strong> (Ministry of Road Transport and Highways) and <strong>LACRRIS</strong> (Land Acquisition, Compensation, Rehabilitation and Resettlement Information System), unifying end-to-end statutory milestones under the <strong>Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement (RFCTLARR) Act, 2013</strong>.
                  </p>
                  <div className="bg-slate-50 border border-slate-300 p-3.5 space-y-2">
                    <h4 className="font-bold text-[#002b49]">Core Pillars of the Portal:</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      <li><strong>Statutory Milestones &amp; Stage Gates:</strong> Automated deadline tracking for Sections 4, 11, 15, 19, 23, and 38 with blocking validation issue enforcement.</li>
                      <li><strong>Integrated Cadastral GIS Engine (PostGIS):</strong> Live spatial polygon validation, overlap detection, geodesic area verification, and boundary dispute mitigation.</li>
                      <li><strong>Document Digitization &amp; 7/12 OCR:</strong> Machine-assisted optical extraction with human-in-the-loop audit controls for land records and sale deeds.</li>
                      <li><strong>Direct Benefit Transfer (PFMS DBT):</strong> Secure electronic disbursement of compensation directly to validated Aadhaar-linked beneficiary accounts.</li>
                      <li><strong>DPDP Act 2023 Compliance:</strong> Citizen privacy safeguards, masked PII, statutory retention limits, and data subject access requests.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 10: FAQS & CONTACT */}
        {/* ============================================================ */}
        {activeTab === 'CONTACT' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-300 p-4 space-y-4">
              <div className="border-b-2 border-[#f37021] pb-2">
                <h2 className="text-base font-bold text-[#0b3866]">
                  {language === 'en' ? 'FREQUENTLY ASKED QUESTIONS (FAQS) & CITIZEN GUIDELINES' : 'अक्सर पूछे जाने वाले प्रश्न एवं नागरिक मार्गदर्शिका'}
                </h2>
              </div>

              <div className="space-y-2">
                {[
                  {
                    q: 'How is land acquisition compensation computed under RFCTLARR Act 2013?',
                    a: 'Compensation is computed under the First Schedule: Base Market Value (based on registered sale deeds / ready reckoner) × Rural Multiplier factor (1.0 - 2.0) + Structure and Tree Valuation + 100% Solatium (Section 30) + 12% additional interest per annum from Section 4 date to the Award date.'
                  },
                  {
                    q: 'What is Solatium under Section 30 of the Act?',
                    a: 'Solatium is a mandatory statutory grant of 100% on the determined total market value of the land and assets attached thereto, provided as compensation for compulsory acquisition.'
                  },
                  {
                    q: 'What is the time limit for filing objections under Section 15?',
                    a: 'Any person interested in the land may submit objections in writing within 60 (sixty) days from the date of publication of the preliminary notification under Section 11.'
                  },
                  {
                    q: 'How are compensation payouts disbursed to Khatedars?',
                    a: 'Disbursements are credited directly into Aadhaar-validated bank accounts via the Public Financial Management System (PFMS) Direct Benefit Transfer (DBT) gateway to prevent intermediaries.'
                  },
                  {
                    q: 'How can a citizen exercise data rights under DPDP Act 2023?',
                    a: 'Citizens may request a summary of personal data held, update incorrect KYC/bank details, or log queries through the Privacy and DPDP tab or the National Helpdesk.'
                  }
                ].map((faq, idx) => (
                  <div key={idx} className="border border-slate-300">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 font-bold text-[#0b3866] text-xs flex justify-between items-center text-left"
                    >
                      <span>{faq.q}</span>
                      <span className="text-sm font-bold text-[#f37021]">{openFaq === idx ? '−' : '+'}</span>
                    </button>
                    {openFaq === idx && (
                      <div className="p-3 bg-white text-slate-700 text-xs border-t border-slate-200 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Official Contact Directory */}
              <div className="pt-3 border-t border-slate-200">
                <h3 className="font-bold text-[#0b3866] text-xs uppercase tracking-wide mb-2">
                  Official Helpdesk &amp; Technical Support
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200">
                    <strong>National Land Helpdesk:</strong>
                    <div className="text-slate-600 mt-1">Toll-Free: 1800-11-2013</div>
                    <div className="text-slate-500 text-[10px]">Mon-Sat: 09:30 AM to 06:00 PM</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200">
                    <strong>Email Support:</strong>
                    <div className="text-slate-600 mt-1">support-bhumisetu@gov.in</div>
                    <div className="text-slate-500 text-[10px]">NIC Service Desk SLA: 24 Hours</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200">
                    <strong>Department Office:</strong>
                    <div className="text-slate-600 mt-1">NITI Aayog / Krishi Bhawan</div>
                    <div className="text-slate-500 text-[10px]">New Delhi - 110001, India</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal for Selected Case Record */}
      {selectedCaseForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60" role="dialog">
          <div className="bg-white border-2 border-[#0b3866] max-w-3xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#0b3866] text-white p-3 flex justify-between items-center border-b-2 border-[#f37021]">
              <div>
                <span className="font-mono font-bold text-xs">{selectedCaseForModal.caseReference}</span>
                <h3 className="font-bold text-sm">{selectedCaseForModal.projectName}</h3>
              </div>
              <button
                onClick={() => setSelectedCaseDetailId(null)}
                className="px-2 py-0.5 bg-slate-800 text-white font-bold text-xs hover:bg-slate-700"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-slate-50 border border-slate-200 text-[11px]">
                <div><strong>State:</strong> {selectedCaseForModal.state}</div>
                <div><strong>District:</strong> {selectedCaseForModal.district}</div>
                <div><strong>Tehsil:</strong> {selectedCaseForModal.tehsil}</div>
                <div><strong>Village:</strong> {selectedCaseForModal.village}</div>
              </div>

              <div>
                <h4 className="font-bold text-[#0b3866] border-b border-slate-200 pb-1 mb-2">
                  Statutory Stage &amp; Progression:
                </h4>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-[#0b3866] text-white font-bold text-xs">
                    Current: {selectedCaseForModal.stage.replace('STAGE_', '').replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-600 text-xs">
                    Deadline: <strong>{formatDate(selectedCaseForModal.stageDeadline)}</strong> ({selectedCaseForModal.daysRemaining} days left)
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#0b3866] border-b border-slate-200 pb-1 mb-2">
                  Land Parcels in Cadastral Schedule:
                </h4>
                <table className="gov-table text-[11px]">
                  <thead>
                    <tr>
                      <th>Survey / Gat No</th>
                      <th>Classification</th>
                      <th>Extent (Ha)</th>
                      <th>Owners Recorded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCaseForModal.parcels.map(p => (
                      <tr key={p.id}>
                        <td className="font-mono font-bold text-[#0b3866]">{p.surveyNumber}</td>
                        <td>{p.classification}</td>
                        <td className="font-mono">{p.extent} {p.extentUnit}</td>
                        <td>
                          {selectedCaseForModal.ownershipRecords
                            .filter(o => o.parcelId === p.id)
                            .map(o => o.ownerName)
                            .join(', ') || 'Vithal Shankar Patil (Sole Owner)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-bold text-[#0b3866] border-b border-slate-200 pb-1 mb-2">
                  Compensation Award &amp; Payout Status:
                </h4>
                <div className="p-3 bg-emerald-50 border border-emerald-300 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-600 block">Total Determined Award:</span>
                    <strong className="font-mono text-sm text-slate-900">
                      {formatCurrencyINR(selectedCaseForModal.totalAwardedAmount)}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-600 block">PFMS DBT Disbursed:</span>
                    <strong className="font-mono text-sm text-[#138808]">
                      {formatCurrencyINR(selectedCaseForModal.totalDisbursedAmount)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between">
              <button
                onClick={() => {
                  setSelectedCaseForObjection(selectedCaseForModal.id);
                  setSelectedCaseDetailId(null);
                  setActiveTab('GRIEVANCE');
                }}
                className="px-3 py-1.5 bg-[#f37021] text-white font-bold text-xs"
              >
                File Section 15 Objection for this Case
              </button>
              <button
                onClick={() => setSelectedCaseDetailId(null)}
                className="px-4 py-1.5 bg-slate-800 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
