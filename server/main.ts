import { createServer } from "./infra/socket.io";

const ableToJoinList: { [key: string]: true } = {}

createServer(9648, (io, socket) => {
  const uid = socket.id

  //ほすと
  socket.on("ableToJoin", () => {
    socket.emit("roomID", uid)
    ableToJoinList[uid] = true
  })
  socket.on("updateBodies", (uid, bodies) => io.to(uid).emit("updateBodies", bodies))
  socket.on("updateRoomData", (uid, bodies) => io.to(uid).emit("updateRoomData", bodies))
  socket.on("newPlayerName", (uid, playerName) => io.to(uid).emit("updatePlayerName", playerName))

  //くらいあんと
  let roomID: string | null
  socket.on("joinRoom", (newRoomID: string) => {
    if(ableToJoinList[newRoomID]){
      roomID = newRoomID
      io.to(roomID).emit("joinRoom", uid)
    }
  })
  socket.on("startGame", () => {
    if( !roomID ) return
    io.to(roomID).emit("startGame", uid)
  })
  socket.on("move", (direction: "up" | "left" | "right") => {
    if( !roomID ) return
    io.to(roomID).emit("move", uid, direction)
  })
  socket.on("lookAt", (x: number, y: number) => {
    if( !roomID ) return
    io.to(roomID).emit("lookAt", uid, x, y)
  })
  socket.on("shoot", () => {
    if( !roomID ) return
    io.to(roomID).emit("shoot", uid)
  })

}, {
  cors: {
      origin: "*",
      methods: ["GET", "POST"]
  }
})