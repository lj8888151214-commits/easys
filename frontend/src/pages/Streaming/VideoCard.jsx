import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

function MapRefresher() {
  const map = useMap();
  useEffect(() => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }
  }, [map]);
  return null;
}

export function VideoCard({ label, nickname, isLocal, stream, position, onStartCam, onStartScreen, onStop, shareMode, isSttActive, toggleStt }) {
  const videoRef = useRef(null);
  const currentPos = position && position.length === 2 ? position : [37.4563, 126.7052];
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
      if (stream) {
        videoRef.current.play().catch((err) => {
          console.log("비디오 재생 재시도:", err);
        });
      }
    }
  }, [stream]);

  useEffect(() => {
    if (!stream) return;

    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stream]);

  return (
    <div
      className="cam-card"
      style={isZoomed ? {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) scale(1.2)",
        width: "80vw",
        maxWidth: "900px",
        zIndex: 9999,
        background: "#fff",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
      } : {}}
    >
      <div className="cam-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span className={`cam-badge ${isLocal ? (stream ? "badge-local" : "badge-empty") : (stream ? "badge-remote" : "badge-empty")}`}>
            ● {isLocal ? (stream ? "내 화면 송출중" : "내 슬롯") : (stream ? "화면 수신중" : "대기중")}
          </span>
          <h4>{label}</h4>
        </div>
        <button
          type="button"
          onClick={() => setIsZoomed((prev) => !prev)}
          style={{
            background: isZoomed ? "#ff4d4f" : "#243329",
            color: "#fff",
            border: "none",
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            cursor: "pointer"
          }}
        >
          {isZoomed ? "축소 ✕" : "🔍 확대"}
        </button>
      </div>

      <div className="cam-video-wrapper">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          onLoadedMetadata={(e) => {
            e.target.play().catch(() => {});
          }}
          className={`cam-stream-img ${!stream ? "cam-empty-view" : ""}`}
          style={isZoomed ? { height: "450px", objectFit: "contain" } : {}}
        />

        <div className="cam-video-nickname-overlay">
          👤 {nickname || "참가자"}
        </div>
      </div>

      {!isZoomed && (
        <div className="card-mini-map-wrapper" style={{ marginTop: "10px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#444", marginBottom: "4px" }}>
            📍 위치: {nickname || "참가자"}
          </div>
          <div className="card-mini-map-container" style={{ height: "110px", position: "relative", borderRadius: "8px", overflow: "hidden", background: "#eef2ef" }}>
            <MapContainer
              key={`map-${nickname}-${currentPos[0]}-${currentPos[1]}`}
              center={currentPos}
              zoom={13}
              style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
              zoomControl={false}
              dragging={false}
              scrollWheelZoom={false}
            >
              <MapRefresher />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={currentPos}>
                <Popup>{nickname || "참가자"}님의 위치</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {isLocal && (
        <div className="cam-btn-group">
          <button
            type="button"
            className={`btn-custom btn-primary-cam ${shareMode === "camera" ? "active" : ""}`}
            onClick={onStartCam}
          >
            📷 웹캠
          </button>
          <button
            type="button"
            className={`btn-custom btn-desktop-cam ${shareMode === "screen" ? "active" : ""}`}
            onClick={onStartScreen}
          >
            🖥️ 화면 공유
          </button>
          <button
            type="button"
            className={`btn-custom ${isSttActive ? "btn-stt-on" : "btn-stt-off"}`}
            onClick={toggleStt}
            title="말하는 내용이 채팅창에 자동 타이핑됩니다"
          >
            {isSttActive ? "🎙️ 자막 ON" : "🎙️ 자막 OFF"}
          </button>
          <button
            type="button"
            className="btn-custom btn-disconnect-cam"
            onClick={onStop}
            disabled={shareMode === "idle"}
          >
            🔌 끄기
          </button>
        </div>
      )}
    </div>
  );
}