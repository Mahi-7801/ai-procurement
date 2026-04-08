import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Search, ShieldAlert, History, BarChart3, Globe,
    Download, Filter, AlertCircle, FileText, CheckCircle2,
    ArrowRight, ChevronRight, Lock, ExternalLink, Loader2, User2
} from "lucide-react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const policyLibrary = [
    { id: "GO-42", title: "AP State Procurement Guidelines 2023", category: "General", date: "Jan 2023" },
    { id: "GO-112", title: "IT & Electronics Specialized Tendering", category: "IT", date: "Nov 2024" },
    { id: "GO-09", title: "Bidding Eligibility for MSMEs", category: "Finance", date: "Mar 2022" },
];

const transparencyData = [
    { name: 'Fair', value: 72, color: '#00A859' },
    { name: 'Risk', value: 18, color: '#F97316' },
    { name: 'Violent', value: 10, color: '#EF4444' },
];

export default function RTGSAuditorDashboard() {
    const { alerts, summaryData, isLoading } = useDashboardData();
    const { auth } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [isTeluguEnabled, setIsTeluguEnabled] = useState(false);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLogsLoading, setIsLogsLoading] = useState(false);

    const [selectedLog, setSelectedLog] = useState<any | null>(null);

    const translateAction = (actionStr: string) => {
        if (!actionStr) return "Unknown Action";
        const [method, endpoint] = actionStr.split(' ', 2);
        const ep = endpoint || "";

        if (ep.includes('/api/notifications')) return "Checked system notifications";
        if (ep.includes('/api/tenders/stats')) return "Viewed procurement statistics";
        if (ep.includes('/api/tenders') && method === 'GET') return "Viewed tender details/list";
        if (ep.includes('/api/tenders') && (method === 'PUT' || method === 'POST')) return "Created or modified a tender";
        if (ep.includes('/api/evaluation') && method === 'GET') return "Reviewed bid evaluations";
        if (ep.includes('/api/evaluation') && method === 'POST') return "Submitted bid evaluation scores";
        if (ep.includes('/api/risks/')) return "Scanned for compliance risks & alerts";
        if (ep.includes('/api/reports/audit')) return "Pulled forensic audit records";
        if (ep.includes('/api/reports')) return "Generated procurement reports";

        return actionStr; // fallback
    };

    const fetchGlobalAuditLogs = async () => {
        setIsLogsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/reports/audit`, {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            if (!response.ok) throw new Error("Failed to fetch global logs");
            const data = await response.json();
            setAuditLogs(data);
        } catch (err) {
            console.error("Could not load auditor trail.");
        } finally {
            setIsLogsLoading(false);
        }
    };

    useEffect(() => {
        fetchGlobalAuditLogs();
    }, []);

    const handleExportLogs = () => {
        if (!auditLogs || auditLogs.length === 0) {
            toast.error("No logs available to export.");
            return;
        }

        const headers = ["Transaction ID", "Activity Interpretation", "Date & Time (IST)", "Executing Officer", "IP Address", "Outcome"];
        const csvContent = [
            headers.join(","),
            ...auditLogs.map(log => {
                const interpretedAction = translateAction(log.action);
                const readableDate = new Date(log.timestamp).toLocaleString();
                const outcome = log.status_code < 400 ? "Success" : (log.status_code === 403 ? "Forbidden" : "Error");
                
                return [
                    log.id,
                    `"${interpretedAction}"`,
                    `"${readableDate}"`,
                    `"${log.user}"`,
                    log.ip || "N/A",
                    `"${outcome}"`
                ].join(",");
            })
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `RTGS_Audit_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Human-readable audit ledger exported.");
    };

    return (
        <div className="space-y-6">
            {/* Forensic Detail Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-3xl bg-white border border-slate-200 shadow-2xl p-0 overflow-hidden rounded-xl">
                    <DialogHeader className="p-6 bg-[#0f2a55] border-b border-white/10">
                        <DialogTitle className="text-white flex items-center gap-3 text-xl">
                            <ShieldAlert className="w-6 h-6 text-yellow-400" />
                            Approving Authority
                        </DialogTitle>
                        <DialogDescription className="text-blue-100/70 mt-1">
                            Official secure record for Transaction #{selectedLog?.id}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* High-level summary */}
                        <div className="flex flex-wrap gap-4 items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Activity Interpretation</p>
                                <p className="text-lg font-bold text-slate-900">{translateAction(selectedLog?.action)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Timestamp</p>
                                <p className="text-md font-bold text-slate-900">{selectedLog && new Date(selectedLog.timestamp).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Middle detailed cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {/* User Card */}
                             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-4">
                                <div className="p-3 rounded-full bg-white shadow-sm border border-slate-200 shrink-0">
                                     <User2 className="w-6 h-6 text-gov-blue" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Executing Officer</p>
                                    <p className="text-base font-bold text-slate-900 truncate">{selectedLog?.user}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">IP: {selectedLog?.ip || 'N/A'}</p>
                                </div>
                             </div>

                             {/* Technical Details Card */}
                             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Technical Disposition</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">HTTP Method</p>
                                        <Badge variant="outline" className="font-bold bg-white">{selectedLog?.method}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Result</p>
                                        <Badge className={`font-bold ${selectedLog?.status_code < 400 ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                                            {selectedLog?.status_code} {selectedLog?.status_code === 200 ? 'Success' : (selectedLog?.status_code === 403 ? 'Forbidden' : 'Error')}
                                        </Badge>
                                    </div>
                                </div>
                             </div>
                        </div>

                    </div>
                    
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                        <Button variant="outline" onClick={() => setSelectedLog(null)} className="font-bold">Close Report</Button>
                    </div>
                </DialogContent>
            </Dialog>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-foreground">RTGS Real-Time Audit Watchdog</h2>
                    <p className="text-sm text-muted-foreground">Statewide forensic oversight, policy enforcement, and transparency tracking.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsTeluguEnabled(!isTeluguEnabled)} className={isTeluguEnabled ? "bg-gov-blue/10 text-gov-blue border-gov-blue/30" : ""}>
                        <Globe className="w-4 h-4 mr-2" />
                        {isTeluguEnabled ? "తెలుగు మోడ్ Toggle" : "English/Telugu Toggle"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportLogs}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Log
                    </Button>
                </div>
            </div>

            {/* Audit Alert Ticker */}
            <div className="bg-gov-red/5 border-y border-gov-red/10 py-3 overflow-hidden whitespace-nowrap relative">
                <div className="flex items-center gap-8 animate-marquee">
                    <span className="flex items-center gap-2 text-xs font-bold text-gov-red uppercase">
                        <AlertCircle className="w-4 h-4" /> Live Audit Alerts:
                    </span>
                    {isLoading ? (
                        <span className="text-xs text-muted-foreground animate-pulse">Syncing with statewide registry...</span>
                    ) : alerts.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No critical anomalies detected in current cycle.</span>
                    ) : (
                        alerts.map((alert: any, idx: number) => (
                            <span key={idx} className="text-xs font-medium text-foreground/80 flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] border-gov-red/30 py-0 h-4 text-gov-red">{alert.level || 'CRITICAL'}</Badge>
                                {isTeluguEnabled ? "ముఖ్యమైన అలెర్ట్: " : ""}{alert.message} ({alert.type})
                            </span>
                        ))
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: Transparency Index & Policy Search */}
                <div className="space-y-6">
                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2 text-gov-blue">
                                <BarChart3 className="w-5 h-5" />
                                Statewide Transparency Index
                            </CardTitle>
                            <CardDescription>Based on bid distribution & deviation frequency.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={transparencyData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {transparencyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                                <span className="text-3xl font-bold">82.4</span>
                                <span className="text-[10px] uppercase font-black text-muted-foreground">Score</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-md flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gov-blue" />
                                Multilingual Forensic Search
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder={isTeluguEnabled ? "శోధించండి (Search...)" : "Search documents in EN/TE..."}
                                    className="h-9 text-xs"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Button size="sm" className="bg-gov-blue"><Search className="w-4 h-4" /></Button>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Findings</p>
                                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                                    <p className="text-xs font-semibold flex items-center justify-between">
                                        "Audit of TDR-2024-X"
                                        <Badge variant="secondary" className="text-[9px]">Summary</Badge>
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-1 italic">
                                        {isTeluguEnabled ? "ఈ టెండర్లో నియమాలను ఉల్లంఘించారు..." : "NLP Analysis: Overlapping executive board members found across 3 bidding vendors."}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Column 2: Immutable Audit Trail */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="h-full border-border">
                        <Tabs defaultValue="trail">
                            <CardHeader className="pb-0">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <History className="w-5 h-5 text-gov-blue" />
                                        Deep-Dive Audit Trail
                                    </CardTitle>
                                    <TabsList className="grid grid-cols-2 w-[240px]">
                                        <TabsTrigger value="trail" className="text-xs">Audit Log</TabsTrigger>
                                        <TabsTrigger value="library" className="text-xs">G.O. Library</TabsTrigger>
                                    </TabsList>
                                </div>
                                <CardDescription className="pt-1">Full traceability of every modification post-drafting.</CardDescription>
                            </CardHeader>

                            <TabsContent value="trail" className="pt-6">
                                <CardContent>
                                    <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-px before:bg-muted mb-4">
                                        {isLogsLoading ? (
                                            <div className="flex flex-col items-center py-12 gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-gov-blue" />
                                                <p className="text-sm text-muted-foreground italic tracking-widest">SYNCHRONIZING FORENSIC LEDGER...</p>
                                            </div>
                                        ) : auditLogs.length === 0 ? (
                                            <div className="flex flex-col items-center py-12 opacity-50">
                                                <History className="w-8 h-8 mb-2" />
                                                <p className="text-sm">No live transactions found.</p>
                                            </div>
                                        ) : (
                                            auditLogs.map((log) => (
                                                <div key={log.id} className="relative pl-8 pb-4 group">
                                                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-gov-blue border-4 border-background group-hover:scale-150 transition-transform shadow-sm"></div>
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1 min-w-0 pr-4">
                                                            <h4 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                                                                {log.action}
                                                                <Lock className="w-3 h-3 text-muted-foreground opacity-50" />
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-black text-gov-blue uppercase tracking-wider">
                                                                    {new Date(log.timestamp).toLocaleString()}
                                                                </span>
                                                                <Badge variant="secondary" className="text-[9px] h-4 py-0 flex items-center gap-1 font-bold">
                                                                    <User2 className="w-3 h-3" /> {log.user}
                                                                </Badge>
                                                                <Badge variant="outline" className={`text-[9px] h-4 py-0 font-bold ${log.status_code < 400 ? 'text-gov-green border-gov-green/30' : 'text-gov-red border-gov-red/30'}`}>
                                                                    HTTP {log.status_code}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-[11px] mt-2 bg-slate-50 p-2 rounded border border-slate-100 flex gap-2 items-start">
                                                                <FileText className="w-3 h-3 mt-0.5 text-slate-400 shrink-0" />
                                                                <span className="italic text-slate-600 truncate">{log.method} call to {log.endpoint}</span>
                                                            </p>
                                                        </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-7 text-[10px] uppercase font-black tracking-widest text-gov-blue px-2 hover:bg-gov-blue/5 shrink-0"
                                                            onClick={() => setSelectedLog(log)}
                                                        >
                                                            Forensic View
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <Button variant="outline" className="w-full text-xs h-9 border-dashed font-bold" onClick={fetchGlobalAuditLogs}>
                                        <History className="w-4 h-4 mr-2" />
                                        Refresh Audit Feed
                                    </Button>
                                </CardContent>
                            </TabsContent>

                            <TabsContent value="library" className="pt-6">
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Policy Reference</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Last Updated</TableHead>
                                                <TableHead className="text-right">Access</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {policyLibrary.map((item) => (
                                                <TableRow key={item.id} className="group">
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-gov-blue" />
                                                            <div>
                                                                <p className="text-sm font-bold">{item.id}</p>
                                                                <p className="text-[10px] text-muted-foreground group-hover:text-gov-blue transition-colors">{item.title}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell><Badge variant="outline" className="text-[10px]">{item.category}</Badge></TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{item.date}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><ExternalLink className="w-4 h-4" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="mt-6 p-4 bg-gov-blue/5 rounded-lg border border-gov-blue/20">
                                        <div className="flex items-start gap-3">
                                            <ShieldAlert className="w-5 h-5 text-gov-blue mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-gov-blue font-bold tracking-tight">AI Compliance Monitoring Notice</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    These policies are actively used by the "Pre-RFP Validator" NLP engine to flag deviations from state laws.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </div>
    );
}
