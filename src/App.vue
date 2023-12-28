<template>
  {{ roomID }}
  {{ player }}
  <button @click="() => socket.emit('joinRoom', 'a')">joinRoom</button>
  <button @click="() => socket.emit('start')">start</button>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import io from "socket.io-client"
import p5 from "p5"
import { SendBody } from "../model/sendBody"

const socket = io("http://localhost:9648")
socket.on("connect", () => console.log("⚡️サーバーと接続できました！"))
socket.on("connect_error", (error) => {throw error})

const roomID = ref<string>()
const player = ref<"playerA"|"playerB">()
socket.on("joinedRoom", (newRoomID: string, newPlayer: "playerA" | "playerB") => {
  roomID.value = newRoomID
  player.value = newPlayer
})

let bodies: SendBody[] | undefined
socket.on("updateData", (newBodies: SendBody[]) => bodies = newBodies)

const keyIsPressed = { a: false, d: false }

onMounted(() => {
  new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(800, 600)
    }
    p.draw = () => {
      p.background(0)
      bodies?.forEach(body => {
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

      if( keyIsPressed.a ) socket.emit("move", "left")
      if( keyIsPressed.d ) socket.emit("move", "right")

      //const angle = Math.atan2(player.position.y - p.mouseY, p.mouseX - player.position.x);
      //Body.setAngle(player, angle);
    }
    p.keyPressed = (event: KeyboardEvent) => {
      if( event.key == "w" ) socket.emit("move", "up")
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
      //const random = (Math.random() - 0.5) * 0.05
      //createBullet(player.position, player.angle + random)
    }
  })

  window.addEventListener("beforeunload", () => {
    if( roomID.value ) socket.emit("leaveRoom")
  })
})
</script>