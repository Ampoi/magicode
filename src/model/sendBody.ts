import { Entity } from "./entity"

export type SendBody = 
  Pick<Entity, "angle" | "position" | "bounds" | "circleRadius" | "label" | "circleRadius" | "customData">