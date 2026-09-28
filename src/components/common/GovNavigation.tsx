import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Search, 
  FolderKanban, 
  FileText, 
  Map, 
  BookOpen, 
  AlertCircle, 
  BarChart2, 
  Info, 
  PhoneCall,
  ShieldCheck
} from 'lucide-react';

export type PublicTab = 
  | 'HOME'
  | 'SEARCH'
  | 'PROJECTS'
  | 'NOTICES'
  | 'GIS_MAP'
  | 'ACTS_RULES'
  | 'GRIEVANCE'
  | 'STATISTICS'
  | 'ABOUT'
  | 'CONTACT';

interface GovNavigationProps {
  activeTab: PublicTab;
  setActiveTab: (tab: PublicTab) => void;
}

export const GovNavigation: React.FC<GovNavigationProps> = ({ activeTab, setActiveTab }) => {
  const { language, portalMode, setPortalMode } = useApp();

  const navItems = [
    { id: 'HOME' as PublicTab, label: 'Home', labelHi: 'मुख्य पृष्ठ', icon: Home },
    { id: 'SEARCH' as PublicTab, label: 'Search Records', labelHi: 'अभिलेख खोजें', icon: Search },
    { id: 'PROJECTS' as PublicTab, label: 'Projects', labelHi: 'परियोजनाएं', icon: FolderKanban },
    { id: 'NOTICES' as PublicTab, label: 'Gazette Notifications', labelHi: 'राजपत्र अधिसूचनाएं', icon: FileText },
    { id: 'GIS_MAP' as PublicTab, label: 'Cadastral GIS Map', labelHi: 'भू-नक्शा / GIS', icon: Map },
    { id: 'ACTS_RULES' as PublicTab, label: 'Acts & Rules', labelHi: 'अधिनियम व नियम', icon: BookOpen },
    { id: 'GRIEVANCE' as PublicTab, label: 'Public Grievance / Sec 15', labelHi: 'जन शिकायत / आपत्ति', icon: AlertCircle },
    { id: 'STATISTICS' as PublicTab, label: 'Statistics & Reports', labelHi: 'सांख्यिकी व रिपोर्ट', icon: BarChart2 },
    { id: 'ABOUT' as PublicTab, label: 'About Portal', labelHi: 'पोर्टल परिचय', icon: Info },
    { id: 'CONTACT' as PublicTab, label: 'FAQs & Contact', labelHi: 'संपर्क व प्रश्नोत्तरी', icon: PhoneCall },
  ];

  return (
    <nav className="bg-[#002b49] text-white sticky top-0 z-40 shadow-md border-t border-[#0b3866]" aria-label="Main Navigation">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-none">
          <ul className="flex items-center text-xs font-semibold whitespace-nowrap min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = portalMode === 'CITIZEN' && activeTab === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setPortalMode('CITIZEN');
                      setActiveTab(item.id);
                    }}
                    className={`px-3 py-2.5 flex items-center gap-1.5 transition-colors border-r border-[#0b3866] ${
                      isActive
                        ? 'bg-[#FF9933] text-black font-black border-b-2 border-b-[#b34700] shadow-inner'
                        : 'hover:bg-[#0b3866] text-slate-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-black' : 'text-slate-300'}`} />
                    <span>{language === 'en' ? item.label : item.labelHi}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Direct Officer Portal Tab on the Right */}
          <button
            onClick={() => setPortalMode('OFFICER')}
            className={`px-3.5 py-2.5 text-xs font-black flex items-center gap-1.5 whitespace-nowrap ml-2 border-l border-[#0b3866] ${
              portalMode === 'OFFICER'
                ? 'bg-[#138808] text-white shadow-inner'
                : 'bg-[#003d66] hover:bg-[#138808] text-white'
            }`}
            title="Access Officer Workspace (District Collector, LAO, Survey Officer)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-yellow-300" />
            <span>{language === 'en' ? 'Officer Portal' : 'विभागीय लॉगिन'}</span>
          </button>
        </div>
      </div>

      {/* Tricolour Ribbon at Bottom of Navigation */}
      <div className="tiranga-strip"></div>
    </nav>
  );
};
