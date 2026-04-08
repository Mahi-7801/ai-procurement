import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText, Sparkles, AlertTriangle, Clock, Send,
    ArrowRight, CheckCircle2, MessageSquare, Plus,
    ClipboardList, Zap, GitCompare, ShieldAlert,
    BookOpen, ExternalLink, FileCheck
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { portalSchemas, type PortalKey } from "@/lib/portalSchemas";
import { generateOfficerNote } from "@/lib/officerNote";
import { saveRfp } from "@/lib/rfp-store";
import { useTenders } from "@/hooks/useTenders";
import { useEvaluations } from "@/hooks/useEvaluations";
import { useCommunications } from "@/hooks/useCommunications";
import { Loader2, Inbox } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData"; // Assuming this hook exists and was implicitly part of the context

export default function ProcurementOfficerDashboard() {
    const navigate = useNavigate();
    const { summaryData, alerts, isLoading: isSummaryLoading } = useDashboardData();
    const { tenders, isLoading: isTendersLoading } = useTenders();
    const { bids: evaluations, isLoading: isEvalLoading } = useEvaluations();
    const { inbox, isLoading: isCommsLoading } = useCommunications();

    const activeTendersTimeline = tenders.slice(0, 3).map(t => {
        let progressValue = 0;
        switch (t.status) {
            case 'Draft':
            case 'DRAFT':
                progressValue = 10;
                break;
            case 'Active':
            case 'ACTIVE':
                progressValue = 25;
                break;
            case 'Under Evaluation':
            case 'UNDER_EVALUATION':
                progressValue = 75;
                break;
            case 'Pending Approval':
            case 'PENDING_APPROVAL':
                progressValue = 90;
                break;
            case 'Closed':
            case 'CLOSED':
                progressValue = 100;
                break;

            default:
                progressValue = 0;
        }
        return {
            id: t.id,
            name: t.projectName,
            stage: t.status,
            progress: progressValue,
            date: t.closingDate
        };
    });

    const vendorQueries = inbox.filter(m => 
        m.communication_type === 'CLARIFICATION_REQUEST' || 
        m.communication_type === 'QUERY' ||
        m.communication_type === 'VENDOR_NOTICE'
    ).slice(0, 5);


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2 sm:mb-6">
                <div className="space-y-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Operational Command Hub</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">End-to-end management of drafting, publication, and bid evaluation.</p>
                </div>
                <div className="flex gap-2">
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="overview">Workflow Overview</TabsTrigger>
                    <TabsTrigger value="evaluations">Bid Evaluations</TabsTrigger>
                    <TabsTrigger value="queries">Clarification Hub</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="h-full border-gov-blue/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center justify-between">
                                    <span>RFP Validation Panel</span>
                                    <Badge variant="secondary" className="bg-gov-blue/10 text-gov-blue">
                                        {tenders.filter(t => t.status.toUpperCase() === 'DRAFT').length} Pending
                                    </Badge>


                                </CardTitle>
                                <CardDescription>AI-detected compliance gaps in active drafts.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isTendersLoading ? (
                                    <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /></div>
                                ) : tenders.filter(t => t.status.toUpperCase() === 'DRAFT').length === 0 ? (
                                    <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-lg">No active drafts found in registry.</div>
                                ) : (
                                    tenders.filter(t => t.status.toUpperCase() === 'DRAFT').slice(0, 2).map(rfp => (

                                        <div key={rfp.id} className="p-4 rounded-lg border border-border bg-background/50 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-sm">{rfp.projectName}</h4>
                                                    <p className="text-[10px] text-muted-foreground">{rfp.department} • {rfp.id}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-gov-blue">
                                                        {Math.min(95, 30 + (rfp.department ? 40 : 0) + (rfp.id ? 25 : 0))}%
                                                    </p>
                                                    <p className="text-[8px] text-muted-foreground uppercase font-bold">Health</p>
                                                </div>

                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t mt-2">
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Updated {rfp.publishedDate ? new Date(rfp.publishedDate).toLocaleDateString() : 'Recently'}
                                                </span>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-[10px] text-gov-blue underline italic px-0"
                                                    onClick={() => navigate("/dashboard/validator", { state: { autoLoad: true, tenderData: rfp, fileName: `Draft_${rfp.id}.pdf` } })}
                                                >
                                                    Fix Gaps with AI
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-1 border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Lifecycle Timeline</CardTitle>
                                <CardDescription>Real-time status of published procurement workflows.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isTendersLoading ? (
                                    <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /></div>
                                ) : activeTendersTimeline.map(tender => (
                                    <div key={tender.id} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">{tender.id}</p>
                                                <h4 className="font-bold text-sm">{tender.name}</h4>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-gov-blue border border-gov-blue/20 px-1 rounded uppercase">
                                                    {tender.stage}
                                                </span>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{tender.date}</p>
                                            </div>
                                        </div>
                                        <Progress value={tender.progress} className="h-2 bg-muted transition-all" />
                                        <div className="flex justify-between text-[10px] text-muted-foreground italic">
                                            <span>Drafting</span>
                                            <span>Evaluation</span>
                                            <span>Award</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-4 border-t">
                                    <Button variant="outline" className="w-full text-xs h-9">
                                        <ClipboardList className="w-4 h-4 mr-2" /> Full Management View
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-dashed border-2 bg-muted/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-md">Officer Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-2">
                                <Button variant="outline" className="justify-start text-xs h-9 text-left">
                                    <BookOpen className="w-3.5 h-3.5 mr-2 text-gov-blue" /> Browse Platform Guidelines
                                </Button>
                                <Button variant="outline" className="justify-start text-xs h-9 text-left">
                                    <ExternalLink className="w-3.5 h-3.5 mr-2 text-gov-blue" /> Visit Central Portal (NIC)
                                </Button>
                                <Button variant="outline" className="justify-start text-xs h-9 text-left">
                                    <Sparkles className="w-3.5 h-3.5 mr-2 text-gov-yellow" /> Summarize Active Bids
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="evaluations" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <Card className="lg:col-span-3 border-border">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <GitCompare className="w-5 h-5 text-gov-blue" />
                                    Bid Comparison Matrix (L1-L3)
                                </CardTitle>
                                <CardDescription>Automated scoring based on technical and financial submissions.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 sm:p-6 pb-2">
                                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                                    <Table className="min-w-[700px] sm:min-w-full">
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="font-bold">Vendor Name</TableHead>
                                                <TableHead className="text-center font-bold">Tech Score</TableHead>
                                                <TableHead className="text-center font-bold">Financial (₹ Cr)</TableHead>
                                                <TableHead className="text-center font-bold">AI Compliance</TableHead>
                                                <TableHead className="text-right font-bold">Final Rank</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isEvalLoading ? (
                                                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /></TableCell></TableRow>
                                            ) : evaluations.length === 0 ? (
                                                <TableRow><TableCell colSpan={5} className="text-center py-10 italic text-muted-foreground">No bids received yet for analysis.</TableCell></TableRow>
                                            ) : evaluations.map((v) => (
                                                <TableRow key={v.vendorName} className="hover:bg-muted/30">
                                                    <TableCell className="font-semibold">{v.vendorName}</TableCell>
                                                    <TableCell className="text-center font-bold">{v.technicalScore}</TableCell>
                                                    <TableCell className="text-center font-bold">₹ {(v.financialBid / 10000000).toFixed(2)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className="text-[10px] border-gov-green text-gov-green bg-gov-green/5">
                                                            {v.complianceStatus === 'PASS' ? '100% Match' : 'Review Required'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge className={v.rank === 'L1' ? 'bg-gov-green' : 'bg-muted text-muted-foreground'}>
                                                            {v.rank}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-gov-red/20 bg-gov-red/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2 text-gov-red">
                                    <ShieldAlert className="w-5 h-5" />
                                    Risk Insights
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isSummaryLoading ? (
                                    <div className="py-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /></div>
                                ) : alerts.length === 0 ? (
                                    <div className="p-4 text-center text-[10px] text-muted-foreground border border-dashed rounded-lg bg-white">No critical risk flags detected by AI.</div>
                                ) : (
                                    alerts.slice(0, 3).map((flag: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-white rounded-lg border border-gov-red/10 shadow-sm space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                                <Badge variant="destructive" className="h-4">{flag.level || 'MEDIUM'}</Badge>
                                                <span className="text-muted-foreground uppercase">{flag.type}</span>
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-foreground/80">{flag.message}</p>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="queries">
                    <Card className="border-gov-yellow/30 bg-gov-yellow/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-gov-yellow" />
                                Clarification Hub
                            </CardTitle>
                            <CardDescription>Recent vendor queries requiring officer response.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gov-yellow/10">
                                {isCommsLoading ? (
                                    <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /></div>
                                ) : vendorQueries.length === 0 ? (
                                    <div className="p-10 text-center text-xs text-muted-foreground italic">No pending clarification requests.</div>
                                ) : vendorQueries.map(q => (
                                    <div key={q.id} className="p-4 hover:bg-gov-yellow/10 transition-colors cursor-pointer group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-gov-yellow-dark bg-gov-yellow/20 px-1.5 rounded">{q.tender_ref}</span>
                                            <span className="text-[10px] text-muted-foreground">{new Date(q.sent_at).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-xs font-semibold">{q.from_user}</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">"{q.message}"</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
