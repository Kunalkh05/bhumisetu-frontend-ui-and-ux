import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { GovHeader } from './components/common/GovHeader';
import { GovNavigation, PublicTab } from './components/common/GovNavigation';
import { GovFooter } from './components/common/GovFooter';
import { ToastContainer } from './components/common/ToastContainer';
import { PublicPortal } from './components/public/PublicPortal';
import { OfficerNavigation } from './components/officer/OfficerNavigation';
import { OfficerDashboard } from './components/officer/OfficerDashboard';
import { CaseWorkspace } from './components/officer/CaseWorkspace';
import { GisMapViewer } from './components/officer/GisMapViewer';
import { DocumentOcrReviewer } from './components/officer/DocumentOcrReviewer';
import { InterventionQueue } from './components/officer/InterventionQueue';
import { ValidationHub } from './components/officer/ValidationHub';
import { ModelObservabilityHub } from './components/officer/ModelObservabilityHub';
import { BulkImportHub } from './components/officer/BulkImportHub';
import { DpdpRetentionHub } from './components/officer/DpdpRetentionHub';
import { AuditLogViewer } from './components/officer/AuditLogViewer';
import { DEMO_USERS } from './data/mockData';

const MainContent: React.FC<{ 
  publicTab: PublicTab; 
  setPublicTab: (tab: PublicTab) => void;
  onOpenDemoLogin: () => void;
}> = ({ publicTab, setPublicTab, onOpenDemoLogin }) => {
  const { portalMode, setPortalMode, officerTab, setOfficerTab, setSelectedCaseId } = useApp();

  return (
    <main className="flex-1">
      {portalMode === 'CITIZEN' ? (
        <PublicPortal 
          activeTab={publicTab} 
          setActiveTab={setPublicTab}
          onNavigateToOfficerCase={(caseId) => {
            setSelectedCaseId(caseId);
            setPortalMode('OFFICER');
            setOfficerTab('CASE_WORKSPACE');
          }}
        />
      ) : (
        <div className="space-y-0">
          <OfficerNavigation />
          
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
            {officerTab === 'DASHBOARD' && (
              <OfficerDashboard 
                onNavigateToCase={(caseId) => {
                  setSelectedCaseId(caseId);
                  setOfficerTab('CASE_WORKSPACE');
                }} 
              />
            )}

            {officerTab === 'CASE_WORKSPACE' && (
              <CaseWorkspace 
                onNavigateToOcr={() => setOfficerTab('OCR_REVIEW')} 
              />
            )}

            {officerTab === 'GIS_MAP' && (
              <div className="bg-white border border-slate-300 p-4">
                <div className="border-b-2 border-[#0b3866] pb-2 mb-3 flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-bold text-[#0b3866]">
                      POSTGIS SPATIAL PARCEL VIEWER &amp; CADASTRAL GIS ENGINE
                    </h2>
                    <p className="text-slate-500 text-xs">
                      Live ST_Area, ST_Perimeter, geodesic boundary validation and spatial overlap detection
                    </p>
                  </div>
                </div>
                <GisMapViewer 
                  onSelectCase={(caseId) => {
                    setSelectedCaseId(caseId);
                    setOfficerTab('CASE_WORKSPACE');
                  }} 
                />
              </div>
            )}

            {officerTab === 'OCR_REVIEW' && (
              <DocumentOcrReviewer />
            )}

            {officerTab === 'INTERVENTION_QUEUE' && (
              <InterventionQueue 
                onNavigateToCase={(caseId) => {
                  setSelectedCaseId(caseId);
                  setOfficerTab('CASE_WORKSPACE');
                }} 
              />
            )}

            {officerTab === 'VALIDATION_QUEUE' && (
              <ValidationHub />
            )}

            {officerTab === 'MODEL_OBSERVABILITY' && (
              <ModelObservabilityHub />
            )}

            {officerTab === 'BULK_IMPORT' && (
              <BulkImportHub />
            )}

            {officerTab === 'DPDP_RETENTION' && (
              <DpdpRetentionHub />
            )}

            {officerTab === 'AUDIT_LOG' && (
              <AuditLogViewer />
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default function App() {
  const [publicTab, setPublicTab] = useState<PublicTab>('HOME');
  const [demoLoginOpen, setDemoLoginOpen] = useState(false);

  return (
    <AppProvider>
      <AppShell 
        publicTab={publicTab} 
        setPublicTab={setPublicTab} 
        demoLoginOpen={demoLoginOpen}
        setDemoLoginOpen={setDemoLoginOpen}
      />
    </AppProvider>
  );
}

const AppShell: React.FC<{
  publicTab: PublicTab;
  setPublicTab: (tab: PublicTab) => void;
  demoLoginOpen: boolean;
  setDemoLoginOpen: (open: boolean) => void;
}> = ({ publicTab, setPublicTab, demoLoginOpen, setDemoLoginOpen }) => {
  const { isHighContrast, fontScale, currentUser, setCurrentUser, setPortalMode, addToast } = useApp();

  const handleSelectUser = (user: typeof DEMO_USERS[0]) => {
    setCurrentUser(user);
    if (user.isCitizen) {
      setPortalMode('CITIZEN');
    } else {
      setPortalMode('OFFICER');
    }
    setDemoLoginOpen(false);
    addToast({
      type: 'info',
      message: `Signed in as: ${user.name} (${user.designation})`,
      messageHi: `लॉगिन सफल: ${user.nameHi}`,
    });
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#f4f6f9] text-[#1e293b] ${
      isHighContrast ? 'high-contrast' : ''
    } ${
      fontScale === 'large' ? 'font-large' : fontScale === 'xlarge' ? 'font-xlarge' : 'font-normal'
    }`}>
      <GovHeader 
        onOpenDemoLogin={() => setDemoLoginOpen(true)}
        publicTab={publicTab}
        setPublicTab={setPublicTab}
      />
      <GovNavigation 
        activeTab={publicTab}
        setActiveTab={setPublicTab}
      />
      <MainContent 
        publicTab={publicTab}
        setPublicTab={setPublicTab}
        onOpenDemoLogin={() => setDemoLoginOpen(true)}
      />
      <GovFooter />
      <ToastContainer />

      {/* Official Government Demo Credentials Modal */}
      {demoLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70" role="dialog">
          <div className="bg-white border-2 border-[#0b3866] max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="bg-[#0b3866] text-white p-3 flex justify-between items-center border-b-2 border-[#f37021]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">BHUMISETU - OFFICIAL DEMO LOGIN &amp; RBAC CREDENTIALS</span>
              </div>
              <button
                onClick={() => setDemoLoginOpen(false)}
                className="px-2 py-0.5 bg-slate-800 text-white font-bold text-xs hover:bg-slate-700"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-slate-600">
                Select an official role below to simulate the respective administrative or citizen persona with tailored statutory access permissions.
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {DEMO_USERS.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 border flex justify-between items-center ${
                      currentUser.id === user.id ? 'border-[#0b3866] bg-amber-50' : 'border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-[#0b3866]">
                        {user.name} <span className="text-xs font-normal text-slate-600">({user.nameHi})</span>
                      </div>
                      <div className="font-semibold text-slate-700 text-[11px]">
                        {user.designation} • <span className="text-[#f37021] font-bold">{user.role}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Jurisdiction: {user.jurisdiction.join(', ')}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectUser(user)}
                      className="px-3 py-1.5 bg-[#0b3866] hover:bg-[#002b49] text-white font-bold text-xs"
                    >
                      {currentUser.id === user.id ? 'Current User' : 'Login as Role'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setDemoLoginOpen(false)}
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
