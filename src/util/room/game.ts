import { Engine, Runner, Events, Body, Bodies, Composite, World, Vector } from "matter-js"
import { createBullet } from "./createBullet"
import { explode } from "./explode"
import { EffectCallback } from "../../model/callBack"
import { PlayerName } from "../../model/playerName"
import { Direction } from "../../model/direction"
import { Entity } from "../../model/entity"

const bounds = {
    x: {
        min: 0,
        max: 1200
    },
    y: {
        min: 0,
        max: 800
    }
}

type OnGameEndCallback = ( winner?: PlayerName ) => void

function transportPlayer( player: Entity ){
    if( player.position.x < bounds.x.min ){ Body.setPosition(player, { x: bounds.x.max, y: player.position.y }); if( player.customData ){ player.customData.mp -= 30 }}
    if( bounds.x.max < player.position.x ){ Body.setPosition(player, { x: bounds.x.min, y: player.position.y }); if( player.customData ){ player.customData.mp -= 30 }}
}

function isPlayerFallOut( player: Body ){
    return player.position.y < bounds.y.min || bounds.y.max < player.position.y
}

export class Game {
    private readonly engine =  Engine.create()
    private readonly runner =  Runner.create()
    private readonly tps = 100

    private readonly playerA: Entity = Bodies.circle(200, 300, 10, { label: "player" })
    private readonly playerB: Entity = Bodies.circle(600, 100, 10, { label: "player" })

    readonly grounds = [
        Bodies.rectangle(200, 600, 200, 40, { isStatic: true }),
        Bodies.rectangle(600, 300, 200, 40, { isStatic: true }),
        Bodies.rectangle(1000, 700, 200, 40, { isStatic: true }),
    ]

    private stop = false

    constructor( onGameEndCallback: OnGameEndCallback, effectCallback: EffectCallback ) {
        this.playerA.customData = {
            name: "playerA",
            mp: 100
        }
        this.playerB.customData = {
            name: "playerB",
            mp: 100
        }

        const explodeQueue: Body[] = []

        Events.on(this.engine, "beforeUpdate", () => {
            const bodies = this.engine.world.bodies
            explodeQueue.forEach(explodeBody => {
                explode(bodies, explodeBody.position, 10)
                effectCallback({ x: explodeBody.position.x, y: explodeBody.position.y, size: 200, type: "explode", time: 0, lifespan: 20 })
                World.remove(this.engine.world, explodeBody)
                explodeQueue.splice(0, 1)
            })

            if( this.playerA.customData && this.playerA.customData.mp < 100 ) this.playerA.customData.mp += 0.1
            if( this.playerB.customData && this.playerB.customData.mp < 100 ) this.playerB.customData.mp += 0.1

            if( !this.stop ){
                transportPlayer(this.playerA)
                transportPlayer(this.playerB)

                const isPlayerAFallOut = isPlayerFallOut(this.playerA)
                const isPlayerBFallOut = isPlayerFallOut(this.playerB)
                
                if( isPlayerAFallOut && isPlayerBFallOut ){
                    onGameEndCallback()
                    this.stop = true
                }else if( isPlayerAFallOut ){
                    onGameEndCallback("playerB")
                    this.stop = true
                }else if( isPlayerBFallOut ){
                    onGameEndCallback("playerA")
                    this.stop = true
                }
            }

            bodies.forEach(body => {
                if( body.position.x < bounds.x.min || bounds.x.max < body.position.x ){
                    World.remove(this.engine.world, body)
                }
            })
        })

        Events.on(this.engine, "collisionStart", (event) => {
            event.pairs.forEach(({ bodyA, bodyB }) => {
                const bonus = 20
                if (bodyA.label == "bullet"){
                    const fromPlayer = this[(bodyA as Entity).customData?.from as PlayerName]
                    if( !fromPlayer.customData ) throw new Error("カスタムのデータがないです！！")
                    if( bodyB.label == "player" ) fromPlayer.customData.mp += bonus
                    explodeQueue.push(bodyA)
                }
                if (bodyB.label == "bullet"){
                    const fromPlayer = this[(bodyB as Entity).customData?.from as PlayerName]
                    if( !fromPlayer.customData ) throw new Error("カスタムのデータがないです！！")
                    if( bodyA.label == "player" ) fromPlayer.customData.mp += bonus
                    explodeQueue.push(bodyB)
                }
            })
        })

        Composite.add(this.engine.world, [this.playerA, this.playerB, ...this.grounds])
        this.runner.delta = 1000 / this.tps
        Runner.run(this.runner, this.engine)
    }

    get bodies(){
        return Composite.allBodies(this.engine.world)
    }

    useCard(playerName: PlayerName){
        const useMP = 10
        const distance = 30
        const angle = 5

        const player = this[playerName]
        if( player.customData && player.customData.mp > useMP ){
            let cardUsed = false
            Composite.allBodies(this.engine.world).forEach((body: Entity) => {
                if( body.label == "bullet" && body.customData?.from == playerName ){
                    const velocity = Vector.magnitude(body.velocity)
                    const normalisedVector = Vector.normalise(body.velocity)
                    
                    const aPos = Vector.add(body.position, Vector.mult(Vector.perp(normalisedVector, false), distance))
                    const a: Entity = Bodies.circle(aPos.x, aPos.y, body.circleRadius ?? 10, { label: "bullet" })
                    a.customData = { from: playerName }
                    const aAngle = Vector.rotate(normalisedVector, Math.PI*angle/180)
                    Body.setVelocity(a, Vector.mult(aAngle, velocity))
                    
                    const bPos = Vector.add(body.position, Vector.mult(Vector.perp(normalisedVector, true), distance))
                    const b: Entity = Bodies.circle(bPos.x, bPos.y, body.circleRadius ?? 10, { label: "bullet" })
                    b.customData = { from: playerName }
                    const bAngle = Vector.rotate(normalisedVector, Math.PI*(-angle/180))
                    Body.setVelocity(b, Vector.mult(bAngle, velocity))
                    
                    Composite.add(this.engine.world, [a, b])
                    
                    if( !cardUsed ) cardUsed = true
                }
            })
            if( cardUsed ) player.customData.mp -= useMP
        }
    }

    shoot(playerName: PlayerName) {
        const player = this[playerName]
        const useMP = 20
        if( player.customData && player.customData.mp > useMP ){
            const bullet = createBullet(player)
            Composite.add(this.engine.world, bullet)
            player.customData.mp -= useMP
        }
    }

    move(playerName: PlayerName, direction: Direction){
        const player = this[playerName]
        const speed = 4;

        ({
            left: () => Body.setVelocity(player, { x: -speed, y:player.velocity.y }),
            right: () => Body.setVelocity(player, { x: speed, y:player.velocity.y }),
            up: () => {
                const useMP = 5
                if( player.customData && player.customData.mp > useMP ){
                    Body.applyForce(player, player.position, { x: 0, y: -0.01 })
                    player.customData.mp -= useMP
                }
            }
        })[direction]()
    }

    lookAt(playerName: PlayerName, { x, y }: Vector){
        const player = this[playerName]

        const angle = Math.atan2(player.position.y - y, x - player.position.x);
        Body.setAngle(player, angle);
    }
}