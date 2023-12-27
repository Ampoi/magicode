<script setup lang="ts">
import { onMounted } from 'vue';
import p5 from "p5"
import { Engine, Runner, Events, Bodies, Body, Composite, World, Vector } from "matter-js"

const engine = Engine.create()

const player = Bodies.circle(400, 200, 10)
const ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
Composite.add(engine.world, [player, ground]);

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

//function explode({ x, y }: Vector, size = 10){
//  /*bodies.forEach((body, i) => {
//    if( body.isStatic ) return
//    console.log(i)
//    const vector = Vector.sub(body.position, { x, y })
//    //const distance = Vector.magnitude(vector)
//
//    const forceDirection = Vector.normalise(vector)
//    const force = Vector.mult(forceDirection, size)
//  })*/
//  console.log("aaa")
//  Body.applyForce(player, player.position, {x:10, y:0})
//}

const runner = Runner.create();
Runner.run(runner, engine);

function explode(){
  console.log("aaa")
  //Body.setPosition(player, {x: 0, y: 0})
  Body.applyForce(player, player.position, { x: 0, y: -0.01 })
}

Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach(({ bodyA, bodyB }) => {
    if( bodyA.label == "bullet" ){
      explode()
      World.remove(engine.world, bodyA)
    }
    if( bodyB.label == "bullet" ){
      explode()
      World.remove(engine.world, bodyB)
    }
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
      p.fill(255)
      bodies.forEach(body => {
        if( body.circleRadius ){
          p.circle(body.position.x, body.position.y, body.circleRadius*2)
        }else{
          p.rect(body.bounds.min.x, body.bounds.min.y, body.bounds.max.x, body.bounds.max.y)
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