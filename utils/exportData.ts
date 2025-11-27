
import { AppSettings, PromptTemplate } from '../types';

export const exportData = async (history: PromptTemplate[], settings: AppSettings): Promise<boolean> => {
  try {
    const dataStr = JSON.stringify({
      metadata: {
        appName: 'PromptMaster',
        version: '1.0.4',
        exportDate: new Date().toISOString(),
        recordCount: history.length,
        userAgent: navigator.userAgent
      },
      settings,
      history
    }, null, 2);

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompt-master-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error("Export failed:", error);
    return false;
  }
};
