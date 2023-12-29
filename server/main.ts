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

  //くらいあんと
  let roomID: string | null
  socket.on("joinRoom", (newRoomID: string) => {
    if(ableToJoinList[newRoomID]){
      roomID = newRoomID
      console.log(roomID)
      io.to(roomID).emit("joinRooma", uid)
    }
  })
  socket.on("startGame", () => {
    if( !roomID ) return
    io.to(roomID).emit("startGame")
  })
  socket.on("move", (direction: "up" | "left" | "right") => {
    if( !roomID ) return
    io.to(roomID).emit("move", direction)
  })
  socket.on("lookAt", (x: number, y: number) => {
    if( !roomID ) return
    io.to(roomID).emit("lookAt", x, y)
  })
  socket.on("shoot", () => {
    if( !roomID ) return
    io.to(roomID).emit("shoot")
  })

}, {
  cors: {
      origin: "*",
      methods: ["GET", "POST"]
  }
})