import { test, expect } from 'claude-code/testing'

type Run = Parameters<typeof import('claude-code/testing')['test']> extends never ? never : any

test('/contesto accende e poi spegne gli avvisi', async $ => {
  const accesi = await $.command.run({ command: 'contesto', args: '' } as any)
  expect(accesi.text ?? '').toContain('accesi')
  const spenti = await $.command.run({ command: 'contesto', args: '' } as any)
  expect(spenti.text ?? '').toContain('spenti')
})

test('/passaggio risponde e prepara il passaggio di consegne', async $ => {
  const out = await $.command.run({ command: 'passaggio', args: '' } as any)
  expect(out.text ?? '').toContain('passaggio di consegne')
})
