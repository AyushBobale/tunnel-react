import { useRef, useEffect, useState } from "react";
import {
  TunnelIO,
  TunnelIOArgs,
  TunnelHookArgs,
  MessageType,
  FileShareProgessArgs,
  FileShareProgessFunc,
} from "@ayushbobale/tunnel-io";

export type UseTunnelIOProps = {
  videoRefs?: {
    local: React.RefObject<HTMLVideoElement>;
    remote: React.RefObject<HTMLVideoElement>;
  };
};
export type TunnelIOProps = { tunnelArgs: TunnelIOArgs & UseTunnelIOProps };

export function useTunnelIO(args: TunnelIOProps) {
  const { tunnelArgs } = args;
  const tunnelIORef = useRef<TunnelIO | null>(null);
  const [tunnelState, setTunnelState] = useState<{
    localDescription: RTCSessionDescription | null;
    messages: MessageType[];
  }>({ localDescription: null, messages: [] });
  const [fileShareProgress, setFileShareProgress] =
    useState<FileShareProgessArgs>({
      files: {},
    });

  const hookArgs: TunnelHookArgs = {
    cbs: {
      onicecandidate(e) {
        setTunnelState((prev) => ({ ...prev, localDescription: e }));
      },
      channelEvents: {
        onopen(e, channel) {
          console.log("Channel open : ", channel);
        },
        onmessage(e) {
          setTunnelState((prev) => ({
            ...prev,
            messages: e,
          }));
        },
        onclose(e, channel) {
          console.log("Channel close : ", channel);
        },
      },
      ontrack: (stream) => {
        if (
          tunnelArgs.videoRefs &&
          tunnelArgs.videoRefs.remote &&
          tunnelArgs.videoRefs.remote.current
        ) {
          tunnelArgs.videoRefs.remote.current.srcObject = stream;
        }
      },
      fileShareProgress: (progress) => setFileShareProgress(progress),
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
    const newMessages = tunnelIORef.current?.sendMessage(msg);
    if (newMessages) {
      setTunnelState((prev) => ({ ...prev, messages: newMessages }));
    }
  }

  async function setMediaDevicesVideo() {
    const stream = await tunnelIORef.current?.getMediaDevicesVideo();
    if (
      stream &&
      tunnelArgs.videoRefs &&
      tunnelArgs.videoRefs.local &&
      tunnelArgs.videoRefs.local.current
    ) {
      tunnelArgs.videoRefs.local.current.srcObject = stream;
    }
  }

  function sendFiles(files: FileList) {
    tunnelIORef.current?.sendFiles(files);
  }

  useEffect(() => {
    if (!tunnelIORef.current) {
      initialize(tunnelArgs);
    }
    return () => {};
  }, []);

  return {
    tunnelState,
    fileShareProgress,
    reInitalize: initialize,
    setPeer,
    sendMessage,
    setMediaDevicesVideo,
    sendFiles,
  };
}
