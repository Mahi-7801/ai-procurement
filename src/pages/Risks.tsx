import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiskAlert } from "@/lib/mock-data";
import { AlertTriangle, ShieldAlert, Users, FileWarning, CheckCircle, X, Loader2 } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

const levelColor: Record<RiskAlert["level"], string> = {
    HIGH: "bg-gov-red/15 text-gov-red border-gov-red/30",
    MEDIUM: "bg-gov-yellow/15 text-gov-yellow border-gov-yellow/30",
    LOW: "bg-gov-blue/15 text-gov-blue border-gov-blue/30",
};

const typeIcon: Record<RiskAlert["type"], typeof AlertTriangle> = {
    LOW_BID: AlertTriangle,
    COLLUSION: Users,
    SINGLE_BID: ShieldAlert,
    COMPLIANCE: FileWarning,
};

const typeLabel: Record<RiskAlert["type"], string> = {
    LOW_BID: "Low Bid Alert",
    COLLUSION: "Collusion Risk",
    SINGLE_BID: "Single-Bid Concern",
    COMPLIANCE: "Compliance Issue",
};

export default function RisksPage() {
    const { alerts, isLoading } = useDashboardData();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-foreground">Risk & Anomaly Detection</h1>
                    <p className="text-sm text-muted-foreground truncate xs:whitespace-normal">
                        AI-powered risk analysis and compliance monitoring
                    </p>
                </div>
                <Button className="bg-gov-blue hover:bg-gov-blue-dark w-full sm:w-auto font-bold text-xs h-10 px-4">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Run AI Risk Analysis
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Alerts</p>
                                <p className="text-3xl font-bold text-foreground">{isLoading ? "..." : alerts.length}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-gov-red" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">High Priority</p>
                                <p className="text-3xl font-bold text-gov-red">
                                    {isLoading ? "..." : alerts.filter((a: any) => a.level === "HIGH").length}
                                </p>
                            </div>
                            <ShieldAlert className="w-8 h-8 text-gov-red" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Medium Priority</p>
                                <p className="text-3xl font-bold text-gov-yellow">
                                    {isLoading ? "..." : alerts.filter((a: any) => a.level === "MEDIUM").length}
                                </p>
                            </div>
                            <FileWarning className="w-8 h-8 text-gov-yellow" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Low Priority</p>
                                <p className="text-3xl font-bold text-gov-blue">
                                    {isLoading ? "..." : alerts.filter((a: any) => a.level === "LOW").length}
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-gov-blue" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Risk Alerts */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Active Risk Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="py-20 text-center">
                            <Loader2 className="w-10 h-10 animate-spin mx-auto text-gov-blue opacity-20" />
                            <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-[0.2em]">Analyzing Risk Patterns...</p>
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="py-10 text-center">
                            <CheckCircle className="w-10 h-10 mx-auto text-gov-green opacity-20" />
                            <p className="text-sm text-slate-500 mt-4">No active risk alerts detected.</p>
                        </div>
                    ) : (
                        alerts.map((alert: any, index: number) => {
                            const Icon = typeIcon[alert.type as RiskAlert["type"]] || AlertTriangle;
                            return (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg ${levelColor[alert.level as RiskAlert["level"]]}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h4 className="font-semibold text-foreground">{typeLabel[alert.type as RiskAlert["type"]] || "General Alert"}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Tender: {alert.tender_id || "System Wide"}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className={`${levelColor[alert.level as RiskAlert["level"]]} shrink-0`}>
                                                    {alert.level}
                                                </Badge>
                                            </div>

                                            <p className="text-sm font-medium text-foreground">{alert.message}</p>

                                            <div className="p-3 rounded-md bg-muted/50 border border-border">
                                                <p className="text-xs text-muted-foreground mb-1 font-semibold">
                                                    AI Explanation:
                                                </p>
                                                <p className="text-sm text-foreground leading-relaxed">{alert.explanation}</p>
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-2">
                                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Mark Resolved
                                                </Button>
                                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold">
                                                    View Details
                                                </Button>
                                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold">
                                                    <X className="w-3 h-3 mr-1" />
                                                    Dismiss
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">AI-Powered Insights</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-gov-blue/10 border border-gov-blue/30">
                            <p className="text-sm font-medium text-gov-blue">
                                ✓ Pattern Analysis: No collusion patterns detected in the last 30 days
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-gov-yellow/10 border border-gov-yellow/30">
                            <p className="text-sm font-medium text-gov-yellow">
                                ⚠ Recommendation: Review eligibility criteria for TDR-2025-002 to increase participation
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-gov-green/10 border border-gov-green/30">
                            <p className="text-sm font-medium text-gov-green">
                                ✓ Compliance: All active tenders meet DPDP Act requirements
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
