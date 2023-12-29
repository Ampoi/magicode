import { computed } from "vue"

export const serverAddress = computed<string>({
  get(){
    return localStorage.getItem("serverAddress") ?? "https://magicode-server.ampoi.net"
  },
  set(newValue){
    localStorage.setItem("serverAddress", newValue)
  }
})

export const changeServer = () => window.location.reload()