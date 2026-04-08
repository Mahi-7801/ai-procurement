import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import {
    ShieldCheck, Zap, AlertTriangle, Clock, TrendingUp,
    FileText, CheckCircle, ChevronRight, BarChart3,
    Users, Award, Sparkles, Fingerprint, Search,
    AlertCircle, History, Activity, ShieldAlert,
    Database, SearchCode
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useTenders } from "@/hooks/useTenders";
import { Loader2 } from "lucide-react";

const cycleTimeData = [
    { stage: 'Drafting', days: 12, target: 10 },
    { stage: 'Clarify', days: 5, target: 7 },
    { stage: 'Evaluate', days: 18, target: 14 },
    { stage: 'Finalize', days: 2, target: 5 },
];

const leaderboardData = [
    { dept: 'IT Systems', speed: 95, color: '#005596' },
    { dept: 'Civil Works', speed: 82, color: '#94a3b8' },
    { dept: 'Medical', speed: 78, color: '#94a3b8' },
    { dept: 'Transport', speed: 88, color: '#94a3b8' },
];

const anomalyData = [
    { time: '09:00', score: 12 },
    { time: '12:00', score: 45 },
    { time: '15:00', score: 88 },
    { time: '18:00', score: 32 },
    { time: '21:00', score: 15 },
];

export default function ApprovingAuthorityDashboard() {
    const { summaryData, isLoading: isSummaryLoading } = useDashboardData();
    const { tenders, isLoading: isTendersLoading, updateTender } = useTenders();
    const { toast } = useToast();
    const [isSanctionOpen, setIsSanctionOpen] = useState(false);
    const [isApproved, setIsApproved] = useState(false);

    const handleSanction = async () => {
        const currentProject = tenders.find(t => t.status === "Pending Approval") || tenders[0];
        if (currentProject) {
            try {
                await updateTender({ 
                    id: currentProject.id, 
                    data: { status: "Approved" } 
                });
                setIsApproved(true);
                setIsSanctionOpen(false);
                toast({
                    title: "Project Sanctioned",
                    description: "Electronic signature applied and status updated in the master registry.",
                });
            } catch (err) {
                toast({
                    variant: "destructive",
                    title: "Sanction Error",
                    description: "Failed to apply digital signature to the database.",
                });
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2 sm:mb-6">
                <div className="space-y-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Administrator Control Center</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">Unified oversight for approvals, forensic auditing, and fraud prevention.</p>
                </div>
                <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto shrink-0">
                    <Dialog open={isSanctionOpen} onOpenChange={setIsSanctionOpen}>
                        <DialogTrigger asChild>
                            <Button
                                disabled={isApproved}
                                className={`${isApproved ? 'bg-gov-green' : 'bg-gov-green hover:bg-gov-green/90'} transition-all`}
                            >
                                {isApproved ? (
                                    <><CheckCircle className="w-4 h-4 mr-2" /> Sanctioned</>
                                ) : (
                                    <><Zap className="w-4 h-4 mr-2" /> One-Click Sanction</>
                                )}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Sanction Project: TDR-2025-001</DialogTitle>
                                <DialogDescription>
                                    Apply digital signature and authorize the award of contract.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-6 space-y-4">
                                <div className="border-2 border-dashed border-gov-blue/20 p-4 rounded-lg bg-gov-blue/5 flex flex-col items-center gap-2">
                                    <Fingerprint className="w-12 h-12 text-gov-blue opacity-50" />
                                    <p className="text-xs font-bold text-gov-blue">Ready for Biometric Signature</p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsSanctionOpen(false)}>Review Summary</Button>
                                <Button onClick={handleSanction} className="bg-gov-green">Confirm & Sanction</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs defaultValue="approval" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="approval">Executive Approval</TabsTrigger>
                    <TabsTrigger value="forensic">Forensic Audit</TabsTrigger>
                    <TabsTrigger value="fraud">Fraud Intelligence</TabsTrigger>
                </TabsList>

                <TabsContent value="approval" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">Active Tenders</p>
                                        <p className="text-2xl font-bold">{isSummaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : summaryData.activeTenders}</p>
                                    </div>
                                    <Clock className="w-8 h-8 text-gov-orange opacity-40" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">Ready for Approval</p>
                                        <p className="text-2xl font-bold">{isSummaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : summaryData.pendingApprovals}</p>
                                    </div>
                                    <Zap className="w-8 h-8 text-gov-yellow opacity-40" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">System Trust</p>
                                        <p className="text-2xl font-bold text-gov-green">99.2%</p>
                                    </div>
                                    <ShieldCheck className="w-8 h-8 text-gov-green opacity-40" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">Active Alerts</p>
                                        <p className="text-2xl font-bold text-gov-red">{isSummaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : summaryData.alerts}</p>
                                    </div>
                                    <AlertTriangle className="w-8 h-8 text-gov-red opacity-40" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 border-gov-blue/20 shadow-lg shadow-gov-blue/5">
                            <CardHeader className="bg-gov-blue/5 border-b border-gov-blue/10">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-gov-yellow" />
                                    AI-Generated Executive Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {isTendersLoading ? (
                                    <div className="py-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /></div>
                                ) : tenders.length === 0 ? (
                                    <p className="text-sm text-center text-muted-foreground">No active tenders to summarize.</p>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                                            <div>
                                                <p className="text-muted-foreground text-xs uppercase font-bold">Project Name</p>
                                                <p className="font-bold">{tenders[0].projectName}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground text-xs uppercase font-bold">Status</p>
                                                <Badge className="bg-gov-blue">{tenders[0].status}</Badge>
                                            </div>
                                        </div>
                                        <div className="bg-muted/30 p-4 rounded-lg text-sm italic border-l-4 border-gov-blue">
                                            "AI verification indicates this project follows all G.O. guidelines. Recommendation: Proceed with next workflow step."
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-md flex items-center gap-2">
                                    <Award className="w-4 h-4 text-gov-yellow" />
                                    Wing Efficiency
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={leaderboardData} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="dept" type="category" fontSize={10} width={80} axisLine={false} tickLine={false} />
                                        <Bar dataKey="speed" radius={[0, 4, 4, 0]} barSize={20}>
                                            {leaderboardData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="forensic" className="space-y-6">
                    <Card className="border-gov-teal/20">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-gov-teal" />
                                    Real-time Audit Trail (RTGS)
                                </CardTitle>
                                <CardDescription>Immutable logs of every system transaction and state change.</CardDescription>
                            </div>
                            <Button size="sm" variant="outline" className="text-xs">
                                <History className="w-4 h-4 mr-2" /> View Full History
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-4 p-3 rounded-lg bg-muted/20 border border-border">
                                        <div className="w-10 h-10 rounded-full bg-gov-teal/10 flex items-center justify-center shrink-0">
                                            <SearchCode className="w-5 h-5 text-gov-teal" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-foreground">Draft RFP Modified (DFT-901)</span>
                                                <span className="text-muted-foreground italic">2 mins ago</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground font-medium">Modified by Officer ID: #9901 | Action: Clause 4.2 re-worded for clarity.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="fraud" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-gov-red/20 shadow-lg shadow-gov-red/5">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-gov-red">
                                    <ShieldAlert className="w-5 h-5" />
                                    Fraud Intelligence Core
                                </CardTitle>
                                <CardDescription>Behavioral patterns and collusion risk scoring.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[250px] pt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={anomalyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="time" fontSize={10} axisLine={false} tickLine={false} />
                                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                        <RechartsTooltip />
                                        <Line type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-gov-blue/20">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Database className="w-5 h-5 text-gov-blue" />
                                    Internal Risk Watchlist
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[
                                        { name: "Global Systems Ltd", risk: "HIGH", reason: "Common Director with vendor Delta Tech" },
                                        { name: "Pioneer Infra", risk: "MED", reason: "Unusually high pre-bid query volume" },
                                    ].map((v, i) => (
                                        <div key={i} className="p-3 border rounded-lg bg-background flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-bold">{v.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{v.reason}</p>
                                            </div>
                                            <Badge variant={v.risk === 'HIGH' ? 'destructive' : 'outline'}>{v.risk}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
