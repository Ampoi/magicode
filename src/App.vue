<template>
  <main class="w-screen h-screen bg-stone-800 text-white grid place-content-center font-spaceMono">
    <div class="flex flex-col shadow-2xl shadow-black">
      <div ref="main" class="relative">
        <div
          class="top-0 absolute flex flex-row gap-4 justify-center w-full"
          v-if="showUI">
          <input type="text" v-model="serverAddress" class="bg-transparent">
          <button @click="changeServer">サーバーを変更する</button>
        </div>
        <div
          v-if="showUI"
          class="w-full absolute left-1/2 -translate-x-1/2 top-[8%] text-4xl flex flex-row gap-8 justify-center">
          <button
            v-if="(cushion instanceof Host)"
            @click="copyID" class="px-6 py-2 rounded-full border-4 border-white">Copy RoomID
          </button>
          <div
            v-else class="flex flex-row">
            <input
              type="text"
              v-model="roomID"
              class="px-6 py-2 rounded-l-full border-4 border-white bg-black placeholder:text-white/30"
              placeholder="Input RoomID...">
            <button
              @click="() => {if(roomID){ cushion.join(roomID) }}"
              class="px-6 pl-2 rounded-r-full border-4 border-white">
              join
            </button>
          </div>
          <button
            @click="becomeHost = !becomeHost"
            class="px-6 py-2 rounded-full border-4 border-white">
            Become {{ becomeHost ? "Client" : "Host" }}
          </button>
        </div>
        <div
          v-if="showUI"
          class="w-full absolute left-1/2 -translate-x-1/2 bottom-[8%] text-4xl flex flex-row gap-8 justify-center">
          <button @click="cushion.startGame" class="px-6 py-2 rounded-full border-4 border-white">
            Start
          </button>
        </div>
        <div
          class="absolute bottom-0 w-full flex flex-row text-white"
          v-if="showUI">
          <div class="grow text-center">
            {{ rtcState.iceGathering }}
          </div>
          <div class="grow text-center">
            {{ rtcState.peerConnection }}
          </div>
          <div class="grow text-center">
            {{ rtcState.signaling }}
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import p5 from "p5"
import { Host, Client } from "./util/cushion"
import { serverAddress, changeServer } from "./util/serverAddress"
import { rtcState } from './util/peer';
import { Effect } from "./model/callBack"

const roomID = ref<string>()
const showUI = ref(true)

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

const effects: Effect[] = []

cushion.onEffect = (effect) => {
  effects.push(effect)
}

function drawGame(p: p5) {
  p.background(0)
  p.noStroke()
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

  effects.forEach((effect, i) => {
    const t = (1 - (1 - effect.time / effect.lifespan) ** 2)
    const nowSize = t * effect.size
    p.noFill()
    const color = p.color("white")
    color.setAlpha((1 - effect.time / effect.lifespan)*255)
    p.stroke(color)
    p.strokeWeight((1-t)*effect.size/4)
    p.circle(effect.x, effect.y, nowSize)
    effect.time++
    if( effect.time > effect.lifespan ){
      effects.splice(i, 1)
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

const main = ref<HTMLElement>()

onMounted(() => {
  new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(1200, 800)
      p.textFont("Space Mono")
    }
    p.draw = () => {
      if (cushion.roomData?.isGameStart) {
        showUI.value = false
        drawGame(p)
      } else {
        showUI.value = true
        p.background(0)

        p.fill(255)
        p.strokeWeight(0)
        p.textAlign(p.CENTER)
        p.textSize(100)
        p.text("MagiCode", p.width / 2, p.height / 2 - 100)
        if( cushion.roomData ){
          drawPlayer(p, "#ff4733", "Player A", cushion.roomData.playerA, p.width/2-100, p.height/2 + 20, "playerA" == cushion.playerName)
          drawPlayer(p, "#3080ff", "Player B", cushion.roomData.playerB, p.width/2+100, p.height/2 + 20, "playerB" == cushion.playerName)
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
  }, main.value)
})
</script>