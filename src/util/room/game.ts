import { Engine, Runner, Events, Body, Bodies, Composite, World, Vector } from "matter-js"
import { createBullet } from "./createBullet"
import { explode } from "./explode"
import { EffectCallback } from "../../model/callBack"
import { PlayerName } from "../../model/playerName"
import { Direction } from "../../model/direction"

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

function transportPlayer( player: Body ){
    if( player.position.x < bounds.x.min ) Body.setPosition(player, { x: bounds.x.max, y: player.position.y })
    if( bounds.x.max < player.position.x ) Body.setPosition(player, { x: bounds.x.min, y: player.position.y })
}

function isPlayerFallOut( player: Body ){
    return player.position.y < bounds.y.min || bounds.y.max < player.position.y
}

export class Game {
    private readonly engine =  Engine.create()
    private readonly runner =  Runner.create()
    private readonly tps = 100

    private readonly playerA = Bodies.circle(200, 300, 10, { label: "player", name: "playerA" } as any)
    private readonly playerB = Bodies.circle(600, 100, 10, { label: "player", name: "playerB" } as any)

    readonly grounds = [
        Bodies.rectangle(200, 600, 200, 40, { isStatic: true }),
        Bodies.rectangle(600, 300, 200, 40, { isStatic: true }),
        Bodies.rectangle(1000, 700, 200, 40, { isStatic: true }),
    ]

    private stop = false

    constructor( onGameEndCallback: OnGameEndCallback, effectCallback: EffectCallback ) {
        const explodeQueue: Body[] = []

        Events.on(this.engine, "beforeUpdate", () => {
            const bodies = this.engine.world.bodies
            explodeQueue.forEach(explodeBody => {
                explode(bodies, explodeBody.position, 10)
                effectCallback({ x: explodeBody.position.x, y: explodeBody.position.y, size: 200, type: "explode", time: 0, lifespan: 20 })
                World.remove(this.engine.world, explodeBody)
                explodeQueue.splice(0, 1)
            })

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
                if (bodyA.label == "bullet") explodeQueue.push(bodyA)
                if (bodyB.label == "bullet") explodeQueue.push(bodyB)
            })
        })

        Composite.add(this.engine.world, [this.playerA, this.playerB, ...this.grounds])
        this.runner.delta = 1000 / this.tps
        Runner.run(this.runner, this.engine)
    }

    get bodies(){
        return Composite.allBodies(this.engine.world)
    }

    shoot(playerName: PlayerName) {
        const player = this[playerName]
        const bullet = createBullet(player)
        Composite.add(this.engine.world, bullet)
    }

    move(playerName: PlayerName, direction: Direction){
        const player = this[playerName]
        const speed = 4;

        ({
            left: () => Body.setVelocity(player, { x: -speed, y:player.velocity.y }),
            right: () => Body.setVelocity(player, { x: speed, y:player.velocity.y }),
            up: () => Body.applyForce(player, player.position, { x: 0, y: -0.005 })
        })[direction]()
    }

    lookAt(playerName: PlayerName, { x, y }: Vector){
        const player = this[playerName]

        const angle = Math.atan2(player.position.y - y, x - player.position.x);
        Body.setAngle(player, angle);
    }
}