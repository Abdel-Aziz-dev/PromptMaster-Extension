
export enum Tone {
  PROFESSIONAL = 'Professional',
  FRIENDLY = 'Friendly',
  ACADEMIC = 'Academic',
  CREATIVE = 'Creative',
  DIRECT = 'Direct',
}

export enum OutputFormat {
  TEXT = 'Plain Text',
  MARKDOWN = 'Markdown',
  JSON = 'JSON',
  CODE = 'Code Block',
  STEP_BY_STEP = 'Step-by-Step Guide',
}

export enum RefineAction {
  OPTIMIZE = 'Optimize for Clarity',
  SHORTEN = 'Shorten',
  EXPAND = 'Expand / Add Detail',
  FIX_GRAMMAR = 'Fix Grammar',
  TO_JSON = 'Convert to JSON Structure'
}

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  category: 'generated' | 'refined' | 'saved';
  timestamp: number;
}

export interface GeneratorParams {
  task: string;
  context: string;
  tone: Tone;
  format: OutputFormat;
  model: string;
}

export interface AppSettings {
  privacyMode: boolean; // If true, simulates blocking cloud sync
  saveHistoryToLocal: boolean; // If false, history is session-only
  theme: 'light' | 'dark';
  mascotUrl?: string; // Base64 string of the custom generated mascot
}