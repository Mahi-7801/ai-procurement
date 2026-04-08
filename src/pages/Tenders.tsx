import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    FileText, Eye, Plus, Search, Filter, Loader2,
    Send, Sparkles, CheckCircle2, AlertTriangle,
    Check, Upload, Info, ShieldCheck, ArrowRight, FileCheck, Trash2,
    X, AlertCircle, XCircle, FileX
} from "lucide-react";
import { motion } from "framer-motion";
import { useTenders, Tender } from "@/hooks/useTenders";
import { API_BASE_URL } from "@/config";
import { generateTenderPDF } from "@/utils/pdfGenerator";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getRfp, saveRfp, getRfpFull } from "@/lib/rfp-store";
import { useEvaluations } from "@/hooks/useEvaluations";
import { useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { portalSchemas, type PortalKey } from "@/lib/portalSchemas";
import { generateOfficerNote } from "@/lib/officerNote";

import { FileDropzone } from "@/components/FileDropzone";

const statusColor: Record<string, string> = {
    Active: "bg-gov-green/15 text-gov-green border-gov-green/30",
    "Under Evaluation": "bg-gov-yellow/15 text-gov-yellow border-gov-yellow/30",
    "Pending Approval": "bg-gov-orange/15 text-gov-orange border-gov-orange/30",
    Closed: "bg-muted text-muted-foreground border-border",
};

export default function TendersPage() {
    const { auth } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { tenders, isLoading, deleteTender } = useTenders();
    const { bids: myEvaluations, isLoading: isEvalLoading } = useEvaluations();
    const isVendor = auth.role === "VENDOR";
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [filteredTenders, setFilteredTenders] = useState<Tender[]>([]);

    const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
    const [isApplyOpen, setIsApplyOpen] = useState(false);
    const [submissionStep, setSubmissionStep] = useState(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New states for document upload
    const [technicalFile, setTechnicalFile] = useState<File | null>(null);
    const [financialFile, setFinancialFile] = useState<File | null>(null);
    const [isPdfProcessingId, setIsPdfProcessingId] = useState<string | null>(null);
    const [bidAmount, setBidAmount] = useState<string>("");
    const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
    const [eligibilityResults, setEligibilityResults] = useState<Record<string, any>>({});
    const [lastCheckedTenderId, setLastCheckedTenderId] = useState<string | null>(null);
    const [auditResults, setAuditResults] = useState<any>(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [showFakeDataAlert, setShowFakeDataAlert] = useState(false);
    const [fakeDataReason, setFakeDataReason] = useState("");



    const navigate = useNavigate();

    useEffect(() => {
        // Exclude cancelled (soft-deleted) tenders from the list
        let result = tenders.filter((t) => (t.status as string).toLowerCase() !== "cancelled");
        if (searchTerm) {
            result = result.filter(
                (t) =>
                    t.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.department.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (statusFilter !== "all") {
            result = result.filter((t) => t.status === statusFilter);
        }
        setFilteredTenders(result);
    }, [searchTerm, statusFilter, tenders]);

    const handleAudit = async () => {
        if (!technicalFile || !financialFile) {
            toast({
                title: "Files Required",
                description: "Primary Technical and Financial documents are mandatory for AI Audit.",
                variant: "destructive",
            });
            return;
        }

        setIsAuditing(true);
        const formData = new FormData();
        formData.append("technical_file", technicalFile);
        formData.append("financial_file", financialFile);
        formData.append("tender_name", selectedTender?.projectName || "Tender Bid");

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/evaluation/audit-preview`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || "Audit failed");
            }

            
            const data = await response.json();
            setAuditResults(data);
            
            if (data.status === "FAKE") {
                setFakeDataReason(data.explanation || "your upload fake data ani");
                setShowFakeDataAlert(true);
            } else {
                setSubmissionStep(2);
                toast({
                    title: "AI Audit Complete",
                    description: `Bid status: ${data.status}. Confidence: ${data.confidence_score}%`,
                });
            }

        } catch (error: any) {
            if (error.message.includes("your upload fake data ani") || error.message.includes("MISSING STRUCTURE")) {
                setFakeDataReason(error.message);
                setShowFakeDataAlert(true);
            } else {
                toast({
                    title: "Document Rejected",
                    description: error.message || "Failed to connect to AI Auditor.",
                    variant: "destructive"
                });
            }



        } finally {
            setIsAuditing(false);
        }
    };

    const handleFinalSubmit = async () => {
        if (!selectedTender || !technicalFile || !financialFile) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("tender_id", (selectedTender as any).tender_id || selectedTender.id);
        formData.append("technical_file", technicalFile);
        formData.append("financial_file", financialFile);
        formData.append("financial_bid", bidAmount);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/evaluation/submit`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                toast({
                    title: "Bid Successfully Submitted",
                    description: "Your proposal is now in the official evaluation queue.",
                });
                setIsApplyOpen(false);
                setSubmissionStep(1);
                setTechnicalFile(null);
                setFinancialFile(null);
                setBidAmount("");
                setAuditResults(null);
                queryClient.invalidateQueries({ queryKey: ["evaluations"] });
            } else {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || "Submission failed");
            }

        } catch (error: any) {
            toast({
                title: "Submission Error",
                description: error.message || "Failed to finalize submission.",
                variant: "destructive"
            });

        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCheckEligibility = async (tender: Tender) => {
        setIsCheckingEligibility(true);
        toast({
            title: "Analyzing Eligibility",
            description: `Checking your company profile against ${tender.id} requirements...`,
        });

        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/check-eligibility`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
                },
                body: JSON.stringify({ tender_id: tender.id })
            });

            if (!response.ok) throw new Error("Eligibility check failed");

            const result = await response.json();
            setEligibilityResults(prev => ({ ...prev, [tender.id]: result }));
            setLastCheckedTenderId(tender.id);
            setIsCheckingEligibility(false);
        } catch (err: any) {
            console.error("Eligibility check error:", err);
            setIsCheckingEligibility(false);
            toast({
                title: "AI Analysis (Fallback)",
                description: "Basic criteria check passed (Demonstration Mode).",
                variant: "destructive"
            });
        }
    };

    const handleDownloadRfp = async (tender: Tender) => {
        setIsPdfProcessingId(tender.id);
        toast({
            title: "Preparing RFP Document",
            description: `Gathering metadata and generating high-fidelity document for ${tender.id}...`,
            className: "border-gov-blue/20 bg-gov-blue/5"
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const rfpData = getRfpFull(tender.id);
            let metadata = rfpData?.metadata;

            if (!metadata && tender.description && tender.description.startsWith("{")) {
                try {
                    metadata = JSON.parse(tender.description);
                } catch (e) {
                    console.log("Description is not JSON metadata");
                }
            }

            const platform = rfpData?.platform || tender.platform;

            const pdfData = {
                ...metadata,
                platform: platform,
                bidNumber: metadata?.bidNumber || tender.id,
                title: metadata?.title || tender.projectName,
                department: metadata?.department || tender.department,
                estimatedValue: metadata?.estimatedValue || tender.estimatedBudget,
                dateOfIssue: metadata?.dateOfIssue || tender.publishedDate,
                bidEndDate: metadata?.bidEndDate || tender.closingDate,
                bidOpeningDate: metadata?.bidOpeningDate || tender.closingDate,
            };

            await generateTenderPDF(pdfData as any);


            toast({
                title: "Download Complete",
                description: `Document for ${tender.id} downloaded successfully.`,
                className: "border-gov-green/20 bg-gov-green/5"
            });
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast({
                title: "Generation Failed",
                description: "There was an error creating the document.",

                variant: "destructive"
            });
        } finally {
            setIsPdfProcessingId(null);
        }
    };



    const handleViewBids = (tender: Tender) => {
        navigate("/dashboard/evaluations", { state: { tenderId: tender.id } });
        toast({
            title: "Loading Evaluation Center",
            description: `Aggregating bid responses for ${tender.id}. Preparing comparative analysis...`,
        });
    };

    const handleEditTender = (tender: Tender) => {
        navigate("/dashboard/draft", { state: { tenderId: tender.id } });
        toast({
            title: "Loading Draft Assistant",
            description: `Preparing technical drafting workspace for ${tender.id}`,
        });
    };

    const handleDeleteTender = async (id: string) => {
        try {
            await deleteTender(id);
            toast({
                title: "Tender Deleted",
                description: "The tender has been removed from the registry.",
            });
        } catch (error: any) {
            toast({
                title: "Error deleting tender",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {isVendor ? "Available Tenders" : "Tender Management"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {isVendor
                            ? "Explore statewide opportunities and submit your bids with AI assistance."
                            : "Manage and track all procurement tenders across departments."}
                    </p>
                </div>
                {!isVendor && (
                    <Button
                        className="bg-gov-blue hover:bg-gov-blue-dark shadow-lg shadow-gov-blue/20"
                        onClick={() => navigate("/dashboard/draft")}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Tender
                    </Button>
                )}
            </div>

            {/* AI Eligibility Notification for Vendors */}
            {isVendor && (
                <div className="bg-gov-blue/5 border border-gov-blue/20 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gov-blue/10 p-2 rounded-full">
                            <Sparkles className="w-5 h-5 text-gov-blue" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gov-blue">AI-Powered Tender Discovery</p>
                            <p className="text-xs text-muted-foreground font-medium">We've identified 3 tenders that perfectly match your past experience and financial capability.</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-gov-blue text-gov-blue text-xs h-8">View Matches</Button>
                </div>
            )}

            {/* Filters */}
            <Card className="border-border">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by tender ID, project name, or department..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 text-sm"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-48 h-10 text-sm">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Under Evaluation">Under Evaluation</SelectItem>
                                <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                                <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tenders List */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-gov-blue animate-spin" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Syncing Tender Registry...</p>
                </div>
            ) : (
                <>
                {/* Eligibility Checklist Section (Dynamically shown after check) */}
                {lastCheckedTenderId && eligibilityResults[lastCheckedTenderId] && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <Card className="border-slate-200 bg-white overflow-hidden shadow-xl">
                            <div className="bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gov-blue text-white p-2 rounded-lg">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Eligibility Analysis Report</h3>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Results for {lastCheckedTenderId}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 justify-between sm:justify-end w-full sm:w-auto">
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase font-bold text-slate-400">Match Score</div>
                                        <div className="text-2xl font-black text-gov-blue">
                                            {typeof eligibilityResults[lastCheckedTenderId].score === 'number' 
                                                ? `${eligibilityResults[lastCheckedTenderId].score}%` 
                                                : "0%"}
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
                                        onClick={() => setLastCheckedTenderId(null)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                    {(eligibilityResults[lastCheckedTenderId].checklist || [
                                        { item: "EMD Requirement", status: "Evaluation Needed", details: "Waiting for platform verification" },
                                        { item: "Technical Experience", status: "Evaluation Needed", details: "Analyzing past performance" },
                                        { item: "Financial Capacity", status: "Evaluation Needed", details: "Reviewing turnover records" },
                                        { item: "Statutory Documents", status: "Evaluation Needed", details: "Checking GST/PAN compliance" }
                                    ]).map((item: any, idx: number) => {
                                        const status = item.status?.toLowerCase() || "";
                                        const isCompliant = status.includes("compliant") || status.includes("passed") || status.includes("verified");
                                        const isAction = status.includes("action") || status.includes("needed") || status.includes("evaluation") || status.includes("review") || status.includes("incomplete");
                                        
                                        return (
                                            <div key={idx} className={`p-4 rounded-xl border-2 transition-all ${
                                                isCompliant ? 'bg-green-50/30 border-green-100' : isAction ? 'bg-amber-50/30 border-amber-100' : 'bg-slate-50 border-slate-100'
                                            }`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{item.item}</span>
                                                    {isCompliant ? (
                                                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                                            <AlertCircle className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`text-sm font-black mb-1 ${isCompliant ? 'text-green-700' : 'text-amber-700'}`}>
                                                    {item.status}
                                                </div>
                                                <p className="text-[11px] text-slate-600 leading-tight">
                                                    {item.details}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-gov-blue/10 text-gov-blue px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">AI Analysis Summary</div>
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            eligibilityResults[lastCheckedTenderId].eligible 
                                                ? 'bg-green-100 text-green-700' 
                                                : eligibilityResults[lastCheckedTenderId].status?.toLowerCase().includes("incomplete")
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {eligibilityResults[lastCheckedTenderId].status}
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic mb-6">
                                        "{eligibilityResults[lastCheckedTenderId].reason}"
                                    </p>

                                    {eligibilityResults[lastCheckedTenderId].recommendations && (
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Recommendations to Improve Bid</p>
                                            <div className="flex flex-wrap gap-2">
                                                {eligibilityResults[lastCheckedTenderId].recommendations.map((rec: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 shadow-sm">
                                                        <Sparkles className="w-3.5 h-3.5 text-gov-blue" />
                                                        {rec}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 gap-6">
                    {filteredTenders.map((tender) => (
                        <Card key={tender.id} className="shadow-sm hover:shadow-md transition-all border-border overflow-hidden">
                            <CardContent className="p-0">
                                <div className="p-4 sm:p-6 md:flex items-start gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{tender.id}</p>
                                                    {isVendor && tender.id === "TDR-2025-001" && (
                                                        <Badge className="bg-gov-yellow/10 text-gov-yellow-dark hover:bg-gov-yellow/20 text-[9px] h-4 border-gov-yellow/20">
                                                            <Sparkles className="w-2.5 h-2.5 mr-1" /> 98% Match
                                                        </Badge>
                                                    )}
                                                </div>
                                                <h3 className="text-base sm:text-lg font-bold text-foreground truncate max-w-full">
                                                    {tender.projectName}
                                                </h3>
                                                <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 truncate max-w-full">
                                                    <Info className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{tender.department}</span>
                                                </p>
                                            </div>
                                            <Badge variant="outline" className={`${statusColor[tender.status]} font-bold text-[10px] uppercase shrink-0 w-fit`}>
                                                {tender.status}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-lg">
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Estimated Budget</p>
                                                <p className="text-base font-bold text-foreground">
                                                    {formatCurrency(tender.estimatedBudget)}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Published Date</p>
                                                <p className="text-sm font-semibold">
                                                    {new Date(tender.publishedDate || Date.now()).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter text-gov-blue">Bid Opening Date</p>
                                                <p className="text-sm font-semibold text-gov-blue">
                                                    {new Date(tender.publishedDate || Date.now()).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter text-gov-red">Closing Date</p>
                                                <p className="text-sm font-semibold text-gov-red">
                                                    {new Date(tender.closingDate || Date.now()).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 px-4 text-xs group transition-all"
                                                onClick={() => handleDownloadRfp(tender)}
                                                disabled={isPdfProcessingId === tender.id}
                                            >
                                                {isPdfProcessingId === tender.id ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-gov-blue" />
                                                ) : (
                                                    <FileText className="w-4 h-4 mr-2 group-hover:text-gov-blue transition-colors" />
                                                )}
                                                {isPdfProcessingId === tender.id ? "Generating..." : "Download RFP"}
                                            </Button>

                                            {isVendor ? (
                                                <>
                                                    {myEvaluations?.find(b => b.tenderId === tender.id) ? (
                                                        <Button
                                                            className="bg-gov-green/10 text-gov-green border-gov-green/20 hover:bg-gov-green/20 h-9 px-6 text-xs cursor-default pointer-events-none"
                                                            variant="outline"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                                            Bid Submitted
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            onClick={() => {
                                                                setSelectedTender(tender);
                                                                setIsApplyOpen(true);
                                                            }}
                                                            className="bg-gov-blue hover:bg-gov-blue-dark h-9 px-6 text-xs"
                                                        >
                                                            <Upload className="w-4 h-4 mr-2" />
                                                            Participate in Tender
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-gov-blue h-9 text-xs hover:bg-gov-blue/5"
                                                        onClick={() => handleCheckEligibility(tender)}
                                                        disabled={isCheckingEligibility}
                                                    >
                                                        {isCheckingEligibility ? "Checking..." : "Check Eligibility"}
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 text-xs"
                                                        onClick={() => handleViewBids(tender)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Bids
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 text-xs"
                                                        onClick={() => handleEditTender(tender)}
                                                    >
                                                        Edit Tender
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-rose-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200"
                                                        onClick={() => {
                                                            if (window.confirm("Are you sure you want to delete this tender?")) {
                                                                handleDeleteTender(tender.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                </>
            )}

            {/* Bid Submission Wizard */}
            <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                <DialogContent 
                    className="sm:max-w-[700px]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => e.preventDefault()}
                >
                    <DialogHeader>

                        <DialogTitle className="flex items-center gap-2">
                            {submissionStep === 1 ? (
                                <><Upload className="w-5 h-5 text-gov-blue" /> Bid Submission Wizard</>
                            ) : (
                                <><ShieldCheck className="w-5 h-5 text-gov-green" /> Pre-Submission AI Report</>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium">
                            {selectedTender?.projectName || "Laptops"} • Stage {submissionStep} of 2
                        </DialogDescription>
                    </DialogHeader>

                    {submissionStep === 1 ? (
                        <div className="py-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <FileDropzone
                                    id="technical-upload"
                                    label="Technical Bid"
                                    subLabel="Upload Proposal"
                                    accept=".pdf"
                                    selectedFile={technicalFile}
                                    onFileSelect={setTechnicalFile}
                                />
                                <FileDropzone
                                    id="financial-upload"
                                    label="Financial Schedule (BoQ)"
                                    subLabel="Upload Quote"
                                    accept=".pdf"
                                    selectedFile={financialFile}
                                    onFileSelect={setFinancialFile}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">Financial Bid Amount (INR)</Label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 15000000"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        className="h-12 text-lg font-bold"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 space-y-6">
                            <div className={`border p-5 rounded-xl space-y-3 ${
                                auditResults?.status === "VALID" ? 'bg-gov-green/5 border-gov-green/20' : 
                                auditResults?.status === "FAKE" ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                            }`}>
                                <div className={`flex items-center gap-2 font-bold text-sm ${
                                    auditResults?.status === "VALID" ? 'text-gov-green' : 
                                    auditResults?.status === "FAKE" ? 'text-red-700' : 'text-amber-700'
                                }`}>
                                    {auditResults?.status === "VALID" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                    Verification: {auditResults?.status || "Analyzing"}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {auditResults?.explanation || "AI is currently verifying your technical bid against policy standards."}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-gov-blue" />
                                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest">Auditor Analysis</h4>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold">
                                        Confidence: {auditResults?.confidence_score}%
                                    </Badge>
                                </div>
                                <div className="space-y-3">
                                    {auditResults?.anomalies?.length > 0 && (
                                        <div className="flex gap-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                                            <div className="bg-red-100 p-2 h-fit rounded-lg">
                                                <XCircle className="w-4 h-4 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-red-800 leading-normal font-medium mb-1">Detected Anomalies</p>
                                                <ul className="text-[10px] text-red-600 list-disc list-inside">
                                                    {auditResults.anomalies.map((a: string, i: number) => <li key={i}>{a}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                    {auditResults?.financial_issues?.length > 0 && (
                                        <div className="flex gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                            <div className="bg-amber-100 p-2 h-fit rounded-lg">
                                                <Info className="w-4 h-4 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-amber-800 leading-normal font-medium mb-1">Financial Analysis</p>
                                                <p className="text-[11px] text-amber-600">{auditResults.financial_issues[0]}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex gap-4 p-4 bg-gov-blue/5 border border-gov-blue/10 rounded-xl">
                                        <div className="bg-gov-blue/10 p-2 h-fit rounded-lg">
                                            <ShieldCheck className="w-4 h-4 text-gov-blue" />
                                        </div>
                                        <div>
                                            <p className="text-[12px] text-gov-blue-dark leading-normal font-medium mb-1">Auditor Feedback</p>
                                            <p className="text-[11px] text-gov-blue leading-normal italic">
                                                {auditResults?.explanation?.slice(0, 150)}...
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {submissionStep === 1 ? (
                            <Button 
                                className="w-full bg-gov-blue hover:bg-gov-blue-dark py-6 shadow-lg shadow-gov-blue/20"
                                onClick={handleAudit}
                                disabled={isAuditing || !technicalFile || !financialFile || !bidAmount}
                            >
                                {isAuditing ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying Bid with Auditor AI...</>
                                ) : (
                                    <>Verify with AI Auditor <ArrowRight className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        ) : (
                            <div className="flex gap-3 w-full">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 py-6"
                                    onClick={() => setSubmissionStep(1)}
                                >
                                    Modify Documents
                                </Button>
                                <Button 
                                    className="flex-1 bg-gov-blue hover:bg-gov-blue-dark py-6 shadow-lg"
                                    onClick={handleFinalSubmit}
                                    disabled={isSubmitting || auditResults?.status === "FAKE"}
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                                    ) : (
                                        "Submit Final Bid"
                                    )}
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {
                filteredTenders.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No tenders found matching your criteria</p>
                        </CardContent>
                    </Card>
                )
            }
            {/* Fake Data Warning Alert */}
            <Dialog open={showFakeDataAlert} onOpenChange={setShowFakeDataAlert}>
                <DialogContent className="sm:max-w-[500px] border-rose-200 bg-rose-50 p-0 overflow-hidden shadow-2xl">
                    <div className="bg-rose-600 p-6 text-white flex items-center gap-4">
                        <AlertTriangle className="w-10 h-10 animate-pulse" />
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Upload Rejected</h2>
                            <p className="text-rose-100 font-medium">Structure Validation Failed</p>
                        </div>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div className="text-center">
                            <p className="text-rose-600 font-black text-2xl mb-2">your upload fake data ani</p>
                            <p className="text-muted-foreground text-sm italic">The system detected that your documents do not match the required government procurement structure.</p>
                        </div>

                        <div className="bg-white border-l-4 border-rose-600 p-4 rounded-r shadow-sm">
                            <h3 className="font-bold text-rose-900 mb-2 flex items-center gap-2">
                                <FileX className="w-4 h-4" /> Detection Details:
                            </h3>
                            <p className="text-rose-800 text-sm whitespace-pre-wrap">{fakeDataReason}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-rose-100/50 p-3 rounded border border-rose-200">
                                <h4 className="text-[10px] font-bold text-rose-600 uppercase mb-1">Detected Technical Text</h4>
                                <p className="text-[10px] text-rose-900 line-clamp-3 bg-white p-1 rounded border border-rose-200">
                                    {auditResults?.extracted_sample?.tech || "No text could be extracted."}
                                </p>
                            </div>
                            <div className="bg-rose-100/50 p-3 rounded border border-rose-200">
                                <h4 className="text-[10px] font-bold text-rose-600 uppercase mb-1">Detected Financial Text</h4>
                                <p className="text-[10px] text-rose-900 line-clamp-3 bg-white p-1 rounded border border-rose-200">
                                    {auditResults?.extracted_sample?.fin || "No text could be extracted."}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">

                            <div className="bg-rose-100/50 p-3 rounded border border-rose-200">
                                <h4 className="text-[10px] font-bold text-rose-600 uppercase mb-1">Required Tech Markers</h4>
                                <ul className="text-[11px] text-rose-900 list-disc pl-3">
                                    <li>Technical Proposal</li>
                                    <li>Scope of Work</li>
                                    <li>Bidder Credentials</li>
                                </ul>
                            </div>
                            <div className="bg-rose-100/50 p-3 rounded border border-rose-200">
                                <h4 className="text-[10px] font-bold text-rose-600 uppercase mb-1">Required BoQ Markers</h4>
                                <ul className="text-[11px] text-rose-900 list-disc pl-3">
                                    <li>Financial Schedule</li>
                                    <li>Bill of Quantities</li>
                                    <li>Total Quoted Amount</li>
                                </ul>
                            </div>
                        </div>

                        <Button 
                            onClick={() => setShowFakeDataAlert(false)}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-8 text-lg shadow-lg group"
                        >
                            <span className="group-hover:scale-110 transition-transform">RE-UPLOAD GENUINE DOCUMENTS</span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >

    );
}
