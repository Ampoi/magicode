<template>
  <button @click="cushion.startGame">start</button>
  <button @click="becomeHost = !becomeHost">{{ becomeHost }}</button>
  <div v-if="!(cushion instanceof Host)">
    <input type="text" v-model="roomID">
    <button @click="() => {if(roomID){ cushion.join(roomID) }}">join</button>
  </div>
  <button
    v-if="(cushion instanceof Host)"
    @click="copyID">copy roomID</button>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import p5 from "p5"
import { Host, Client } from "./util/cushion"

const roomID = ref<string>()

const becomeHost = computed<boolean>({
  get(){
    return localStorage.getItem("becomeHost") == "true"
  },
  set(newValue){
    localStorage.setItem("becomeHost", newValue.toString())
    window.location.reload()
  }
})

const cushion = becomeHost.value ? new Host() : new Client()

function copyID(){
  if( !(cushion instanceof Host) ) return
  navigator.clipboard.writeText(cushion.roomID ?? "")
}

const keyIsPressed = { a: false, d: false }

function drawGame(p: p5) {
  p.background(0)
  cushion.bodies?.forEach(body => {
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

  if ( cushion.roomData && cushion.roomData.isGameStart && keyIsPressed.a) cushion.move("left")
  if ( cushion.roomData && cushion.roomData.isGameStart && keyIsPressed.d) cushion.move("right")

  if ( cushion.roomData && cushion.roomData.isGameStart) cushion.lookAt(p.mouseX, p.mouseY)
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
      if (cushion.roomData?.isGameStart) {
        drawGame(p)
      } else {
        p.background(0)
        p.fill(255)
        p.strokeWeight(0)
        p.textAlign(p.CENTER)
        p.textSize(100)
        p.text("MagiCode", p.width / 2, p.height / 2 - 100)
        if( cushion instanceof Host ){
          p.textSize(30)
          p.text(`You are Host! RoomID: ${cushion.roomID}`, p.width / 2, p.height / 2 - 40)
        }
        if( cushion.roomData ){
          drawPlayer(p, "#ff4733", "Player A", cushion.roomData.playerA, p.width/2-100, p.height/2 + 50, "playerA" == cushion.playerName)
          drawPlayer(p, "#3080ff", "Player B", cushion.roomData.playerB, p.width/2+100, p.height/2 + 50, "playerB" == cushion.playerName)
        }
      }
    }
    p.keyPressed = (event: KeyboardEvent) => {
      if (event.key == "w") cushion.move("up")
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
      if (cushion.roomData && cushion.roomData.isGameStart) cushion.shoot()
    }
  })
})
</script>