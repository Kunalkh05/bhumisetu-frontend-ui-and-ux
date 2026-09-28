import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Map, 
  AlertOctagon, 
  FileCheck, 
  ShieldAlert, 
  Activity, 
  UploadCloud, 
  Lock, 
  History
} from 'lucide-react';
import { OfficerTab } from '../../types';

interface OfficerNavigationProps {
  activeTab?: OfficerTab;
  setActiveTab?: (tab: OfficerTab) => void;
}

export const OfficerNavigation: React.FC<OfficerNavigationProps> = ({ 
  activeTab: propActiveTab, 
  setActiveTab: propSetActiveTab 
}) => {
  const { language, cases, officerTab, setOfficerTab } = useApp();
  const activeTab = propActiveTab ?? officerTab;
  const setActiveTab = propSetActiveTab ?? setOfficerTab;

  // Count open blocking issues across jurisdiction
  const totalBlockingIssues拼 = cases.reduce((sum, c) => 
    sum + c.validationIssues.filter(v => v.severity === 'BLOCKING' && v.resolutionState === 'OPEN').length, 0
  );

  const totalCriticalCases = cases.filter(c => c.riskBand === 'CRITICAL').length;
  const totalPendingOcr = cases.reduce((sum, c) => 
    sum + c.documents.reduce((dSum, doc) => 
      dSum + doc.extractedFields.filter(f => f.reviewState === 'PENDING_REVIEW').length, 0
    ), 0
  );

  const navItems = [
    {
      id: 'DASHBOARD' as OfficerTab,
      label: 'Officer Dashboard',
      labelHi: 'डैशबोर्ड',
      icon: LayoutDashboard,
    },
    {
      id: 'CASE_WORKSPACE' as OfficerTab,
      label: 'Case Workspace (360°)',
      labelHi: 'मामला कार्यस्थान',
      icon: FolderKanban,
    },
    {
      id: 'GIS_MAP' as OfficerTab,
      label: 'PostGIS Map Viewer',
      labelHi: 'जीआईएस भू-नक्शा',
      icon: Map,
    },
    {
      id: 'INTERVENTION_QUEUE' as OfficerTab,
      label: 'Intervention Queue',
      labelHi: 'हस्तक्षेप कतार',
      icon: AlertOctagon,
      badge: totalCriticalCases > 0 ? `${totalCriticalCases} At Risk` : undefined,
      badgeColor: 'bg-red-700 text-white',
    },
    {
      id: 'OCR_REVIEW' as OfficerTab,
      label: '7/12 & Sale Deed OCR',
      labelHi: 'ओसीआर सत्यापन',
      icon: FileCheck,
      badge: totalPendingOcr > 0 ? `${totalPendingOcr}` : undefined,
      badgeColor: 'bg-amber-600 text-white',
    },
    {
      id: 'VALIDATION_QUEUE' as OfficerTab,
      label: 'Statutory Rules Engine',
      labelHi: 'सत्यापन इंजन',
      icon: ShieldAlert,
      badge: totalBlockingIssues拼 > 0 ? `${totalBlockingIssues拼} Blocking` : undefined,
      badgeColor: 'bg-red-700 text-white',
    },
    {
      id: 'MODEL_OBSERVABILITY' as OfficerTab,
      label: 'AI Drift & Observability',
      labelHi: 'एआई मॉडल आंकड़े',
      icon: Activity,
    },
    {
      id: 'BULK_IMPORT' as OfficerTab,
      label: 'Bulk Data Migration',
      labelHi: 'थोक डेटा आयात',
      icon: UploadCloud,
    },
    {
      id: 'DPDP_RETENTION' as OfficerTab,
      label: 'DPDP Act & DSR Hub',
      labelHi: 'डीपीडीपी गोपनीयता',
      icon: Lock,
    },
    {
      id: 'AUDIT_LOG' as OfficerTab,
      label: 'Immutable Audit Log',
      labelHi: 'अपरिवर्तनीय ऑडिट लॉग',
      icon: History,
    },
  ];

  return (
    <nav className="bg-[#e8f1f8] border-b border-slate-300" aria-label="Officer portal sections">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 overflow-x-auto scrollbar-none">
        <div className="flex items-center justify-between py-1 border-b border-slate-300 text-[11px] text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0b3866]">OFFICIAL WORKSPACE:</span>
            <span>Land Acquisition Officer / Competent Authority (CALA) Modules</span>
          </div>
          <div className="text-[10px] text-slate-500 hidden md:block">
            RFCTLARR Act 2013 Statutory Workflows &bull; Security Level: Confidential
          </div>
        </div>

        <ul className="flex items-center gap-1 py-1.5 min-w-max" role="tablist">
          {navItems.map((item) => {
            const Icon自由 = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id} role="presentation">
                <button
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-bold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0b3866] text-white border-[#0b3866]'
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                  }`}
                >
                  <Icon自由 className={`w-3.5 h-3.5 ${isActive ? 'text-[#f37021]' : 'text-[#0b3866]'}`} />
                  <span>{language === 'en' ? item.label : item.labelHi}</span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.2 text-[9px] font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
