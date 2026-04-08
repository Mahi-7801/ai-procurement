import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Mail, MailOpen, Send, Clock, CheckCircle, AlertCircle,
    MessageSquare, FileText, User, ArrowRight, X, Sparkles, Loader2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { roleLabels } from "@/lib/mock-data";
import { useCommunications, Communication } from "@/hooks/useCommunications";
import { useTenders } from "@/hooks/useTenders";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";



const communicationTypeLabels: Record<string, string> = {
    TENDER_INTIMATION: "Tender Intimation",
    CLARIFICATION_REQUEST: "Clarification Request",
    EVALUATION_REQUEST: "Evaluation Request",
    APPROVAL_REQUEST: "Approval Request",
    VENDOR_NOTICE: "Vendor Notice",
    APPROVAL_DECISION: "Approval Decision",
    REJECTION_DECISION: "Rejection Decision",
    QUERY: "Query",
    EVALUATION_REPORT: "Evaluation Report",
    COMPLIANCE_REMARK: "Compliance Remark",
    AUDIT_OBSERVATION: "Audit Observation",
    COMPLIANCE_NOTICE: "Compliance Notice",
    STATUS_UPDATE: "Status Update",
    CLARIFICATION_RESPONSE: "Clarification Response"
};

const priorityColor: Record<string, string> = {
    LOW: "bg-gov-blue/15 text-gov-blue border-gov-blue/30",
    NORMAL: "bg-muted text-muted-foreground border-border",
    HIGH: "bg-gov-orange/15 text-gov-orange border-gov-orange/30",
    URGENT: "bg-gov-red/15 text-gov-red border-gov-red/30"
};

const statusColor: Record<string, string> = {
    SENT: "bg-muted text-muted-foreground",
    DELIVERED: "bg-gov-blue/15 text-gov-blue",
    READ: "bg-gov-yellow/15 text-gov-yellow",
    ACKNOWLEDGED: "bg-gov-green/15 text-gov-green",
    ACTION_TAKEN: "bg-gov-green text-primary-foreground"
};

export default function CommunicationsPage() {
    const { auth } = useAuth();
    const { toast } = useToast();
    const { tenders, isLoading: isTendersLoading } = useTenders();
    const { inbox, sent, isLoading: isCommsLoading, sendMessage, markAsRead, takeAction } = useCommunications();

    const [selectedTab, setSelectedTab] = useState("inbox");
    const [selectedMessage, setSelectedMessage] = useState<Communication | null>(null);
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

    // New Message Form State
    const [newTender, setNewTender] = useState("");
    const [newType, setNewType] = useState("");
    const [newSubject, setNewSubject] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [newPriority, setNewPriority] = useState("NORMAL");
    const [newToRole, setNewToRole] = useState("SYSTEM_ROUTED"); // Added manual routing state
    const [isGenerating, setIsGenerating] = useState(false);

    // Automatically generate content when Tender and Type are selected
    useEffect(() => {
        if (newTender && newType && !newSubject && !newMessage && !isGenerating) {
            generateAIContent();
        }
    }, [newTender, newType]);

    const unreadCount = inbox.filter(m => !m.read_at).length;
    const actionRequiredCount = inbox.filter(m => m.requires_action && !m.action_taken).length;

    const generateAIContent = async () => {
        if (!newTender || !newType) {
            toast({
                title: "Incomplete details",
                description: "Select a Tender and Message Type first for AI to understand the context.",
                variant: "destructive",
            });
            return;
        }

        setIsGenerating(true);
        // Simulate AI thinking and drafting
        await new Promise(resolve => setTimeout(resolve, 1500));

        const tender = tenders.find(t => t.id === newTender);
        const typeLabel = communicationTypeLabels[newType];

        let subject = `${typeLabel}: ${tender?.id} - ${tender?.projectName}`;
        let message = "";

        // Context-aware generation logic
        switch (newType) {
            case "APPROVAL_REQUEST":
                message = `Esteemed Approving Authority,\n\nThe evaluation phase for the "${tender?.projectName}" (Ref: ${tender?.id}) project is now complete. The committee has identified the L1 bidder after rigorous technical scoring. We request your formal sanctioned approval to proceed with the award of contract as per the G.O Ms. No 42 guidelines.`;
                break;
            case "CLARIFICATION_REQUEST":
                message = `Dear Vendor/Dept Representative,\n\nUpon reviewing the technical submission for "${tender?.projectName}", we have identified minor discrepancies in the financial bid documentation. Specifically, the GST breakdown for line item 4.2 requires clarification. Kindly submit the rectified details within 48 hours to maintain the evaluation timeline.`;
                break;
            case "EVALUATION_REQUEST":
                message = `To the Evaluation Committee,\n\nThe bidding window for "${tender?.projectName}" has closed with 5 valid submissions. You are requested to commence the technical evaluation phase. Please ensure all scoring rubrics are followed strictly as per the RFP document. The deadline for submission of the preliminary report is 7 days from today.`;
                break;
            case "AUDIT_OBSERVATION":
                message = `URGENT AUDIT NOTICE:\n\nDuring the RTGS real-time audit of tender "${tender?.id}", a discrepancy was noted in the bidder eligibility verification process. Please provide the justification for the qualification of Bidder ID #824 by the end of the current business day. Compliance is mandatory for transparency.`;
                break;
            default:
                message = `This is a formal communication regarding ${tender?.projectName} (${tender?.id}). Following the ${typeLabel} workflow stage, please take note of the attached progress reports and provide your inputs for the next phase.`;
        }

        setNewSubject(subject);
        setNewMessage(message);
        setIsGenerating(false);

        toast({
            title: "AI Draft Ready",
            description: "Suggested content generated based on procurement status.",
        });
    };

    const handleSendMessage = async () => {
        if (!newTender || !newType || !newSubject || !newMessage) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        try {
            // Find the underlying database Integer PK for the selected tender reference
            const targetTender = tenders.find(t => t.id === newTender);
            if (!targetTender) throw new Error("Invalid Tender selected");

            await sendMessage.mutateAsync({
                tender_id: (targetTender as any).db_id || 1, // Fallback to 1 if first tender, but use db_id if available
                tender_ref: newTender,
                communication_type: newType,
                from_user: auth.user?.full_name || "Executing Officer",
                from_role: auth.role,
                to_role: newToRole,
                subject: newSubject,
                message: newMessage,
                requires_action: newType.includes("REQUEST") || newType.includes("NOTICE"),
                action_taken: false,
                priority: newPriority as any,
                status: "SENT"
            });

            setIsNewMessageOpen(false);
            setNewTender("");
            setNewType("");
            setNewSubject("");
            setNewMessage("");
            setNewPriority("NORMAL");
            setNewToRole("SYSTEM_ROUTED");

            toast({
                title: "Success",
                description: "Message sent and routed successfully",
            });
        } catch (error) {
            toast({
                title: "Failed to send",
                description: "There was an error routing your message via Local Backend.",
                variant: "destructive",
            });
        }
    };

    const handleMessageClick = (message: Communication) => {
        setSelectedMessage(message);
        if (selectedTab === "inbox" && !message.read_at) {
            markAsRead.mutate(message.id);
        }
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-foreground">Communications</h1>
                    <p className="text-sm text-muted-foreground truncate xs:whitespace-normal">
                        Role-based message routing • {roleLabels[auth.role]}
                    </p>
                </div>
                <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gov-blue hover:bg-gov-blue-dark w-full sm:w-auto h-10 px-6 font-bold text-xs shadow-lg shadow-gov-blue/20">
                            <Send className="w-4 h-4 mr-2" />
                            New Message
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <div className="flex items-center justify-between">
                            <DialogTitle>Compose New Communication</DialogTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gov-blue hover:text-gov-blue-dark flex items-center gap-1"
                                onClick={generateAIContent}
                                disabled={isGenerating || !newTender || !newType}
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Sparkles className="w-3 h-3 text-gov-yellow" />
                                )}
                                <span className="text-xs font-semibold">Magic Draft</span>
                            </Button>
                        </div>
                        <DialogDescription>
                            Messages are automatically routed based on role and stage.
                        </DialogDescription>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="tender" className="text-right whitespace-nowrap">
                                    Tender ID
                                </Label>
                                <Select value={newTender} onValueChange={setNewTender}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Tender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tenders.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.id} - {t.projectName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right whitespace-nowrap">
                                    Message Type
                                </Label>
                                <Select value={newType} onValueChange={setNewType}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(communicationTypeLabels).map(([val, label]) => (
                                            <SelectItem key={val} value={val}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="toRole" className="text-right whitespace-nowrap">
                                    Recipient Category
                                </Label>
                                <Select value={newToRole} onValueChange={setNewToRole}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Automatic Routing" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SYSTEM_ROUTED" className="font-semibold text-gov-blue">
                                            Auto (Smart Routing)
                                        </SelectItem>
                                        <hr className="my-1 border-slate-100" />
                                        {Object.entries(roleLabels).map(([val, label]) => (
                                            <SelectItem key={val} value={val}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="subject" className="text-right">
                                    Subject
                                </Label>
                                <Input
                                    id="subject"
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    className="col-span-3"
                                    placeholder="Enter message subject..."
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="message" className="text-right">
                                    Message
                                </Label>
                                <Textarea
                                    id="message"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="col-span-3 min-h-[120px]"
                                    placeholder="Compose your message..."
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="priority" className="text-right">
                                    Priority
                                </Label>
                                <Select value={newPriority} onValueChange={setNewPriority}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="NORMAL">Normal</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSendMessage} className="bg-gov-blue hover:bg-gov-blue-dark">
                                <Send className="w-4 h-4 mr-2" />
                                Send & Route
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Unread</p>
                                <p className="text-3xl font-bold text-foreground">{unreadCount}</p>
                            </div>
                            <Mail className="w-8 h-8 text-gov-blue" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Action Required</p>
                                <p className="text-3xl font-bold text-gov-orange">{actionRequiredCount}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-gov-orange" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Sent</p>
                                <p className="text-3xl font-bold text-foreground">{sent.length}</p>
                            </div>
                            <Send className="w-8 h-8 text-gov-green" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-3xl font-bold text-foreground">{inbox.length + sent.length}</p>
                            </div>
                            <MessageSquare className="w-8 h-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardContent className="p-0">
                    <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                        <div className="border-b px-6 pt-6">
                            <TabsList className="grid w-full max-w-md grid-cols-2">
                                <TabsTrigger value="inbox">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Inbox ({unreadCount})
                                </TabsTrigger>
                                <TabsTrigger value="sent">
                                    <Send className="w-4 h-4 mr-2" />
                                    Sent
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="inbox" className="p-4 sm:p-6 space-y-3">
                            {isCommsLoading ? (
                                <div className="py-20 text-center">
                                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-gov-blue opacity-20" />
                                    <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-[0.2em]">Syncing Secure Inbox...</p>
                                </div>
                            ) : inbox.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed rounded-xl border-slate-100 bg-slate-50/30">
                                    <MailOpen className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-600">Your inbox is clear</h3>
                                    <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2">
                                        When procurement tasks or clarifications are assigned to your role, they will appear here.
                                    </p>
                                </div>
                            ) : inbox.map((message) => (
                                <div
                                    key={message.id}
                                    className={`p-4 rounded-lg border transition-all cursor-pointer ${!message.read_at
                                        ? "bg-gov-blue/5 border-gov-blue/30 hover:bg-gov-blue/10"
                                        : "bg-background border-border hover:bg-muted/50"
                                        }`}
                                    onClick={() => handleMessageClick(message)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            {!message.read_at ? (
                                                <Mail className="w-5 h-5 text-gov-blue mt-1" />
                                            ) : (
                                                <MailOpen className="w-5 h-5 text-muted-foreground mt-1" />
                                            )}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-foreground truncate max-w-full">{message.subject}</h4>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                                            <p className="text-sm text-muted-foreground truncate max-w-full">
                                                                From: {message.from_user} ({message.from_role})
                                                            </p>
                                                            <Badge variant="outline" className="text-xs shrink-0">
                                                                {message.tender_ref}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 flex-wrap">
                                                        <Badge variant="outline" className={`text-xs ${priorityColor[message.priority]}`}>
                                                            {message.priority}
                                                        </Badge>
                                                        {message.requires_action && !message.action_taken && (
                                                            <Badge className="bg-gov-orange text-primary-foreground text-xs">
                                                                Action Required
                                                            </Badge>
                                                        )}
                                                        {message.action_taken && (
                                                            <Badge className="bg-gov-green text-primary-foreground text-xs">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Completed
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-foreground line-clamp-2">{message.message}</p>
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1 shrink-0">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDateTime(message.sent_at)}
                                                    </span>
                                                    <span className="flex items-center gap-1 shrink-0">
                                                        <FileText className="w-3 h-3" />
                                                        {communicationTypeLabels[message.communication_type]}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </TabsContent>

                        <TabsContent value="sent" className="p-6 space-y-3">
                            {sent.map((message) => (
                                <div
                                    key={message.id}
                                    className="p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-all cursor-pointer"
                                    onClick={() => setSelectedMessage(message)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <Send className="w-5 h-5 text-gov-green mt-1" />
                                            <div className="flex-1 space-y-2">
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-semibold text-foreground truncate max-w-full">{message.subject}</h4>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                                            <p className="text-sm text-muted-foreground truncate max-w-full">
                                                                To: {message.to_role}
                                                            </p>
                                                            <Badge variant="outline" className="text-xs shrink-0">
                                                                {message.tender_ref}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className={`text-xs shrink-0 ${statusColor[message.status]}`}>
                                                        {message.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1 shrink-0">
                                                        <Clock className="w-3 h-3" />
                                                        Sent: {formatDateTime(message.sent_at)}
                                                    </span>
                                                    {message.read_at && (
                                                        <span className="flex items-center gap-1 shrink-0">
                                                            <MailOpen className="w-3 h-3" />
                                                            Read: {formatDateTime(message.read_at)}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1 shrink-0">
                                                        <FileText className="w-3 h-3" />
                                                        {communicationTypeLabels[message.communication_type]}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Role-Based Routing Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        Automatic Role-Based Routing
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="p-3 rounded-lg bg-gov-blue/10 border border-gov-blue/30">
                            <p className="font-semibold text-gov-blue mb-1">Your Role: {roleLabels[auth.role]}</p>
                            <p className="text-muted-foreground text-xs">
                                Messages are automatically routed based on tender stage and your role
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-gov-green/10 border border-gov-green/30">
                            <p className="font-semibold text-gov-green mb-1">No Manual Routing</p>
                            <p className="text-muted-foreground text-xs">
                                System determines recipients automatically - no email, no WhatsApp
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* Message Detail Dialog */}
            <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    {selectedMessage && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between pr-6">
                                    <Badge variant="outline" className={priorityColor[selectedMessage.priority || "NORMAL"]}>
                                        {selectedMessage.priority || "NORMAL"} Priority
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{formatDateTime(selectedMessage.sent_at)}</span>
                                </div>
                                <DialogTitle className="text-xl mt-2">{selectedMessage.subject}</DialogTitle>
                                <DialogDescription className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-[10px]">{selectedMessage.tender_ref}</Badge>
                                    <span>•</span>
                                    <span>{communicationTypeLabels[selectedMessage.communication_type]}</span>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-6 space-y-4 border-y my-4">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gov-blue/10 flex items-center justify-center text-gov-blue font-bold">
                                            {(selectedMessage.from_user || selectedMessage.to_role || "S")[0]}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{selectedMessage.from_user || "Target Role: " + selectedMessage.to_role}</p>
                                            <p className="text-xs text-muted-foreground">{selectedMessage.from_role || "Sent by me"}</p>
                                        </div>
                                    </div>
                                    {selectedMessage.requires_action && !selectedMessage.action_taken && (
                                        <Badge className="bg-gov-orange text-white">Action Required</Badge>
                                    )}
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap italic text-foreground/90">
                                    "{selectedMessage.message || "No content preview available for this sent message."}"
                                </div>
                            </div>
                            <DialogFooter className="sm:justify-between items-center">
                                <p className="text-[10px] text-muted-foreground">ID: {selectedMessage.id}</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedMessage(null)}>
                                        Close
                                    </Button>
                                    {selectedMessage.requires_action && !selectedMessage.action_taken && (
                                        <Button size="sm" className="bg-gov-green hover:bg-gov-green/90">
                                            Take Action
                                        </Button>
                                    )}
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
