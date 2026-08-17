"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Camera,
  UploadCloud,
  MapPin,
  Send,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Radio,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { submitMultimodalIncident, MultimodalTriageResponse } from "@/lib/api";

interface CitizenSOSFormProps {
  onTriageComplete?: (response: MultimodalTriageResponse) => void;
}

export function CitizenSOSForm({ onTriageComplete }: CitizenSOSFormProps) {
  // Input State
  const [text, setText] = useState("");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("25.4358");
  const [longitude, setLongitude] = useState("81.8463");
  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Clean up audio object URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl, imagePreviewUrl]);

  // Audio Recording Handlers
  const startRecording = async () => {
    try {
      setSubmitError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access denied:", err);
      setSubmitError("Microphone access denied. You can still type your SOS message or upload an audio file.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const deleteRecordedAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsPlayingAudio(false);
  };

  const togglePlayRecordedAudio = () => {
    if (!audioElementRef.current && audioUrl) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (audioElementRef.current) {
      if (isPlayingAudio) {
        audioElementRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioElementRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  // Image Selection Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreviewUrl(preview);
    }
  };

  const removeImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Audio File Upload Handler
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioBlob(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  // GPS Geolocation Auto-Detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setSubmitError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setSubmitError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geolocation lookup error:", err);
        setSubmitError("Unable to retrieve precise GPS coordinates. Defaulting to sector coordinates.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !audioBlob && !imageFile) {
      setSubmitError("Please enter a distress message, record a voice note, or attach a photo.");
      return;
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      setSubmitError("Please provide valid GPS coordinates.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      if (text.trim()) formData.append("text", text.trim());
      if (audioBlob) {
        const audioExt = audioBlob.type.includes("webm") ? "webm" : "wav";
        formData.append("audio", audioBlob, `voice_sos.${audioExt}`);
      }
      if (imageFile) {
        formData.append("image", imageFile, imageFile.name);
      }
      formData.append("latitude", latNum.toString());
      formData.append("longitude", lngNum.toString());
      if (locationName.trim()) formData.append("location_name", locationName.trim());
      formData.append("is_offline_cached", isOfflineCached.toString());

      const response = await submitMultimodalIncident(formData);

      setSubmitSuccess(true);
      if (onTriageComplete) {
        onTriageComplete(response);
      }

      // Reset fields
      setText("");
      deleteRecordedAudio();
      removeImage();
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err: any) {
      console.error("SOS Ingestion Error:", err);
      setSubmitError(err?.message || "Failed to submit distress signal. Please verify network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-indigo-500/40 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/15 text-red-400 rounded-xl border border-red-500/30">
            <Radio className="w-6 h-6 animate-pulse text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              Citizen Emergency SOS Portal
              <span className="text-[10px] font-mono uppercase bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full">
                Live GenAI Intake
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Multimodal voice note in regional dialect, photo capture, or text distress transmission
            </p>
          </div>
        </div>

        {/* Dead Zone Offline Simulator Toggle */}
        <button
          type="button"
          onClick={() => setIsOfflineCached(!isOfflineCached)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
            isOfflineCached
              ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10"
              : "bg-slate-800/80 text-slate-400 border-slate-700 hover:border-slate-600"
          }`}
          title="Simulate storing in local IndexedDB queue during dead-zone blackout"
        >
          {isOfflineCached ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" /> Mode: Cellular Dead-Zone (Cached)
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Network: Online Relay
            </>
          )}
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        
        {/* Modality Section 1: Voice Recording in Dialect */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-blue-400" />
            Voice SOS Note (Regional Dialects Supported)
          </label>

          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
            {!audioUrl ? (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all active:scale-95"
                  >
                    <Mic className="w-4 h-4" />
                    Record Voice Note
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-4 py-2.5 bg-red-600 animate-pulse text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/40 transition-all active:scale-95"
                  >
                    <Square className="w-4 h-4" />
                    Stop ({recordingDuration}s)
                  </button>
                )}

                <span className="text-xs text-slate-400">
                  {isRecording ? "Listening... Speak naturally in Hindi, Bhojpuri, etc." : "Or upload audio:"}
                </span>

                <input
                  type="file"
                  ref={audioFileInputRef}
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => audioFileInputRef.current?.click()}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
                >
                  <UploadCloud className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Recorded Audio Player & Clear Controls */
              <div className="flex items-center gap-3 w-full justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlayRecordedAudio}
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <div className="text-xs font-mono text-cyan-300">
                    Voice Note Ready ({recordingDuration > 0 ? `${recordingDuration}s` : "Attached"})
                  </div>
                </div>

                <button
                  type="button"
                  onClick={deleteRecordedAudio}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg text-xs transition-colors flex items-center gap-1"
                  title="Remove recorded audio"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-[11px]">Discard</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modality Section 2: Photo Capture / Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
            Disaster Scene Photo
          </label>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
          />

          {!imagePreviewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-indigo-500/70 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-900/50 hover:bg-indigo-950/10 flex flex-col items-center justify-center gap-1"
            >
              <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-400 mb-1">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-300">Click to Snap Photo or Upload Disaster Scene Image</span>
              <span className="text-[10px] text-slate-500">Supports JPEG, PNG, WebP for GenAI visual hazard triage</span>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-indigo-500/40 bg-slate-900 p-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={imagePreviewUrl}
                  alt="Disaster Scene Preview"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-700"
                />
                <div>
                  <p className="text-xs font-semibold text-white">{imageFile?.name || "Disaster Photo"}</p>
                  <p className="text-[10px] font-mono text-slate-400">
                    {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : "Attached"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg text-xs transition-colors"
                title="Remove photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modality Section 3: Text SOS Description */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Distress Message / Situation Brief
            </span>
            <span className="text-[10px] font-mono text-slate-500">Optional if voice/photo attached</span>
          </label>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="E.g., 3 people trapped on second floor roof due to rapidly rising flood water! Elderly grandmother needs insulin, current is strong near North Ghat..."
            className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Location & GPS Geolocation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="block text-xs font-mono text-slate-400 mb-1">Landmark / Sector Name</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="E.g., Sector 3, North Bridge"
              className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">GPS Latitude (WGS 84)</label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-mono text-slate-400">GPS Longitude</label>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isLocating}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isLocating ? "animate-spin" : ""}`} />
                {isLocating ? "Locating..." : "Auto-Detect"}
              </button>
            </div>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Alerts & Submission Feedback */}
        {submitError && (
          <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {submitSuccess && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Distress signal ingested, analyzed by Gemini Multimodal AI, and logged in PostGIS.</span>
          </div>
        )}

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={isSubmitting || isRecording}
          className="w-full py-4 px-5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black rounded-xl shadow-xl shadow-red-600/25 flex items-center justify-center gap-2.5 text-sm uppercase tracking-wider transition-all transform active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Transmitting & Running AI Multimodal Triage...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Transmit Multimodal Distress Signal</span>
            </>
          )}
        </button>

      </form>
    </div>
  );
}
