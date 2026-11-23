export type ProjectCategory = 'single-page' | 'multi-page';

export type ProjectStatus = 'Запущен' | 'В развитии' | 'Концепт';

export interface ProjectCase {
  id: string;
  slug: string;
  title: string;
  category: ProjectCategory;
  categoryLabel: string;
  status: ProjectStatus;
  year: string;
  imageUrl: string;
  liveUrl: string;
  shortDescription: string;
  problemSolved: string;
  implementedSummary: string;
  technologies: string[];
  caseStudy: {
    taskDescription: string;
    clientProblem: string;
    proposedSolution: string;
    implementationStages: string[];
    keyFeatures: string[];
    desktopNotes: string;
    mobileNotes: string;
    result: string;
  };
}

export interface ServiceItem {
  id: string;
  number: string;
  formatId: SiteFormatId;
  title: string;
  description: string;
  solves: string;
  features: string[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface StudioProfile {
  brandName: string;
  founderName: string;
  founderRole: string;
  city: string;
  portraitUrl: string;
  aboutLead: string;
  aboutStory: string[];
  aboutValues: string[];
  pageRateKgs: number;
  contacts: {
    whatsappNumber: string;
    whatsappDisplay: string;
    telegramUrl: string;
    telegramDisplay: string;
    instagramUrl: string;
    instagramDisplay: string;
    email: string;
  };
}

export type SiteFormatId =
  | 'single-page'
  | 'multi-page'
  | 'catalog'
  | 'booking'
  | 'custom';

export type AutomationOptionId =
  | 'whatsapp-telegram'
  | 'crm-sync'
  | 'online-booking'
  | 'admin-cms';

export interface EstimateInput {
  formatId: SiteFormatId;
  pagesCount: number;
  automations: AutomationOptionId[];
  pageRateKgs?: number;
}

export interface ManagementRole {
  actor: string;
  responsibility: string;
  workflow: string;
}

export interface EstimateResult {
  formatId: SiteFormatId;
  formatTitle: string;
  pagesCount: number;
  pageRateKgs: number;
  pagesCostKgs: number;
  architectureBaseKgs: number;
  automationsCostKgs: number;
  totalKgs: number;
  timelineLabel: string;
  selectedAutomationLabels: string[];
  managementPlan: ManagementRole[];
}

export interface InquiryFormInput {
  name: string;
  company: string;
  businessSphere: string;
  contact: string;
  formatId: SiteFormatId;
  pagesCount: number;
  automations: AutomationOptionId[];
  budgetLabel: string;
  taskDescription: string;
}

export interface InquiryRecord extends InquiryFormInput {
  id: string;
  estimatedKgs: number;
  status: 'Новая' | 'В работе' | 'Завершена';
  createdAt: string;
}

export interface StudioDatabaseContent {
  studio: StudioProfile;
  projects: ProjectCase[];
  services: ServiceItem[];
  faq: FaqItem[];
}

export interface AiArchitectureAdvice {
  recommendedFormatId: SiteFormatId;
  recommendedPages: number;
  recommendedAutomations: AutomationOptionId[];
  architectureSummary: string;
  automationImpact: string;
  managementWorkflow: string;
  firstSteps: string[];
}
