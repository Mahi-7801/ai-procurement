import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    ArrowRight, ArrowLeft, CheckCircle2, Package, Briefcase,
    AlertCircle, Shield, Download, Sparkles, Plus, Trash2, Building2, Gavel, Scale,
    ChevronRight, Check, IndianRupee, Zap, ScanSearch, Activity, Calendar, Loader2
} from "lucide-react";
import { analyzeDocument } from "@/services/aiService";
import { toast } from "sonner";
import { addTender } from "@/lib/mock-data";
import { useHistoricalTenders } from "@/hooks/useHistoricalTenders";
import { API_BASE_URL } from "@/config";

interface TechParam { slNo: string; parameter: string; requirement: string; optional?: boolean; }
interface ConsigneeDetail { name: string; address: string; quantity: string; contactPerson: string; contactNumber: string; }
interface BoqItem { slNo: string; description: string; quantity: string; unit: string; unitPrice: string; totalPrice: string; }
interface ManpowerReq { role: string; qualification: string; experience: string; quantity: string; }

interface GemTenderData {
    ministry: string; department: string; organisation: string; officeName: string;
    bidNumber: string; bidType: "Open" | "Limited" | "Custom" | "Single Source";
    procurementCategory: "Product" | "Service"; title: string; category: string;
    estimatedValue: string; bidValidity: string; contractDuration: string;
    location: string; dateOfIssue: string; bidEndDate: string; bidOpeningDate: string;
    buyerName: string; buyerDesignation: string; buyerAddress: string;
    buyerContact: string; buyerEmail: string; buyerGstin: string;
    emdRequired: string; emdAmount: string; emdExemption: boolean;
    emdValidity: string; emdMode: string; epbgRequired: string;
    epbgPercentage: string; epbgValidity: string;
    itemName: string; itemDescription: string; quantity: string; unit: string;
    installationRequired: boolean; testingRequired: boolean;
    mandatoryParams: TechParam[]; consigneeDetails: ConsigneeDetail[];
    serviceName: string; serviceDescription: string; manpower: ManpowerReq[];
    slaPercent: string; uptimePercent: string; slaPenalty: string;
    reportingFreq: string; kpiDetails: string; escalationMatrix: string;
    experienceYears: string; similarProjects: string; turnover: string;
    netWorthRequired: boolean; docsPan: boolean; docsGst: boolean;
    docsMsme: boolean; docsOemAuth: boolean; docsMii: boolean;
    evaluationMethod: "L1" | "QCBS" | ""; techWeightage: string;
    finWeightage: string; reverseAuction: string; boqItems: BoqItem[];
    warrantyPeriod: string; warrantyType: "Comprehensive" | "Non-Comprehensive";
    amcRequired: boolean; amcDuration: string; deliveryPeriod: string;
    ldPercentage: string; ldMaxCap: string; miiApplicable: boolean;
    msmePreference: boolean; arbitrationClause: string; optionClause: string;
    inspectionAuthority: string; inspectionLocation: string;
    signatoryName: string; signatoryDesignation: string;
    declarationNoBlacklist: boolean; declarationTrueInfo: boolean;
    declarationNoConflict: boolean; agreementToTerms: boolean; paymentTerms: string;
}

const STEPS = [
    { title: "Basic Info", subtitle: "Office & Title", icon: <Building2 className="w-4 h-4" /> },
    { title: "Timeline", subtitle: "Dates & Security", icon: <Calendar className="w-4 h-4" /> },
    { title: "Technical", subtitle: "Specifications", icon: <Activity className="w-4 h-4" /> },
    { title: "Eligibility", subtitle: "Requirements", icon: <Shield className="w-4 h-4" /> },
    { title: "Evaluation", subtitle: "Price & Method", icon: <Scale className="w-4 h-4" /> },
    { title: "Compliance", subtitle: "Terms & Policies", icon: <Gavel className="w-4 h-4" /> },
];

function Field({ label, children, half, required }: { label: string; children: React.ReactNode; half?: boolean; required?: boolean }) {
    return (
        <div className={`flex flex-col gap-1.5 ${half ? "" : ""}`}>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {label} {required && <span className="text-rose-500 ml-0.5">*</span>}
            </Label>
            {children}
        </div>
    );
}

function SectionHeading({ title, color = "blue" }: { title: string; color?: string }) {
    const colors: Record<string, string> = {
        blue: "bg-blue-600", green: "bg-emerald-500", amber: "bg-amber-500",
        red: "bg-red-500", purple: "bg-purple-500",
    };
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className={`w-1 h-5 rounded-full ${colors[color] || colors.blue}`} />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
        </div>
    );
}

export default function GemTenderWizard({ portal }: { portal: string }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isHistOpen, setIsHistOpen] = useState(false);
    const [histSearch, setHistSearch] = useState("");
    const [analyzing, setAnalyzing] = useState(false);

    const [formData, setFormData] = useState<GemTenderData>({
        ministry: "", department: "",
        organisation: "", officeName: "",
        bidNumber: "", bidType: "Open", procurementCategory: "Product",
        title: "", category: "Computers & IT", estimatedValue: "",
        bidValidity: "", contractDuration: "", location: "",
        dateOfIssue: new Date().toISOString().split('T')[0],
        bidEndDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
        bidOpeningDate: new Date(Date.now() + 22 * 86400000).toISOString().split('T')[0],
        buyerName: "", buyerDesignation: "",
        buyerAddress: "",
        buyerContact: "", buyerEmail: "",
        buyerGstin: "",
        emdRequired: "No", emdAmount: "", emdExemption: false,
        emdValidity: "", emdMode: "", epbgRequired: "No",
        epbgPercentage: "", epbgValidity: "",
        itemName: "", itemDescription: "", quantity: "", unit: "",
        installationRequired: false, testingRequired: false,
        mandatoryParams: [],
        consigneeDetails: [],
        serviceName: "", serviceDescription: "",
        manpower: [],
        slaPercent: "", uptimePercent: "", slaPenalty: "",
        reportingFreq: "", kpiDetails: "",
        escalationMatrix: "",
        experienceYears: "", similarProjects: "", turnover: "",
        netWorthRequired: false, docsPan: false, docsGst: false,
        docsMsme: false, docsOemAuth: false, docsMii: false,
        evaluationMethod: "", techWeightage: "", finWeightage: "",
        reverseAuction: "Disabled", boqItems: [],
        warrantyPeriod: "", warrantyType: "Comprehensive",
        amcRequired: false, amcDuration: "", deliveryPeriod: "",
        ldPercentage: "", ldMaxCap: "", miiApplicable: false,
        msmePreference: false, arbitrationClause: "",
        optionClause: "", inspectionAuthority: "",
        inspectionLocation: "", signatoryName: "",
        signatoryDesignation: "",
        declarationNoBlacklist: false, declarationTrueInfo: false,
        declarationNoConflict: false, agreementToTerms: false,
        paymentTerms: "",
    });

    const { data: historicalTenders, isLoading: isHistLoading } = useHistoricalTenders(histSearch, formData.category);

    useEffect(() => {
        if (!formData.bidNumber) {
            const random = Math.floor(Math.random() * 9000000) + 1000000;
            setFormData(prev => ({ ...prev, bidNumber: `GEM/2026/B/${random}` }));
        }
    }, [formData.bidNumber]);

    const sanitizeDate = (dateStr: string) => {
        if (!dateStr || dateStr === "As per NIT") return "";
        // Clean time part if present
        const cleanDate = dateStr.split(' ')[0];
        const parts = cleanDate.includes('-') ? cleanDate.split('-') : cleanDate.split('/');
        if (parts.length === 3) {
            let [d, m, y] = parts;
            if (d.length === 4) return cleanDate; // Already yyyy-mm-dd
            // Expected dd-mm-yyyy -> yyyy-mm-dd
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        return cleanDate;
    };

    const sanitizeNumber = (numStr: string) => {
        if (!numStr || numStr === "As per NIT") return "";
        const match = String(numStr).match(/[\d.]+/);
        return match ? match[0] : "";
    };

    const handleAnalyze = async () => {
        if (!formData.title && !formData.itemDescription) {
            toast.error("Please enter a Title or Description first for AI to analyze.");
            return;
        }

        const queryText = `${formData.title} ${formData.itemDescription}`;
        setAnalyzing(true);

        const analysisPromise = analyzeDocument(queryText, portal, 1);

        toast.promise(analysisPromise, {
            loading: `AI is suggesting fields for "${formData.title}"...`,
            success: (result: any) => {
                setAnalyzing(false);
                if (result.extractedData) {
                    const d = result.extractedData;

                    // Helper to safely convert AI response to boolean
                    const toBool = (val: any) => {
                        if (val === true || val === 1) return true;
                        if (typeof val === 'string') {
                            const v = val.toLowerCase();
                            return v === "yes" || v === "true" || v === "enabled" || v === "required";
                        }
                        return false;
                    };

                    setFormData(prev => ({
                        ...prev,
                        // Basic Info
                        ministry: d.ministry || prev.ministry,
                        department: d.department || prev.department,
                        organisation: d.organisation || prev.organisation,
                        officeName: d.office || d.officeName || prev.officeName,
                        bidType: d.bidType || prev.bidType,
                        procurementCategory: d.procurementCategory || prev.procurementCategory,
                        title: d.title || d.category || prev.title,
                        category: d.category || prev.category,
                        location: d.location || d.office || prev.location,

                        // Values & Timelines
                        estimatedValue: sanitizeNumber(d.estimatedValue) || prev.estimatedValue,
                        bidValidity: sanitizeNumber(d.validity || d.bidValidity) || prev.bidValidity,
                        contractDuration: sanitizeNumber(d.contractDuration || d.epbgDuration) || prev.contractDuration,
                        bidEndDate: sanitizeDate(d.endDate || d.bidEndDate) || prev.bidEndDate,
                        bidOpeningDate: sanitizeDate(d.openingDate || d.bidOpeningDate) || prev.bidOpeningDate,

                        // Buyer Details
                        buyerName: d.beneficiary || d.buyerName || prev.buyerName,
                        buyerDesignation: d.buyerDesignation || prev.buyerDesignation,
                        buyerAddress: d.buyerAddress || prev.buyerAddress,
                        buyerContact: d.buyerContact || prev.buyerContact,
                        buyerEmail: d.buyerEmail || prev.buyerEmail,
                        buyerGstin: d.buyerGstin || prev.buyerGstin,

                        // Security (EMD/EPBG)
                        emdRequired: d.emdRequired || prev.emdRequired,
                        emdAmount: sanitizeNumber(d.emdAmount) || prev.emdAmount,
                        emdExemption: toBool(d.mseExemption || d.emdExemption),
                        emdValidity: sanitizeNumber(d.emdValidity) || prev.emdValidity,
                        emdMode: d.emdMode || prev.emdMode,
                        epbgRequired: d.epbgRequired || (d.epbgPercentage && parseFloat(d.epbgPercentage) > 0 ? "Yes" : prev.epbgRequired),
                        epbgPercentage: sanitizeNumber(d.epbgPercentage) || prev.epbgPercentage,
                        epbgValidity: sanitizeNumber(d.epbgValidity || d.epbgDuration) || prev.epbgValidity,

                        // Technical / Product / Service
                        itemName: d.itemName || d.category || prev.itemName,
                        itemDescription: d.itemDescription || d.clauses || prev.itemDescription,
                        quantity: sanitizeNumber(d.quantity) || prev.quantity,
                        unit: d.unit || prev.unit,
                        installationRequired: toBool(d.installationRequired),
                        testingRequired: toBool(d.testingRequired),
                        serviceName: d.serviceName || prev.serviceName,
                        serviceDescription: d.serviceDescription || prev.serviceDescription,

                        // Service Specific (SLA)
                        slaPercent: sanitizeNumber(d.slaPercent) || prev.slaPercent,
                        uptimePercent: sanitizeNumber(d.uptimePercent) || prev.uptimePercent,
                        slaPenalty: d.slaPenalty || prev.slaPenalty,
                        reportingFreq: d.reportingFreq || prev.reportingFreq,
                        kpiDetails: d.kpiDetails || prev.kpiDetails,
                        escalationMatrix: d.escalationMatrix || prev.escalationMatrix,

                        // Eligibility
                        experienceYears: sanitizeNumber(d.experience || d.experienceYears) || prev.experienceYears,
                        similarProjects: d.similarProjects || prev.similarProjects,
                        turnover: sanitizeNumber(d.bidderTurnover || d.turnover) || prev.turnover,
                        netWorthRequired: toBool(d.netWorthRequired),

                        // Documents required (Booleans)
                        docsPan: toBool(d.docsPan),
                        docsGst: toBool(d.docsGst),
                        docsMsme: toBool(d.docsMsme || d.msePreference),
                        docsOemAuth: toBool(d.docsOemAuth || (d.docRequired?.toLowerCase().includes("oem"))),
                        docsMii: toBool(d.docsMii || d.miiPreference),

                        // Evaluation
                        evaluationMethod: d.evaluationMethod || prev.evaluationMethod,
                        techWeightage: sanitizeNumber(d.techWeightage) || prev.techWeightage,
                        finWeightage: sanitizeNumber(d.finWeightage) || prev.finWeightage,
                        reverseAuction: d.reverseAuction || prev.reverseAuction,

                        // Complex Arrays (New)
                        mandatoryParams: d.mandatoryParams ? d.mandatoryParams.map((p: any, i: number) => ({
                            slNo: (i + 1).toString(),
                            parameter: p.parameter || "",
                            requirement: p.requirement || ""
                        })) : prev.mandatoryParams,

                        consigneeDetails: d.consigneeDetails ? d.consigneeDetails.map((c: any) => ({
                            name: c.name || "",
                            address: c.address || "",
                            quantity: c.quantity || "",
                            contactPerson: c.contactPerson || "As per NIT",
                            contactNumber: c.contactNumber || "As per NIT"
                        })) : prev.consigneeDetails,

                        boqItems: d.boqItems ? d.boqItems.map((b: any, i: number) => ({
                            slNo: (i + 1).toString(),
                            description: b.description || "",
                            quantity: b.quantity || "",
                            unit: b.unit || "Nos",
                            unitPrice: b.unitPrice || "0",
                            totalPrice: (parseFloat(b.quantity || "0") * parseFloat(b.unitPrice || "0")).toString()
                        })) : prev.boqItems,

                        // Post-Award / Compliance
                        warrantyPeriod: sanitizeNumber(d.warrantyPeriod) || prev.warrantyPeriod,
                        warrantyType: d.warrantyType || prev.warrantyType,
                        amcRequired: toBool(d.amcRequired),
                        amcDuration: sanitizeNumber(d.amcDuration) || prev.amcDuration,
                        deliveryPeriod: sanitizeNumber(d.deliveryPeriod) || prev.deliveryPeriod,
                        ldPercentage: sanitizeNumber(d.ldPercentage) || prev.ldPercentage,
                        ldMaxCap: sanitizeNumber(d.ldMaxCap) || prev.ldMaxCap,
                        miiApplicable: toBool(d.miiApplicable || d.miiPreference),
                        msmePreference: toBool(d.msmePreference || d.msePreference),
                        arbitrationClause: d.arbitrationClause || d.arbitration || prev.arbitrationClause,
                        optionClause: d.optionClause || prev.optionClause,
                        inspectionAuthority: d.inspectionAuthority || prev.inspectionAuthority,
                        inspectionLocation: d.inspectionLocation || prev.inspectionLocation,
                        signatoryName: d.signatoryName || prev.signatoryName,
                        signatoryDesignation: d.signatoryDesignation || prev.signatoryDesignation,
                        paymentTerms: d.paymentTerms || prev.paymentTerms,
                        declarationNoBlacklist: toBool(d.declarationNoBlacklist),
                        declarationTrueInfo: toBool(d.declarationTrueInfo),
                        declarationNoConflict: toBool(d.declarationNoConflict),
                        agreementToTerms: toBool(d.agreementToTerms),
                    }));
                    return "AI Auto-Fill successful!";
                }
                return "AI suggested some fields.";
            },
            error: (err) => {
                setAnalyzing(false);
                console.error("AI Analysis error:", err);
                return "AI Auto-Fill failed. Please check your connection.";
            }
        });
    };

    const set = (name: string, value: any) => setFormData(prev => ({ ...prev, [name]: value }));
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        set(name, type === "checkbox" ? (e.target as HTMLInputElement).checked : value);
    };

    const scrollTop = () => {
        const el = document.getElementById("wizard-content");
        if (el) el.scrollTo({ top: 0, behavior: "smooth" });
    };
    const nextStep = () => { scrollTop(); setStep(p => Math.min(p + 1, 6)); };
    const prevStep = () => { scrollTop(); setStep(p => Math.max(p - 1, 1)); };

    const isStep1Valid = () => {
        return !!(
            formData.ministry.trim() &&
            formData.department.trim() &&
            formData.organisation.trim() &&
            formData.officeName.trim() &&
            formData.title.trim() &&
            formData.estimatedValue.trim() &&
            formData.location.trim() &&
            formData.buyerName.trim() &&
            formData.buyerDesignation.trim() &&
            formData.buyerContact.trim() &&
            formData.buyerEmail.trim()
        );
    };

    const canContinue = step === 1 ? isStep1Valid() : true;

    const inputCls = "h-10 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all";
    const selectCls = "h-10 rounded-lg border border-slate-200 bg-white text-sm font-medium";

    return (
        <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-8rem)] min-h-[600px] w-full overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">

            {/* ── SIDEBAR ── */}
            <div className="w-full md:w-56 flex-shrink-0 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col p-4 md:p-5 gap-3 md:gap-5 overflow-x-auto">
                {/* Logo */}
                <div className="hidden md:flex items-center gap-3 pb-6 border-b border-slate-100">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Wizard</p>
                        <p className="text-[10px] text-slate-400 font-medium">GeM Portal v1.0</p>
                    </div>
                </div>

                {/* Steps */}
                <nav className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide md:flex-1">
                    {STEPS.map((s, idx) => {
                        const cur = step === idx + 1;
                        const done = step > idx + 1;
                        return (
                            <button
                                key={idx}
                                onClick={() => idx + 1 <= step && setStep(idx + 1)}
                                className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-3 rounded-xl text-left transition-all duration-300 flex-shrink-0 ${cur
                                    ? "bg-white shadow-md shadow-blue-500/5 ring-1 ring-slate-200 text-blue-600"
                                    : done
                                        ? "text-slate-600 hover:bg-white hover:shadow-sm"
                                        : "text-slate-400 cursor-not-allowed"
                                    }`}
                            >
                                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${cur
                                    ? "bg-blue-600 text-white"
                                    : done
                                        ? "bg-emerald-100 text-emerald-600"
                                        : "bg-slate-200 text-slate-400"
                                    }`}>
                                    {done ? <Check className="w-3 md:w-3.5 h-3 md:h-3.5" /> : idx + 1}
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${cur ? "text-blue-700" : "text-slate-700"}`}>{s.title}</p>
                                    <p className="hidden md:block text-[9px] text-slate-400 truncate font-medium">{s.subtitle}</p>
                                </div>
                            </button>
                        );
                    })}
                </nav>

                {/* Progress */}
                <div className="hidden md:block pt-4 border-t border-slate-200">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>Progress</span>
                        <span className="font-semibold text-blue-600">{Math.round(((step - 1) / 5) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 5) * 100}%` }} />
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div id="wizard-content" className="flex-1 flex flex-col overflow-hidden">

                {/* Top bar */}
                <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center justify-between px-4 md:px-8 py-4 border-b border-slate-100 bg-white gap-4">
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Step {step} of 6</p>
                        <h2 className="text-lg font-bold text-slate-800">{STEPS[step - 1].title} — <span className="text-slate-500 font-normal">{STEPS[step - 1].subtitle}</span></h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <div className="text-left lg:text-right w-full sm:w-auto mb-2 sm:mb-0">
                            <p className="text-xs text-slate-400">Bid Reference</p>
                            <p className="text-sm font-mono font-semibold text-blue-600">{formData.bidNumber}</p>
                        </div>
                        <input
                            type="file"
                            id="ref-upload"
                            className="hidden"
                            accept=".pdf"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setAnalyzing(true);
                                toast.loading("Analyzing reference document...");

                                const formDataArr = new FormData();
                                formDataArr.append("file", file);
                                formDataArr.append("source", portal);

                                try {
                                    const response = await fetch(`${API_BASE_URL || ''}/api/tender-draft/analyze-pdf`, {
                                        method: 'POST',
                                        body: formDataArr
                                    });
                                    const result = await response.json();
                                    if (result.extracted_data) {
                                        // Use the same logic as handleAnalyze but with the result
                                        const d = result.extracted_data;
                                        const toBool = (val: any) => {
                                            if (val === true || val === 1) return true;
                                            if (typeof val === 'string') {
                                                const v = val.toLowerCase();
                                                return v === "yes" || v === "true" || v === "enabled" || v === "required";
                                            }
                                            return false;
                                        };
                                        setFormData(prev => ({
                                            ...prev,
                                            ministry: d.ministry || prev.ministry,
                                            department: d.department || prev.department,
                                            organisation: d.organisation || prev.organisation,
                                            officeName: d.office || d.officeName || prev.officeName,
                                            title: d.title || d.category || prev.title,
                                            category: d.category || prev.category,
                                            estimatedValue: sanitizeNumber(d.estimatedValue) || prev.estimatedValue,
                                            bidEndDate: sanitizeDate(d.endDate || d.bidEndDate) || prev.bidEndDate,
                                            // ... other fields as needed
                                        }));
                                        toast.success("Document analyzed and fields populated!");
                                    }
                                } catch (err) {
                                    toast.error("Failed to analyze PDF");
                                } finally {
                                    setAnalyzing(false);
                                }
                            }}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('ref-upload')?.click()}
                            className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                            <Download className="w-4 h-4" /> Upload Reference PDF
                        </Button>

                        <Dialog open={isHistOpen} onOpenChange={setIsHistOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 text-slate-600 border-slate-200 hover:bg-slate-50">
                                    <ScanSearch className="w-4 h-4" /> History Sync
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl rounded-xl p-6">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-bold">Historical Bids</DialogTitle>
                                    <DialogDescription>Search and import from past tenders</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3 pt-2">
                                    <div className="relative">
                                        <ScanSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input placeholder="Search keyword..." className="pl-9" value={histSearch} onChange={e => setHistSearch(e.target.value)} />
                                    </div>
                                    {isHistLoading ? (
                                        <p className="text-center text-sm text-slate-400 py-8">Loading...</p>
                                    ) : !historicalTenders?.length ? (
                                        <div className="text-center py-8 text-slate-400">
                                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                            <p className="text-sm">No matches found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-80 overflow-y-auto">
                                            {historicalTenders.map(bid => (
                                                <button key={bid.id} onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev, title: bid.title,
                                                        category: bid.category || prev.category,
                                                        ministry: bid.ministry || prev.ministry,
                                                        department: bid.department || prev.department,
                                                        estimatedValue: bid.estimated_value?.toString() || prev.estimatedValue,
                                                        emdAmount: bid.emd_amount?.toString() || prev.emdAmount,
                                                        ...(bid.template_data || {})
                                                    }));
                                                    setIsHistOpen(false);
                                                    toast.success(`Synced: ${bid.bid_number}`);
                                                }} className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all">
                                                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">{bid.title}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{bid.bid_number} · ₹{bid.estimated_value?.toLocaleString()}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                        >
                            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            AI Auto-Fill
                        </Button>
                    </div>
                </div>

                {/* Form area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">

                    {/* ── STEP 1: Basic Info ── */}
                    {step === 1 && (
                        <div className="space-y-6 md:space-y-8 max-w-4xl animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <SectionHeading title="Office Details" color="blue" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Ministry" required>
                                        <Input name="ministry" value={formData.ministry} onChange={handleChange} className={inputCls} placeholder="Enter Ministry Name" />
                                    </Field>
                                    <Field label="Department" required>
                                        <Input name="department" value={formData.department} onChange={handleChange} className={inputCls} placeholder="Enter Department Name" />
                                    </Field>
                                    <Field label="Organisation" required>
                                        <Input name="organisation" value={formData.organisation} onChange={handleChange} className={inputCls} placeholder="Enter Organisation Name" />
                                    </Field>
                                    <Field label="Office Name" required>
                                        <Input name="officeName" value={formData.officeName} onChange={handleChange} className={inputCls} placeholder="Enter Office Name" />
                                    </Field>
                                </div>
                            </div>

                            <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <SectionHeading title="Tender Details" color="green" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Tender Title" required>
                                        <div className="flex gap-2">
                                            <Input
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                className={inputCls}
                                                placeholder="e.g. Supply of Laptops"
                                            />
                                            {formData.title && !analyzing && (
                                                <Button
                                                    size="sm"
                                                    onClick={handleAnalyze}
                                                    className="h-10 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-500/20 animate-pulse flex-shrink-0"
                                                    title="Suggest fields based on this title"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </Field>
                                    <Field label="Estimated Budget (₹)" required>
                                        <Input type="number" name="estimatedValue" value={formData.estimatedValue} onChange={handleChange} className={inputCls} placeholder="0.00" />
                                    </Field>
                                    <Field label="Bid Type">
                                        <Select value={formData.bidType} onValueChange={v => set("bidType", v)}>
                                            <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Open">Open</SelectItem>
                                                <SelectItem value="Limited">Limited</SelectItem>
                                                <SelectItem value="Custom">Custom</SelectItem>
                                                <SelectItem value="Single Source">Single Source</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Category Type">
                                        <Select value={formData.procurementCategory} onValueChange={v => set("procurementCategory", v)}>
                                            <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Product">Product</SelectItem>
                                                <SelectItem value="Service">Service</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Floating Date">
                                        <Input type="date" name="dateOfIssue" value={formData.dateOfIssue} onChange={handleChange} className={inputCls} />
                                    </Field>
                                    <Field label="Delivery Location" required>
                                        <Input name="location" value={formData.location} onChange={handleChange} className={inputCls} placeholder="Enter City/State (e.g. Hyderabad, AP)" />
                                    </Field>
                                </div>
                            </div>

                            <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <SectionHeading title="Buyer Details" color="purple" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Buyer Name" required>
                                        <Input name="buyerName" value={formData.buyerName} onChange={handleChange} className={inputCls} placeholder="Full Name" />
                                    </Field>
                                    <Field label="Designation" required>
                                        <Input name="buyerDesignation" value={formData.buyerDesignation} onChange={handleChange} className={inputCls} placeholder="e.g. Deputy Director" />
                                    </Field>
                                    <Field label="Contact Phone" required>
                                        <Input name="buyerContact" value={formData.buyerContact} onChange={handleChange} className={inputCls} placeholder="Phone Number" />
                                    </Field>
                                    <Field label="Email ID" required>
                                        <Input name="buyerEmail" value={formData.buyerEmail} onChange={handleChange} className={inputCls} placeholder="email@example.com" />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Timeline & Security ── */}
                    {step === 2 && (
                        <div className="space-y-6 md:space-y-8 max-w-4xl animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <SectionHeading title="Important Dates" color="amber" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Bid Submission End Date">
                                        <Input type="date" name="bidEndDate" value={formData.bidEndDate} onChange={handleChange} className={inputCls} />
                                    </Field>
                                    <Field label="Bid Opening Date">
                                        <Input type="date" name="bidOpeningDate" value={formData.bidOpeningDate} onChange={handleChange} className={inputCls} />
                                    </Field>
                                    <Field label="Bid Validity (Days)">
                                        <Input type="number" name="bidValidity" value={formData.bidValidity} onChange={handleChange} className={inputCls} placeholder="e.g. 180" />
                                    </Field>
                                    <Field label="Contract Duration (Months)">
                                        <Input type="number" name="contractDuration" value={formData.contractDuration} onChange={handleChange} className={inputCls} placeholder="e.g. 12" />
                                    </Field>
                                </div>
                            </div>

                            <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <SectionHeading title="EMD & Security Deposit" color="red" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="EMD Required">
                                        <Select value={formData.emdRequired} onValueChange={v => set("emdRequired", v)}>
                                            <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes — Required</SelectItem>
                                                <SelectItem value="No">No — Exempted</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    {formData.emdRequired === "Yes" && (
                                        <>
                                            <Field label="EMD Amount (₹)">
                                                <Input type="number" name="emdAmount" value={formData.emdAmount} onChange={handleChange} className={inputCls} placeholder="0.00" />
                                            </Field>
                                            <Field label="EMD Mode">
                                                <Input name="emdMode" value={formData.emdMode} onChange={handleChange} className={inputCls} placeholder="e.g. Online/BG" />
                                            </Field>
                                            <Field label="EMD Validity (Days)">
                                                <Input type="number" name="emdValidity" value={formData.emdValidity} onChange={handleChange} className={inputCls} placeholder="e.g. 45" />
                                            </Field>
                                        </>
                                    )}
                                    <Field label="ePBG Required">
                                        <Select value={formData.epbgRequired} onValueChange={v => set("epbgRequired", v)}>
                                            <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes — Enforced</SelectItem>
                                                <SelectItem value="No">No — Waived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    {formData.epbgRequired === "Yes" && (
                                        <>
                                            <Field label="ePBG Percentage (%)">
                                                <Input type="number" name="epbgPercentage" value={formData.epbgPercentage} onChange={handleChange} className={inputCls} placeholder="e.g. 3" />
                                            </Field>
                                            <Field label="ePBG Validity (Months)">
                                                <Input type="number" name="epbgValidity" value={formData.epbgValidity} onChange={handleChange} className={inputCls} placeholder="e.g. 14" />
                                            </Field>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">Reverse Auction</p>
                                    <p className="text-xs text-slate-400">Rule-based price optimization engine</p>
                                </div>
                                <Select value={formData.reverseAuction} onValueChange={v => set("reverseAuction", v)}>
                                    <SelectTrigger className="w-36 h-9 rounded-lg border-slate-200 text-sm font-medium">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Enabled">Enabled</SelectItem>
                                        <SelectItem value="Disabled">Disabled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Technical ── */}
                    {step === 3 && (
                        <div className="space-y-6 md:space-y-8 max-w-4xl animate-in fade-in slide-in-from-right-4 duration-300">
                            {formData.procurementCategory === "Product" ? (
                                <>
                                    <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                        <SectionHeading title="Product Information" color="blue" />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Field label="Item Name">
                                                <Input name="itemName" value={formData.itemName} onChange={handleChange} className={inputCls} placeholder="Enter Item Name" />
                                            </Field>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="Quantity">
                                                    <Input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className={inputCls} placeholder="0" />
                                                </Field>
                                                <Field label="Unit">
                                                    <Input name="unit" value={formData.unit} onChange={handleChange} className={inputCls} placeholder="e.g. Nos/Set" />
                                                </Field>
                                            </div>
                                            <div className="col-span-1 sm:col-span-2">
                                                <Field label="Item Description">
                                                    <Textarea name="itemDescription" value={formData.itemDescription} onChange={handleChange} className="rounded-lg border border-slate-200 text-sm min-h-[80px]" placeholder="Detailed technical description of the product..." />
                                                </Field>
                                            </div>
                                            <div className="col-span-1 sm:col-span-2 flex gap-6">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <Checkbox checked={formData.installationRequired} onCheckedChange={v => set("installationRequired", !!v)} />
                                                    <span className="text-sm text-slate-600">Installation Required</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <Checkbox checked={formData.testingRequired} onCheckedChange={v => set("testingRequired", !!v)} />
                                                    <span className="text-sm text-slate-600">Testing Required</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <SectionHeading title="Technical Specifications" color="green" />
                                            <Button size="sm" variant="outline" onClick={() => set("mandatoryParams", [...formData.mandatoryParams, { slNo: String(formData.mandatoryParams.length + 1), parameter: "", requirement: "" }])}>
                                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
                                            </Button>
                                        </div>
                                        <div className="space-y-2 overflow-x-auto">
                                            <div className="min-w-[600px]">
                                                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-400 uppercase px-2">
                                                    <span className="col-span-1">#</span>
                                                    <span className="col-span-5">Parameter</span>
                                                    <span className="col-span-5">Requirement</span>
                                                </div>
                                            {formData.mandatoryParams.map((p, i) => (
                                                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-100">
                                                    <span className="col-span-1 text-xs text-slate-400 font-mono pl-1">{i + 1}</span>
                                                    <Input value={p.parameter} onChange={e => { const u = [...formData.mandatoryParams]; u[i].parameter = e.target.value; set("mandatoryParams", u); }} className="col-span-5 h-8 text-sm border-slate-200" placeholder="e.g. Processor" />
                                                    <Input value={p.requirement} onChange={e => { const u = [...formData.mandatoryParams]; u[i].requirement = e.target.value; set("mandatoryParams", u); }} className="col-span-5 h-8 text-sm border-slate-200" placeholder="e.g. Intel i5 12th Gen" />
                                                    <button onClick={() => set("mandatoryParams", formData.mandatoryParams.filter((_, idx) => idx !== i))} className="col-span-1 text-slate-300 hover:text-red-400 flex justify-center">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center justify-between mb-4 md:mb-6">
                                            <SectionHeading title="Consignee / Delivery Locations" color="amber" />
                                            <Button size="sm" variant="outline" onClick={() => set("consigneeDetails", [...formData.consigneeDetails, { name: "", address: "", quantity: "", contactPerson: "", contactNumber: "" }])} className="flex-shrink-0">
                                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Location
                                            </Button>
                                        </div>
                                        <div className="space-y-3 overflow-x-auto">
                                            <div className="min-w-[700px] pb-2">
                                            {formData.consigneeDetails.map((c, i) => (
                                                <div key={i} className="grid grid-cols-5 gap-2 bg-white p-3 rounded-lg border border-slate-100 relative group">
                                                    <Input placeholder="Consignee Name" value={c.name} onChange={e => { const u = [...formData.consigneeDetails]; u[i].name = e.target.value; set("consigneeDetails", u); }} className="h-9 text-sm border-slate-200" />
                                                    <Input placeholder="Address" value={c.address} onChange={e => { const u = [...formData.consigneeDetails]; u[i].address = e.target.value; set("consigneeDetails", u); }} className="h-9 text-sm border-slate-200" />
                                                    <Input placeholder="Qty" value={c.quantity} onChange={e => { const u = [...formData.consigneeDetails]; u[i].quantity = e.target.value; set("consigneeDetails", u); }} className="h-9 text-sm border-slate-200" />
                                                    <Input placeholder="Contact Person" value={c.contactPerson} onChange={e => { const u = [...formData.consigneeDetails]; u[i].contactPerson = e.target.value; set("consigneeDetails", u); }} className="h-9 text-sm border-slate-200" />
                                                    <div className="flex gap-1">
                                                        <Input placeholder="Phone" value={c.contactNumber} onChange={e => { const u = [...formData.consigneeDetails]; u[i].contactNumber = e.target.value; set("consigneeDetails", u); }} className="h-9 text-sm border-slate-200 flex-1" />
                                                        <button onClick={() => set("consigneeDetails", formData.consigneeDetails.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-400 px-1">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                        <SectionHeading title="Service Details" color="blue" />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Field label="Service Name">
                                                <Input name="serviceName" value={formData.serviceName} onChange={handleChange} className={inputCls} placeholder="Enter Service Name" />
                                            </Field>
                                            <Field label="SLA Threshold (%)">
                                                <Input type="number" name="slaPercent" value={formData.slaPercent} onChange={handleChange} className={inputCls} placeholder="e.g. 99" />
                                            </Field>
                                            <div className="col-span-1 sm:col-span-2">
                                                <Field label="Scope of Work / Description">
                                                    <Textarea name="serviceDescription" value={formData.serviceDescription} onChange={handleChange} className="rounded-lg border border-slate-200 text-sm min-h-[100px]" />
                                                </Field>
                                            </div>
                                            <Field label="Reporting Frequency">
                                                <Input name="reportingFreq" value={formData.reportingFreq} onChange={handleChange} className={inputCls} placeholder="e.g. Monthly" />
                                            </Field>
                                            <Field label="SLA Penalty Terms">
                                                <Input name="slaPenalty" value={formData.slaPenalty} onChange={handleChange} className={inputCls} placeholder="e.g. 0.5% per hour" />
                                            </Field>
                                        </div>
                                    </div>

                                    <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <SectionHeading title="Staffing Requirements" color="green" />
                                            <Button size="sm" variant="outline" onClick={() => set("manpower", [...formData.manpower, { role: "", qualification: "", experience: "", quantity: "" }])}>
                                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Role
                                            </Button>
                                        </div>
                                        <div className="space-y-2 overflow-x-auto">
                                            <div className="min-w-[600px] pb-2">
                                                <div className="grid grid-cols-9 gap-2 text-xs font-semibold text-slate-400 uppercase px-2">
                                                    <span className="col-span-3">Role</span>
                                                    <span className="col-span-2">Qualification</span>
                                                    <span className="col-span-2">Experience</span>
                                                    <span className="col-span-1">Qty</span>
                                                </div>
                                            {formData.manpower.map((m, i) => (
                                                <div key={i} className="grid grid-cols-9 gap-2 items-center bg-white p-2 rounded-lg border border-slate-100">
                                                    <Input value={m.role} onChange={e => { const u = [...formData.manpower]; u[i].role = e.target.value; set("manpower", u); }} className="col-span-3 h-8 text-sm border-slate-200" placeholder="e.g. Project Manager" />
                                                    <Input value={m.qualification} onChange={e => { const u = [...formData.manpower]; u[i].qualification = e.target.value; set("manpower", u); }} className="col-span-2 h-8 text-sm border-slate-200" placeholder="B.Tech" />
                                                    <Input value={m.experience} onChange={e => { const u = [...formData.manpower]; u[i].experience = e.target.value; set("manpower", u); }} className="col-span-2 h-8 text-sm border-slate-200" placeholder="5 Yrs" />
                                                    <Input value={m.quantity} onChange={e => { const u = [...formData.manpower]; u[i].quantity = e.target.value; set("manpower", u); }} className="col-span-1 h-8 text-sm border-slate-200" placeholder="1" />
                                                    <button onClick={() => set("manpower", formData.manpower.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-400 flex justify-center">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── STEP 4: Eligibility ── */}
                    {step === 4 && (
                        <div className="space-y-6 md:space-y-8 max-w-4xl animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <SectionHeading title="Experience & Financial Eligibility" color="red" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <Field label="Domain Experience (Years)">
                                        <Input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} className={inputCls} placeholder="e.g. 3" />
                                    </Field>
                                    <Field label="Similar Projects (Count)">
                                        <Input type="number" name="similarProjects" value={formData.similarProjects} onChange={handleChange} className={inputCls} placeholder="e.g. 3" />
                                    </Field>
                                    <Field label="Min. Annual Turnover (₹ Lakhs)">
                                        <Input type="number" name="turnover" value={formData.turnover} onChange={handleChange} className={inputCls} placeholder="e.g. 50" />
                                    </Field>
                                </div>
                            </div>

                            <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <SectionHeading title="Mandatory Documents" color="green" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { label: "PAN Card", key: "docsPan" },
                                        { label: "GST Registration", key: "docsGst" },
                                        { label: "MSME Certificate", key: "docsMsme" },
                                        { label: "OEM Authorization", key: "docsOemAuth" },
                                        { label: "MII Declaration Form", key: "docsMii" },
                                        { label: "Positive Net Worth Certificate", key: "netWorthRequired" },
                                    ].map(doc => (
                                        <label key={doc.key} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 cursor-pointer hover:border-blue-200 hover:bg-blue-50 transition-all">
                                            <Checkbox checked={!!formData[doc.key as keyof GemTenderData]} onCheckedChange={v => set(doc.key, !!v)} />
                                            <span className="text-sm text-slate-700 font-medium">{doc.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 5: Evaluation & BOQ ── */}
                    {step === 5 && (
                        <div className="space-y-6 md:space-y-8 max-w-4xl animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <SectionHeading title="Evaluation Method" color="blue" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { id: "L1", title: "L1 — Lowest Price", desc: "Best for standardized goods. Lowest bidder wins." },
                                        { id: "QCBS", title: "QCBS — Quality & Cost", desc: "Best for complex services. Weighted score." },
                                    ].map(m => (
                                        <button key={m.id} onClick={() => set("evaluationMethod", m.id)}
                                            className={`text-left p-4 rounded-xl border-2 transition-all ${formData.evaluationMethod === m.id ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"}`}>
                                            <p className={`text-sm font-bold ${formData.evaluationMethod === m.id ? "text-blue-700" : "text-slate-800"}`}>{m.title}</p>
                                            <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
                                        </button>
                                    ))}
                                </div>
                                {formData.evaluationMethod === "QCBS" && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
                                        <Field label="Technical Weightage (%)">
                                            <Input type="number" name="techWeightage" value={formData.techWeightage} onChange={handleChange} className={inputCls} />
                                        </Field>
                                        <Field label="Financial Weightage (%)">
                                            <Input type="number" name="finWeightage" value={formData.finWeightage} onChange={handleChange} className={inputCls} />
                                        </Field>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center justify-between mb-4 md:mb-6">
                                    <SectionHeading title="Bill of Quantities (BOQ)" color="green" />
                                    <Button size="sm" variant="outline" onClick={() => set("boqItems", [...formData.boqItems, { slNo: String(formData.boqItems.length + 1), description: "", quantity: "", unit: "", unitPrice: "", totalPrice: "" }])} className="flex-shrink-0">
                                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                                    </Button>
                                </div>
                                {formData.boqItems.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                        <IndianRupee className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                        <p className="text-sm">No BOQ items yet. Click "Add Item" to begin.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2 overflow-x-auto">
                                            <div className="min-w-[700px] mb-2">
                                                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-400 uppercase px-2 mb-1">
                                                    <span className="col-span-4">Description</span>
                                                    <span className="col-span-2">Qty</span>
                                                    <span className="col-span-2">Unit</span>
                                                    <span className="col-span-3">Rate (₹)</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {formData.boqItems.map((item, i) => (
                                                        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-100">
                                                            <Input value={item.description} onChange={e => { const nb = [...formData.boqItems]; nb[i].description = e.target.value; set("boqItems", nb); }} className="col-span-4 h-8 text-sm border-slate-200" placeholder="Item description" />
                                                            <Input value={item.quantity} onChange={e => { const nb = [...formData.boqItems]; nb[i].quantity = e.target.value; nb[i].totalPrice = String(Number(e.target.value) * Number(item.unitPrice) || 0); set("boqItems", nb); }} className="col-span-2 h-8 text-sm border-slate-200" placeholder="100" />
                                                            <Input value={item.unit} onChange={e => { const nb = [...formData.boqItems]; nb[i].unit = e.target.value; set("boqItems", nb); }} className="col-span-2 h-8 text-sm border-slate-200" placeholder="Nos" />
                                                            <Input value={item.unitPrice} onChange={e => { const nb = [...formData.boqItems]; nb[i].unitPrice = e.target.value; nb[i].totalPrice = String(Number(e.target.value) * Number(item.quantity) || 0); set("boqItems", nb); }} className="col-span-3 h-8 text-sm border-slate-200" placeholder="5000" />
                                                            <button onClick={() => set("boqItems", formData.boqItems.filter((_, idx) => idx !== i))} className="col-span-1 text-slate-300 hover:text-red-400 flex justify-center">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                                            <span className="text-sm font-semibold text-slate-600">Total Bid Value</span>
                                            <span className="text-lg font-bold text-blue-700">₹ {formData.boqItems.reduce((acc, c) => acc + (Number(c.totalPrice) || 0), 0).toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 6: Compliance ── */}
                    {step === 6 && (
                        <div className="space-y-6 md:space-y-8 max-w-4xl animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <SectionHeading title="Warranty, Delivery & Payment" color="blue" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <Field label="Warranty Period (Years)">
                                        <Input type="number" name="warrantyPeriod" value={formData.warrantyPeriod} onChange={handleChange} className={inputCls} placeholder="e.g. 3" />
                                    </Field>
                                    <Field label="Warranty Type">
                                        <Select value={formData.warrantyType} onValueChange={v => set("warrantyType", v)}>
                                            <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                                                <SelectItem value="Non-Comprehensive">Non-Comprehensive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Delivery Period (Days)">
                                        <Input type="number" name="deliveryPeriod" value={formData.deliveryPeriod} onChange={handleChange} className={inputCls} placeholder="e.g. 30" />
                                    </Field>
                                    <Field label="LD Penalty (%)">
                                        <Input type="number" name="ldPercentage" value={formData.ldPercentage} onChange={handleChange} className={inputCls} placeholder="e.g. 0.5" />
                                    </Field>
                                    <Field label="Max LD Cap (%)">
                                        <Input type="number" name="ldMaxCap" value={formData.ldMaxCap} onChange={handleChange} className={inputCls} placeholder="e.g. 10" />
                                    </Field>
                                    <Field label="Inspection Authority">
                                        <Input name="inspectionAuthority" value={formData.inspectionAuthority} onChange={handleChange} className={inputCls} placeholder="e.g. Consignee" />
                                    </Field>
                                    <div className="col-span-1 sm:col-span-2 md:col-span-3">
                                        <Field label="Payment Terms">
                                            <Input name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} className={inputCls} placeholder="e.g. 100% after delivery" />
                                        </Field>
                                    </div>
                                    <div className="col-span-1 sm:col-span-2 md:col-span-3">
                                        <Field label="Arbitration Clause">
                                            <Input name="arbitrationClause" value={formData.arbitrationClause} onChange={handleChange} className={inputCls} placeholder="Enter Arbitration Terms" />
                                        </Field>
                                    </div>
                                    <div className="col-span-1 sm:col-span-2 md:col-span-3">
                                        <Field label="Option Clause">
                                            <Input name="optionClause" value={formData.optionClause} onChange={handleChange} className={inputCls} placeholder="e.g. 25% variation allowed" />
                                        </Field>
                                    </div>
                                    <div className="col-span-1 sm:col-span-2 md:col-span-3">
                                        <Field label="Inspection Location">
                                            <Input name="inspectionLocation" value={formData.inspectionLocation} onChange={handleChange} className={inputCls} placeholder="e.g. Consignee Site" />
                                        </Field>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <SectionHeading title="Preference Policies & Declarations" color="green" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { label: "Make in India (MII) Applicable", key: "miiApplicable" },
                                        { label: "MSME Preference Applicable", key: "msmePreference" },
                                        { label: "No Blacklisting / Debarment", key: "declarationNoBlacklist" },
                                        { label: "All Information is True & Correct", key: "declarationTrueInfo" },
                                        { label: "No Conflict of Interest", key: "declarationNoConflict" },
                                        { label: "I Agree to All Terms & Conditions", key: "agreementToTerms" },
                                    ].map(p => (
                                        <label key={p.key} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 cursor-pointer hover:border-emerald-200 hover:bg-emerald-50 transition-all">
                                            <Checkbox checked={!!formData[p.key as keyof GemTenderData]} onCheckedChange={v => set(p.key, !!v)} />
                                            <span className="text-sm text-slate-700 font-medium">{p.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <SectionHeading title="Signatory Details" color="purple" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Signatory Name">
                                        <Input name="signatoryName" value={formData.signatoryName} onChange={handleChange} className={inputCls} placeholder="Enter Full Name" />
                                    </Field>
                                    <Field label="Designation / Section">
                                        <Input name="signatoryDesignation" value={formData.signatoryDesignation} onChange={handleChange} className={inputCls} placeholder="Enter Designation" />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── FOOTER CONTROLS ── */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 py-4 border-t border-slate-100 bg-white">
                    <Button variant="outline" onClick={prevStep} disabled={step === 1} className="gap-2 h-10">
                        <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Previous</span>
                    </Button>

                    <div className="flex gap-2">
                        {step === 6 ? (
                            <Button
                                onClick={() => navigate("/dashboard/validator", { state: { autoLoad: true, fileName: `Tender_${formData.bidNumber}.pdf`, tenderData: formData } })}
                                className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white px-8"
                            >
                                Finish & Validate <CheckCircle2 className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={nextStep}
                                disabled={!canContinue}
                                title={!canContinue ? "Please fill all required fields to continue" : ""}
                                className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white px-8"
                            >
                                Continue <ArrowRight className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                #wizard-content::-webkit-scrollbar { width: 5px; }
                #wizard-content::-webkit-scrollbar-track { background: #f8fafc; }
                #wizard-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                #wizard-content::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            ` }} />
        </div>
    );
}
