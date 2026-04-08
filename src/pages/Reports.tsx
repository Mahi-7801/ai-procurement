import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    FileBox, Download, Filter, Calendar, TrendingUp,
    AlertTriangle, Clock, CheckCircle2, FileText
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Loader2 } from "lucide-react";

const performanceData = [
    { stage: "Pre-RFP", avgDays: 5, target: 7 },
    { stage: "Publication", avgDays: 21, target: 20 },
    { stage: "Evaluation", avgDays: 14, target: 15 },
    { stage: "Approval", avgDays: 8, target: 5 },
    { stage: "Award", avgDays: 3, target: 5 },
];

const riskDistribution = [
    { name: "Low Bid", value: 45, color: "#ef4444" },
    { name: "Collusion", value: 15, color: "#f59e0b" },
    { name: "Single Bid", value: 25, color: "#3b82f6" },
    { name: "Compliance", value: 15, color: "#10b981" },
];

const delayTrends = [
    { month: "Sep", delays: 4 },
    { month: "Oct", delays: 7 },
    { month: "Nov", delays: 5 },
    { month: "Dec", delays: 12 },
    { month: "Jan", delays: 8 },
    { month: "Feb", delays: 3 },
];

export default function ReportsPage() {
    const { summaryData, tenders, isLoading } = useDashboardData();
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 sm:mb-6">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                        Comprehensive system performance and compliance monitoring
                    </p>
                </div>
                <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto shrink-0">
                    <Button variant="outline" className="border-border h-10 px-4 text-xs font-bold flex-1 sm:flex-none">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Button className="bg-gov-blue hover:bg-gov-blue-dark h-10 px-4 text-xs font-bold shadow-lg shadow-gov-blue/20 flex-1 sm:flex-none">
                        <Download className="w-4 h-4 mr-2" />
                        Export All (PDF)
                    </Button>
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Active Tenders</p>
                                <div className="flex items-baseline gap-2">
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-gov-blue" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold">{summaryData.activeTenders}</p>
                                            <span className="text-[10px] text-gov-blue font-medium">Real-time count</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Clock className="w-8 h-8 text-gov-blue/40" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Compliance Rate</p>
                                <div className="flex items-baseline gap-2">
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-gov-blue" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold">94.2%</p>
                                            <span className="text-[10px] text-gov-green font-medium">+2.1% improvement</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-gov-green/40" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total Bids Received</p>
                                <div className="flex items-baseline gap-2">
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-gov-blue" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold">{(tenders.length * 3) + 5}</p> {/* Simulation based on tenders if bids not fully loaded */}
                                            <span className="text-[10px] text-gov-blue font-medium">Across all cycles</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <TrendingUp className="w-8 h-8 text-gov-blue/40" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Active Risk Alerts</p>
                                <div className="flex items-baseline gap-2">
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-gov-blue" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold text-gov-orange">{summaryData.alerts}</p>
                                            <span className="text-[10px] text-muted-foreground">Requiring action</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <FileText className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Timeline Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                            <span>Approval Timelines (Avg Days)</span>
                            <Badge variant="outline" className="font-normal text-xs">Target: 47 Days Total</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="stage" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="avgDays" fill="#2563eb" name="Actual Performance" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="target" fill="#e2e8f0" name="Target Matrix" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Risk Flags Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Risk Type Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="flex h-[300px] items-center">
                        <div className="w-1/2 h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={riskDistribution}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {riskDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 space-y-4">
                            {riskDistribution.map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Delay Patterns */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Bottleneck Delay Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={delayTrends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="delays"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Audit Observations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Critical Audit Logs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 rounded-lg border bg-gov-red/5 border-gov-red/20 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-gov-red shrink-0" />
                            <div>
                                <p className="text-sm font-semibold">Multiple Re-Clarifications Detected</p>
                                <p className="text-xs text-muted-foreground mb-2">Tender #AP-2026-045 • 12 attempts</p>
                                <Badge className="bg-gov-red text-[10px]">High Delay Risk</Badge>
                            </div>
                        </div>
                        <div className="p-3 rounded-lg border bg-gov-yellow/5 border-gov-yellow/20 flex gap-3">
                            <Clock className="w-5 h-5 text-gov-yellow shrink-0" />
                            <div>
                                <p className="text-sm font-semibold">Approval Bottle-neck</p>
                                <p className="text-xs text-muted-foreground mb-2">Technical Evaluation Stage • Avg 14 days</p>
                                <Badge variant="outline" className="text-[10px] text-gov-yellow border-gov-yellow/30">Action Needed</Badge>
                            </div>
                        </div>
                        <div className="p-3 rounded-lg border bg-gov-blue/5 border-gov-blue/20 flex gap-3">
                            <Download className="w-5 h-5 text-gov-blue shrink-0" />
                            <div>
                                <p className="text-sm font-semibold">New Report: Q1 Efficiency Summary</p>
                                <p className="text-xs text-muted-foreground mb-1">Generated by System</p>
                                <Button variant="link" className="p-0 h-auto text-xs text-gov-blue">Download Report</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Generated Reports Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Recent Compliance Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[800px]">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Report Name</th>
                                        <th className="px-4 py-3 text-left font-medium">Generated Date</th>
                                        <th className="px-4 py-3 text-left font-medium">Scope</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr>
                                        <td className="px-4 py-3 font-medium">Monthly Risk Assessment Jan 2026</td>
                                        <td className="px-4 py-3">Feb 01, 2026</td>
                                        <td className="px-4 py-3">All Projects</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="bg-gov-green/10 text-gov-green border-gov-green/20">Finalized</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gov-blue cursor-pointer font-medium hover:underline">Download</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium">Collusion Pattern Investigation</td>
                                        <td className="px-4 py-3">Jan 28, 2026</td>
                                        <td className="px-4 py-3">Construction Sector</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="bg-gov-yellow/10 text-gov-yellow border-gov-yellow/20">Under Review</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gov-blue cursor-pointer font-medium hover:underline">View</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium">Transparency Audit Report v2</td>
                                        <td className="px-4 py-3">Jan 15, 2026</td>
                                        <td className="px-4 py-3">Health Dept.</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="bg-gov-green/10 text-gov-green border-gov-green/20">Finalized</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gov-blue cursor-pointer font-medium hover:underline">Download</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
