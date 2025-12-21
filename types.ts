export enum LawArea {
  Criminal = 'Prawo Karne',
  Family = 'Prawo Rodzinne',
  Civil = 'Prawo Cywilne',
  Commercial = 'Prawo Gospodarcze'
}

export enum InteractionMode {
  Advice = 'Porada Prawna',
  Document = 'Generowanie Pisma',
  LegalTraining = 'Szkolenie Prawne',
  SuggestRegulations = 'Zasugeruj Przepisy',
  FindRulings = 'Znajdź Podobne Wyroki',
  Court = 'Tryb Sądowy'
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
}