import { Body, Bodies } from "matter-js";
import { Entity } from "../../model/entity";

const distance = 5
const bulletSize = 4

export function createBullet( player: Entity ){
    if ( !player.circleRadius ) throw new Error("プレイヤーが丸じゃないです！！(内部的なエラーの可能性しかありません)")

    const angle = player.angle + ( Math.random()-0.5 ) / 50

    const bullet: Entity = Bodies.circle(
        player.position.x + Math.cos(angle) * (player.circleRadius + distance),
        player.position.y - Math.sin(angle) * (player.circleRadius + distance),
        bulletSize,
        { label: "bullet" }
    )
    bullet.customData = { from: player.customData?.name }

    const bulletForceSize = 0.005
    Body.applyForce(bullet, bullet.position, {
        x: Math.cos(angle) * bulletForceSize,
        y: -Math.sin(angle) * bulletForceSize
    })

    return bullet
}