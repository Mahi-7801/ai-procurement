import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Shield, CheckCircle2, XCircle, Info,
    Zap, Search, AlertTriangle, MessageSquare, ClipboardList, Users, Settings
} from "lucide-react";
import { roleLabels, UserRole } from "@/lib/mock-data";

const modules = [
    { name: "Dashboard", icon: Zap, key: "dashboard" },
    { name: "Tenders", icon: Search, key: "tenders" },
    { name: "Evaluations", icon: ClipboardList, key: "evaluations" },
    { name: "Risk & Alerts", icon: AlertTriangle, key: "risks" },
    { name: "Communications", icon: MessageSquare, key: "comms" },
    { name: "Reports", icon: ClipboardList, key: "reports" },
    { name: "User Management", icon: Users, key: "users" },
    { name: "System Settings", icon: Settings, key: "settings" },
];

const permissions: Record<UserRole, Record<string, "Full" | "View" | "None" | "Manage" | "Run">> = {
    ADMIN: {
        dashboard: "Full",
        tenders: "Full",
        evaluations: "Full",
        risks: "Full",
        comms: "Full",
        reports: "Full",
        users: "Manage",
        settings: "Full",
    },
    PROCUREMENT_OFFICER: {
        dashboard: "Full",
        tenders: "Full",
        evaluations: "Run",
        risks: "View",
        comms: "Full",
        reports: "Run",
        users: "None",
        settings: "Full",
    },
    VENDOR: {
        dashboard: "View",
        tenders: "View",
        evaluations: "None",
        risks: "None",
        comms: "View",
        reports: "None",
        users: "None",
        settings: "None",
    }
};

const getBadge = (type: string) => {
    switch (type) {
        case "Full": return <Badge className="bg-gov-green/10 text-gov-green border-gov-green/20">Full Access</Badge>;
        case "Manage": return <Badge className="bg-gov-blue/10 text-gov-blue border-gov-blue/20">Manage</Badge>;
        case "Run": return <Badge className="bg-gov-teal/10 text-gov-teal border-gov-teal/20">Run/Edit</Badge>;
        case "View": return <Badge variant="secondary" className="bg-muted text-muted-foreground">Read Only</Badge>;
        case "None": return <Badge variant="outline" className="opacity-30">No Access</Badge>;
        default: return null;
    }
};

export default function RoleRights() {
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-foreground">Role-Based Access Rights</h2>
                    <p className="text-sm text-muted-foreground">Overview of permissions and module access for the consolidated role structure.</p>
                </div>
                <Badge variant="outline" className="px-3 py-1 bg-gov-blue/5 text-gov-blue border-gov-blue/20 flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    DPDP Compliant Access Control
                </Badge>
            </div>

            <Card className="border-border">
                <CardHeader className="pb-0 pt-8 px-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gov-blue/10 rounded-lg">
                            <Shield className="w-5 h-5 text-gov-blue" />
                        </div>
                        <CardTitle>Permissions Matrix</CardTitle>
                    </div>
                    <CardDescription>
                        Unified permission boundaries for Admin, Procurement Officer, and Vendor roles.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="overflow-x-auto rounded-2xl border border-border">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="bg-muted/50">
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground border-b border-border">Module</th>
                                    {(Object.keys(roleLabels) as UserRole[]).map(role => (
                                        <th key={role} className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-foreground text-center border-b border-border border-l first:border-l-0">
                                            {roleLabels[role]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {modules.map((mod) => (
                                    <tr key={mod.key} className="hover:bg-muted/20 transition-colors group">
                                        <td className="px-6 py-4 font-bold border-b border-border group-last:border-b-0">
                                            <div className="flex items-center gap-3">
                                                <mod.icon className="w-4 h-4 text-gov-blue/60" />
                                                {mod.name}
                                            </div>
                                        </td>
                                        {(Object.keys(roleLabels) as UserRole[]).map(role => (
                                            <td key={role} className="px-6 py-4 text-center border-b border-border border-l group-last:border-b-0">
                                                {getBadge(permissions[role][mod.key])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-5 rounded-2xl bg-gov-blue/5 border border-gov-blue/10">
                            <h4 className="text-sm font-bold text-gov-blue mb-2 flex items-center gap-2">
                                <Info className="w-4 h-4" /> Principle of Least Privilege
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Roles are consolidated to maximize operational efficiency while maintaining strict access boundaries.
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-gov-green/5 border border-gov-green/10">
                            <h4 className="text-sm font-bold text-gov-green mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Consolidated Audit Oversight
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                The Admin role integrates auditing and vigilance capabilities for unified oversight.
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-gov-red/5 border border-gov-red/10">
                            <h4 className="text-sm font-bold text-gov-red mb-2 flex items-center gap-2">
                                <XCircle className="w-4 h-4" /> Immutable Audit Trail
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Every attempt to access or modify system data is logged in the RTGS forensic trail.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
