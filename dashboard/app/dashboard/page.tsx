"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchSessions, fetchSessionEvents, fetchClicks, deleteSession, fetchTrackingIds, fetchTrackedPages } from "../../src/lib/api";
import { DEMO_SITE_A_URL, DEMO_SITE_B_URL } from "../../src/lib/demoUrls";

interface Session {
  session_id: string;
  event_count: number;
  first_seen: string;
  last_seen: string;
}

interface ElementInfo {
  tagName: string;
  id?: string | null;
  className?: string | null;
  text?: string | null;
  selector?: string | null;
}

interface TrackingEvent {
  trackingId: string;
  session_id: string;
  event_type: "page_view" | "click" | "scroll";
  page_url: string;
  timestamp: string;
  x?: number | null;
  y?: number | null;
  element?: ElementInfo | null;
}

interface ClickData {
  timestamp: string;
  x: number;
  y: number;
  element?: ElementInfo | null;
}

export default function Dashboard() {
  // Config & State
  const [trackingId, setTrackingId] = useState("trk_demoA_9f8k2");
  const [trackingIds, setTrackingIds] = useState<string[]>(["trk_demoA_9f8k2", "trk_demoB_5j2d7"]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadTrackingIds = async () => {
    try {
      const result = await fetchTrackingIds();
      if (result.status === "success" && result.data) {
        const ids = Array.from(new Set(["trk_demoA_9f8k2", "trk_demoB_5j2d7", ...result.data]));
        setTrackingIds(ids);
      }
    } catch (err) {
      console.error("Failed to load tracking IDs:", err);
    }
  };
  
  // Sessions & Journeys state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionEvents, setSessionEvents] = useState<TrackingEvent[]>([]);
  
  // Heatmap state
  const [heatmapUrl, setHeatmapUrl] = useState(DEMO_SITE_A_URL);
  const [clicks, setClicks] = useState<ClickData[]>([]);
  const [showIframeBackground, setShowIframeBackground] = useState(true);
  const [iframeLayout, setIframeLayout] = useState({ scrollTop: 0, scrollLeft: 0, bodyLeft: 0, bodyTop: 0 });

  // Replay state
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(-1);
  const [replayCursor, setReplayCursor] = useState<{ x: number; y: number } | null>(null);
  const [replayRipple, setReplayRipple] = useState<{ x: number; y: number } | null>(null);
  const replayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const [trackedPages, setTrackedPages] = useState<string[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [activeTab, setActiveTab] = useState<"journeys" | "heatmap">("journeys");
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
  
  // Loading & Error states
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingClicks, setLoadingClicks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast notifications state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    id: string;
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({
      message,
      type,
      id: Math.random().toString(36).substring(2, 9),
    });
  };

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);



  // Load sessions
  const loadSessionsData = async (tid: string, silent = false) => {
    if (!silent) setLoadingSessions(true);
    setError(null);
    try {
      const result = await fetchSessions(tid);
      if (result.status === "success") {
        const sessionsList = result.data || [];
        setSessions(sessionsList);
        
        if (sessionsList.length > 0) {
          let savedSessionId = null;
          if (typeof window !== "undefined") {
            savedSessionId = localStorage.getItem("telemetry_selected_session_id");
          }
          const exists = sessionsList.some((s: Session) => s.session_id === savedSessionId);
          if (exists && savedSessionId) {
            setSelectedSessionId(savedSessionId);
          } else if (!silent) {
            setSelectedSessionId(sessionsList[0].session_id);
            if (typeof window !== "undefined") {
              localStorage.setItem("telemetry_selected_session_id", sessionsList[0].session_id);
            }
          }
        } else {
          setSelectedSessionId(null);
          setSessionEvents([]);
        }
      } else {
        throw new Error(result.message || "Failed to load sessions");
      }
    } catch (err: any) {
      console.error(err);
      setError("Connection error. Make sure the backend server is running.");
    } finally {
      if (!silent) setLoadingSessions(false);
    }
  };

  // Load events
  const loadSessionEventsData = async (sid: string, tid: string, silent = false) => {
    if (!silent) setLoadingEvents(true);
    try {
      const result = await fetchSessionEvents(sid, tid);
      if (result.status === "success") {
        const events = result.data || [];
        setSessionEvents(events);
        
        // Auto-switch heatmap preview to the active session's most recent event page_url
        if (events.length > 0) {
          const lastEvent = events[events.length - 1];
          if (lastEvent && lastEvent.page_url) {
            setHeatmapUrl(lastEvent.page_url);
          }
        }
      } else {
        throw new Error(result.message || "Failed to load events");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch events for this session.");
    } finally {
      if (!silent) setLoadingEvents(false);
    }
  };

  // Load click heatmap data
  const loadHeatmapData = async (url: string, tid: string, silent = false) => {
    if (!silent) setLoadingClicks(true);
    try {
      const result = await fetchClicks(url, tid);
      if (result.status === "success") {
        setClicks(result.data || []);
      } else {
        throw new Error(result.message || "Failed to load clicks");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch heatmap data.");
    } finally {
      if (!silent) setLoadingClicks(false);
    }
  };

  // Load tracked page URLs
  const loadTrackedPagesData = async (tid: string, silent = false) => {
    if (!silent) setLoadingPages(true);
    try {
      const result = await fetchTrackedPages(tid);
      if (result.status === "success") {
        const pages = result.data || [];
        setTrackedPages(pages);

        // Auto-select the first page if current heatmapUrl is not in the list for this tracking ID
        if (pages.length > 0) {
          if (!pages.includes(heatmapUrl)) {
            setHeatmapUrl(pages[0]);
          }
        } else {
          // Fallback demo pages based on tracking ID
          const fallback = tid.includes("demoB")
            ? DEMO_SITE_B_URL
            : DEMO_SITE_A_URL;
          setHeatmapUrl(fallback);
        }
      }
    } catch (err) {
      console.error("Failed to load tracked pages:", err);
    } finally {
      if (!silent) setLoadingPages(false);
    }
  };

  const executeDeleteSession = async () => {
    if (!selectedSessionId) return;
    try {
      await deleteSession(selectedSessionId, trackingId);
      showToast("Session deleted successfully", "success");
      
      // Update local sessions state by removing the deleted session
      const updatedSessions = sessions.filter(s => s.session_id !== selectedSessionId);
      setSessions(updatedSessions);
      
      // Select next session or set to null
      if (updatedSessions.length > 0) {
        const nextSessionId = updatedSessions[0].session_id;
        setSelectedSessionId(nextSessionId);
        localStorage.setItem("telemetry_selected_session_id", nextSessionId);
      } else {
        setSelectedSessionId(null);
        localStorage.removeItem("telemetry_selected_session_id");
        setSessionEvents([]);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to delete session. Please try again.", "error");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard`, "success");
    }
  };

  const stopReplay = () => {
    setIsReplaying(false);
    setReplayIndex(-1);
    setReplayCursor(null);
    setReplayRipple(null);
    setSelectedEventIndex(null);
    if (replayTimeoutRef.current) {
      clearTimeout(replayTimeoutRef.current);
      replayTimeoutRef.current = null;
    }
  };

  const startReplay = () => {
    stopReplay();
    if (sessionEvents.length === 0) return;
    setActiveTab("heatmap");
    setIsReplaying(true);
    runReplayStep(0);
  };

  const runReplayStep = (index: number) => {
    if (index >= sessionEvents.length) {
      // Finished replaying, wait a bit then stop
      replayTimeoutRef.current = setTimeout(() => {
        stopReplay();
      }, 1500);
      return;
    }

    setReplayIndex(index);
    setSelectedEventIndex(index);
    const evt = sessionEvents[index];

    if (evt.event_type === "page_view") {
      setHeatmapUrl(evt.page_url);
      setReplayCursor(null);
      setReplayRipple(null);
      
      // Programmatically scroll the iframe back to top
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'trackker_command_scroll',
          scrollTop: 0,
          scrollLeft: 0
        }, '*');
      }

      // Wait 2 seconds for page load before next event
      replayTimeoutRef.current = setTimeout(() => {
        runReplayStep(index + 1);
      }, 2000);
    } else if (evt.event_type === "click") {
      const x = evt.x || 0;
      const y = evt.y || 0;
      
      // Auto-scroll inside the iframe to center the click
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'trackker_command_scroll',
          scrollTop: Math.max(0, y - 180), // scroll to center click
          scrollLeft: Math.max(0, x - 180)
        }, '*');
      }

      // Wait 600ms for scroll to settle, then show cursor at location
      replayTimeoutRef.current = setTimeout(() => {
        setReplayCursor({ x, y });
        
        // Trigger click ripple after cursor settles (600ms delay)
        replayTimeoutRef.current = setTimeout(() => {
          setReplayRipple({ x, y });
          
          // Clear ripple after 600ms
          setTimeout(() => setReplayRipple(null), 600);

          // Wait 1.2s before moving to next step
          replayTimeoutRef.current = setTimeout(() => {
            runReplayStep(index + 1);
          }, 1200);
        }, 600);
      }, 600);
    } else if (evt.event_type === "scroll") {
      const scrollX = evt.x || 0;
      const scrollY = evt.y || 0;
      setReplayCursor(null);
      setReplayRipple(null);

      // Command iframe to scroll
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'trackker_command_scroll',
          scrollTop: scrollY,
          scrollLeft: scrollX
        }, '*');
      }

      // Wait 1.2s for smooth scroll to finish before next event
      replayTimeoutRef.current = setTimeout(() => {
        runReplayStep(index + 1);
      }, 1200);
    }
  };

  // Clean up replay timeout on unmount
  useEffect(() => {
    return () => {
      if (replayTimeoutRef.current) {
        clearTimeout(replayTimeoutRef.current);
      }
    };
  }, []);

  // Initial load
  useEffect(() => {
    loadSessionsData(trackingId);
    loadTrackedPagesData(trackingId);
  }, [trackingId]);

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionEventsData(selectedSessionId, trackingId);
      setSelectedEventIndex(null); // Reset selected event on session switch
    }
  }, [selectedSessionId, trackingId]);

  // Load heatmap data when URL or tracking ID changes
  useEffect(() => {
    if (heatmapUrl) {
      loadHeatmapData(heatmapUrl, trackingId);
    }
  }, [heatmapUrl, trackingId]);

  // Handle cross-origin messages from the tracker script inside the iframe preview
  useEffect(() => {
    const handleIframeMessage = (e: MessageEvent) => {
      if (e.data) {
        if (e.data.type === "trackker_page_view") {
          const { url, trackingId: msgTrackingId } = e.data;
          if (msgTrackingId === trackingId) {
            setHeatmapUrl(url);
          }
        } else if (e.data.type === "trackker_iframe_scroll") {
          const { scrollTop, scrollLeft, bodyLeft, bodyTop, url } = e.data;
          if (url === heatmapUrl) {
            setIframeLayout({
              scrollTop: scrollTop || 0,
              scrollLeft: scrollLeft || 0,
              bodyLeft: bodyLeft || 0,
              bodyTop: bodyTop || 0
            });
          }
        }
      }
    };

    window.addEventListener("message", handleIframeMessage);
    return () => {
      window.removeEventListener("message", handleIframeMessage);
    };
  }, [trackingId, heatmapUrl, selectedSessionId]);

  // Reset iframe layout when heatmapUrl changes
  useEffect(() => {
    setIframeLayout({ scrollTop: 0, scrollLeft: 0, bodyLeft: 0, bodyTop: 0 });
  }, [heatmapUrl]);

  // Polling loop for real-time updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadTrackingIds();
      loadSessionsData(trackingId, true);
      loadTrackedPagesData(trackingId, true);
      if (selectedSessionId) {
        loadSessionEventsData(selectedSessionId, trackingId, true);
      }
      if (heatmapUrl) {
        loadHeatmapData(heatmapUrl, trackingId, true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [trackingId, selectedSessionId, heatmapUrl]);

  // Load persisted state from localStorage on mount (client-side only to prevent SSR hydration mismatch)
  useEffect(() => {
    loadTrackingIds();
    if (typeof window !== "undefined") {
      const savedTid = localStorage.getItem("telemetry_tracking_id");
      if (savedTid) {
        setTrackingId(savedTid);
        if (savedTid === "trk_demoB_5j2d7") {
          setHeatmapUrl(DEMO_SITE_B_URL);
        } else if (savedTid === "trk_demoA_9f8k2") {
          setHeatmapUrl(DEMO_SITE_A_URL);
        }
      }
      
      const savedSessionId = localStorage.getItem("telemetry_selected_session_id");
      if (savedSessionId) {
        setSelectedSessionId(savedSessionId);
      }
    }
  }, []);

  // Helpers
  const formatDuration = (first: string, last: string) => {
    const start = new Date(first).getTime();
    const end = new Date(last).getTime();
    const diffMs = end - start;
    if (diffMs < 0) return "0s";
    
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs === 0) return "Single hit";
    
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getRelativeTime = (current: string, start: string) => {
    const diff = new Date(current).getTime() - new Date(start).getTime();
    const secs = Math.floor(diff / 1000);
    return `+${secs}s`;
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const renderSessionsSidebar = () => (
    <section className="w-full lg:w-80 border-r border-slate-800/40 bg-[#0a0c14]/40 flex flex-col flex-shrink-0 lg:h-full lg:min-h-0">
      <div className="p-4 border-b border-slate-800/40 flex justify-between items-center bg-[#0c0e17]/25">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">active_sessions ({sessions.length})</span>
        {loadingSessions && (
          <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/20 max-h-[250px] lg:max-h-full lg:min-h-0">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            no sessions recorded
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = selectedSessionId === s.session_id;
            const formattedDate = new Date(s.first_seen).toLocaleDateString([], { month: 'short', day: 'numeric' });
            return (
              <button
                key={s.session_id}
                onClick={() => {
                  setSelectedSessionId(s.session_id);
                  localStorage.setItem("telemetry_selected_session_id", s.session_id);
                }}
                className={`w-full text-left p-4.5 hover:bg-[#121626]/30 transition-all flex flex-col gap-2 border-l-2 ${
                  isActive 
                    ? "bg-[#13182b]/80 border-l-indigo-500 shadow-[inset_0_0_12px_rgba(99,102,241,0.08)]" 
                    : "border-l-transparent hover:border-l-slate-800"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold text-sm text-slate-100 font-mono tracking-tight">
                    {s.session_id.replace("sess_", "")}
                  </span>
                  <span className="text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-900/40 px-2 py-0.5 rounded-full font-mono">
                    {s.event_count} evts
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>{formatDuration(s.first_seen, s.last_seen)}</span>
                  <span className="text-slate-500">{formattedDate} • {formatTime(s.first_seen)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );

  const renderDetailsPanel = (position: 'left' | 'right') => {
    if (!selectedEvent) return null;
    const isRight = position === 'right';
    return (
      <section className={`w-full ${isRight ? 'lg:w-[420px]' : 'lg:w-80'} ${isRight ? 'border-l' : 'border-r'} border-slate-800/40 bg-[#0c0f18] flex flex-col flex-shrink-0 lg:h-full lg:min-h-0 font-sans`}>
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-800/60 bg-[#0e111d] flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] text-slate-550 font-bold uppercase tracking-wider font-mono">
              event_inspector
            </span>
            <h3 className="text-xs font-bold text-slate-200 font-mono">
              Step {selectedEventIndex! + 1} of {sessionEvents.length}
            </h3>
          </div>
          <button
            onClick={() => {
              setSelectedEventIndex(null);
              if (isReplaying) stopReplay();
            }}
            className="p-1 rounded-md hover:bg-slate-800/50 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold font-mono"
            title={isRight ? "Close Inspector" : "Back to Sessions"}
          >
            {isRight ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                CLOSE
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                BACK
              </>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Event Type & Relative time */}
          <div className="p-3 bg-[#0e111d]/90 border border-slate-800/50 rounded-xl flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-mono text-slate-500 uppercase font-bold">event_type</span>
              <span className={`text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded inline-block w-max ${
                selectedEvent.event_type === "page_view"
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  : selectedEvent.event_type === "scroll"
                    ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20"
                    : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
              }`}>
                {selectedEvent.event_type}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[8px] font-mono text-slate-500 uppercase font-bold">timestamp</span>
              <span className="text-[10px] font-semibold text-slate-350 font-mono">
                {getRelativeTime(selectedEvent.timestamp, sessionEvents[0].timestamp)}
              </span>
            </div>
          </div>

          {/* URL Section */}
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">captured_url</span>
              <button
                onClick={() => copyToClipboard(selectedEvent.page_url, "URL")}
                className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                copy
              </button>
            </div>
            <div className="p-2.5 bg-[#0a0c14]/50 border border-slate-800/40 rounded-xl text-slate-300 break-all select-all font-mono text-[10px] leading-relaxed">
              {selectedEvent.page_url}
            </div>
          </div>

          {/* Event details */}
          {selectedEvent.event_type === "click" && (
            <div className="space-y-3.5">
              <div className="space-y-1.5 font-mono text-[11px]">
                <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">coordinates</span>
                <div className="p-2.5 bg-[#0a0c14] border border-slate-850 rounded-xl flex justify-around text-[10px]">
                  <div>
                    <span className="text-slate-500 mr-1.5">X:</span>
                    <span className="text-indigo-300 font-bold">{selectedEvent.x}px</span>
                  </div>
                  <div className="w-[1px] bg-slate-800/60"></div>
                  <div>
                    <span className="text-slate-500 mr-1.5">Y:</span>
                    <span className="text-indigo-300 font-bold">{selectedEvent.y}px</span>
                  </div>
                </div>
              </div>

              {selectedEvent.element && (
                <div className="space-y-3.5 font-mono text-[11px]">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">element_tag</span>
                    <div>
                      <span className="px-2 py-0.5 rounded bg-[#0a0c14] border border-slate-800/50 text-emerald-450 font-bold font-mono">
                        &lt;{selectedEvent.element.tagName.toLowerCase()}&gt;
                      </span>
                    </div>
                  </div>

                  {selectedEvent.element.id && (
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-550 font-bold uppercase text-[9px] tracking-wider">element_id</span>
                      <div className="px-2 py-1 bg-[#0a0c14] border border-slate-800/40 rounded-lg text-indigo-300 font-bold select-all text-[10px]">
                        #{selectedEvent.element.id}
                      </div>
                    </div>
                  )}

                  {selectedEvent.element.className && (
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-550 font-bold uppercase text-[9px] tracking-wider">classes</span>
                      <div className="flex flex-wrap gap-1 p-2 bg-[#0a0c14] border border-slate-800/40 rounded-xl max-h-[100px] overflow-y-auto">
                        {selectedEvent.element.className.split(/\s+/).filter(Boolean).map((cls, cIdx) => (
                          <span key={cIdx} className="px-1.5 py-0.5 rounded bg-[#131726]/60 border border-slate-850 text-slate-350 text-[9px] font-mono select-all">
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEvent.element.text && (
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-550 font-bold uppercase text-[9px] tracking-wider">inner_text</span>
                      <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-amber-350 font-sans italic relative overflow-hidden text-[10px]">
                        <div className="line-clamp-4 select-all">
                          "{selectedEvent.element.text}"
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedEvent.element.selector && (
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">css_selector</span>
                        <button
                          onClick={() => copyToClipboard(selectedEvent.element?.selector || "", "CSS Selector")}
                          className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                        >
                          copy
                        </button>
                      </div>
                      <div className="p-2 bg-[#0a0c14] border border-slate-800/40 rounded-xl text-indigo-355 break-all select-all text-[9px] font-mono leading-normal">
                        {selectedEvent.element.selector}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedEvent.event_type === "scroll" && (
            <div className="space-y-4 font-mono text-[11px]">
              <span className="text-slate-555 font-bold uppercase text-[9px] tracking-wider block">scroll_offsets</span>
              <div className="p-2.5 bg-[#0a0c14] border border-slate-850 rounded-xl flex justify-around text-[10px]">
                <div>
                  <span className="text-slate-500 mr-1.5">Top (Y):</span>
                  <span className="text-cyan-300 font-bold">{selectedEvent.y}px</span>
                </div>
                <div className="w-[1px] bg-slate-800/60"></div>
                <div>
                  <span className="text-slate-500 mr-1.5">Left (X):</span>
                  <span className="text-cyan-300 font-bold">{selectedEvent.x}px</span>
                </div>
              </div>

              {/* Scroll Depth Visualization */}
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-slate-550 font-bold uppercase text-[9px] tracking-wider">scroll_depth_visual</span>
                <div className="relative h-32 bg-[#0a0c14]/60 border border-slate-850 rounded-xl flex items-center justify-center p-3">
                  <div className="w-2 h-full bg-[#131622] border border-slate-800/60 rounded-full relative">
                    <div 
                      className="absolute w-3.5 h-3.5 -left-0.75 rounded-full bg-cyan-400 border border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.7)] flex items-center justify-center"
                      style={{
                        top: `${Math.min(90, Math.max(0, (selectedEvent.y || 0) / 15))}%`
                      }}
                    >
                      <span className="w-1 bg-slate-955 rounded-full"></span>
                    </div>
                  </div>
                  <div className="flex-1 pl-4 flex flex-col justify-center gap-1 text-left font-sans text-[10px]">
                    <span className="text-slate-350 font-semibold">Vertical: {selectedEvent.y}px</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedEvent.event_type === "page_view" && (
            <div className="space-y-3 font-mono text-[11px]">
              <span className="text-slate-555 font-bold uppercase text-[9px] tracking-wider block">page_view_details</span>
              <div className="p-3.5 bg-[#0a0c14] border border-slate-800/40 rounded-xl space-y-2 font-sans text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-300 font-semibold">User visited the page</span>
                </div>
                <p className="text-[10px] text-slate-500 pl-2.5">
                  This event marks the entry point or route transition to a new URL.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  // Helpers
  const selectedEvent = selectedEventIndex !== null && sessionEvents[selectedEventIndex] 
    ? sessionEvents[selectedEventIndex] 
    : null;

  return (
    <div className="flex-1 flex flex-col min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-[#07080d] text-slate-200 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-slate-800/40 bg-[#0a0c14]/85 backdrop-blur-md sticky top-0 z-50 gap-4">
        {/* Left Side: Logo & Workspace/Scope Switcher */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <span className="font-bold text-sm tracking-widest text-slate-100 uppercase font-mono">TRACKKER</span>
          </div>

          <div className="hidden sm:block h-5 w-[1px] bg-slate-800"></div>

          {/* Custom Scope Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsScopeOpen(!isScopeOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121624] hover:bg-[#1b2136] border border-slate-800/80 hover:border-slate-700/80 transition-all text-left text-xs cursor-pointer shadow-sm min-w-[170px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 2a2 2 0 00-2 2v8a2 2 0 002 2h2.586l2 2H18a2 2 0 002-2V4a2 2 0 00-2-2H3zm1 2h14v8H3V4zm2 2h10v2H6V6zm0 3h10v1H6V9z" clipRule="evenodd" />
              </svg>
              <div className="flex flex-col leading-none">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider font-mono mb-0.5">active_scope</span>
                <span className="font-bold text-slate-200 truncate font-mono max-w-[110px]">
                  {(() => {
                    if (trackingId === "trk_demoA_9f8k2") return "demo_site_a";
                    if (trackingId === "tid_demoB_5j2d7" || trackingId === "trk_demoB_5j2d7") return "demo_site_b";
                    return trackingId;
                  })()}
                </span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-500 ml-auto" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {isScopeOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsScopeOpen(false)} />
                <div className="absolute left-0 mt-2 w-64 rounded-xl bg-[#0c0e17] border border-slate-800/80 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1 font-mono">
                  <div className="px-2.5 py-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    select tracking scope
                  </div>
                  {trackingIds.map(tid => {
                    let displayName = tid;
                    if (tid === "trk_demoA_9f8k2") {
                      displayName = "demo_site_a";
                    } else if (tid === "tid_demoB_5j2d7" || tid === "trk_demoB_5j2d7") {
                      displayName = "demo_site_b";
                    }
                    const isSelected = tid === trackingId;

                    return (
                      <button
                        key={tid}
                        onClick={() => {
                          setTrackingId(tid);
                          localStorage.setItem("telemetry_tracking_id", tid);
                          localStorage.removeItem("telemetry_selected_session_id");
                          if (tid === "trk_demoB_5j2d7") {
                            setHeatmapUrl(DEMO_SITE_B_URL);
                          } else if (tid === "trk_demoA_9f8k2") {
                            setHeatmapUrl(DEMO_SITE_A_URL);
                          }
                          setIsScopeOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600/15 border border-indigo-500/30 text-indigo-200"
                            : "hover:bg-[#121624] text-slate-400 hover:text-slate-200 border border-transparent"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-200 font-sans">{displayName}</span>
                          <span className="text-[10px] text-slate-500 font-mono truncate max-w-[190px]">{tid}</span>
                        </div>
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="hidden sm:block h-5 w-[1px] bg-slate-800"></div>

        {/* Right Side: Utilities */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-[#0c0e17] border border-slate-800/60 rounded-lg px-2.5 py-1 text-[10px] font-mono text-slate-500 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            CONNECTED: {sessions.length} SESSIONS
          </div>

          <button
            onClick={async () => {
              await Promise.all([
                loadSessionsData(trackingId, false),
                loadTrackedPagesData(trackingId, false),
                loadHeatmapData(heatmapUrl, trackingId, false)
              ]);
              showToast("Telemetry data refreshed", "success");
            }}
            className="flex items-center justify-center p-2 rounded-lg bg-[#121624] hover:bg-[#1b2136] border border-slate-800/80 hover:border-slate-700/80 transition-all text-slate-400 hover:text-slate-100 cursor-pointer"
            title="Refresh Data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.235" />
            </svg>
          </button>
        </div>
      </header>

      {/* Error display */}
      {error && (
        <div className="bg-rose-950/10 border-b border-rose-900/30 text-rose-400 px-6 py-3 text-xs flex justify-between items-center font-mono">
          <span>[!] Error: {error}</span>
          <button onClick={() => setError(null)} className="opacity-60 hover:opacity-100 uppercase tracking-wider font-bold text-[10px] cursor-pointer">
            clear
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-[#0a0c14]/50 backdrop-blur-sm px-6 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/50">
          <button
            onClick={() => {
              setActiveTab("journeys");
              setSelectedEventIndex(null);
            }}
            className={`px-4.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "journeys"
                ? "bg-indigo-650 text-slate-100 shadow-[0_2px_8px_rgba(99,102,241,0.4)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A2 2 0 012.553 15.5L2 6.5A2 2 0 013.447 4.7l5.447 2.7L9 20zM9 20l5.447-2.7A2 2 0 0116.5 15.5l.5-9A2 2 0 0115.5 4.7l-5.4 2.7M9 7.4L15 4.5M9 20V7.4" />
            </svg>
            Session Journeys
          </button>
          <button
            onClick={() => {
              setActiveTab("heatmap");
              setSelectedEventIndex(null);
            }}
            className={`px-4.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "heatmap"
                ? "bg-indigo-650 text-slate-100 shadow-[0_2px_8px_rgba(99,102,241,0.4)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Heatmap Analyzer
          </button>
        </div>
        
        <div className="text-[10px] font-mono text-slate-500 hidden sm:block">
          current_view::{"{"}{activeTab.toUpperCase()}{"}"}
        </div>
      </div>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden relative">
        
        {/* Tab 1: Session Journeys Columns */}
        {activeTab === "journeys" && (
          <>
            {/* Left Column: Sessions List (Sidebar) */}
            {renderSessionsSidebar()}

            {/* Middle Column: Active Session Journey Timeline */}
            <section className="flex-1 bg-[#07090f] flex flex-col min-h-0">
              <div className="p-4 border-b border-slate-800/40 flex justify-between items-center bg-[#0c0e17]/25">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                    journey_timeline {selectedSessionId && sessionEvents.length > 0 && `─ ${formatDate(sessionEvents[0].timestamp)}`}
                  </span>
                  {loadingEvents && (
                    <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                {selectedSessionId && sessionEvents.length > 0 && (
                  <button
                    onClick={isReplaying ? stopReplay : startReplay}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all cursor-pointer font-sans flex items-center gap-1.5 border ${
                      isReplaying 
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse"
                        : "bg-indigo-650/40 text-indigo-400 border-indigo-500/25 hover:bg-indigo-600/30 hover:text-indigo-300 hover:border-indigo-500/50"
                    }`}
                  >
                    {isReplaying ? (
                      <>
                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
                        stop_replay
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        replay_session
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="flex-1 p-5 overflow-y-auto min-h-0">
                {selectedSessionId && sessionEvents.length > 0 ? (
                  <div className="space-y-5 max-w-4xl mx-auto">
                    {/* Meta details */}
                    <div className="p-4 bg-[#0a0c14] rounded-xl border border-slate-800/50 text-xs text-slate-300 space-y-2.5 font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold">session_hash:</span> 
                        <span className="text-slate-300 select-all font-semibold bg-[#121624] px-1.5 py-0.5 rounded border border-slate-800/40 text-[11px]">{selectedSessionId}</span>
                      </div>
                      <div className="flex justify-between">
                        <div><span className="text-slate-500 font-bold">date:</span> <span className="text-slate-300">{formatDate(sessionEvents[0].timestamp)}</span></div>
                        <div><span className="text-slate-500 font-bold">lifecycle:</span> <span className="text-slate-300">{formatDuration(sessionEvents[0].timestamp, sessionEvents[sessionEvents.length-1].timestamp)}</span></div>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-800/40 pt-2.5 mt-1">
                        <span className="text-[10px] text-slate-500">danger_zone:</span>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:text-white border border-rose-500/20 hover:bg-rose-500/25 px-2 py-0.5 rounded transition-all cursor-pointer font-sans"
                        >
                          delete_session
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 pl-3 border-l-2 border-slate-800/50 ml-3.5 select-none">
                      {[...sessionEvents].reverse().map((evt, revIdx) => {
                        const idx = sessionEvents.length - 1 - revIdx;
                        const isPageView = evt.event_type === "page_view";
                        const isCurrentReplay = isReplaying && replayIndex === idx;
                        const isSelected = selectedEventIndex === idx;
                        const relTime = getRelativeTime(evt.timestamp, sessionEvents[0].timestamp);
                        const cleanPathname = evt.page_url.replace(/http:\/\/localhost:\d+/, "");
                        
                        return (
                          <div key={idx} className="relative pl-6 group">
                            {/* Bullet */}
                            <div className={`absolute -left-[8px] top-[18px] w-3.5 h-3.5 rounded-full border-2 border-[#07090f] shadow-lg transition-transform group-hover:scale-125 ${
                              isCurrentReplay
                                ? "bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                                : isPageView 
                                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" 
                                  : evt.event_type === "scroll"
                                    ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                                    : "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                            }`} />
                            
                            {/* Interactive Timeline Event Card */}
                            <div 
                              onClick={() => setSelectedEventIndex(idx)}
                              className={`flex flex-col p-4 rounded-xl transition-all cursor-pointer border ${
                                isCurrentReplay
                                  ? 'bg-[#1b150f] border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                                  : isSelected 
                                    ? 'bg-[#13182b] border-indigo-500 shadow-[0_4px_20px_rgba(99,102,241,0.15)]' 
                                    : 'bg-[#0e111a]/40 border-slate-800/20 hover:bg-[#121626]/60 hover:border-slate-800/50'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                  <span className="text-[11px] text-slate-400 font-bold font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md">{relTime}</span>
                                  <span className={`text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                                    isCurrentReplay
                                      ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                                      : isPageView 
                                        ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" 
                                        : evt.event_type === "scroll"
                                          ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20"
                                          : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                                  }`}>
                                    {evt.event_type}
                                  </span>
                                  {isPageView ? (
                                    <span className="text-sm font-semibold text-slate-100 truncate max-w-[180px] font-mono">{cleanPathname}</span>
                                  ) : evt.event_type === "scroll" ? (
                                    <span className="text-xs text-slate-350 font-mono">
                                      scrolled to <span className="text-cyan-400 font-bold">Y = {evt.y}px</span>
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-200 font-semibold font-mono">
                                      click: <span className="text-rose-400 font-bold">{evt.element?.tagName || "element"}</span>
                                      {evt.element?.id ? (
                                        <span className="text-slate-400 font-normal text-[11px]"> #{evt.element.id}</span>
                                      ) : evt.element?.text ? (
                                        <span className="text-amber-400 font-normal italic text-[11px]"> "{evt.element.text}"</span>
                                      ) : null}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isCurrentReplay && (
                                    <span className="text-[9px] font-bold text-amber-400 animate-pulse bg-amber-500/10 border border-amber-500/35 px-1.5 py-0.5 rounded font-mono">REPLAYING</span>
                                  )}
                                  <span className="text-xs text-slate-400 font-bold font-mono">{formatTime(evt.timestamp)}</span>
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className={`h-4 w-4 text-slate-550 transition-transform ${isSelected ? 'rotate-90 text-indigo-400' : ''}`} 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor" 
                                    strokeWidth={2.5}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs text-center p-8 font-mono">
                    select a session on the left to track telemetry journey
                  </div>
                )}
              </div>
            </section>

            {/* Right Column: Event Details Inspector / Placeholder */}
            {selectedEventIndex !== null && selectedEvent ? (
              renderDetailsPanel('right')
            ) : (
              <section className="w-full lg:w-[420px] border-l border-slate-800/40 bg-[#0c0f18] flex flex-col items-center justify-center p-8 text-center text-slate-500 font-mono text-xs flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                select an event from the timeline to inspect captured telemetry metadata
              </section>
            )}
          </>
        )}

        {/* Tab 2: Heatmap Analyzer Column */}
        {activeTab === "heatmap" && (
          <>
            {/* Left Sidebar (Sessions List OR Event Details Inspector) */}
            {selectedEventIndex !== null ? renderDetailsPanel('left') : renderSessionsSidebar()}

            {/* Main Visualizer Panel */}
            <section className="flex-1 bg-[#07090f] flex flex-col lg:overflow-hidden">
            <div className="p-4 border-b border-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 bg-[#0c0e17]/25">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">heatmap_analyzer</span>
                {isReplaying && (
                  <span className="animate-pulse bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold font-mono px-2 py-0.5 rounded">
                    replay_active
                  </span>
                )}
              </div>
              <label className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 select-none cursor-pointer hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={showIframeBackground}
                  onChange={(e) => setShowIframeBackground(e.target.checked)}
                  className="rounded accent-indigo-500 border-slate-800 bg-slate-900 w-3.5 h-3.5 cursor-pointer"
                />
                website_preview
              </label>
            </div>

            <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-start lg:min-h-0 min-h-[250px]">
              {/* Address controls */}
              <div className="w-full max-w-[1100px] flex items-center gap-3 bg-[#0a0c14] border border-slate-800/60 border-b-0 rounded-t-xl px-4 py-2.5 flex-shrink-0 shadow-sm">
                <div className="flex gap-1.5 flex-shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/50"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></span>
                </div>
                <div className="flex-1 flex items-center bg-[#07090f] border border-slate-800/80 rounded-lg px-3 py-1 text-xs text-slate-400 font-mono gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-650" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <select
                    value={heatmapUrl}
                    onChange={(e) => setHeatmapUrl(e.target.value)}
                    className="bg-transparent text-xs text-slate-300 outline-none border-none w-full cursor-pointer font-mono"
                  >
                    {(() => {
                      const uniqueUrls = new Set(trackedPages);
                      if (heatmapUrl) {
                        uniqueUrls.add(heatmapUrl);
                      }
                      return Array.from(uniqueUrls).map(url => (
                        <option key={url} value={url} className="bg-[#07090f]">{url}</option>
                      ));
                    })()}
                  </select>
                </div>
                <div className="text-[10px] text-indigo-400 font-bold bg-indigo-950/40 border border-indigo-900/40 px-2.5 py-1 rounded-md flex-shrink-0 font-mono">
                  {loadingClicks ? "..." : `${clicks.length} clicks`}
                </div>
              </div>

              {/* Heatmap render */}
              {loadingClicks ? (
                <div className="w-full max-w-[1100px] h-[700px] bg-[#0a0c14] border border-slate-800/60 flex flex-col items-center justify-center rounded-b-xl shadow-lg">
                  <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-wider font-mono">fetching click stream...</span>
                </div>
              ) : (
                <div className="w-full max-w-[1100px] h-[700px] bg-[#090b11] border border-slate-800/60 overflow-hidden rounded-b-xl flex-shrink-0 shadow-xl relative">
                  {showIframeBackground ? (
                    <iframe
                      ref={iframeRef}
                      src={heatmapUrl}
                      className="w-full h-full border-none select-none opacity-35 bg-white"
                      title="Telemetry Heatmap Web Preview"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(#1e243b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 flex items-center justify-center bg-[#07080d]">
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono select-none">render_canvas</span>
                    </div>
                  )}

                  {isReplaying && (
                    <div className="absolute top-3 right-3 bg-[#0a0c14]/90 border border-amber-500/40 text-amber-400 text-[10px] font-bold font-mono px-2.5 py-1 rounded-md shadow-lg z-50 flex items-center gap-1.5 backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping flex-shrink-0"></span>
                      <span>REPLAYING: EVENT {replayIndex + 1} / {sessionEvents.length}</span>
                    </div>
                  )}

                  {/* Heatmap overlay dots */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      transform: `translate(${iframeLayout.bodyLeft - iframeLayout.scrollLeft}px, ${iframeLayout.bodyTop - iframeLayout.scrollTop}px)`
                    }}
                  >
                    {!isReplaying && clicks.map((clk, idx) => (
                      <div
                        key={`pulse-${idx}`}
                        className="absolute w-10 h-10 -ml-5 -mt-5 rounded-full bg-rose-500/20 animate-ping"
                        style={{ left: `${clk.x}px`, top: `${clk.y}px` }}
                      />
                    ))}
                    {!isReplaying && clicks.map((clk, idx) => (
                      <div
                        key={`dot-${idx}`}
                        className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full cursor-pointer bg-rose-500 hover:bg-amber-400 hover:scale-125 transition-all shadow-[0_0_14px_rgba(244,63,94,0.9)] group pointer-events-auto"
                        style={{ left: `${clk.x}px`, top: `${clk.y}px` }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-[#0a0c14]/95 border border-slate-800 text-slate-250 text-[10px] p-2.5 rounded-lg font-mono shadow-[0_8px_30px_rgb(0,0,0,0.85)] whitespace-normal min-w-[200px] z-50 backdrop-blur-sm pointer-events-none">
                          <div className="font-bold border-b border-slate-800 pb-1 mb-1 text-[11px] text-rose-450">click_{idx + 1}</div>
                          <div>coords: ({clk.x}, {clk.y})</div>
                          {clk.element && (
                            <div className="mt-1 space-y-0.5 text-slate-400">
                              <div>tag: <span className="text-emerald-400 font-bold">{clk.element.tagName}</span></div>
                              {clk.element.id && <div>id: <span className="text-indigo-300">#{clk.element.id}</span></div>}
                              {clk.element.text && <div>text: <span className="text-amber-300 italic">"{clk.element.text}"</span></div>}
                              {clk.element.selector && (
                                <div className="text-[9px] text-slate-500 break-all mt-1 bg-slate-900/50 border border-slate-800/40 p-1 rounded max-w-[220px]">
                                  {clk.element.selector}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Replay cursor */}
                    {isReplaying && replayCursor && (
                      <div 
                        className="absolute w-6 h-6 -ml-1 -mt-1 z-50 transition-all duration-300 ease-out"
                        style={{ 
                          left: `${replayCursor.x}px`, 
                          top: `${replayCursor.y}px`
                        }}
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" fill="currentColor">
                          <path d="M4 3l12 9-5.5 1.5 5 8-3 1.5-5-8L4 18V3z" stroke="black" strokeWidth="1.5" />
                        </svg>
                      </div>
                    )}

                    {/* Replay click ripple */}
                    {isReplaying && replayRipple && (
                      <div 
                        className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-4 border-amber-400/80 bg-amber-500/20 animate-ping z-40"
                        style={{ 
                          left: `${replayRipple.x}px`, 
                          top: `${replayRipple.y}px`
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
          </>
        )}

      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07080d]/80 backdrop-blur-sm transition-opacity">
          <div className="w-[400px] bg-[#0c0e17] border border-slate-800/60 rounded-2xl p-6 shadow-2xl space-y-4 font-sans animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h3 className="text-lg font-bold text-slate-100">Delete Session</h3>
            </div>
            
            <p className="text-sm text-slate-300 font-sans leading-relaxed">
              Are you sure you want to delete session <span className="text-slate-100 font-bold bg-[#121624] px-1.5 py-0.5 rounded border border-slate-800/40 font-mono text-xs">{selectedSessionId?.replace("sess_", "")}</span>? This action will permanently remove all associated events.
            </p>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-[#121624] border border-slate-800/80 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-all cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  await executeDeleteSession();
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-600/20 transition-all cursor-pointer font-sans"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert Popups */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[150] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-4.5 py-3 bg-[#0c0e17]/90 border backdrop-blur-md rounded-xl shadow-2xl transition-all ${
            toast.type === "success"
              ? "border-emerald-500/30 text-emerald-300 shadow-emerald-950/20"
              : toast.type === "error"
              ? "border-rose-500/30 text-rose-300 shadow-rose-950/20"
              : "border-indigo-500/30 text-indigo-300 shadow-indigo-950/20"
          }`}>
            {toast.type === "success" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.type === "error" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {toast.type === "info" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-xs font-semibold font-sans">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-slate-200 transition-colors p-0.5 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
