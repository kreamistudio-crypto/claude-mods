import { test, expect } from 'claude-code/testing'

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
