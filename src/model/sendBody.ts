import { Body } from "matter-js"

export type SendBody = 
  Pick<Body, "angle" | "position" | "bounds" | "circleRadius" | "label" | "circleRadius"> &
  { customData?: { [key: string]: any } }