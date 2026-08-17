"""
Real-Time WebSocket Connection Manager for SOTERIA Disaster Response.
Thread-safe, asynchronous broadcasting of emergency incidents, AI triage results, and dispatch updates.
"""
from typing import List, Optional, Set, Dict, Any
from datetime import datetime
import asyncio
import logging
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("soteria.websockets")


class ConnectionManager:
    """
    Manages active WebSocket connections from Commander dashboards, volunteer hubs, and citizen clients.
    Broadcasts real-time incident updates, urgency triage alerts, and spatial notifications.
    """

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        """
        Accepts incoming WebSocket connection, registers client, and sends handshake metadata.
        """
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)

        client_count = len(self.active_connections)
        logger.info(f"WebSocket client connected. Active connections: {client_count}")

        # Send welcome handshake
        try:
            await websocket.send_json(
                {
                    "event": "CONNECTED",
                    "message": "Connected to SOTERIA Real-Time Disaster Dispatch Stream",
                    "active_clients": client_count,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            )
        except Exception as e:
            logger.warning(f"Failed to send initial handshake to client: {e}")

    async def disconnect(self, websocket: WebSocket) -> None:
        """
        Removes disconnected or failed client socket safely.
        """
        async with self._lock:
            self.active_connections.discard(websocket)
        logger.info(
            f"WebSocket client disconnected. Remaining active: {len(self.active_connections)}"
        )

    async def broadcast_incident(
        self,
        event_type: str,
        incident_data: Dict[str, Any],
        triage_breakdown: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Broadcasts structured JSON payload to all connected clients.
        Prunes dead or unresponsive sockets automatically.
        """
        payload = {
            "event": event_type,  # e.g. "INCIDENT_CREATED", "INCIDENT_UPDATED", "TRIAGE_ALERT"
            "data": incident_data,
            "triage_breakdown": triage_breakdown,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Snapshot active connections to prevent modification during iteration
        async with self._lock:
            sockets_to_send = list(self.active_connections)

        if not sockets_to_send:
            logger.debug("No active WebSocket clients connected to receive broadcast.")
            return

        logger.info(
            f"Broadcasting [{event_type}] for Incident #{incident_data.get('id')} to {len(sockets_to_send)} clients."
        )

        stale_sockets: List[WebSocket] = []

        for socket in sockets_to_send:
            try:
                await socket.send_json(payload)
            except Exception as exc:
                logger.warning(f"Error sending payload to client, queueing for disconnect: {exc}")
                stale_sockets.append(socket)

        # Prune dead sockets
        if stale_sockets:
            async with self._lock:
                for dead_socket in stale_sockets:
                    self.active_connections.discard(dead_socket)
            logger.info(f"Pruned {len(stale_sockets)} stale WebSocket connections.")


# Singleton ConnectionManager Instance
ws_manager = ConnectionManager()
