import type { Body, Vector } from "../infra/matter"
import { Game } from "./game"

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

        this.game = new Game((winner) => {
            this.stop()
            console.log(winner)
        })

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

    shoot(uid: string){
        if( !this.game ) throw new Error("ゲームが開始されてません！")

        const playerName = this.getPlayerNameFromUID(uid)
        if( !playerName ) throw new Error("プレイヤーがいません！！")

        this.game.shoot(playerName)
    }
}