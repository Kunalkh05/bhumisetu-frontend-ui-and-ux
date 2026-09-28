import React from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Lock, ExternalLink, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';

export const GovFooter: React.FC = () => {
  const { language } = useApp();

  const visitorCount = "012849203";

  return (
    <footer className="w-full bg-[#001f35] text-slate-300 text-xs shadow-lg mt-10" role="contentinfo">
      {/* 0. Authentic Tricolour Stripe Ribbon */}
      <div className="tiranga-strip"></div>

      {/* 1. Government Policies & Links Strip */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 border-b border-[#0b3866]">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-slate-300">
            <li><a href="#" className="hover:text-[#FF9933] hover:underline">Website Policies</a></li>
            <li><a href="#" className="hover:text-[#FF9933] hover:underline">Hyperlink Policy</a></li>
            <li><a href="#" className="hover:text-[#FF9933] hover:underline">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-[#FF9933] hover:underline">Copyright Policy</a></li>
            <li><a href="#" className="hover:text-[#FF9933] hover:underline">Disclaimer</a></li>
            <li><a href="#" className="hover:text-[#FF9933] hover:underline">Terms &amp; Conditions</a></li>
            <li><a href="#" className="hover:text-[#FF9933] hover:underline">Feedback</a></li>
            <li><a href="#" className="hover:text-[#FF9933] hover:underline">Help &amp; Support</a></li>
            <li><a href="#" className="hover:text-[#FF9933] hover:underline">Site Map</a></li>
          </ul>

          {/* Retro Visitor Counter */}
          <div className="flex items-center gap-2 text-[11px] text-slate-300 bg-[#001424] px-2.5 py-1 border border-[#0b3866]">
            <span className="font-semibold">{language === 'en' ? 'Visitor No:' : 'कुल आगंतुक:'}</span>
            <div className="counter-box">
              {visitorCount.split('').map((digit, idx) => (
                <span key={idx} className="counter-digit">
                  {digit}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. NIC & Department Ownership Credits with Authentic Government Badges */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Left / Center Information */}
          <div className="md:col-span-8 space-y-1.5 text-[11px] text-slate-400 leading-relaxed">
            <p>
              {language === 'en'
                ? 'Website Content Managed & Owned by Department of Land Resources, Ministry of Rural Development, Government of India.'
                : 'सामग्री प्रबंधन एवं स्वामित्व: भूमि संसाधन विभाग, ग्रामीण विकास मंत्रालय, भारत सरकार।'}
            </p>
            <p>
              {language === 'en'
                ? 'Designed, Developed, Tested and Hosted by National Informatics Centre (NIC), Ministry of Electronics & Information Technology, Government of India.'
                : 'डिजाइन, विकास, परीक्षण एवं होस्टिंग: राष्ट्रीय सूचना विज्ञान केंद्र (एन.आई.सी.), इलेक्ट्रॉनिकी और सूचना प्रौद्योगिकी मंत्रालय, भारत सरकार।'}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
              <span>Last Updated: <strong>31 August 2026</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>GIGW &amp; WCAG 2.1 (Level AA) Certified</span>
              </span>
              <span>•</span>
              <span>Security Audited by CERT-In Empanelled Agency</span>
            </div>
          </div>

          {/* Right Logo Badges (india.gov.in, NIC, Digital India) */}
          <div className="md:col-span-4 flex justify-start md:justify-end items-center gap-2.5 flex-wrap">
            {/* National Portal of India Badge */}
            <div className="p-1 bg-white text-[#002b49] text-center border border-slate-400 shadow-xs">
              <div className="font-black text-[9px] uppercase tracking-wider text-[#FF9933]">india.gov.in</div>
              <div className="text-[6px] text-slate-700 font-bold">The National Portal of India</div>
            </div>

            {/* NIC Logo Box */}
            <div className="p-1.5 bg-[#002b49] text-white text-center border border-slate-600 shadow-xs">
              <div className="font-black text-xs uppercase tracking-wider text-[#FF9933]">NIC</div>
              <div className="text-[7px] text-slate-300">National Informatics Centre</div>
            </div>

            {/* Digital India Box */}
            <div className="p-1.5 bg-[#002b49] text-white text-center border border-slate-600 shadow-xs">
              <div className="font-black text-xs uppercase tracking-wider text-[#138808]">Digital India</div>
              <div className="text-[7px] text-slate-300">Power To Empower</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
