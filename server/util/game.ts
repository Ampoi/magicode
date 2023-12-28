import { Engine, Runner, Events, Body, Bodies, Composite, World, Vector } from "../infra/matter"
import { createBullet } from "./createBullet"
import { explode } from "./explode"

const bounds = {
    x: {
        min: -200,
        max: 1000
    },
    y: {
        min: -200,
        max: 800
    }
}

type OnGameEndCallback = ( winner?: "playerA" | "playerB" ) => void

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

    constructor( onGameEndCallback: OnGameEndCallback ) {
        const explodeQueue: Body[] = []

        Events.on(this.engine, "beforeUpdate", () => {
            const bodies = this.engine.world.bodies
            explodeQueue.forEach(explodeBody => {
                explode(bodies, explodeBody.position, 10)
                World.remove(this.engine.world, explodeBody)
                explodeQueue.splice(0, 1)
            })

            const isPlayerAFallOut =
                this.playerA.position.x < bounds.x.min || bounds.x.max < this.playerA.position.x ||
                this.playerA.position.y < bounds.y.min || bounds.y.max < this.playerA.position.y
            
            const isPlayerBFallOut =
                this.playerB.position.x < bounds.x.min || bounds.x.max < this.playerB.position.x ||
                this.playerB.position.y < bounds.y.min || bounds.y.max < this.playerB.position.y
            
            if( isPlayerAFallOut && isPlayerBFallOut ){
                onGameEndCallback()
            }else if( isPlayerAFallOut ){
                onGameEndCallback("playerB")
            }else if( isPlayerBFallOut ){
                onGameEndCallback("playerA")
            }
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