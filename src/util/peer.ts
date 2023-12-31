import { reactive } from "vue";
import { socket } from "../infra/socket.io";

const peer = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ]
});

export const join             = peer.createDataChannel("join",              { negotiated: true, id: 0 })
export const updateRoomData   = peer.createDataChannel("updateRoomData",    { negotiated: true, id: 1 })
export const updateBodies     = peer.createDataChannel("updateBodies",      { negotiated: true, id: 2 })
export const updatePlayerName = peer.createDataChannel("updatePlayerName",  { negotiated: true, id: 3 })
export const startGame        = peer.createDataChannel("startGame",         { negotiated: true, id: 4 })
export const move             = peer.createDataChannel("move",              { negotiated: true, id: 5 })
export const lookAt           = peer.createDataChannel("lookAt",            { negotiated: true, id: 6 })
export const shoot            = peer.createDataChannel("shoot",             { negotiated: true, id: 7 })
export const effect           = peer.createDataChannel("effect",            { negotiated: true, id: 8 })
export const useCard          = peer.createDataChannel("useCard",           { negotiated: true, id: 9 })

const iceCandidates: RTCIceCandidate[] = [];
peer.addEventListener("icecandidate", (event) => {
  if (event.candidate === null) return;
  iceCandidates.push(event.candidate);
});

//くらいあんと
export async function sendOffer(roomID: string){
  const offer = await peer.createOffer()
  await peer.setLocalDescription(offer)
  socket.emit("offer", roomID, offer)
  console.log("→ | offerを送信しました")
}

//ほすと
socket.on("offer", async (offer: RTCSessionDescriptionInit, uid: string) => {
  console.log("← | offerを受信しました")
  await sendAnswer(offer, uid)
})

async function sendAnswer(offer: RTCSessionDescriptionInit, uid: string){
  await peer.setRemoteDescription(offer)
  const answer = await peer.createAnswer()
  await peer.setLocalDescription(answer)
  socket.emit("answer", uid, answer)
  console.log("→ | answerを送信しました")
}

const iceGathering = new Promise((resolve) => {
  const interval = setInterval(() => {
    if (peer.iceGatheringState == "complete") {
        clearInterval(interval);
        resolve(undefined);
    }
  }, 100);
})

socket.on("answer", async (answer: RTCSessionDescriptionInit) => {
  console.log("← | answerを受信しました")
  await peer.setRemoteDescription(answer)
  iceGathering.then(() => {
    console.log("→ | ICE Candidatesを送信しました")
    socket.emit("iceCandidates", iceCandidates)
  })
})

socket.on("iceCandidates", async (remoteIceCandidates: RTCIceCandidateInit[]) => {
  console.log("← | ICE Candidatesを受信しました")
  for( const iceCandidate of remoteIceCandidates ){
    await peer.addIceCandidate(iceCandidate)
  }
})

export const rtcState = reactive<{
  iceGathering: RTCIceGatheringState
  peerConnection: RTCPeerConnectionState
  signaling: RTCSignalingState
}>({
  iceGathering: peer.iceGatheringState,
  peerConnection: peer.connectionState,
  signaling: peer.signalingState
})

function registerPeerConnectionListeners() {
  peer.addEventListener('icegatheringstatechange', () => {
    console.log(`ICE gathering state change: ${peer.iceGatheringState}`);
    rtcState.iceGathering = peer.iceGatheringState
  });

  peer.addEventListener('connectionstatechange', () => {
    console.log(`Connection state change: ${peer.connectionState}`);
    rtcState.peerConnection = peer.connectionState
  });

  peer.addEventListener('signalingstatechange', () => {
    console.log(`Signaling state change: ${peer.signalingState}`);
    rtcState.signaling = peer.signalingState
  });
}

registerPeerConnectionListeners()

export { socket }