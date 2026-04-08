import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Bell, FileText, CheckCircle2, Loader2, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/config";

export default function Monitoring() {
    // Real-time stats query
    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: ["monitoring-stats"],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/monitoring/stats`);
            return res.json();
        },
        refetchInterval: 10000, // Refresh every 10 seconds for real-time feel
    });

    // Active contracts query
    const { data: contracts, isLoading: isContractsLoading } = useQuery({
        queryKey: ["monitoring-contracts"],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/monitoring/contracts`);
            return res.json();
        },
        refetchInterval: 30000, 
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 truncate">Monitoring</h1>
                        <Badge className="bg-gov-red animate-pulse border-none px-2 py-0.5 text-[10px] font-bold shrink-0">
                            LIVE
                        </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium truncate sm:whitespace-normal">Real-time tracking of awarded contracts.</p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Globe className="w-3 h-3 animate-spin duration-[10s]" />
                        <span className="hidden xs:inline">System Synchronized</span>
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-300">
                        {stats?.last_updated ? new Date(stats.last_updated).toLocaleTimeString() : 'Syncing...'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="shadow-md transition-all hover:shadow-lg border-b-4 border-b-gov-blue overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-500">Active Contracts</CardTitle>
                        <FileText className="h-4 w-4 text-gov-blue" />
                    </CardHeader>
                    <CardContent>
                        {isStatsLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                        ) : (
                            <>
                                <div className="text-3xl font-black text-slate-900">{stats?.active_contracts || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1 font-medium text-gov-blue/70">Across all departments</p>
                            </>
                        )}
                    </CardContent>
                </Card>
                
                <Card className="shadow-md transition-all hover:shadow-lg border-b-4 border-b-gov-green overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-500">Milestone Compliance</CardTitle>
                        <Activity className="h-4 w-4 text-gov-green" />
                    </CardHeader>
                    <CardContent>
                        {isStatsLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                        ) : (
                            <>
                                <div className="text-3xl font-black text-gov-green">{stats?.milestone_compliance || 0}%</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-gov-green h-full transition-all duration-1000" style={{ width: `${stats?.milestone_compliance}%` }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">TARGET</span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-md transition-all hover:shadow-lg border-b-4 border-b-gov-orange overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-500">Avg. Progress</CardTitle>
                        <Bell className="h-4 w-4 text-gov-orange" />
                    </CardHeader>
                    <CardContent>
                        {isStatsLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                        ) : (
                            <>
                                <div className="text-3xl font-black text-slate-900">₹{stats?.payment_disbursement?.toFixed(1) || 0} Cr</div>
                                <p className="text-xs text-muted-foreground mt-1 font-medium text-gov-orange/70">Post-Contract Value Tracked</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between mt-10">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                    <CheckCircle2 className="w-5 h-5 text-gov-blue" />
                    Live Project Execution Stream
                </h2>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gov-green animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Connected</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {isContractsLoading ? (
                   <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-[0.3em]">Querying Active Node Stream...</p>
                   </div>
                ) : !contracts || contracts.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed rounded-3xl border-slate-100 italic text-slate-400 font-medium">
                        No active contracts currently being monitored.
                    </div>
                ) : (
                    contracts.map((contract: any) => (
                        <Card key={contract.id} className="hover:border-gov-blue/30 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer group bg-white border-slate-200/60">
                            <CardContent className="p-0 flex items-stretch">
                                <div className="w-2 h-auto bg-slate-100 transition-colors group-hover:bg-gov-blue" />
                                <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8 flex-1 min-w-0">
                                    <div className="relative group shrink-0">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center transition-all group-hover:bg-gov-blue/5 group-hover:border-gov-blue/20">
                                            <span className="text-lg font-black text-slate-700 group-hover:text-gov-blue">{contract.progress}%</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">WORK</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 space-y-3 w-full min-w-0">
                                        <div className="flex flex-col xs:flex-row justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <h3 className="font-black text-slate-800 text-base sm:text-lg leading-tight group-hover:text-gov-blue transition-colors truncate">
                                                    {contract.name}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                                                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase shrink-0">
                                                        {contract.id}
                                                    </span>
                                                    <div className="h-3 w-[1px] bg-slate-200 shrink-0" />
                                                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 truncate">
                                                        VENDOR: <span className="text-slate-600">{contract.vendor}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={contract.status === 'Delayed' ? 'destructive' : 'outline'} className={`px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-full shrink-0 ${contract.status === 'On Track' ? 'bg-green-50 text-green-700 border-green-200' : ''}`}>
                                                {contract.status}
                                            </Badge>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Contract Fulfillment</span>
                                                <span>₹{(contract.value / 10000000).toFixed(1)} CR</span>
                                            </div>
                                            <Progress value={contract.progress} className={`h-2.5 rounded-full border border-slate-100 ${contract.status === 'Delayed' ? 'bg-red-50' : 'bg-slate-50'}`} />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

