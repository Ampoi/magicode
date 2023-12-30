import { Effect, Room, RoomData } from "./room";
import { socket } from "../infra/socket.io";
import { SendBody } from "../model/sendBody";
import { effect, join, lookAt, move, sendOffer, shoot, startGame, updateBodies, updatePlayerName, updateRoomData } from "./peer";

type PlayerName = "playerA" | "playerB";

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
  public abstract move(direction: "up" | "left" | "right"): void
  public abstract lookAt(x: number, y: number): void
  public abstract shoot(): void
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
  public move(direction: "up" | "left" | "right"): void {
    move.send(direction)
  }
  public lookAt(x: number, y: number): void {
    const data = JSON.stringify({ x, y })
    lookAt.send(data)
  }
  public shoot(): void {
    shoot.send("")
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

  private readonly roomPlayerID = "host"

  constructor() {
    super();

    socket.emit("ableToJoin");
    console.log("→ | 参加可能と連絡しました！")
    socket.on("roomID", (roomID) => {
      console.log("← | roomID[" + roomID + "]が割り当てられました！")
      this.roomID = roomID;
      this.join()
    });

    const guestID = "guest"

    join.addEventListener("message", () => {
      const playerName = this.room.join(
        guestID,
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
      const direction: "left" | "right" | "up" = data.data
      this.room.move(guestID, direction)
    })

    lookAt.addEventListener("message", (data) => {
      const point = JSON.parse(data.data)
      this.room.lookAt(guestID, point)
    })

    shoot.addEventListener("message", () => {
      this.room.shoot(guestID)
    })
  }

  public startGame(): void { this.room.start() }
  public move(direction: "up" | "left" | "right"): void { this.room.move(this.roomPlayerID, direction) }
  public lookAt(x: number, y: number): void { this.room.lookAt(this.roomPlayerID, { x, y }) }
  public shoot(): void { this.room.shoot(this.roomPlayerID) }
  public join(): void { this.playerName = this.room.join(
      this.roomPlayerID,
      this.updateBodies,
      this.updateRoomData,
      ( effect ) => { if( this.onEffect ){ this.onEffect(effect) } }
    )
  }
}