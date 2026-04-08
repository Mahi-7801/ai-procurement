import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { saveRfp } from "@/lib/rfp-store";
import { useTenders } from "@/hooks/useTenders";
import { FileText, Loader2, Sparkles, CheckCircle, Download, ExternalLink, ArrowRight, FileCheck, Save, Calendar as CalendarIcon, FilePenLine, Shield, Building2, Package, Briefcase, FileStack, Settings2, AlertCircle, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { API_BASE_URL } from "@/config";
import { localAuth } from "@/services/localAuth";
import localDB from "@/services/localDB";
import { analyzeDocument } from "@/services/aiService";
import { toast } from "sonner";
import { formTemplates } from "@/data/formTemplates";
import { extractFieldsFromForms, fillFormFields, getFieldType } from "@/utils/formFieldExtractor";
import GemTenderWizard from "@/components/gem/GemTenderWizard";

// List of Andhra Pradesh Departments and Organizations
const ANDHRA_PRADESH_DEPARTMENTS = [
    "Greater Visakhapatnam Smart City Corporation Limited",
    "A P STATE HOUSING CORPORATION LIMITED",
    "A P Factories",
    "A P FOREST DEPARTMENT",
    "A P Labour Welfare Board",
    "APMSIDC",
    "A P PLANNING DEPARTMENT",
    "A P State Agro Industries Development Corporation Limited",
    "A P State Seed Certification Authority",
    "A.P Building & Other Construction Workers Welfare Board",
    "A.P. LEGISLATURE SECRETARIAT",
    "ACHARYA NAGARJUNA UNIVERSITY",
    "ACHARYA NG RANGA AGRICULTURAL UNIVERSITY",
    "Adult Education Department",
    "AGRICULTURAL MARKETING DEPARTMENT",
    "Amaravati Development Corporation Limited",
    "ANANTAPURAMU HINDUPUR URBAN DEVELOPMENT AUTHORITY",
    "ANDHRA PRADESH HOUSING BOARD",
    "Andhra Kesari University",
    "Andhra Pradesh Capital Region Development Authority",
    "Andhra Pradesh Medical Services Infrastructure Development Corporation",
    "Andhra Pradesh State Road Transport Corporation",
    "Andhra Pradesh Transmission Corporation Limited",
    "Andhra Pradesh Power Generation Corporation Limited",
    "Andhra Pradesh Power Distribution Corporation Limited",
    "Andhra Pradesh Industrial Infrastructure Corporation",
    "Andhra Pradesh Housing Board",
    "Andhra Pradesh Tourism Development Corporation",
    "Andhra Pradesh Mineral Development Corporation",
    "Andhra Pradesh State Warehousing Corporation",
    "Andhra Pradesh State Civil Supplies Corporation",
    "Andhra Pradesh State Financial Corporation",
    "Andhra Pradesh State Seeds Development Corporation",
    "Andhra Pradesh State Handloom Weavers Co-operative Society",
    "Andhra Pradesh State Co-operative Bank",
    "Department of Agriculture",
    "Department of Animal Husbandry & Fisheries",
    "Department of Cooperation",
    "Department of Energy",
    "Department of Finance",
    "Department of Health, Medical & Family Welfare",
    "Department of Higher Education",
    "Department of Industries & Commerce",
    "Department of Information Technology, Electronics & Communications",
    "Department of Infrastructure & Investment",
    "Department of Irrigation",
    "Department of Labour, Employment, Training & Factories",
    "Department of Municipal Administration & Urban Development",
    "Department of Panchayat Raj & Rural Development",
    "Department of Revenue",
    "Department of School Education",
    "Department of Social Welfare",
    "Department of Transport, Roads & Buildings",
    "Department of Water Resources",
    "Department of Women Development, Child Welfare & Disabled Welfare",
    "Department of Youth Services, Tourism & Culture",
    "DRDA (District Rural Development Agency)",
    "Municipal Corporation of Greater Visakhapatnam",
    "Municipal Corporation of Vijayawada",
    "Municipal Corporation of Guntur",
    "Municipal Corporation of Tirupati",
    "Urban Development Authority",
    "Water Resources Department",
    "Public Works Department",
    "Education Department",
    "Health Department",
    "Revenue Department",
    "Police Department",
    "Fire Services Department",
    "Environment, Forest, Science & Technology Department",
    "Food & Civil Supplies Department",
    "General Administration Department",
    "Law Department",
    "Minority Welfare Department",
    "Tribal Welfare Department",
    "Backward Classes Welfare Department",
    "Home Department",
    "Commercial Taxes Department",
    "Excise Department",
    "Registration & Stamps Department",
    "Endowments Department",
    "Horticulture Department",
    "Sericulture Department",
    "Fisheries Department",
    "Ground Water Department",
    "Mines & Geology Department",
    "Science & Technology Department",
    "Archaeology & Museums Department",
    "Library Services",
    "State Project Office",
    "District Collector Office",
    "Joint Collector Office",
    "Revenue Divisional Office",
    "Mandal Revenue Office",
    "Municipal Commissioner Office",
    "Panchayat Secretary Office",
    "Other (Specify)"
];

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const TENDER_SECTORS = [
    "Infrastructure & Construction",
    "Power & Energy",
    "Water & Sanitation",
    "Healthcare & Medical",
    "Education & Skill Development",
    "IT, Software & Digital Services",
    "Agriculture & Allied Activities",
    "Transport & Logistics",
    "Manufacturing & Industrial",
    "Oil, Gas & Petroleum",
    "Urban Development & Municipal Services",
    "Defence & Security",
    "Office & Administration",
    "Chemicals & Pharmaceuticals",
    "Mining & Minerals",
    "Environment & Sustainability",
    "Consultancy & Professional Services",
    "Textiles, Clothing & Miscellaneous",
    "Other"
];

const Draft = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Core State
    const [activeTab, setActiveTab] = useState("identification");
    const [drafting, setDrafting] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [bidId, setBidId] = useState("");

    // === ALL FIELDS FROM USER REQUEST ===
    // 1. Basic Tender Identification
    const [tenderCategory, setTenderCategory] = useState<"work" | "service" | "product" | "">("");
    const [projectTitle, setProjectTitle] = useState("");
    const [department, setDepartment] = useState("");
    const [ministry, setMinistry] = useState("");
    const [organisation, setOrganisation] = useState("");
    const [projectType, setProjectType] = useState<string>("");
    const [targetPlatform, setTargetPlatform] = useState<string>("");
    const [bidToRaEnabled, setBidToRaEnabled] = useState<"yes" | "no" | "">("");
    const [raPercentage, setRaPercentage] = useState("");
    const [beneficiaryName, setBeneficiaryName] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifscCode, setIfscCode] = useState("");
    const [branchName, setBranchName] = useState("");

    // Auto-filled Document Numbers
    const [panNumber, setPanNumber] = useState("");
    const [labourLicenseNumber, setLabourLicenseNumber] = useState("");
    const [firmRegistrationNumber, setFirmRegistrationNumber] = useState("");

    // 2. Location Details
    const [state, setState] = useState("");
    const [district, setDistrict] = useState("");
    const [mandal, setMandal] = useState("");
    const [city, setCity] = useState("");

    // 3. Sector & Classification
    const [sector, setSector] = useState("");
    const [classification, setClassification] = useState("");
    const [tenderType, setTenderType] = useState<"Open" | "Limited" | "Nomination">("Open");
    const [bidStartDate, setBidStartDate] = useState("");
    const [bidEndDate, setBidEndDate] = useState("");
    const [preBidMeetingLocation, setPreBidMeetingLocation] = useState(""); // Kept for compatibility

    // Detailed Dates
    const [bidSubmissionStartDate, setBidSubmissionStartDate] = useState("");
    const [bidSubmissionClosingDate, setBidSubmissionClosingDate] = useState("");
    const [techBidOpeningDate, setTechBidOpeningDate] = useState("");
    const [priceBidOpeningDate, setPriceBidOpeningDate] = useState("");

    // Other Details
    const [boqDetails, setBoqDetails] = useState("");
    const [govtNorms, setGovtNorms] = useState("");
    const [quantity, setQuantity] = useState("");

    // 4. Financial & Fee Details
    const [estimatedContractValue, setEstimatedContractValue] = useState("");
    const [emdAmount, setEmdAmount] = useState("");
    const [emdPayableTo, setEmdPayableTo] = useState("");
    const [emdPayableAt, setEmdPayableAt] = useState("");
    const [transactionFee, setTransactionFee] = useState("");
    const [corpusFund, setCorpusFund] = useState("");
    const [processingFee, setProcessingFee] = useState("");


    // 4. Financial Details
    const [emd, setEmd] = useState("");
    const [pbg, setPbg] = useState("");
    const [benchmarkValue, setBenchmarkValue] = useState("");
    const [contractStartDate, setContractStartDate] = useState("");
    const [contractEndDate, setContractEndDate] = useState("");
    const [contractDuration, setContractDuration] = useState("");

    // Financial Eligibility
    const [financialEligibility, setFinancialEligibility] = useState({
        quotation: false,
        gst: false,
        tds: false,
        gstReg: false,
        cgst: false,
        sgst: false,
        igst: false
    });

    // 5. GST Details
    const [gstin, setGstin] = useState("");
    const [gstApplicable, setGstApplicable] = useState<"yes" | "no" | "">("");
    const [cgst, setCgst] = useState("");
    const [sgst, setSgst] = useState("");
    const [igst, setIgst] = useState("");
    const [isInterState, setIsInterState] = useState(false);

    // 6. Dynamic Forms
    const [selectedForms, setSelectedForms] = useState<string[]>([]);
    const [formFields, setFormFields] = useState<string[]>([]);
    const [formValues, setFormValues] = useState<Record<string, string>>({});

    // === PLATFORM SPECIFIC STATES ===
    // CPP / eProcurement
    const [paymentMode, setPaymentMode] = useState("");
    const [withdrawalAllowed, setWithdrawalAllowed] = useState("no");
    const [coverDetails, setCoverDetails] = useState("");
    const [tenderFee, setTenderFee] = useState("");
    const [feePayableTo, setFeePayableTo] = useState("");
    const [feePayableAt, setFeePayableAt] = useState("");
    const [emdExemptionAllowed, setEmdExemptionAllowed] = useState("no");
    const [productCategory, setProductCategory] = useState("");
    const [subCategory, setSubCategory] = useState("");
    const [bidValidityDays, setBidValidityDays] = useState("");
    const [periodOfWorkDays, setPeriodOfWorkDays] = useState("");
    const [preBidMeetingAddress, setPreBidMeetingAddress] = useState("");
    const [publishDate, setPublishDate] = useState("");
    const [docDownloadStartDate, setDocDownloadStartDate] = useState("");
    const [docDownloadEndDate, setDocDownloadEndDate] = useState("");
    const [bidSubmissionEndDate, setBidSubmissionEndDate] = useState("");
    const [bidOpeningDate, setBidOpeningDate] = useState("");

    // GVMC / RFP
    const [projectRateReference, setProjectRateReference] = useState("");
    const [biddingType, setBiddingType] = useState("Single Stage - Two Part");
    const [technicalEvaluationMethod, setTechnicalEvaluationMethod] = useState("");
    const [financialEvaluationMethod, setFinancialEvaluationMethod] = useState("");

    // IREPS
    const [biddingSystem, setBiddingSystem] = useState("Two Packet");
    const [tenderClosingDate, setTenderClosingDate] = useState("");
    const [advertisedValue, setAdvertisedValue] = useState("");
    const [jvAllowed, setJvAllowed] = useState("no");

    // GeM
    const [gemBidNumber, setGemBidNumber] = useState("");
    const [oemTurnover, setOemTurnover] = useState("");
    const [mseRelaxation, setMseRelaxation] = useState("no");
    const [makeInIndiaPreference, setMakeInIndiaPreference] = useState("no");


    // Update fields when forms selection changes
    useEffect(() => {
        const fields = extractFieldsFromForms(formTemplates, selectedForms);
        setFormFields(fields);
    }, [selectedForms]);

    const handleFormSelection = (formId: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedForms(prev => [...prev, formId]);
        } else {
            setSelectedForms(prev => prev.filter(id => id !== formId));
        }
    };

    const handleFormValueChange = (field: string, value: string) => {
        setFormValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Initial load
    useEffect(() => {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 900000) + 100000;
        setBidId(`BID-${year}-${random}`);
    }, []);

    // Handle incoming tender data for amendments
    useEffect(() => {
        if (location.state?.tenderData) {
            const td = location.state.tenderData;
            if (td.title || td.projectName || td.itemName) setProjectTitle(td.title || td.projectName || td.itemName);
            if (td.department) setDepartment(td.department);
            if (td.ministry) setMinistry(td.ministry);
            if (td.organisation) setOrganisation(td.organisation);
            if (td.emdAmount || td.emd) setEmdAmount(td.emdAmount || td.emd);
            if (td.epbgPercentage || td.pbg) setPbg(td.epbgPercentage || td.pbg);
            if (td.quantity) setQuantity(td.quantity);
            if (td.beneficiaryName) setBeneficiaryName(td.beneficiaryName);
            if (td.platform) setTargetPlatform(td.platform);
            if (td.category) setTenderCategory(td.category as any);
            if (td.bidNumber) setGemBidNumber(td.bidNumber);
            if (td.bidValidity) setBidValidityDays(td.bidValidity);
            if (td.estimatedValue) {
                setEstimatedContractValue(td.estimatedValue);
                setBenchmarkValue(td.estimatedValue);
            }
            if (td.bidEndDate) setBidEndDate(td.bidEndDate);

            if (location.state.targetTab) {
                setActiveTab(location.state.targetTab);
            }

            toast.info("Tender details loaded for amendments", {
                description: "You can now modify the details and re-validate."
            });
        }
    }, [location.state]);

    // Derived State
    const totalGstPercent = useMemo(() => {
        const isApplicable = gstApplicable === "yes" || financialEligibility.gst;
        if (!isApplicable) return 0;
        if (isInterState) return parseFloat(igst) || 0;
        return (parseFloat(cgst) || 0) + (parseFloat(sgst) || 0);
    }, [gstApplicable, financialEligibility.gst, isInterState, igst, cgst, sgst]);

    // Handle bank details autofill (mock)
    useEffect(() => {
        if (ifscCode.length === 11) {
            setBankName("State Bank of India");
            setBranchName("Main Branch, Vijayawada");
        }
    }, [ifscCode]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data, error } = await localAuth.getCurrentUser();
                const isAdmin = data?.user?.role === 'admin';
                if (isAdmin) return;

                if (error || !data?.user?.id) {
                    toast.error("Please sign in to access drafts.");
                    navigate('/');
                }
            } catch (err) {
                navigate('/');
            }
        };
        checkAuth();
        loadRecentDrafts();
    }, [navigate]);

    const [recentDrafts, setRecentDrafts] = useState<any[]>([]);

    const loadRecentDrafts = async () => {
        try {
            const { data: userData } = await localAuth.getCurrentUser();
            const isAdmin = userData?.user?.role === 'admin';

            // If admin, pass undefined to fetch all. If user, pass their ID.
            const userId = isAdmin ? undefined : userData?.user?.id;

            if (userId || isAdmin) {
                const drafts = await localDB.getDrafts(userId);
                setRecentDrafts(drafts);
            }
        } catch (err) {
            console.error('Error loading drafts:', err);
        }
    };



    const { createTender } = useTenders();

    const handlePublish = async () => {
        setDrafting(true);
        try {
            // 1. Prepare data for validation
            const tenderDataForValidation = {
                title: projectTitle,
                department: department,
                ministry: ministry || "Government of Andhra Pradesh",
                organisation: organisation,
                estimatedValue: benchmarkValue || estimatedContractValue,
                platform: targetPlatform,
                bidEndDate: bidEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                emdAmount: emdAmount || emd,
                epbgPercentage: pbg,
                beneficiaryName: beneficiaryName || department,
                quantity: quantity,
                category: tenderCategory,
                bidNumber: gemBidNumber,
                bidValidity: bidValidityDays,
            };

            // 2. Save metadata to rfp-store
            saveRfp(bidId, projectTitle, tenderDataForValidation, targetPlatform);

            toast.success("Draft Finalized", {
                description: "Redirecting to AI Compliance Validator..."
            });

            // 3. Navigate to Validator with autoLoad
            setTimeout(() => {
                navigate("/dashboard/validator", {
                    state: {
                        autoLoad: true,
                        fileName: `Draft_${bidId}.pdf`,
                        tenderData: tenderDataForValidation
                    }
                });
            }, 800);
        } catch (e) {
            console.error(e);
            toast.error("Failed to process draft");
        } finally {
            setDrafting(false);
        }
    };

    // Download Handler
    const handleDownload = async (format: 'pdf' | 'docx') => {
        setDrafting(true);
        try {
            const payload = {
                bidNumber: bidId,
                dated: new Date().toLocaleDateString('en-GB'),
                category: tenderCategory,
                projectName: projectTitle,
                department: department,
                organisation: "Government of Andhra Pradesh",
                office: city || district,
                estimatedValue: benchmarkValue,
                emdRequired: emd,
                epbgPercentage: pbg,
                epbgDuration: contractDuration,
                validity: "180 Days",
                // Use the selected publishing platform to decide the
                // downstream document template (GeM / IREPS / CPPP / AP eProc / GVMC).
                source: targetPlatform,
                format: format,
                // Include filled forms
                enquiryForms: selectedForms.map(formId => ({
                    stage: "Tender",
                    name: formId,
                    type: "Mandatory",
                    mandatory: "Yes",
                    content: fillFormFields(formTemplates[formId], formValues)
                }))
            };

            const response = await fetch(`${API_BASE_URL || ''}/api/tender-draft/download`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Tender_${bidId}.${format}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast.success(`Draft downloaded as ${format.toUpperCase()}`);
            } else {
                toast.error("Failed to generate document");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error connecting to server");
        } finally {
            setDrafting(false);
        }
    };

    if (!targetPlatform) {
        return (
            <div className="min-h-screen bg-slate-50/50 p-8 animate-in fade-in duration-500">
                <div className="max-w-6xl mx-auto space-y-12 pt-12">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4">
                            <Building2 className="w-8 h-8 text-gov-blue" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Select Procurement Portal</h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            Choose the destination portal for your tender. The drafting wizard will automatically adapt compliance rules, templates, and mandatory fields based on your selection.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                id: "ap_eproc",
                                name: "AP eProcurement",
                                desc: "For Andhra Pradesh State Government tenders and local bodies.",
                                icon: <Building2 className="w-8 h-8" />,
                                color: "text-blue-600",
                                bg: "bg-blue-50",
                                badge: "State"
                            },
                            {
                                id: "gem",
                                name: "GeM Portal",
                                desc: "Government e-Marketplace for national public procurement.",
                                icon: <Package className="w-8 h-8" />,
                                color: "text-orange-600",
                                bg: "bg-orange-50",
                                badge: "Recommended",
                                recommended: true
                            },
                            {
                                id: "ireps",
                                name: "IREPS",
                                desc: "Indian Railways E-Procurement System for railway tenders.",
                                icon: <Briefcase className="w-8 h-8" />,
                                color: "text-emerald-600",
                                bg: "bg-emerald-50",
                                badge: "Central"
                            },
                            {
                                id: "cppp",
                                name: "CPP Portal",
                                desc: "Central Public Procurement Portal for unrestricted tenders.",
                                icon: <FileStack className="w-8 h-8" />,
                                color: "text-purple-600",
                                bg: "bg-purple-50",
                                badge: "Central"
                            }
                        ].map((p) => (
                            <div
                                key={p.id}
                                onClick={() => setTargetPlatform(p.id)}
                                className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-gov-blue/30 transition-all duration-300 cursor-pointer flex flex-col justify-between h-[320px]"
                            >
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-4 rounded-xl ${p.bg} ${p.color} transition-transform group-hover:scale-110 duration-500`}>
                                            {p.icon}
                                        </div>
                                        {p.badge && (
                                            <Badge variant={p.recommended ? "default" : "secondary"} className={p.recommended ? "bg-gov-blue hover:bg-gov-blue" : "bg-slate-100 text-slate-600"}>
                                                {p.badge}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-gov-blue transition-colors">
                                            {p.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            {p.desc}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-gov-blue transition-colors">
                                        Start Drafting
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-gov-blue group-hover:text-white transition-all">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center pt-8">
                        <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4" />
                            ProcureSmart AI automatically enforces GFR 2017 & CVC guidelines for all portals.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl animate-in fade-in duration-500 overflow-x-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTargetPlatform("")}
                        className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100/50 hover:bg-slate-200 transition-colors self-start sm:self-auto"
                    >
                        <ArrowRight className="w-5 h-5 rotate-180 text-slate-600" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-1">
                            <span>Drafting Assistant</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-500">{targetPlatform.replace('_', ' ').toUpperCase()} PORTAL</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 leading-tight">
                            Tender Drafting Hub
                        </h1>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate("/dashboard/validator")}
                        className="h-10 px-5 rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 font-medium transition-all flex gap-2 justify-center"
                    >
                        <FileStack className="h-4 w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">Upload & Validate</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-10 px-5 rounded-lg border-slate-200 font-medium hover:bg-slate-50 transition-all flex gap-2 justify-center"
                    >
                        <Save className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="whitespace-nowrap">Save Draft</span>
                    </Button>
                </div>
            </div>

            <div className="mt-8">
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-2xl mb-6">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                            {targetPlatform.replace('_', ' ').toUpperCase()} Specialized Workflow Active
                        </p>
                        <p className="text-xs text-blue-700/80">
                            This environment is auto-optimized for {targetPlatform.replace('_', ' ').toUpperCase()} portal compliance and GFR 2017 norms.
                        </p>
                    </div>
                </div>
                <GemTenderWizard portal={targetPlatform} />
            </div>
            {false && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <div className="overflow-x-auto pb-2 scrollbar-hide">
                        <TabsList className="flex w-max sm:w-full min-w-full sm:grid sm:grid-cols-6 h-12 bg-muted/50 p-1">
                            <TabsTrigger value="identification" className="text-sm">1. Identification</TabsTrigger>
                            <TabsTrigger value="location" className="text-sm">2. Location</TabsTrigger>
                            <TabsTrigger value="financials" className="text-sm">3. Financials</TabsTrigger>
                            <TabsTrigger value="technical" className="text-sm">4. Work & Specs</TabsTrigger>
                            <TabsTrigger value="schedules" className="text-sm">5. Schedules</TabsTrigger>
                            <TabsTrigger value="review" className="text-sm">6. Review</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="identification">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Basic Tender Details
                                </CardTitle>
                                <CardDescription>Enter the core details for {targetPlatform.replace('_', ' ').toUpperCase()}.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Tender ID (Auto-Generated)</Label>
                                    <Input value={bidId} readOnly className="bg-muted font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Project / Work Title</Label>
                                    <Input placeholder="e.g., Construction of Community Hall..." value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <Select value={department} onValueChange={setDepartment}>
                                        <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {ANDHRA_PRADESH_DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tender Type</Label>
                                    <Select value={tenderType} onValueChange={(v: any) => setTenderType(v)}>
                                        <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Open">Open Tender</SelectItem>
                                            <SelectItem value="Limited">Limited Tender</SelectItem>
                                            <SelectItem value="Nomination">Nomination</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end">
                                <Button onClick={() => setActiveTab("location")}>Next Step <ArrowRight className="ml-2 h-4 w-4" /></Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="location">
                        <Card>
                            <CardHeader>
                                <CardTitle>Location & Sector Details</CardTitle>
                                <CardDescription>Where will this be executed?</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>State</Label>
                                    <Select value={state} onValueChange={setState}>
                                        <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                                        <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>District</Label>
                                    <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Enter District" />
                                </div>
                            </CardContent>
                            <CardFooter className="justify-between">
                                <Button variant="ghost" onClick={() => setActiveTab("identification")}>Back</Button>
                                <Button onClick={() => setActiveTab("financials")}>Next Step <ArrowRight className="ml-2 h-4 w-4" /></Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="financials">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Financial Parameters</CardTitle>
                                    <CardDescription>EMD, PBG and GST details.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Estimated Contract Value (₹)</Label>
                                        <Input type="number" value={benchmarkValue} onChange={(e) => setBenchmarkValue(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>EMD Amount (₹)</Label>
                                        <Input type="number" value={emd} onChange={(e) => setEmd(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Performance Bank Guarantee (%)</Label>
                                        <Input type="number" value={pbg} onChange={(e) => setPbg(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contract Duration (Months)</Label>
                                        <Input type="number" value={contractDuration} onChange={(e) => setContractDuration(e.target.value)} />
                                    </div>

                                    {(targetPlatform === "cppp" || targetPlatform === "gem") && (
                                        <div className="col-span-2 grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                                            <div className="space-y-2">
                                                <Label>Tender Fee</Label>
                                                <Input type="number" value={tenderFee} onChange={(e) => setTenderFee(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>EMD Exemption Allowed</Label>
                                                <Select value={emdExemptionAllowed} onValueChange={setEmdExemptionAllowed}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}

                                    {targetPlatform === "ireps" && (
                                        <div className="col-span-2 space-y-2 mt-4 pt-4 border-t">
                                            <Label>Advertised Value</Label>
                                            <Input value={advertisedValue} onChange={(e) => setAdvertisedValue(e.target.value)} />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>Bank Details</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>IFSC Code</Label>
                                        <Input value={ifscCode} onChange={(e) => setIfscCode(e.target.value.toUpperCase())} maxLength={11} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bank Name</Label>
                                        <Input value={bankName} readOnly className="bg-muted" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Account Number</Label>
                                        <Input type="password" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-3">
                                <CardHeader><CardTitle>GST Details</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label>GST Applicable?</Label>
                                        <Select value={gstApplicable} onValueChange={(v: any) => setGstApplicable(v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    {gstApplicable === "yes" && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>GSTIN</Label>
                                                <Input value={gstin} onChange={(e) => setGstin(e.target.value)} />
                                            </div>
                                            <div className="col-span-3 grid grid-cols-3 gap-4 border p-4 rounded-lg bg-muted/20">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox checked={isInterState} onCheckedChange={(c) => setIsInterState(!!c)} />
                                                    <Label>Inter-State (IGST)</Label>
                                                </div>
                                                {isInterState ? (
                                                    <div className="space-y-2 col-span-2"><Label>IGST %</Label><Input type="number" value={igst} onChange={(e) => setIgst(e.target.value)} /></div>
                                                ) : (
                                                    <>
                                                        <div className="space-y-2"><Label>CGST %</Label><Input type="number" value={cgst} onChange={(e) => setCgst(e.target.value)} /></div>
                                                        <div className="space-y-2"><Label>SGST %</Label><Input type="number" value={sgst} onChange={(e) => setSgst(e.target.value)} /></div>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        <CardFooter className="justify-between mt-6">
                            <Button variant="ghost" onClick={() => setActiveTab("location")}>Back</Button>
                            <Button onClick={() => setActiveTab("technical")}>Work Specs <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </CardFooter>
                    </TabsContent>

                    <TabsContent value="technical">
                        <Card>
                            <CardHeader><CardTitle>Work & Specifications</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Bill of Quantities (BOQ) Summary</Label>
                                    <Textarea
                                        className="min-h-[150px]"
                                        placeholder="Describe the items, quantities, and specifications..."
                                        value={boqDetails}
                                        onChange={(e) => setBoqDetails(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Applicable Govt Norms / G.O.</Label>
                                    <Input value={govtNorms} onChange={(e) => setGovtNorms(e.target.value)} placeholder="e.g. G.O. Ms No. 42 Finance Dept" />
                                </div>
                            </CardContent>
                            <CardFooter className="justify-between">
                                <Button variant="ghost" onClick={() => setActiveTab("technical")}>Back</Button>
                                <Button onClick={() => setActiveTab("review")}>Final Review <ArrowRight className="ml-2 h-4 w-4" /></Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="review">
                        <div className="flex flex-col gap-6">
                            <Alert className="bg-primary/10 border-primary/20">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <AlertDescription className="text-primary font-medium">Ready for generation!</AlertDescription>
                            </Alert>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <span className="text-muted-foreground">Bid ID:</span>
                                            <span className="font-mono font-medium">{bidId}</span>
                                            <span className="text-muted-foreground">Value:</span>
                                            <span className="font-medium">₹ {benchmarkValue || '0.00'}</span>
                                            <span className="text-muted-foreground">GST:</span>
                                            <span className="font-medium">{totalGstPercent}%</span>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="p-6 flex flex-col items-center justify-center space-y-4">
                                    <ExternalLink className="h-12 w-12 text-muted-foreground/20" />
                                    <h3 className="text-lg font-semibold uppercase italic font-black text-center">Export NIT Document</h3>
                                    <div className="flex flex-col gap-3 w-full">
                                        <div className="flex gap-4 w-full">
                                            <Button className="flex-1 rounded-xl h-12" onClick={() => handleDownload('pdf')} disabled={drafting}>
                                                {drafting ? <Loader2 className="animate-spin" /> : <Download className="mr-2" />} PDF
                                            </Button>
                                            <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => handleDownload('docx')} disabled={drafting}>Word</Button>
                                        </div>
                                        <Button className="w-full bg-gov-blue hover:bg-gov-blue-dark h-12 rounded-xl text-white font-black italic uppercase shadow-lg shadow-gov-blue/20" onClick={handlePublish} disabled={drafting}>
                                            <BrainCircuit className="mr-2 h-5 w-5" />
                                            Verify AI Compliance & Publish
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default Draft;
