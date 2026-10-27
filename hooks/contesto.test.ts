import { test, expect } from 'claude-code/testing'
import { contaToken, breve } from './register'

type Run = Parameters<typeof import('claude-code/testing')['test']> extends never ? never : any

test('/avvisi spegne e poi riaccende gli avvisi (partono accesi)', async $ => {
  const spenti = await $.command.run({ command: 'avvisi', args: '' } as any)
  expect(spenti.text ?? '').toContain('spenti')
  const accesi = await $.command.run({ command: 'avvisi', args: '' } as any)
  expect(accesi.text ?? '').toContain('accesi')
})

test('/passaggio risponde e prepara il passaggio di consegne', async $ => {
  const out = await $.command.run({ command: 'passaggio', args: '' } as any)
  expect(out.text ?? '').toContain('passaggio di consegne')
})

test('contatore dei token: verde fino a 300k, rosso oltre, tetto a 1M', () => {
  expect(breve(142_380)).toBe('142k')
  expect(contaToken(142_380)).toBe('142k / 1M token')
  expect(contaToken(300_000)).toBe('300k / 1M token')
  expect(contaToken(312_000)).toBe('312k / 1M token · valuta /compact')
  expect(contaToken(1_400_000)).toBe('1M / 1M token · valuta /compact')
})
