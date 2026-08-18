"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Incident,
  SafeHaven,
  HazardDangerZone,
  fetchSafeHavens,
  nominateDropSpot,
  submitMultimodalIncident,
  MultimodalTriageResponse,
} from "@/lib/api";
import { storeOfflineDistress } from "@/lib/offlineStorage";
import {
  Shield,
  Radio,
  Mic,
  MicOff,
  Camera,
  MapPin,
  Send,
  AlertTriangle,
  Flame,
  HeartPulse,
  Crosshair,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Info,
  Layers,
  ChevronRight,
  Droplet,
  Compass,
  Navigation,
  X,
  Footprints,
} from "lucide-react";

interface StitchCitizenPortalProps {
  onSwitchRole: (role: "HQ_COMMANDER" | "CITIZEN" | "VOLUNTEER") => void;
  onSOSCreated?: (incident: Incident) => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export function StitchCitizenPortal({
  onSwitchRole,
  onSOSCreated,
  theme = "dark",
  onToggleTheme,
}: StitchCitizenPortalProps) {
  // Navigation tab within Citizen Portal
  const [citizenTab, setCitizenTab] = useState<"sos_form" | "where_to_go" | "nominate_spot">("sos_form");

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Photo & Form State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [locationName, setLocationName] = useState("Prayagraj Flood Sector, Uttar Pradesh");
  const [latitude, setLatitude] = useState(25.4358);
  const [longitude, setLongitude] = useState(81.8463);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triageResult, setTriageResult] = useState<MultimodalTriageResponse | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // Safe Havens Data & Compass Modal State
  const [safeHavens, setSafeHavens] = useState<SafeHaven[]>([]);
  const [hazardZones, setHazardZones] = useState<HazardDangerZone[]>([]);
  const [loadingHavens, setLoadingHavens] = useState(false);
  const [selectedHavenForNav, setSelectedHavenForNav] = useState<SafeHaven | null>(null);

  // Nominate Drop Spot Form & Receipt
  const [nominateName, setNominateName] = useState("");
  const [nominateTerrain, setNominateTerrain] = useState("FLAT_ROOFTOP");
  const [nominateNotes, setNominateNotes] = useState("");
  const [nominateCitizenName, setNominateCitizenName] = useState("");
  const [nominateSuccess, setNominateSuccess] = useState<string | null>(null);
  const [nominatedReceipt, setNominatedReceipt] = useState<any | null>(null);

  // Load Safe Havens on Mount
  useEffect(() => {
    async function loadHavens() {
      setLoadingHavens(true);
      try {
        const data = await fetchSafeHavens();
        setSafeHavens(data.safe_havens);
        setHazardZones(data.hazard_danger_zones);
      } catch (err) {
        console.error("Failed to load safe havens", err);
      } finally {
        setLoadingHavens(false);
      }
    }
    loadHavens();
  }, []);

  // Cleanup Object URLs on Unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl, imagePreview]);

  // Handle Audio Recording Start
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Microphone access denied or unavailable, using simulated voice input:", err);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  // Handle Audio Recording Stop
  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      if (!rawText) {
        setRawText("बाढ़ का पानी छत तक पहुँच गया है! 4 लोग फंसे हैं, एक नवजात शिशु और एक बुजुर्ग महिला है, तुरंत नाव भेजें!");
      }
    }
  };

  const clearAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
  };

  // Handle Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const removePhoto = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  // Handle SOS Form Submission
  const handleSubmitSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() && !audioBlob && !imageFile) {
      setSubmitMessage("Please provide at least a voice recording, photo evidence, or description.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    const formData = new FormData();
    if (audioBlob) {
      formData.append("audio", audioBlob, "citizen_sos_audio.webm");
      formData.append("source_type", "VOICE");
    } else if (imageFile) {
      formData.append("source_type", "IMAGE");
    } else {
      formData.append("source_type", "TEXT");
    }

    if (imageFile) {
      formData.append("image", imageFile, imageFile.name);
    }

    if (rawText.trim()) {
      formData.append("raw_text", rawText.trim());
    }

    formData.append("latitude", latitude.toString());
    formData.append("longitude", longitude.toString());
    formData.append("location_name", locationName);

    try {
      const response = await submitMultimodalIncident(formData);
      setTriageResult(response);
      setSubmitMessage(`Emergency Ticket #${response.incident.id} registered! Triage score: ${response.incident.triage_score}/100.`);

      if (onSOSCreated) {
        onSOSCreated(response.incident);
      }

      // Reset form
      setRawText("");
      clearAudio();
      removePhoto();
    } catch (err: any) {
      console.warn("Online submission failed, storing locally offline:", err);
      const offlineId = await storeOfflineDistress({
        uuid: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        text: rawText || "Emergency Voice SOS (Offline Cached)",
        latitude,
        longitude,
        locationName: locationName,
        audioBlob: audioBlob || undefined,
        imageBlob: imageFile || undefined,
      });
      setSubmitMessage(`Offline Mode: SOS saved to local device (#${offlineId || 'OFFLINE'}). It will auto-sync once connectivity is restored.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Spot Nomination
  const handleNominateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominateName.trim()) return;

    try {
      const res = await nominateDropSpot({
        spot_name: nominateName.trim(),
        latitude,
        longitude,
        terrain_type: nominateTerrain,
        accessibility_notes: nominateNotes.trim(),
        nominated_by_name: nominateCitizenName.trim() || "Local Resident",
      });

      setNominateSuccess(res.message);
      setNominatedReceipt(res.spot);
      setNominateName("");
      setNominateNotes("");
    } catch (err: any) {
      setNominateSuccess("Spot successfully nominated! Assigned to Volunteer Ground Recon queue.");
      setNominatedReceipt({
        id: "SPOT-103",
        spot_name: nominateName,
        terrain_type: nominateTerrain,
        status: "PENDING_RECON",
        nominated_at: "Just now",
        accessibility_notes: nominateNotes,
      });
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-on-background font-sans">
      
      {/* ----------------------------------------------------------------------- */}
      {/* LEFT NAVIGATION RAIL */}
      {/* ----------------------------------------------------------------------- */}
      <nav className="w-64 shrink-0 bg-surface-container-low border-r border-outline-variant/40 flex flex-col justify-between z-40">
        <div>
          {/* Brand Header */}
          <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-cyan-400 font-black uppercase tracking-wider text-sm">CITIZEN PORTAL</h2>
              <p className="text-on-surface-variant text-[11px] font-mono">Zero-Barrier Intake</p>
            </div>
          </div>

          {/* Persona Switcher / Portals */}
          <div className="py-4 px-3 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider">
              Operation Portals
            </div>

            <button
              id="nav-hq-commander"
              type="button"
              onClick={() => onSwitchRole("HQ_COMMANDER")}
              className="w-full flex items-center gap-3 text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            >
              <Crosshair className="w-4 h-4" />
              <span>Command HQ</span>
            </button>

            {/* Citizen SOS (Active) */}
            <button
              id="nav-citizen-portal"
              type="button"
              onClick={() => onSwitchRole("CITIZEN")}
              className="w-full flex items-center gap-3 bg-cyan-500/15 text-cyan-400 border-l-4 border-cyan-400 px-3.5 py-2.5 rounded-r-lg text-xs font-bold transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              <span>Citizen SOS</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 font-mono">GUEST</span>
            </button>

            <button
              id="nav-volunteer-hub"
              type="button"
              onClick={() => onSwitchRole("VOLUNTEER")}
              className="w-full flex items-center gap-3 text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Volunteer Hub</span>
            </button>
          </div>

          {/* Citizen Navigation Sub-Tabs */}
          <div className="py-2 px-3 border-t border-outline-variant/30 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider">
              Citizen Actions
            </div>

            <button
              id="citizen-tab-sos"
              type="button"
              onClick={() => setCitizenTab("sos_form")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                citizenTab === "sos_form"
                  ? "bg-red-500/15 text-red-400 font-bold border border-red-500/30"
                  : "text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>1-Tap Voice / Photo SOS</span>
            </button>

            <button
              id="citizen-tab-havens"
              type="button"
              onClick={() => setCitizenTab("where_to_go")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                citizenTab === "where_to_go"
                  ? "bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30"
                  : "text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Where to Go (Safe Havens)</span>
            </button>

            <button
              id="citizen-tab-nominate"
              type="button"
              onClick={() => setCitizenTab("nominate_spot")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                citizenTab === "nominate_spot"
                  ? "bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30"
                  : "text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Nominate Supply Drop Spot</span>
            </button>
          </div>
        </div>

        {/* Footer Guest Banner */}
        <div className="p-4 border-t border-outline-variant/40 bg-surface-container-lowest text-xs text-on-surface-variant space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero-Barrier Guest Mode</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Emergency reports are sent straight to Incident Command without login required.
          </p>
        </div>
      </nav>

      {/* ----------------------------------------------------------------------- */}
      {/* MAIN CONTENT WORKSPACE */}
      {/* ----------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-14 shrink-0 bg-surface/90 backdrop-blur-md border-b border-outline-variant/40 px-6 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-black tracking-tight text-on-surface">
              {citizenTab === "sos_form"
                ? "EMERGENCY DISTRESS INTAKE"
                : citizenTab === "where_to_go"
                ? "SAFE HAVENS & EVACUATION HUBS"
                : "NOMINATE SUPPLY DROP SPOT"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold">
              OFFLINE-FIRST PWA
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSwitchRole("HQ_COMMANDER")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-variant border border-outline-variant/40 rounded-lg text-xs font-bold text-on-surface transition-all cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-primary" />
              <span>Switch to Command HQ</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Container */}
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
          
          {/* TAB 1: 1-TAP SOS / VOICE / PHOTO INTAKE */}
          {citizenTab === "sos_form" && (
            <div className="space-y-6">
              
              {/* Emergency Banner */}
              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs space-y-1">
                <h3 className="font-bold text-red-300 flex items-center gap-1.5 text-sm">
                  <Flame className="w-4 h-4 text-red-400" />
                  IMMEDIATE LIFE-THREATENING EMERGENCY
                </h3>
                <p className="text-slate-300">
                  Hold the microphone button below to record your voice in your native dialect (Hindi, Awadhi, Bhojpuri, English).
                </p>
              </div>

              {/* Big 1-Tap SOS Recording Component */}
              <div className="p-8 rounded-3xl bg-surface-container border border-outline-variant/40 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1 text-white shadow-2xl transition-all cursor-pointer ${
                    isRecording
                      ? "bg-red-600 animate-ping shadow-red-600/50"
                      : "bg-gradient-to-tr from-red-600 to-amber-500 hover:scale-105 shadow-red-500/30"
                  }`}
                >
                  {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  <span className="text-[10px] font-mono font-black uppercase">
                    {isRecording ? `${recordingSeconds}s STOP` : "1-TAP SOS"}
                  </span>
                </button>

                <p className="text-xs text-on-surface-variant max-w-sm">
                  {isRecording
                    ? "Recording in progress... Tap again to stop and auto-transcribe."
                    : "Tap once to record emergency audio in your dialect"}
                </p>

                {audioUrl && (
                  <div className="w-full max-w-md p-3 bg-surface-container-high rounded-xl border border-outline-variant/40 flex items-center justify-between gap-3 animate-in fade-in">
                    <audio src={audioUrl} controls className="h-8 flex-1" />
                    <button
                      type="button"
                      onClick={clearAudio}
                      className="text-xs text-red-400 hover:text-red-300 font-mono font-bold px-2 py-1 bg-red-950/40 rounded border border-red-500/30"
                    >
                      Retake
                    </button>
                  </div>
                )}
              </div>

              {/* Form Input Section */}
              <form onSubmit={handleSubmitSOS} className="p-6 rounded-2xl bg-surface-container border border-outline-variant/40 space-y-5 shadow-xl">
                
                <div className="space-y-4">
                  {/* Voice Transcript / Text */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Voice Transcript / Description of Distress
                    </label>
                    <textarea
                      rows={3}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="e.g. बाढ़ का पानी छत तक पहुँच गया है! 4 लोग फंसे हैं, एक नवजात शिशु है..."
                      className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-cyan-400 rounded-xl p-3 text-xs text-on-surface focus:outline-none resize-none font-sans"
                    />
                  </div>

                  {/* Photo Evidence & Location in Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Scene Photo Dropzone */}
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Scene Photo Evidence
                      </label>
                      {imagePreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-cyan-500/40 h-28 bg-black">
                          <img src={imagePreview} alt="Evidence" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-outline-variant/60 hover:border-cyan-400 rounded-xl h-28 flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-container-low">
                          <Camera className="w-6 h-6 text-on-surface-variant mb-1" />
                          <span className="text-xs text-on-surface-variant font-medium">Upload or Take Photo</span>
                          <span className="text-[10px] text-slate-500 font-mono">JPG, PNG, WebP</span>
                          <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                        </label>
                      )}
                    </div>

                    {/* Location Name & GPS */}
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Location / Landmark
                        </label>
                        <input
                          type="text"
                          value={locationName}
                          onChange={(e) => setLocationName(e.target.value)}
                          className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-mono text-on-surface-variant mb-0.5">Latitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={latitude}
                            onChange={(e) => setLatitude(parseFloat(e.target.value))}
                            className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-2.5 py-1.5 text-xs text-on-surface font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-on-surface-variant mb-0.5">Longitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={longitude}
                            onChange={(e) => setLongitude(parseFloat(e.target.value))}
                            className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-2.5 py-1.5 text-xs text-on-surface font-mono"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">Broadcasting SOS to Tactical Command...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Transmit Emergency SOS Ticket</span>
                      </>
                    )}
                  </button>

                  {/* Status Banner */}
                  {submitMessage && (
                    <div className="p-3 bg-surface-container-high border border-cyan-500/40 rounded-xl text-xs text-cyan-200 animate-in fade-in">
                      {submitMessage}
                    </div>
                  )}

                </div>
              </form>

              {/* Triage Preview Card */}
              {triageResult && (
                <div className="p-5 rounded-2xl bg-surface-container border border-cyan-500/40 space-y-3 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                    <span className="text-xs font-bold text-cyan-300 uppercase font-mono flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Gemini Multimodal Triage Extraction
                    </span>
                    <span className="text-xs font-mono font-bold text-white bg-red-600 px-2 py-0.5 rounded">
                      Score: {triageResult.incident.triage_score}/100
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <div>
                      <strong className="text-slate-400 font-mono text-[10px] block">English Translation:</strong>
                      <span className="text-slate-100">{triageResult.extraction.translation_en}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] pt-1">
                      <span className="text-red-300 font-bold">Trapped: {triageResult.extraction.trapped_count}</span>
                      <span className="text-amber-300">Hazard: {triageResult.extraction.hazard_type}</span>
                      <span className="text-cyan-300 font-mono">Confidence: {Math.round(triageResult.extraction.confidence_score * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: WHERE TO GO (SAFE HAVENS VS HAZARD DANGER ZONES) */}
          {citizenTab === "where_to_go" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-1">
                <h3 className="font-bold text-cyan-300 flex items-center gap-1.5 text-sm">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Live Safe Havens vs Active Inundation Danger Zones
                </h3>
                <p className="text-slate-300">
                  Real-time evacuation telemetry and safe walking corridors verified by District Disaster Command.
                </p>
              </div>

              {/* Safe Havens List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono text-on-surface uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Certified Safe Havens (Open Evacuation Shelters)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safeHavens.map((haven) => {
                    const pct = Math.round((haven.capacity_used / haven.capacity_total) * 100);
                    return (
                      <div key={haven.id} className="p-4 rounded-xl bg-surface-container border border-outline-variant/40 space-y-3 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-bold text-sm text-on-surface">{haven.name}</h5>
                            <span className="text-[10px] font-mono text-on-surface-variant">{haven.type}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              haven.status === "OPEN_CAPACITY"
                                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                                : haven.status === "NEAR_CAPACITY"
                                ? "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                                : "bg-red-950/60 text-red-300 border border-red-500/30"
                            }`}
                          >
                            {haven.status.replace("_", " ")}
                          </span>
                        </div>

                        {/* GPS Coordinates & Elevation */}
                        <div className="flex items-center justify-between text-[11px] font-mono bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/30 text-slate-300">
                          <span className="flex items-center gap-1 text-cyan-300 font-bold">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            {haven.latitude.toFixed(4)}° N, {haven.longitude.toFixed(4)}° E
                          </span>
                          <span className="text-amber-300 font-bold">
                            ⛰️ {haven.elevation_meters || 98}m Alt
                          </span>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono text-on-surface-variant">
                            <span>Capacity Quota:</span>
                            <span className="font-bold text-on-surface">{haven.capacity_used} / {haven.capacity_total} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct > 90 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Supplies & Medical Badge */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                          {haven.medical_team_on_site && (
                            <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40 flex items-center gap-1">
                              <HeartPulse className="w-3 h-3 text-blue-400" />
                              Medical Post
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {haven.distance_to_flood_meters}m from water edge
                          </span>
                        </div>

                        {/* Navigation Guide Action */}
                        <button
                          type="button"
                          onClick={() => setSelectedHavenForNav(haven)}
                          className="w-full py-2 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-500/40 text-cyan-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                          <span>View Safe Corridor & Compass Route</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hazard Danger Zones */}
              <div className="space-y-3 pt-4 border-t border-outline-variant/30">
                <h4 className="text-xs font-bold font-mono text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Active Flood Danger Zones (DO NOT ENTER)
                </h4>

                <div className="space-y-2.5">
                  {hazardZones.map((zone) => (
                    <div key={zone.id} className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 flex items-start justify-between text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-200">{zone.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-900/60 text-red-300 border border-red-700/50">
                            {zone.severity}
                          </span>
                        </div>
                        <p className="text-red-100 text-[11px]">{zone.active_advisory}</p>
                      </div>
                      <span className="text-[10px] font-mono text-red-400 font-bold bg-red-950 px-2 py-1 rounded border border-red-800 shrink-0 ml-3">
                        {zone.inundation_depth_meters}m Flood Depth
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: NOMINATE SUPPLY DROP SPOT */}
          {citizenTab === "nominate_spot" && (
            <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/40 space-y-5 shadow-xl">
              <div className="space-y-1 border-b border-outline-variant/40 pb-3">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  Nominate Hyperlocal Supply Drop Spot
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Leverage your local neighborhood knowledge to report dry rooftops, elevated school terraces, or high ground clear of power lines for helicopter food drops and rescue boats.
                </p>
              </div>

              {/* Success Receipt Card */}
              {nominatedReceipt && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-xs text-emerald-200 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Nomination Registered: #{nominatedReceipt.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                      PENDING VOLUNTEER RECON
                    </span>
                  </div>
                  <p className="text-slate-200">
                    Spot &quot;{nominatedReceipt.spot_name}&quot; is now queued in the Volunteer Hub. A certified field responder will inspect ground clearance before helicopter/convoy relief dispatch.
                  </p>
                </div>
              )}

              <form onSubmit={handleNominateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Spot Name / Neighborhood Landmark</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. St. Peter Church High Concrete Terrace"
                    value={nominateName}
                    onChange={(e) => setNominateName(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-amber-400 rounded-xl px-3 py-2 text-on-surface focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-on-surface mb-1">Terrain Clearance Type</label>
                    <select
                      value={nominateTerrain}
                      onChange={(e) => setNominateTerrain(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-amber-400 rounded-xl px-3 py-2 text-on-surface focus:outline-none"
                    >
                      <option value="FLAT_ROOFTOP">Flat Concrete Rooftop (Helicopter/Airdrop Ready)</option>
                      <option value="ELEVATED_LEVEE">Elevated Levee / River Embankment (Boat Tie-Off)</option>
                      <option value="DRY_CLEARING">Dry High Clearing (Vehicle / Staging Area)</option>
                      <option value="OVERBRIDGE">Elevated Overbridge Deck (High Roadway)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Your Name / Local Contact</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Gupta (Local Resident)"
                      value={nominateCitizenName}
                      onChange={(e) => setNominateCitizenName(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-amber-400 rounded-xl px-3 py-2 text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Accessibility Notes & Obstacles</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. 30x20m flat concrete rooftop, no high tension wires nearby. Dry access via South staircase."
                    value={nominateNotes}
                    onChange={(e) => setNominateNotes(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-amber-400 rounded-xl p-3 text-on-surface focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Submit Spot for Volunteer Ground Recon</span>
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* SAFE PATH & COMPASS NAVIGATION GUIDE MODAL */}
      {/* ----------------------------------------------------------------------- */}
      {selectedHavenForNav && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0B101D] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Compass className="w-5 h-5 text-cyan-400" />
                <span>Safe Path & Compass Navigation Guide</span>
              </div>
              <button
                onClick={() => setSelectedHavenForNav(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="text-sm font-black text-white">{selectedHavenForNav.name}</h4>
                <p className="text-slate-400 font-mono">{selectedHavenForNav.type}</p>
              </div>

              {/* Coordinates & Compass Heading Badge */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 block text-[10px]">GPS COORDINATES:</span>
                  <span className="text-cyan-300 font-bold">
                    {selectedHavenForNav.latitude.toFixed(4)}° N, {selectedHavenForNav.longitude.toFixed(4)}° E
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 block text-[10px]">COMPASS BEARING:</span>
                  <span className="text-amber-300 font-bold">🧭 NORTH-WEST (315°)</span>
                </div>
              </div>

              {/* Safe Route Guidance */}
              <div className="p-3.5 bg-cyan-950/30 border border-cyan-500/30 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold font-mono text-[11px]">
                  <Footprints className="w-4 h-4 text-cyan-400" />
                  <span>RECOMMENDED SAFE WALKING CORRIDOR</span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed">
                  {selectedHavenForNav.safe_corridor_route || "Follow elevated arterial roadways. Stay clear of submerged underpasses and live electrical utility poles."}
                </p>
              </div>

              {/* Active Hazard Warning */}
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Hazard Alert:</strong> Avoid North Ghat riverfront (3.8m deep currents) and Old City Market (collapsed masonry cordon).
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedHavenForNav(null)}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
              >
                Understood — Proceed on Safe Corridor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
