import { Engine, Runner, Events, Body, Bodies, Composite, World, Vector } from "../infra/matter"
import { createBullet } from "./createBullet"
import { explode } from "./explode"

type GameUpdateCallBack = (bodies: Body[]) => void
type RoomUpdateCallBack = (data: {
    playerA: boolean
    playerB: boolean
}) => void

type Player = {
    uid: string
    body: Body
    isGameStartCallback: (isGameStarted: boolean) => void
    gameUpdateCallback: GameUpdateCallBack
    roomUpdateCallback: RoomUpdateCallBack
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

    join(uid: string, isGameStartCallback: (isGameStarted: boolean) => void, gameUpdateCallback: GameUpdateCallBack, roomUpdateCallback: RoomUpdateCallBack) {
        if (!this.playerA) {
            console.log(`ユーザー[${uid}]が部屋にプレイヤーAとして入室しました！`)
            this.playerA = {
                uid,
                body: Bodies.circle(playerApoint.x, playerApoint.y, 10, { label: "player" }),
                isGameStartCallback,
                gameUpdateCallback,
                roomUpdateCallback
            }

            if( this.playerA ) this.playerA.roomUpdateCallback({ playerA: !!this.playerA, playerB: !!this.playerB })
            if( this.playerB ) this.playerB.roomUpdateCallback({ playerA: !!this.playerA, playerB: !!this.playerB })

            return "playerA"
        } else if (!this.playerB) {
            console.log(`ユーザー[${uid}]が部屋にプレイヤーBとして入室しました！`)
            this.playerB = {
                uid,
                body: Bodies.circle(playerBpoint.x, playerBpoint.y, 10, { label: "player" }),
                isGameStartCallback,
                gameUpdateCallback,
                roomUpdateCallback
            }

            if( this.playerA ) this.playerA.roomUpdateCallback({ playerA: !!this.playerA, playerB: !!this.playerB })
            if( this.playerB ) this.playerB.roomUpdateCallback({ playerA: !!this.playerA, playerB: !!this.playerB })
            
            return "playerB"
        } else {
            throw new Error("定員オーバーです！")
        }
    }

    leave(uid: string){
        this.stop()
        const playerName = this.getPlayerNameFromUID(uid)
        this[playerName] = undefined

        if( this.playerA ) this.playerA.roomUpdateCallback({ playerA: !!this.playerA, playerB: !!this.playerB })
        if( this.playerB ) this.playerB.roomUpdateCallback({ playerA: !!this.playerA, playerB: !!this.playerB })
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

        this.playerA.isGameStartCallback(true)
        this.playerB.isGameStartCallback(true)
        this.started = true

        this.sendTick = setInterval(() => {
            if (!this.playerA) throw new Error("playerAがいません！")
            if (!this.playerB) throw new Error("playerBがいません！")

            const bodies = Composite.allBodies(this.engine.world)
            this.playerA.gameUpdateCallback(bodies)
            this.playerB.gameUpdateCallback(bodies)
        }, 1000/this.tps)
    }

    stop(){
        clearInterval(this.sendTick)
        this.started = false
        if( this.playerA ) this.playerA.isGameStartCallback(false)
        if( this.playerB ) this.playerB.isGameStartCallback(false)
    }
    
    createBullet(uid: string) {
        if( !this.started ) throw new Error("ゲームが開始されてません！")

        const playerName = this.getPlayerNameFromUID(uid)
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
                break
        }
    }

    lookAt(uid: string, { x, y }: Vector){
        if( !this.started ) throw new Error("ゲームが開始されてません！")

        const playerName = this.getPlayerNameFromUID(uid)
        const player = this[playerName]
        if( !player ) throw new Error("プレイヤーがいません！！")

        const angle = Math.atan2(player.body.position.y - y, x - player.body.position.x);
        Body.setAngle(player.body, angle);
    }
}