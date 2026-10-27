export type ContestoAttivo = boolean
export type ContestoPercent = number | null
export type ContestoToken = number | null

declare module 'claude-code' {
  interface PluginState {
    contesto: { attivo: ContestoAttivo; percent: ContestoPercent; token: ContestoToken }
  }
}
