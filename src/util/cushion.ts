import { Room, RoomData } from "./room";
import { socket } from "../infra/socket.io";
import { SendBody } from "../model/sendBody";
import { sendOffer } from "./peer";

type PlayerName = "playerA" | "playerB";

export class Client {
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

    ////socket.on("updateRoomData", this.updateRoomData)
    //socket.on("updateBodies", this.updateBodies)
    //socket.on("updatePlayerName", (newName: PlayerName) => this.playerName = newName)
  }

  public startGame(): void {
    //socket.emit("startGame")
  }
  public move(direction: "up" | "left" | "right"): void {
    //socket.emit("move", direction)
  }
  public lookAt(x: number, y: number): void {
    //socket.emit("lookAt", x, y)
  }
  public shoot(): void {
    //socket.emit("shoot")
  }
  public async join(roomID: string) {
    await sendOffer(roomID)
  }
}

export class Host extends Client {
  private readonly room = new Room();
  public roomID: string | null = null;

  constructor() {
    super();

    socket.emit("ableToJoin");
    console.log("→ | 参加可能と連絡しました！")
    socket.on("roomID", (roomID) => {
      console.log("← | roomID[" + roomID + "]が割り当てられました！")
      this.roomID = roomID;
      this.room.join(roomID, this.updateBodies, this.updateRoomData)
    });

    //socket.on("joinRoom", (uid) => {
    //  const playerName = this.room.join(
    //    uid,
    //    (bodies) => socket.emit("updateBodies", uid, bodies),
    //    (roomData) => socket.emit("updateRoomData", uid, roomData)
    //  );
    //  socket.emit("newPlayerName", uid, playerName);
    //});

    //socket.on("startGame", () => this.room.start());
    //socket.on("move", (uid: string, direction: "up" | "left" | "right") =>
    //  this.room.move(uid, direction)
    //);
    //socket.on("lookAt", (uid: string, x: number, y: number) =>
    //  this.room.lookAt(uid, { x, y })
    //);
    //socket.on("shoot", (uid: string) => this.room.shoot(uid));
  }
}