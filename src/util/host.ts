import { createUID } from "./createUID"
import { Room } from "./room"
import { Body } from 'matter-js';
import { RoomData } from "./room"

abstract class Cushion {
  readonly uid = createUID()

  public bodies: Body[] | null = null
  public updateBodies( newBodies: Body[] ){ this.bodies = newBodies }
  
  public roomData: RoomData | null = null
  public updateRoomData( newRoomData: RoomData ){ this.roomData = newRoomData }

  public playerName: "playerA" | "playerB" | undefined
  public abstract join(): void

  constructor(){
    this.updateBodies = this.updateBodies.bind(this);
    this.updateRoomData = this.updateRoomData.bind(this);
  }

  public abstract startGame(): void
  public abstract move( direction: "up" | "left" | "right" ): void
  public abstract lookAt( x: number, y: number ): void
  public abstract shoot(): void
}

export class Host extends Cushion {
  private room: Room = new Room()

  join(){
    this.room.join("a", ()=>{},()=>{})
    this.playerName = this.room.join(this.uid, this.updateBodies, this.updateRoomData)
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