めも

```mermaid
flowchart TD
   subgraph Client
      subgraph Cushion
         Reciever
         Host
      end
      UI
      Room
   end

   UI --操作--> Cushion
   Cushion --描画--> UI

   Room --ゲームデータの送信--> Host
   Host --操作データの送信--> Room
   Room --ゲームデータの送信--> Server
   Server --操作データの送信--> Room
   Server --ゲームデータの送信--> Reciever
   Reciever --操作データの送信--> Server
```