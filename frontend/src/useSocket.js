import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const BASE = import.meta.env.VITE_API_URL || "";

export function useSocket(handlers) {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    socketRef.current = io(BASE || window.location.origin, {
      transports: ["websocket", "polling"],
    });

    const s = socketRef.current;

    s.on("connect",    () => console.log("[WS] conectado"));
    s.on("disconnect", () => console.log("[WS] desconectado"));

    // Registra todos os handlers
    const events = [
      "pedido:novo", "pedido:status",
      "produto:criado", "produto:atualizado", "produto:removido",
      "marca:atualizada",
    ];
    events.forEach(ev => {
      s.on(ev, (data) => handlersRef.current?.[ev]?.(data));
    });

    return () => s.disconnect();
  }, []);

  return socketRef;
}
