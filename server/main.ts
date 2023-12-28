import { SendBody } from "../model/sendBody"
import { createServer } from "./infra/socket.io"
import { createUID } from "./util/createUID";
import { Room } from "./util/room";

const rooms: { [key: string]: Room } = { a: new Room() };

createServer(9648, (socket) => {
    const uid = createUID()
    let joiningRoomID: string | undefined
    
    socket.on("joinRoom", (roomID: string) => {
        if( !uid ) throw new Error("uidが定められてません！")
        if( joiningRoomID ) throw new Error("すでに部屋に入ってます！")
        const player = rooms[roomID].join(uid, (bodies) => {
            const sendData: SendBody[] = bodies.map(({ angle, position, circleRadius, bounds, label }) => {
                return { angle, position, circleRadius, bounds, label }
            })
            socket.emit("updateData", sendData)
        })
        joiningRoomID = roomID
        console.log(`ユーザー[${uid}]が${roomID}に入室しました`)
        socket.emit("joinedRoom", roomID, player)
    })

    socket.on("leaveRoom", () => {
        console.log("aaa?")
        if( !joiningRoomID ) throw new Error("そもそも部屋に入っていません")
        rooms[joiningRoomID].leave(uid)
    })

    socket.on("start", () => {
        if( !joiningRoomID ) throw new Error("部屋に入ってません！")
        socket.emit("isGameStarted", true)
        console.log("ゲームが開始されました！")
        rooms[joiningRoomID].start()
    })

    socket.on("move", (direction: "up" | "left" | "right") => {
        if( !joiningRoomID ) throw new Error("部屋に入ってません！")
        if( !rooms[joiningRoomID].started ) throw new Error("ゲームは始まってません！")

        rooms[joiningRoomID].move(uid, direction)
    })

    socket.on("setAngle", (mouseX: number, mouseY: number) => {
        if( !joiningRoomID ) throw new Error("部屋に入ってません！")
        if( !rooms[joiningRoomID].started ) throw new Error("ゲームは始まってません！")

        rooms[joiningRoomID].lookAt(uid, { x: mouseX, y: mouseY })
    })
})