import type { PortalKey } from "./portalSchemas";

interface BasicWizardInfo {
    title: string;
    dept: string;
    budget: string;
}

/**
 * Very simple text generator that turns the collected portal values
 * into an officer-facing tender note. This can later be replaced with
 * a richer template / PDF generator.
 */
export function generateOfficerNote(
    platform: PortalKey,
    basic: BasicWizardInfo,
    portalValues: Record<string, any>
): string {
    const header = `Tender Brief (${platform.toUpperCase()})\n\nProject: ${basic.title}\nDepartment: ${basic.dept}\nEstimated Budget: ₹${basic.budget}\n\n`;

    switch (platform) {
        case "cpp":
            return (
                header +
                [
                    "A. Basic Tender Information",
                    `- Organization Chain: ${portalValues.organizationChain ?? ""}`,
                    `- Tender Reference Number: ${portalValues.tenderReferenceNumber ?? ""}`,
                    `- Tender ID: ${portalValues.tenderId ?? ""}`,
                    `- Tender Type: ${portalValues.tenderType ?? ""}`,
                    `- Tender Category: ${portalValues.tenderCategory ?? ""}`,
                    `- Form of Contract: ${portalValues.contractForm ?? ""}`,
                    `- No. of Covers: ${portalValues.numberOfCovers ?? ""}`,
                    "",
                    "E. Work / Item Details",
                    `- Work Title: ${portalValues.workTitle ?? ""}`,
                    `- Work Description: ${portalValues.workDescription ?? ""}`,
                    `- Product Category: ${portalValues.productCategory ?? ""}`,
                    `- Tender Value: ${portalValues.tenderValue ?? ""}`,
                    "",
                    "G. Critical Dates",
                    `- Publish Date: ${portalValues.publishDate ?? ""}`,
                    `- Bid Submission End Date: ${portalValues.bidSubmissionEndDate ?? ""}`,
                    `- Bid Opening Date: ${portalValues.bidOpeningDate ?? ""}`,
                    "",
                    "J. Tender Inviting Authority",
                    `- Authority Name: ${portalValues.authorityName ?? ""}`,
                    `- Authority Address: ${portalValues.authorityAddress ?? ""}`,
                ].join("\n")
            );

        case "ireps":
            return (
                header +
                [
                    "A. NIT Header",
                    `- Tender Number: ${portalValues.tenderNumber ?? ""}`,
                    `- Name of Work: ${portalValues.nameOfWork ?? ""}`,
                    `- Bidding Type: ${portalValues.biddingType ?? ""}`,
                    `- Tender Type: ${portalValues.tenderType ?? ""}`,
                    `- Bidding System: ${portalValues.biddingSystem ?? ""}`,
                    `- Advertised Value: ${portalValues.advertisedValue ?? ""}`,
                    "",
                    "B. Financials",
                    `- EMD: ${portalValues.emd ?? ""}`,
                    `- Tender Document Cost: ${portalValues.tenderDocumentCost ?? ""}`,
                    `- Validity of Offer (days): ${portalValues.validityOfOffer ?? ""}`,
                    "",
                    "E. Eligibility Conditions",
                    `- Turnover Requirement: ${portalValues.turnoverRequirement ?? ""}`,
                    `- Bid Capacity Formula: ${portalValues.bidCapacityFormula ?? ""}`,
                    `- Similar Work Experience: ${portalValues.similarWorkExperience ?? ""}`,
                    `- RDSO Vendor Approval: ${portalValues.rdsoVendorApproval ?? ""}`,
                    `- Blacklisting Declaration: ${portalValues.blacklistingDeclaration ?? ""}`,
                ].join("\n")
            );

        case "gem_product":
            return (
                header +
                [
                    "1. Bid Reference Details",
                    `- Bid Number: ${portalValues.bidNumber ?? ""}`,
                    `- Bid Date: ${portalValues.bidDate ?? ""}`,
                    `- Bid Opening: ${portalValues.bidOpeningDateTime ?? ""}`,
                    "",
                    "3. Product Category Details",
                    `- Category: ${portalValues.itemCategory ?? ""}`,
                    `- Item Name: ${portalValues.itemName ?? ""}`,
                    "",
                    "4. Item Specification Details",
                    `- Brand: ${portalValues.brand ?? ""}`,
                    `- Quantity: ${portalValues.quantity ?? ""}`,
                    "",
                    "10. Declarations",
                    `- Signatory: ${portalValues.signatoryName ?? ""}`,
                    `- Designation: ${portalValues.signatoryDesignation ?? ""}`,
                ].join("\n")
            );

        case "gem_service":
            return (
                header +
                [
                    "1. Bid Reference Details",
                    `- Bid Number: ${portalValues.bidNumber ?? ""}`,
                    `- Bid Date: ${portalValues.bidOpeningDateTime ?? ""}`,
                    "",
                    "3. Service Category Details",
                    `- Category: ${portalValues.serviceCategory ?? ""}`,
                    `- Service Name: ${portalValues.serviceName ?? ""}`,
                    "",
                    "5. Scope of Work",
                    `- Scope: ${portalValues.scopeOfWork ?? ""}`,
                    "",
                    "8. Financial Details",
                    `- Service Charges: ₹${portalValues.serviceCharges ?? ""}`,
                    "",
                    "10. Declarations",
                    `- Signatory: ${portalValues.signatoryName ?? ""}`,
                ].join("\n")
            );

        case "gem": // Fallback
            return (
                header +
                [
                    "A. Bid Details",
                    `- Bid Number: ${portalValues.bidNumber ?? ""}`,
                    `- Bid Date: ${portalValues.bidDate ?? ""}`,
                ].join("\n")
            );

        case "gvmc":
            return (
                header +
                [
                    "A. RFP Header",
                    `- Project Title: ${portalValues.projectTitle ?? ""}`,
                    `- Model Type: ${portalValues.modelType ?? ""}`,
                    `- Notice Number: ${portalValues.noticeNumber ?? ""}`,
                    "",
                    "B. Project Overview",
                    `- Description: ${portalValues.projectDescription ?? ""}`,
                    `- City / State: ${portalValues.cityState ?? ""}`,
                    `- Total Road Length (km): ${portalValues.totalRoadLengthKm ?? ""}`,
                    `- Estimated Base Project Cost: ${portalValues.estimatedBaseProjectCost ?? ""}`,
                    "",
                    "C. Bidding Process",
                    `- Bidding Type: ${portalValues.biddingType ?? ""}`,
                    `- Bid Document Cost: ${portalValues.bidDocumentCost ?? ""}`,
                    `- Bid Validity Period (days): ${portalValues.bidValidityPeriod ?? ""}`,
                    `- Bid Due Date: ${portalValues.bidDueDate ?? ""}`,
                    "",
                    "D. Eligibility & Qualification",
                    `- Bidder Type: ${portalValues.bidderType ?? ""}`,
                    `- Technical Capacity: ${portalValues.technicalCapacityCriteria ?? ""}`,
                    `- Financial Capacity: ${portalValues.financialCapacityCriteria ?? ""}`,
                    "",
                    "F. Security & Guarantees",
                    `- Bid Security: ${portalValues.bidSecurity ?? ""}`,
                    `- Performance Security: ${portalValues.performanceSecurity ?? ""}`,
                ].join("\n")
            );

        case "ap_eproc":
            return (
                header +
                [
                    "A. Notice Inviting Tender (NIT)",
                    `- Department Name: ${portalValues.departmentName ?? ""}`,
                    `- Title of Work: ${portalValues.workTitle ?? ""}`,
                    `- NIT No. / Tender ID: ${portalValues.tenderNoticeNumber ?? ""}`,
                    `- ECV: ₹${portalValues.ecv ?? ""}`,
                    `- Tender Type: ${portalValues.tenderType ?? ""}`,
                    "",
                    "B. Critical Dates & Schedules",
                    `- Closing Date: ${portalValues.bidSubmissionEndDate ?? ""}`,
                    `- Tech Opening Date: ${portalValues.technicalBidOpeningDate ?? ""}`,
                    "",
                    "C. Financial Details (G.O.Ms.No.174)",
                    `- EMD Amount: ₹${portalValues.emdAmount ?? ""}`,
                    `- APTS Fee: ₹${portalValues.aptsTransactionFee ?? ""}`,
                    `- Corpus Fund: ${portalValues.corpusFundRequired ? "Yes" : "No"}`,
                    "",
                    "E. Online Submission Compliance",
                    `- DSC Required: ${portalValues.dscAuthenticated ? "Yes" : "No"}`,
                    `- Suspension Clause accepted: ${portalValues.suspensionAgreement ? "Yes" : "No"}`,
                ].join("\n")
            );

        default:
            return header + "Detailed schema information not configured for this fallback platform.";
    }
}

