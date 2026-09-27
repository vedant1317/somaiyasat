import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Subscribes to the backend telemetry stream (one frame per simulated second)
 * and exposes a command sender for the ground-operator panel.
 */
export default function useTelemetry() {
  const [state, setState] = useState(null);
  const [status, setStatus] = useState('connecting'); // connecting | live | error
  const sourceRef = useRef(null);

  useEffect(() => {
    const source = new EventSource('/api/stream');
    sourceRef.current = source;

    source.onopen = () => setStatus('live');
    source.onmessage = (event) => {
      try {
        setState(JSON.parse(event.data));
        setStatus('live');
      } catch {
        // A malformed frame is not worth tearing the stream down for.
      }
    };
    source.onerror = () => setStatus('error');

    return () => source.close();
  }, []);

  const sendCommand = useCallback(async (action, payload = {}) => {
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (data.state) setState(data.state);
      return data;
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  return { state, status, sendCommand };
}
