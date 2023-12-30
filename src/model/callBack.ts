export type Effect = { x: number, y: number, size: number, type: "explode", time: 0, lifespan: number }
export type EffectCallback = (effect: Effect) => void