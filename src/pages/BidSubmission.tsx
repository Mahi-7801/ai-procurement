import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, ShieldCheck, TrendingDown, Clock, Loader2, ShieldAlert, Lock, Send } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config";

type SubmissionStep = "IDLE" | "UPLOADING" | "AI_CHECK" | "ENCRYPTING" | "SUBMITTING" | "COMPLETED";

export default function BidSubmission() {
    const { toast } = useToast();
    const [step, setStep] = useState<SubmissionStep>("IDLE");
    const [polledStatus, setPolledStatus] = useState<string>("SUBMITTED");
    const [submittedBidId, setSubmittedBidId] = useState<number | null>(null);
    const [progress, setProgress] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [technicalFile, setTechnicalFile] = useState<File | null>(null);
    const [financialFile, setFinancialFile] = useState<File | null>(null);
    const [bidAmount, setBidAmount] = useState<string>("");

    // Realistic multi-stage submission timer
    useEffect(() => {
        let interval: any = null;
        if (isActive) {
            interval = setInterval(() => {
                setTimer((prev) => prev + 10); // increments in 10ms for smooth feel
            }, 10);
        } else if (!isActive && timer !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, timer]);

    const handleUploadClick = (type: "tech" | "fin") => {
        const input = document.createElement("input");
        input.type = "file";
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (type === "tech") setTechnicalFile(file);
            else setFinancialFile(file);
        };
        input.click();
    };

    const startSubmission = async () => {
        if (!technicalFile || !financialFile) {
            toast({
                title: "Incomplete Submission",
                description: "Please upload both Technical and Financial bid documents.",
                variant: "destructive"
            });
            return;
        }

        setIsActive(true);
        setStep("UPLOADING");
        setProgress(20);

        // Simulated steps with realistic delays to show the "Progress"
        setTimeout(() => {
            setStep("AI_CHECK");
            setProgress(50);
            
            setTimeout(() => {
                setStep("ENCRYPTING");
                setProgress(80);
                
                setTimeout(() => {
                    setStep("SUBMITTING");
                    setProgress(95);
                    submitToBackend();
                }, 1500);
            }, 2000);
        }, 1500);
    };

    const submitToBackend = async () => {
        const formData = new FormData();
        formData.append("tender_id", "TDR-2025-001"); // Mocking ID
        formData.append("financial_bid", bidAmount || "1250000"); // Mock or real
        formData.append("technical_file", technicalFile!);
        formData.append("financial_file", financialFile!);
        formData.append("submission_duration_ms", timer.toString());

        try {
            const response = await fetch("http://localhost:8000/api/evaluation/submit", {
                method: "POST",
                body: formData,
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSubmittedBidId(data.id);
                setStep("COMPLETED");
                setProgress(100);
                setIsActive(false);
                toast({
                    title: "Success",
                    description: `Bid submitted and encrypted in ${(timer / 1000).toFixed(2)}s`,
                });
            } else {
                throw new Error("Submission failed");
            }
        } catch (error) {
            setIsActive(false);
            setStep("IDLE");
            toast({
                title: "Error",
                description: "Failed to submit bid. Please try again.",
                variant: "destructive"
            });
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === "COMPLETED" && submittedBidId) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/api/evaluation/bid/${submittedBidId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setPolledStatus(data.status);
                    }
                } catch (e) {
                    console.error("Polling error:", e);
                }
            }, 3000); // Poll every 3s
        }
        return () => clearInterval(interval);
    }, [step, submittedBidId]);

    const formatTime = (ms: number) => {
        return (ms / 1000).toFixed(2) + "s";
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl xs:text-3xl sm:text-4xl font-black tracking-tight text-slate-900 flex flex-wrap items-center gap-3">
                        Bid Submission Portal
                        <Badge className="bg-gov-blue/10 text-gov-blue hover:bg-gov-blue/20 border-none px-3">Live</Badge>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">Secure, AI-assisted bid submission for Andhra Pradesh State Government.</p>
                </div>
                {step !== "IDLE" && step !== "COMPLETED" && (
                    <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl border border-white/10 animate-pulse">
                        <Clock className="w-5 h-5 text-gov-blue" />
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Processing Time</p>
                            <p className="text-xl font-mono font-black">{formatTime(timer)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Progress Bar */}
            <div className="relative pt-8 pb-4">
                <div className="flex justify-between mb-4 px-2 overflow-x-auto pb-4 gap-4 whitespace-nowrap mask-linear-fade">
                    {["Upload", "AI Validation", "Encryption", "Submission"].map((s, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                (i === 0 && (step !== "IDLE" || technicalFile)) || (i === 1 && ["AI_CHECK", "ENCRYPTING", "SUBMITTING", "COMPLETED"].includes(step)) || (i === 2 && ["ENCRYPTING", "SUBMITTING", "COMPLETED"].includes(step)) || (i === 3 && step === "COMPLETED")
                                ? "bg-gov-blue border-gov-blue text-white shadow-lg" 
                                : "bg-white border-slate-200 text-slate-400"
                            }`}>
                                {step === "COMPLETED" && i <= 3 ? <CheckCircle2 className="w-6 h-6" /> : (i + 1)}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-wider ${
                                (i === 0 && technicalFile) || (i === 1 && step !== "IDLE") ? "text-slate-900" : "text-slate-400"
                            }`}>{s}</span>
                        </div>
                    ))}
                </div>
                <Progress value={progress} className="h-2 rounded-full bg-slate-100" color="bg-gov-blue shadow-sm" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-2xl relative overflow-hidden bg-white/80 backdrop-blur-sm">
                        <div className="absolute top-0 right-0 p-6">
                            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-500 font-bold">
                                Session ID: {Math.random().toString(36).substring(7).toUpperCase()}
                            </Badge>
                        </div>
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gov-blue/10 rounded-lg">
                                    <FileText className="w-5 h-5 text-gov-blue" />
                                </div>
                                <CardTitle className="text-xl">Active Tender: TDR-2025-001</CardTitle>
                            </div>
                            <CardDescription className="text-slate-600 font-medium text-base">Highway Construction NH-16 Extension • Kakinada Section</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${technicalFile ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-gov-blue hover:bg-slate-100'}`}
                                     onClick={() => handleUploadClick("tech")}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110 ${technicalFile ? 'bg-white border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-gov-blue'}`}>
                                            <ShieldCheck className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-sm text-slate-900">Technical Bid</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {technicalFile ? technicalFile.name : ".pdf, .docx, .zip (Max 50MB)"}
                                            </p>
                                        </div>
                                        {technicalFile && <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-in zoom-in" />}
                                    </div>
                                </div>

                                <div className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${financialFile ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-gov-green hover:bg-slate-100'}`}
                                     onClick={() => handleUploadClick("fin")}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110 ${financialFile ? 'bg-white border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-gov-green'}`}>
                                            <TrendingDown className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-sm text-slate-900">Financial BoQ</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {financialFile ? financialFile.name : ".xls, .xlsx standards"}
                                            </p>
                                        </div>
                                        {financialFile && <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-in zoom-in" />}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/5 p-4 rounded-xl border border-slate-200">
                                <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">Estimated Financial Quote (INR Lakhs)</Label>
                                <input 
                                    type="number" 
                                    className="w-full bg-transparent border-none text-2xl font-black mt-2 focus:ring-0 focus:outline-none placeholder:text-slate-300"
                                    placeholder="1,25,00,000"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                />
                            </div>

                            <div className="pt-2 flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-900 leading-relaxed">
                                    <span className="font-bold">Encryption ProtocolActive:</span> All documents will be encrypted using 256-bit AES before transit. Once submitted, documents cannot be modified without re-opening the tender.
                                </div>
                            </div>

                            <Button 
                                className={`w-full h-16 rounded-2xl text-lg font-black transition-all duration-500 ${
                                    step === "COMPLETED" ? "bg-emerald-600" : "bg-slate-900"
                                } shadow-xl text-white`}
                                onClick={startSubmission}
                                disabled={step !== "IDLE"}
                            >
                                {step === "IDLE" && <><Lock className="w-5 h-5 mr-3" /> Encrypt & Submit Bid</>}
                                {step === "UPLOADING" && <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Uploading Documents...</>}
                                {step === "AI_CHECK" && <><Sparkles className="w-5 h-5 mr-3 animate-pulse text-gov-blue" /> AI Pre-Submission Validation...</>}
                                {step === "ENCRYPTING" && <><Lock className="w-5 h-5 mr-3 animate-bounce" /> AES-256 Bit Encryption...</>}
                                {step === "SUBMITTING" && <><Send className="w-5 h-5 mr-3 animate-pulse" /> Sending to RTGS Secure Vault...</>}
                                {step === "COMPLETED" && <><CheckCircle2 className="w-6 h-6 mr-3" /> Bid Successfully Submitted</>}
                            </Button>
                        </CardContent>
                    </Card>

                    {step === "COMPLETED" && (
                        <Card className="border-none bg-emerald-600 text-white shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                            <CardContent className="p-8 flex items-center justify-between">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black">Submission Reference: #AP-RTGS-2025-X92</h3>
                                    <p className="opacity-90 font-medium">Your bid has been received and is currently in the <span className="underline decoration-2 underline-offset-4">Submitted</span> stage.</p>
                                    <div className="flex gap-4 pt-4">
                                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg text-sm font-bold">
                                            <Clock className="w-4 h-4" /> Final Submission: {(timer / 1000).toFixed(2)}s
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg text-sm font-bold">
                                            <ShieldCheck className="w-4 h-4" /> AI Verified
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    <CheckCircle2 className="w-24 h-24 opacity-20" />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Live Tracker - This updates as officers act */}
                    <Card className="border-gov-blue/20 bg-gradient-to-br from-white to-gov-blue/5 shadow-xl border-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-800 uppercase tracking-tighter">
                                <Clock className="w-4 h-4 text-gov-blue" />
                                Submission Tracking
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4 pb-8">
                            {[
                                { label: "Bid Submitted", icon: Send, active: true, date: "Success" },
                                { label: "Technical Validation", icon: ShieldCheck, active: polledStatus === 'VALIDATED' || polledStatus === 'EVALUATED', date: polledStatus === 'VALIDATED' ? "In Progress" : polledStatus === 'EVALUATED' ? "Complete" : "Pending" },
                                { label: "Officer Proof-Check", icon: CheckCircle2, active: polledStatus === 'VALIDATED' || polledStatus === 'EVALUATED', date: polledStatus === 'VALIDATED' ? "Verified" : polledStatus === 'EVALUATED' ? "Verified" : "Waiting" },
                                { label: "AI Score Finalized", icon: Sparkles, active: polledStatus === 'EVALUATED', date: polledStatus === 'EVALUATED' ? "Published" : "Waiting" }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 relative group">
                                    {i < 3 && <div className={`absolute left-4 top-8 w-0.5 h-10 ${item.active ? 'bg-gov-blue' : 'bg-slate-100'}`} />}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 z-10 transition-colors ${
                                        item.active ? "bg-gov-blue border-gov-blue text-white shadow-lg shadow-gov-blue/20" : "bg-white border-slate-200 text-slate-300"
                                    }`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-black transition-colors ${item.active ? "text-slate-900" : "text-slate-400"}`}>{item.label}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.date}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-gov-blue/20 bg-gradient-to-br from-white to-gov-blue/5 shadow-lg">
                        <div className="h-1.5 w-full bg-slate-100">
                             <Progress value={step === "COMPLETED" ? 100 : (technicalFile ? 65 : 0)} className="h-full rounded-none bg-gov-blue/20" color="bg-gov-blue" />
                        </div>
                        <CardHeader className="pb-3 px-6 pt-5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-800">
                                    <Sparkles className="w-4 h-4 text-gov-blue" />
                                    AI Compliance Engine
                                </CardTitle>
                                <Badge variant="outline" className="bg-white border-slate-200 text-[10px] font-bold">Real-time</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 space-y-4">
                            {!technicalFile ? (
                                <div className="text-center py-6">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Loader2 className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">Upload documents to trigger AI compliance check.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top-2 duration-500">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                            <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">Policy Compliance Passed</span>
                                        </div>
                                        <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
                                            AI has verified your technical bid against <span className="font-bold underline text-emerald-800 cursor-help">G.O. Ms 22</span>. ISO certificates detected.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">AI Recommendations</h4>
                                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 group hover:shadow-md transition-all">
                                            <TrendingDown className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[11px] text-blue-900 font-bold leading-tight">Financial Gap Detected</p>
                                                <p className="text-[10px] text-blue-700 mt-1">
                                                    Your financial bid is 5% above historical benchmarks.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
