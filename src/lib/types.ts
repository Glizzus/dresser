export type HouseId = 'a' | 'b'
export type Location = HouseId | 'transit'

export interface House {
  id: HouseId
  name: string
}

export interface Item {
  id: string
  name: string
  cats: string[]
  loc: Location
  w: number
  lim: number
  qty?: number
  lastWorn?: string
  _transitTo?: HouseId
}

export interface Outfit {
  id: string
  icon: string
  name: string
  catSlots: string[]
}

export type Severity = 'ok' | 'low' | 'broken'

export interface Bottleneck {
  cat: string
  ct: number
}

export interface Invariant {
  id: string
  label: string
  need: number
  have: number
  severity: Severity
  detail: string
  bottleneck?: Bottleneck
  fix: string | null
}

export interface HouseSummary {
  invariants: Invariant[]
  broken: number
  low: number
  warn: number
}

export interface LogEntry {
  date: string
  itemIds: string[]
}

export interface WardrobeState {
  items: Item[]
  outfits: Outfit[]
  house: HouseId
  log: LogEntry[]
}

export type Tab = 'today' | 'inv' | 'status'

export interface ToastInfo {
  kind?: 'ok' | 'loc' | 'info'
  text: string
}
