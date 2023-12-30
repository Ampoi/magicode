import { Body } from "matter-js"

export type Entity = Body & { customData?: { [key: string]: any } }