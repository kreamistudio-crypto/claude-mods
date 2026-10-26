export type ContestoAttivo = boolean
export type ContestoPercent = number | null

declare module 'claude-code' {
  interface PluginState {
    contesto: { attivo: ContestoAttivo; percent: ContestoPercent }
  }
}
