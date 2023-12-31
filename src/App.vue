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
import { Card } from "./model/card"
import { PlayerName } from './model/playerName';

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

let effects: Effect[] = []

const playerColor = {
  playerA: "#00A7FF",
  playerB: "#FF8C00"
}

function formatNumber(num: number) {
    const minimalNum = Math.round(num * 10)/10
    let numStrWithDecimalPoint = Number.isInteger(minimalNum) ? minimalNum.toString() + ".0" : minimalNum.toString()
    return " ".repeat(5 - numStrWithDecimalPoint.length) + numStrWithDecimalPoint
}

cushion.onEffect = (effect) => {
  effects.push(effect)
}

function drawMPGauge(p: p5, x: number, y: number){
  const player = cushion.bodies?.find(body => body.customData?.name == cushion.playerName)
  p.noStroke()
  p.rectMode(p.CORNER)
  p.fill(50)
  p.rect(x, y, 500, 50)
  if( !cushion.playerName ) throw new Error("プレイヤー名が定義されてません！")
  p.fill(playerColor[cushion.playerName])
  p.rect(x, y, 500*(player?.customData?.mp ?? 0)/100, 50)
  
  p.fill(255)
  p.textAlign(p.LEFT)
  p.text(formatNumber(player?.customData?.mp), x+10, y+35)
}

const cards: { [key: number]: Card[] } = {
  100: [{ name: "multiBullet" }],
  200: [{ name: "multiBullet" }],
  300: [{ name: "multiBullet" }],
  400: [{ name: "multiBullet" }],
  500: [{ name: "multiBullet" }],
}

function drawUseCard(p: p5){
  p.rectMode(p.CORNER)
  p.noFill()
  if( !cushion.playerName ) throw new Error("プレイヤー名が定義されてません！")
  const drawPlayerColor = p.color(playerColor[cushion.playerName])
  p.stroke(drawPlayerColor)
  const width = 40
  p.strokeWeight(width)
  p.rect(0, 0, p.width, p.height)

  p.noStroke()
  const maxTime = Math.max(...Object.entries(cards).map(([time]) => Number(time)))
  Object.entries(cards).reverse().forEach(([ time ]) => {
    const i = (maxTime-Number(time))/100
    const size = 100
    p.fill(drawPlayerColor)
    p.translate(p.width-(i+1)*size-width/2, p.height-size)
    p.square(0, 0, size)
    p.fill(255)
    p.textAlign('center')
    p.textSize(size/4)
    p.text(time, size/2, size/4)
    p.translate(-(p.width-(i+1)*size-width/2), -(p.height-size))
  })
}

let readyToUseCard = false
function drawGame(p: p5) {
  p.background(0)
  p.noStroke()
  cushion.bodies?.forEach(body => {
    if (body.circleRadius) {
      switch (body.label) {
        case "player":
          if( !body.customData?.name ) throw new Error("プレイヤーの名前が登録されてません！")
          p.fill(playerColor[body.customData.name as PlayerName])
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

  drawMPGauge(p, 100, 700)

  if( readyToUseCard ) drawUseCard(p)

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

function drawMenu(p: p5){
  if( readyToUseCard ) readyToUseCard = true
  if( effects.length > 0 ) effects = []

  p.background(0)

  p.fill(255)
  p.strokeWeight(0)
  p.textAlign(p.CENTER)
  p.textSize(100)
  p.text("MagiCode", p.width / 2, p.height / 2 - 100)
  if( cushion.roomData ){
    drawPlayer(p, playerColor.playerA, "Player A", cushion.roomData.playerA, p.width/2-100, p.height/2 + 20, "playerA" == cushion.playerName)
    drawPlayer(p, playerColor.playerB, "Player B", cushion.roomData.playerB, p.width/2+100, p.height/2 + 20, "playerB" == cushion.playerName)
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
        drawMenu(p)
      }
    }
    p.keyPressed = (event: KeyboardEvent) => {
      if (event.key == "w") cushion.move("up")
      if (event.key == "r"){ readyToUseCard = !readyToUseCard }
      if (event.key == " "){ cushion.useCard("multiBullet"); readyToUseCard = false }
      if (event.key == "a" || event.key == "d") keyIsPressed[event.key] = true
    }
    p.keyReleased = (event: KeyboardEvent) => {
      if (event.key == "a" || event.key == "d") keyIsPressed[event.key] = false
    }
    p.mousePressed = () => {
      if (cushion.roomData && cushion.roomData.isGameStart){
        cushion.shoot()
        if( readyToUseCard ){
          Object.entries(cards).forEach(([ time, cards ]) => {
            setTimeout(() => {
              cards.forEach(card => {
                cushion.useCard(card.name)
              })
              readyToUseCard = false
            }, Number(time))
          })
        }
      }
    }
  }, main.value)
})
</script>