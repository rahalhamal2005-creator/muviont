"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, RefreshCw, Activity, Database, Sparkles, TrendingUp, Clock, Search, Eye } from "lucide-react";
import Navbar from "@/components/cinematic/Navbar";

export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/monitoring");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to load metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Enforce RBAC Role authorization via backend session check
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          const user = data.user;
          if (user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
            setAuthorized(true);
            fetchMetrics();
            return;
          }
        }
        setAuthorized(false);
      } catch (err) {
        console.error("Failed to load user session:", err);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [refreshCount]);

  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  if (authorized === false) {
    return (
      <div className="bg-black min-h-screen text-white flex flex-col items-center justify-center p-6 text-center">
        <Shield className="w-16 h-16 text-red-650 mb-4 animate-pulse" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Access Restricted</h1>
        <p className="text-xs text-neutral-500 mt-2 max-w-sm">
          You do not have the required Role authorization level (ADMIN or SUPER_ADMIN) to view MUVIONT telemetry diagnostics.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-750 text-xs font-bold transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-28">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-neutral-900 pb-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center gap-2">
              <Shield className="w-8 h-8 text-red-500" />
              Admin Platform Diagnostics
            </h1>
            <p className="text-xs text-neutral-400 mt-2">Monitor news providers, API latencies, AI search ratios, and cache health.</p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Metrics
          </button>
        </div>

        {/* Dashboard grid */}
        {metrics && (
          <div className="space-y-8">
            
            {/* Top Cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Active News Provider */}
              <div className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/40 space-y-2">
                <p className="text-[10px] uppercase text-neutral-500 font-bold">Active News Provider</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-red-500">
                    {metrics.providerStats?.GDELT?.uptime > 0 ? "GDELT (Primary)" : "NewsAPI (Fallback)"}
                  </span>
                  <Database className="w-5 h-5 text-neutral-500" />
                </div>
                <p className="text-[10px] text-neutral-400">Automatic failover sequence active.</p>
              </div>

              {/* Cache Hit Ratio */}
              <div className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/40 space-y-2">
                <p className="text-[10px] uppercase text-neutral-500 font-bold">Cache Hit Ratio</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-white">
                    {metrics.cacheHitRatio}%
                  </span>
                  <Activity className="w-5 h-5 text-neutral-500" />
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${metrics.cacheHitRatio}%` }} />
                </div>
              </div>

              {/* Total Searches */}
              <div className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/40 space-y-2">
                <p className="text-[10px] uppercase text-neutral-500 font-bold">Search Volume (24h)</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-white">
                    {metrics.searchStats?.total || 0}
                  </span>
                  <TrendingUp className="w-5 h-5 text-neutral-500" />
                </div>
                <p className="text-[10px] text-neutral-400">Queries logged in database.</p>
              </div>

              {/* AI Search Ratio */}
              <div className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/40 space-y-2">
                <p className="text-[10px] uppercase text-neutral-500 font-bold">AI Search Ratio</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-white">
                    {metrics.searchStats?.aiSearchRatio || 0}%
                  </span>
                  <Sparkles className="w-5 h-5 text-neutral-500" />
                </div>
                <p className="text-[10px] text-neutral-400">Conversational intent detected.</p>
              </div>

            </div>

            {/* Advanced Recommendation and Search Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Average Search Latency */}
              <div className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/40 space-y-2">
                <p className="text-[10px] uppercase text-neutral-500 font-bold">Average Search Latency</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-white">
                    {metrics.searchStats?.avgLatency || 0}ms
                  </span>
                  <Clock className="w-5 h-5 text-neutral-500" />
                </div>
                <p className="text-[10px] text-neutral-400">Avg search api response speed.</p>
              </div>

              {/* Recommendation Click-Through Rate */}
              <div className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/40 space-y-2">
                <p className="text-[10px] uppercase text-neutral-500 font-bold">Recommendation CTR</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-white">
                    {metrics.recommendationStats?.ctr || 0.0}%
                  </span>
                  <Sparkles className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-[10px] text-neutral-400">
                  {metrics.recommendationStats?.clicks || 0} clicks / {metrics.recommendationStats?.impressions || 0} impressions
                </p>
              </div>

              {/* Provider Usage Distribution */}
              <div className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/40 space-y-2">
                <p className="text-[10px] uppercase text-neutral-500 font-bold">Total API Actions (24h)</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-white">
                    {Object.values(metrics.providerStats || {}).reduce((acc: number, curr: any) => acc + (curr.totalRequests || 0), 0) as number}
                  </span>
                  <Database className="w-5 h-5 text-neutral-500" />
                </div>
                <p className="text-[10px] text-neutral-400">
                  {Object.entries(metrics.providerStats || {}).map(([name, stats]: [string, any]) => `${name}: ${stats.totalRequests || 0}`).join(" | ")}
                </p>
              </div>

            </div>

            {/* Top Lists Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Most Searched Titles */}
              <div className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/40">
                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4 text-red-500" />
                  Most Searched Titles (Last 24h)
                </h2>
                {metrics.searchStats?.topSearches && metrics.searchStats.topSearches.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.searchStats.topSearches.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-neutral-900/40 p-3 rounded-lg border border-neutral-800/40">
                        <span className="text-xs font-bold text-neutral-200">
                          {idx + 1}. <span className="text-white italic">"{item.query}"</span>
                        </span>
                        <span className="text-xs font-extrabold text-red-500 bg-red-950/10 px-2 py-0.5 rounded border border-red-500/20">
                          {item.count} searches
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 py-6 text-center">No search query data logged in the last 24h.</p>
                )}
              </div>

              {/* Most Viewed Content */}
              <div className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/40">
                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-red-500" />
                  Most Viewed Content (All-Time)
                </h2>
                {metrics.topContent && metrics.topContent.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.topContent.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-neutral-900/40 p-3 rounded-lg border border-neutral-800/40">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                            {idx + 1}. {item.title}
                          </span>
                          <span className="text-[9px] uppercase tracking-widest text-neutral-500 mt-0.5">
                            {item.mediaType} • ID: {item.mediaId}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {item.views} views
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 py-6 text-center">No watch history data logged.</p>
                )}
              </div>

            </div>

            {/* Provider Uptime Table */}
            <div className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/40">
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-4">
                API Provider Diagnostics
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-neutral-900 text-neutral-500">
                      <th className="pb-3 font-bold">Provider</th>
                      <th className="pb-3 font-bold">Status</th>
                      <th className="pb-3 font-bold">Uptime Rate</th>
                      <th className="pb-3 font-bold text-right">Avg Response Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(metrics.providerStats || {}).map(([pName, pStats]: [string, any]) => (
                      <tr key={pName} className="border-b border-neutral-900/60 text-white">
                        <td className="py-4 font-bold flex items-center gap-1.5">
                          {pName}
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            pStats.uptime > 0 
                              ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/20" 
                              : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                          }`}>
                            {pStats.uptime > 0 ? "ONLINE" : "STANDBY"}
                          </span>
                        </td>
                        <td className="py-4 font-medium">{pStats.uptime}%</td>
                        <td className="py-4 text-right font-bold text-red-500">
                          {pStats.avgLatency > 0 ? `${pStats.avgLatency}ms` : "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Diagnostic Failure Logs */}
            <div className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/40">
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-4">
                Diagnostic Failure Logs (24h)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
                  <span className="text-[10px] uppercase text-neutral-500 font-bold">Stream Playback Failures</span>
                  <p className="text-2xl font-bold mt-1 text-white">
                    {((metrics.providerStats?.["vidsrc-pro"]?.failedRequests || 0) +
                      (metrics.providerStats?.["vidsrc"]?.failedRequests || 0) +
                      (metrics.providerStats?.["2embed"]?.failedRequests || 0) +
                      (metrics.providerStats?.["moviesapi"]?.failedRequests || 0)) as number}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-1">Failed video stream loads.</p>
                </div>

                <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
                  <span className="text-[10px] uppercase text-neutral-500 font-bold">Episode Fetch Failures</span>
                  <p className="text-2xl font-bold mt-1 text-white">
                    {metrics.providerStats?.["TMDB_Episode"]?.failedRequests || 0}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-1">TMDB season/episode API timeouts.</p>
                </div>

                <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
                  <span className="text-[10px] uppercase text-neutral-500 font-bold">Google OAuth Failures</span>
                  <p className="text-2xl font-bold mt-1 text-white">
                    {metrics.providerStats?.["GoogleOAuth"]?.failedRequests || 0}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-1">State validation or callback token errors.</p>
                </div>
              </div>
            </div>

            {/* News Provider Health Failover diagnostics */}
            <div className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/40">
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-4">
                News Failover Diagnostic Panel
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-white">1. GDELT (Primary)</span>
                    <span className="text-[10px] font-bold text-emerald-400">ACTIVE</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Default RSS/GKG open search provider. Operates with zero API keys. Highly resilient.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-neutral-400">2. NewsAPI (Fallback 1)</span>
                    <span className="text-[10px] font-bold text-neutral-500">STANDBY</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Triggered automatically on GDELT network timeouts or empty response payloads.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-neutral-400">3. TheNewsAPI (Fallback 2)</span>
                    <span className="text-[10px] font-bold text-neutral-500">STANDBY</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Last-tier outbound failover layer. Serves as final external attempt before serving cache.
                  </p>
                </div>

              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
