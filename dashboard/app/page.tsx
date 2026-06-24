"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DEMO_SITE_A_URL, TRACKER_API_ENDPOINT } from "../src/lib/demoUrls";

export default function LandingPage() {
  const [activeInstallTab, setActiveInstallTab] = useState<"local" | "cdn">("local");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string>("trk_demoA_9f8k2");

  const localInstallCode = `<!-- 1. Define your unique tracking ID -->
<script>
  window.__TRACKER_ID = "${trackingId}";
</script>

<!-- 2. Load the zero-dependency tracker script -->
<script src="http://localhost:3001/tracker.js"></script>`;

  const cdnInstallCode = `<!-- 1. Define ID and API endpoint override -->
<script>
  window.__TRACKER_ID = "${trackingId}";
  // Required when API backend is not running on localhost:
  window.__TRACKER_ENDPOINT = "${TRACKER_API_ENDPOINT}";
</script>

<!-- 2. Load script via global jsDelivr CDN -->
<script src="https://cdn.jsdelivr.net/gh/vky5/trackker@main/tracker.js"></script>`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  const handleTestClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(DEMO_SITE_A_URL, "_blank");
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-[#07080d] text-slate-200 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col relative overflow-hidden">
      
      {/* Background Neon Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full bg-violet-600/5 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-4.5 border-b border-slate-800/40 bg-[#0a0c14]/75 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-550/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-extrabold text-white font-mono tracking-tight flex items-center gap-1.5">
              TRACKKER
              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 rounded-full font-sans uppercase">v0.1.0</span>
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-350">
          <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
          <a href="#installation" className="hover:text-indigo-400 transition-colors">Installation</a>
          <a href="#demos" className="hover:text-indigo-400 transition-colors">Demo Sites</a>
          <a href="https://github.com/vky5/trackker" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
            GitHub
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 border border-indigo-500/30 transition-all duration-300 hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
          >
            LAUNCH DASHBOARD
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-24 pb-20 max-w-6xl mx-auto px-6 z-10">

        {/* Hero Section */}
        <section className="pt-20 md:pt-28 text-center space-y-8 max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-wider uppercase font-mono shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
            Real-time Telemetry & Session Replays
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
            Understand every scroll, view, and click.
          </h1>

          <p className="text-base md:text-lg text-slate-350 font-normal leading-relaxed max-w-2xl mx-auto">
            Trackker is a full-stack user analytics and telemetry platform. Capture high-fidelity user actions with a zero-dependency SDK and visualize journeys via beautiful timelines, click overlays, and frame-perfect iframe replays.
          </p>

          <div className="flex flex-col items-center gap-5 pt-4">
            {/* Primary/Secondary CTA Actions */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-indigo-650/20 border border-indigo-500/40 hover:border-indigo-400/50 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
              >
                LAUNCH DASHBOARD
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>

              <button
                onClick={handleTestClick}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0c0e18]/80 hover:bg-slate-900/90 text-indigo-400 hover:text-indigo-300 font-bold text-sm border border-indigo-500/25 hover:border-indigo-500/55 shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                TEST WITH DEMO SITE
              </button>
            </div>

            {/* SDK Helpers: Generate Tracker ID & Download */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-1 w-full justify-center">
              <button
                onClick={() => {
                  const rand = Math.random().toString(36).substring(2, 8);
                  const newId = `trk_user_${rand}`;
                  setTrackingId(newId);
                  setCopiedText("id_generated");
                  setTimeout(() => setCopiedText(null), 2500);
                }}
                className="w-full sm:w-auto px-5.5 py-2.5 rounded-xl bg-slate-900 hover:bg-[#121624] text-slate-300 hover:text-white font-bold text-xs border border-slate-800 hover:border-slate-700 shadow-md transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer font-mono"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {copiedText === "id_generated" ? (
                  <span className="text-emerald-450 font-extrabold animate-pulse">GENERATED: {trackingId}</span>
                ) : (
                  <span>GENERATE TRACKING ID</span>
                )}
              </button>

              <a
                href="/tracker.js"
                download="tracker.js"
                className="w-full sm:w-auto px-5.5 py-2.5 rounded-xl bg-slate-900 hover:bg-[#121624] text-slate-300 hover:text-white font-bold text-xs border border-slate-800 hover:border-slate-700 shadow-md transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                DOWNLOAD SDK
              </a>
            </div>

            {/* Injected feedback hint */}
            {trackingId !== "trk_demoA_9f8k2" && (
              <p className="text-[10px] text-emerald-400 font-mono tracking-tight animate-pulse bg-emerald-500/5 border border-emerald-500/10 px-3 py-1 rounded-full">
                Tracking ID <span className="font-extrabold select-all text-white">{trackingId}</span> has been injected into the code blocks below!
              </p>
            )}
          </div>
        </section>

        {/* Core Capabilities */}
        <section id="features" className="space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-wider">ENGINE CAPABILITIES</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Full-Stack Scoped Analytics</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">Trackker is built for speed, client-side safety, and visual-first interaction analysis.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Page Views */}
            <div className="p-6 bg-[#0a0c14]/50 border border-slate-800/40 rounded-2xl space-y-4 hover:border-indigo-500/20 hover:bg-[#0c0f1d]/60 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-450 group-hover:scale-105 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">Page Views</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Auto-tracks landing loads, SPA history changes (`pushState`/`replaceState`), and popstate back/forward transitions seamlessly.
              </p>
            </div>

            {/* Click Telemetry */}
            <div className="p-6 bg-[#0a0c14]/50 border border-slate-800/40 rounded-2xl space-y-4 hover:border-indigo-500/20 hover:bg-[#0c0f1d]/60 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-450 group-hover:scale-105 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">Clicks & selectors</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Captures element tagNames, text nodes, IDs, custom CSS class list arrays, coordinates, and builds a strict DOM-tree CSS selector hierarchy.
              </p>
            </div>

            {/* Scroll Debounce */}
            <div className="p-6 bg-[#0a0c14]/50 border border-slate-800/40 rounded-2xl space-y-4 hover:border-indigo-500/20 hover:bg-[#0c0f1d]/60 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-455 group-hover:scale-105 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">Scroll Tracking</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Tracks user scroll depth via a 1s debounced worker to keep network payloads clean, while keeping frame-perfect real-time postMessage loops active for previews.
              </p>
            </div>

            {/* Frame-Perfect Replay */}
            <div className="p-6 bg-[#0a0c14]/50 border border-slate-800/40 rounded-2xl space-y-4 hover:border-indigo-500/20 hover:bg-[#0c0f1d]/60 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-455 group-hover:scale-105 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">Session Replay</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Relays events back inside a desktop-scale centered sandbox iframe, with smooth scrolling commands, cursor movement synchronization, and pulsing click-ripple animations.
              </p>
            </div>

          </div>
        </section>

        {/* Installation Guide Section */}
        <section id="installation" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start scroll-mt-24">
          
          {/* Left Text Column */}
          <div className="lg:col-span-5 space-y-6 pt-4">
            <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-wider">GETTING STARTED</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Drop-in Integration</h2>
            
            <div className="space-y-4 text-slate-355 text-sm leading-relaxed">
              <p>
                To install Trackker on your web pages, define your unique website key via <code className="text-indigo-300 font-mono text-xs bg-[#121624] px-1 py-0.5 rounded border border-slate-800/40">window.__TRACKER_ID</code>, then inject the script.
              </p>
              <p>
                The script auto-initializes on page load and isolates storage to prevent telemetry pollution or session collisions across sites on the same origin.
              </p>
            </div>

            <div className="p-4.5 bg-[#0a0c14]/40 border border-slate-800/40 rounded-2xl flex items-start gap-3.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-slate-400 space-y-1 font-sans">
                <span className="font-bold text-slate-200 block">Default API server:</span>
                <p>Events are automatically dispatched to <code className="text-slate-300 font-mono bg-[#121624] px-1 py-0.5 rounded border border-slate-800/40">http://localhost:3000/api/events</code> unless overridden using <code className="text-slate-300 font-mono bg-[#121624] px-1 py-0.5 rounded border border-slate-800/40">window.__TRACKER_ENDPOINT</code>.</p>
              </div>
            </div>
          </div>

          {/* Right Code Column */}
          <div className="lg:col-span-7 bg-[#0b0d16] border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl">
            
            {/* Tabs */}
            <div className="flex items-center justify-between px-4.5 py-3 border-b border-slate-800/60 bg-[#0e111d]">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveInstallTab("local")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase transition-all cursor-pointer ${
                    activeInstallTab === "local"
                      ? "bg-slate-900 text-indigo-400 border border-slate-800"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Local SDK
                </button>
                <button
                  onClick={() => setActiveInstallTab("cdn")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase transition-all cursor-pointer ${
                    activeInstallTab === "cdn"
                      ? "bg-slate-900 text-indigo-400 border border-slate-800"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Global CDN
                </button>
              </div>

              <button
                onClick={() =>
                  copyToClipboard(
                    activeInstallTab === "local" ? localInstallCode : cdnInstallCode,
                    activeInstallTab
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-[#121624] border border-slate-800 text-[10px] font-bold font-mono uppercase text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                {copiedText === activeInstallTab ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    COPIED!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    COPY_CODE
                  </>
                )}
              </button>
            </div>

            {/* Code Content */}
            <div className="p-5 font-mono text-[11px] text-slate-300 bg-[#0a0c14] overflow-x-auto select-all leading-relaxed whitespace-pre min-h-[160px]">
              {activeInstallTab === "local" ? localInstallCode : cdnInstallCode}
            </div>

            {/* Info Footer */}
            <div className="px-5 py-3.5 bg-[#0c0e18] border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>format: HTML5 Script tag</span>
              <span>size: 8.6 KB (IIFE)</span>
            </div>
          </div>
        </section>

        {/* Live Demo Site Quick-Links */}
        <section id="demos" className="space-y-10 scroll-mt-24">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-wider">LIVE TELEMETRY LAB</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Preconfigured Demo Site</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">We've set up a sandbox environment with a preconfigured tracking profile to test out the scripts instantly.</p>
          </div>

          <div className="max-w-xl mx-auto">
            
            {/* Site A */}
            <div className="p-6 bg-[#0a0c14]/40 border border-slate-800/45 rounded-2xl flex flex-col justify-between hover:border-slate-700/60 transition-all duration-300 relative overflow-hidden group">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded uppercase font-mono">SaaS Landing Page</span>
                  <span className="text-[10px] text-slate-500 font-mono">GitHub Pages</span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 font-mono">Demo Site — Flowdesk</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  A software landing page configuration capturing user actions scoped by ID <code className="text-slate-350 bg-[#121624] px-1 py-0.5 rounded border border-slate-800/40 font-mono text-[10.5px]">trk_demoA_9f8k2</code>.
                </p>
                <div className="pt-2 flex flex-col gap-1.5 font-mono text-[10px] text-slate-500">
                  <div>Scope Key: <span className="text-slate-300 font-bold select-all">trk_demoA_9f8k2</span></div>
                  <div>Endpoint: <span className="text-slate-300 select-all">{DEMO_SITE_A_URL}</span></div>
                </div>
              </div>

              <div className="pt-6">
                <a
                  href={DEMO_SITE_A_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer w-full group-hover:bg-[#121624]"
                >
                  VISIT FLOWDESK DEMO
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-800/40 bg-[#0a0c14]/40 mt-auto text-center text-xs text-slate-500 font-mono z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} Trackker Analytics Engine. Built for CausalFunnel.</span>
          <div className="flex gap-4">
            <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">Console</Link>
            <span>&bull;</span>
            <a href="https://github.com/vky5/trackker" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">GitHub Repo</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
