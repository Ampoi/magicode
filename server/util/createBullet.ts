import { Body, Bodies } from "../infra/matter";

const distance = 5
const bulletSize = 4

export function createBullet( player: Body ){
    if ( !player.circleRadius ) throw new Error("プレイヤーが丸じゃないです！！(内部的なエラーの可能性しかありません)")

    const bullet = Bodies.circle(
        player.position.x + Math.cos(player.angle) * (player.circleRadius + distance),
        player.position.y - Math.sin(player.angle) * (player.circleRadius + distance),
        bulletSize,
        { label: "bullet" }
    )

    const bulletForceSize = 0.005
    Body.applyForce(bullet, bullet.position, {
        x: Math.cos(player.angle) * bulletForceSize,
        y: -Math.sin(player.angle) * bulletForceSize
    })

    return bullet
}