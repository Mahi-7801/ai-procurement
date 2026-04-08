import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Send, MessageSquare, Briefcase, FileText,
    CheckCircle2, AlertCircle, Search, Sparkles,
    ArrowRight, Clock, MapPin, Building, Mail
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTenders } from "@/hooks/useTenders";
import { useEvaluations } from "@/hooks/useEvaluations";
import { useCommunications } from "@/hooks/useCommunications";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Bell, X, Info } from "lucide-react";
import { notificationService, Notification as NotificationType } from "@/services/notificationService";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const myBids = [
    {
        id: "BID-401",
        project: "Highway NH-16 Extension",
        status: "Technical Evaluation",
        progress: 45,
        submittedAt: "Feb 05, 2026",
        highlights: "Technical documents verified by AI."
    },
    {
        id: "BID-382",
        project: "IT Secretariat Biometric",
        status: "Rejected",
        progress: 100,
        submittedAt: "Jan 12, 2026",
        outcome: "Technical non-compliance in ISO certification validity period."
    }
];

const recommendedTenders = [
    {
        id: "TDR-902",
        title: "Smart Water Management",
        dept: "PH Engineering",
        match: "98% AI Match",
        reason: "Based on your successful completion of Kurnool Water Project."
    },
    {
        id: "TDR-905",
        title: "Solar Street Lights",
        dept: "Municipal Admin",
        match: "85% AI Match",
        reason: "Matches your expertise in renewable energy installations."
    }
];

export default function VendorDashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { auth } = useAuth();
    const { tenders, isLoading: isTendersLoading } = useTenders();
    const { bids: evaluations, isLoading: isEvalLoading } = useEvaluations();
    const { sendMessage } = useCommunications();

    const [query, setQuery] = useState("");
    const [isQueryOpen, setIsQueryOpen] = useState(false);
    const [selectedBid, setSelectedBid] = useState<any>(null);
    const [priorityNotifications, setPriorityNotifications] = useState<NotificationType[]>([]);

    useEffect(() => {
        const fetchPriorityNotifications = async () => {
            if (!auth.token) return;
            try {
                const notifications = await notificationService.getNotifications(auth.token);
                // Filter for unread 'Reset' notifications
                const resets = notifications.filter(n => 
                    !n.is_read && n.title.toLowerCase().includes('reset')
                );
                setPriorityNotifications(resets);
            } catch (error) {
                console.error("Failed to fetch priority notifications:", error);
            }
        };

        fetchPriorityNotifications();
        const interval = setInterval(fetchPriorityNotifications, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [auth.token]);

    const handleDismissNotification = async (id: number) => {
        if (!auth.token) return;
        try {
            await notificationService.markAsRead(auth.token, id);
            setPriorityNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error("Failed to dismiss notification:", error);
        }
    };

    // Since useEvaluations() now calls /my-bids when no tenderId is passed, 
    // it already returns only the bids for the current vendor.
    const myBids = evaluations;

    // Sort by most recent submission
    const sortedBids = [...myBids].sort((a, b) => 
        new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
    );
    const latestBid = sortedBids[0];

    // Calculate dynamic progress
    const getProgressInfo = (status?: string) => {
        switch(status) {
            case 'EVALUATED': return { val: 100, label: "Final Selection Published", sub: "Evaluation Complete" };
            case 'VALIDATED': return { val: 75, label: "Officer Proof-Check", sub: "Technical Validation Passed" };
            case 'SUBMITTED': return { val: 40, label: "AI Compliance Scan", sub: "Initial Review Phase" };
            default: return { val: 20, label: "Bid Registered", sub: "Awaiting Processing" };
        }
    };

    const progressInfo = latestBid ? getProgressInfo(latestBid.status) : { val: 0, label: "", sub: "" };

    // Filter active tenders to recommend
    const recommendedTenders = tenders.filter(t => t.status === "Active").slice(0, 3);

    const handleSendQuery = async () => {
        if (!query.trim() || !selectedBid) return;

        try {
            // Find full tender details if we have a selected bid
            const fullTender = tenders.find(t => t.id === selectedBid?.tenderId);

            await sendMessage.mutateAsync({
                tender_id: (fullTender as any)?.db_id || 1, // Look up actual DB ID
                tender_ref: selectedBid?.tenderId || "TDR-GENERIC",
                subject: "Clarification Request",
                message: query,
                communication_type: 'CLARIFICATION_REQUEST',
                from_user: auth.user?.full_name || auth.username || "Vendor Representative",
                from_role: "VENDOR",
                to_role: "PROCUREMENT_OFFICER",
                priority: "NORMAL",
                status: "SENT",
                requires_action: true,
                action_taken: false
            });

            toast({
                title: "Query Submitted",
                description: "Your clarification has been sent to the Procurement Officer.",
            });
            setIsQueryOpen(false);
            setQuery("");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send query. Please try again.",
                variant: "destructive"
            });
        }
    };

    const { inbox, isLoading: isCommsLoading, markAsRead } = useCommunications();
    const unreadCount = inbox.filter(m => !m.read_at).length;

    return (
        <>
            <AnimatePresence>
                {priorityNotifications.length > 0 && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0, margin: 0 }}
                        animate={{ height: 'auto', opacity: 1, margin: '0 0 24px 0' }}
                        exit={{ height: 0, opacity: 0, margin: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-[1px] shadow-xl shadow-red-500/20">
                            <div className="bg-white rounded-[15px] p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                    <Bell className="w-6 h-6 text-red-600 animate-bounce" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                        Action Required: Evaluation Reset
                                        <Badge className="bg-red-500 text-white border-0 text-[10px] font-black h-4 px-1.5">URGENT</Badge>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        {priorityNotifications[0].message}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 text-[11px] font-bold border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={() => handleDismissNotification(priorityNotifications[0].id)}
                                    >
                                        Acknowledge
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-slate-400 hover:text-slate-600"
                                        onClick={() => handleDismissNotification(priorityNotifications[0].id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground truncate">Vendor Portal - Dashboard</h2>
                    <p className="text-sm text-muted-foreground leading-snug">Track active bids, discover opportunities, and manage clarifications.</p>
                </div>
                <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => navigate("/dashboard/communications")}
                        className="border-gov-blue text-gov-blue hover:bg-gov-blue/5 relative w-full sm:w-auto justify-start sm:justify-center"
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        <span className="truncate">Communications</span>
                        {unreadCount > 0 && (
                            <Badge className="absolute -top-2 -right-2 bg-gov-red text-white h-5 w-5 flex items-center justify-center p-0 rounded-full text-[10px] border-2 border-white">
                                {unreadCount}
                            </Badge>
                        )}
                    </Button>
                    <Button
                        onClick={() => navigate("/dashboard/tenders")}
                        className="bg-gov-blue hover:bg-gov-blue-dark w-full sm:w-auto justify-start sm:justify-center"
                    >
                        <Briefcase className="w-4 h-4 mr-2" />
                        <span className="truncate">Explore Tenders</span>
                    </Button>
                </div>
            </div>

            {latestBid && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-1 rounded-2xl bg-gradient-to-r from-gov-blue/20 via-gov-blue/40 to-gov-blue/20"
                >
                    <div className="bg-white/95 backdrop-blur-md rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 shadow-xl shadow-gov-blue/5 border border-white/20">
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gov-blue/10 flex items-center justify-center ring-4 ring-gov-blue/5">
                                <Send className="w-5 h-5 sm:w-6 sm:h-6 text-gov-blue animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-none truncate max-w-[150px] sm:max-w-[200px]">Track: {latestBid.projectName}</h3>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Real-Time Sync</p>
                            </div>
                        </div>
                        
                        <div className="flex-1 space-y-2">
                             <div className="flex justify-between items-end mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] sm:text-[11px] font-black uppercase text-gov-blue tracking-tighter">Status</span>
                                    <Badge className="bg-gov-blue/10 text-gov-blue text-[8px] h-4 font-black border-gov-blue/20 px-1.5 uppercase">{progressInfo.label}</Badge>
                                </div>
                                <span className="text-[10px] sm:text-[11px] font-black text-slate-600 tracking-tighter">{progressInfo.val}% SYNCED</span>
                             </div>
                             <div className="h-2.5 w-full bg-slate-100 shadow-inner rounded-full overflow-hidden relative">
                                 <motion.div 
                                     className="h-full bg-gov-blue" 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${progressInfo.val}%` }} 
                                     transition={{ duration: 1, ease: "easeOut" }}
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                             </div>
                        </div>

                        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:border-slate-100 lg:pl-3">
                            <div className="text-left lg:text-right">
                                <div className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-tighter">Total Bids</div>
                                <div className="text-lg sm:text-xl font-black text-gov-blue">{myBids.length}</div>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-gov-blue/30 text-gov-blue hover:bg-gov-blue/5 h-8 sm:h-10 font-black text-[10px] sm:text-[11px] uppercase tracking-tighter shadow-sm px-3 sm:px-4"
                                onClick={() => navigate("/dashboard/tenders")}
                            >
                                Audit Trace <ArrowRight className="w-3.5 h-3.5 ml-1 sm:ml-2" />
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1 & 2: Active Bids & Tracking */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border">
                        <CardHeader className="pb-3 px-6 pt-6">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gov-blue" />
                                Active Bid Tracking
                            </CardTitle>
                            <CardDescription>Real-time progress of your submitted proposals.</CardDescription>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 space-y-6">
                            {isEvalLoading ? (
                                <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /></div>
                            ) : myBids.length === 0 ? (
                                <div className="py-10 text-center text-sm text-muted-foreground italic border border-dashed rounded-lg">You have no active bids at this time.</div>
                            ) : (
                                myBids.map(bid => (
                                    <div key={bid.vendorName + bid.financialBid} className="p-4 rounded-xl border border-gov-blue/10 bg-gov-blue/5 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                            <div>
                                                <h4 className="font-bold text-base break-words">{bid.vendorName} Proposal</h4>
                                                <p className="text-xs text-muted-foreground">Rank: {bid.rank} • Bid Value: ₹ {(bid.financialBid / 10000000).toFixed(2)} Cr</p>
                                            </div>
                                            <Badge variant="outline" className="bg-gov-blue/10 text-gov-blue border-gov-blue/20 shrink-0">
                                                {bid.complianceStatus || "In Review"}
                                            </Badge>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    Current Stage: 
                                                    <span className="text-gov-blue">
                                                        {bid.status === 'SUBMITTED' ? 'Technical Validation' : 
                                                         bid.status === 'VALIDATED' ? 'Officer Proof-Check' : 
                                                         bid.status === 'EVALUATED' ? 'Final Selection' : 'Internal Review'}
                                                    </span>
                                                </span>
                                                {bid.submissionDurationMs && (
                                                    <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                        Submission Speed: {(bid.submissionDurationMs / 1000).toFixed(1)}s
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="relative pt-2">
                                                <Progress 
                                                    value={
                                                        bid.status === 'EVALUATED' ? 100 : 
                                                        bid.status === 'VALIDATED' ? 70 : 25
                                                    } 
                                                    className="h-2.5 bg-slate-100 shadow-inner rounded-full" 
                                                    color={bid.status === 'EVALUATED' ? "bg-emerald-500" : "bg-gov-blue"}
                                                />
                                                <div className="flex justify-between text-[8px] text-slate-400 uppercase font-black tracking-widest mt-2 px-1 gap-2 overflow-x-auto min-w-full pb-1 whitespace-nowrap">
                                                    <span className={bid.status === 'SUBMITTED' || bid.status === 'VALIDATED' || bid.status === 'EVALUATED' ? 'text-gov-blue' : ''}>Submitted</span>
                                                    <span className={bid.status === 'VALIDATED' || bid.status === 'EVALUATED' ? 'text-gov-blue' : ''}>Technical Eval</span>
                                                    <span className={bid.status === 'VALIDATED' || bid.status === 'EVALUATED' ? 'text-gov-blue' : ''}>Officer Proof</span>
                                                    <span className={bid.status === 'EVALUATED' ? 'text-emerald-600' : ''}>Final selection</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-gov-blue/10">
                                            <p className="text-[11px] text-gov-blue font-medium flex items-center gap-1.5 bg-white/50 px-3 py-1 rounded-full border border-gov-blue/10">
                                                <Sparkles className="w-3.5 h-3.5 text-gov-blue animate-pulse" /> 
                                                {bid.status === 'SUBMITTED' ? "AI parsing documents for compliance..." : 
                                                 bid.status === 'VALIDATED' ? "Officer verified certificates. AI final scoring in progress." : 
                                                 "Final outcome published. Review detailed feedback below."}
                                            </p>
                                            <Dialog open={isQueryOpen} onOpenChange={setIsQueryOpen}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs text-gov-blue flex items-center gap-1 hover:bg-gov-blue/10"
                                                        onClick={() => setSelectedBid(bid)}
                                                    >
                                                        <MessageSquare className="w-3 h-3" /> Raise Query
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Raise Clarification Query</DialogTitle>
                                                        <DialogDescription>
                                                            Send a secure message to the Procurement Officer regarding this proposal.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4 space-y-2">
                                                        <Textarea
                                                            placeholder="Specify the section or clause you need clarification on..."
                                                            value={query}
                                                            onChange={(e) => setQuery(e.target.value)}
                                                            className="min-h-[120px]"
                                                        />
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setIsQueryOpen(false)}>Cancel</Button>
                                                        <Button onClick={handleSendQuery} className="bg-gov-blue">Send Query</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* New: Recent Communications (Inbox) */}
                    <Card className="border-border shadow-sm border-gov-blue/20">
                        <CardHeader className="pb-3 px-6 pt-6 flex flex-row items-center justify-between bg-gov-blue/5 rounded-t-xl">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Mail className="w-5 h-5 text-gov-blue" />
                                Recent Updates
                            </CardTitle>
                            {unreadCount > 0 && <Badge className="bg-gov-red text-white text-[10px] animate-pulse">{unreadCount} New</Badge>}
                        </CardHeader>
                        <CardContent className="px-6 pb-6 pt-4 space-y-3">
                            {isCommsLoading ? (
                                <div className="py-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-10" /></div>
                            ) : inbox.length === 0 ? (
                                <div className="p-4 text-center text-[11px] text-muted-foreground border border-dashed rounded-lg bg-muted/5">
                                    No recent communications from officers.
                                </div>
                            ) : (
                                inbox.slice(0, 3).map((msg: any) => (
                                    <div 
                                        key={msg.id} 
                                        className={`p-3 rounded-lg border transition-all cursor-pointer ${!msg.read_at ? 'bg-gov-blue/5 border-gov-blue/20 shadow-sm' : 'bg-white border-border hover:bg-muted/50'}`}
                                        onClick={() => {
                                            if (!msg.read_at) markAsRead.mutate(msg.id);
                                            navigate("/dashboard/communications");
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[9px] font-black text-gov-blue uppercase tracking-wider">{msg.communication_type.replace('_', ' ')}</span>
                                            <span className="text-[9px] text-muted-foreground">{new Date(msg.sent_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                        </div>
                                        <h5 className="text-xs font-bold truncate pr-4 text-slate-800">{msg.subject}</h5>
                                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 font-medium">{msg.message}</p>
                                    </div>
                                ))
                            )}
                            {inbox.length > 3 && (
                                <Button 
                                    variant="ghost" 
                                    className="w-full text-[10px] h-8 text-gov-blue hover:text-gov-blue-dark font-bold mt-2"
                                    onClick={() => navigate("/dashboard/communications")}
                                >
                                    View Full Inbox <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Rejected/Completed Bids with AI Outcome Summary */}
                    <Card className="border-border">
                        <CardHeader className="pb-3 px-6 pt-6">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                Past Bid Outcomes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 pt-0">
                            {isEvalLoading ? (
                                <div className="py-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /></div>
                            ) : myBids.filter(b => b.complianceStatus === "REJECTED").length === 0 ? (
                                <div className="p-4 text-center text-[10px] text-muted-foreground border border-dashed rounded-lg">No rejected bids in history.</div>
                            ) : (
                                myBids.filter(b => b.complianceStatus === "REJECTED").map(bid => (
                                    <div key={bid.vendorName + bid.financialBid} className="p-4 rounded-xl border border-muted bg-muted/20 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-sm text-muted-foreground">{bid.vendorName} Proposal</h4>
                                            <Badge variant="destructive" className="text-[10px]">Closed: Rejected</Badge>
                                        </div>
                                        <div className="bg-gov-red/5 p-3 rounded-lg border border-gov-red/10 flex gap-3">
                                            <AlertCircle className="w-4 h-4 text-gov-red shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-gov-red">AI Outcome Summary</p>
                                                <p className="text-xs text-foreground/80 leading-relaxed mt-1">
                                                    "Technical non-compliance or scoring below threshold detected by AI forensic review."
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Column 3: Opportunity Discovery */}
                <div className="space-y-6">
                    <Card className="border-gov-yellow/30 bg-gov-yellow/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2 text-gov-yellow-dark">
                                <Sparkles className="w-5 h-5" />
                                AI-Matched Opportunities
                            </CardTitle>
                            <CardDescription>Recommended based on your past performance.</CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 pb-6 space-y-4">
                            {isTendersLoading ? (
                                <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /></div>
                            ) : recommendedTenders.length === 0 ? (
                                <div className="p-4 text-center text-[10px] text-muted-foreground border border-dashed rounded-lg bg-white">No active tenders recommended for your profile.</div>
                            ) : recommendedTenders.map(tender => (
                                <div key={tender.id} className="p-4 bg-white rounded-xl border border-gov-yellow/20 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => navigate("/dashboard/tenders")}>
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge className="bg-gov-yellow/20 text-gov-yellow-dark border-transparent hover:bg-gov-yellow/30 text-[10px]">
                                            98% AI Match
                                        </Badge>
                                        <span className="text-[10px] font-bold text-muted-foreground">{tender.id}</span>
                                    </div>
                                    <h4 className="font-bold text-sm group-hover:text-gov-blue transition-colors">{tender.projectName}</h4>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 mb-3">
                                        <Building className="w-3 h-3" /> {tender.department}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground bg-muted/50 p-2 rounded italic">
                                        "Matches your technical expertise in relevant sector installations."
                                    </p>
                                    <Button variant="ghost" className="w-full mt-3 h-8 text-[11px] group-hover:bg-gov-blue group-hover:text-white border border-transparent group-hover:border-gov-blue transition-all">
                                        View Details <ArrowRight className="w-3 h-3 ml-2" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-md font-bold">Quick Submission Help</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start text-xs h-9">
                                <FileText className="w-4 h-4 mr-2 text-gov-blue" /> Download Submission Checklist
                            </Button>
                            <Button variant="outline" className="w-full justify-start text-xs h-9">
                                <CheckCircle2 className="w-4 h-4 mr-2 text-gov-green" /> Verify My Compliance Score
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </>
    );
}
