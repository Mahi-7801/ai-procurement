import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowBigRight, FileText, CheckCircle2, Clock, PlayCircle, Loader2, Inbox, ChevronRight, Zap, History, User2 } from "lucide-react";
import { useTenders, Tender } from "@/hooks/useTenders";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function RfpProcess() {
    const { tenders, isLoading, updateTender } = useTenders();
    const { auth } = useAuth();
    const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
    const [isAuditOpen, setIsAuditOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLogsLoading, setIsLogsLoading] = useState(false);

    const activeTender = tenders.find(t => t.id === selectedTenderId) || tenders[0];

    const fetchAuditLogs = async () => {
        if (!activeTender) return;
        setIsLogsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/reports/audit/${activeTender.id}`, {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            if (!response.ok) throw new Error("Failed to fetch logs");
            const data = await response.json();
            setAuditLogs(data);
            setIsAuditOpen(true);
        } catch (err) {
            toast.error("Could not load audit trail.");
        } finally {
            setIsLogsLoading(false);
        }
    };

    const getStepStatus = (stepIdx: number) => {
        if (!activeTender) return { done: false, active: false };
        
        const statusMap: Record<string, number> = {
            'Draft': 0,
            'Pending Approval': 2,
            'Active': 3,
            'Under Evaluation': 5,
            'Approved': 6,
            'Closed': 6,
            'Cancelled': -1,
            'CANCELLED': -1
        };

        const currentStep = statusMap[activeTender.status] ?? 0;
        
        // If status is Closed, EVERYTHING is done including the last step
        if (activeTender.status === 'Closed') {
            return { done: true, active: false };
        }
        
        if (stepIdx < currentStep) return { done: true, active: false };
        if (stepIdx === currentStep) return { done: false, active: true };
        return { done: false, active: false };
    };

    const handleNextStage = async () => {
        if (!activeTender) return;

        const nextStatusMap: Record<string, Tender["status"]> = {
            'Draft': 'Pending Approval',
            'Pending Approval': 'Active',
            'Active': 'Under Evaluation',
            'Under Evaluation': 'Closed'
        };

        const nextStatus = nextStatusMap[activeTender.status];
        if (!nextStatus) {
            toast.error("Tender is already in the final stage or cancelled.");
            return;
        }

        try {
            await updateTender({ 
                id: activeTender.id, 
                data: { status: nextStatus } 
            });
            toast.success(`Tender transitioned to ${nextStatus}`);
        } catch (err) {
            toast.error("Failed to transition stage.");
        }
    };

    const steps = [
        { step: "Creation", date: "12 Aug" },
        { step: "Internal Review", date: "14 Aug" },
        { step: "Approval", date: "15 Aug" },
        { step: "Publication", date: "Today" },
        { step: "Bid Opening", date: "30 Aug" },
        { step: "Evaluation", date: "05 Sep" },
        { step: "Award", date: "15 Sep" }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-gov-yellow shrink-0" />
                        <span className="truncate">RFP Life-Cycle Control</span>
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1 truncate">Live orchestration of ongoing procurement cycles.</p>
                </div>
                <div className="flex flex-col xs:flex-row flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
                    <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
                        <Button 
                            variant="outline" 
                            className="h-10 border-slate-200 flex-1 xs:flex-none"
                            onClick={fetchAuditLogs}
                            disabled={isLogsLoading}
                        >
                            {isLogsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> : <History className="w-4 h-4 mr-2 shrink-0" />}
                            <span className="truncate">Audit Logs</span>
                        </Button>
                        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col w-[95vw] sm:w-full">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <History className="w-5 h-5 text-gov-blue shrink-0" />
                                    Immutable Audit Trail
                                </DialogTitle>
                                <DialogDescription className="truncate">
                                    Project: {activeTender?.projectName} ({activeTender?.id})
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4">
                                {auditLogs.length === 0 ? (
                                    <div className="py-12 text-center opacity-50 italic text-sm">
                                        No logs found for this resource.
                                    </div>
                                ) : (
                                    auditLogs.map((log, idx) => (
                                       <div key={log.id} className="relative pl-6 pb-4 border-l border-slate-100 last:pb-0">
                                            <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-gov-blue"></div>
                                            <div className="text-xs font-black text-gov-blue uppercase tracking-wider mb-1">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 break-words">{log.action}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <Badge variant="secondary" className="text-[9px] h-4 font-black shrink-0">
                                                    <User2 className="w-3 h-3 mr-1" /> {log.user}
                                                </Badge>
                                                <Badge variant="outline" className={`text-[9px] h-4 font-black shrink-0 ${log.status_code < 400 ? 'text-gov-green' : 'text-gov-red'}`}>
                                                    SUCCESS {log.status_code}
                                                </Badge>
                                            </div>
                                       </div> 
                                    ))
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                    {activeTender && (auth.user?.role === 'APPROVING_AUTHORITY' || auth.user?.role === 'PROCUREMENT_OFFICER') && (
                        <Button 
                            className="bg-gov-blue hover:bg-gov-blue-dark h-10 shadow-lg shadow-gov-blue/20 flex-1 xs:flex-none"
                            onClick={handleNextStage}
                            disabled={activeTender.status === 'Closed' || activeTender.status === 'CANCELLED'}
                        >
                            <PlayCircle className="w-4 h-4 mr-2 shrink-0" /> <span className="truncate">Move to Next Stage</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Contextual Progress Bar */}
            {activeTender && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Zap className="w-32 h-32 text-gov-blue" />
                    </div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-gov-blue/10 rounded-lg">
                            <FileText className="w-5 h-5 text-gov-blue" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{activeTender.projectName}</h3>
                            <p className="text-[10px] font-black text-gov-blue uppercase tracking-widest">Global Status: {activeTender.status}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto pb-4 custom-scrollbar">
                        <div className="flex gap-4 min-w-[900px] items-stretch">
                            {steps.map((s, i) => {
                                const { done, active } = getStepStatus(i);
                                return (
                                    <div key={i} className="flex-1 min-w-[140px] relative">
                                        <div className={`h-full flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all duration-500 ${done ? 'bg-gov-green/5 border-gov-green/20' : active ? 'bg-gov-blue/5 border-gov-blue/40 ring-4 ring-gov-blue/5 scale-[1.02]' : 'bg-slate-50/50 border-slate-100 border-dashed opacity-50'}`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm transition-all duration-700 ${done ? 'bg-gov-green text-white rotate-0' : active ? 'bg-gov-blue text-white shadow-gov-blue/40 animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
                                                {done ? <CheckCircle2 className="w-5 h-5" /> : active ? <Clock className="w-5 h-5" /> : <span className="font-black text-xs">{i + 1}</span>}
                                            </div>
                                            <div className={`font-black text-[11px] uppercase tracking-wider mb-1 ${active ? 'text-gov-blue' : 'text-slate-600'}`}>{s.step}</div>
                                            <div className="text-[10px] font-bold text-slate-400">{active ? 'Live Now' : s.date}</div>
                                            {active && <Badge className="mt-3 bg-gov-blue text-[9px] h-4 font-black">IN PROGRESS</Badge>}
                                        </div>
                                        {i < steps.length - 1 && (
                                            <div className={`absolute top-9 left-full w-full h-[2px] -z-10 -ml-10 transition-colors duration-1000 ${done ? 'bg-gov-green' : 'bg-slate-100'}`}></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mt-12 mb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Active RFPs Inventory</h2>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-gov-blue animate-pulse"></span>
                    {tenders.length} Tracking
                </div>
            </div>

            <div className="grid gap-4">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-gov-blue opacity-20" />
                        <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-[0.2em]">Syncing Lifecycle States...</p>
                    </div>
                ) : tenders.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed rounded-3xl border-slate-100 bg-slate-50/20">
                        <Inbox className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-600">No Active RFPs</h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2 font-medium">
                            Tenders will appear here automatically once drafted or synchronized from external platforms.
                        </p>
                    </div>
                ) : (
                    tenders.map((tender) => (
                        <Card 
                            key={tender.id} 
                            onClick={() => setSelectedTenderId(tender.id)}
                            className={`transition-all duration-300 cursor-pointer group border-none shadow-sm hover:shadow-md ${selectedTenderId === tender.id || (!selectedTenderId && tender === tenders[0]) ? 'ring-2 ring-gov-blue bg-gov-blue/5' : 'bg-white hover:bg-slate-50'}`}
                        >
                            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl flex items-center justify-center transition-colors ${selectedTenderId === tender.id ? 'bg-gov-blue text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-slate-800 group-hover:text-gov-blue transition-colors truncate">{tender.projectName}</h4>
                                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                                            <Badge variant="outline" className="text-[9px] font-black px-2 py-0 h-4 border-slate-200 bg-white shadow-xs shrink-0">
                                                {tender.id}
                                            </Badge>
                                            <span className="hidden sm:inline text-[10px] font-bold text-slate-400 shrink-0">•</span>
                                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 truncate">{tender.department}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-10 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                                    <div className="sm:hidden text-left flex-1 min-w-0">
                                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Current Gate</p>
                                         <Badge className={`font-bold text-[9px] truncate max-w-full ${tender.status === 'Under Evaluation' ? 'bg-gov-orange text-white' : 'bg-gov-blue text-white'}`}>
                                             {tender.status}
                                         </Badge>
                                    </div>
                                    <div className="hidden sm:block text-right shrink-0">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Current Gate</p>
                                        <Badge className={`font-bold text-[10px] ${tender.status === 'Under Evaluation' ? 'bg-gov-orange text-white' : 'bg-gov-blue text-white'}`}>
                                            {tender.status}
                                        </Badge>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Target End</p>
                                        <p className="font-bold text-xs text-slate-700">{new Date(tender.closingDate).toLocaleDateString()}</p>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 shrink-0 transition-transform duration-300 hidden sm:block ${selectedTenderId === tender.id ? 'translate-x-1 text-gov-blue' : 'text-slate-300 group-hover:text-slate-400'}`} />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
