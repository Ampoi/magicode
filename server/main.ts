import { createServer } from "./infra/socket.io";

const ableToJoinList: { [key: string]: true } = {}

createServer(9648, (io, socket) => {
  const uid = socket.id

  //ほすと
  let clientID: string | null
  socket.on("ableToJoin", () => {
    socket.emit("roomID", uid)
    ableToJoinList[uid] = true
  })
  socket.on("answer", (newClientID: string, answer) => {
    clientID = newClientID
    io.to(clientID).emit("answer", answer, uid)
  })
  
  //くらいあんと
  let roomID: string | null
  socket.on("offer", (newRoomID: string, offer) => {
    roomID = newRoomID
    io.to(roomID).emit("offer", offer, uid)
  })
  socket.on("iceCandidates", (iceCandidates) => {
    if( !roomID ) throw new Error("roomIDがないっすよ")
    io.to(roomID).emit("iceCandidates", iceCandidates)
  })
}, {
  cors: {
      origin: "*",
      methods: ["GET", "POST"]
  }
})