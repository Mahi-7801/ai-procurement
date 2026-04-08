export type PortalKey = "cpp" | "gvmc" | "ireps" | "gem_product" | "gem_service" | "gem" | "ap_eproc";

export type FieldInputType =
    | "text"
    | "number"
    | "date"
    | "datetime"
    | "boolean"
    | "select";

export interface PortalField {
    /** Machine id, e.g. "tenderReferenceNumber" */
    id: string;
    /** Human-readable label for UI */
    label: string;
    type: FieldInputType;
    required?: boolean;
    /** Optional dropdown values when type === "select" */
    options?: string[];
}

export interface PortalSection {
    id: string;
    title: string;
    fields: PortalField[];
    /** Indicates this section can repeat (e.g. BOQ rows, multiple corrigenda) */
    repeatable?: boolean;
}

export interface PortalSchema {
    portal: PortalKey;
    displayName: string;
    sections: PortalSection[];
}

export const portalSchemas: Record<PortalKey, PortalSchema> = {
    /** 1️⃣ CPP / eProcurement (Government of India) – Tender Details */
    cpp: {
        portal: "cpp",
        displayName: "CPP / eProcurement (GoI)",
        sections: [
            {
                id: "basicInfo",
                title: "A. Basic Tender Information",
                fields: [
                    { id: "organizationChain", label: "Organization Chain", type: "text", required: true },
                    { id: "tenderReferenceNumber", label: "Tender Reference Number", type: "text", required: true },
                    { id: "tenderId", label: "Tender ID", type: "text" },
                    { id: "tenderType", label: "Tender Type", type: "select" },
                    { id: "tenderCategory", label: "Tender Category", type: "select" },
                    { id: "contractForm", label: "Form of Contract (EPC / Item Rate / etc.)", type: "select" },
                    { id: "numberOfCovers", label: "No. of Covers", type: "number" },
                    { id: "withdrawalAllowed", label: "Withdrawal Allowed (Yes/No)", type: "boolean" },
                    { id: "generalTechEvalAllowed", label: "General Technical Evaluation Allowed (Yes/No)", type: "boolean" },
                    { id: "itemWiseTechEvalAllowed", label: "Item-wise Technical Evaluation Allowed (Yes/No)", type: "boolean" },
                    { id: "paymentMode", label: "Payment Mode", type: "select" },
                    { id: "multiCurrencyFeeAllowed", label: "Multi-currency Allowed (Fee)", type: "boolean" },
                    { id: "multiCurrencyBoqAllowed", label: "Multi-currency Allowed (BOQ)", type: "boolean" },
                    { id: "twoStageBiddingAllowed", label: "Two Stage Bidding Allowed (Yes/No)", type: "boolean" },
                ],
            },
            {
                id: "paymentInstruments",
                title: "B. Payment Instruments",
                fields: [
                    { id: "instrumentDemandDraft", label: "Demand Draft Allowed", type: "boolean" },
                    { id: "instrumentBankersCheque", label: "Banker’s Cheque Allowed", type: "boolean" },
                    { id: "instrumentBankGuarantee", label: "Bank Guarantee Allowed", type: "boolean" },
                ],
            },
            {
                id: "coverDetails",
                title: "C. Cover Details",
                repeatable: true,
                fields: [
                    { id: "coverNumber", label: "Cover Number", type: "number", required: true },
                    {
                        id: "coverType",
                        label: "Cover Type (Technical / Financial)",
                        type: "select",
                        options: ["Technical", "Financial"],
                        required: true,
                    },
                    { id: "documentTypes", label: "Document Type (.pdf / .xls)", type: "text" },
                    { id: "coverDescription", label: "Description (Technical Docs / BOQ / RFP)", type: "text" },
                ],
            },
            {
                id: "feeEmd",
                title: "D. Fee & EMD Details",
                fields: [
                    { id: "tenderFeeAmount", label: "Tender Fee Amount", type: "number" },
                    { id: "tenderFeePayableTo", label: "Tender Fee Payable To", type: "text" },
                    { id: "tenderFeePayableAt", label: "Tender Fee Payable At", type: "text" },
                    { id: "tenderFeeExemptionAllowed", label: "Tender Fee Exemption Allowed (Yes/No)", type: "boolean" },
                    { id: "emdAmount", label: "EMD Amount", type: "number" },
                    {
                        id: "emdType",
                        label: "EMD Type (Fixed / %)",
                        type: "select",
                        options: ["Fixed", "Percentage"],
                    },
                    { id: "emdExemptionAllowed", label: "EMD Exemption Allowed (Yes/No)", type: "boolean" },
                    { id: "emdPayableTo", label: "EMD Payable To", type: "text" },
                    { id: "emdPayableAt", label: "EMD Payable At", type: "text" },
                ],
            },
            {
                id: "workItem",
                title: "E. Work / Item Details",
                fields: [
                    { id: "workTitle", label: "Work Title", type: "text", required: true },
                    { id: "workDescription", label: "Work Description", type: "text" },
                    { id: "productCategory", label: "Product Category", type: "text" },
                    { id: "subCategory", label: "Sub-category", type: "text" },
                    { id: "tenderValue", label: "Tender Value", type: "number" },
                    { id: "contractType", label: "Contract Type", type: "select" },
                    { id: "bidValidityDays", label: "Bid Validity (Days)", type: "number" },
                    { id: "periodOfWorkDays", label: "Period of Work (Days)", type: "number" },
                    { id: "location", label: "Location", type: "text" },
                    { id: "pincode", label: "Pincode", type: "text" },
                ],
            },
            {
                id: "prebidOpening",
                title: "F. Pre-bid & Opening",
                fields: [
                    { id: "preBidMeetingAddress", label: "Pre-Bid Meeting Address", type: "text" },
                    { id: "preBidMeetingDateTime", label: "Pre-Bid Meeting Date & Time", type: "datetime" },
                    { id: "bidOpeningPlace", label: "Bid Opening Place", type: "text" },
                ],
            },
            {
                id: "criticalDates",
                title: "G. Critical Dates",
                fields: [
                    { id: "publishDate", label: "Publish Date", type: "datetime" },
                    { id: "docDownloadStartDate", label: "Document Download Start Date", type: "datetime" },
                    { id: "docDownloadEndDate", label: "Document Download End Date", type: "datetime" },
                    { id: "bidSubmissionStartDate", label: "Bid Submission Start Date", type: "datetime" },
                    { id: "bidSubmissionEndDate", label: "Bid Submission End Date", type: "datetime" },
                    { id: "bidOpeningDate", label: "Bid Opening Date", type: "datetime" },
                ],
            },
            {
                id: "tenderDocuments",
                title: "H. Tender Documents",
                fields: [
                    { id: "nitDocumentName", label: "NIT Document Name", type: "text" },
                    { id: "tenderDocumentName", label: "Tender Document Name", type: "text" },
                    { id: "boqFile", label: "BOQ File", type: "text" },
                    { id: "rfpFile", label: "RFP File", type: "text" },
                    { id: "documentSize", label: "Document Size (MB)", type: "number" },
                ],
            },
            {
                id: "corrigendum",
                title: "I. Corrigendum",
                repeatable: true,
                fields: [
                    { id: "corrigendumTitle", label: "Corrigendum Title", type: "text" },
                    { id: "corrigendumType", label: "Corrigendum Type", type: "text" },
                    { id: "corrigendumViewLink", label: "Corrigendum View Link", type: "text" },
                ],
            },
            {
                id: "invitingAuthority",
                title: "J. Tender Inviting Authority",
                fields: [
                    { id: "authorityName", label: "Authority Name", type: "text", required: true },
                    { id: "authorityAddress", label: "Authority Address", type: "text" },
                ],
            },
        ],
    },

    /** 2️⃣ GVMC RFP – PPP / Hybrid Annuity Project */
    gvmc: {
        portal: "gvmc",
        displayName: "GVMC RFP – PPP / Hybrid Annuity",
        sections: [
            {
                id: "rfpHeader",
                title: "A. RFP Header",
                fields: [
                    { id: "projectTitle", label: "Project Title", type: "text", required: true },
                    { id: "modelType", label: "Model Type (PPP – Hybrid Annuity)", type: "text" },
                    { id: "rfpVolume", label: "RFP Volume", type: "text" },
                    { id: "noticeNumber", label: "Notice Number", type: "text" },
                    { id: "rfpIssueMonthYear", label: "RFP Issue Month & Year", type: "text" },
                    { id: "tenderInvitingAuthority", label: "Tender Inviting Authority", type: "text" },
                    { id: "authorityAddress", label: "Authority Address", type: "text" },
                ],
            },
            {
                id: "projectOverview",
                title: "B. Project Overview",
                fields: [
                    { id: "projectDescription", label: "Project Description", type: "text" },
                    { id: "cityState", label: "City / State", type: "text" },
                    { id: "totalRoadLengthKm", label: "Total Road Length (KM)", type: "number" },
                    { id: "estimatedBaseProjectCost", label: "Estimated Base Project Cost", type: "number" },
                    { id: "scheduleOfRatesRef", label: "Schedule of Rates Reference", type: "text" },
                    { id: "exclusions", label: "Exclusions (GST, O&M, Seigniorage)", type: "text" },
                ],
            },
            {
                id: "biddingProcess",
                title: "C. Bidding Process",
                fields: [
                    { id: "biddingType", label: "Bidding Type (Single stage – Two part)", type: "text" },
                    { id: "technicalBid", label: "Technical Bid", type: "text" },
                    { id: "financialBid", label: "Financial Bid", type: "text" },
                    { id: "bidDocumentCost", label: "Bid Document Cost", type: "number" },
                    { id: "bidValidityPeriod", label: "Bid Validity Period (Days)", type: "number" },
                    { id: "bidDueDate", label: "Bid Due Date", type: "datetime" },
                    { id: "modeOfSubmission", label: "Mode of Submission (Online only)", type: "text" },
                ],
            },
            {
                id: "eligibilityQualification",
                title: "D. Eligibility & Qualification",
                fields: [
                    { id: "bidderType", label: "Bidder Type (Company / LLP / Consortium)", type: "text" },
                    { id: "technicalCapacityCriteria", label: "Technical Capacity Criteria", type: "text" },
                    { id: "financialCapacityCriteria", label: "Financial Capacity Criteria", type: "text" },
                    { id: "netWorthRequirement", label: "Net Worth Requirement", type: "text" },
                    { id: "eligibleExperience", label: "Eligible Experience", type: "text" },
                    { id: "similarWorksDefinition", label: "Similar Works Definition", type: "text" },
                    { id: "consortiumRules", label: "Consortium Rules", type: "text" },
                    { id: "leadMemberConditions", label: "Lead Member Conditions", type: "text" },
                ],
            },
            {
                id: "evaluationSelection",
                title: "E. Evaluation & Selection",
                fields: [
                    { id: "technicalEvaluationMethod", label: "Technical Evaluation Method", type: "text" },
                    { id: "financialEvaluationMethod", label: "Financial Evaluation Method", type: "text" },
                    { id: "selectionCriteria", label: "Selection Criteria (L1)", type: "text" },
                    { id: "tieBreakerRules", label: "Tie-breaker Rules", type: "text" },
                    { id: "disqualificationRules", label: "Disqualification Rules", type: "text" },
                ],
            },
            {
                id: "securityGuarantees",
                title: "F. Security & Guarantees",
                fields: [
                    { id: "bidSecurity", label: "Bid Security", type: "text" },
                    { id: "performanceSecurity", label: "Performance Security", type: "text" },
                    { id: "bankGuaranteeFormat", label: "Bank Guarantee Format", type: "text" },
                ],
            },
            {
                id: "annexures",
                title: "G. Annexures & Appendices",
                fields: [
                    { id: "letterOfTechnicalBid", label: "Letter of Technical Bid", type: "text" },
                    { id: "letterOfFinancialBid", label: "Letter of Financial Bid", type: "text" },
                    { id: "bidderDetails", label: "Bidder Details", type: "text" },
                    { id: "technicalCapacityFormat", label: "Technical Capacity Format", type: "text" },
                    { id: "financialCapacityFormat", label: "Financial Capacity Format", type: "text" },
                    { id: "powerOfAttorney", label: "Power of Attorney", type: "text" },
                    { id: "consortiumAgreement", label: "Consortium Agreement", type: "text" },
                    { id: "integrityPact", label: "Integrity Pact", type: "text" },
                ],
            },
        ],
    },

    /** 3️⃣ IREPS – Indian Railways Tender */
    ireps: {
        portal: "ireps",
        displayName: "IREPS – Indian Railways Tender",
        sections: [
            {
                id: "nitHeader",
                title: "A. NIT Header",
                fields: [
                    { id: "tenderNumber", label: "Tender Number", type: "text", required: true },
                    { id: "nameOfWork", label: "Name of Work", type: "text", required: true },
                    { id: "biddingType", label: "Bidding Type", type: "text" },
                    { id: "tenderType", label: "Tender Type", type: "text" },
                    { id: "biddingSystem", label: "Bidding System (Two Packet)", type: "text" },
                    { id: "tenderClosingDateTime", label: "Tender Closing Date & Time", type: "datetime" },
                    { id: "tenderUploadDateTime", label: "Tender Upload Date & Time", type: "datetime" },
                    { id: "preBidConference", label: "Pre-Bid Conference (Yes/No)", type: "boolean" },
                    { id: "advertisedValue", label: "Advertised Value", type: "number" },
                    { id: "tenderingSection", label: "Tendering Section", type: "text" },
                    { id: "contractType", label: "Contract Type", type: "text" },
                    { id: "contractCategory", label: "Contract Category", type: "text" },
                    { id: "periodOfCompletion", label: "Period of Completion (Months/Days)", type: "text" },
                ],
            },
            {
                id: "financials",
                title: "B. Financials",
                fields: [
                    { id: "emd", label: "Earnest Money Deposit (EMD)", type: "number" },
                    { id: "tenderDocumentCost", label: "Tender Document Cost", type: "number" },
                    { id: "validityOfOffer", label: "Validity of Offer (Days)", type: "number" },
                ],
            },
            {
                id: "jvConsortium",
                title: "C. JV / Consortium",
                fields: [
                    { id: "jvAllowed", label: "JV Allowed (Yes/No)", type: "boolean" },
                    { id: "numberOfJvMembers", label: "No. of JV Members", type: "number" },
                    { id: "consortiumAllowed", label: "Consortium Allowed (Yes/No)", type: "boolean" },
                ],
            },
            {
                id: "boqSchedule",
                title: "D. BOQ / Schedule",
                repeatable: true,
                fields: [
                    { id: "scheduleName", label: "Schedule Name", type: "text" },
                    { id: "itemCode", label: "Item Code", type: "text" },
                    { id: "itemDescription", label: "Item Description", type: "text" },
                    { id: "quantity", label: "Quantity", type: "number" },
                    { id: "unit", label: "Unit", type: "text" },
                    { id: "unitRate", label: "Unit Rate", type: "number" },
                    { id: "basicValue", label: "Basic Value", type: "number" },
                    { id: "escalation", label: "Escalation (%)", type: "number" },
                    { id: "totalAmount", label: "Total Amount", type: "number" },
                    { id: "biddingUnit", label: "Bidding Unit (AT Par / Above / Below)", type: "text" },
                ],
            },
            {
                id: "eligibilityConditions",
                title: "E. Eligibility Conditions",
                fields: [
                    { id: "turnoverRequirement", label: "Turnover Requirement", type: "text" },
                    { id: "bidCapacityFormula", label: "Bid Capacity Formula", type: "text" },
                    { id: "similarWorkExperience", label: "Similar Work Experience", type: "text" },
                    { id: "rdsoVendorApproval", label: "RDSO Vendor Approval", type: "text" },
                    { id: "blacklistingDeclaration", label: "Blacklisting Declaration", type: "text" },
                ],
            },
        ],
    },

    /** 4️⃣ GeM Product Bid Document (Template 1) */
    gem_product: {
        portal: "gem_product",
        displayName: "GeM Bid - Product / Goods",
        sections: [
            {
                id: "bidReference",
                title: "1. Bid Reference Details",
                fields: [
                    { id: "bidNumber", label: "Bid Number", type: "text", required: true },
                    { id: "bidDate", label: "Bid Date", type: "date", required: true },
                    { id: "bidEndDateTime", label: "Bid End Date & Time", type: "datetime", required: true },
                    { id: "bidOpeningDateTime", label: "Bid Opening Date & Time", type: "datetime", required: true },
                    { id: "bidOfferValidity", label: "Bid Offer Validity (Days)", type: "number" },
                    { id: "bidType", label: "Bid Type", type: "select", options: ["Single Packet", "Two Packet"] },
                    { id: "evaluationMethod", label: "Evaluation Method", type: "text" },
                    { id: "raEnabled", label: "Reverse Auction", type: "boolean" },
                ],
            },
            {
                id: "buyerDetails",
                title: "2. Buyer Details",
                fields: [
                    { id: "ministryName", label: "Ministry / State", type: "text", required: true },
                    { id: "departmentName", label: "Department Name", type: "text", required: true },
                    { id: "organisationName", label: "Organisation Name", type: "text" },
                    { id: "officeName", label: "Office Name", type: "text" },
                    { id: "buyerAddress", label: "Buyer Address", type: "text" },
                ],
            },
            {
                id: "productDetails",
                title: "3. Product Category Details",
                fields: [
                    {
                        id: "itemCategory",
                        label: "Category",
                        type: "select",
                        options: [
                            "Computers",
                            "Office Machines",
                            "Automobiles",
                            "Office Supplies",
                            "Appliances",
                            "Furniture",
                            "Specialized Vehicles",
                            "Softwares",
                            "Two Wheeler"
                        ]
                    },
                    {
                        id: "subCategory",
                        label: "Sub-category",
                        type: "select",
                        options: [
                            "Desktops", "Laptops", "All in One", "Servers",
                            "Multifunction Machines", "Printers", "Paper Shredding Machines", "Multimedia Projector (MMP)",
                            "Cars", "Buses", "Utility Vehicles", "Ambulance",
                            "Ball Point Pen", "Gel Pen", "Printer or Photo Copier Paper",
                            "Televisions", "Air Conditioner", "Online UPS",
                            "Revolving Chair", "Office Chairs", "Steel Almirah",
                            "Hopper Tipper Dumper", "Tractors",
                            "Operating System", "GIS Software",
                            "Motor Cycle", "Bicycle"
                        ]
                    },
                    { id: "itemName", label: "Item Name", type: "text", required: true },
                ],
            },
            {
                id: "itemSpecs",
                title: "4. Item Specification Details",
                fields: [
                    { id: "brand", label: "Brand / Make", type: "text" },
                    { id: "model", label: "Model / Variant", type: "text" },
                    { id: "quantity", label: "Quantity", type: "number" },
                    { id: "unit", label: "Unit of Measurement", type: "text" },
                    { id: "technicalSpecDoc", label: "Tech Spec Doc Ref", type: "text" },
                ],
            },
            {
                id: "oemCompliance",
                title: "5. OEM & Compliance Details",
                fields: [
                    { id: "oemName", label: "OEM Name", type: "text" },
                    { id: "countryOfOrigin", label: "Country of Origin", type: "text" },
                    { id: "localContent", label: "Local Content (%)", type: "number" },
                ],
            },
            {
                id: "deliveryDetails",
                title: "6. Delivery Details",
                fields: [
                    { id: "deliveryPeriod", label: "Delivery Period (Days)", type: "number" },
                    { id: "consigneeDetails", label: "Consignee & Quantity Address", type: "text" },
                ],
            },
            {
                id: "eligibility",
                title: "7. Eligibility & Experience",
                fields: [
                    { id: "avgTurnover", label: "Avg Annual Turnover (Lakhs)", type: "number" },
                    { id: "pastPerformanceReq", label: "Past Performance Required", type: "boolean" },
                ],
            },
            {
                id: "financialSecurity",
                title: "8. Financial Securities",
                fields: [
                    { id: "emdRequired", label: "EMD Required", type: "boolean" },
                    { id: "emdAmount", label: "EMD Amount (₹)", type: "number" },
                    { id: "epbgRequired", label: "ePBG Required", type: "boolean" },
                    { id: "epbgPercentage", label: "ePBG %", type: "number" },
                    { id: "epbgDuration", label: "ePBG Duration (Months)", type: "number" },
                ],
            },
            {
                id: "statutory",
                title: "9. Statutory & Preference",
                fields: [
                    { id: "mseRegistered", label: "MSE Registered", type: "boolean" },
                    { id: "startupRegistered", label: "Startup Registered", type: "boolean" },
                    { id: "miiCompliance", label: "MII Compliance", type: "boolean" },
                ],
            },
            {
                id: "declarations",
                title: "10. Declarations",
                fields: [
                    { id: "acceptGTC", label: "Accept GeM GTC", type: "boolean", required: true },
                    { id: "noBlacklisting", label: "No Blacklisting Declaration", type: "boolean", required: true },
                    { id: "signatoryName", label: "Authorized Signatory Name", type: "text", required: true },
                    { id: "signatoryDesignation", label: "Designation", type: "text" },
                ],
            },
        ],
    },

    /** 5️⃣ GeM Service Bid Document (Template 2) */
    gem_service: {
        portal: "gem_service",
        displayName: "GeM Bid - Services",
        sections: [
            {
                id: "bidReference",
                title: "1. Bid Reference Details",
                fields: [
                    { id: "bidNumber", label: "Bid Number", type: "text", required: true },
                    { id: "bidDate", label: "Bid Date", type: "date", required: true },
                    { id: "bidEndDateTime", label: "Bid End Date & Time", type: "datetime", required: true },
                    { id: "bidOpeningDateTime", label: "Bid Opening Date & Time", type: "datetime", required: true },
                    { id: "bidOfferValidity", label: "Bid Offer Validity (Days)", type: "number" },
                ],
            },
            {
                id: "buyerDetails",
                title: "2. Buyer Details",
                fields: [
                    { id: "ministryName", label: "Ministry / State", type: "text", required: true },
                    { id: "departmentName", label: "Department Name", type: "text", required: true },
                    { id: "organisationName", label: "Organisation Name", type: "text" },
                    { id: "officeName", label: "Office Name", type: "text" },
                ],
            },
            {
                id: "serviceCategory",
                title: "3. Service Category Details",
                fields: [
                    { id: "serviceCategory", label: "Service Category (GeM)", type: "text" },
                    { id: "subCategory", label: "Sub-category", type: "text" },
                    { id: "serviceName", label: "Service Name", type: "text", required: true },
                ],
            },
            {
                id: "serviceDetails",
                title: "4. Service Details",
                fields: [
                    { id: "serviceDescription", label: "Service Description", type: "text" },
                    { id: "contractPeriod", label: "Contract Period", type: "text" },
                ],
            },
            {
                id: "scopeWork",
                title: "5. Scope of Work",
                fields: [
                    { id: "scopeOfWork", label: "Scope of Work Details", type: "text", required: true },
                    { id: "supportingDocRef", label: "Supporting Doc Reference", type: "text" },
                ],
            },
            {
                id: "execution",
                title: "6. Service Execution Details",
                fields: [
                    { id: "serviceLocation", label: "Service Location", type: "text" },
                    { id: "manpowerDetails", label: "Manpower Details", type: "text" },
                    { id: "methodology", label: "Service Methodology / Approach", type: "text" },
                ],
            },
            {
                id: "experience",
                title: "7. Experience & Capability",
                fields: [
                    { id: "experienceYears", label: "Years of Experience Required", type: "number" },
                    { id: "similarServices", label: "Similar Services Executed", type: "boolean" },
                    { id: "experienceCertRef", label: "Experience Cert Reference", type: "text" },
                ],
            },
            {
                id: "financial",
                title: "8. Financial Details",
                fields: [
                    { id: "serviceCharges", label: "Quoted Service Charges (₹)", type: "number" },
                    { id: "emdRequired", label: "EMD Required", type: "boolean" },
                    { id: "epbgRequired", label: "ePBG Required", type: "boolean" },
                    { id: "epbgPercentage", label: "ePBG %", type: "number" },
                ],
            },
            {
                id: "statutory",
                title: "9. Statutory & Eligibility",
                fields: [
                    { id: "turnover", label: "Bidder Turnover", type: "number" },
                    { id: "mseStartupStatus", label: "MSE / Startup Eligibility", type: "text" },
                ],
            },
            {
                id: "declarations",
                title: "10. Declarations",
                fields: [
                    { id: "acceptGTC", label: "Accept GeM GTC", type: "boolean", required: true },
                    { id: "noBlacklisting", label: "No Blacklisting Declaration", type: "boolean", required: true },
                    { id: "signatoryName", label: "Authorized Signatory", type: "text", required: true },
                ],
            },
        ],
    },
    // Keep legacy gem for compatibility if needed, but point it to product by default
    gem: {
        portal: "gem_product",
        displayName: "GeM Bid Document",
        sections: [], // Will be dynamically replaced in UI
    },

    /** 6️⃣ AP e-Procurement – Government of Andhra Pradesh */
    ap_eproc: {
        portal: "ap_eproc",
        displayName: "AP e-Procurement",
        sections: [
            {
                id: "tenderNotice",
                title: "A. Notice Inviting Tender (NIT)",
                fields: [
                    { id: "departmentName", label: "Department Name", type: "text", required: true },
                    { id: "workTitle", label: "Title of the Work", type: "text", required: true },
                    { id: "tenderNoticeNumber", label: "NIT No. / Tender ID", type: "text", required: true },
                    { id: "ecv", label: "Estimated Contract Value (ECV)", type: "number" },
                    { id: "tenderType", label: "Tender Type (Open/Limited)", type: "select", options: ["Open", "Limited"] },
                ],
            },
            {
                id: "criticalDates",
                title: "B. Critical Dates & Schedules",
                fields: [
                    { id: "bidSubmissionStartDate", label: "Bid Submission Start Date", type: "datetime" },
                    { id: "bidSubmissionEndDate", label: "Bid Submission Closing Date", type: "datetime" },
                    { id: "technicalBidOpeningDate", label: "Technical Bid Opening Date", type: "datetime" },
                    { id: "priceBidOpeningDate", label: "Price Bid Opening Date", type: "datetime" },
                ],
            },
            {
                id: "financialSecurity",
                title: "C. Financial Details (G.O.Ms.No.174)",
                fields: [
                    { id: "emdAmount", label: "EMD Amount (₹)", type: "number" },
                    { id: "emdPaymentMode", label: "EMD Payment Mode (Online)", type: "select", options: ["Online / Net Banking", "NEFT/RTGS"] },
                    { id: "aptsTransactionFee", label: "APTS Transaction Fee (₹)", type: "number" },
                    { id: "corpusFundRequired", label: "Corpus Fund Required (if ECV > 10L)", type: "boolean" },
                ],
            },
            {
                id: "eligibility",
                title: "D. Eligibility & Qualification",
                fields: [
                    { id: "technicalCapacity", label: "Technical Capacity / Similar Works", type: "text" },
                    { id: "financialTurnover", label: "Annual Turnover Requirement", type: "text" },
                    { id: "registrationClass", label: "Contractor Registration Class", type: "text" },
                ],
            },
            {
                id: "submission",
                title: "E. Online Submission Compliance",
                fields: [
                    { id: "dscAuthenticated", label: "DSC Authentication Required", type: "boolean", required: true },
                    { id: "originalHardCopiesDispensed", label: "Original Hard Copies Dispensed (at Bid Stage)", type: "boolean" },
                    { id: "suspensionAgreement", label: "Accept 3-Year Suspension Clause", type: "boolean", required: true },
                ],
            },
        ],
    }
};
