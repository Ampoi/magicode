import type { Vector } from "matter-js"
import { Game } from "./room/game"
import { SendBody } from "../model/sendBody"

export type RoomData = {
    isGameStart: boolean
    playerA?: { point: number }
    playerB?: { point: number }
}

type GameUpdateCallBack = (bodies: SendBody[]) => void
type RoomUpdateCallBack = (data: RoomData) => void

export type Effect = { x: number, y: number, size: number, type: "explode", time: 0, lifespan: number }
export type EffectCallback = (effect: Effect) => void

type Player = {
    uid: string
    point: number
    gameUpdateCallback: GameUpdateCallBack
    roomUpdateCallback: RoomUpdateCallBack
    effectCallback: EffectCallback
}

export class Room {
    playerA?: Player
    playerB?: Player

    private noticeRoomUpdate(){
        const playerA = this.playerA ? { point: this.playerA.point } : undefined
        const playerB = this.playerB ? { point: this.playerB.point } : undefined

        if( this.playerA ) this.playerA.roomUpdateCallback({ playerA, playerB, isGameStart: !!this.game })
        if( this.playerB ) this.playerB.roomUpdateCallback({ playerA, playerB, isGameStart: !!this.game })
    }

    join(uid: string, gameUpdateCallback: GameUpdateCallBack, roomUpdateCallback: RoomUpdateCallBack, effectCallback: EffectCallback) {
        if (!this.playerA) {
            console.log(`ユーザー[${uid}]が部屋にプレイヤーAとして入室しました！`)
            this.playerA = {
                uid,
                point: 0,
                gameUpdateCallback,
                roomUpdateCallback,
                effectCallback
            }

            this.noticeRoomUpdate()

            return "playerA"
        } else if (!this.playerB) {
            console.log(`ユーザー[${uid}]が部屋にプレイヤーBとして入室しました！`)
            this.playerB = {
                uid,
                point: 0,
                gameUpdateCallback,
                roomUpdateCallback,
                effectCallback
            }

            this.noticeRoomUpdate()
            
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

        this.noticeRoomUpdate()
    }

    private getPlayerNameFromUID(uid: string){
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

    private game: Game | null = null
    
    start() {
        if (!this.playerA) throw new Error("playerAがいません！")
        if (!this.playerB) throw new Error("playerBがいません！")

        this.game = new Game((winnerName) => {
            this.stop()
            if( winnerName ){
                const winner = this[winnerName]
                if( winner ) winner.point += 1

                this.noticeRoomUpdate()
            }
        }, (effect) => {
            this.playerA?.effectCallback(effect)
            this.playerB?.effectCallback(effect)
        })

        this.noticeRoomUpdate()
        this.noticeRoomUpdate()

        this.sendTick = setInterval(() => {
            if( !this.game ) throw new Error("今開催されているゲームがないです")
            const bodies = this.game.bodies.map((body): SendBody => {
                return {
                    angle: body.angle,
                    position: body.position,
                    bounds: body.bounds,
                    label: body.label,
                    circleRadius: body.circleRadius,
                    name: (body as { name?: string }).name
                }
            })

            this.playerA?.gameUpdateCallback(bodies)
            this.playerB?.gameUpdateCallback(bodies)
        }, 1000/this.tps)
    }

    stop(){
        clearInterval(this.sendTick)
        this.game = null

        this.noticeRoomUpdate()
        this.noticeRoomUpdate()
    }

    move(uid: string, direction: "up" | "left" | "right"){
        if( !this.game ) return

        const playerName = this.getPlayerNameFromUID(uid)
        if( !playerName ) throw new Error("プレイヤーがいません！")

        this.game?.move( playerName, direction )
    }

    lookAt(uid: string, { x, y }: Vector){
        if( !this.game ) return

        const playerName = this.getPlayerNameFromUID(uid)
        if( !playerName ) throw new Error("プレイヤーがいません！！")

        this.game.lookAt(playerName, { x, y })
    }

    shoot(uid: string){
        if( !this.game ) return

        const playerName = this.getPlayerNameFromUID(uid)
        if( !playerName ) throw new Error("プレイヤーがいません！！")

        this.game.shoot(playerName)
    }
}