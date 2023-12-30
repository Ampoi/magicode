import { Engine, Runner, Events, Body, Bodies, Composite, World, Vector } from "matter-js"
import { createBullet } from "./createBullet"
import { explode } from "./explode"

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

type OnGameEndCallback = ( winner?: "playerA" | "playerB" ) => void

export class Game {
    private readonly engine =  Engine.create()
    private readonly runner =  Runner.create()

    private readonly playerA = Bodies.circle(200, 300, 10, { label: "player", name: "playerA" } as any)
    private readonly playerB = Bodies.circle(600, 100, 10, { label: "player", name: "playerB" } as any)

    readonly grounds = [
        Bodies.rectangle(200, 600, 200, 40, { isStatic: true }),
        Bodies.rectangle(600, 300, 200, 40, { isStatic: true }),
        Bodies.rectangle(1000, 700, 200, 40, { isStatic: true }),
    ]

    private stop = false

    constructor( onGameEndCallback: OnGameEndCallback ) {
        const explodeQueue: Body[] = []

        Events.on(this.engine, "beforeUpdate", () => {
            const bodies = this.engine.world.bodies
            explodeQueue.forEach(explodeBody => {
                explode(bodies, explodeBody.position, 10)
                World.remove(this.engine.world, explodeBody)
                explodeQueue.splice(0, 1)
            })

            if( !this.stop ){
                if( this.playerA.position.x < bounds.x.min ) Body.setPosition(this.playerA, { x: bounds.x.max, y: this.playerA.position.y })
                if( bounds.x.max < this.playerA.position.x ) Body.setPosition(this.playerA, { x: bounds.x.min, y: this.playerA.position.y })
                
                if( this.playerB.position.x < bounds.x.min ) Body.setPosition(this.playerB, { x: bounds.x.max, y: this.playerB.position.y })
                if( bounds.x.max < this.playerB.position.x ) Body.setPosition(this.playerB, { x: bounds.x.min, y: this.playerB.position.y })

                const isPlayerAFallOut = this.playerA.position.y < bounds.y.min || bounds.y.max < this.playerA.position.y
                
                const isPlayerBFallOut = this.playerB.position.y < bounds.y.min || bounds.y.max < this.playerB.position.y
                
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
        Runner.run(this.runner, this.engine)
    }

    get bodies(){
        return Composite.allBodies(this.engine.world)
    }

    shoot(playerName: "playerA" | "playerB") {
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