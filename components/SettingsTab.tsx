
import React, { useState } from 'react';
import { AppSettings, PromptTemplate } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { exportData } from '../utils/exportData';
import ClearHistoryButton from './ClearHistoryButton';

// Declare chrome to avoid TypeScript errors when checking for extension context
declare const chrome: any;

interface SettingsTabProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  history: PromptTemplate[];
  onDeleteAllData: () => void;
  totalHistoryItems?: number; // Optional prop if passed from parent, or derived from history
}

// =============================================================================
// 💰 DONATION CONFIGURATION
// =============================================================================
const PAYPAL_HOSTED_BUTTON_ID: string = "26AKGG3A4WBAW"; 
const PAYPAL_ME_USERNAME = ""; 
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/REPLACE_WITH_YOUR_LINK";
// =============================================================================

const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  history,
  onDeleteAllData,
}) => {
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const toggleSetting = (key: keyof AppSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const toggleTheme = () => {
    onUpdateSettings({
      ...settings,
      theme: settings.theme === 'light' ? 'dark' : 'light',
    });
  };

  const getPayPalUrl = () => {
    if (PAYPAL_HOSTED_BUTTON_ID && PAYPAL_HOSTED_BUTTON_ID !== "REPLACE_WITH_YOUR_BUTTON_ID") {
      return `https://www.paypal.com/donate/?hosted_button_id=${PAYPAL_HOSTED_BUTTON_ID}`;
    }
    if (PAYPAL_ME_USERNAME) {
      return `https://paypal.me/${PAYPAL_ME_USERNAME}`;
    }
    return 'https://www.paypal.com/donate/buttons';
  };

  const handleDonate = (url: string) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url, active: true });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleExport = async () => {
    if (history.length === 0) return;
    
    setIsExporting(true);
    // Artificial delay for clearer UX interaction
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const success = await exportData(history, settings);
    
    setIsExporting(false);
    if (success) {
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    }
  };

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-300">
      
      {/* Hero Support Section */}
      <section id="set-support" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-lg group">
         <div className="absolute inset-0 bg-white/5 opacity-50 [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
         <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
         </div>

         <div className="relative bg-white dark:bg-slate-900 rounded-xl p-5 h-full transition-colors duration-200">
            <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path></svg>
               </div>
               <div>
                 <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-none tracking-tight">{t('common.support')}</h3>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Help keep PromptMaster free & open-source.</p>
               </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 leading-relaxed opacity-90">
              {t('common.donateDesc')}
            </p>

            <div className="grid grid-cols-2 gap-3">
               <button 
                  onClick={() => handleDonate(getPayPalUrl())}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0070BA] hover:bg-[#005ea6] text-white rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 group/btn border border-transparent"
               >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="opacity-90 group-hover/btn:scale-110 transition-transform"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.946 5.05-4.336 6.794-9.116 6.794h-.303c-.626 0-1.164.44-1.282 1.05l-.805 4.935-.098.665a.641.641 0 0 1-.633.74l-.772.619z"/></svg>
                  <span className="font-bold text-xs tracking-wide">PayPal</span>
               </button>
               <button 
                  onClick={() => handleDonate(STRIPE_PAYMENT_LINK)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 group/btn border border-transparent"
               >
                  <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" className="opacity-90 group-hover/btn:scale-110 transition-transform"><path d="M27.2 16.6c0-6.1-4.9-9.9-12.8-9.9-5.4 0-10.2 1.9-12.8 3.9l2.4 4c2.1-1.6 5.5-3 8.3-3 2.8 0 4.2 1.2 4.2 3s-1.4 2.8-4.7 3.6c-5.5 1.3-8 3.5-8 7.3 0 4.2 3.8 6.5 8.9 6.5 4.3 0 8.3-1.5 10.7-3.4l-2.2-4.1c-1.8 1.3-4.5 2.5-7.1 2.5-2.6 0-3.8-1-3.8-2.6 0-2 2.1-2.9 5.8-3.8 5.7-1.4 8.5-3.3 8.5-7.7h2.8z"></path></svg>
                  <span className="font-bold text-xs tracking-wide">Stripe</span>
               </button>
            </div>
         </div>
      </section>

      {/* Preferences Group */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 flex items-center gap-3">
           <span className="w-6 h-px bg-gray-200 dark:bg-gray-700"></span>
           Preferences
           <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></span>
        </h4>

        {/* Setting Card */}
        <div id="set-theme" className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
           {/* Theme */}
           <SettingRow 
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>}
              label={t('common.appearance')}
              description={t('common.darkModeDesc')}
              control={
                 <ToggleSwitch checked={settings.theme === 'dark'} onChange={toggleTheme} />
              }
           />
           
           <div className="h-px bg-gray-100 dark:bg-slate-800 mx-14"></div>

           {/* Privacy Mode */}
           <div id="set-privacy">
              <SettingRow 
                 icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                 label={t('common.privacyMode')}
                 description={t('common.privacyModeDesc')}
                 control={
                    <ToggleSwitch checked={settings.privacyMode} onChange={() => toggleSetting('privacyMode')} activeColor="bg-green-500" />
                 }
              />
           </div>

           <div className="h-px bg-gray-100 dark:bg-slate-800 mx-14"></div>

           {/* Local History */}
           <SettingRow 
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>}
              label={t('common.localHistory')}
              description={t('common.localHistoryDesc')}
              control={
                 <ToggleSwitch checked={settings.saveHistoryToLocal} onChange={() => toggleSetting('saveHistoryToLocal')} />
              }
           />
        </div>
      </div>

      {/* Data Management Group */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 flex items-center gap-3">
           <span className="w-6 h-px bg-gray-200 dark:bg-gray-700"></span>
           {t('common.dataManagement')}
           <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></span>
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export */}
            <button
               onClick={handleExport}
               disabled={history.length === 0 || isExporting}
               className="relative flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-700 transition-all group disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
            >
               <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  {isExporting ? (
                     <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : exportSuccess ? (
                     <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  )}
               </div>
               <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {isExporting ? 'Exporting...' : exportSuccess ? 'Exported!' : t('common.exportData')}
               </span>
            </button>
            
            {/* Clear History Container - Wrapped to match height */}
            <div className="flex flex-col h-full">
               <ClearHistoryButton 
                  onClear={onDeleteAllData} 
                  itemCount={history.length}
                  disabled={history.length === 0}
               />
            </div>
        </div>
      </div>

      {/* Security Footer */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg text-gray-500 dark:text-gray-400 text-xs border border-gray-100 dark:border-slate-800">
         <svg className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
         </svg>
         <span className="leading-tight opacity-80">{t('common.securityText')}</span>
      </div>
    </div>
  );
};

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const SettingRow: React.FC<{ icon: React.ReactNode; label: string; description: string; control: React.ReactNode }> = ({ icon, label, description, control }) => (
   <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
      <div className="flex items-start gap-3.5">
         <div className="text-gray-400 dark:text-gray-500 mt-0.5 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">{icon}</div>
         <div>
            <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</h5>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{description}</p>
         </div>
      </div>
      <div className="shrink-0 ml-4">
         {control}
      </div>
   </div>
);

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; activeColor?: string }> = ({ checked, onChange, activeColor = 'bg-brand-600' }) => (
   <button 
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${checked ? activeColor : 'bg-gray-200 dark:bg-slate-700'}`}
      role="switch"
      aria-checked={checked}
   >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
   </button>
);

export default SettingsTab;
