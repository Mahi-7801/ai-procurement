import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VendorBid } from "@/lib/mock-data";
import { 
    Search, Filter, ChevronRight, Download, Eye, ShieldCheck, 
    Sparkles, RefreshCcw, AlertTriangle, Terminal, ArrowRight,
    FileText, Loader2, Info, ListFilter, Bell, Clock, Trash2,
    Award, CheckCircle, Shield
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEvaluations } from "@/hooks/useEvaluations";
import { useTenders } from "@/hooks/useTenders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_BASE_URL } from "@/config";
import { useAuth } from "@/lib/auth-context";
import { generateTECReportPDF } from "@/utils/pdfGenerator";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "react-router-dom";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const rankColor: Record<string, string> = {
    H1: "bg-gov-blue text-primary-foreground",
    H2: "bg-gov-blue/80 text-primary-foreground",
    H3: "bg-gov-blue/60 text-primary-foreground",
    L1: "bg-emerald-600 text-primary-foreground",
    L2: "bg-emerald-400 text-primary-foreground",
    L3: "bg-gov-red-light text-primary-foreground",
};



export default function EvaluationsPage() {
    const { tenders, updateTender } = useTenders();
    const queryClient = useQueryClient();
    const [selectedTenderId, setSelectedTenderId] = useState<string>("");
    const { bids, isLoading } = useEvaluations(selectedTenderId);
    const [risks, setRisks] = useState<any[]>([]);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const [isReverifying, setIsReverifying] = useState(false);
    const [viewingBid, setViewingBid] = useState<any | null>(null);
    const [selectedDocsBid, setSelectedDocsBid] = useState<any | null>(null);
    const [evaluationResult, setEvaluationResult] = useState<any | null>(null);
    const activeTender = tenders.find(t => t.id === selectedTenderId);
    const { auth } = useAuth();

    const location = useLocation();

    useEffect(() => {
        if (location.state?.tenderId) {
            setSelectedTenderId(location.state.tenderId);
        } else if (tenders.length > 0 && !selectedTenderId) {
            setSelectedTenderId(tenders[0].id);
        }
    }, [tenders, selectedTenderId, location.state]);

    useEffect(() => {
        if (selectedTenderId) {
            fetchRisks();
        }
    }, [selectedTenderId]);

    const fetchRisks = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/evaluation/tender/${selectedTenderId}/bids`, {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            // This just verifies the bids, risks are actually in a different endpoint
            const risksResp = await fetch(`${API_BASE_URL}/api/risks/tender/${selectedTenderId}/alerts`, {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            if (risksResp.ok) {
                const data = await risksResp.json();
                setRisks(data);
            }
        } catch (e) {
            console.error("Failed to fetch risks", e);
        }
    };

    const handleStartEvaluation = async () => {
        if (!selectedTenderId) return;
        setIsEvaluating(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/evaluation/tender/${selectedTenderId}/evaluate`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            
            if (response.ok) {
                const result = await response.json();
                setEvaluationResult(result);
                setIsEvaluating(false);
                queryClient.invalidateQueries({ queryKey: ["evaluations", selectedTenderId] });
                queryClient.invalidateQueries({ queryKey: ["tenders"] });
                fetchRisks();
                toast.success("Comparative AI Complete", { description: "Ranking and notifications processed." });
            } else {
                throw new Error("Evaluation failed");
            }
        } catch (error) {
            console.error("Evaluation error:", error);
            toast.error("AI Evaluation Failed", { description: "Please ensure bids are submitted and server is active." });
            setIsEvaluating(false);
        }
    };

    const handleResolve = async () => {
        if (!selectedTenderId) {
            toast.error("Please select a tender first");
            return;
        }
        setIsResolving(true);
        
        try {
            // In a real scenario, we might want to fetch the latest state from the server
            // or perform a final AI verification step here
            const actualActiveTender = tenders.find(t => t.id === selectedTenderId);
            await generateTECReportPDF(actualActiveTender, bids, risks);
            setIsResolving(false);
            
            // AUTOMATICALLY move the lifecycle to Approved stage once TEC is generated
            if (actualActiveTender) {
                await updateTender({
                    id: selectedTenderId,
                    data: { status: "Approved" }
                });
                queryClient.invalidateQueries({ queryKey: ["tenders"] });
            }

            toast.success("Compliance Clauses Resolved", { 
                description: "Final TEC report generated and status updated to APPROVED." 
            });
        } catch (error) {
            console.error("Failed to generate TEC report", error);
            toast.error("Generation Failed", { description: "Could not create the TEC report document." });
            setIsResolving(false);
        }
    };

    const handleAwardTender = async () => {
        if (!selectedTenderId) return;
        
        const loadingToast = toast.loading("Finalizing award and notifying vendors...");
        try {
            const response = await fetch(`${API_BASE_URL}/api/evaluation/tender/${selectedTenderId}/award`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            
            if (response.ok) {
                toast.dismiss(loadingToast);
                toast.success("Tender Awarded Successfully", { 
                    description: "Status changed to CLOSED. All participating vendors have been notified of the final outcome.",
                    icon: <CheckCircle className="w-5 h-5 text-emerald-500" />
                });
                queryClient.invalidateQueries({ queryKey: ["tenders"] });
                queryClient.invalidateQueries({ queryKey: ["evaluations", selectedTenderId] });
            } else {
                const errorData = await response.json().catch(() => ({}));
                toast.dismiss(loadingToast);
                toast.error("Award Failed", { description: errorData.detail || "Server error" });
            }
        } catch (e) {
            toast.dismiss(loadingToast);
            toast.error("Network error during award process");
        }
    };

    const handleResetSingle = async (bidId: number) => {
        console.log("Attempting to reset bid:", bidId);
        if (!bidId) {
            toast.error("Bid ID is missing. Cannot reset.");
            return;
        }
        
        const loadingToast = toast.loading("Resetting evaluation scores...");
        try {
            const response = await fetch(`${API_BASE_URL}/api/evaluation/bid/${bidId}/reset`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            
            if (response.ok) {
                toast.dismiss(loadingToast);
                toast.success("Vendor Notified for Re-Evaluation", { 
                    description: "Current scores are preserved. An alert has been sent to the vendor to update their submission.",
                    icon: <Bell className="w-4 h-4 text-amber-500" />
                });
                setViewingBid(null);
                queryClient.invalidateQueries({ queryKey: ["evaluations", selectedTenderId] });
            } else {
                const errorData = await response.json().catch(() => ({}));
                toast.dismiss(loadingToast);
                toast.error("Failed to reset", { description: errorData.detail || "Server returned an error" });
            }
        } catch (e) {
            toast.dismiss(loadingToast);
            toast.error("Network error while resetting score");
        }
    };

    const downloadSpecificFile = async (bid: any, fileType: string, fallbackName: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication token not found");

            const url = `${API_BASE_URL}/api/evaluation/bid/${bid.id}/download/${fileType}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Download endpoint failed:", response.status, response.statusText, errorText);
                throw new Error(`Failed to download ${fileType} document: ${response.status}`);
            }

            const blob = await response.blob();
            
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = fallbackName;
            if (contentDisposition && contentDisposition.includes('filename=')) {
                filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
            }

            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            
            toast.success("Download Complete", { description: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} document downloaded.` });
        } catch (error) {
            console.error(`Error downloading ${fileType}:`, error);
            toast.error("Download Failed", { description: `Could not retrieve ${fileType} document.` });
        }
    };

    const handleDownloadFiles = (bid: any) => {
        if (!bid.technicalDocumentPath && !bid.financialDocumentPath) {
            toast.error("No Documents Found", { description: "The vendor hasn't uploaded documents or they're missing." });
            return;
        }

        setSelectedDocsBid(bid);
    };

    const handleDeleteBid = async (bidId: number) => {
        if (!window.confirm("Are you sure you want to PERMANENTLY delete this vendor's bid submission? This will also notify the vendor that their application was removed.")) return;
        
        const loadingToast = toast.loading("Deleting bid record...");
        try {
            const response = await fetch(`${API_BASE_URL}/api/evaluation/bid/${bidId}`, {
                method: "DELETE",
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            
            if (response.ok) {
                toast.dismiss(loadingToast);
                toast.success("Bid Permanently Deleted", { 
                    description: "Bid submission removed and vendor notified.",
                    icon: <Trash2 className="w-4 h-4 text-red-500" />
                });
                queryClient.invalidateQueries({ queryKey: ["evaluations", selectedTenderId] });
            } else {
                const errorData = await response.json().catch(() => ({}));
                toast.dismiss(loadingToast);
                toast.error("Failed to delete bid", { description: errorData.detail || "Server error" });
            }
        } catch (e) {
            toast.dismiss(loadingToast);
            toast.error("Network error while deleting bid");
        }
    };

    const handleReverifySingle = async (bidId: number) => {
        console.log("Attempting to re-verify bid:", bidId);
        if (!bidId) {
            toast.error("Bid ID is missing. Cannot re-verify.");
            return;
        }
        
        setIsReverifying(true);
        const loadingToast = toast.loading("Re-analyzing bid using Pythonic logic...");
        try {
            const response = await fetch(`${API_BASE_URL}/api/evaluation/bid/${bidId}/evaluate`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            
            if (response.ok) {
                toast.dismiss(loadingToast);
                toast.success("Verification Complete", { description: "Bid has been re-analyzed using Python logic." });
                setViewingBid(null);
                queryClient.invalidateQueries({ queryKey: ["evaluations", selectedTenderId] });
            } else {
                const errorData = await response.json().catch(() => ({}));
                toast.dismiss(loadingToast);
                toast.error("Verification failed", { description: errorData.detail || "Server error" });
            }
        } catch (e) {
            toast.dismiss(loadingToast);
            toast.error("Network error while re-verifying score");
        } finally {
            setIsReverifying(false);
        }
    };

    const handleValidateBid = async (bidId: number) => {
        if (!bidId) return;
        const loadingToast = toast.loading("Validating vendor submission...");
        try {
            const response = await fetch(`${API_BASE_URL}/api/evaluation/bid/${bidId}/validate`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            
            if (response.ok) {
                toast.dismiss(loadingToast);
                toast.success("Bid Officially Validated", { 
                    description: "Submission moves to 'Validated' stage. AI analysis can now be final.",
                    icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />
                });
                queryClient.invalidateQueries({ queryKey: ["evaluations", selectedTenderId] });
            } else {
                toast.dismiss(loadingToast);
                toast.error("Validation failed");
            }
        } catch (e) {
            toast.dismiss(loadingToast);
            toast.error("Network error");
        }
    };

    return (
        <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500 max-w-full overflow-x-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 truncate">Post-RFP Evaluator</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Automated assessment of vendor proposals from REAL database.</p>
                </div>
                <div className="flex flex-col xs:flex-row gap-3 items-stretch xs:items-center w-full sm:w-auto">
                    <Button 
                        onClick={handleStartEvaluation}
                        disabled={isEvaluating || !selectedTenderId || bids.length === 0}
                        variant="outline"
                        className="border-gov-blue text-gov-blue hover:bg-gov-blue-light gap-2 font-bold h-10 flex-1 sm:flex-none shrink-0"
                    >
                        {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span className="truncate xs:whitespace-nowrap">Run Comparative AI</span>
                    </Button>
                    <div className="w-full sm:w-64">
                        <Select value={selectedTenderId} onValueChange={setSelectedTenderId}>
                            <SelectTrigger className="bg-white border-2 border-slate-200 h-10 w-full truncate">
                                <SelectValue placeholder="Select Tender to Evaluate" />
                            </SelectTrigger>
                            <SelectContent className="max-w-[calc(100vw-2rem)]">
                                {tenders.map(t => (
                                    <SelectItem key={t.id} value={t.id}>
                                        <span className="truncate inline-block max-w-[200px] xs:max-w-full">{t.id} - {t.projectName}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {selectedTenderId ? (
                <>
                    <Card className="border-slate-100 bg-slate-50/30">
                        <CardHeader className="py-4 px-4 sm:px-6">
                            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    <div className="w-10 h-10 bg-gov-blue/10 rounded-lg flex items-center justify-center border border-gov-blue/20 shrink-0">
                                        <FileText className="w-5 h-5 text-gov-blue" />
                                    </div>
                                    <div className="min-w-0">
                                        <CardTitle className="text-base sm:text-lg truncate">{activeTender?.projectName}</CardTitle>
                                        <CardDescription className="truncate text-[10px] sm:text-xs">Dept: {activeTender?.department} • ₹{(activeTender?.estimatedBudget || 0).toLocaleString()}</CardDescription>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-white border-gov-blue text-gov-blue shrink-0">
                                    {bids.length} Bids
                                </Badge>
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                        {[
                            { label: "Eligibility", weight: "20", color: "bg-blue-600" },
                            { label: "Experience", weight: "15", color: "bg-indigo-500" },
                            { label: "Tech Specs", weight: "20", color: "bg-cyan-500" },
                            { label: "Docs", weight: "15", color: "bg-slate-600" },
                            { label: "Financial", weight: "30", color: "bg-emerald-600" }
                        ].map((c) => (
                            <Card key={c.label} className="border-none shadow-sm bg-slate-50">
                                <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-tight truncate">{c.label}</p>
                                        <p className="text-lg sm:text-xl font-black text-slate-700">{c.weight}</p>
                                    </div>
                                    <div className={`w-1 sm:w-1.5 h-6 sm:h-8 rounded-full ${c.color} opacity-30 shrink-0`}></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        <Card className="lg:col-span-2 shadow-sm border-slate-100 overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-4 sm:px-6">
                                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                                    <ListFilter className="w-5 h-5 text-gov-blue" />
                                    Comparative Evaluation Matrix
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                 <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                                     <Table className="min-w-[800px] sm:min-w-full">
                                         <TableHeader>
                                             <TableRow className="bg-slate-50/50">
                                                 <TableHead className="font-bold">Rank</TableHead>
                                                 <TableHead className="font-bold">Vendor Name</TableHead>
                                                 <TableHead className="text-center font-bold">Tech Score (70)</TableHead>
                                                 <TableHead className="text-right font-bold">Financial (30)</TableHead>
                                                 <TableHead className="text-center font-bold">Final Score (100)</TableHead>
                                                 <TableHead className="text-right font-bold">Price</TableHead>
                                                 <TableHead className="text-center font-bold">Status</TableHead>
                                                 <TableHead className="text-center font-bold">Action</TableHead>
                                             </TableRow>
                                         </TableHeader>
                                         <TableBody>
                                             {isLoading ? (
                                                 <TableRow>
                                                     <TableCell colSpan={8} className="h-64 text-center">
                                                         <Loader2 className="w-8 h-8 animate-spin mx-auto text-gov-blue" />
                                                         <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Running AI Evaluation Matrix...</p>
                                                     </TableCell>
                                                 </TableRow>
                                             ) : activeTender?.status === "Active" ? (
                                                 <TableRow>
                                                     <TableCell colSpan={8} className="h-64 text-center">
                                                         <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 m-4">
                                                             <Sparkles className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
                                                             <p className="text-sm font-black text-slate-600 uppercase tracking-tight">Comparative Evaluation Pending</p>
                                                             <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">
                                                                 Click the <strong className="text-gov-blue">Run Comparative AI</strong> button above to automatically assess vendor compliance, scores, and ranks using our AI engine.
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : bids.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground italic">
                                                        Waiting for vendor submissions for this tender...
                                                    </TableCell>
                                                </TableRow>
                                            ) : bids.map((bid) => {
                                                const isH1 = bid.rank === 'H1';
                                                const isL1 = bid.isL1;
                                                const isHighRisk = bid.pastPerformanceRisk === 'HIGH';

                                                return (
                                                <TableRow key={bid.vendorName} className={`${isH1 ? 'bg-gov-blue/[0.03] border-l-4 border-l-gov-blue' : ''} ${isL1 ? 'bg-emerald-50/10' : ''}`}>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <Badge className={`${rankColor[bid.rank] || "bg-slate-400"} shadow-sm text-[10px] w-fit`}>{bid.rank}</Badge>
                                                            {isL1 && <Badge variant="outline" className="text-[8px] h-3 px-1 border-emerald-500 text-emerald-700 bg-emerald-50">L1 PRICE</Badge>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="min-w-[150px]">
                                                            <p className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                                                {bid.vendorName}
                                                                {isHighRisk && (
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger>
                                                                                <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                                                                            </TooltipTrigger>
                                                                            <TooltipContent className="bg-rose-600 text-white border-rose-700">
                                                                                <p className="font-bold">CRITICALLY LOW BID!</p>
                                                                                <p className="text-xs font-medium">This bid is significantly under the estimated budget. High risk of non-performance.</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )}
                                                            </p>
                                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                                {isH1 && <Badge variant="secondary" className="bg-gov-blue/10 text-gov-blue text-[9px] h-3.5 border-gov-blue/20">RECOMMENDED (H1)</Badge>}
                                                                {isL1 && <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[9px] h-3.5 border-emerald-200">LOWEST BIDDER</Badge>}
                                                                {isHighRisk && <Badge variant="destructive" className="bg-rose-50 text-white text-[9px] h-3.5 border-none">HIGH RISK ANOMALY</Badge>}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <button 
                                                            onClick={() => setViewingBid(bid)}
                                                            className="flex flex-col items-center gap-1 hover:bg-white p-2 rounded-lg transition-all group mx-auto border border-transparent hover:border-slate-200 hover:shadow-sm"
                                                        >
                                                            <span className="font-mono font-black text-gov-blue group-hover:scale-110 transition-transform text-lg">
                                                                {bid.technicalScore?.toFixed(1) || "0.0"}
                                                            </span>
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold text-slate-600 font-mono">
                                                        {bid.financialScore?.toFixed(1) || "0.0"}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-gov-blue/20 flex items-center justify-center mx-auto bg-white shadow-sm shrink-0">
                                                            <span className="text-xs sm:text-sm font-black text-gov-blue">
                                                                {(bid.finalScore || ((bid.technicalScore || 0) + (bid.financialScore || 0))).toFixed(1)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-slate-900 font-mono whitespace-nowrap">
                                                        Rs.{bid.financialBid.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-center font-mono">
                                                        <div className="flex flex-col items-center justify-center gap-1">
                                                            <Badge className={`${
                                                                bid.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                                bid.status === 'VALIDATED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                                bid.status === 'EVALUATED' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                'bg-slate-100 text-slate-700 border-slate-200'
                                                            } border text-[8px] h-4 font-black uppercase tracking-tighter w-fit`}>
                                                                {bid.status || 'SUBMITTED'}
                                                            </Badge>
                                                            {bid.submissionDurationMs && (
                                                                <span className="text-[7px] text-slate-400 font-bold flex items-center gap-0.5">
                                                                    <Clock className="w-2 h-2" /> {(bid.submissionDurationMs / 1000).toFixed(1)}s
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button onClick={() => handleDownloadFiles(bid)} variant="ghost" size="icon" title="Download Vendor Files" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 border border-emerald-100 shrink-0">
                                                                <FileText className="w-4 h-4" />
                                                            </Button>
                                                            <Button onClick={() => setViewingBid(bid)} variant="ghost" size="icon" className="h-7 w-7 text-gov-blue hover:bg-gov-blue/10 border border-gov-blue/10 shrink-0">
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-7 w-7 text-rose-500 hover:bg-rose-50 border border-rose-100 shrink-0 disabled:opacity-30 disabled:grayscale" 
                                                                onClick={() => handleDeleteBid(bid.id)}
                                                                disabled={activeTender?.status === 'Closed'}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-4 sm:space-y-6">
                            <Card className="border-red-100 bg-red-50/5">
                                <CardHeader className="pb-2 px-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-black uppercase text-red-800 tracking-wider flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> AI Risk Alerts
                                        </CardTitle>
                                        <Badge variant="outline" className="text-[9px] h-4 bg-red-100 border-red-200 text-red-700 font-black">
                                            {risks.length} CRITICAL
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 px-4 sm:px-6 pt-2 pb-4">
                                    {activeTender?.status === "Active" ? (
                                        <div className="py-12 text-center border-2 border-dashed border-red-50/50 rounded-2xl bg-white/40">
                                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_4px_12px_rgba(239,68,68,0.1)] border border-red-100">
                                                <Terminal className="w-5 h-5 text-red-300" />
                                            </div>
                                            <p className="text-[9px] font-black uppercase text-red-900/40 tracking-[0.2em] mb-1">System Diagnostics</p>
                                            <p className="text-[10px] font-bold text-red-800/60 px-4 leading-relaxed">Risk analysis will initiate once comparative AI engine is triggered.</p>
                                        </div>
                                    ) : risks.length === 0 ? (
                                        <div className="p-4 rounded-lg bg-emerald-50/30 border border-emerald-100 text-center">
                                            <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                                            <p className="text-xs text-emerald-800 font-bold">No anomalies detected</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[300px] sm:h-[400px] pr-3">
                                            <div className="space-y-3">
                                                {risks.map((risk, index) => (
                                                    <div key={index} className="p-3 sm:p-4 rounded-xl space-y-2 border border-red-100 bg-white shadow-sm ring-1 ring-red-50 relative overflow-hidden group hover:shadow-md transition-shadow">
                                                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-600" />
                                                        <div className="flex justify-between items-start">
                                                            <div className="px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[8px] font-black uppercase tracking-tighter">
                                                                {risk.type}
                                                            </div>
                                                            <AlertTriangle className="w-3 h-3 text-red-600 opacity-30 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] sm:text-[11px] font-black text-red-800 leading-tight">
                                                                {risk.message}
                                                            </p>
                                                            <p className="text-[9px] sm:text-[10px] font-bold text-red-600/70 mt-1 leading-relaxed">
                                                                {risk.explanation}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="border-gov-blue/20 bg-gov-blue/5">
                                <CardHeader className="pb-2 px-4 sm:px-6">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Approval Hierarchy</h3>
                                        <Badge variant="outline" className="text-[9px] h-4 border-gov-blue/20 text-gov-blue bg-white">4 Levels</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 px-4 sm:px-6 pb-6 pt-2">
                                    <div className="space-y-2.5">
                                            {[
                                                { name: "Approving Authority", role: "Final Sanction", desc: "Final Approval Authority", active: auth.user?.role === "Approving Authority" },
                                                { name: "RTGS Auditor", role: "Audit Verification", desc: "Financial Verification", active: auth.user?.role === "RTGS Auditor" },
                                                { name: "Evaluation Committee", role: "Technical Scrutiny", desc: "Comparative Analysis", active: auth.user?.role === "Evaluation Committee" },
                                                { name: "Internal Vigilance", role: "Integrity Watch", desc: "Fraud Detection", active: auth.user?.role === "Internal Vigilance" }
                                            ].map((officer, idx) => (
                                                <div key={idx} className={cn(
                                                    "p-3 rounded-xl border transition-all relative overflow-hidden group",
                                                    officer.active 
                                                        ? "bg-white border-gov-blue shadow-md ring-1 ring-gov-blue/5" 
                                                        : "bg-slate-50/50 border-slate-100 opacity-70"
                                                )}>
                                                    {officer.active && <div className="absolute top-0 left-0 bottom-0 w-1 bg-gov-blue" />}
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                                                            officer.active ? "bg-gov-blue text-white" : "bg-slate-200 text-slate-500"
                                                        )}>
                                                            {officer.name[0]}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className={cn("text-xs font-black truncate", officer.active ? "text-slate-900" : "text-slate-500")}>
                                                                    {officer.name}
                                                                </p>
                                                                {officer.active && (
                                                                    <div className="flex items-center gap-1 text-[8px] font-black text-gov-blue uppercase bg-gov-blue/5 px-1.5 py-0.5 rounded border border-gov-blue/10">
                                                                        <ShieldCheck className="w-2.5 h-2.5" /> Live Now
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">{officer.role}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                    <div className="pt-2">
                                        <p className="text-[10px] sm:text-xs text-slate-600 mb-4 bg-white/50 p-3 rounded-lg border border-slate-100 italic">
                                            "Resolve all mandatory clauses and generate the final Technical Evaluation Committee (TEC) report for departmental sanction."
                                        </p>
                                        <div className="flex flex-col gap-2.5">
                                            <Button
                                                onClick={handleResolve}
                                                disabled={isResolving || bids.length === 0}
                                                variant="outline"
                                                className="w-full border-gov-blue text-gov-blue hover:bg-gov-blue/10 text-xs h-10 font-bold"
                                            >
                                                {isResolving ? "Resolving Clauses..." : "Resolve & Generate TEC"}
                                            </Button>
                                            
                                            {(activeTender?.status === "Under Evaluation" || activeTender?.status === "Approved") && (
                                                <Button
                                                    onClick={handleAwardTender}
                                                    className="w-full bg-gov-blue hover:bg-gov-blue-dark text-xs h-10 font-black uppercase tracking-wider shadow-lg shadow-gov-blue/20"
                                                >
                                                    <Award className="w-4 h-4 mr-2" /> Final Award & Close Tender
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>

            ) : (
                <Card className="border-dashed border-2 bg-slate-50/50">
                    <CardContent className="py-20 text-center space-y-4">
                        <Search className="w-12 h-12 mx-auto text-slate-300" />
                        <div>
                            <h3 className="text-lg font-bold text-slate-700">No Tender Selected</h3>
                            <p className="text-sm text-slate-500">Please select a tender from the dropdown above to view real-time evaluations.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
            <Dialog open={!!viewingBid} onOpenChange={() => setViewingBid(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl font-black text-slate-800">
                            <ShieldCheck className="w-6 h-6 text-gov-blue" />
                            Technical Analysis: {viewingBid?.vendorName}
                        </DialogTitle>
                        <DialogDescription>
                            AI-powered sub-score breakdown and extracted evidence (70 Marks Total).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 overflow-y-auto pr-2">
                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase text-slate-500 tracking-wider">AI Score Breakdown</h3>
                            <div className="space-y-3">
                                {[
                                    { label: "Eligibility Compliance", score: viewingBid?.eligibilityScore, max: 20 },
                                    { label: "Past Experience", score: viewingBid?.experienceScore, max: 15 },
                                    { label: "Technical Specifications", score: viewingBid?.specsScore, max: 20 },
                                    { label: "Documentation Completeness", score: viewingBid?.docsScore, max: 15 },
                                ].map((item) => (
                                    <div key={item.label} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-700">{item.label}</span>
                                            <span className="text-xs font-black text-gov-blue">{item.score}/{item.max}</span>
                                        </div>
                                        <Progress value={(item.score / item.max) * 100} className="h-1.5" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase text-slate-500 tracking-wider">Extracted AI Evidence</h3>
                            <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-emerald-400 overflow-auto max-h-[300px]">
                                {viewingBid?.aiAnalysis ? (
                                    <pre className="whitespace-pre-wrap">
                                        {JSON.stringify(viewingBid.aiAnalysis, null, 2)}
                                    </pre>
                                ) : (
                                    <p className="italic text-slate-500">No AI analysis data available for this bid. Run evaluation to extract.</p>
                                )}
                            </div>
                            {viewingBid?.aiAnalysis && (
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                    <p className="text-[10px] text-blue-700 font-bold uppercase mb-1">Key Findings</p>
                                    <ul className="text-xs space-y-1 text-blue-900">
                                        <li>• Experience: {viewingBid.aiAnalysis.experience_years} years detected</li>
                                        <li>• GST Status: {viewingBid.aiAnalysis.gst_found ? "Verified" : "Missing/Not Found"}</li>
                                        <li>• Major Projects: {viewingBid.aiAnalysis.projects_count} successfully completed</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="mt-6 flex justify-between items-center sm:justify-between w-full">
                        <Button 
                            variant="outline" 
                            className="gap-2 font-bold border-amber-200 text-amber-700 hover:bg-amber-50"
                            onClick={() => {
                                if (window.confirm("Send a re-evaluation alert to this vendor? This will NOT delete any current scores, only notify them to update their submission.")) {
                                    handleResetSingle(viewingBid?.id);
                                }
                            }}
                        >
                            <Bell className="w-4 h-4" />
                            Notify for Re-Evaluation
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setViewingBid(null)}>
                                Close
                            </Button>
                            <Button 
                                onClick={() => handleReverifySingle(viewingBid?.id)}
                                disabled={isReverifying}
                                className="bg-gov-blue hover:bg-gov-blue-dark font-bold gap-2"
                            >
                                {isReverifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                                Re-verify Score
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedDocsBid} onOpenChange={() => setSelectedDocsBid(null)}>
                <DialogContent className="max-w-2xl border-2 border-gov-blue/20 p-0 overflow-hidden bg-white/95 backdrop-blur-xl">
                    <div className="bg-gov-blue p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <FileText className="w-32 h-32" />
                        </div>
                        <DialogTitle className="text-xl font-black mb-1">
                            Vendor Submitted Documents
                        </DialogTitle>
                        <DialogDescription className="text-gov-blue-light font-medium">
                            {selectedDocsBid?.vendorName} - Document Repository
                        </DialogDescription>
                    </div>
                    <div className="p-6">
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50/80">
                                    <TableRow>
                                        <TableHead className="font-bold text-slate-700">Document Type</TableHead>
                                        <TableHead className="font-bold text-slate-700">Database Status</TableHead>
                                        <TableHead className="text-right font-bold text-slate-700">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-bold text-slate-800">Technical Bid Document</span>
                                                    <span className="text-xs text-slate-500">PDF Document</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {selectedDocsBid?.technicalDocumentPath ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">Available in Database</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-500">Not Uploaded</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                size="sm" 
                                                disabled={!selectedDocsBid?.technicalDocumentPath}
                                                className="bg-gov-blue hover:bg-gov-blue-hover text-white shadow-sm font-bold"
                                                onClick={() => {
                                                    const safeName = selectedDocsBid?.vendorName ? selectedDocsBid.vendorName.replace(/\s+/g, '_') : 'Vendor';
                                                    downloadSpecificFile(selectedDocsBid, 'technical', `${safeName}_Technical_Bid.pdf`);
                                                }}
                                            >
                                                <Download className="w-4 h-4 mr-2" /> Download
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-bold text-slate-800">Financial Bid Schedule</span>
                                                    <span className="text-xs text-slate-500">Secure Document</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {selectedDocsBid?.financialDocumentPath ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">Available in Database</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-500">Not Uploaded</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                size="sm" 
                                                disabled={!selectedDocsBid?.financialDocumentPath}
                                                className="bg-gov-blue hover:bg-gov-blue-hover text-white shadow-sm font-bold"
                                                onClick={() => {
                                                    const safeName = selectedDocsBid?.vendorName ? selectedDocsBid.vendorName.replace(/\s+/g, '_') : 'Vendor';
                                                    downloadSpecificFile(selectedDocsBid, 'financial', `${safeName}_Financial_Bid.pdf`);
                                                }}
                                            >
                                                <Download className="w-4 h-4 mr-2" /> Download
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    <DialogFooter className="pr-6 pb-6 mt-2">
                        <Button variant="outline" onClick={() => setSelectedDocsBid(null)} className="font-bold text-slate-600 border-slate-200">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={!!evaluationResult} onOpenChange={() => setEvaluationResult(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 border-gov-blue/20">
                    <div className="bg-gov-blue p-6 text-white shrink-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-2xl font-black mb-1 flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-yellow-400" />
                                    AI Comparative Evaluation Result
                                </DialogTitle>
                                <DialogDescription className="text-gov-blue-light font-bold">
                                    Official Audit Summary & Officer Hierarchy Validation
                                </DialogDescription>
                            </div>
                            <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs font-black italic">
                                SECURE AUDIT LOG
                            </Badge>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-6 bg-slate-50/50">
                        <div className="space-y-8 pb-4">
                            {/* Officer Hierarchy */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Routing Hierarchy
                                </h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {[
                                        "Approving Authority",
                                        "RTGS Auditor",
                                        "Evaluation Committee",
                                        "Internal Vigilance"
                                    ].map((officer: string, idx: number) => (
                                        <React.Fragment key={idx}>
                                            <div className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                                                {officer}
                                            </div>
                                            {idx < 3 && (
                                                <ArrowRight className="w-4 h-4 text-slate-300" />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            {/* Winner Highlight */}
                            <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 relative overflow-hidden group">
                                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                    <Sparkles className="w-40 h-40" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200 mb-2">Selected Winner (L1)</p>
                                    <h2 className="text-3xl font-black mb-2">{evaluationResult?.winner.vendor_name}</h2>
                                    <p className="text-sm font-medium text-emerald-50 opacity-90 leading-relaxed max-w-2xl italic">
                                        "{evaluationResult?.winner.justification}"
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Matrix */}
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50/80">
                                        <TableRow>
                                            <TableHead className="font-black text-slate-800 text-[10px] uppercase">Vendor</TableHead>
                                            <TableHead className="font-black text-slate-800 text-[10px] uppercase text-center">Status</TableHead>
                                            <TableHead className="font-black text-slate-800 text-[10px] uppercase text-center">Rank</TableHead>
                                            <TableHead className="font-black text-slate-800 text-[10px] uppercase text-right">Price</TableHead>
                                            <TableHead className="font-black text-slate-800 text-[10px] uppercase">Justification / Reason</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {evaluationResult?.results.map((res: any, idx: number) => (
                                            <TableRow key={idx} className={res.final_decision === 'Selected' ? 'bg-emerald-50/50' : ''}>
                                                <TableCell className="font-bold text-slate-700">{res.vendor_name}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={res.status === 'Qualified' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                                                        {res.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center font-black">
                                                    <Badge variant="outline" className={res.rank === 'L1' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : ''}>
                                                        {res.rank}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold">{res.price}</TableCell>
                                                <TableCell className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs">
                                                    {res.reason}
                                                    {res.issues?.length > 0 && (
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {res.issues.map((issue: string, i: number) => (
                                                                <Badge key={i} variant="destructive" className="px-1.5 py-0 text-[8px] h-3.5 bg-rose-500">
                                                                    {issue}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </ScrollArea>
                    
                    <DialogFooter className="p-4 border-t bg-slate-50">
                        <Button 
                            onClick={async () => {
                                await handleAwardTender();
                                setEvaluationResult(null);
                            }} 
                            className="font-bold bg-gov-blue hover:bg-gov-blue-dark"
                        >
                            Accept Results & Notify All Vendors
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

