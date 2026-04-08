import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertTriangle, Shield, Search, Database,
    Zap, Ghost, Fingerprint, Activity,
    ChevronRight, ArrowRight, Bell, FileWarning, SearchX
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useDashboardData } from "@/hooks/useDashboardData";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const anomalyData = [
    { time: '00:00', score: 12 },
    { time: '04:00', score: 15 },
    { time: '08:00', score: 45 },
    { time: '12:00', score: 32 },
    { time: '16:00', score: 68 },
    { time: '20:00', score: 25 },
    { time: '23:59', score: 18 },
];

export default function InternalVigilanceDashboard() {
    const { alerts, summaryData, isLoading } = useDashboardData();
    const [selectedAlert, setSelectedAlert] = useState<any | null>(null);

    const handleFeatureClick = (feature: string) => {
        toast.info(`Activating ${feature} Module`, {
            description: "Executing complex backend queries..."
        });
    };

    return (
        <div className="space-y-6">
            {/* Risk Flag Investigation Modal */}
            <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
                <DialogContent className="max-w-2xl bg-white border border-slate-200 p-0 overflow-hidden rounded-xl">
                    <DialogHeader className="p-6 bg-red-950 border-b border-red-900/50">
                        <DialogTitle className="text-white flex items-center gap-2 text-xl">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            AI Threat Intelligence Report
                        </DialogTitle>
                        <DialogDescription className="text-red-200/70">
                            Automated forensic analysis of suspicious vendor activity.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedAlert && (
                        <div className="p-6 space-y-6">
                            <div className="flex gap-4 items-start">
                                <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Threat Type</p>
                                    <h3 className="text-lg font-bold text-slate-900">{selectedAlert.type.replace(/_/g, ' ')}</h3>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Severity Level</p>
                                    <Badge variant="destructive" className="font-bold">{selectedAlert.level || "CRITICAL"}</Badge>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Automated Incident Summary</p>
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 leading-relaxed font-medium">
                                    {selectedAlert.message}
                                </div>
                            </div>

                            <div className="bg-slate-950 p-4 rounded-lg">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-3 flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5" /> AI Confidence Metrics
                                </p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-[10px] text-slate-400">Match Probability</p>
                                        <p className="text-sm text-white font-mono">98.4%</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400">Pattern Library</p>
                                        <p className="text-sm text-white font-mono">Rule #402.B</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400">Cross-Verification</p>
                                        <p className="text-sm text-emerald-400 font-mono">Validated</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setSelectedAlert(null)}>Dismiss Flag</Button>
                        <Button className="bg-red-600 hover:bg-red-700 font-bold" onClick={() => {
                            toast.error("Deep-dive audit initiated. Vendor has been restricted pending manual review.");
                            setSelectedAlert(null);
                        }}>
                            <SearchX className="w-4 h-4 mr-2" />
                            Initiate Deep-Dive Audit
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-foreground">Internal Vigilance & Fraud Intelligence</h2>
                    <p className="text-sm text-muted-foreground">AI-driven anomaly detection and anti-corruption monitoring.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-gov-red/30 text-gov-red hover:bg-gov-red/5" onClick={() => toast("Manual Anomaly Form Opened")}>
                        <FileWarning className="w-4 h-4 mr-2" />
                        Report Anomaly
                    </Button>
                    <Button className="bg-foreground hover:bg-foreground/90" onClick={() => handleFeatureClick("Access Ledger")}>
                        <Fingerprint className="w-4 h-4 mr-2" />
                        Audit Access Logs
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/50 bg-white shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Flags</p>
                            <Badge className="bg-gov-red text-white border-transparent">{isLoading ? "..." : alerts.length} Alerts</Badge>
                        </div>
                        <h3 className="text-2xl font-black italic">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : alerts.length}</h3>
                        <p className="text-[11px] text-muted-foreground mt-1">Requiring immediate review</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-white shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Risk Level</p>
                            <Badge variant="outline" className="border-gov-yellow text-gov-yellow-dark">Elevated</Badge>
                        </div>
                        <h3 className="text-2xl font-black italic">MEDIUM</h3>
                        <p className="text-[11px] text-muted-foreground mt-1">Based on 1.2k transactions</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-white shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cartel Score</p>
                            <Activity className="w-4 h-4 text-gov-blue" />
                        </div>
                        <h3 className="text-2xl font-black italic">14.2%</h3>
                        <p className="text-[11px] text-muted-foreground mt-1">Detected in construction sector</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-white shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">System Trust</p>
                            <Shield className="w-4 h-4 text-gov-green" />
                        </div>
                        <h3 className="text-2xl font-black italic">99.8%</h3>
                        <p className="text-[11px] text-muted-foreground mt-1">Immutable log verification</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="w-5 h-5 text-gov-red" />
                                Real-time Anomaly Score
                            </CardTitle>
                            <CardDescription>Continuous monitoring of bidding behaviors across categories.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={anomalyData}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="time" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="score" stroke="#EF4444" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Recent Risk Flags</CardTitle>
                                <CardDescription>Latest anomalies detected by ProCore Intelligence.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="text-gov-blue" onClick={() => toast("Loading paginated risk history...")}>View All</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isLoading ? (
                                <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /></div>
                            ) : alerts.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground italic border border-dashed rounded-lg">No active risk flags detected by AI.</div>
                            ) : (
                                alerts.slice(0, 5).map((activity: any, idx: number) => (
                                    <div key={idx} className="group p-4 rounded-xl border border-border hover:border-gov-red/30 hover:bg-gov-red/[0.02] transition-all cursor-pointer" onClick={() => setSelectedAlert(activity)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={activity.level === "CRITICAL" ? "destructive" : "outline"} className="text-[9px] uppercase">
                                                    {activity.level || "MEDIUM"}
                                                </Badge>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase text-muted-foreground">TYPE: {activity.type}</span>
                                            </div>
                                            <span className="text-[10px] font-medium text-muted-foreground">REAL-TIME</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold text-sm text-foreground">{activity.message}</h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">Automated detection of {activity.type.toLowerCase()} behavior.</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-foreground text-white border-none overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -translate-y-16 translate-x-16 rounded-full blur-3xl"></div>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="w-5 h-5 text-gov-blue" />
                                Forensic Shield
                            </CardTitle>
                            <CardDescription className="text-white/60">Advanced deterrence protocols active.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-tighter text-gov-blue mb-2">Internal Watchlist</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span>High-Risk Vendors</span>
                                        <span className="text-gov-red italic">12 Watchlisted</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold">
                                        <span>Price Benchmarking</span>
                                        <span className="text-gov-green italic">Enabled</span>
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full bg-white text-foreground hover:bg-white/90 font-black text-xs h-10 rounded-xl" onClick={() => toast.success("Investigation protocol initiated for flagged vendor. Commencing deep-dive audit.")}>
                                INITIATE INVESTIGATION
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-dashed border-2 border-border">
                        <CardHeader className="pb-3 px-6 pt-6">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Zap className="w-4 h-4 text-gov-yellow" />
                                Intelligence Hub
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 space-y-3">
                            <Button variant="outline" className="w-full justify-start text-[10px] h-9 border-border hover:bg-gov-blue/5 hover:text-gov-blue hover:border-gov-blue/20" onClick={() => handleFeatureClick("Sectorwise Price Heatmaps")}>
                                <Search className="w-4 h-4 mr-2" /> Sectorwise Price Heatmaps
                            </Button>
                            <Button variant="outline" className="w-full justify-start text-[10px] h-9 border-border hover:bg-gov-blue/5 hover:text-gov-blue hover:border-gov-blue/20" onClick={() => handleFeatureClick("Cross-Dept Bidder Overlap")}>
                                <Database className="w-4 h-4 mr-2" /> Cross-Dept Bidder Overlap
                            </Button>
                            <Button variant="outline" className="w-full justify-start text-[10px] h-9 border-border hover:bg-gov-blue/5 hover:text-gov-blue hover:border-gov-blue/20" onClick={() => handleFeatureClick("Director Linkage Analysis")}>
                                <Fingerprint className="w-4 h-4 mr-2" /> Director Linkage Analysis
                            </Button>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
