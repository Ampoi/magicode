<template>
  <button @click="startGame">start</button>
</template>
<script setup lang="ts">
import { onMounted } from 'vue';
import p5 from "p5"
import { Room } from "./util/room"
import { Body } from 'matter-js';
import { RoomData } from "./util/room"
import { createUID } from "./util/createUID"

const room = new Room()
const uid = createUID()

let bodies: Body[] | null
function onBodiesUpdate( newBodies: Body[] ){ bodies = newBodies }
let roomData: RoomData | null
function onRoomDataUpdate( newRoomData: RoomData ){ roomData = newRoomData }

function startGame(){ room.start() }

const playerName = room.join(uid, onBodiesUpdate, onRoomDataUpdate)
room.join("a", ()=>{},()=>{})

const keyIsPressed = { a: false, d: false }

function move( direction: "up" | "left" | "right" ){
  room.move(uid, direction)
}

function lookAt( x: number, y: number ){
  room.lookAt(uid, { x, y })
}

function shoot(){
  room.shoot(uid)
}

function drawGame(p: p5) {
  p.background(0)
  bodies?.forEach(body => {
    if (body.circleRadius) {
      switch (body.label) {
        case "player":
          if( (body as unknown as { name: string }).name == "playerA" ){
            p.fill("#ff4733")
          }else{
            p.fill("#3080ff")
          }
          break
        case "bullet":
          p.fill(0, 255, 0)
          break
        default:
          p.fill(255)
          break
      }
      p.circle(body.position.x, body.position.y, body.circleRadius * 2)
    } else {
      p.fill(255)
      p.rectMode(p.CENTER)
      const width = body.bounds.max.x - body.bounds.min.x
      const height = body.bounds.max.y - body.bounds.min.y
      p.rect(body.position.x, body.position.y, width, height)
    }
  })

  if (roomData && roomData.isGameStart && keyIsPressed.a) move("left")
  if (roomData && roomData.isGameStart && keyIsPressed.d) move("right")

  if (roomData && roomData.isGameStart) lookAt(p.mouseX, p.mouseY)
}

function drawPlayer(p: p5, hex: string, name: string, player: { point: number } | undefined, x: number, y: number, isMe: boolean){
  const color = p.color(hex)
  color.setAlpha(!!player ? 255 : 80)
  p.fill(color)
  p.circle(x, y, 50)
  p.arc(x, y + 70, 80, 80, p.PI, 0);
  p.textSize(30)
  p.text(name, x, y + 100)
  p.text(player?.point ?? 0, x, y+140)

  if( isMe ){
    p.noFill()
    p.stroke(255)
    p.strokeWeight(5)
    p.rectMode(p.CENTER)
    p.rect(x, y+70, 180, 240)
    p.noStroke()
    p.fill(255)
    p.text("You", x, y + 180)
  }
}

onMounted(() => {
  new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(1200, 800)
      p.textFont("Space Mono")
    }
    p.draw = () => {
      if (roomData?.isGameStart) {
        drawGame(p)
      } else {
        p.background(0)
        p.fill(255)
        p.strokeWeight(0)
        p.textAlign(p.CENTER)
        p.textSize(100)
        p.text("MagiCode", p.width / 2, p.height / 2 - 100)
        if( roomData ){
          drawPlayer(p, "#ff4733", "Player A", roomData.playerA, p.width/2-100, p.height/2 + 50, "playerA" == playerName)
          drawPlayer(p, "#3080ff", "Player B", roomData.playerB, p.width/2+100, p.height/2 + 50, "playerB" == playerName)
        }
      }
    }
    p.keyPressed = (event: KeyboardEvent) => {
      if (event.key == "w") move("up")
      if (event.key == "a" || event.key == "d") {
        keyIsPressed[event.key] = true
      }
    }
    p.keyReleased = (event: KeyboardEvent) => {
      if (event.key == "a" || event.key == "d") {
        keyIsPressed[event.key] = false
      }
    }
    p.mouseClicked = () => {
      if (roomData && roomData.isGameStart){
        const t = 20
        let i = 0
        const interval = setInterval(() => {
          if( i < 4 ){
            shoot()
          }else{ clearInterval(interval) }
          i++
        }, 1000/t)
      }
    }
  })
})
</script>