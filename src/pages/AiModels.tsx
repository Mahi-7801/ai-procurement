import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, BrainCircuit } from "lucide-react";

export default function AiModels() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">ProcureSmart AI Models</h1>
                    <p className="text-muted-foreground mt-2">Managing the proprietary AI engines powering the platform.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-gov-blue/20 bg-gov-blue/5 shadow-lg group hover:border-gov-blue/50 transition-all cursor-pointer">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border shadow-sm group-hover:bg-gov-blue group-hover:text-white transition-colors text-gov-blue">
                                <BrainCircuit className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-xl">ProcureGPT-4</CardTitle>
                        </div>
                        <Badge className="bg-gov-blue text-white w-fit">ACTIVE ENGINE</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            The core LLM tailored for government procurement language. Handles drafting, compliance checking, and legal risk assessment.
                        </p>
                        <div className="text-xs font-mono text-slate-500 bg-white p-3 rounded border">
                            Training Data: GFR 2017, CVC Guidelines 2024, 15M+ Historical Tenders
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:border-slate-300 transition-all cursor-pointer">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border shadow-sm text-slate-500">
                                <Bot className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-xl">Market Sense Alpha</CardTitle>
                        </div>
                        <Badge variant="outline" className="w-fit">ANALYTICS ENGINE</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Predictive pricing model analyzing commodity trends, labor indices, and geopolitical factors to estimate fair market value.
                        </p>
                        <div className="text-xs font-mono text-slate-500 bg-slate-50 p-3 rounded border">
                            Updates: Real-time (Hourly Refresh)
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:border-slate-300 transition-all cursor-pointer">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border shadow-sm text-slate-500">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-xl">Vision-Check v2</CardTitle>
                        </div>
                        <Badge variant="outline" className="w-fit">OCR & VISION</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Automated document verification system for scanning certifications, BoQ tables, and signature validation.
                        </p>
                        <div className="text-xs font-mono text-slate-500 bg-slate-50 p-3 rounded border">
                            Accuracy: 99.4% on Standard Forms
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
