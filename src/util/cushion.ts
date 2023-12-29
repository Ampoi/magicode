import { Body } from 'matter-js'
import { Room, RoomData } from "./room"
import { socket } from "../infra/socket.io"

export class Client {
  public bodies: Body[] | null = null
  public updateBodies( newBodies: Body[] ){ console.log("hey!");this.bodies = newBodies }
  
  public playerName: "playerA" | "playerB" | undefined
  public roomData: RoomData | null = null
  public updateRoomData( newRoomData: RoomData ){ console.log("hey!");this.roomData = newRoomData }

  constructor(){
    this.updateBodies = this.updateBodies.bind(this);
    this.updateRoomData = this.updateRoomData.bind(this);

    socket.on("updateRoomData", this.updateRoomData)
    socket.on("updateBodies", this.updateBodies)
  }

  public startGame(): void {
      socket.emit("startGame")
  }
  public move(direction: "up" | "left" | "right"): void {
      socket.emit("move", direction)
  }
  public lookAt(x: number, y: number): void {
      socket.emit("lookAt", x, y)
  }
  public shoot(): void {
      socket.emit("shoot")
  }
  public join(roomID: string){
    socket.emit("joinRoom", roomID)
  }
}

export class Host extends Client {
  private readonly room = new Room()
  public roomID: string | null = null
  
  constructor(){
    super()
    
    socket.emit("ableToJoin")
    socket.on("roomID", (roomID) => {
      this.roomID = roomID
      this.join(roomID)
    })

    socket.on("joinRoom", (uid) => {
      this.room.join(
        uid,
        (bodies) => socket.emit("updateBodies", uid, bodies),
        (roomData) => socket.emit("updateRoomData", uid, roomData))
    })

    socket.on("startGame", () => this.room.start())
    socket.on("move", (uid: string, direction: "up" | "left" | "right") => this.room.move(uid, direction))
    socket.on("lookAt", (uid: string, x: number, y: number) => this.room.lookAt(uid, { x, y }))
    socket.on("shoot", (uid: string) => this.room.shoot(uid))
  }
}