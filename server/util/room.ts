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
    isGameStartCallback: (isGameStarted: boolean) => void
    gameUpdateCallback: GameUpdateCallBack
    roomUpdateCallback: RoomUpdateCallBack
}

//const playerName = this.getPlayerNameFromUID(uid)
//const player = this[playerName]
//if( !player ) throw new Error("プレイヤーがいません！！")

export class Game {
    private readonly engine =  Engine.create()
    private readonly runner =  Runner.create()

    private readonly playerA = Bodies.circle(200, 300, 10, { label: "player" })
    private readonly playerB = Bodies.circle(500, 100, 10, { label: "player" })

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

        Composite.add(this.engine.world, [this.playerA, this.playerB, ...this.grounds])
        Runner.run(this.runner, this.engine)
    }

    get bodies(){
        return Composite.allBodies(this.engine.world)
    }

    summonBullet(playerName: "playerA" | "playerB") {
        const player = this[playerName]
        const bullet = createBullet(player)
        Composite.add(this.engine.world, bullet)
    }

    move(playerName: "playerA" | "playerB", direction: "up" | "left" | "right"){
        const player = this[playerName]
        const speed = 4

        switch( direction ){
            case "left":
                Body.setVelocity(player, { x: -speed, y:player.velocity.y })
                break
            case "right":
                Body.setVelocity(player, { x: speed, y:player.velocity.y })
                break
            case "up":
                Body.applyForce(player, player.position, { x: 0, y: -0.01 })
                break
        }
    }

    lookAt(playerName: "playerA" | "playerB", { x, y }: Vector){
        const player = this[playerName]

        const angle = Math.atan2(player.position.y - y, x - player.position.x);
        Body.setAngle(player, angle);
    }
}

export class Room {
    playerA?: Player
    playerB?: Player

    join(uid: string, isGameStartCallback: (isGameStarted: boolean) => void, gameUpdateCallback: GameUpdateCallBack, roomUpdateCallback: RoomUpdateCallBack) {
        if (!this.playerA) {
            console.log(`ユーザー[${uid}]が部屋にプレイヤーAとして入室しました！`)
            this.playerA = {
                uid,
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
        console.log("プレイヤーが退出しました")

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

    private game?: Game
    public get started(){ return !!this.game }
    
    start() {
        if (!this.playerA) throw new Error("playerAがいません！")
        if (!this.playerB) throw new Error("playerBがいません！")

        this.game = new Game()

        this.playerA.isGameStartCallback(true)
        this.playerB.isGameStartCallback(true)

        this.sendTick = setInterval(() => {
            if( !this.game ) throw new Error("今開催されているゲームがないです")
            const bodies = this.game.bodies

            this.playerA?.gameUpdateCallback(bodies)
            this.playerB?.gameUpdateCallback(bodies)
        }, 1000/this.tps)
    }

    stop(){
        clearInterval(this.sendTick)
        this.game = undefined

        if( this.playerA ) this.playerA.isGameStartCallback(false)
        if( this.playerB ) this.playerB.isGameStartCallback(false)
    }

    move(uid: string, direction: "up" | "left" | "right"){
        if( !this.game ) throw new Error("ゲームが開始されてません！")

        const playerName = this.getPlayerNameFromUID(uid)
        if( !playerName ) throw new Error("プレイヤーがいません！")

        this.game?.move( playerName, direction )
    }

    lookAt(uid: string, { x, y }: Vector){
        if( !this.game ) throw new Error("ゲームが開始されてません！")

        const playerName = this.getPlayerNameFromUID(uid)
        if( !playerName ) throw new Error("プレイヤーがいません！！")

        this.game.lookAt(playerName, { x, y })
    }

    createBullet(uid: string){
        if( !this.game ) throw new Error("ゲームが開始されてません！")

        const playerName = this.getPlayerNameFromUID(uid)
        if( !playerName ) throw new Error("プレイヤーがいません！！")

        this.game.summonBullet(playerName)
    }
}