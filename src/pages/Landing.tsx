import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Zap, Shield, Search, BarChart3,
    ArrowRight, CheckCircle2, Globe, Cpu,
    Play, Sparkles, Layout, Database, Terminal
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export default function Landing() {
    const navigate = useNavigate();
    const [isDemoOpen, setIsDemoOpen] = useState(false);
    const [demoStep, setDemoStep] = useState(0);

    const demoSteps = [
        {
            title: "Phase 1: Intelligent Drafting",
            icon: <Layout className="w-12 h-12 text-gov-blue" />,
            tag: "PROCUREMENT START",
            color: "bg-gov-blue",
            desc: "AI scans historical G.O.s and technical specs to draft a 50-page RFP in seconds.",
            detail: "Includes automated generation of Eligibility Criteria, SLAs, and Payment Milestones with 99% policy alignment."
        },
        {
            title: "Phase 2: Smart Publication",
            icon: <Globe className="w-12 h-12 text-gov-blue-dark" />,
            tag: "VENDOR REACH",
            color: "bg-gov-blue-dark",
            desc: "The system automatically alerts qualified vendors based on their past performance and capacity.",
            detail: "Eliminates 'hidden tenders' by ensuring every eligible SME and Startup in the state is notified via AI-routing."
        },
        {
            title: "Phase 3: Automated Evaluation",
            icon: <Search className="w-12 h-12 text-gov-yellow-dark" />,
            tag: "BID ANALYSIS",
            color: "bg-gov-yellow-dark",
            desc: "Technical bids are automatically compared against the RFP requirements using NLP.",
            detail: "Points out missing documents and technical deviations instantly, saving weeks of manual committee reviews."
        },
        {
            title: "Phase 4: Risk Intelligence",
            icon: <Database className="w-12 h-12 text-gov-yellow" />,
            tag: "FRAUD DETECTION",
            color: "bg-gov-yellow",
            desc: "Algorithms flag cartel behavior, price rigging, or abnormally low bids that risk project quality.",
            detail: "Uses price benchmarking across 15+ government departments to ensure the State gets the best value-for-money."
        },
        {
            title: "Phase 5: Executive Sanction",
            icon: <Shield className="w-12 h-12 text-gov-green-light" />,
            tag: "APPROVAL PORTAL",
            color: "bg-gov-green-light",
            desc: "Authorities receive an 'AI Executive Summary' of the bid evaluation for one-click sanctioning.",
            detail: "Summarizes 1000s of pages into a 2-page briefing highlighting risks, savings, and technical compliance."
        },
        {
            title: "Phase 6: Forensic Oversight",
            icon: <Terminal className="w-12 h-12 text-gov-green" />,
            tag: "IMMUTABLE AUDIT",
            color: "bg-gov-green",
            desc: "Watchdogs get a forensic-grade, time-stamped log of every decision and revision.",
            detail: "Forensic search allows auditors to track deviations in real-time, ensuring 100% accountability to the taxpayer."
        }
    ];

    const nextStep = () => {
        if (demoStep < demoSteps.length - 1) {
            setDemoStep(demoStep + 1);
        } else {
            setIsDemoOpen(false);
            setDemoStep(0);
        }
    };

    return (
        <div className="min-h-screen bg-white text-foreground selection:bg-gov-blue/10 selection:text-gov-blue font-sans overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-gov-blue p-1.5 rounded-lg shadow-lg shadow-gov-blue/20">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-black text-lg sm:text-xl tracking-tight text-foreground whitespace-nowrap">RTGS <span className="text-muted-foreground font-medium">PROCURE</span></span>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-8">
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Features</a>
                            <a href="#impact" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Impact</a>
                        </div>
                        <Button
                            onClick={() => navigate("/login")}
                            className="bg-gov-blue text-white hover:bg-gov-blue/90 rounded-full px-4 sm:px-6 h-9 sm:h-10 transition-all hover:scale-105 active:scale-95 font-bold text-xs sm:text-sm"
                        >
                            Sign In
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-16 md:pt-48 md:pb-40 px-6 overflow-hidden">
                {/* Background Blobs (Optimized for Light Mode) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gov-blue/5 rounded-full blur-[80px] sm:blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gov-teal/5 rounded-full blur-[80px] sm:blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="max-w-7xl mx-auto text-center space-y-6 sm:space-y-10">
                    <div className="inline-flex items-center gap-2 bg-gov-blue/5 border border-gov-blue/10 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full animate-fade-in text-[8px] sm:text-[10px] font-black text-gov-blue uppercase tracking-[0.2em]">
                        <span className="flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-gov-blue animate-ping"></span>
                        Next-Gen Govt Infrastructure
                    </div>

                    <h1 className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-foreground leading-[0.95] sm:leading-[0.85] tracking-tighter animate-slide-up">
                        AI-POWERED <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gov-blue via-gov-blue-dark to-gov-teal italic">PROCURE </span>
                        PORTAL
                    </h1>

                    <p className="max-w-2xl mx-auto text-base sm:text-xl text-muted-foreground leading-relaxed animate-fade-in px-4" style={{ animationDelay: '0.4s' }}>
                        Transforming the Government of Andhra Pradesh's procurement lifecycle.
                        Secure, transparent, and accelerated by sovereign AI.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-fade-in px-6" style={{ animationDelay: '0.6s' }}>
                        <Button
                            size="lg"
                            onClick={() => navigate("/login")}
                            className="h-14 sm:h-16 w-full sm:w-auto px-10 sm:px-12 bg-gov-blue text-white hover:bg-gov-blue-dark rounded-2xl text-base sm:text-lg font-black shadow-2xl shadow-gov-blue/20 group transition-all"
                        >
                            Get Started
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-14 sm:h-16 w-full sm:w-auto px-10 sm:px-12 rounded-2xl text-base sm:text-lg font-black border-2 border-border bg-white hover:bg-muted flex items-center justify-center gap-3 transition-all"
                            onClick={() => setIsDemoOpen(true)}
                        >
                            <Play className="w-5 h-5 fill-gov-blue text-gov-blue" />
                            Watch Demo
                        </Button>
                    </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-12 pt-16 sm:pt-28 max-w-5xl mx-auto animate-fade-in px-4" style={{ animationDelay: '0.8s' }}>
                        <div className="space-y-1 sm:space-y-2 border-l border-border pl-4 sm:pl-8 text-left">
                            <p className="text-2xl sm:text-4xl font-black text-foreground italic">85%</p>
                            <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Faster Drafting</p>
                        </div>
                        <div className="space-y-1 sm:space-y-2 border-l border-border pl-4 sm:pl-8 text-left">
                            <p className="text-2xl sm:text-4xl font-black text-foreground italic">100%</p>
                            <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Policy Compliant</p>
                        </div>
                        <div className="space-y-1 sm:space-y-2 border-l border-border pl-4 sm:pl-8 text-left">
                            <p className="text-2xl sm:text-4xl font-black text-foreground italic truncate">₹400Cr+</p>
                            <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Savings</p>
                        </div>
                        <div className="space-y-1 sm:space-y-2 border-l border-border pl-4 sm:pl-8 text-left">
                            <p className="text-2xl sm:text-4xl font-black text-foreground italic">Live</p>
                            <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Risk Shield</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 sm:py-32 bg-muted/30 border-y border-border">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center space-y-4 mb-16 sm:mb-24">
                        <h2 className="text-xs font-black text-gov-blue uppercase tracking-[0.4em]">Core Capabilities</h2>
                        <h3 className="text-4xl sm:text-6xl font-black tracking-tighter italic">Mission-Critical Modules</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
                        {/* Feature 1 */}
                        <div className="group bg-white p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-border/60 hover:border-gov-blue/50 hover:shadow-2xl hover:shadow-gov-blue/5 transition-all duration-500">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gov-blue/10 rounded-2xl flex items-center justify-center mb-6 text-gov-blue group-hover:scale-110 transition-transform">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h4 className="text-lg sm:text-xl font-bold mb-4">AI Drafting Suite</h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Automatically generate RFPs, SLAs, and technical clauses using historical data and government orders. Reduces weeks of work to minutes.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group bg-white p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-border/60 hover:border-gov-yellow/50 hover:shadow-2xl hover:shadow-gov-yellow/5 transition-all duration-500">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gov-yellow/10 rounded-2xl flex items-center justify-center mb-6 text-gov-yellow-dark group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h4 className="text-lg sm:text-xl font-bold mb-4">Risk Intelligence</h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Real-time bid comparison matrices, abnormally low bid flags, and collusion pattern detection for foolproof evaluation.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group bg-white p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-border/60 hover:border-gov-green/50 hover:shadow-2xl hover:shadow-gov-green/5 transition-all duration-500">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gov-green/10 rounded-2xl flex items-center justify-center mb-6 text-gov-green group-hover:scale-110 transition-transform">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h4 className="text-lg sm:text-xl font-bold mb-4">Immutable Audit</h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                A deep-dive log showing every change made to a tender document. Ensures 100% transparency for auditors and watchdogs.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stakeholder Experience Section */}
            <section id="impact" className="py-24 sm:py-40 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gov-blue/[0.03] -skew-x-12 translate-x-20 -z-10"></div>

                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16 sm:gap-24">
                        <div className="flex-1 space-y-8 sm:space-y-12">
                            <div className="space-y-4">
                                <h2 className="text-xs font-black text-gov-blue uppercase tracking-[0.3em]">Integrated Ecosystem</h2>
                                <h3 className="text-4xl sm:text-7xl font-black tracking-tighter text-foreground leading-[0.9] sm:leading-[0.85]">
                                    One Platform. <br />
                                    <span className="text-gov-blue">Every </span> Stakeholder.
                                </h3>
                                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                                    Traditional procurement is siloed. RTGS ProCore unites everyone in a single, AI-orchestrated environment.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                {[
                                    {
                                        role: "Procurement Officers",
                                        desc: "Automate drafting & lifecycles.",
                                        icon: <Zap className="w-5 h-5" />,
                                        color: "text-gov-blue bg-gov-blue/10"
                                    },
                                    {
                                        role: "Evaluation Committees",
                                        desc: "Technical & financial AI compare.",
                                        icon: <Search className="w-5 h-5" />,
                                        color: "text-gov-yellow-dark bg-gov-yellow/10"
                                    },
                                    {
                                        role: "Approving Authorities",
                                        desc: "One-click executive sanctioning.",
                                        icon: <Shield className="w-5 h-5" />,
                                        color: "text-gov-green bg-gov-green/10"
                                    },
                                    {
                                        role: "RTGS Auditors",
                                        desc: "Real-time forensic discrepancy.",
                                        icon: <Terminal className="w-5 h-5" />,
                                        color: "text-foreground bg-muted"
                                    },
                                    {
                                        role: "Internal Vigilance",
                                        desc: "AI-flagged anomaly detection.",
                                        icon: <Database className="w-5 h-5" />,
                                        color: "text-gov-red bg-gov-red/10"
                                    },
                                    {
                                        role: "Registered Vendors",
                                        desc: "Transparent bidding & tracking.",
                                        icon: <Globe className="w-5 h-5" />,
                                        color: "text-gov-teal bg-gov-teal/10"
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="group p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-border/60 bg-white hover:border-gov-blue/40 hover:shadow-xl hover:shadow-gov-blue/5 transition-all duration-500">
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-5 ${item.color} group-hover:scale-110 transition-transform`}>
                                            {item.icon}
                                        </div>
                                        <h4 className="font-black text-xs sm:text-sm mb-1 tracking-tight">{item.role}</h4>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#0f172a] text-white py-20 sm:py-32 border-t border-border">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 sm:gap-20">
                    <div className="sm:col-span-2 space-y-6 sm:space-y-8">
                        <div className="flex items-center gap-2">
                            <div className="bg-white p-1.5 rounded-lg">
                                <Shield className="w-6 h-6 text-[#0f172a]" />
                            </div>
                            <span className="font-black text-xl sm:text-2xl tracking-tight text-white">RTGS <span className="text-white/40 font-medium whitespace-nowrap">PROCURE</span></span>
                        </div>
                        <p className="text-white/40 max-w-sm text-sm italic leading-relaxed font-medium">
                            Ensuring fair, transparent, and accelerated procurement for the state of Andhra Pradesh through advanced artificial intelligence and secure infrastructure.
                        </p>
                    </div>
                    <div>
                        <h5 className="font-black text-[10px] uppercase tracking-[0.3em] text-white underline decoration-gov-blue underline-offset-8 mb-8 sm:mb-10">Portal Access</h5>
                        <ul className="space-y-4 sm:space-y-6 text-sm text-white/50">
                            <li><a href="/login" className="hover:text-white transition-all flex items-center gap-2 group"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" /> Dept. Login</a></li>
                            <li><a href="/login" className="hover:text-white transition-all flex items-center gap-2 group"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" /> Registration</a></li>
                            <li><a href="#" className="hover:text-white transition-all flex items-center gap-2 group"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" /> Help Center</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-black text-[10px] uppercase tracking-[0.3em] text-white underline decoration-gov-teal underline-offset-8 mb-8 sm:mb-10">Legal</h5>
                        <ul className="space-y-4 sm:space-y-6 text-sm text-white/50">
                            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 pt-16 sm:pt-24 border-t border-white/5 mt-16 sm:mt-24 flex flex-col md:flex-row justify-between items-center gap-8 text-[8px] sm:text-[10px] uppercase font-black tracking-[0.3em] text-white/20 text-center">
                    <p>© 2026 RTGS PROCUREMENT SYSTEM • GOVT OF AP • ALL RIGHTS RESERVED</p>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            <span>ENG / తెలుగు</span>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-gov-green"></div>
                            <span>System Status: Optimal</span>
                        </div>
                    </div>
                </div>
            </footer>

            <Dialog open={isDemoOpen} onOpenChange={(val) => {
                setIsDemoOpen(val);
                if (!val) setDemoStep(0);
            }}>
                <DialogContent className="w-[95vw] sm:max-w-[800px] p-0 overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] border-none shadow-3xl">
                    <DialogTitle className="sr-only">System Guided Tour</DialogTitle>
                    <DialogDescription className="sr-only">Interactive walkthrough of the AI Procurement workflow.</DialogDescription>
                    <div className="flex flex-col md:flex-row min-h-[500px] md:h-[500px]">
                        {/* Progressive sidebar */}
                        <div className={`w-full md:w-1/3 p-6 sm:p-10 text-white transition-colors duration-700 ${demoSteps[demoStep].color} flex flex-col justify-between`}>
                            <div className="space-y-4 sm:space-y-6">
                                <div className="bg-white/20 p-2 sm:p-3 rounded-2xl w-fit backdrop-blur-md animate-bounce-slow">
                                    <Cpu className="w-5 sm:w-6 h-5 sm:h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black tracking-tighter leading-none italic opacity-50 mb-2">0{demoStep + 1}</h2>
                                    <h3 className="text-xl sm:text-2xl font-black tracking-tighter leading-tight">
                                        {demoSteps[demoStep].title}
                                    </h3>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4 md:mt-0">
                                <div className="flex gap-1">
                                    {demoSteps.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 ${i === demoStep ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-60">System Guided Tour</p>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 bg-white p-6 sm:p-12 flex flex-col justify-between relative overflow-hidden">
                            {/* Decorative Background Element */}
                            <div className="absolute -top-20 -right-20 opacity-[0.03] scale-150 pointer-events-none rotate-12">
                                {demoSteps[demoStep].icon}
                            </div>

                            <div className="space-y-6 sm:space-y-8 animate-slide-up" key={demoStep}>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[10px] font-black text-white ${demoSteps[demoStep].color}`}>
                                        {demoSteps[demoStep].tag}
                                    </span>
                                    <div className="h-[1px] flex-1 bg-muted"></div>
                                </div>

                                <div className="space-y-3 sm:space-y-4">
                                    <h4 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight">
                                        {demoSteps[demoStep].desc}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">
                                        "{demoSteps[demoStep].detail}"
                                    </p>
                                </div>

                                <div className="p-4 sm:p-6 bg-muted/40 rounded-[1.5rem] sm:rounded-3xl border border-dashed border-border flex items-center gap-4 sm:gap-6">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center animate-pulse shrink-0">
                                        {demoSteps[demoStep].icon}
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <p className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground truncate">AI Confidence Score</p>
                                        <p className="font-bold text-gov-blue text-xs sm:text-sm truncate">99.2% Accurate Verification</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-8">
                                <Button
                                    variant="ghost"
                                    className="font-bold text-[10px] sm:text-xs h-9"
                                    onClick={() => setDemoStep(0)}
                                    disabled={demoStep === 0}
                                >
                                    Restart
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={nextStep}
                                        className={`px-6 sm:px-8 h-10 sm:h-12 rounded-xl sm:rounded-2xl font-black transition-all ${demoSteps[demoStep].color} text-white shadow-xl text-xs sm:text-sm`}
                                    >
                                        {demoStep === demoSteps.length - 1 ? 'Finish' : 'Next'}
                                        {demoStep < demoSteps.length - 1 && <ArrowRight className="ml-1 sm:ml-2 w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
