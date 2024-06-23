import { useRef, useEffect, useState } from "react";
import { TunnelIO, TunnelIOArgs, TunnelHookArgs } from "@ayushbobale/tunnel-io";

export type TunnelIOProps = { tunnelArgs: TunnelIOArgs };

export function useTunnelIO(args: TunnelIOProps) {
  const { tunnelArgs } = args;
  const tunnelIORef = useRef<TunnelIO | null>(null);
  const [tunnelState, setTunnelState] = useState<{
    localDescription: RTCSessionDescription | null;
    messages: string[];
  }>({ localDescription: null, messages: [] });

  const hookArgs: TunnelHookArgs = {
    cbs: {
      onicecandidate(e) {
        setTunnelState((prev) => ({ ...prev, localDescription: e }));
      },
      channelEvents: {
        onopen(e, channel) {
          console.log("Channel open : ", channel);
        },
        onmessage(e, channel) {
          setTunnelState((prev) => ({
            ...prev,
            messages: [...prev.messages, e.data],
          }));
          console.log("Message : ", e.data, channel);
        },
        onclose(e, channel) {
          console.log("Channel close : ", channel);
        },
      },
    },
  };

  function initialize(args: TunnelIOArgs) {
    tunnelIORef.current = new TunnelIO({ ...args, ...hookArgs });
  }

  function terminate() {
    tunnelIORef.current = null;
  }

  // public functions translated
  async function setPeer(offer: RTCSessionDescriptionInit) {
    let sdp = await tunnelIORef.current?.setPeer(offer);
    if (sdp) {
      setTunnelState((prev) => ({ ...prev, localDescription: sdp }));
    }
  }

  function sendMessage(msg: string) {
    tunnelIORef.current?.sendMessage(msg);
  }

  useEffect(() => {
    if (!tunnelIORef.current) {
      initialize(tunnelArgs);
    }
    return () => {};
  }, []);

  return {
    tunnelState,
    reInitalize: initialize,
    setPeer,
    sendMessage,
  };
}
