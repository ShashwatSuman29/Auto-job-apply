// Job application related types
export type JobStatus = 'Applied' | 'Interview Scheduled' | 'Offer Received' | 'Rejected' | 'Saved';

export interface JobApplication {
  _id?: string;
  companyName: string;
  jobTitle: string;
  applicationDate: Date | string;
  status: JobStatus;
  notes?: string;
  jobUrl?: string;
  location?: string;
  salary?: string;
  contactPerson?: string;
  contactEmail?: string;
  successPrediction?: number; // For AI prediction feature
}

// Credential storage types
export interface JobPortalCredential {
  _id?: string;
  portalName: string;
  username: string;
  password: string; // Will be encrypted in DB
  url?: string;
  notes?: string;
}

// User settings and preferences
export interface UserSettings {
  _id?: string;
  userId: string;
  darkMode: boolean;
  emailNotifications: boolean;
  autoApplyPreferences: {
    jobTitles: string[];
    locations: string[];
    salaryRange: {
      min: number;
      max: number;
    };
    excludeCompanies: string[];
    includeRemote: boolean;
  };
  resumeUrl?: string;
  coverLetterTemplates?: Record<string, string>;
}

// User profile
export interface UserProfile {
  _id?: string;
  userId?: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
  title?: string;
  skills?: string[];
  experience?: string[];
  education?: string[];
  resumeUrl?: string;
  resumeOriginalName?: string;
  resumeUpdatedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Navigation item
export interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}
