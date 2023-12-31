import { Room, RoomData } from "./room";
import { Effect } from "../model/callBack"
import { socket } from "../infra/socket.io";
import { SendBody } from "../model/sendBody";
import { effect, join, lookAt, move, sendOffer, shoot, startGame, updateBodies, updatePlayerName, updateRoomData, useCard } from "./peer";
import { PlayerName } from "../model/playerName"
import { Direction } from "../model/direction";
import { Card } from "../model/card";

export abstract class Main {
  public bodies: SendBody[] | null = null;
  public updateBodies(newBodies: SendBody[]) {
    this.bodies = newBodies;
  }

  public playerName: PlayerName | undefined;
  public roomData: RoomData | null = null;
  public updateRoomData(newRoomData: RoomData) {
    this.roomData = newRoomData;
  }

  constructor() {
    this.updateBodies = this.updateBodies.bind(this);
    this.updateRoomData = this.updateRoomData.bind(this);
  }

  public onEffect: ((effect: Effect) => void) | null = null

  public abstract startGame(): void
  public abstract move(direction: Direction): void
  public abstract lookAt(x: number, y: number): void
  public abstract shoot(): void
  public abstract useCard(cardName: Card["name"]): void
  public abstract join(roomID: string): void
}

export class Client extends Main {
  constructor() {
    super()

    updateBodies.addEventListener("message", (data) => {
      const bodies: SendBody[] = JSON.parse(data.data)
      this.updateBodies(bodies)
    })
    updateRoomData.addEventListener("message", (data) => {
      const roomData: RoomData = JSON.parse(data.data)
      this.updateRoomData(roomData)
    })
    updatePlayerName.addEventListener("message", (data) => {
      const newPlayerName: PlayerName = data.data
      this.playerName = newPlayerName
    })
    effect.addEventListener("message", (data) => {
      const effectData: Effect = JSON.parse(data.data)
      if( this.onEffect ){
        this.onEffect(effectData)
      }
    })
  }

  public startGame(): void {
    startGame.send("")
  }
  public move(direction: Direction): void {
    move.send(direction)
  }
  public lookAt(x: number, y: number): void {
    const data = JSON.stringify({ x, y })
    lookAt.send(data)
  }
  public shoot(): void {
    shoot.send("")
  }
  public useCard(cardName: Card["name"]): void {
    useCard.send(cardName)
  }
  public async join(roomID: string) {
    await sendOffer(roomID)
    join.addEventListener("open", () => {
      join.send("")
    })
  }
}

export class Host extends Main {
  private readonly room = new Room();
  public roomID: string | null = null;

  constructor() {
    super();

    socket.emit("ableToJoin");
    console.log("→ | 参加可能と連絡しました！")
    socket.on("roomID", (roomID) => {
      console.log("← | roomID[" + roomID + "]が割り当てられました！")
      this.roomID = roomID;
      this.join()
    });

    join.addEventListener("message", () => {
      const playerName = this.room.join(
        (bodies) => {
          const data = JSON.stringify(bodies)
          updateBodies.send(data)
        },
        (roomData) => {
          const data = JSON.stringify(roomData)
          updateRoomData.send(data)
        },
        (effectData) => {
          const data = JSON.stringify(effectData)
          effect.send(data)
        }
      )
      updatePlayerName.send(playerName)
    })

    startGame.addEventListener("message", () => {
      this.room.start()
    })

    move.addEventListener("message", (data) => {
      const direction: Direction = data.data
      this.room.move("playerB", direction)
    })

    lookAt.addEventListener("message", (data) => {
      const point = JSON.parse(data.data)
      this.room.lookAt("playerB", point)
    })

    shoot.addEventListener("message", () => {
      this.room.shoot("playerB")
    })

    useCard.addEventListener("message", (data) => {
      const cardName: Card["name"] = data.data
      this.room.useCard("playerB", cardName)
    })
  }

  public join(): void {
    this.playerName = this.room.join(
      this.updateBodies,
      this.updateRoomData,
      ( effect ) => { if( this.onEffect ){ this.onEffect(effect) } }
    )
  }

  public startGame(): void                      { this.room.start() }
  public move(direction: Direction): void       { this.room.move("playerA", direction) }
  public lookAt(x: number, y: number): void     { this.room.lookAt("playerA", { x, y }) }
  public shoot(): void                          { this.room.shoot("playerA"); console.log("aa"); }
  public useCard(cardName: Card["name"]): void  { this.room.useCard("playerA", cardName) }
}