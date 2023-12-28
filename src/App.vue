<template>
  <p style="color: white;">
    {{ roomID }}
    {{ player }}
    {{ isGameStarted }}
  </p>
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
socket.on("connect_error", (error) => { throw error })

const roomID = ref<string>()
const player = ref<"playerA" | "playerB">()
const isGameStarted = ref<boolean>(false)
socket.on("joinedRoom", (newRoomID: string, newPlayer: "playerA" | "playerB") => {
  roomID.value = newRoomID
  player.value = newPlayer
})
socket.on("isGameStarted", (newIsGameStarted: boolean) => isGameStarted.value = newIsGameStarted)

let bodies: SendBody[] | undefined
socket.on("updateData", (newBodies: SendBody[]) => bodies = newBodies)

const keyIsPressed = { a: false, d: false }

let roomData = { playerA: false, playerB: false }
socket.on("updateRoomData", (newRoomData) => roomData = newRoomData)

function drawGame(p: p5) {
  p.background(0)
  bodies?.forEach(body => {
    if (body.circleRadius) {
      switch (body.label) {
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
      p.circle(body.position.x, body.position.y, body.circleRadius * 2)
    } else {
      p.fill(255)
      p.rectMode(p.CENTER)
      const width = body.bounds.max.x - body.bounds.min.x
      const height = body.bounds.max.y - body.bounds.min.y
      p.rect(body.position.x, body.position.y, width, height)
    }
  })

  if (roomID.value && isGameStarted.value && keyIsPressed.a) socket.emit("move", "left")
  if (roomID.value && isGameStarted.value && keyIsPressed.d) socket.emit("move", "right")

  if (roomID.value && isGameStarted.value) socket.emit("setAngle", p.mouseX, p.mouseY)
}

function drawPlayer(p: p5, hex: string, name: string, isLogin: boolean, x: number, y: number){
  const color = p.color(hex)
  color.setAlpha(isLogin ? 255 : 80)
  p.fill(color)
  p.circle(x, y, 50)
  p.arc(x, y + 70, 80, 80, p.PI, 0);
  p.textSize(30)
  p.text(name, x, y + 100)
}

onMounted(() => {
  new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(800, 600)
      p.textFont("Space Mono")
    }
    p.draw = () => {
      if (isGameStarted.value) {
        drawGame(p)
      } else {
        p.background(0)
        p.fill(255)
        p.strokeWeight(0)
        p.textAlign(p.CENTER)
        p.textSize(100)
        p.text("MagiCode", p.width / 2, p.height / 2)

        console.log(roomData)
        drawPlayer(p, "#ff4733", "Player A", roomData.playerA, 300, 400)
        drawPlayer(p, "#3080ff", "Player B", roomData.playerB, 500, 400)
      }
    }
    p.keyPressed = (event: KeyboardEvent) => {
      if (event.key == "w") socket.emit("move", "up")
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
      if (roomID.value && isGameStarted.value) socket.emit("shoot")
    }
  })
})
</script>