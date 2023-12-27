<script setup lang="ts">
import { onMounted } from 'vue';
import p5 from "p5"
import { Engine, Runner, Events, Bodies, Body, Composite, World, Vector } from "matter-js"

const engine = Engine.create()

const player = Bodies.circle(200, 300, 10)
player.label = "player"
const grounds = [
  Bodies.rectangle(200, 400, 200, 40, { isStatic: true }),
  Bodies.rectangle(600, 500, 200, 40, { isStatic: true }),
  Bodies.rectangle(500, 200, 200, 40, { isStatic: true }),
]
Composite.add(engine.world, [player, ...grounds])

const keyIsPressed = { a: false, d: false }
let bodies: Body[]

function createBullet(playerPosition: Vector, playerAngle: number){
  const distance = 5
  const bulletSize = 4
  if( !player.circleRadius ) throw new Error("!?!?!?")

  const bullet = Bodies.circle(
    playerPosition.x + Math.cos(playerAngle) * (player.circleRadius + distance),
    playerPosition.y - Math.sin(playerAngle) * (player.circleRadius + distance),
    bulletSize
  )
  bullet.label = "bullet"

  const bulletForceSize = 0.005
  Body.applyForce(bullet, bullet.position, {
    x: Math.cos(playerAngle) * bulletForceSize,
    y: -Math.sin(playerAngle) * bulletForceSize
  })

  Composite.add(engine.world, bullet)
}

function explode({ x, y }: Vector, size = 1){
  bodies.forEach(body => {
    if( body.isStatic ) return
    const vector = Vector.sub(body.position, { x, y })
    const distance = Vector.magnitude(vector)

    if( distance < size * 300 ){
      const forceDirection = Vector.normalise(vector)
      const force = Vector.mult(forceDirection, size/400/(distance/10))
  
      Body.applyForce(body, { x, y }, force)
    }
  })
}

const runner = Runner.create();
Runner.run(runner, engine);

const explodeQueue: Body[] = []
Events.on(engine, "beforeUpdate", () => {
  explodeQueue.forEach(explodeBody => {
    explode(explodeBody.position, 10)
    World.remove(engine.world, explodeBody)
    explodeQueue.splice(0, 1)
  })
})

Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach(({ bodyA, bodyB }) => {
    if( bodyA.label == "bullet" ) explodeQueue.push(bodyA)
    if( bodyB.label == "bullet" ) explodeQueue.push(bodyB)
  })
})

onMounted(() => {
  new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(800, 600)
    }
    p.draw = () => {
      p.background(0)
      bodies = engine.world.bodies
      bodies.forEach(body => {
        if( body.circleRadius ){
          switch( body.label ){
            case "player":
              p.fill(255, 0, 0)
              break
            case "bullet":
              p.fill(0, 255, 0)
              break
            default:
              p.fill(255)
              break
          }
          p.circle(body.position.x, body.position.y, body.circleRadius*2)
        }else{
          p.fill(255)
          p.rectMode(p.CENTER)
          const width = body.bounds.max.x - body.bounds.min.x
          const height = body.bounds.max.y - body.bounds.min.y
          p.rect(body.position.x, body.position.y, width, height)
        }
      })

      const speed = 4
      if( keyIsPressed.a ) Body.setVelocity(player, { x: -speed, y:player.velocity.y })
      if( keyIsPressed.d ) Body.setVelocity(player, { x: speed, y:player.velocity.y })

      const angle = Math.atan2(player.position.y - p.mouseY, p.mouseX - player.position.x);
      Body.setAngle(player, angle);
    }
    p.keyPressed = (event: KeyboardEvent) => {
      if( event.key == "w" ){
        Body.applyForce(player, player.position, { x: 0, y: -0.01 })
      }
      if( event.key == "a" || event.key == "d" ){
        keyIsPressed[event.key] = true
      }
    }
    p.keyReleased = (event: KeyboardEvent) => {
      if( event.key == "a" || event.key == "d" ){
        keyIsPressed[event.key] = false
      }
    }
    p.mouseClicked = () => {
      const random = (Math.random() - 0.5) * 0.05
      createBullet(player.position, player.angle + random)
    }
  })
})
</script>