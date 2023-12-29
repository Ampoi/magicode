import { createServer } from "./infra/socket.io";

const availableRoomIDs: string[] = []

createServer(9648, (socket) => {
  console.log("hello!")

  socket.on("createRoom", (uid: string) => {
    if( availableRoomIDs.includes(uid) ){
      console.log("すでに部屋は作成されてます")
    }else{
      availableRoomIDs.push(uid)
      socket.join(uid)
      console.log("新しい部屋が作成されました！")
      console.log("使用可能な部屋一覧：" + availableRoomIDs.join(","))
    }
  })
}, {
  cors: {
      origin: "*",
      methods: ["GET", "POST"]
  }
})