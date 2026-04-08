import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import {
    Search, Filter, TrendingUp, AlertTriangle, CheckCircle2,
    FileText, Zap, ShieldAlert, BarChart3, GitCompare,
    ArrowUpRight, Download
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEvaluations } from "@/hooks/useEvaluations";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useTenders } from "@/hooks/useTenders";
import { Loader2 } from "lucide-react";

const comparisonData = [
    { name: "ABC Infra", technical: 88, financial: 23.2, compliance: 92, rank: "L1" },
    { name: "Delta Tech", technical: 82, financial: 24.5, compliance: 85, rank: "L2" },
    { name: "Omega Eng", technical: 75, financial: 25.8, compliance: 78, rank: "L3" },
];

const benchmarkData = [
    { month: 'Jan', avg: 22.5, current: 23.2 },
    { month: 'Feb', avg: 21.8, current: 24.5 },
    { month: 'Mar', avg: 23.0, current: 23.8 },
    { month: 'Apr', avg: 24.2, current: 23.2 }, // current project is here
];

export default function EvaluationCommitteeDashboard() {
    const { toast } = useToast();
    const { tenders, isLoading: isTendersLoading, updateTender } = useTenders();
    const currentProject = tenders.find(t => t.status === "Under Evaluation") || tenders[0];

    const { bids: evaluations, isLoading: isEvalLoading } = useEvaluations(currentProject?.id);
    const { alerts, isLoading: isSummaryLoading } = useDashboardData();

    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [finalRemarks, setFinalRemarks] = useState("");

    const handleSubmitReport = async () => {
        if (currentProject) {
            try {
                await updateTender({ 
                    id: currentProject.id, 
                    data: { status: "Pending Approval" } 
                });
                toast({
                    title: "Report Rooted Successfully",
                    description: "Final evaluation status changed to 'Pending Approval'. Approving Authority notified.",
                });
            } catch (err) {
                toast({
                    variant: "destructive",
                    title: "Submission Error",
                    description: "Failed to update tender status in the database.",
                });
            }
        }
        setIsSubmitOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">Evaluation Committee Analytics</h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">Standardized bid scoring, anomaly detection, and L1 benchmarking.</p>
                </div>
                <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto shrink-0">
                    <Button variant="outline" className="border-border h-10 px-4 text-sm font-semibold flex-1 sm:flex-none">
                        <Download className="w-4 h-4 mr-2" />
                        Export Sheets
                    </Button>
                    <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gov-green hover:bg-gov-green/90 h-10 px-4 text-sm font-bold flex-1 sm:flex-none">
                                <Zap className="w-4 h-4 mr-2" />
                                Submit Final Report
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Submit Evaluation Report</DialogTitle>
                                <DialogDescription>
                                    This will finalize the rankings and notify the Approving Authority.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Final Committee Remarks</Label>
                                    <Textarea
                                        placeholder="Summarize why L1 was recommended and address any AI-flagged red flags..."
                                        value={finalRemarks}
                                        onChange={(e) => setFinalRemarks(e.target.value)}
                                        className="min-h-[120px]"
                                    />
                                </div>
                                <div className="bg-muted p-3 rounded text-[11px] text-muted-foreground flex gap-2">
                                    <ShieldAlert className="w-4 h-4 text-gov-blue shrink-0" />
                                    <span>By submitting, you certify that the evaluation follows the guidelines outlined in RFP Section 14 and AP State Procurement rules.</span>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
                                <Button onClick={handleSubmitReport} className="bg-gov-green hover:bg-gov-green/90">Confirm & Route</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Side-by-Side Comparison Matrix */}
                <Card className="lg:col-span-3 border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <GitCompare className="w-5 h-5 text-gov-blue" />
                            Bid Comparison Matrix (L1-L3)
                        </CardTitle>
                        <CardDescription>Automated scoring comparison based on technical and financial submissions.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6">
                        <div className="overflow-x-auto scrollbar-thin">
                            <Table className="min-w-[600px] sm:min-w-full">
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-bold">Vendor Name</TableHead>
                                    <TableHead className="text-center font-bold">Tech Score (80)</TableHead>
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
                                ) : (
                                    evaluations.map((v) => (
                                        <TableRow key={v.vendorName + v.financialBid} className="hover:bg-muted/30">
                                            <TableCell className="font-semibold">{v.vendorName}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold">{v.technicalScore}</span>
                                                    <div className="w-16 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                                        <div className="h-full bg-gov-blue" style={{ width: `${v.technicalScore}%` }}></div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-foreground">₹ {(v.financialBid / 10000000).toFixed(2)}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className={`text-[10px] ${v.complianceStatus === 'PASS' ? 'border-gov-green text-gov-green bg-gov-green/5' : 'border-gov-orange text-gov-orange bg-gov-orange/5'}`}>
                                                    {v.complianceStatus === 'PASS' ? '100% Match' : 'Review Required'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge className={v.rank === 'L1' ? 'bg-gov-green' : 'bg-muted text-muted-foreground'}>
                                                    {v.rank}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

                {/* AI Insights & Red Flags */}
                <Card className="border-gov-red/20 bg-gov-red/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-gov-red">
                            <ShieldAlert className="w-5 h-5" />
                            AI Risk Insight
                        </CardTitle>
                        <CardDescription>Automated anomaly & collusion detection.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isSummaryLoading ? (
                            <div className="py-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /></div>
                        ) : alerts.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-white">No active anomalies detected by AI.</div>
                        ) : (
                            alerts.slice(0, 3).map((flag: any, idx: number) => (
                                <div key={idx} className="p-3 bg-white rounded-lg border border-gov-red/10 shadow-sm space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Badge variant="destructive" className="text-[9px] h-4">
                                            {flag.level || "MEDIUM"}
                                        </Badge>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{flag.type}</span>
                                    </div>
                                    <p className="text-xs leading-relaxed text-foreground/90">
                                        {flag.message}
                                    </p>
                                    <Button variant="ghost" className="h-6 text-[10px] p-0 text-gov-blue italic">View Proof & Analysis</Button>
                                </div>
                            ))
                        )}

                        <div className="p-3 bg-gov-blue/5 rounded-lg border border-gov-blue/10">
                            <p className="text-[10px] font-semibold text-gov-blue">Evaluation Tip:</p>
                            <p className="text-[10px] text-muted-foreground mt-1 italic">
                                Use the "Document Comparison" tool to see overlapping technical text between bidders.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Benchmarking Graph */}
                <Card className="border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-gov-blue">
                            <TrendingUp className="w-5 h-5" />
                            Historical Price Benchmarking
                        </CardTitle>
                        <CardDescription>Comparing current L1 against 12-month district average.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={benchmarkData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="avg" name="State Average" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="current" name="L1 Bid Value" fill="#005596" radius={[4, 4, 0, 0]} barSize={30}>
                                    {benchmarkData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 3 ? '#00A859' : '#005596'} />
                                    ))}
                                </Bar>
                                <ReferenceLine y={23.5} stroke="#f97316" strokeDasharray="3 3" label={{ position: 'right', value: 'Govt Est', fill: '#f97316', fontSize: 10 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Technical Compliance Scoreboard */}
                <Card className="border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-gov-green" />
                            Technical Compliance Match
                        </CardTitle>
                        <CardDescription>AI-NLP analysis of vendor documents vs RFP clauses.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm font-semibold">
                                <span>ISO 27001 Certification</span>
                                <Badge className="bg-gov-green h-5 px-1.5"><CheckCircle2 className="w-3 h-3 mr-1" /> All Bidders Met</Badge>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Financial Solvency (last 3 yrs)</span>
                                    <span className="font-bold text-gov-orange">Omega Eng flagged</span>
                                </div>
                                <div className="flex gap-1 h-2">
                                    <div className="flex-1 bg-gov-green rounded-l" title="ABC Infra: Met"></div>
                                    <div className="flex-1 bg-gov-green" title="Delta Tech: Met"></div>
                                    <div className="flex-1 bg-gov-red rounded-r" title="Omega Eng: Low Liquidity"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Experience in Smart Water Tech</span>
                                    <span className="font-bold text-gov-blue">High Match: ABC Infra</span>
                                </div>
                                <div className="flex gap-1 h-2">
                                    <div className="flex-1 bg-gov-green rounded-l"></div>
                                    <div className="flex-1 bg-gov-yellow"></div>
                                    <div className="flex-1 bg-muted rounded-r"></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t">
                            <div className="flex-1 text-center">
                                <p className="text-2xl font-bold">18</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Docs Parsed</p>
                            </div>
                            <div className="flex-1 text-center border-x">
                                <p className="text-2xl font-bold text-gov-green">85%</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Accuracy</p>
                            </div>
                            <div className="flex-1 text-center">
                                <p className="text-2xl font-bold text-gov-orange">2</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Ambiguities</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
