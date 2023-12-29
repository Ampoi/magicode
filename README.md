めも

```mermaid
flowchart LR
   subgraph Client
      subgraph Core
         Room
      end
      subgraph Main
         Reciever
         Host
      end
      UI
   end

   UI --操作--> Main
   Main --描画--> UI

   Room --ゲームデータの送信--> Host
   Host --操作データの送信--> Room
   Room --ゲームデータの送信--> Server
   Server --ゲームデータの送信--> Room
   Server --ゲームデータの送信--> Reciever
   Reciever --操作データの送信--> Server
```