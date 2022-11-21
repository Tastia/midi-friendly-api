export enum TemplateKey {
  examDone = 'vtest_exam_done',
  examAssigned = 'vtest_exam_assigned',
  examSecurityCompromised = 'vtest_exam_security_compromised',
  corporatePassword = 'vtest_corporate_password',
  corporateAccount = 'vtest_corporate_account',
  // corporateInvite = 'vtest_corporate_invite',
  corporateHelpDesk = 'vtest_corporate_helpdesk',
}

export enum TemplateType {
  exam = 'exam',
  corporate = 'corporate',
}

export enum TranslationType {
  template = 'template',
  layout = 'layout',
}

export interface QueueEmailPayload {
  assessmentId?: string | string[];
  templateKey?: TemplateKey;
  emailParams?: EmailParams;
  globalParams?: GlobalEmailParams;
}

export interface BulkEmailParams {
  params: EmailParams;
  globalParams: GlobalEmailParams;
  templateKey: string;
}

export interface GlobalEmailParams {
  testCenterId?: string;
  customerId?: string;
  cancelMode?: boolean;
}

export interface EmailParams {
  assessmentId?: string;
  testCenterId?: string;
  cancelMode?: boolean;
  platformName?: string;
  platformUrl?: string;
  firstName?: string;
  lastName?: string;
  email?: string | string[];
  password?: string;
  // Email invitation Token
  token?: string;
  issueId?: string;
  updateId?: string;
}

export interface EmailTemplateExam {
  email: string;
  candidate: { firstName: string; lastName: string };
  assessment: {
    secureCode: string;
    dueDateMode: boolean;
    expectedDueDate: string;
    suspicionReasons?: { reason: string }[];
    complaintDeadline?: string;
  };
  exam: {
    name: string;
    language: string;
    requireInterview: boolean;
    fourSkills: boolean;
    hasOnlineProctoring?: boolean;
    durationMin: number;
    durationMax: number;
    cancelMode: boolean;
    testEndDate: string;
    expectedDueDate: string;
    isOpenExam: boolean;
    contentSlot: string;
  };
  testCenter: {
    name: string;
    email: string;
    phoneNumber: string;
    address: string;
    zipCode: string;
    country: string;
  };
  customerId?: string;
  onsiteSession?: {
    convocationUrl: string;
    sessionDate: string;
    requireLaptop: boolean;
    roomName: string;
    examCenterName: string;
    address: string;
    convocationTime: string;
  };
  resources: {
    assetsUrl: string;
    logoLmap: string;
    testManual: string;
    candidateAppUrl: string;
    resultAppUrl: string;
    complaintFormUrl: string;
  };
  branding: {
    brandLogo: string;
    examLogo: string;
  };
}

export interface EmailTemplateCorporate extends EmailParams {
  managerUser: boolean;
  adminUser: boolean;
  onsiteSessionUser: boolean;
  resources: {
    assetsUrl: string;
  };
}

export interface HelpDeskEmailParams extends EmailParams {
  issue: {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    updatedAt: string;
    author: {
      firstName: string;
      lastName: string;
      email: string;
    };
    assignees: {
      firstName: string;
      lastName: string;
      email: string;
    }[];
    link: string;
    buttonText: string;
    priority: string;
    managerTags: any[];
    adminTags: any[];
  };
  client: {
    isPartner: boolean;
    isTestCenter: boolean;
    name: string;
    country: string;
  };
  target: {
    isSupport: boolean;
    isClient: boolean;
  };
  update: {
    isAssign: boolean;
    isClose: boolean;
    isUpdate: boolean;
    isCreate: boolean;
    assignees: {
      firstName: string;
      lastName: string;
      email: string;
    }[];
    message: string;
  };
  supervisor: {
    firstName: string;
    lastName: string;
  };
  resources: {
    assetsUrl: string;
  };
}
