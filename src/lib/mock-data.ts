export interface Tender {
  id: string;
  projectName: string;
  department: string;
  estimatedBudget: number;
  status: "Active" | "Under Evaluation" | "Pending Approval" | "Approved" | "Closed" | "Draft" | "Cancelled" | "CANCELLED" | "DRAFT" | "CLOSED" | "ACTIVE" | "UNDER_EVALUATION" | "PENDING_APPROVAL";
  publishedDate: string;
  closingDate: string;
  platform?: string;
  description?: string; // Stores JSONified tender data
}

export interface VendorBid {
  vendorName: string;
  technicalScore: number;
  financialBid: number;
  rank: string;
  technicalCompliance: number;
  financialEvaluation: number;
  pastPerformanceRisk: "LOW" | "MEDIUM" | "HIGH";
  isL1?: boolean;
  status?: "DRAFT" | "SUBMITTED" | "VALIDATED" | "EVALUATED";
  submissionDurationMs?: number;
}

export interface RiskAlert {
  type: "LOW_BID" | "COLLUSION" | "SINGLE_BID" | "COMPLIANCE";
  level: "HIGH" | "MEDIUM" | "LOW";
  message: string;
  explanation: string;
}

export const summaryData = {
  activeTenders: 12,
  underEvaluation: 5,
  pendingApprovals: 3,
  alerts: 4,
};

export const tenders: Tender[] = [
  {
    id: "TDR-2025-001",
    projectName: "Highway Construction NH-16 Extension",
    department: "Roads & Buildings",
    estimatedBudget: 245000000,
    status: "Under Evaluation",
    publishedDate: "2024-01-15",
    closingDate: "2024-02-28",
    platform: "gem"
  },
  {
    id: "TDR-2024-002",
    projectName: "Medical Equipment for Area Hospital",
    department: "Health Department",
    estimatedBudget: 7500000,
    status: "Active",
    publishedDate: "2024-01-20",
    closingDate: "2024-03-05",
    platform: "gem_product"
  },
  {
    id: "TDR-2024-003",
    projectName: "IT Infrastructure Upgrade - GVMC",
    department: "IT & Electronics",
    estimatedBudget: 12000000,
    status: "Under Evaluation",
    publishedDate: "2024-01-10",
    closingDate: "2024-02-15",
    platform: "gvmc"
  },
  {
    id: "TDR-2024-004",
    projectName: "Cleaning Services for Railway Station",
    department: "Transportation Department",
    estimatedBudget: 3500000,
    status: "Active",
    publishedDate: "2024-01-25",
    closingDate: "2024-03-15",
    platform: "gem_service"
  },
  {
    id: "TDR-2024-005",
    projectName: "Bridge Reconstruction - NH-16",
    department: "Roads & Buildings",
    estimatedBudget: 45000000,
    status: "Closed",
    publishedDate: "2023-11-01",
    closingDate: "2023-12-15",
    platform: "ap_eproc"
  }
];

/**
 * Append a newly created tender into the in-memory list.
 * This is used by the AI drafting workflow so that drafts
 * immediately surface under the Tenders list.
 */
export function addTender(tender: Tender) {
  tenders.push(tender);
}

export const vendorBids: VendorBid[] = [
  {
    vendorName: "ABC Infra Pvt Ltd",
    technicalScore: 88,
    financialBid: 23200000,
    rank: "L1",
    technicalCompliance: 92,
    financialEvaluation: 95,
    pastPerformanceRisk: "LOW",
  },
  {
    vendorName: "Delta Construction Co.",
    technicalScore: 82,
    financialBid: 24500000,
    rank: "L2",
    technicalCompliance: 85,
    financialEvaluation: 88,
    pastPerformanceRisk: "MEDIUM",
  },
  {
    vendorName: "Omega Engineering Ltd",
    technicalScore: 75,
    financialBid: 25800000,
    rank: "L3",
    technicalCompliance: 78,
    financialEvaluation: 80,
    pastPerformanceRisk: "LOW",
  },
];

export const riskAlerts: RiskAlert[] = [
  {
    type: "LOW_BID",
    level: "HIGH",
    message: "Bid 20% below market average",
    explanation: "ABC Infra's financial bid is significantly lower than the estimated market rate. This may indicate aggressive pricing that could lead to quality compromises or cost escalation during execution.",
  },
  {
    type: "COLLUSION",
    level: "MEDIUM",
    message: "Similar pricing pattern detected",
    explanation: "Delta Construction and Omega Engineering show pricing patterns within 5% variance across multiple line items, which may suggest coordinated bidding behavior.",
  },
  {
    type: "SINGLE_BID",
    level: "LOW",
    message: "Only 3 bids received for high-value tender",
    explanation: "For a tender of this value (₹24.5 Cr), the expected bid count is 5-8. Low participation may indicate restrictive eligibility criteria or market awareness issues.",
  },
  {
    type: "COMPLIANCE",
    level: "MEDIUM",
    message: "Missing EMD documentation from L2 bidder",
    explanation: "Delta Construction Co. has not submitted the required Earnest Money Deposit documentation as per clause 4.2 of the RFP.",
  },
  {
    type: "COLLUSION",
    level: "HIGH",
    message: "Regional Collusion Pattern (AP TRANSCO Trace)",
    explanation: "AI detected bid patterns in TDR-2025-001 that mirror the 'Sanampudi 2024' project (AP-TRANS-2024-882). Specifically, the sub-metering cost variance is identical (0.001%) across three distinct vendors, suggesting a coordinated 'Cartel' approach commonly found in statewide infrastructure works.",
  },
];

export type UserRole =
  | "ADMIN"
  | "PROCUREMENT_OFFICER"
  | "VENDOR"
  | "EVALUATION_COMMITTEE"
  | "APPROVING_AUTHORITY"
  | "RTGS_AUDITOR"
  | "INTERNAL_VIGILANCE";

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  PROCUREMENT_OFFICER: "Procurement Officer",
  VENDOR: "Vendor",
  EVALUATION_COMMITTEE: "Evaluation Committee",
  APPROVING_AUTHORITY: "Approving Authority",
  RTGS_AUDITOR: "RTGS Auditor",
  INTERNAL_VIGILANCE: "Internal Vigilance",
};


