import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  User, 
  Globe, 
  Eye, 
  ChevronDown,
  Phone,
  FileText,
  Lock,
  Search,
  ExternalLink,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { DEMO_USERS } from '../../data/mockData';
import { TricolourLogo } from './TricolourLogo';
import { IndianFlag } from './IndianFlag';

interface GovHeaderProps {
  onOpenDemoLogin?: () => void;
  publicTab?: string;
  setPublicTab?: (tab: string) => void;
}

export const GovHeader: React.FC<GovHeaderProps> = ({ 
  onOpenDemoLogin,
  publicTab,
  setPublicTab
}) => {
  const { 
    currentUser, 
    setCurrentUser,
    portalMode, 
    setPortalMode, 
    language, 
    setLanguage, 
    isHighContrast, 
    setIsHighContrast, 
    fontScale, 
    setFontScale,
    addToast
  } = useApp();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSwitchUser = (user: typeof DEMO_USERS[0]) => {
    setCurrentUser(user);
    if (user.isCitizen) {
      setPortalMode('CITIZEN');
    } else {
      setPortalMode('OFFICER');
    }
    setUserDropdownOpen(false);
    addToast({
      type: 'info',
      message: `Switched demo user: ${user.name} (${user.designation})`,
      messageHi: `उपयोगकर्ता परिवर्तित: ${user.nameHi}`,
    });
  };

  return (
    <header className="w-full bg-white select-none border-b border-slate-300 shadow-xs" role="banner">
      {/* 0. Authentic Top Indian Tricolour Stripe Ribbon */}
      <div className="tiranga-strip"></div>

      {/* 1. Top Government Utility Strip (GIGW & Accessibility Compliant) */}
      <div className="bg-[#002b49] text-white text-[11px] border-b border-[#0b3866]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1 flex flex-wrap justify-between items-center gap-2">
          {/* Left: Official Indian Gov Text */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-100 flex items-center gap-2 font-serif">
              <IndianFlag width={18} showBorder={true} />
              {language === 'en' ? 'GOVERNMENT OF INDIA • भारत सरकार' : 'भारत सरकार • GOVERNMENT OF INDIA'}
            </span>
            <span className="text-slate-400">|</span>
            <span className="hidden md:inline text-slate-300">
              {language === 'en' ? 'Ministry of Rural Development • Department of Land Resources' : 'ग्रामीण विकास मंत्रालय • भूमि संसाधन विभाग'}
            </span>
          </div>

          {/* Right: Accessibility Tools, Language, Helpline & Links */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <a 
              href="#main-content" 
              className="text-slate-300 hover:text-white underline underline-offset-2 hidden sm:inline"
            >
              {language === 'en' ? 'Skip to main content' : 'मुख्य सामग्री पर जाएं'}
            </a>

            <span className="text-slate-500 hidden sm:inline">|</span>

            {/* Font Sizing Controls */}
            <div className="flex items-center bg-[#0b3866] border border-slate-600 rounded-none px-1 py-0.5" role="group" aria-label="Text Size">
              <button
                onClick={() => setFontScale('normal')}
                className={`px-1.5 py-0 text-[10px] font-bold ${fontScale === 'normal' ? 'bg-[#FF9933] text-black font-black' : 'text-slate-300 hover:text-white'}`}
                title="Standard Text Size"
              >
                A-
              </button>
              <button
                onClick={() => setFontScale('large')}
                className={`px-1.5 py-0 text-[10px] font-bold ${fontScale === 'large' ? 'bg-[#FF9933] text-black font-black' : 'text-slate-300 hover:text-white'}`}
                title="Large Text Size"
              >
                A
              </button>
              <button
                onClick={() => setFontScale('xlarge')}
                className={`px-1.5 py-0 text-[10px] font-bold ${fontScale === 'xlarge' ? 'bg-[#FF9933] text-black font-black' : 'text-slate-300 hover:text-white'}`}
                title="Extra Large Text Size"
              >
                A+
              </button>
            </div>

            {/* High Contrast Toggle */}
            <button
              onClick={() => setIsHighContrast(!isHighContrast)}
              className={`px-1.5 py-0.5 border text-[10px] font-bold flex items-center gap-1 ${
                isHighContrast 
                  ? 'bg-yellow-400 text-black border-yellow-400' 
                  : 'bg-[#0b3866] border-slate-600 text-slate-200 hover:text-white'
              }`}
              title="Toggle High Contrast"
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">{language === 'en' ? 'Contrast' : 'कंट्रास्ट'}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="px-2 py-0.5 bg-[#FF9933] text-black font-black text-[11px] border border-[#d95e14] hover:bg-[#f37021] hover:text-white flex items-center gap-1 shadow-xs"
              title="Switch Language"
            >
              <Globe className="w-3 h-3" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Toll Free Helpline */}
            <div className="hidden lg:flex items-center gap-1 text-slate-200 text-[10px] bg-[#001f35] px-2 py-0.5 border border-[#0b3866]">
              <Phone className="w-3 h-3 text-[#FF9933]" />
              <span>{language === 'en' ? 'Helpline:' : 'हेल्पलाइन:'} <strong>1800-11-2013</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Official Emblem & Title Header with Indian Tricolour Logo */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex flex-wrap justify-between items-center gap-4 bg-white">
        {/* Left: National Emblem with Tricolour Ribbons and Ministry Information */}
        <TricolourLogo size="md" language={language} showText={true} />

        {/* Right: National Initiatives Badges (Azadi Ka Amrit Mahotsav, Digital India, PM GatiShakti, NIC) & Persona Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* National Emblems & Badges representation */}
          <div className="hidden lg:flex items-center gap-2 border-r border-slate-300 pr-3">
            {/* Azadi Ka Amrit Mahotsav Badge */}
            <div className="text-center px-2 py-1 bg-amber-50 border border-amber-300 flex flex-col items-center shadow-2xs">
              <div className="text-[8px] font-black text-[#994d00] uppercase tracking-wider">75 Azadi Ka</div>
              <div className="text-[7px] text-slate-700 font-bold">Amrit Mahotsav</div>
            </div>

            {/* Digital India Badge */}
            <div className="text-center px-2 py-1 bg-white border border-slate-300 shadow-2xs">
              <div className="text-[9px] font-black text-[#002b49] uppercase tracking-wider">Digital India</div>
              <div className="text-[7px] text-slate-500 font-medium">Power To Empower</div>
            </div>

            {/* PM GatiShakti Badge */}
            <div className="text-center px-2 py-1 bg-white border border-slate-300 shadow-2xs">
              <div className="text-[9px] font-black text-[#138808] uppercase tracking-wider">PM GatiShakti</div>
              <div className="text-[7px] text-slate-500 font-medium">National Master Plan</div>
            </div>

            {/* NIC Official Seal */}
            <div className="text-center px-2 py-1 bg-[#002b49] text-white border border-[#001f35] shadow-2xs">
              <div className="text-[9px] font-black uppercase tracking-wider text-[#FF9933]">NIC</div>
              <div className="text-[7px] text-slate-300">Gov. of India</div>
            </div>
          </div>

          {/* Quick Role & Persona Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 gov-button-classic text-white text-xs font-semibold"
              aria-expanded={userDropdownOpen}
              aria-haspopup="true"
            >
              <div className="w-5 h-5 bg-[#FF9933] text-black font-bold flex items-center justify-center text-[10px] border border-white/40">
                {currentUser.isCitizen ? '👤' : '🛡️'}
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold leading-tight truncate max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-[9px] text-slate-300 font-normal">
                  {currentUser.role.replace('_', ' ')}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-200" />
            </button>

            {/* Role Dropdown */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-1 w-72 bg-white border-2 border-[#002b49] shadow-xl z-50 text-slate-800 text-xs">
                <div className="bg-[#002b49] text-white px-3 py-1.5 font-bold text-[11px] flex justify-between items-center border-b-2 border-[#FF9933]">
                  <span>{language === 'en' ? 'SWITCH DEMO LOGIN PERSONA' : 'डेमो उपयोगकर्ता चुनें'}</span>
                  <span className="text-[9px] bg-[#FF9933] text-black font-bold px-1 py-0.2">RBAC</span>
                </div>

                <div className="divide-y divide-slate-200 max-h-80 overflow-y-auto">
                  {DEMO_USERS.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSwitchUser(user)}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-amber-50/70 transition-colors ${
                        currentUser.id === user.id ? 'bg-amber-100 border-l-4 border-[#FF9933]' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {user.isCitizen ? '👤' : '🛡️'}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-[#002b49]">
                          {language === 'en' ? user.name : user.nameHi}
                        </div>
                        <div className="text-[10px] text-slate-600 font-medium">
                          {language === 'en' ? user.designation : user.designationHi}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {user.jurisdiction.join(', ')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {onOpenDemoLogin && (
                  <div className="p-2 bg-slate-50 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenDemoLogin();
                      }}
                      className="w-full py-1 text-center bg-[#002b49] hover:bg-[#0b3866] text-white font-bold text-[10px] border border-slate-700"
                    >
                      {language === 'en' ? 'Open All Demo Credentials Guide' : 'सभी डेमो विवरण निर्देशिका'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Direct Portal Mode Switcher (Public vs Department Officer) */}
          <div className="inline-flex border-2 border-[#002b49] bg-slate-100 p-0.5 shadow-2xs">
            <button
              onClick={() => setPortalMode('CITIZEN')}
              className={`px-2.5 py-1 text-xs font-bold transition-colors ${
                portalMode === 'CITIZEN'
                  ? 'bg-[#002b49] text-white shadow-xs'
                  : 'text-slate-700 hover:text-black hover:bg-slate-200'
              }`}
            >
              {language === 'en' ? 'Citizen Portal' : 'नागरिक सेवा'}
            </button>
            <button
              onClick={() => setPortalMode('OFFICER')}
              className={`px-2.5 py-1 text-xs font-bold transition-colors ${
                portalMode === 'OFFICER'
                  ? 'bg-[#138808] text-white shadow-xs'
                  : 'text-slate-700 hover:text-black hover:bg-slate-200'
              }`}
            >
              {language === 'en' ? 'Officer Portal' : 'अधिकारी पोर्टल'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
