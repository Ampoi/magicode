import express from 'express';
import { createServer } from "node:http";
import { Server } from 'socket.io';

import Matter from "matter-js"
const { Engine, Runner, Events, Body, Bodies, Composite, World, Vector } = Matter

import { SendBody } from "../model/sendBody"

type Body = Matter.Body
type Vector = Matter.Vector

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const playerApoint = { x: 200, y: 300 }
const playerBpoint = { x: 400, y: 300 }

function explode(bodies: Body[], { x, y }: Vector, size = 1) {
    bodies.forEach(body => {
        if (body.isStatic) return
        const vector = Vector.sub(body.position, { x, y })
        const distance = Vector.magnitude(vector)

        if (distance < size * 300) {
            const forceDirection = Vector.normalise(vector)
            const force = Vector.mult(forceDirection, size / 400 / (distance / 10))

            Body.applyForce(body, { x, y }, force)
        }
    })
}

class Room {
    playerA?: Body
    playerB?: Body
    private readonly engine = Engine.create()
    private readonly runner = Runner.create()

    readonly grounds = [
        Bodies.rectangle(200, 400, 200, 40, { isStatic: true }),
        Bodies.rectangle(600, 500, 200, 40, { isStatic: true }),
        Bodies.rectangle(500, 200, 200, 40, { isStatic: true }),
    ]

    private dataUpdateCallback?: (bodies: Body[]) => void

    constructor() {
        const explodeQueue: Body[] = []
        Events.on(this.engine, "beforeUpdate", () => {
            const bodies = this.engine.world.bodies
            explodeQueue.forEach(explodeBody => {
                explode(bodies, explodeBody.position, 10)
                World.remove(this.engine.world, explodeBody)
                explodeQueue.splice(0, 1)
            })
        })

        Events.on(this.engine, "collisionStart", (event) => {
            event.pairs.forEach(({ bodyA, bodyB }) => {
                if (bodyA.label == "bullet") explodeQueue.push(bodyA)
                if (bodyB.label == "bullet") explodeQueue.push(bodyB)
            })
        })
    }

    join(uid: string, dataUpdateCallback: Room["dataUpdateCallback"]) {
        this.dataUpdateCallback = dataUpdateCallback
        if (!this.playerA) {
            console.log(`ユーザー[${uid}]が部屋にプレイヤーAとして入室しました！`)
            this.playerA = Bodies.circle(playerApoint.x, playerApoint.y, 10, { label: "player" })
        } else if (!this.playerB) {
            console.log(`ユーザー[${uid}]が部屋にプレイヤーBとして入室しました！`)
            this.playerB = Bodies.circle(playerBpoint.x, playerBpoint.y, 10, { label: "player" })
        } else {
            throw new Error("定員オーバーです！")
        }
    }

    private sendTick?: NodeJS.Timeout
    private readonly tps = 40

    start() {
        if (!this.playerA) throw new Error("playerAがいません！")
        if (!this.playerB) throw new Error("playerBがいません！")

        Composite.add(this.engine.world, [this.playerA, this.playerB, ...this.grounds])
        Runner.run(this.runner, this.engine)

        this.sendTick = setInterval(() => {
            if (!this.playerA) throw new Error("playerAがいません！")
            if (!this.playerB) throw new Error("playerBがいません！")
            if(this.dataUpdateCallback) this.dataUpdateCallback([ this.playerA, this.playerB, ...this.grounds ])
        }, 1000/this.tps)
    }
    
    createBullet(playerName: "playerA" | "playerB") {
        const distance = 5
        const bulletSize = 4
        
        const player = this[playerName]
        if( !player ) throw new Error("プレイヤーがいません！！")

        if ( !player.circleRadius ) throw new Error("プレイヤーが丸じゃないです！！(内部的なエラーの可能性しかありません)")
    
        const bullet = Bodies.circle(
            player.position.x + Math.cos(player.angle) * (player.circleRadius + distance),
            player.position.y - Math.sin(player.angle) * (player.circleRadius + distance),
            bulletSize
        )
        bullet.label = "bullet"
    
        const bulletForceSize = 0.005
        Body.applyForce(bullet, bullet.position, {
            x: Math.cos(player.angle) * bulletForceSize,
            y: -Math.sin(player.angle) * bulletForceSize
        })
    
        Composite.add(this.engine.world, bullet)
    }
}

const rooms: { [key: string]: Room } = { a: new Room() };

app.get('/', (req, res) => res.send("This is magicode server"));

function createUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (a) => {
        let r = (new Date().getTime() + Math.random() * 16) % 16 | 0, v = a == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

io.on('connection', (socket) => {
    const uid = createUID()
    let joiningRoomID: string | undefined
    
    socket.on("joinRoom", (roomID: string) => {
        if( !uid ) throw new Error("uidが定められてません！")
        if( joiningRoomID ) throw new Error("すでに部屋に入ってます！")
        rooms[roomID].join(uid, (bodies) => {
            const sendData: SendBody[] = bodies.map(({ angle, position, circleRadius, bounds, label }) => {
                return { angle, position, circleRadius, bounds, label }
            })
            socket.emit("updateData", sendData)
        })
        joiningRoomID = roomID
        console.log(`ユーザー[${uid}]が${roomID}に入室しました`)
    })

    socket.on("start", () => {
        if( !joiningRoomID ) throw new Error("部屋に入ってません！")
        console.log("ゲームが開始されました！")
        rooms[joiningRoomID].start()
    })
});

const PORT = 9648

server.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
});