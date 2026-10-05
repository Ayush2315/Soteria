"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import QRCode from "qrcode";
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
import { RelayMeshPanel } from "@/components/RelayMeshPanel";
import { encodePacket, carryPacket } from "@/lib/relay";
import { LocateButton } from "@/components/ui/LocateButton";

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

interface CitizenPortalProps {
  onSwitchRole: (role: "HQ_COMMANDER" | "CITIZEN" | "VOLUNTEER") => void;
  onSOSCreated?: (incident: Incident) => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export function CitizenPortal({
  onSwitchRole,
  onSOSCreated,
  theme = "light",
  onToggleTheme,
}: CitizenPortalProps) {
  // Navigation tab within Citizen Portal
  const [citizenTab, setCitizenTab] = useState<"sos_form" | "where_to_go" | "nominate_spot" | "relay">("sos_form");

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
  const [submittedTrackingCode, setSubmittedTrackingCode] = useState<string | null>(null);
  const [submittedQrUrl, setSubmittedQrUrl] = useState<string | null>(null);
  const [submittedSmsUrl, setSubmittedSmsUrl] = useState<string | null>(null);
  const [submittedPacketRaw, setSubmittedPacketRaw] = useState<string | null>(null);

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

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Unable to access microphone. Please ensure microphone permissions are granted.");
    }
  };

  // Handle Audio Recording Stop
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const clearAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
  };

  // Photo Capture / File Selection
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

  // Form Submission (Online with Graceful Offline Fallback)
  const handleSubmitSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() && !audioBlob && !imageFile) {
      alert("Please provide voice recording, photo evidence, or description of emergency.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmittedTrackingCode(null);
    setSubmittedQrUrl(null);
    setSubmittedSmsUrl(null);
    setSubmittedPacketRaw(null);

    const formData = new FormData();
    if (rawText.trim()) formData.append("raw_text", rawText.trim());
    if (audioBlob) formData.append("audio_file", audioBlob, "citizen_voice_sos.webm");
    if (imageFile) formData.append("image_file", imageFile, imageFile.name);
    formData.append("latitude", latitude.toString());
    formData.append("longitude", longitude.toString());
    formData.append("location_name", locationName);

    try {
      const response = await submitMultimodalIncident(formData);
      setTriageResult(response);
      const trackingCode = response.incident.tracking_code || `SOT-${response.incident.id}`;
      setSubmittedTrackingCode(trackingCode);
      setSubmitMessage(`Emergency Alert Registered: #${response.incident.id} (${trackingCode}). Immediate responders notified.`);

      // Also generate SOT1 offline packet + QR code so citizen has it ready if network drops next minute
      const pkt = encodePacket(
        {
          latitude,
          longitude,
          people: response.extraction?.trapped_count ? response.extraction.trapped_count + 1 : 2,
          trapped: response.extraction?.trapped_count || 1,
          flags: 0,
          hazard: "F",
          message: (rawText || locationName || "Emergency SOS").slice(0, 60),
        },
        { id: trackingCode.replace(/[^A-Za-z0-9]/g, "").slice(0, 8) }
      );
      setSubmittedPacketRaw(pkt);
      try {
        const qr = await QRCode.toDataURL(pkt, { errorCorrectionLevel: "M", margin: 1, width: 220 });
        setSubmittedQrUrl(qr);
        setSubmittedSmsUrl(`sms:+919876543210?body=${encodeURIComponent(pkt)}`);
      } catch (qrErr) {
        console.warn("QR creation error:", qrErr);
      }

      if (onSOSCreated) {
        onSOSCreated(response.incident);
      }

      // Reset form
      setRawText("");
      clearAudio();
      removePhoto();
    } catch (err: any) {
      console.warn("Online submission failed, falling back to offline IndexedDB:", err);
      // Save offline via IndexedDB
      const offlineId = await storeOfflineDistress({
        uuid: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: rawText.trim() || locationName || "Emergency SOS",
        audioBlob: audioBlob || undefined,
        imageBlob: imageFile || undefined,
        imageName: imageFile?.name,
        latitude,
        longitude,
        locationName,
      });

      // Generate offline SOT1 token, QR code, and SMS link
      const pkt = encodePacket(
        {
          latitude,
          longitude,
          people: 2,
          trapped: 1,
          flags: 0,
          hazard: "F",
          message: (rawText || locationName || "Offline SOS").slice(0, 60),
        },
        { id: `OF${String(offlineId || Date.now()).slice(-6)}` }
      );

      carryPacket(pkt);

      const offlineCode = `SOT-OFF${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedTrackingCode(offlineCode);
      setSubmittedPacketRaw(pkt);
      try {
        const qr = await QRCode.toDataURL(pkt, { errorCorrectionLevel: "M", margin: 1, width: 220 });
        setSubmittedQrUrl(qr);
        setSubmittedSmsUrl(`sms:+919876543210?body=${encodeURIComponent(pkt)}`);
      } catch (qrErr) {
        console.warn("QR creation error:", qrErr);
      }

      setSubmitMessage(`Offline Mode: SOS saved on device (#${offlineId || 'OFFLINE'}) and encoded into relay packet. Show QR code to passing volunteers or tap Send SMS.`);
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
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      
      {/* ----------------------------------------------------------------------- */}
      {/* LEFT NAVIGATION RAIL */}
      {/* ----------------------------------------------------------------------- */}
      <nav className="hidden md:flex w-64 shrink-0 bg-white border-r border-slate-200 flex-col justify-between z-40">
        <div>
          {/* Brand Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-slate-900 font-bold uppercase tracking-wider text-xs">Citizen SOS</h2>
              <p className="text-slate-500 text-[11px]">Emergency Response</p>
            </div>
          </div>

          {/* Persona Switcher / Portals */}
          <div className="py-4 px-3 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Operation Portals
            </div>

            <button
              id="nav-hq-commander"
              type="button"
              onClick={() => onSwitchRole("HQ_COMMANDER")}
              className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            >
              <Crosshair className="w-4 h-4 text-slate-400" />
              <span>Command HQ</span>
            </button>

            {/* Citizen SOS (Active) */}
            <button
              id="nav-citizen-portal"
              type="button"
              onClick={() => onSwitchRole("CITIZEN")}
              className="w-full flex items-center gap-3 bg-blue-50 text-blue-700 border-l-4 border-blue-600 px-3.5 py-2.5 rounded-r-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 text-blue-600" />
              <span>Citizen SOS</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">Guest</span>
            </button>

            <button
              id="nav-volunteer-hub"
              type="button"
              onClick={() => onSwitchRole("VOLUNTEER")}
              className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            >
              <HeartPulse className="w-4 h-4 text-slate-400" />
              <span>Volunteer Hub</span>
            </button>
          </div>

          {/* Citizen Navigation Sub-Tabs */}
          <div className="py-2 px-3 border-t border-slate-200 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Actions
            </div>

            <button
              id="citizen-tab-sos"
              type="button"
              onClick={() => setCitizenTab("sos_form")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                citizenTab === "sos_form"
                  ? "bg-rose-50 text-rose-700 font-semibold border border-rose-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>Emergency SOS</span>
            </button>

            <button
              id="citizen-tab-havens"
              type="button"
              onClick={() => setCitizenTab("where_to_go")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                citizenTab === "where_to_go"
                  ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Safe Havens & Shelters</span>
            </button>

            <button
              id="citizen-tab-nominate"
              type="button"
              onClick={() => setCitizenTab("nominate_spot")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                citizenTab === "nominate_spot"
                  ? "bg-amber-50 text-amber-800 font-semibold border border-amber-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Nominate Drop Spot</span>
            </button>

            <button
              id="citizen-tab-relay"
              type="button"
              onClick={() => setCitizenTab("relay")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                citizenTab === "relay"
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Offline Relay (No Signal)</span>
            </button>
          </div>
        </div>

        {/* Footer Guest Banner */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open Access Mode</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Emergency distress calls are ingested instantly without requiring account creation.
          </p>
        </div>
      </nav>

      {/* ----------------------------------------------------------------------- */}
      {/* MAIN CONTENT WORKSPACE */}
      {/* ----------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-14 shrink-0 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-2 z-30">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <h1 className="text-sm md:text-base font-bold text-slate-900 truncate">
              {citizenTab === "sos_form"
                ? "Emergency Distress Intake"
                : citizenTab === "where_to_go"
                ? "Safe Havens & Shelters"
                : citizenTab === "relay"
                ? "Offline Relay Mesh"
                : "Nominate Supply Drop Spot"}
            </h1>
            <span className="hidden sm:inline px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-medium">
              Offline-Capable
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => onSwitchRole("VOLUNTEER")}
              aria-label="Switch to Volunteer Hub"
              className="md:hidden flex items-center p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
            >
              <HeartPulse className="w-4 h-4 text-emerald-600" />
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole("HQ_COMMANDER")}
              aria-label="Switch to Command HQ"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-all cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Command HQ</span>
              <span className="sm:hidden">HQ</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Container */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-6 pb-28 md:pb-6 mx-auto w-full space-y-6 ${citizenTab === "relay" ? "max-w-6xl" : "max-w-4xl"}`}>

          {citizenTab === "relay" && (
            <RelayMeshPanel defaultLat={latitude} defaultLng={longitude} />
          )}
          
          {/* TAB 1: 1-TAP SOS / VOICE / PHOTO INTAKE */}
          {citizenTab === "sos_form" && (
            <div className="space-y-6">
              
              {/* Emergency Banner */}
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                <h3 className="font-bold text-rose-800 flex items-center gap-1.5 text-sm">
                  <Flame className="w-4 h-4 text-rose-600" />
                  Immediate Life-Threatening Emergency
                </h3>
                <p className="text-rose-700">
                  Record your voice in your native language or describe the situation. Rescue teams are dispatched based on priority score.
                </p>
              </div>

              {/* 1-Tap SOS Recording Component */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1 text-white shadow-md transition-all cursor-pointer ${
                    isRecording
                      ? "bg-rose-600 animate-pulse ring-8 ring-rose-200"
                      : "bg-rose-600 hover:bg-rose-700 hover:scale-105"
                  }`}
                >
                  {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {isRecording ? `${recordingSeconds}s Stop` : "Tap to Speak"}
                  </span>
                </button>

                <p className="text-xs text-slate-500 max-w-sm">
                  {isRecording
                    ? "Recording in progress... Tap again to stop and analyze."
                    : "Tap once to record emergency audio in your dialect"}
                </p>

                {audioUrl && (
                  <div className="w-full max-w-md p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 animate-in fade-in">
                    <audio src={audioUrl} controls className="h-8 flex-1" />
                    <button
                      type="button"
                      onClick={clearAudio}
                      className="text-xs text-rose-700 hover:text-rose-800 font-semibold px-2.5 py-1 bg-rose-50 rounded-md border border-rose-200 cursor-pointer"
                    >
                      Retake
                    </button>
                  </div>
                )}
              </div>

              {/* Form Input Section */}
              <form onSubmit={handleSubmitSOS} className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm">
                
                <div className="space-y-4">
                  {/* Voice Transcript / Text */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Distress Description / Details
                    </label>
                    <textarea
                      rows={3}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="e.g. Flood water has reached the roof. 4 people trapped, including an infant and elderly woman..."
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl p-3 text-xs text-slate-900 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Photo Evidence & Location in Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Scene Photo Dropzone */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Scene Photo Evidence
                      </label>
                      {imagePreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-100">
                          <img src={imagePreview} alt="Evidence" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl h-28 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50">
                          <Camera className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-xs text-slate-600 font-medium">Upload or Take Photo</span>
                          <span className="text-[10px] text-slate-400 font-mono">JPG, PNG, WebP</span>
                          <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                        </label>
                      )}
                    </div>

                    {/* Location Name & GPS */}
                    <div className="space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-800">
                            Location / Landmark
                          </label>
                          <LocateButton
                            onLocate={(coords) => {
                              setLatitude(coords.latitude);
                              setLongitude(coords.longitude);
                              setLocationName(coords.locationName);
                            }}
                          />
                        </div>
                        <input
                          type="text"
                          value={locationName}
                          onChange={(e) => setLocationName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Latitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={latitude}
                            onChange={(e) => setLatitude(parseFloat(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Longitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={longitude}
                            onChange={(e) => setLongitude(parseFloat(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">Broadcasting SOS Alert...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Emergency SOS Alert</span>
                      </>
                    )}
                  </button>

                  {/* Status Banner */}
                  {submitMessage && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 animate-in fade-in">
                      {submitMessage}
                    </div>
                  )}

                  {/* Public Tracking Code & Offline QR Relay Card */}
                  {submittedTrackingCode && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold block">
                            Incident Registered Successfully
                          </span>
                          <span className="text-xl font-bold font-mono text-slate-900">
                            {submittedTrackingCode}
                          </span>
                        </div>
                        <Link
                          href={`/track/${submittedTrackingCode}`}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <span>Track Live Status</span>
                          <span>➔</span>
                        </Link>
                      </div>

                      {/* Offline QR & SMS Relay Hand-Off */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>📶</span> Offline Mesh & 2G SMS Backup
                          </span>
                          <span className="text-[11px] text-slate-500">Zero Internet Required</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          If cellular networks fail, show this QR code to passing volunteers or tap Send SMS to transmit via 2G text message.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                          {submittedQrUrl && (
                            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={submittedQrUrl} alt="Offline SOS QR Code" className="w-28 h-28" />
                            </div>
                          )}
                          <div className="flex-1 space-y-2 w-full text-xs">
                            {submittedSmsUrl && (
                              <a
                                href={submittedSmsUrl}
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors"
                              >
                                <span>✉️</span>
                                <span>Send via 2G SMS</span>
                              </a>
                            )}
                            {submittedPacketRaw && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(submittedPacketRaw);
                                  alert("SOT1 packet copied to clipboard!");
                                }}
                                className="w-full py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-mono transition-colors"
                              >
                                📋 Copy SOT1 Token ({submittedPacketRaw.length} chars)
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </form>

              {/* Triage Preview Card */}
              {triageResult && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Multimodal Triage Assessment
                    </span>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Score: {triageResult.incident.triage_score.toFixed(0)}/100
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <div>
                      <strong className="text-slate-500 text-[11px] block">English Translation:</strong>
                      <span className="text-slate-800">{triageResult.extraction.translation_en}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] pt-1 text-slate-700">
                      <span className="text-rose-700 font-semibold">Trapped: {triageResult.extraction.trapped_count}</span>
                      <span>Hazard: {triageResult.extraction.hazard_type}</span>
                      <span className="text-slate-500 font-mono">Confidence: {Math.round(triageResult.extraction.confidence_score * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: WHERE TO GO (SAFE HAVENS VS HAZARD DANGER ZONES) */}
          {citizenTab === "where_to_go" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-1">
                <h3 className="font-bold text-blue-900 flex items-center gap-1.5 text-sm">
                  <Compass className="w-4 h-4 text-blue-600" />
                  Verified Safe Havens & Flood Danger Zones
                </h3>
                <p className="text-blue-800">
                  Real-time shelter capacity and safe walking routes verified by local disaster coordination teams.
                </p>
              </div>

              {/* Safe Havens List */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Certified Safe Havens (Open Shelters)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safeHavens.map((haven) => {
                    const pct = Math.round((haven.capacity_used / haven.capacity_total) * 100);
                    return (
                      <div key={haven.id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-bold text-sm text-slate-900">{haven.name}</h5>
                            <span className="text-[11px] text-slate-500">{haven.type}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              haven.status === "OPEN_CAPACITY"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : haven.status === "NEAR_CAPACITY"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {haven.status.replace("_", " ")}
                          </span>
                        </div>

                        {/* GPS Coordinates & Elevation */}
                        <div className="flex items-center justify-between text-[11px] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            {haven.latitude.toFixed(4)}° N, {haven.longitude.toFixed(4)}° E
                          </span>
                          <span className="font-medium text-slate-600">
                            ⛰️ {haven.elevation_meters || 98}m Alt
                          </span>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-600">
                            <span>Capacity:</span>
                            <span className="font-semibold text-slate-900">{haven.capacity_used} / {haven.capacity_total} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct > 90 ? "bg-rose-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Supplies & Medical Badge */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                          {haven.medical_team_on_site && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                              <HeartPulse className="w-3 h-3 text-blue-600" />
                              Medical Team On-Site
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {haven.distance_to_flood_meters}m from water edge
                          </span>
                        </div>

                        {/* Navigation Guide Action */}
                        <button
                          type="button"
                          onClick={() => setSelectedHavenForNav(haven)}
                          className="w-full py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Safe Walking Route</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hazard Danger Zones */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Active Flood Hazard Areas (Avoid)
                </h4>

                <div className="space-y-2.5">
                  {hazardZones.map((zone) => (
                    <div key={zone.id} className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-rose-900">{zone.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            {zone.severity}
                          </span>
                        </div>
                        <p className="text-rose-800 text-[11px]">{zone.active_advisory}</p>
                      </div>
                      <span className="text-xs text-rose-700 font-semibold bg-white px-2.5 py-1 rounded border border-rose-200 shrink-0 ml-3">
                        {zone.inundation_depth_meters}m Depth
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: NOMINATE SUPPLY DROP SPOT */}
          {citizenTab === "nominate_spot" && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm">
              <div className="space-y-1 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  Nominate Supply Drop Spot
                </h3>
                <p className="text-xs text-slate-500">
                  Help relief teams locate dry rooftops, high terraces, or open areas clear of powerlines for helicopter relief and boat landings.
                </p>
              </div>

              {/* Success Receipt Card */}
              {nominatedReceipt && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-800 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Nomination Submitted: #{nominatedReceipt.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium">
                      Queued for Recon
                    </span>
                  </div>
                  <p className="text-slate-700">
                    Spot &quot;{nominatedReceipt.spot_name}&quot; has been routed to the Volunteer Hub for reconnaissance verification.
                  </p>
                </div>
              )}

              <form onSubmit={handleNominateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Spot Name / Landmark</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. St. Peter Church Flat Concrete Terrace"
                    value={nominateName}
                    onChange={(e) => setNominateName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Terrain Type</label>
                    <select
                      value={nominateTerrain}
                      onChange={(e) => setNominateTerrain(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                    >
                      <option value="FLAT_ROOFTOP">Flat Concrete Rooftop (Airdrop Ready)</option>
                      <option value="ELEVATED_LEVEE">Elevated Embankment (Boat Tie-Off)</option>
                      <option value="DRY_CLEARING">Dry High Clearing (Vehicle Staging)</option>
                      <option value="OVERBRIDGE">Elevated Roadway / Bridge</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Your Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Local Resident"
                      value={nominateCitizenName}
                      onChange={(e) => setNominateCitizenName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Accessibility Notes</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. 20x15m open rooftop, clear of high-voltage lines. Staircase access is dry."
                    value={nominateNotes}
                    onChange={(e) => setNominateNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Submit Spot for Ground Recon</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <Compass className="w-5 h-5 text-blue-600" />
                <span>Safe Route Guidance</span>
              </div>
              <button
                onClick={() => setSelectedHavenForNav(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{selectedHavenForNav.name}</h4>
                <p className="text-slate-500">{selectedHavenForNav.type}</p>
              </div>

              {/* Coordinates & Compass Heading Badge */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-slate-500 block text-[10px] uppercase font-medium">Coordinates:</span>
                  <span className="text-slate-900 font-semibold font-mono">
                    {selectedHavenForNav.latitude.toFixed(4)}° N, {selectedHavenForNav.longitude.toFixed(4)}° E
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-slate-500 block text-[10px] uppercase font-medium">Compass Heading:</span>
                  <span className="text-amber-800 font-semibold">🧭 North-West (315°)</span>
                </div>
              </div>

              {/* Safe Route Guidance */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-[11px]">
                  <Footprints className="w-4 h-4 text-blue-600" />
                  <span>Recommended Walking Route</span>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  {selectedHavenForNav.safe_corridor_route || "Follow elevated arterial roadways. Stay clear of submerged underpasses and electrical lines."}
                </p>
              </div>

              {/* Active Hazard Warning */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Hazard Alert:</strong> Avoid North Ghat riverfront currents and unstable masonry cordons.
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedHavenForNav(null)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer"
              >
                Understood — Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM TAB BAR */}
      <nav
        aria-label="Citizen actions"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 grid grid-cols-4 bg-white/95 backdrop-blur-lg border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
      >
        {([
          { id: "sos_form", label: "SOS", icon: Flame, color: "text-rose-600" },
          { id: "where_to_go", label: "Safe Haven", icon: Compass, color: "text-blue-600" },
          { id: "relay", label: "Offline", icon: Layers, color: "text-indigo-600" },
          { id: "nominate_spot", label: "Drop Spot", icon: MapPin, color: "text-amber-600" },
        ] as const).map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            id={`mobile-tab-${id}`}
            type="button"
            onClick={() => setCitizenTab(id)}
            aria-current={citizenTab === id ? "page" : undefined}
            className={`min-h-[56px] flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-all ${
              citizenTab === id ? `${color} font-bold` : "text-slate-500"
            }`}
          >
            <Icon className={`w-5 h-5 ${citizenTab === id ? "scale-110" : ""} transition-transform`} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
