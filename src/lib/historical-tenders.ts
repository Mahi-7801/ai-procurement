export interface HistoricalTender {
    id: string;
    title: string;
    platform: string;
    date: string;
    fileUrl: string;
    category?: string;
    templateData?: Record<string, any>;
}

export const HISTORICAL_TENDERS: Record<string, HistoricalTender[]> = {
    "Computers": [
        {
            id: "GEM-8830610",
            title: "Supply of High Performance Laptops",
            platform: "GeM",
            date: "2024-11-15",
            fileUrl: "/TenderEase Docs/Products/IT Products/GeM-Bidding-8830610.pdf",
            templateData: {
                bidTitle: "Procurement of High-End Laptops for Research Lab",
                ministry: "Ministry of Education",
                department: "Higher Education Department",
                organisation: "NIT Andhra Pradesh",
                quantity: "50",
                unit: "Nos",
                deliveryPeriod: "45",
                emdAmount: "125000",
                minTurnover: "250"
            }
        },
        { id: "GEM-8841310", title: "Desktop Computers for Govt Offices", platform: "GeM", date: "2024-10-20", fileUrl: "/TenderEase Docs/Products/IT Products/GeM-Bidding-8841310.pdf" },
        { id: "GEM-8850546", title: "Server Infrastructure Upgrade", platform: "GeM", date: "2024-12-05", fileUrl: "/TenderEase Docs/Products/IT Products/GeM-Bidding-8850546.pdf" },
        { id: "GEM-8887974", title: "IT Accessories and Peripherals", platform: "GeM", date: "2025-01-10", fileUrl: "/TenderEase Docs/Products/IT Products/GeM-Bidding-8887974.pdf" }
    ],
    "Office Machines": [
        { id: "GEM-8811633", title: "Multi-function Printers Multi-lot", platform: "GeM", date: "2024-09-12", fileUrl: "/TenderEase Docs/Products/office Machines/GeM-Bidding-8811633.pdf" },
        { id: "GEM-8850254", title: "Digital Photocopier Machines", platform: "GeM", date: "2024-11-30", fileUrl: "/TenderEase Docs/Products/office Machines/GeM-Bidding-8850254.pdf" }
    ],
    "Automobiles": [
        { id: "GEM-8847645", title: "Electrical Passenger Vehicles", platform: "GeM", date: "2024-10-25", fileUrl: "/TenderEase Docs/Products/Auto Mobiles/GeM-Bidding-8847645.pdf" },
        { id: "GEM-888212", title: "Utility Vehicles for Field Staff", platform: "GeM", date: "2025-01-05", fileUrl: "/TenderEase Docs/Products/Auto Mobiles/GeM-Bidding-888212.pdf" }
    ],
    "Furniture": [
        { id: "GEM-8591478", title: "Modular Office Workstations", platform: "GeM", date: "2024-08-15", fileUrl: "/TenderEase Docs/Products/Furniture/GeM-Bidding-8591478.pdf" },
        { id: "GEM-8817224", title: "Steel Almirahs and Storage Units", platform: "GeM", date: "2024-09-20", fileUrl: "/TenderEase Docs/Products/Furniture/GeM-Bidding-8817224.pdf" }
    ],
    "Softwares": [
        { id: "GEM-8360914", title: "ERP Software Implementation", platform: "GeM", date: "2024-07-10", fileUrl: "/TenderEase Docs/Products/Softwares/GeM-Bidding-8360914.pdf" },
        { id: "GEM-8555556", title: "Antivirus and Security Software", platform: "GeM", date: "2024-08-25", fileUrl: "/TenderEase Docs/Products/Softwares/GeM-Bidding-8555556.pdf" }
    ],
    "Facility Management": [
        {
            id: "GEM-8049040",
            title: "Outsourced Housekeeping Services",
            platform: "GeM",
            date: "2024-06-05",
            fileUrl: "/TenderEase Docs/services/GeM-Bidding-8049040.pdf",
            templateData: {
                bidTitle: "Housekeeping and Facility Management Services",
                ministry: "Ministry of Health",
                department: "Public Health",
                organisation: "Govt General Hospital",
                contractPeriod: "2 Year(s)",
                scopeOfWork: "Complete housekeeping and cleaning services for hospital premises including specialized wing sanitation.",
                emdAmount: "85000",
                minTurnover: "100"
            }
        },
        { id: "GEM-8416250", title: "Catering Services for Govt Hostel", platform: "GeM", date: "2024-09-15", fileUrl: "/TenderEase Docs/services/GeM-Bidding-8416250.pdf" },
        { id: "GEM-8555707", title: "Security Personnel Services", platform: "GeM", date: "2024-10-10", fileUrl: "/TenderEase Docs/services/GeM-Bidding-8555707.pdf" }
    ],
    "IREPS": [
        { id: "IREPS-2024", title: "Indian Railways Electronic Procurement System Sample", platform: "IREPS", date: "2024-12-20", fileUrl: "/TenderEase Docs/ireps/ireps.pdf" }
    ],
    "CPP": [
        { id: "CPP-GVMC", title: "Greater Visakhapatnam Municipal Corporation RFP", platform: "CPP/eProcurement", date: "2024-11-01", fileUrl: "/TenderEase Docs/e procurement/GVMC+RFP+FINAL.pdf" }
    ]
};

export const getHistoricalTenders = (category: string, platform?: string): HistoricalTender[] => {
    let results: HistoricalTender[] = [];

    // Check by category
    if (HISTORICAL_TENDERS[category]) {
        results = [...results, ...HISTORICAL_TENDERS[category]];
    }

    // If a specific platform is requested, filter results
    if (platform) {
        const normalizedPlatform = platform.toLowerCase();

        // Map common portal names to our internal HISTORICAL_TENDERS keys
        const platformMap: Record<string, string> = {
            "gem": "GeM",
            "ireps": "IREPS",
            "cpp": "CPP",
            "cppp": "CPP",
            "ap_eproc": "CPP" // Using CPP samples for AP eProc as a fallback
        };

        const targetKey = platformMap[normalizedPlatform];

        // Filter the category results by platform
        let filtered = results.filter(t => t.platform.toLowerCase() === normalizedPlatform || (targetKey && t.platform === targetKey));

        // If no results for this category/platform, add the platform's general samples
        if (filtered.length === 0 && targetKey && HISTORICAL_TENDERS[targetKey]) {
            filtered = HISTORICAL_TENDERS[targetKey];
        }

        return filtered;
    }

    return results;
};
