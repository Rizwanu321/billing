// components/ai/AIAssistant.jsx - Main AI Dashboard
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
    Sparkles,
    TrendingUp,
    Users,
    MessageSquare,
    Send,
    Loader2,
    BarChart3,
    AlertTriangle,
    Crown,
    UserPlus,
    IndianRupee,
    RefreshCw,
    Lightbulb,
    ChevronRight,
    Star,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { getSalesPredictions, getCustomerInsights, sendAIQuery } from "../../api/ai";
import { toast } from "react-hot-toast";

const AIAssistant = () => {
    const location = useLocation();

    // Determine initial tab based on URL
    const getInitialTab = () => {
        if (location.pathname.includes("/ai/insights")) return "insights";
        if (location.pathname.includes("/ai/chat")) return "chat";
        return "predictions";
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());
    const [loading, setLoading] = useState(false);
    const [predictions, setPredictions] = useState(null);
    const [customerInsights, setCustomerInsights] = useState(null);
    const [query, setQuery] = useState("");
    const [queryResult, setQueryResult] = useState(null);
    const [queryLoading, setQueryLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const chatEndRef = useRef(null);

    // Update tab when URL changes
    useEffect(() => {
        setActiveTab(getInitialTab());
    }, [location.pathname]);

    useEffect(() => {
        if (activeTab === "predictions" && !predictions) {
            loadPredictions();
        } else if (activeTab === "insights" && !customerInsights) {
            loadCustomerInsights();
        }
    }, [activeTab]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const loadPredictions = async () => {
        try {
            setLoading(true);
            const response = await getSalesPredictions();
            if (response.success) {
                setPredictions(response.data);
            }
        } catch (error) {
            toast.error("Failed to load predictions");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadCustomerInsights = async () => {
        try {
            setLoading(true);
            const response = await getCustomerInsights();
            if (response.success) {
                setCustomerInsights(response.data);
            }
        } catch (error) {
            toast.error("Failed to load customer insights");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuery = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMessage = query;
        setQuery("");
        setChatHistory((prev) => [...prev, { type: "user", content: userMessage }]);
        setQueryLoading(true);

        try {
            const response = await sendAIQuery(userMessage);
            if (response.success) {
                setChatHistory((prev) => [...prev, { type: "ai", content: response.data }]);
            }
        } catch (error) {
            setChatHistory((prev) => [
                ...prev,
                { type: "ai", content: { type: "error", message: "Sorry, I couldn't process that query." } },
            ]);
        } finally {
            setQueryLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
    };

    const tabs = [
        { id: "predictions", label: "Sales Predictions", icon: TrendingUp },
        { id: "insights", label: "Customer Insights", icon: Users },
        { id: "chat", label: "Ask AI", icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                            <Sparkles className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                AI Assistant
                            </h1>
                            <p className="text-sm text-gray-500">
                                Smart insights & predictions for your business
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setPredictions(null);
                            setCustomerInsights(null);
                            if (activeTab === "predictions") loadPredictions();
                            else if (activeTab === "insights") loadCustomerInsights();
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh Data
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                    <div className="flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
                            <p className="text-gray-500">Analyzing your data...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === "predictions" && (
                                <SalesPredictionsTab data={predictions} onRefresh={loadPredictions} />
                            )}
                            {activeTab === "insights" && (
                                <CustomerInsightsTab data={customerInsights} onRefresh={loadCustomerInsights} />
                            )}
                            {activeTab === "chat" && (
                                <ChatTab
                                    chatHistory={chatHistory}
                                    query={query}
                                    setQuery={setQuery}
                                    onSubmit={handleQuery}
                                    loading={queryLoading}
                                    onSuggestionClick={handleSuggestionClick}
                                    chatEndRef={chatEndRef}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Sales Predictions Tab
const SalesPredictionsTab = ({ data, onRefresh }) => {
    if (!data) {
        return (
            <div className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No prediction data available</p>
                <button
                    onClick={onRefresh}
                    className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                >
                    Load Predictions
                </button>
            </div>
        );
    }

    const { predictions, summary, insights, topProducts, historicalData } = data;

    return (
        <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">Avg Daily Revenue</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                        ₹{summary.avgDailyRevenue.toLocaleString("en-IN")}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                    <p className="text-sm text-green-600 font-medium">Predicted Next Week</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                        ₹{summary.predictedNextWeek.toLocaleString("en-IN")}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium">Trend</p>
                    <div className="flex items-center gap-2 mt-1">
                        {summary.trendDirection === "increasing" ? (
                            <ArrowUpRight className="h-5 w-5 text-green-600" />
                        ) : summary.trendDirection === "decreasing" ? (
                            <ArrowDownRight className="h-5 w-5 text-red-600" />
                        ) : null}
                        <p className="text-2xl font-bold text-purple-900 capitalize">
                            {summary.trendDirection}
                        </p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
                    <p className="text-sm text-amber-600 font-medium">Data Points</p>
                    <p className="text-2xl font-bold text-amber-900 mt-1">{summary.dataPoints} days</p>
                </div>
            </div>

            {/* 7-Day Forecast */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    7-Day Sales Forecast
                </h3>
                <div className="grid grid-cols-7 gap-2">
                    {predictions.map((pred, index) => (
                        <div
                            key={pred.date}
                            className="bg-white rounded-lg p-3 text-center border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all"
                        >
                            <p className="text-xs font-medium text-gray-500">{pred.dayName}</p>
                            <p className="text-lg font-bold text-gray-900 mt-1">
                                ₹{Math.round(pred.predicted).toLocaleString("en-IN")}
                            </p>
                            <div className="mt-2 flex items-center justify-center gap-1">
                                <div
                                    className="h-1.5 rounded-full bg-purple-200"
                                    style={{ width: `${pred.confidence}%` }}
                                >
                                    <div
                                        className="h-full rounded-full bg-purple-600"
                                        style={{ width: `${pred.confidence}%` }}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{pred.confidence}%</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Products & Insights Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        Top Selling Products
                    </h3>
                    <div className="space-y-3">
                        {topProducts.map((product, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <span className="font-medium text-gray-900">{product.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">
                                        ₹{product.revenue.toLocaleString("en-IN")}
                                    </p>
                                    <p className="text-xs text-gray-500">{product.quantity} sold</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Insights */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        AI Insights
                    </h3>
                    <div className="space-y-3">
                        {insights.map((insight, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border ${insight.type === "positive"
                                    ? "bg-green-50 border-green-200"
                                    : insight.type === "warning"
                                        ? "bg-amber-50 border-amber-200"
                                        : "bg-blue-50 border-blue-200"
                                    }`}
                            >
                                <h4
                                    className={`font-semibold ${insight.type === "positive"
                                        ? "text-green-800"
                                        : insight.type === "warning"
                                            ? "text-amber-800"
                                            : "text-blue-800"
                                        }`}
                                >
                                    {insight.title}
                                </h4>
                                <p
                                    className={`text-sm mt-1 ${insight.type === "positive"
                                        ? "text-green-700"
                                        : insight.type === "warning"
                                            ? "text-amber-700"
                                            : "text-blue-700"
                                        }`}
                                >
                                    {insight.message}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Customer Insights Tab
const CustomerInsightsTab = ({ data, onRefresh }) => {
    if (!data) {
        return (
            <div className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No customer insights available</p>
                <button
                    onClick={onRefresh}
                    className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                >
                    Load Insights
                </button>
            </div>
        );
    }

    const { segmentCounts, vipCustomers, atRiskCustomers, highDueCustomers, insights, summary } = data;

    return (
        <div className="p-6 space-y-6">
            {/* Segment Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-5 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-5 w-5 text-amber-600" />
                        <p className="text-sm text-amber-600 font-medium">VIP</p>
                    </div>
                    <p className="text-3xl font-bold text-amber-900">{segmentCounts.vip}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <p className="text-sm text-blue-600 font-medium">Regular</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">{segmentCounts.regular}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                        <UserPlus className="h-5 w-5 text-green-600" />
                        <p className="text-sm text-green-600 font-medium">New</p>
                    </div>
                    <p className="text-3xl font-bold text-green-900">{segmentCounts.new}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <p className="text-sm text-red-600 font-medium">At Risk</p>
                    </div>
                    <p className="text-3xl font-bold text-red-900">{summary.churnRisk}</p>
                </div>
            </div>

            {/* AI Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {insights.map((insight, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-xl border ${insight.type === "positive"
                            ? "bg-green-50 border-green-200"
                            : insight.type === "warning"
                                ? "bg-amber-50 border-amber-200"
                                : insight.type === "danger"
                                    ? "bg-red-50 border-red-200"
                                    : "bg-blue-50 border-blue-200"
                            }`}
                    >
                        <h4
                            className={`font-semibold text-sm ${insight.type === "positive"
                                ? "text-green-800"
                                : insight.type === "warning"
                                    ? "text-amber-800"
                                    : insight.type === "danger"
                                        ? "text-red-800"
                                        : "text-blue-800"
                                }`}
                        >
                            {insight.title}
                        </h4>
                        <p
                            className={`text-xs mt-1 ${insight.type === "positive"
                                ? "text-green-700"
                                : insight.type === "warning"
                                    ? "text-amber-700"
                                    : insight.type === "danger"
                                        ? "text-red-700"
                                        : "text-blue-700"
                                }`}
                        >
                            {insight.message}
                        </p>
                    </div>
                ))}
            </div>

            {/* Customer Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* VIP Customers */}
                <CustomerList
                    title="VIP Customers"
                    icon={Crown}
                    iconColor="text-amber-500"
                    customers={vipCustomers}
                    emptyMessage="No VIP customers yet"
                />

                {/* At-Risk Customers */}
                <CustomerList
                    title="At-Risk Customers"
                    icon={AlertTriangle}
                    iconColor="text-red-500"
                    customers={atRiskCustomers}
                    emptyMessage="No at-risk customers"
                    showDaysSince
                />

                {/* High Due Customers */}
                <CustomerList
                    title="High Dues"
                    icon={IndianRupee}
                    iconColor="text-orange-500"
                    customers={highDueCustomers}
                    emptyMessage="No pending dues"
                    showDue
                />
            </div>
        </div>
    );
};

const CustomerList = ({ title, icon: Icon, iconColor, customers, emptyMessage, showDaysSince, showDue }) => (
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            {title}
        </h3>
        {customers && customers.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {customers.slice(0, 5).map((customer) => (
                    <div
                        key={customer._id}
                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
                    >
                        <div>
                            <p className="font-medium text-gray-900 text-sm">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.place}</p>
                        </div>
                        <div className="text-right">
                            {showDue && (
                                <p className="font-semibold text-red-600 text-sm">
                                    ₹{customer.amountDue.toLocaleString("en-IN")}
                                </p>
                            )}
                            {showDaysSince && customer.daysSinceLastPurchase && (
                                <p className="text-xs text-gray-500">
                                    {customer.daysSinceLastPurchase} days ago
                                </p>
                            )}
                            {!showDue && !showDaysSince && (
                                <p className="font-semibold text-gray-900 text-sm">
                                    ₹{customer.totalSpent.toLocaleString("en-IN")}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-gray-400 text-sm text-center py-4">{emptyMessage}</p>
        )}
    </div>
);

// Chat Tab (Natural Language Query)
const ChatTab = ({ chatHistory, query, setQuery, onSubmit, loading, onSuggestionClick, chatEndRef }) => {
    const suggestions = [
        "What are my top 5 selling products?",
        "Show me revenue for this month",
        "Which customers have dues over 5000?",
        "What products are low on stock?",
        "Show my recent invoices",
        "How many customers do I have?",
    ];

    return (
        <div className="flex flex-col h-[600px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="p-4 bg-purple-100 rounded-full mb-4">
                            <MessageSquare className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ask me anything!</h3>
                        <p className="text-gray-500 text-sm max-w-md mb-6">
                            I can help you with sales data, customer information, stock levels, and more.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => onSuggestionClick(suggestion)}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {chatHistory.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] ${message.type === "user"
                                        ? "bg-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3"
                                        : "bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3"
                                        }`}
                                >
                                    {message.type === "user" ? (
                                        <p>{message.content}</p>
                                    ) : (
                                        <AIResponse data={message.content} />
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                                        <span className="text-gray-600">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
                <form onSubmit={onSubmit} className="flex gap-3">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask about your business data..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

// AI Response Renderer
const AIResponse = ({ data }) => {
    if (!data) return null;

    if (data.type === "error") {
        return <p className="text-red-600">{data.message}</p>;
    }

    if (data.type === "help") {
        return (
            <div>
                <p className="font-medium text-gray-900 mb-2">{data.title}</p>
                <p className="text-gray-600 text-sm mb-3">{data.summary}</p>
                <div className="space-y-1">
                    {data.suggestions.map((s, i) => (
                        <p key={i} className="text-sm text-purple-600">• {s}</p>
                    ))}
                </div>
            </div>
        );
    }

    if (data.type === "stats") {
        return (
            <div>
                <p className="font-medium text-gray-900 mb-2">{data.title}</p>
                <p className="text-gray-600 text-sm mb-3">{data.summary}</p>
                <div className="grid grid-cols-2 gap-2">
                    {data.stats.map((stat, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border border-gray-200">
                            <p className="text-xs text-gray-500">{stat.label}</p>
                            <p className="font-semibold text-gray-900">{stat.value}</p>
                        </div>
                    ))}
                </div>
                {data.note && <p className="text-xs text-gray-500 mt-2">{data.note}</p>}
            </div>
        );
    }

    if (data.type === "table") {
        return (
            <div>
                <p className="font-medium text-gray-900 mb-2">{data.title}</p>
                <p className="text-gray-600 text-sm mb-3">{data.summary}</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                {data.columns.map((col, i) => (
                                    <th key={i} className="text-left py-2 font-medium text-gray-600">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.data.map((row, i) => (
                                <tr key={i} className="border-b border-gray-100">
                                    {row.map((cell, j) => (
                                        <td key={j} className="py-2 text-gray-800">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data.total && (
                    <p className="text-sm font-medium text-gray-900 mt-3">{data.total}</p>
                )}
            </div>
        );
    }

    return <p className="text-gray-800">{JSON.stringify(data)}</p>;
};

export default AIAssistant;
