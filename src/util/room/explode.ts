import { Body, Vector } from "matter-js"

export function explode(bodies: Body[], { x, y }: Vector, size = 1) {
    bodies.forEach(body => {
        if (body.isStatic) return
        const vector = Vector.sub(body.position, { x, y })
        const distance = Vector.magnitude(vector)

        if (distance < size * 300) {
            const forceDirection = Vector.normalise(vector)
            const force = Vector.mult(forceDirection, size / 400 / (distance / 10))

            Body.applyForce(body, { x, y }, force)
        }
    })
}