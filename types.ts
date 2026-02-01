export enum LawArea {
  Criminal = 'Prawo Karne',
  Family = 'Prawo Rodzinne',
  Civil = 'Prawo Cywilne',
  Commercial = 'Prawo Gospodarcze',
  Labor = 'Prawo Pracy',
  RealEstate = 'Prawo Nieruchomości',
  Tax = 'Prawo Podatkowe',
  Administrative = 'Prawo Administracyjne',
  Universal = 'Asystent Prawny',
  Custom = 'Własny Agent'
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
  StrategicAnalysis = 'Strategiczne Prowadzenie Sprawy',
  AppHelp = 'Pomoc w obsłudze aplikacji'
}

export enum CourtRole {
  MyAttorney = 'Mój Mecenas (Przygotowanie)',
  OpposingAttorney = 'Mecenas Strony Przeciwnej (Cross-Examination)',
  Judge = 'Sąd (Przesłuchanie)',
  Prosecutor = 'Prokurator'
}

export enum SubscriptionStatus {
  None = 'none',
  Trialing = 'trialing',
  Active = 'active',
  PastDue = 'past_due',
  Canceled = 'canceled',
  Unpaid = 'unpaid',
  Incomplete = 'incomplete',
  IncompleteExpired = 'incomplete_expired',
  // Deprecated project-specific statuses
  Pending = 'pending',
  Expired = 'expired'
}

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  isPaid: boolean;
  selectedAt?: any;
  activatedAt?: any;
  expiresAt?: any;
  priceId?: string;
  creditLimit: number;
  spentAmount: number;
  tokenLimit: number;
  tokensUsed: number;
  packageType?: 'starter' | 'pro';
}

export interface CustomAgent {
  id: string;
  name: string;
  persona: string;
  instructions: string;
  focusAreas?: string[];
  createdAt: any;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  sources?: any[];
  documentIds?: string[];
  followUpOptions?: InteractionMode[];
  isAgentIntro?: boolean;
  agentId?: string;
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

export interface CaseNote {
  id: string;
  content: string;
  createdAt: any;
  linkedMessage?: string; // Content snippet or ID to link note to a specific  linkedMessage?: string;
  linkedRole?: 'user' | 'model' | 'system';
  position?: { x: number; y: number };
}

export interface GlobalNote {
  id: string;
  content: string;
  position: { x: number; y: number };
  viewId: string;
  updatedAt: any;
  authorEmail?: string;
  color?: string;
  isMinimized?: boolean;
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
  hasSeenWelcomeAssistant?: boolean;
  cookieConsent?: boolean;
  cookieConsentDate?: any;
  hasDismissedPwaInstall?: boolean;
}

export interface LegalAct {
  id: string;
  source?: 'ISAP' | 'SAOS';
  publisher?: string;
  year?: number;
  pos?: number;
  judgmentId?: number;
  caseNumber?: string;
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

export interface AndromedaChat {
  id: string;
  title: string;
  lastUpdated: any;
  messages: ChatMessage[];
}

/**
 * Generates a unified chat ID for Firestore storage.
 * Handles specialized mode isolation.
 */
export const getChatId = (lawArea: string, topic: string, mode?: InteractionMode | null, agentId?: string | null) => {
  const sanitize = (val: string) => val.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const sanitizedTopic = sanitize(topic);
  let id = `${lawArea}_${sanitizedTopic}`;

  if (agentId) {
    const slug = sanitize(agentId);
    id = `${lawArea}_${sanitizedTopic}_agent_${slug}`;
  } else if (mode &&
    mode !== InteractionMode.Advice &&
    mode !== InteractionMode.Analysis) {
    const slug = sanitize(mode);
    id = `${lawArea}_${sanitizedTopic}_${slug}`;
  }

  return id;
};