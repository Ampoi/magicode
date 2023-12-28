<template>
  <button @click="() => socket.emit('joinRoom', 'a')">joinRoom</button>
  <button @click="() => socket.emit('start')">start</button>
  <input type="text">
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import io from "socket.io-client"
import p5 from "p5"
import { SendBody } from "../model/sendBody"

const socket = io("http://magicode-server.ampoi.net")
socket.on("connect", () => console.log("⚡️サーバーと接続できました！"))
socket.on("connect_error", (error) => { throw error })

let roomData: {
  id: string
  playerName: "playerA" | "playerB"
  logginedPlayer: {
    playerA?: { point: number }
    playerB?: { point: number }
  }
} | undefined

const isGameStarted = ref<boolean>(false)
socket.on("joinedRoom", (newRoomID: string, newPlayer: "playerA" | "playerB", logginedPlayer) => {
  console.log("joinedRoom")
  roomData = {
    id: newRoomID,
    playerName: newPlayer,
    logginedPlayer
  }
})
socket.on("isGameStarted", (newIsGameStarted: boolean) => isGameStarted.value = newIsGameStarted)

let bodies: SendBody[] | undefined
socket.on("updateData", (newBodies: SendBody[]) => bodies = newBodies)

const keyIsPressed = { a: false, d: false }

socket.on("updateRoomData", (newRoomData) => {
  if( !roomData ) throw new Error("部屋に入る前にデータの更新を受け取りました")
  console.log("updateRoomData")
  roomData.logginedPlayer = newRoomData
})

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

  if (roomData && isGameStarted.value && keyIsPressed.a) socket.emit("move", "left")
  if (roomData && isGameStarted.value && keyIsPressed.d) socket.emit("move", "right")

  if (roomData && isGameStarted.value) socket.emit("setAngle", p.mouseX, p.mouseY)
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
        p.text("MagiCode", p.width / 2, p.height / 2 - 100)
        if( roomData ){
          drawPlayer(p, "#ff4733", "Player A", roomData.logginedPlayer.playerA, 300, 300, "playerA" == roomData.playerName)
          drawPlayer(p, "#3080ff", "Player B", roomData.logginedPlayer.playerB, 500, 300, "playerB" == roomData.playerName)
        }
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
      if (roomData && isGameStarted.value) socket.emit("shoot")
    }
  })
})
</script>