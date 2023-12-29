import { Room } from "./room"
import { Cushion } from "./cushion"
import { socket } from "../infra/socket.io"

export class Host extends Cushion {
  private room: Room = new Room()

  join(){
    if( this.playerName ) throw new Error("すでに部屋に入ってます")
    this.playerName = this.room.join(this.uid, this.updateBodies, this.updateRoomData)
    socket.emit("createRoom", this.uid)
  }

  startGame(){
    this.room.start()
  }

  move( direction: "up" | "left" | "right" ){
    this.room.move(this.uid, direction)
  }

  lookAt( x: number, y: number ){
    this.room.lookAt(this.uid, { x, y })
  }

  shoot(){
    this.room.shoot(this.uid)
  }
}