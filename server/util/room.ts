import { Engine, Runner, Events, Body, Bodies, Composite, World } from "../infra/matter"
import { createBullet } from "./createBullet"
import { explode } from "./explode"

type DataUpdateCallBack = (bodies: Body[]) => void
type Player = {
    uid: string
    body: Body
    dataUpdateCallback: DataUpdateCallBack
}

const playerApoint = { x: 200, y: 300 }
const playerBpoint = { x: 500, y: 100 }

export class Room {
    playerA?: Player
    playerB?: Player
    private readonly engine = Engine.create()
    private readonly runner = Runner.create()

    readonly grounds = [
        Bodies.rectangle(200, 400, 200, 40, { isStatic: true }),
        Bodies.rectangle(600, 500, 200, 40, { isStatic: true }),
        Bodies.rectangle(500, 200, 200, 40, { isStatic: true }),
    ]

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

    join(uid: string, dataUpdateCallback: DataUpdateCallBack) {
        if (!this.playerA) {
            console.log(`ユーザー[${uid}]が部屋にプレイヤーAとして入室しました！`)
            this.playerA = {
                uid,
                body: Bodies.circle(playerApoint.x, playerApoint.y, 10, { label: "player" }),
                dataUpdateCallback
            }
            return "playerA"
        } else if (!this.playerB) {
            console.log(`ユーザー[${uid}]が部屋にプレイヤーBとして入室しました！`)
            this.playerB = {
                uid,
                body: Bodies.circle(playerBpoint.x, playerBpoint.y, 10, { label: "player" }),
                dataUpdateCallback
            }
            return "playerB"
        } else {
            throw new Error("定員オーバーです！")
        }
    }

    leave(uid: string){
        const playerName = this.getPlayerNameFromUID(uid)
        this[playerName] = undefined
    }

    getPlayerNameFromUID(uid: string){
        if( this.playerA?.uid == uid ){
            return "playerA"
        }else if( this.playerB?.uid == uid ){
            return "playerB"
        }else{
            throw new Error("部屋に入ってません")
        }
    }

    private sendTick?: NodeJS.Timeout
    private readonly tps = 40

    started = false

    start() {
        if (!this.playerA) throw new Error("playerAがいません！")
        if (!this.playerB) throw new Error("playerBがいません！")

        Composite.add(this.engine.world, [this.playerA.body, this.playerB.body, ...this.grounds])
        Runner.run(this.runner, this.engine)

        this.started = true

        this.sendTick = setInterval(() => {
            if (!this.playerA) throw new Error("playerAがいません！")
            if (!this.playerB) throw new Error("playerBがいません！")

            const bodies = [ this.playerA.body, this.playerB.body, ...this.grounds ]
            this.playerA.dataUpdateCallback(bodies)
            this.playerB.dataUpdateCallback(bodies)
        }, 1000/this.tps)
    }

    stop(){
        clearInterval(this.sendTick)
        this.started = false
    }
    
    createBullet(playerName: "playerA" | "playerB") {
        const player = this[playerName]
        if( !player ) throw new Error("プレイヤーがいません！！")

        const bullet = createBullet(player.body)
    
        Composite.add(this.engine.world, bullet)
    }

    move(uid: string, direction: "up" | "left" | "right"){
        if( !this.started ) throw new Error("ゲームが開始されてません！")

        const playerName = this.getPlayerNameFromUID(uid)
        const player = this[playerName]
        if( !player ) throw new Error("プレイヤーがいません！！")

        const speed = 4
        switch( direction ){
            case "left":
                Body.setVelocity(player.body, { x: -speed, y:player.body.velocity.y })
                break
            case "right":
                Body.setVelocity(player.body, { x: speed, y:player.body.velocity.y })
                break
            case "up":
                Body.applyForce(player.body, player.body.position, { x: 0, y: -0.01 })
        }
    }
}