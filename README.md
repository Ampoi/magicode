めも

```mermaid
flowchart LR
   Room --ゲームデータの送信--> Host
   Host --操作データの送信--> Room
   Room --ゲームデータの送信--> Server
   Server --ゲームデータの送信--> Room
   Server --ゲームデータの送信--> Client
   Client --ゲームデータの送信--> Server
```