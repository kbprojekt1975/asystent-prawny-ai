export enum LawArea {
  Criminal = 'Prawo Karne',
  Family = 'Prawo Rodzinne',
  Civil = 'Prawo Cywilne',
  Commercial = 'Prawo Gospodarcze'
}

export enum InteractionMode {
  Advice = 'Porada Prawna',
  Analysis = 'Analiza Sprawy',
  Document = 'Generowanie Pisma',
  LegalTraining = 'Szkolenie Prawne',
  SuggestRegulations = 'Zasugeruj Przepisy',
  FindRulings = 'Znajdź Podobne Wyroki',
  Court = 'Tryb Sądowy',
  Negotiation = 'Konwersacja ze stroną przeciwną',
  StrategicAnalysis = 'Strategiczne Prowadzenie Sprawy'
}

export enum CourtRole {
  MyAttorney = 'Mój Mecenas (Przygotowanie)',
  OpposingAttorney = 'Mecenas Strony Przeciwnej (Cross-Examination)',
  Judge = 'Sąd (Przesłuchanie)',
  Prosecutor = 'Prokurator'
}

export enum SubscriptionStatus {
  None = 'none',
  Pending = 'pending',
  Active = 'active',
  Expired = 'expired'
}

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  isPaid: boolean;
  selectedAt?: any;
  activatedAt?: any;
  expiresAt?: any;
  creditLimit: number;
  spentAmount: number;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  sources?: any[];
  documentIds?: string[];
}

export interface CaseDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: any;
  path: string;
  party?: 'mine' | 'opposing';
  userId?: string; // Added for Global Collection Group queries
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  type: 'fact' | 'deadline' | 'status';
  createdAt: any;
}
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: any;
}

export interface QuickAction {
  lawArea: LawArea;
  topic?: string;
}

export interface PersonalData {
  fullName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  pesel?: string;
  idNumber?: string;
}

export interface UserProfile {
  quickActions?: QuickAction[];
  totalCost?: number;
  subscription?: SubscriptionInfo;
  personalData?: PersonalData;
  isActive?: boolean;
  dataProcessingConsent?: boolean;
  consentDate?: any;
  manualLocalMode?: boolean;
}

export interface LegalAct {
  id: string;
  publisher: string;
  year: number;
  pos: number;
  title?: string;
  content: string;
  savedAt: any;
  lastAccessed: any;
  cited_articles?: string[];
}

export interface Reminder {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  completed: boolean;
  createdAt: any;
  type?: 'personal' | 'deadline';
  lawArea?: string;
  topic?: string;
}

export interface ExportedChat {
  version: string;
  lawArea: LawArea;
  topic: string;
  interactionMode: InteractionMode;
  messages: ChatMessage[];
  exportedAt: string;
}

export interface EvidenceSuggestion {
  label: string;
  description: string;
  status: 'missing' | 'collected';
}