import { createUID } from "./createUID"
import { Body } from 'matter-js'
import { RoomData } from "./room"

export abstract class Cushion {
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