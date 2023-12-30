import { Body, Bodies } from "matter-js";

const distance = 5
const bulletSize = 4

export function createBullet( player: Body ){
    if ( !player.circleRadius ) throw new Error("プレイヤーが丸じゃないです！！(内部的なエラーの可能性しかありません)")

    const angle = player.angle + ( Math.random()-0.5 ) / 50

    const bullet = Bodies.circle(
        player.position.x + Math.cos(angle) * (player.circleRadius + distance),
        player.position.y - Math.sin(angle) * (player.circleRadius + distance),
        bulletSize,
        { label: "bullet" }
    )

    const bulletForceSize = 0.0025
    Body.applyForce(bullet, bullet.position, {
        x: Math.cos(angle) * bulletForceSize,
        y: -Math.sin(angle) * bulletForceSize
    })

    return bullet
}