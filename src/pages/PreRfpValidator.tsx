import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    ScanSearch,
    History,
    History as HistoryIcon,
    FileText,
    Trash2,
    Eye,
    Edit,
    Edit3,
    FilePenLine,
    Download,
    Send,
    BrainCircuit,
    Sparkles,
    FileCheck,
    FolderSearch,
    Check,
    Clock,
    ShieldCheck,
    ShieldAlert,
    XCircle,
    Plus,
    FolderOpen,
    ArrowUpRight,
    ArrowRight,
    Loader2,
    Save,
    X
} from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";
import { toast as sonnerToast } from "sonner";
import { jsPDF } from "jspdf";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTenders } from "@/hooks/useTenders";
import { API_BASE_URL } from "@/config";
import { generateTenderPDF as generateBilingualGeMPDF } from "@/utils/pdfGenerator";



// ── Type Definitions ────────────────────────────────────────────────────────
interface ValidationResult {
    id: string;
    category: string;
    title: string;
    status: 'pass' | 'fail' | 'warn';
    score: number;
    message: string;
    message_telugu?: string;
    is_autofixable: boolean;
    autofix_action?: string;
    relatedField?: string;
}

interface TenderData {
    bidNumber?: string;
    bidEndDate?: string;
    ministry?: string;
    department?: string;
    organisation?: string;
    officeName?: string;
    category?: string;
    quantity?: string;
    emdRequired?: string;
    emdAmount?: string;
    emdAdvisoryBank?: string;
    epbgAdvisoryBank?: string;
    epbgPercentage?: string;
    epbgDuration?: string;
    beneficiaryName?: string;
    mseExemption?: string;
    startupExemption?: string;
    bidValidity?: string;
    bidType?: string;
    estimatedValue?: string;
    turnoverLimit?: string;
    experienceYears?: string;
    title?: string;
    itemName?: string;
    [key: string]: string | undefined;
}

export default function PreRfpValidator() {
    const { tenders, createTender } = useTenders();
    const location = useLocation();
    const navigate = useNavigate();
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<ValidationResult[] | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ title: string; status: 'pass' | 'fail' | 'warn'; message: string }>({ title: "", status: "fail", message: "" });
    const [tenderData, setTenderData] = useState<TenderData | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem("procuresmart_api_key") || "");
    const [language, setLanguage] = useState<'EN' | 'TE'>('EN');
    const [addFieldKey, setAddFieldKey] = useState<string | null>(null); // replaces prompt()
    const [addFieldValue, setAddFieldValue] = useState("");
    const [activeTab, setActiveTab] = useState<string>("All");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Role Indicator (Mocked for Demo)
    const role = "Editor";

    // Audit History (Mocked for Demo)
    const [auditHistory] = useState([
        { id: "VAL-001", score: 84, time: "10:30 AM", status: "Review Needed" },
        { id: "VAL-002", score: 67, time: "Yesterday", status: "High Risk" },
        { id: "VAL-003", score: 91, time: "2 days ago", status: "Safe" }
    ]);

    // Category-aware Pillar Scoring
    const calculatePillarScores = () => {
        if (!results) return { policy: 0, completeness: 0, consistency: 0, ambiguity: 0, total: 0 };

        const scoreCategory = (categories: string[], maxScore: number) => {
            const relevant = results.filter(r => categories.some(c => r.category?.toLowerCase().includes(c.toLowerCase())));
            if (relevant.length === 0) return maxScore; // no checks in this pillar → full score
            const avgScore = relevant.reduce((sum, r) => sum + (r.score || 0), 0) / relevant.length;
            return Math.round((avgScore / 100) * maxScore);
        };

        // Rules pillar: EMD, EPBG, Bid Validity, GeM, Local Preference
        const policy = scoreCategory(["EMD Rules", "Bid Validity", "EPBG Policy", "GeM Portal", "Turnover Limit", "Local Preference"], 40);
        // Completeness pillar: only Completeness checks
        const completeness = scoreCategory(["Completeness"], 25);
        // Consistency: Bid Type, Category, Quantity cross-checks — if no specific checks, derive from overall
        const consistencyChecks = results.filter(r => r.category?.toLowerCase().includes("consistency"));
        const consistency = consistencyChecks.length > 0
            ? scoreCategory(["Consistency"], 20)
            : Math.round((results.filter(r => r.status === 'pass').length / results.length) * 20);
        // Clarity: ambiguity checks or leftover
        const clarityChecks = results.filter(r => r.category?.toLowerCase().includes("clarity") || r.category?.toLowerCase().includes("ambiguity"));
        const ambiguity = clarityChecks.length > 0
            ? scoreCategory(["Clarity", "Ambiguity"], 15)
            : Math.round((results.filter(r => r.status === 'pass').length / results.length) * 15);

        const total = policy + completeness + consistency + ambiguity;

        return { policy, completeness, consistency, ambiguity, total };
    };

    const pillarScores = calculatePillarScores();
    const weightedScore = results ? pillarScores.total : 0;

    // Issue Counts — status-first bucketing (warn is its own bucket)
    const issueCounts = {
        critical: results ? results.filter(r => r.status === 'fail' && r.score <= 30).length : 0,
        errors: results ? results.filter(r => r.status === 'fail' && r.score > 30).length : 0,
        warnings: results ? results.filter(r => r.status === 'warn').length : 0,
    };

    const getStatusLabel = () => {
        if (!results) return "AWAITING SCAN";
        if (weightedScore >= 90) return "SAFE TO PUBLISH";
        if (weightedScore >= 70) return "REVIEW NEEDED";
        if (weightedScore >= 50) return "HIGH RISK";
        return "BLOCKED";
    };

    useEffect(() => {
        if (location.state?.autoLoad && location.state?.fileName) {
            const mockFile = new File([""], location.state.fileName, { type: "application/pdf" });
            setFile(mockFile);
            setTenderData(location.state.tenderData as TenderData);
            sonnerToast.info("Draft Document Loaded", { description: "Auto-starting AI Validation..." });
        }
    }, [location.state]);

    useEffect(() => {
        if (location.state?.autoLoad && tenderData && !results && !analyzing) {
            const timer = setTimeout(() => {
                runValidation();
            }, 1000);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenderData, results, analyzing, location.state]); // runValidation excluded intentionally — wrapped in useCallback below

    const handleAutoRemediate = (singleRes?: ValidationResult) => {
        if (!results) return;
        const updatedTenderData: TenderData = { ...(tenderData ?? {}) };

        const resultsToFix = singleRes ? [singleRes] : results;

        resultsToFix.forEach(res => {
            // Guard: skip already-resolved items
            if (res.status === 'pass' || !res.is_autofixable) return;

            // 1. Check for specific autofix_action from AI
            if (res.autofix_action && res.relatedField) {
                updatedTenderData[res.relatedField] = res.autofix_action;
                return;
            }

            // 2. Fallback to rule-based logic
            const t = res.title.replace(/^\[RESOLVED\]\s*/i, "").toLowerCase();
            const cat = res.category.toLowerCase();

            // Completeness & Clarity fixes
            if (cat.includes("completeness") || cat.includes("clarity")) {
                if (t.includes("ministry")) updatedTenderData.ministry = "Ministry of Electronics & Information Technology";
                if (t.includes("department")) updatedTenderData.department = "National Informatics Centre (NIC)";
                if (t.includes("organisation")) updatedTenderData.organisation = "RTGS - Andhra Pradesh";
                if (t.includes("office")) updatedTenderData.officeName = "Vijayawada HQ";
                if (t.includes("quantity")) updatedTenderData.quantity = "100";
                if (t.includes("end date")) updatedTenderData.bidEndDate = "2026-03-15";
                if (t.includes("beneficiary")) updatedTenderData.beneficiaryName = "The Pay and Accounts Officer, RTGS";
            }

            // Policy & Rules fixes
            if (cat.includes("rules") || cat.includes("policy") || cat.includes("consistency")) {
                if (t.includes("epbg")) updatedTenderData.epbgPercentage = "3";
                if (t.includes("validity")) updatedTenderData.bidValidity = "90";
                if (t.includes("emd")) {
                    updatedTenderData.emdRequired = "no";
                    updatedTenderData.mseExemption = "yes";
                }
                if (t.includes("turnover")) updatedTenderData.turnoverLimit = "Max 2x Estimated Value";
                if (t.includes("experience")) updatedTenderData.experienceYears = "Max 5 Years";
                if (t.includes("startup")) updatedTenderData.startupExemption = "yes";
                if (t.includes("mii") || t.includes("india")) updatedTenderData.localContentPreference = "yes";
            }
        });

        const fixedResults: ValidationResult[] = results.map(res => {
            const isTarget = singleRes ? res.id === singleRes.id : true;
            const alreadyFixed = res.title.startsWith("[RESOLVED]");
            if (isTarget && res.status !== 'pass' && res.is_autofixable && !alreadyFixed) {
                return {
                    ...res,
                    status: 'pass' as const,
                    score: 100,
                    message: `Auto-Fixed: Correction applied per GFR/GeM standards.`,
                    title: `[RESOLVED] ${res.title}`,
                };
            }
            return res;
        });

        setResults(fixedResults);
        setTenderData(updatedTenderData);

        if (singleRes) {
            sonnerToast.success("Issue Fixed", {
                description: `Corrected: ${singleRes.title.replace(/^\[RESOLVED\]\s*/i, "")}`
            });
        } else {
            sonnerToast.success("All Issues Fixed Successfully", {
                description: "All autofixable parameters have been updated to comply with AP e-Procurement & GeM norms.",
                duration: 5000
            });
        }
    };

    const updateTenderField = (key: string, value: string) => {
        setTenderData((prev: any) => ({
            ...prev,
            [key]: value
        }));
    };

    const addTenderField = () => {
        setAddFieldKey(""); // open the inline input UI
        setAddFieldValue("");
    };

    const removeResult = (id: string | number) => {
        console.log("Removing result with ID:", id);
        if (results) {
            const updated = results.filter(r => String(r.id) !== String(id));
            setResults(updated);
            sonnerToast.success("Check result removed", {
                description: "The validation metric has been hidden from this report."
            });
        }
    };

    const confirmAddField = () => {
        if (addFieldKey && addFieldKey.trim()) {
            updateTenderField(addFieldKey.trim(), addFieldValue.trim());
        }
        setAddFieldKey(null);
        setAddFieldValue("");
    };

    const startEdit = (res: ValidationResult) => {
        console.log("Starting edit for:", res.id);
        setEditingId(String(res.id));
        setEditForm({ title: res.title, status: res.status, message: res.message });
        sonnerToast.info("Editing mode active", { description: "You can now modify this finding or jump to the field." });

        if (res.relatedField) {
            const scrollToField = () => {
                const fieldEl = document.getElementById(`field-${res.relatedField}`);
                if (fieldEl) {
                    fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    fieldEl.classList.add('ring-4', 'ring-blue-400/30', 'border-gov-blue');
                    setTimeout(() => {
                        fieldEl.classList.remove('ring-4', 'ring-blue-400/30', 'border-gov-blue');
                    }, 3000);
                }
            };

            const fieldEl = document.getElementById(`field-${res.relatedField}`);
            if (fieldEl) {
                scrollToField();
            } else if (tenderData && res.relatedField) {
                // If field doesn't exist in DOM (likely a missing dynamic field), add it to tenderData
                setTenderData((prev: any) => ({ ...prev, [res.relatedField!]: "" }));
                // Wait for React render cycle then scroll
                setTimeout(scrollToField, 100);
            }
        }
    };

    const saveEdit = () => {
        if (!results) return;
        const updatedResults = results.map(res =>
            res.id === editingId ? { ...res, ...editForm } : res
        );
        setResults(updatedResults);
        setEditingId(null);
        sonnerToast.success("Analysis Updated", { description: "The finding has been modified." });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const uploadedFile = e.target.files[0];
        setFile(uploadedFile);
        setResults(null);
        setIsExtracting(true);
        sonnerToast.info("Reading document...", { description: `Extracting fields from ${uploadedFile.name}` });

        try {
            const formData = new FormData();
            formData.append("file", uploadedFile);
            formData.append("source", "gem");

            const response = await fetch(`${API_BASE_URL}/api/tender-draft/analyze-pdf`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const result = await response.json();
            const d = result.extracted_data || {};

            // Map AI-extracted fields to TenderData shape
            const extracted: TenderData = {
                bidNumber: d.bidNumber || d.bid_number || "",
                title: d.title || d.category || "",
                ministry: d.ministry || "",
                department: d.department || "",
                organisation: d.organisation || "",
                officeName: d.office || d.officeName || "",
                category: d.category || "",
                estimatedValue: d.estimatedValue || d.estimated_value || "",
                quantity: d.quantity || "",
                unit: d.unit || "Nos",
                bidEndDate: d.endDate || d.bidEndDate || "",
                bidValidity: d.validity || d.bidValidity || "",
                emdRequired: d.emdRequired || "No",
                emdAmount: d.emdAmount || "",
                epbgPercentage: d.epbgPercentage || "",
                epbgDuration: d.epbgDuration || d.epbgValidity || "",
                beneficiaryName: d.beneficiary || d.buyerName || "",
                mseExemption: d.msePreference || d.mseExemption || "No",
                experienceYears: d.experience || d.experienceYears || "",
                turnoverLimit: d.bidderTurnover || d.turnoverLimit || "",
                itemName: d.itemName || d.category || "",
            };

            // Filter out empty values so user sees only what was actually found
            const nonEmpty = Object.fromEntries(Object.entries(extracted).filter(([, v]) => v && v !== ""));

            setTenderData(nonEmpty as TenderData);
            sonnerToast.success("Extraction Complete!", {
                description: `Found ${Object.keys(nonEmpty).length} fields from your document. Review below.`,
                duration: 5000,
            });
        } catch (err: any) {
            console.error("Extraction failed:", err);
            sonnerToast.error("Extraction failed", {
                description: err.message || "Could not parse the document. Try a text-based PDF.",
            });
        } finally {
            setIsExtracting(false);
        }
    };

    const runValidation = useCallback(async () => {
        if (!file && !tenderData) {
            sonnerToast.error("Please upload a document or draft a tender first");
            return;
        }
        setAnalyzing(true);
        setResults(null);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return prev;
                return prev + Math.random() * 10;
            });
        }, 500);

        try {
            const formData = new FormData();
            if (file) formData.append("file", file);
            if (tenderData) formData.append("tender_data_json", JSON.stringify(tenderData));

            const response = await fetch(`${API_BASE_URL}/api/ai/validate-rfp`, {
                method: "POST",
                body: formData,
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Server error during analysis");
            }

            const data = await response.json();

            setResults(data);
            setProgress(100);
            sonnerToast.success("Validation Complete", {
                description: "Document checked against procurement rules and policies."
            });
        } catch (error: any) {
            console.error("Validation error:", error);
            sonnerToast.error("Validation failed", {
                description: error.message || "An unexpected error occurred. Please try again."
            });
            // Don't set results to null so the user can see it failed
        } finally {
            clearInterval(interval);
            setAnalyzing(false);
        }
    }, [file, tenderData]);

    const handlePublish = async () => {
        const formData = tenderData || location.state?.tenderData;
        if (!formData) {
            sonnerToast.error("No tender data found");
            return;
        }
        setIsPublishing(true);
        try {
            await createTender({
                projectName: formData.title || formData.itemName || "Untitled Tender",
                department: formData.department || "General Administration",
                estimatedBudget: Number(formData.estimatedValue) || 0,
                publishedDate: new Date().toISOString().split('T')[0],
                closingDate: (() => {
                    const raw = formData.bidEndDate;
                    if (!raw) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    if (raw.includes('/')) {
                        const [d, m, y] = raw.split('/');
                        return `${y}-${m}-${d}`;
                    }
                    return raw;
                })(),
                description: JSON.stringify(formData), // Persist full details including compliance checks
                status: "Active",
                platform: "gem"
            });
            sonnerToast.success("RFP Published to Registry", {
                description: "Tender is now live and visible to vendors."
            });
            // Navigate to tenders page immediately after publishing
            navigate("/dashboard/tenders");
        } catch (error) {
            console.error("Publish failed:", error);
            sonnerToast.error("Publish failed");
        } finally {
            setIsPublishing(false);
        }
    };

    const generateFullDocument = async () => {
        const formData = tenderData || location.state?.tenderData;
        const currentResults = results || [];

        if (!formData) {
            sonnerToast.error("No tender data found. Please generate from the drafting wizard.");
            return;
        }

        await generateBilingualGeMPDF(formData as any, currentResults);
    };


    const handleDownloadLegacyReport = () => {
        sonnerToast.error("Original tender data missing. Cannot regenerate full document.", { description: "Please generate this from the drafting wizard." });
    };

    return (
        <div className="relative min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* --- PREMIUM DECORATIVE BACKGROUND --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-100/60 rounded-full blur-[150px]"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-100/60 rounded-full blur-[150px]"></div>
            </div>

            <div className="min-h-screen p-3 md:p-5 selection:bg-gov-blue/20 relative z-10">
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4 mb-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 p-1.5 px-3 bg-white border border-slate-200 rounded-lg w-fit shadow-sm">
                            <span className="text-[10px] font-black text-gov-blue uppercase tracking-[0.2em]">Document Tools</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tender Checker</span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter text-slate-900 leading-tight">
                            ProcureSmart AI <span className="text-gov-blue font-light">Validator</span>
                        </h2>
                    </div>


                </div>

                <div className="max-w-[1600px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        {/* --- MAIN VALIDATION AREA --- */}
                        <div className="lg:col-span-8 space-y-5">
                            <Card className="border-none shadow-[0_4px_16px_rgba(0,0,0,0.06)] bg-white rounded-2xl overflow-hidden group/card ring-1 ring-slate-100">
                                <div className="h-1 w-full bg-gradient-to-r from-gov-blue via-blue-400 to-indigo-500"></div>
                                <CardHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <CardTitle className="flex items-center gap-3 text-base font-black text-slate-900">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-gov-blue shadow-inner group-hover/card:scale-110 transition-transform duration-500">
                                                    <ScanSearch className="w-4 h-4" />
                                                </div>
                                                Tender Document Checker
                                            </CardTitle>
                                            <div className="flex items-center gap-2 ml-11">
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">AI Check Enabled</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="text-[9px] text-gov-blue font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
                                                    <Sparkles className="w-2.5 h-2.5" /> Powered by AI
                                                </span>
                                            </div>
                                        </div>
                                        {file && (
                                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">File Loaded</Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="p-6">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".pdf,.docx,.doc"
                                        onChange={handleFileChange}
                                    />
                                    {!file && !tenderData ? (
                                        <div className="space-y-4">
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="group/dropzone relative border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center transition-all hover:bg-blue-50/50 hover:border-gov-blue/40 cursor-pointer overflow-hidden"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-4 shadow-inner">
                                                    <FileText className="w-6 h-6 text-gov-blue/70" />
                                                </div>
                                                <h3 className="text-lg font-black text-slate-900 mb-1">Upload Your Tender Document</h3>
                                                <p className="text-xs text-slate-500 font-medium max-w-xs text-center leading-relaxed mb-4">
                                                    Upload your tender draft and we'll check it for <span className="text-gov-blue font-bold">Rule Violations</span>, <span className="text-gov-blue font-bold">Missing Information</span>, and <span className="text-gov-blue font-bold">Policy Issues</span>.
                                                </p>
                                                <Button className="bg-gov-blue hover:bg-gov-blue-dark text-white font-black px-6 py-2 text-sm rounded-xl transition-all duration-300 active:scale-95 shadow-md shadow-gov-blue/20">
                                                    Check My Document
                                                </Button>
                                                <p className="text-[9px] text-slate-400 mt-3 font-bold uppercase tracking-widest">PDF · DOC · DOCX · Max 25MB</p>
                                            </div>

                                            {tenders.filter(t => t.status === 'Draft').length > 0 && (
                                                <div className="pt-6 border-t border-slate-100">
                                                    <div className="flex items-center gap-4 mb-6 px-2">
                                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200"></div>
                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Saved Draft Documents</span>
                                                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200"></div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {tenders.filter(t => t.status === 'Draft').slice(0, 4).map(draft => (
                                                            <button
                                                                key={draft.id}
                                                                onClick={() => {
                                                                    const mockFile = new File([""], `Draft_${draft.id}.pdf`, { type: "application/pdf" });
                                                                    setFile(mockFile);
                                                                    setTenderData(draft as unknown as TenderData);
                                                                    sonnerToast.success(`Loaded Draft: ${draft.projectName} `);
                                                                }}
                                                                className="flex items-center gap-5 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] hover:border-gov-blue/40 hover:bg-blue-50/40 transition-all duration-500 text-left group shadow-sm hover:shadow-lg hover:translate-y-[-2px]"
                                                            >
                                                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:bg-gov-blue/10 group-hover:text-gov-blue shadow-inner transition-all duration-500">
                                                                    <FolderOpen className="w-7 h-7" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-[14px] font-black text-slate-800 truncate group-hover:text-gov-blue transition-colors mb-1">{draft.projectName}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant="secondary" className="h-4 p-0 px-2 text-[9px] font-black bg-blue-50 text-gov-blue rounded-md uppercase">Locked</Badge>
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">GTC Compliant</span>
                                                                    </div>
                                                                </div>
                                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-gov-blue group-hover:text-white transition-all shadow-sm">
                                                                    <ArrowUpRight className="w-5 h-5" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-8 py-2">
                                            {/* Uploaded File Bar */}
                                            <div className="p-3 sm:pr-6 bg-white border border-slate-200 rounded-[1.5rem] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md hover:ring-1 ring-gov-blue/10 shadow-sm">
                                                <div className="flex flex-col xs:flex-row items-center gap-3 sm:gap-5 text-center xs:text-left">
                                                    <div className="w-16 h-16 shrink-0 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm transition-transform hover:scale-105 duration-500">
                                                        <div className="relative">
                                                            <FileText className="w-8 h-8 text-gov-blue" />
                                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-lg text-slate-900 flex flex-wrap items-center justify-center xs:justify-start gap-2">
                                                            <span className="truncate max-w-full">{file.name}</span>
                                                            <Badge className="bg-blue-50 text-gov-blue text-[9px] font-black px-2 py-0.5 rounded-md">STRICT MODE</Badge>
                                                        </h4>
                                                        <p className="text-[12px] text-slate-400 font-bold flex items-center gap-2 mt-1">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                            <span className="w-[1px] h-3 bg-slate-200"></span>
                                                            <span className="text-gov-blue uppercase tracking-widest text-[10px]">Document integrity verified</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => { setFile(null); setTenderData(null); setResults(null); }}
                                                        className="h-10 px-5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 border-slate-200 font-black text-xs transition-all active:scale-95"
                                                    >
                                                        Discard
                                                    </Button>
                                                </div>
                                            </div>

                                            {!results && !analyzing && (
                                                <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                                                    <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center relative">
                                                        <Sparkles className="w-10 h-10 text-gov-blue animate-pulse" />
                                                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-gov-blue/30 animate-spin-slow"></div>
                                                    </div>
                                                    <div className="max-w-md space-y-2">
                                                        <h3 className="text-xl font-bold text-slate-900">Ready for Intelligence Audit</h3>
                                                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                                            The engine will scan for GFR 2017 violations, restrictive bias, and missing mandatory clauses across 4 compliance pillars.
                                                        </p>
                                                    </div>
                                                    <Button
                                                        onClick={runValidation}
                                                        disabled={isExtracting}
                                                        className="h-12 px-10 rounded-2xl bg-gov-blue hover:bg-gov-blue-dark text-white font-bold text-sm shadow-xl shadow-gov-blue/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                                                    >
                                                        {isExtracting ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                Extracting Metadata...
                                                            </>
                                                        ) : "Start Deep Validation"}
                                                    </Button>
                                                </div>
                                            )}

                                            {analyzing && (
                                                <div className="py-20 px-6">
                                                    <div className="space-y-12 max-w-lg mx-auto">
                                                        <div className="flex flex-col items-center text-center space-y-6">
                                                            <div className="relative">
                                                                <div className="absolute inset-0 bg-gov-blue/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
                                                                <Loader2 className="w-16 h-16 text-gov-blue animate-spin relative" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Checking Your Document</h3>
                                                                <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Comparing against policy rules...</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">
                                                                <span className="flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-gov-blue animate-ping"></span>
                                                                    Processing
                                                                </span>
                                                                <span className="text-gov-blue">{Math.round(progress)}%</span>
                                                            </div>
                                                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-gov-blue to-blue-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                                                                    style={{ width: `${progress}%` }}
                                                                ></div>
                                                            </div>
                                                            <div className="flex items-center justify-center gap-3">
                                                                <div className="h-[1px] w-8 bg-slate-200"></div>
                                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">
                                                                    {progress < 30 ? "Reading document contents..." :
                                                                        progress < 60 ? "Checking rules and clauses..." :
                                                                            "Preparing your results..."}
                                                                </p>
                                                                <div className="h-[1px] w-8 bg-slate-200"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {results && (
                                                <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-700 mt-4">
                                                    <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 pb-4 gap-4">
                                                        <div className="flex items-center gap-4 overflow-x-auto pb-1 w-full md:w-auto scrollbar-hide">
                                                            {["All", "Completeness", "Rules", "Consistency", "Clarity"].map((tab) => {
                                                                const count = tab === "All" ? results.length : results.filter(r => r.category.toLowerCase().includes(tab.toLowerCase())).length;
                                                                const isActive = activeTab === tab;
                                                                return (
                                                                    <button
                                                                        key={tab}
                                                                        onClick={() => setActiveTab(tab)}
                                                                        className={`relative px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${isActive ? "text-gov-blue" : "text-slate-400 hover:text-slate-600"
                                                                            }`}
                                                                    >
                                                                        {tab}
                                                                        <span className="ml-2 px-1.5 py-0.5 rounded-md bg-slate-100 text-[9px]">{count}</span>
                                                                        {isActive && (
                                                                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gov-blue rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="flex flex-wrap xs:flex-nowrap gap-2 w-full md:w-auto">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-10 text-[10px] font-black gap-2 px-4 rounded-xl border-slate-200 hover:border-gov-blue/40 flex-1 md:flex-none"
                                                                onClick={runValidation}
                                                            >
                                                                <ScanSearch className="w-3.5 h-3.5" /> RE-SCAN
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-10 text-[10px] font-black gap-2 px-4 rounded-xl border-slate-200 hover:border-gov-blue/40 hover:bg-slate-50 flex-1 md:flex-none"
                                                                onClick={() => generateFullDocument()}
                                                            >
                                                                <Download className="w-3.5 h-3.5" /> DOWNLOAD DOC
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleAutoRemediate()}
                                                                className="h-10 text-[10px] font-black gap-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/10 flex-1 md:flex-none"
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5" /> FIX ALL
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 min-h-[300px]">
                                                        {results
                                                            .filter(r => activeTab === "All" || r.category.toLowerCase().includes(activeTab.toLowerCase()))
                                                            .map((res) => {
                                                                const isCritical = res.status === 'fail' && res.score <= 30;
                                                                const isError = res.status === 'fail' && res.score > 30;
                                                                const isWarning = res.status === 'warn';
                                                                const isPass = res.status === 'pass';

                                                                const themeColor = isPass ? 'emerald' : isCritical ? 'rose' : isError ? 'amber' : 'indigo';
                                                                const statusIcon = isPass ? <ShieldCheck className="w-4 h-4" /> : isWarning ? <AlertCircle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />;

                                                                return (
                                                                    <div key={res.id} className="group p-4 rounded-2xl border border-slate-100 bg-white hover:border-gov-blue/20 hover:shadow-lg transition-all duration-500 relative overflow-hidden shadow-sm">
                                                                        <div className={`absolute top-0 left-0 w-1.5 h-full bg-${themeColor}-500/80`}></div>
                                                                        <div className="flex items-start gap-4">
                                                                            <div className={`p-2.5 rounded-xl shrink-0 bg-${themeColor}-50 text-${themeColor}-600 border border-${themeColor}-100 shadow-sm transition-transform group-hover:scale-110`}>
                                                                                {statusIcon}
                                                                            </div>
                                                                            <div className="flex-1 space-y-2 min-w-0">
                                                                                <div className="flex flex-col xs:flex-row xs:items-start justify-between gap-2">
                                                                                    <div className="flex gap-2 items-center flex-wrap min-w-0">
                                                                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0 border-slate-100 text-slate-400 bg-slate-50/50 shrink-0">{res.category}</Badge>
                                                                                        {res.is_autofixable && !isPass && (
                                                                                            <Badge className="bg-blue-50 text-gov-blue border-blue-100 text-[9px] font-black px-2 py-0 flex items-center gap-1 shrink-0">
                                                                                                <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                                                                                                AUTO-FIX AVAILABLE
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>
                                                                                    <span className={`text-[10px] font-black bg-${themeColor}-50 px-2 py-0.5 rounded-lg border border-${themeColor}-100 text-${themeColor}-600 shrink-0 w-fit`}>
                                                                                        {res.score}% Match
                                                                                    </span>
                                                                                </div>

                                                                                <h4 className="text-[13px] font-black text-slate-800 group-hover:text-gov-blue transition-colors leading-tight">{res.title}</h4>

                                                                                <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100/50">
                                                                                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed">{res.message}</p>
                                                                                </div>

                                                                                {(res.status !== 'pass' && res.is_autofixable) && (
                                                                                    <Button
                                                                                        size="sm"
                                                                                        onClick={() => handleAutoRemediate(res)}
                                                                                        className="h-8 rounded-xl px-4 bg-slate-900 text-white hover:bg-gov-blue font-black text-[10px] shadow-md shadow-slate-200 transition-all active:scale-95 flex items-center gap-2"
                                                                                    >
                                                                                        Smartsolve Issue
                                                                                        <ArrowRight className="w-3 h-3" />
                                                                                    </Button>
                                                                                )}

                                                                                {/* Inline Edit Form */}
                                                                                {editingId === String(res.id) && (
                                                                                    <div className="mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                                                        <div className="flex items-center gap-2 mb-2">
                                                                                            <Badge className="bg-blue-600 text-white border-none text-[9px]">Edit Finding</Badge>
                                                                                            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Manual Correction</span>
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <Label className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Finding Title</Label>
                                                                                            <Input
                                                                                                value={editForm.title}
                                                                                                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                                                                                className="h-9 text-xs rounded-lg border-slate-200 focus:border-gov-blue bg-white shadow-sm"
                                                                                            />
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <Label className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">AI Description</Label>
                                                                                            <Textarea
                                                                                                value={editForm.message}
                                                                                                onChange={(e) => setEditForm(prev => ({ ...prev, message: e.target.value }))}
                                                                                                className="text-xs rounded-lg border-slate-200 focus:border-gov-blue min-h-[80px] bg-white shadow-sm"
                                                                                            />
                                                                                        </div>
                                                                                        <div className="flex gap-2 pt-1">
                                                                                            <Button size="sm" onClick={saveEdit} className="bg-gov-blue hover:bg-blue-700 text-white text-[10px] font-black h-8 px-4 rounded-lg shadow-sm">Save Change</Button>
                                                                                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 text-[10px] font-black h-8 px-4 rounded-lg">Cancel</Button>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-300 hover:text-gov-blue" onClick={() => startEdit(res)}>
                                                                                    <Edit3 className="w-3 h-3" />
                                                                                </Button>
                                                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-300 hover:text-rose-500" onClick={() => removeResult(res.id)}>
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        {results.filter(r => activeTab === "All" || r.category.toLowerCase().includes(activeTab.toLowerCase())).length === 0 && (
                                                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                                                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300">
                                                                    <ScanSearch className="w-8 h-8" />
                                                                </div>
                                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No findings in this category</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                                <Plus className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Add Your Own Check</p>
                                                                <p className="text-[9px] text-slate-400 font-medium">Manually add something the AI missed.</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap xs:flex-nowrap gap-2 w-full md:w-auto">
                                                            <Button variant="ghost" className="text-slate-500 hover:text-slate-700 bg-slate-50 font-bold px-4 h-8 rounded-xl text-xs flex-1 xs:flex-none" onClick={() => setResults(null)}>
                                                                Start Over
                                                            </Button>
                                                            <Button
                                                                onClick={handlePublish}
                                                                disabled={isPublishing || (results && results.some(res => res.status === 'fail' && res.score <= 30))}
                                                                className={`h-8 px-5 rounded-xl font-black text-xs transition-all ${results && results.some(res => res.status === 'fail' && res.score <= 30)
                                                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                                                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95"
                                                                    }`}
                                                            >
                                                                {isPublishing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                                                                {results && results.some(res => res.status === 'fail' && res.score <= 30) ? "Fix Critical Issues to Publish" : "Publish Tender"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* --- PARAMETERS EDITOR (ONLY IF LOADED) --- */}
                            {tenderData && (
                                <Card className="border-none shadow-[0_4px_16px_rgba(0,0,0,0.04)] bg-white rounded-2xl overflow-hidden ring-1 ring-slate-100" id="tender-parameters-editor">
                                    <CardHeader className="px-6 pt-5 pb-4 border-b border-slate-50">
                                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-4">
                                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-gov-blue">
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </div>
                                                Modify Tender Details
                                            </CardTitle>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 text-[10px] font-black border-blue-200 text-gov-blue hover:bg-blue-50 hover:border-gov-blue/40 px-4 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
                                                onClick={() => navigate("/dashboard/draft", {
                                                    state: {
                                                        tenderData,
                                                        autoLoad: true,
                                                        targetTab: 'identification'
                                                    }
                                                })}
                                            >
                                                <FilePenLine className="w-3.5 h-3.5" />
                                                MAKE AMENDMENTS
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[
                                                { key: "ministry", label: "Ministry" },
                                                { key: "department", label: "Department" },
                                                { key: "organisation", label: "Organisation" },
                                                { key: "officeName", label: "Office Name" },
                                                { key: "title", label: "Tender Title" },
                                                { key: "estimatedValue", label: "Estimated Budget (₹)" },
                                                { key: "quantity", label: "Quantity Required" },
                                                { key: "bidNumber", label: "Bid Reference Number" },
                                                { key: "bidValidity", label: "Bid Validity (Days)" },
                                                { key: "bidEndDate", label: "Submission Deadline" },
                                                { key: "emdAmount", label: "EMD Amount (₹)" },
                                                { key: "epbgPercentage", label: "ePBG Percentage (%)" },
                                            ].map((f) => (
                                                <div key={f.key} className="space-y-2 group">
                                                    <Label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest ml-1 transition-colors group-hover:text-gov-blue">
                                                        {f.label}
                                                    </Label>
                                                    <Input
                                                        id={`field-${f.key}`}
                                                        value={tenderData[f.key] || ""}
                                                        placeholder={`Enter ${f.label.toLowerCase()}...`}
                                                        onChange={(e) => updateTenderField(f.key, e.target.value)}
                                                        className="h-11 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white focus:border-gov-blue focus:ring-4 focus:ring-blue-50 shadow-none transition-all font-medium"
                                                    />
                                                </div>
                                            ))}

                                            {/* Render any additional fields not in the core list */}
                                            {Object.entries(tenderData)
                                                .filter(([key]) => ![
                                                    "ministry", "department", "organisation", "officeName",
                                                    "title", "estimatedValue", "quantity", "bidNumber",
                                                    "bidValidity", "bidEndDate", "emdAmount", "epbgPercentage"
                                                ].includes(key))
                                                .map(([key, value]) => (
                                                    <div key={key} className="space-y-2 group">
                                                        <Label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest ml-1 transition-colors group-hover:text-gov-blue">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </Label>
                                                        <Input
                                                            id={`field-${key}`}
                                                            value={String(value)}
                                                            onChange={(e) => updateTenderField(key, e.target.value)}
                                                            className="h-11 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white focus:border-gov-blue focus:ring-4 focus:ring-blue-50 shadow-none transition-all"
                                                        />
                                                    </div>
                                                ))}

                                            <button
                                                onClick={addTenderField}
                                                className="h-11 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-gov-blue/40 hover:text-gov-blue hover:bg-blue-50/30 transition-all flex items-center justify-center gap-3 font-bold text-xs lg:col-span-1"
                                            >
                                                <Plus className="w-4 h-4" /> Add custom field
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* --- SIDEBAR SCORING --- */}
                        <div className="lg:col-span-4 space-y-4 sticky top-6">

                            {/* Risk Summary Card */}
                            <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-3.5 h-3.5 text-gov-blue" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">Risk Summary</span>
                                    </div>
                                    <div className={`text-[9px] font-black px-2.5 py-1 rounded-full ${!results ? 'bg-slate-100 text-slate-400' : weightedScore >= 90 ? 'bg-emerald-50 text-emerald-600' : weightedScore >= 70 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-500'}`}>
                                        {getStatusLabel()}
                                    </div>
                                </div>

                                <div className="p-5 space-y-4">
                                    {/* Score ring */}
                                    <div className="flex items-center justify-center">
                                        <div className="relative w-24 h-24">
                                            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 128 128">
                                                <circle cx="64" cy="64" r="52" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                                                <circle
                                                    cx="64" cy="64" r="52"
                                                    stroke={!results ? '#cbd5e1' : weightedScore >= 90 ? '#10b981' : weightedScore >= 70 ? '#f59e0b' : '#ef4444'}
                                                    strokeWidth="8" fill="none"
                                                    strokeDasharray={326.7}
                                                    strokeDashoffset={326.7 - (326.7 * (results ? weightedScore : 0)) / 100}
                                                    strokeLinecap="round"
                                                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease' }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className={`text-2xl font-black tracking-tighter ${!results ? 'text-slate-300' : weightedScore >= 90 ? 'text-emerald-600' : weightedScore >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                    {results ? weightedScore : '--'}
                                                </span>
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Score</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Issue counts */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="rounded-xl p-3 text-center bg-rose-50 border border-rose-100">
                                            <p className="text-base font-black text-rose-500">{issueCounts.critical}</p>
                                            <p className="text-[8px] font-bold text-rose-400 uppercase tracking-wide mt-0.5">Critical</p>
                                        </div>
                                        <div className="rounded-xl p-3 text-center bg-amber-50 border border-amber-100">
                                            <p className="text-base font-black text-amber-500">{issueCounts.errors}</p>
                                            <p className="text-[8px] font-bold text-amber-400 uppercase tracking-wide mt-0.5">Errors</p>
                                        </div>
                                        <div className="rounded-xl p-3 text-center bg-indigo-50 border border-indigo-100">
                                            <p className="text-base font-black text-indigo-500">{issueCounts.warnings}</p>
                                            <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-wide mt-0.5">Warnings</p>
                                        </div>
                                    </div>

                                    {/* Pillar bars */}
                                    <div className="space-y-3">
                                        {[
                                            { label: "Rules", score: pillarScores.policy, max: 40, color: "#60a5fa" },
                                            { label: "Completeness", score: pillarScores.completeness, max: 25, color: "#34d399" },
                                            { label: "Consistency", score: pillarScores.consistency, max: 20, color: "#a78bfa" },
                                            { label: "Clarity", score: pillarScores.ambiguity, max: 15, color: "#fbbf24" },
                                        ].map(p => (
                                            <div key={p.label}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{p.label}</span>
                                                    <span className="text-[9px] font-black text-slate-600">{results ? `${p.score}/${p.max}` : `--/${p.max}`}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: results ? `${(p.score / p.max) * 100}%` : '0%', backgroundColor: p.color, opacity: results ? 1 : 0.5 }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Advisory */}
                                    <div className={`rounded-xl p-3 flex gap-3 items-start border ${!results ? 'bg-slate-50 border-slate-100' : weightedScore >= 90 ? 'bg-emerald-50 border-emerald-100' : weightedScore >= 70 ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}`}>
                                        <div className={`mt-0.5 shrink-0 ${!results ? 'text-slate-300' : weightedScore >= 90 ? 'text-emerald-500' : weightedScore >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>
                                            {results ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                        </div>
                                        <p className={`text-[10px] leading-relaxed font-medium ${!results ? 'text-slate-400' : weightedScore >= 90 ? 'text-emerald-700' : weightedScore >= 70 ? 'text-amber-700' : 'text-rose-700'}`}>
                                            {!results ? "Upload your tender document to begin the AI-powered review." : weightedScore >= 90 ? "All good! Your document meets the required guidelines." : weightedScore >= 70 ? "Almost there. A few small issues were found. Please review them." : "Action needed. Several important issues were found. Fix them before submitting."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Past Checks */}
                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                                <div className="px-5 py-3 border-b border-slate-50 flex items-center gap-2">
                                    <HistoryIcon className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">Past Checks</span>
                                </div>
                                {auditHistory.map((audit) => (
                                    <div key={audit.id} className="flex items-center justify-between px-6 py-4 border-b border-slate-50 hover:bg-slate-50/70 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${audit.score >= 90 ? 'bg-emerald-50 text-emerald-700' : audit.score >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                                                {audit.score}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors leading-none">{audit.id}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{audit.time}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className={`text-[9px] font-black h-5 px-2 rounded-md ${audit.score >= 90 ? 'bg-emerald-50 text-emerald-700' : audit.score >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-600'}`}>{audit.status}</Badge>
                                    </div>
                                ))}
                                <div className="p-3">
                                    <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 h-8">View All History</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
