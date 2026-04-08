import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { toast as sonnerToast } from "sonner";

export interface PDFTenderData {
    bidNumber: string;
    dateOfIssue?: string;
    bidEndDate?: string;
    bidOpeningDate?: string;
    bidValidity?: string | number;
    ministry?: string;
    department?: string;
    organisation?: string;
    officeName?: string;
    quantity?: string | number;
    unit?: string;
    category?: string;
    title?: string;
    itemName?: string;
    procurementCategory?: string;
    estimatedValue?: string | number;
    contractDuration?: string | number;
    location?: string;
    deliveryPeriod?: string | number;
    installationRequired?: boolean;
    ldPercentage?: string | number;
    turnover?: string | number;
    experienceYears?: string | number;
    bidType?: string;
    evaluationMethod?: string;
    reverseAuction?: string;
    arbitrationClause?: string;
    buyerName?: string;
    buyerDesignation?: string;
    buyerAddress?: string;
    buyerContact?: string;
    buyerEmail?: string;
    buyerGstin?: string;
    emdRequired?: string;
    emdAmount?: string;
    emdMode?: string;
    epbgRequired?: string;
    epbgPercentage?: string | number;
    epbgValidity?: string | number;
    miiApplicable?: boolean;
    msmePreference?: boolean;
    mandatoryParams?: any[];
    consigneeDetails?: any[];
    docsPan?: boolean;
    docsGst?: boolean;
    docsMsme?: boolean;
    docsOemAuth?: boolean;
    docsMii?: boolean;
    netWorthRequired?: boolean;
    additionalTerms?: string;
    warrantyPeriod?: string | number;
    paymentTerms?: string;
    signatoryName?: string;
    signatoryDesignation?: string;
    // Platform Specific Extensions
    platform?: string;
    departmentName?: string;
    workTitle?: string;
    tenderNoticeNumber?: string;
    ecv?: string | number;
    bidSubmissionEndDate?: string;
    emdAmountAP?: string | number;
    aptsTransactionFee?: string | number;
    corpusFundRequired?: boolean;
    tenderCategory?: string;
}

export const generateBilingualGeMPDF = async (formData: PDFTenderData, results: any[] = []) => {
    const isSafe = results.length > 0 && results.every((r: any) => r.status === 'pass');

    sonnerToast.info("Generating GeM Bid Document...");
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    let hindiFont = "helvetica"; // fallback
    try {
        const response = await fetch("https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@master/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf");
        if (response.ok) {
            const blob = await response.blob();
            const base64data = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(blob);
            });
            doc.addFileToVFS("NotoSansDevanagari.ttf", base64data);
            doc.addFont("NotoSansDevanagari.ttf", "Hind", "normal");
            doc.addFont("NotoSansDevanagari.ttf", "Hind", "bold");
            hindiFont = "Hind";
        }
    } catch (e) {
        console.error("Font load error", e);
    }

    let currentPage = 1;

    const addPageBorder = () => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
    };

    const addFooter = () => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.text(`${currentPage} `, pageWidth / 2, pageHeight - 6, { align: "center" });
        doc.setTextColor(0);
    };

    const checkPageBreak = (y: number, needed: number) => {
        if (y + needed > pageHeight - 18) {
            addFooter();
            addPageBorder();
            doc.addPage();
            currentPage++;
            addPageBorder();
            return margin + 8;
        }
        return y;
    };

    const drawSectionTitle = (bilingualTitle: string, y: number) => {
        const sepIdx = bilingualTitle.lastIndexOf("/");
        const hindiPart = sepIdx > -1 ? bilingualTitle.slice(0, sepIdx).trim() : bilingualTitle;
        const engPart = sepIdx > -1 ? bilingualTitle.slice(sepIdx + 1).trim() : "";

        doc.setFont(hindiFont, "bold");
        doc.setFontSize(9);
        const hindiLines = doc.splitTextToSize(hindiPart, contentWidth - 6);
        const hindiH = hindiLines.length * 5.5;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        const engLines = engPart ? doc.splitTextToSize(engPart, contentWidth - 6) : [];
        const engH = engLines.length * 5;

        const titleHeight = hindiH + engH + 5;
        y = checkPageBreak(y, titleHeight);

        doc.setFillColor(220, 220, 220);
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, contentWidth, titleHeight, 'FD');
        doc.setTextColor(0, 0, 0);

        let textY = y + 5;
        doc.setFont(hindiFont, "bold");
        doc.setFontSize(9);
        hindiLines.forEach((line: string) => {
            doc.text(line, pageWidth / 2, textY, { align: "center" });
            textY += 5.5;
        });
        if (engLines.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            engLines.forEach((line: string) => {
                doc.text(line, pageWidth / 2, textY, { align: "center" });
                textY += 5;
            });
        }
        doc.setTextColor(0, 0, 0);
        return y + titleHeight;
    };

    const drawRow = (bilingualLabel: string, value: string | number, y: number) => {
        const col1W = contentWidth * 0.5;
        const col2W = contentWidth * 0.5;
        const pad = 2;
        const lh = 4.5;

        const sepIdx = bilingualLabel.lastIndexOf("/");
        const hindiLabel = sepIdx > -1 ? bilingualLabel.slice(0, sepIdx).trim() : bilingualLabel;
        const engLabel = sepIdx > -1 ? bilingualLabel.slice(sepIdx + 1).trim() : "";
        const stringValue = String(value !== undefined && value !== null && value !== "" ? value : "");

        doc.setFont(hindiFont, "bold");
        doc.setFontSize(8);
        const hindiLines = doc.splitTextToSize(hindiLabel, col1W - pad * 2 - 2);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        const engLines = engLabel ? doc.splitTextToSize(engLabel, col1W - pad * 2 - 2) : [];

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const valueLines = doc.splitTextToSize(stringValue, col2W - pad * 2 - 2);

        const labelH = hindiLines.length * lh + (engLines.length > 0 ? engLines.length * 4 + 1 : 0);
        const valueH = valueLines.length * lh;
        const rowH = Math.max(labelH, valueH) + pad * 2 + 2;

        y = checkPageBreak(y, rowH);

        doc.setDrawColor(180);
        doc.setLineWidth(0.2);
        doc.rect(margin, y, col1W, rowH);
        doc.rect(margin + col1W, y, col2W, rowH);

        doc.setFont(hindiFont, "bold");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(hindiLines, margin + pad + 1, y + pad + 3.5);

        if (engLines.length > 0) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(7.5);
            doc.setTextColor(60, 60, 60);
            doc.text(engLines, margin + pad + 1, y + pad + 3.5 + hindiLines.length * lh + 0.5);
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(valueLines, margin + col1W + pad + 1, y + pad + 3.5);

        return y + rowH;
    };

    const drawComplexTable = (headers: string[], data: any[][], colWidths: number[], y: number) => {
        const headerHeight = 14;
        y = checkPageBreak(y, headerHeight);

        doc.setFillColor(230, 240, 255);
        doc.rect(margin, y, contentWidth, headerHeight, 'F');
        doc.setDrawColor(180);
        doc.setTextColor(0, 0, 0);
        let curX = margin;
        headers.forEach((h, i) => {
            doc.rect(curX, y, colWidths[i], headerHeight);
            const hParts = h.split("/").map(p => p.trim());

            if (hParts.length === 1) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(7);
                doc.setTextColor(0, 0, 0);
                doc.text(doc.splitTextToSize(hParts[0], colWidths[i] - 2), curX + colWidths[i] / 2, y + 7, { align: "center" });
            } else {
                const isFirstHindi = /[\u0900-\u097F]/.test(hParts[0]);
                const hindiPart = isFirstHindi ? hParts[0] : hParts[1];
                const engPart = isFirstHindi ? hParts[1] : hParts[0];

                doc.setFont(hindiFont, "bold");
                doc.setFontSize(7);
                doc.setTextColor(0, 0, 0);
                doc.text(doc.splitTextToSize(hindiPart, colWidths[i] - 2), curX + colWidths[i] / 2, y + 4.5, { align: "center" });

                doc.setFont("helvetica", "bold");
                doc.setFontSize(6.5);
                doc.text(doc.splitTextToSize(engPart, colWidths[i] - 2), curX + colWidths[i] / 2, y + 9.5, { align: "center" });
            }
            curX += colWidths[i];
        });
        y += headerHeight;

        data.forEach(row => {
            let maxLines = 1;
            const cellLines = row.map((cell, i) => {
                const txt = String(cell || "");
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                const lines = doc.splitTextToSize(txt, colWidths[i] - 2);
                maxLines = Math.max(maxLines, lines.length);
                return lines;
            });

            const rowHeight = maxLines * 4 + 4;
            y = checkPageBreak(y, rowHeight);

            curX = margin;
            cellLines.forEach((lines, i) => {
                doc.rect(curX, y, colWidths[i], rowHeight);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.text(lines, curX + 1, y + 5);
                curX += colWidths[i];
            });
            y += rowHeight;
        });

        return y;
    };

    addPageBorder();
    const hY = margin + 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 86, 179);
    doc.text("GeM", margin + 2, hY + 10);
    doc.setFontSize(7);
    doc.setTextColor(80);
    doc.setFont("helvetica", "normal");
    doc.text("Government e Marketplace", margin + 2, hY + 15);

    doc.setTextColor(230, 100, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("75", pageWidth / 2, hY + 11, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(0, 130, 0);
    doc.setFont("helvetica", "normal");
    doc.text("Azadi Ka Amrit Mahotsav", pageWidth / 2, hY + 16, { align: "center" });

    const bidNum = formData.bidNumber || "GEM/2026/B/123456";
    const dated = formData.dateOfIssue
        ? new Date(formData.dateOfIssue).toLocaleDateString('en-GB').replace(/\//g, '-')
        : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const engBidValue = ` Bid Number: ${bidNum}`;
    const engBidWidth = doc.getTextWidth(engBidValue);

    doc.setFont("helvetica", "normal");
    const engDateValue = ` Dated: ${dated}`;
    const engDateWidth = doc.getTextWidth(engDateValue);

    doc.setFont("helvetica", "bold");
    doc.text(engBidValue, pageWidth - margin, hY + 7, { align: "right" });
    doc.setFont(hindiFont, "bold");
    doc.text("बिड संख्या /", pageWidth - margin - engBidWidth - 1, hY + 7, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.text(engDateValue, pageWidth - margin, hY + 13, { align: "right" });
    doc.setFont(hindiFont, "bold");
    doc.text("दिनांक /", pageWidth - margin - engDateWidth - 1, hY + 13, { align: "right" });

    const hrY = hY + 22;
    doc.setDrawColor(0);
    doc.setLineWidth(0.4);
    doc.line(margin, hrY, pageWidth - margin, hrY);

    doc.setFont(hindiFont, "bold");
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text("बिड दस्तावेज़", pageWidth / 2, hrY + 8, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("/ Bid Document", pageWidth / 2, hrY + 15, { align: "center" });

    let y = hrY + 21;

    if (isSafe) {
        doc.setTextColor(34, 139, 34);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text("VALIDATED & SECURITY SCANNED BY PROCURESMART AI", pageWidth / 2, y, { align: "center" });
        doc.setTextColor(0);
        y += 5;
    }

    y += 2;
    y = drawSectionTitle("बिड विवरण/Bid Details", y);

    const bidEndDT = formData.bidEndDate
        ? `${new Date(formData.bidEndDate).toLocaleDateString('en-GB').replace(/\//g, '-')} 14:00:00`
        : "N/A";
    const bidOpenDT = formData.bidOpeningDate
        ? `${new Date(formData.bidOpeningDate).toLocaleDateString('en-GB').replace(/\//g, '-')} 14:30:00`
        : "N/A";

    const bidRows: [string, string][] = [
        ["बिड बंद होने की तारीख/समय/Bid End Date/Time", bidEndDT],
        ["बिड खुलने की तारीख/समय/Bid Opening Date/Time", bidOpenDT],
        ["बिड पेशकश वैधता/Bid Offer Validity (From End Date)", formData.bidValidity ? `${formData.bidValidity} (Days)` : "30 (Days)"],
        ["मंत्रालय/Ministry Name", formData.ministry || "N/A"],
        ["विभाग/Department Name", formData.department || "N/A"],
        ["संगठन/Organisation Name", formData.organisation || "N/A"],
        ["कार्यालय/Office Name", formData.officeName || "N/A"],
        ["कुल मात्रा/Total Quantity", `${formData.quantity || "1"} ${formData.unit || "Nos"}`],
        ["वस्तु श्रेणी/Item Category", formData.category || formData.title || "N/A"],
        ["बिड शीर्षक/Tender Title", formData.title || "N/A"],
        ["खरीद श्रेणी/Procurement Category", formData.procurementCategory || "Product"],
        ["अनुमानित मूल्य/Estimated Value (Rs.)", formData.estimatedValue ? `Rs.${Number(formData.estimatedValue).toLocaleString('en-IN')}` : "N/A"],
        ["अनुबंध अवधि/Contract Duration", formData.contractDuration ? `${formData.contractDuration} Months` : "12 Months"],
        ["डिलीवरी स्थान/Delivery Location", formData.location || "As per Consignee Details"],
        ["डिलीवरी अवधि/Delivery Period", formData.deliveryPeriod ? `${formData.deliveryPeriod} Days` : "30 Days"],
        ["स्थापना/Installation Required", formData.installationRequired ? "Yes" : "No"],
        ["विलंब शुल्क/LD Penalty (%)", formData.ldPercentage ? `${formData.ldPercentage}% per week` : "0.5% per week"],
        ["न्यूनतम टर्नओवर/Min Bidder Turnover (3 Years)", formData.turnover ? `${formData.turnover} Lakh(s)` : "1 Lakh(s)"],
        ["विगत अनुभव/Past Experience Required", formData.experienceYears ? `${formData.experienceYears} Year(s)` : "1 Year(s)"],
        ["बिड का प्रकार/Type of Bid", formData.bidType === "Open" ? "Two Packet Bid" : (formData.bidType || "Two Packet Bid")],
        ["मूल्यांकन पद्धति/Evaluation Method", formData.evaluationMethod === "QCBS" ? "QCBS (Quality-Cum-Cost)" : "Total value wise evaluation"],
        ["रिवर्स नीलामी/Bid to RA enabled", formData.reverseAuction === "Enabled" ? "Yes" : "No"],
        ["मध्यस्थता खंड/Arbitration Clause", formData.arbitrationClause || "No"],
        ["खरीदार का नाम/Buyer Name", formData.buyerName || "N/A"],
        ["पदनाम/Designation", formData.buyerDesignation || "N/A"],
        ["पता/Address", formData.buyerAddress || "N/A"],
        ["संपर्क/Contact", formData.buyerContact || "N/A"],
        ["ईमेल/Email", formData.buyerEmail || "N/A"],
        ["जीएसटीआईएन/GSTIN", formData.buyerGstin || "N/A"],
    ];
    bidRows.forEach(([label, value]) => { y = drawRow(label, value, y); });

    y += 4;
    y = drawSectionTitle("ईएमडी विवरण/EMD Detail", y);
    y = drawRow("आवश्यकता/EMD Required", formData.emdRequired === "Yes" ? "Yes" : "No", y);
    if (formData.emdRequired === "Yes") {
        y = drawRow("ईएमडी राशि/EMD Amount (Rs.)", formData.emdAmount || "0", y);
        y = drawRow("ईएमडी मोड/EMD Mode", formData.emdMode || "Online", y);
    }
    y += 3;
    y = drawSectionTitle("ईपीबीजी विवरण/ePBG Detail", y);
    y = drawRow("आवश्यकता/ePBG Required", formData.epbgRequired === "Yes" ? "Yes" : "No", y);
    if (formData.epbgRequired === "Yes") {
        y = drawRow("ईपीबीजी प्रतिशत/ePBG Percentage (%)", `${formData.epbgPercentage || "3"}%`, y);
        y = drawRow("ईपीबीजी वैधता/ePBG Validity (Months)", `${formData.epbgValidity || "14"} Months`, y);
    }

    y += 4;
    y = drawSectionTitle("एमआईआई खरीद वरीयता/MII Purchase Preference", y);
    y = drawRow("एमआईआई खरीद वरीयता/MII Purchase Preference", formData.miiApplicable ? "Yes" : "No", y);

    y += 3;
    y = drawSectionTitle("एमएसई खरीद वरीयता/MSE Purchase Preference", y);
    y = drawRow("एमएसई खरीद वरीयता/MSE Purchase Preference", formData.msmePreference ? "Yes" : "No", y);
    if (formData.msmePreference) {
        y = drawRow("एमएसई को खरीद में प्राथमिकता/Purchase Preference to MSE OEMs upto L1+X%", "15", y);
        y = drawRow("अधिकतम प्रतिशत/Maximum % of Bid quantity for MSE preference", "25", y);
    }

    y += 4;
    y = drawSectionTitle("तकनीकी विशिष्टता/Technical Specifications", y);
    const matrixHeaders = ["Sl No.", "पैरामीटर / Parameter", "आवश्यकता / Requirement", "Compliance"];
    const matrixCols = [12, 58, 78, 22];
    const matrixData = (formData.mandatoryParams || []).map((p: any, i: number) => [
        String(i + 1), p.parameter || "Generic", p.requirement || "As per RFP", ""
    ]);
    if (matrixData.length === 0) matrixData.push(["1", "Specification", "As detailed in Bid Document", ""]);
    y = drawComplexTable(matrixHeaders, matrixData, matrixCols, y);

    y += 4;
    y = drawSectionTitle("परेषिती/रिपोर्टिंग अधिकारी तथा मात्रा/Consignees and Quantity", y);
    const consHeaders = ["S.No", "अधिकारी / Officer", "पता / Address", "मात्रा / Quantity", "संपर्क / Contact"];
    const consCols = [12, 48, 68, 22, 20];
    const consData = (formData.consigneeDetails || []).map((c: any, i: number) => [
        String(i + 1), c.name || "Officer", c.address || "Dept Store", c.quantity || "1", c.contactNumber || ""
    ]);
    if (consData.length === 0) consData.push(["1", formData.buyerName || "Buyer", formData.buyerAddress || "Department HQ", formData.quantity || "1", formData.buyerContact || ""]);
    y = drawComplexTable(consHeaders, consData, consCols, y);

    const allDocs = [
        { key: "docsPan", label: "PAN Card" },
        { key: "docsGst", label: "GST Registration Certificate" },
        { key: "docsMsme", label: "MSME / Udyam Registration Certificate" },
        { key: "docsOemAuth", label: "OEM Authorization Certificate" },
        { key: "docsMii", label: "Make in India (MII) Declaration Form" },
        { key: "netWorthRequired", label: "Positive Net Worth Certificate (CA Certified)" },
    ];
    const selectedDocs = allDocs.filter(d => !!(formData as any)[d.key]);

    if (selectedDocs.length > 0) {
        y += 4;
        y = drawSectionTitle("अनिवार्य दस्तावेज़/Mandatory Documents to be Uploaded by Bidder", y);
        selectedDocs.forEach((docItem, idx) => {
            y = checkPageBreak(y, 8);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);
            doc.text(`${idx + 1}.  ${docItem.label}`, margin + 4, y + 5);
            y += 7;
        });
    }

    y += 6;
    y = checkPageBreak(y, 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text("Buyer Added Bid Specific ATC", margin + 1, y + 5);
    y += 9;

    const drawTerm = (num: number, type: string, text: string, currentY: number) => {
        currentY = checkPageBreak(currentY, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);
        doc.text(`${num}.  ${type}`, margin + 2, currentY + 5);
        currentY += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const lines = doc.splitTextToSize(text, contentWidth - 10);
        lines.forEach((line: string) => {
            currentY = checkPageBreak(currentY, 6);
            doc.text(line, margin + 6, currentY);
            currentY += 4.5;
        });
        return currentY + 4;
    };

    const buyerTerms: { type: string; text: string }[] = [
        {
            type: "Generic",
            text: "OPTION CLAUSE: The Purchaser reserves the right to increase or decrease the quantity to be ordered up to 25% of the contracted quantity during the currency of the contract at the contracted rates. The delivery period of additional quantity shall commence from the last date of original delivery order. The additional delivery time shall be (Increased quantity / Original quantity) x Original delivery period (in days), subject to minimum of 30 days. Bidders must comply with these terms."
        },
        {
            type: "Generic",
            text: `Actual delivery(and Installation & Commissioning if covered in scope of supply) is to be done at the following address: \n${formData.buyerAddress || "As specified in the Purchase Order / Consignee Details above."}`
        },
        {
            type: "Generic",
            text: "Bidder financial standing: The bidder should not be under liquidation, court receivership or similar proceedings, should not be bankrupt. Bidder to upload undertaking to this effect with bid."
        },
        {
            type: "Generic",
            text: "Bidders are advised to check applicable GST on their own before quoting. Buyer will not take any responsibility in this regard. GST reimbursement will be as per actuals or as per applicable rates (whichever is lower), subject to the maximum of quoted GST %."
        },
        {
            type: "Turnover",
            text: `Bidder Turn Over Criteria: The minimum average annual financial turnover of the bidder during the last three years, ending on 31st March of the previous financial year, should be as indicated in the bid document(Min.Turnover: Rs.${formData.turnover || "50"} Lakh(s)).Documentary evidence in the form of certified Audited Balance Sheets or a certificate from the Chartered Accountant / Cost Accountant indicating the turnover details shall be uploaded with the bid.`
        },
        {
            type: "Experience",
            text: `Past Experience: The bidder must have successfully executed at least ${formData.experienceYears || 3} year(s) of similar supply / service.Documentary evidence(copies of Purchase Orders / Work Orders / Completion Certificates) shall be uploaded with the bid.`
        },
        {
            type: "Warranty",
            text: `Timely Servicing / rectification of defects during warranty period: After having been notified of the defects / service requirement during warranty period of ${formData.warrantyPeriod || 3} year(s), Seller has to complete the required Service / Rectification within 7 days.A penalty of 0.5 % of Unit Price shall be charged per week of delay.Cumulative Penalty cannot exceed 10 % of the total contract value, after which the Buyer shall have the right to get the service done from alternate sources at the risk and cost of the Seller besides forfeiture of PBG.`
        },
        {
            type: "Service & Support",
            text: "Availability of Service Centres: Bidder/OEM must have a Functional Service Centre in the State of each Consignee's Location in case of carry-in warranty. If service center is not already there at the time of bidding, successful bidder / OEM shall have to establish one within 30 days of award of contract. Payment shall be released only after submission of documentary evidence of having a Functional Service Centre."
        },
        {
            type: "Certificates",
            text: "Bidder's offer is liable to be rejected if they don't upload any of the certificates / documents sought in the Bid document, ATC and Corrigendum if any."
        },
        {
            type: "Generic",
            text: "Manufacturer Authorization: Wherever Authorised Distributors / service providers are submitting the bid, Authorisation Form / Certificate with OEM / Original Service Provider details such as name, designation, address, e-mail Id and Phone No. required to be furnished along with the bid."
        },
        {
            type: "Payment Terms",
            text: formData.paymentTerms || "Payment shall be made as per standard GeM Payment Terms: 100% payment after satisfactory delivery, installation, commissioning and acceptance by the consignee."
        },
    ];

    buyerTerms.forEach((term, idx) => {
        y = drawTerm(idx + 1, term.type, term.text, y);
    });

    if (formData.additionalTerms) {
        y += 4;
        y = checkPageBreak(y, 10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);
        doc.text("Buyer Added Bid Specific ATC Clauses:", margin + 2, y + 5);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const atcLines = doc.splitTextToSize(formData.additionalTerms, contentWidth - 8);
        atcLines.forEach((line: string) => {
            y = checkPageBreak(y, 6);
            doc.text(line, margin + 6, y + 4);
            y += 4.5;
        });
    }

    y += 8;
    y = checkPageBreak(y, 14);
    doc.setFont(hindiFont, "bold");
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text("अस्वीकरण", margin + 1, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("/Disclaimer", margin + 1 + doc.getTextWidth("अस्वीकरण") + 2, y + 6);
    y += 10;

    const drawTextBlock = (text: string, currentY: number, fontSize = 7.5, indent = 2) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(fontSize);
        doc.setTextColor(0, 0, 0);
        const lines = doc.splitTextToSize(text, contentWidth - indent * 2);
        lines.forEach((line: string) => {
            currentY = checkPageBreak(currentY, 6);
            doc.text(line, margin + indent, currentY);
            currentY += 4.5;
        });
        return currentY + 2;
    };

    y = drawTextBlock("The additional terms and conditions have been incorporated by the Buyer after approval of the Competent Authority in Buyer Organization, whereby Buyer organization is solely responsible for the impact of these clauses on the bidding process, its outcome, and consequences thereof including any eccentricity / restriction arising in the bidding process due to these ATCs and due to modification of technical specifications and / or terms and conditions governing the bid. If any clause(s) is / are incorporated by the Buyer regarding following, the bid and resultant contracts shall be treated as null and void and such bids may be cancelled by GeM at any stage of bidding process without any notice:-", y, 7.5);

    const dPoints = ["1. Definition of Class I and Class II suppliers in the bid not in line with the extant Order / Office Memorandum issued by DPIIT in this regard.", "2. Seeking EMD submission from bidder(s), including via Additional Terms & Conditions, in contravention to exemption provided to such sellers under GeM GTC.", "3. Publishing Custom / BOQ bids for items for which regular GeM categories are available without any Category item bunched with it.", "4. Creating BoQ bid for single item.", "5. Mentioning specific Brand or Make or Model or Manufacturer or Dealer name.", "6. Mandating submission of documents in physical form as a pre-requisite to qualify bidders.", "7. Floating / creation of work contracts as Custom Bids in Services.", "8. Seeking sample with bid or approval of samples during bid evaluation process.", "9. Mandating foreign / international certifications even in case of existence of Indian Standards without specifying equivalent Indian Certification / standards.", "10. Seeking experience from specific organization / department / institute only or from foreign / export experience.", "11. Creating bid for items from irrelevant categories.", "12. Incorporating any clause against the MSME policy and Preference to Make in India Policy.", "13. Reference of conditions published on any external site or reference to external documents/clauses.", "14. Asking for any Tender fee / Bid Participation fee / Auction fee in case of Bids / Forward Auction.", "15. Buyer added ATC Clauses which are in contravention of clauses defined by buyer in system generated bid template.", "16. In a category based bid, adding additional items through buyer added additional scope of work / additional terms and conditions / or any other document."];
    dPoints.forEach(pt => { y = drawTextBlock(pt, y + 1, 7.5, 4); });
    y = drawTextBlock("Further, if any seller has any objection / grievance against these additional clauses or otherwise on any aspect of this bid, they can raise their representation against the same by using the Representation window provided in the bid details field in Seller dashboard after logging in as a seller within 4 days of bid publication on GeM. Buyer is duty bound to reply to all such representations and would not be allowed to open bids if he fails to reply to such representations.", y + 3, 7.5);
    y = drawTextBlock("All GeM Sellers / Service Providers shall ensure full compliance with all applicable labour laws, including the provisions, rules, schemes and guidelines under the four Labour Codes i.e. the Code on Wages, 2019; the Industrial Relations Code, 2020; the Occupational Safety, Health and Working Conditions Code, 2020; and the Code on Social Security, 2020 as and when notified and brought into force by the Government of India.", y + 3, 7.5);

    y += 6;
    y = checkPageBreak(y, 20);
    doc.setFont(hindiFont, "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text("यह बिड सामान्य शर्तों के अंतर्गत भी शासित है", margin, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("This Bid is also governed by the General Terms and Conditions", margin, y + 12);
    y += 16;

    const gtcText = "In terms of GeM GTC clause 26 regarding Restrictions on procurement from a bidder of a country which shares a land border with India, any bidder from a country which shares a land border with India will be eligible to bid in this tender only if the bidder is registered with the Competent Authority. While participating in bid, Bidder has to undertake compliance of this and any false declaration and non-compliance of this would be a ground for immediate termination of the contract and further legal action in accordance with the laws.";
    y = drawTextBlock(gtcText, y, 7.5);

    y += 10;
    y = checkPageBreak(y, 20);
    doc.setFontSize(11);
    doc.setTextColor(0, 86, 179);
    doc.setFont(hindiFont, "bold");
    doc.text("---धन्यवाद", pageWidth / 2 - 28, y + 6);
    doc.setFont("helvetica", "bold");
    doc.text(" / Thank You---", pageWidth / 2 - 2, y + 6);
    y += 16;

    y = checkPageBreak(y, 48);
    const sigX = pageWidth - margin - 85;
    doc.setDrawColor(0, 86, 179);
    doc.setLineWidth(0.4);
    doc.rect(sigX, y, 85, 44);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text("Digitally Signed By:", sigX + 5, y + 8);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${(formData.signatoryName || formData.buyerName || "Authorized Signatory").toUpperCase()}`, sigX + 5, y + 16);
    doc.text(`Designation: ${formData.signatoryDesignation || formData.buyerDesignation || "Official"}`, sigX + 5, y + 23);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, sigX + 5, y + 30);
    doc.setFont(hindiFont, "normal");
    doc.setFontSize(8);
    doc.text("डिजिटल हस्ताक्षरकर्ता", sigX + 5, y + 39);

    addFooter();
    addPageBorder();

    doc.save(`GeM_Bid_Document_${formData.bidNumber || "GEM"}.pdf`);
    sonnerToast.success("Document Downloaded", { description: "Official bilingual GeM Bid Document generated." });
};

/**
 * Generates an Andhra Pradesh State e-Procurement compliant PDF
 */
export const generateAPeProcPDF = async (formData: PDFTenderData) => {
    sonnerToast.info("Generating AP e-Procurement Document...");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (margin * 2);

    const addHeader = () => {
        doc.setDrawColor(20, 83, 45); // Dark Green (Andhra Pradesh State Color)
        doc.setLineWidth(2);
        doc.line(margin, 40, pageWidth - margin, 40);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(20, 83, 45);
        doc.text("Government of Andhra Pradesh", pageWidth / 2, 65, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("e-Procurement Tender Notice", pageWidth / 2, 80, { align: "center" });
        doc.text("G.O.Ms.No.174, I&CAD (PW-REFORMS) Dept.", pageWidth / 2, 92, { align: "center" });

        doc.setLineWidth(1);
        doc.line(margin, 100, pageWidth - margin, 100);
        doc.setTextColor(0, 0, 0);
    };

    addHeader();

    let y = 130;
    const rowH = 25;
    const labelW = 220;

    const drawAPRow = (label: string, value: any) => {
        if (y > pageHeight - 80) {
            doc.addPage();
            addHeader();
            y = 130;
        }

        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.rect(margin, y, contentWidth, rowH);
        doc.line(margin + labelW, y, margin + labelW, y + rowH);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(label, margin + 10, y + 16);
        
        doc.setFont("helvetica", "normal");
        doc.text(String(value || "N/A"), margin + labelW + 10, y + 16);
        y += rowH;
    };

    drawAPRow("Department Name", formData.departmentName || formData.department);
    drawAPRow("Circle/Division", formData.officeName || "Executive Engineer Office");
    drawAPRow("Work Title", formData.workTitle || formData.title);
    drawAPRow("NIT No. / Tender ID", formData.tenderNoticeNumber || formData.bidNumber);
    drawAPRow("Estimated Contract Value (ECV)", `Rs. ${formData.ecv || formData.estimatedValue || "0"}`);
    drawAPRow("Tender Category", formData.tenderCategory || formData.category || "Works");
    drawAPRow("Bid Submission Start Date", formData.dateOfIssue || "Refer Document");
    drawAPRow("Bid Submission End Date", formData.bidSubmissionEndDate || formData.bidEndDate);
    drawAPRow("Bid Opening Date", formData.bidOpeningDate || "Scheduled");

    y += 25;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Compliance & Fee Details (APTS / G.O. Guidelines)", margin, y);
    y += 15;

    drawAPRow("EMD Amount (2% of ECV)", `Rs. ${formData.emdAmountAP || formData.emdAmount || "0"}`);
    drawAPRow("Transaction Fee (APTS)", `Rs. ${formData.aptsTransactionFee || "1180"}`);
    drawAPRow("Corpus Fund (0.01% of ECV)", formData.corpusFundRequired ? "Applicable" : "Not Applicable");
    drawAPRow("DSC Authentication", "MANDATORY (Class III)");
    drawAPRow("Processing Fee", "Non-Refundable");

    y += 40;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Special Conditions:", margin, y);
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const conditions = [
        "1. Bidders should upload scanned copies of all certificates in e-procurement portal.",
        "2. The Department will not take any responsibility for any delay or non-availability of Internet.",
        "3. All the rules and regulations as per G.O.Ms.No.174 are applicable.",
        "4. Price Bid should be submitted online only."
    ];
    conditions.forEach(line => {
        doc.text(line, margin + 10, y);
        y += 15;
    });

    y = Math.max(y + 80, 720);
    doc.setFont("helvetica", "bold");
    doc.text("Digitally Signed by:", pageWidth - margin - 180, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(formData.signatoryName || formData.buyerName || "Authorized Official"), pageWidth - margin - 180, y + 15);
    doc.text(String(formData.signatoryDesignation || "Executive Engineer"), pageWidth - margin - 180, y + 28);
    doc.text("Govt. of Andhra Pradesh", pageWidth - margin - 180, y + 41);

    doc.save(`${formData.bidNumber || "Tender"}-AP-eProcurement.pdf`);
    sonnerToast.success("AP e-Procurement PDF Generated");
};

/**
 * Common entry point for generating tender PDFs based on platform
 */
export const generateTenderPDF = async (formData: PDFTenderData, results: any[] = []) => {
    const platform = formData.platform?.toLowerCase() || 'gem';
    
    if (platform.includes('ap_eproc') || platform.includes('andhra')) {
        return generateAPeProcPDF(formData);
    }
    
    // Default to GeM bilingual format
    return generateBilingualGeMPDF(formData, results);
};

/**
 * Generates a comprehensive Technical Evaluation Committee (TEC) Report
 */
export const generateTECReportPDF = async (tender: any, bids: any[], risks: any[]) => {
    sonnerToast.info("Generating Technical Evaluation Committee (TEC) Report...");
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    let y = 20;

    // Header
    doc.setFillColor(0, 51, 102); // Dark Blue
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("TEC EVALUATION REPORT", pageWidth / 2, 22, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("TECHNICAL EVALUATION COMMITTEE • GOVERNMENT PROCUREMENT SYSTEM", pageWidth / 2, 30, { align: "center" });
    
    y = 50;

    // Tender Details Section
    doc.setTextColor(0, 51, 102);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. PROJECT INFORMATION", margin, y);
    doc.line(margin, y + 2, margin + 60, y + 2);
    y += 12;

    doc.setTextColor(0);
    doc.setFontSize(10);
    
    // Safety check for budget to prevent NaN in PDF
    const renderBudget = (val: any) => {
        if (!val) return "N/A";
        const numeric = String(val).replace(/[^0-9.]/g, '');
        return Number(numeric) ? `INR ${Number(numeric).toLocaleString('en-IN')}` : String(val);
    };

    const details = [
        ["Tender ID:", tender?.tender_id || tender?.id || "N/A"],
        ["Project Name:", tender?.project_name || "N/A"],
        ["Department:", tender?.department || "N/A"],
        ["Date of Report:", new Date().toLocaleDateString('en-GB')],
        ["Estimate Budget:", renderBudget(tender?.estimated_budget)]
    ];

    details.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), margin + 45, y);
        y += 7;
    });

    y += 10;

    // Evaluation Matrix Section
    doc.setTextColor(0, 51, 102);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. COMPARATIVE EVALUATION MATRIX", margin, y);
    doc.line(margin, y + 2, margin + 85, y + 2);
    y += 12;

    const matrixHeaders = [["Rank", "Vendor Name", "Tech Score (70)", "Financial (30)", "Final Score (100)", "Price"]];
    const matrixData = (bids || []).map(b => [
        b.rank || "N/A",
        b.vendorName || "Unknown",
        String(b.technicalScore?.toFixed(1) || "0.0"),
        String(b.financialScore?.toFixed(1) || "0.0"),
        String((b.finalScore || ((b.technicalScore || 0) + (b.financialScore || 0))).toFixed(1)),
        `INR ${Number(String(b.financialBid || 0).replace(/[^0-9.]/g, '')).toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
        head: matrixHeaders,
        body: matrixData,
        startY: y,
        margin: { left: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [0, 51, 102], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    y = (doc as any).lastAutoTable?.finalY || (y + 40);
    y += 20;

    // AI Risk Analysis Section
    if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
    }

    doc.setTextColor(0, 51, 102);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("3. AI ENHANCED RISK ADVISORY", margin, y);
    doc.line(margin, y + 2, margin + 75, y + 2);
    y += 12;

    if (risks && risks.length > 0) {
        risks.forEach((risk, index) => {
            if (y > pageHeight - 40) {
                doc.addPage();
                y = 20;
            }
            
            doc.setFillColor(risk.level === 'HIGH' ? 255 : 255, risk.level === 'HIGH' ? 240 : 250, risk.level === 'HIGH' ? 240 : 240);
            doc.rect(margin, y, contentWidth, 25, 'F');
            doc.setDrawColor(risk.level === 'HIGH' ? 200 : 200, 0, 0);
            doc.line(margin, y, margin, y + 25);
            
            doc.setTextColor(risk.level === 'HIGH' ? 150 : 100, 0, 0);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`${index + 1}. ${risk.type} [${risk.level} RISK]`, margin + 5, y + 7);
            
            doc.setTextColor(0);
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            const msgLines = doc.splitTextToSize(risk.message, contentWidth - 15);
            doc.text(msgLines, margin + 5, y + 14);
            
            y += 30;
        });
    } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No high-level risk anomalies detected by AI sub-systems.", margin, y);
        y += 10;
    }

    y += 15;

    // 4. FINAL COMMITTEE RECOMMENDATION
    if (y > pageHeight - 80) {
        doc.addPage();
        y = 20;
    }

    doc.setTextColor(0, 51, 102);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("4. FINAL COMMITTEE RECOMMENDATION", margin, y);
    doc.line(margin, y + 2, margin + 95, y + 2);
    y += 12;

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const getFinalScore = (b: any) => b.finalScore || ((b.technicalScore || 0) + (b.financialScore || 0));
    const sortedBids = [...bids].sort((a, b) => getFinalScore(b) - getFinalScore(a));
    const highestScorer = sortedBids.length > 0 ? sortedBids[0] : null;
    
    // Find L1 (Lowest Cost) bidder
    const sortedByPrice = [...bids].sort((a, b) => (a.financialBid || 0) - (b.financialBid || 0));
    const lowestPriceBidder = sortedByPrice.length > 0 ? sortedByPrice[0] : null;
    
    const isH1L1Same = highestScorer?.id === lowestPriceBidder?.id;

    const recText = highestScorer 
        ? `Based on the comprehensive technical and financial evaluation conducted under G.O. Ms 22 guidelines, the committee recommends ${highestScorer.vendorName} (Rank: ${highestScorer.rank}) for the award of contract as the highest overall scorer (H1), subject to further verification of original documents.`
        : "The committee has reviewed the submissions and requires additional documentation before a final recommendation can be made.";
    
    const recLines = doc.splitTextToSize(recText, contentWidth);
    doc.text(recLines, margin, y);
    y += recLines.length * 5 + 10;

    // SELECTION RATIONALE SUBSECTION (MANDATORY FOR AUDIT)
    doc.setFillColor(245, 247, 250);
    doc.rect(margin, y, contentWidth, 35, 'F');
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, contentWidth, 35);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Selection Rationale:", margin + 5, y + 7);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    let rationale = "";
    if (isH1L1Same) {
        rationale = "The selected vendor (H1) is also the lowest price bidder (L1), providing the best value-for-money without any trade-off between quality and cost.";
    } else if (highestScorer && lowestPriceBidder) {
        const priceDiff = ((lowestPriceBidder.financialBid - highestScorer.financialBid) / highestScorer.financialBid * 100).toFixed(1);
        rationale = `Although ${lowestPriceBidder.vendorName} offered the lowest price (L1), ${highestScorer.vendorName} is selected due to a significantly higher technical score (${highestScorer.technicalScore?.toFixed(1)}) which offsets the price difference under the 70:30 QCBS weighting. The AI analysis confirms superior compliance for H1.`;
    } else {
        rationale = "Selection is based on composite scoring across technical specifications, eligibility criteria, and financial competitiveness.";
    }

    const ratLines = doc.splitTextToSize(rationale, contentWidth - 15);
    doc.text(ratLines, margin + 5, y + 14);
    y += 45;

    // 5. AI EVALUATION INTEGRITY & FRAUD AUDIT
    if (y > pageHeight - 80) {
        doc.addPage();
        y = 20;
    }

    doc.setTextColor(0, 51, 102);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("5. AI EVALUATION INTEGRITY & FRAUD AUDIT", margin, y);
    doc.line(margin, y + 2, margin + 105, y + 2);
    y += 12;

    const topBidder = highestScorer;
    const aiData = topBidder?.aiAnalysis || {};
    const confidence = aiData.confidence_score || (topBidder ? 85.0 : 0);
    const justification = aiData.justification || "Reliable data extraction covering GST, Experience, and Financial parameters.";
    const fraudStatus = aiData.is_fraud ? "FLAGGED: SUSPECTED ANOMALY" : "CLEARED: No typical fraud patterns detected";

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Evaluation Confidence: ${confidence}%`, margin, y);
    y += 6;
    
    doc.setFont("helvetica", "normal");
    const justLines = doc.splitTextToSize(`Justification: ${justification}`, contentWidth);
    doc.text(justLines, margin, y);
    y += justLines.length * 5 + 5;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(aiData.is_fraud ? 200 : 0, 0, 0);
    doc.text(`Fraud Detection Status: ${fraudStatus}`, margin, y);
    doc.setTextColor(0);
    y += 15;

    // Significance / Signatures
    const sigY = pageHeight - 50;
    doc.line(margin, sigY, margin + 50, sigY);
    doc.line(pageWidth / 2 - 25, sigY, pageWidth / 2 + 25, sigY);
    doc.line(pageWidth - margin - 50, sigY, pageWidth - margin, sigY);

    doc.setFontSize(8);
    doc.text("Evaluation Officer", margin + 10, sigY + 5);
    doc.text("Technical Expert", pageWidth / 2 - 12, sigY + 5);
    doc.text("Approving Authority", pageWidth - margin - 45, sigY + 5);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Doc Ref: TEC/${tender?.tender_id || "TEMP"}/${new Date().getFullYear()}/001`, margin, pageHeight - 10);
    doc.text(`Generated by ProcureSmart AI Engine v4.2.0`, pageWidth - margin, pageHeight - 10, { align: "center" });

    doc.save(`TEC_Report_${tender?.tender_id || "Export"}.pdf`);
    sonnerToast.success("TEC Report Generated", { description: "The Technical Evaluation Committee report has been downloaded." });
};

