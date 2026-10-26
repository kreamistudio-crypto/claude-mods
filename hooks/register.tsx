import { atom, read, update } from 'claude-code'
import type { Register, EngineInterface } from 'claude-code'

// Stato della chat: gli avvisi sono accesi? a che percentuale siamo?
const attivo = atom({ plugin: 'contesto', key: 'attivo' } as const, true)
const percentuale = atom({ plugin: 'contesto', key: 'percent' } as const, null)

// Soglie dell'avviso (percentuale del contesto pieno), come nella chat di Barattolo.
const AVVISO = 55
const URGENTE = 65

// Il prompt che /passaggio manda al modello: il passaggio di consegne completo, per qualsiasi chat.
const PASSAGGIO = `/passaggio — Scrivi adesso il PASSAGGIO DI CONSEGNE completo di questa chat, per ripartire in una chat nuova senza perdere NESSUN dettaglio, né della chat né del progetto.

COME:
1. Rileggi TUTTA la conversazione dall'inizio. Se c'è stata una compattazione e il riassunto indica il percorso della trascrizione completa, leggi quella trascrizione per intero: i dettagli persi nel riassunto vanno recuperati da lì.
2. Rileggi la memoria: i file che riguardano l'argomento di questa chat (progetto, persone, preferenze).
3. Se in questa chat è stato allegato un passaggio di consegne precedente, il nuovo passaggio lo CONTIENE: in cima la sezione nuova con data e ora («ULTIMO AGGIORNAMENTO — leggere per primo»), sotto il vecchio intatto.
4. Scrivi tutto in un file .md nella cartella di lavoro, nella lingua della chat, e mandalo con SendUserFile. Nome: passaggio-<argomento>-<data>.md.
5. Dove non sai una cosa scrivi «non so», non inventare. Niente segreti nel file (password, chiavi private, nsec, token): solo dove stanno e come si leggono.

SEZIONI, in quest'ordine:
A. COME RIPRENDERE: cosa scrivere nella chat nuova e la prima cosa da fare.
B. COME LAVORIAMO: il ruolo che ho in questa chat, lo stile delle risposte, i formati (comandi, prompt, testi), le regole e le frasi fisse che usiamo, con un esempio dove serve.
C. LE COSE DA FARE SUBITO, in ordine: per ognuna, cosa, perché, il comando o il testo pronto, chi aspetta cosa.
D. STATO DEL PROGETTO OGGI: cosa è fatto, cosa è in corso, cosa è acceso o spento, versioni e numeri.
E. LAVORI APERTI (una riga ciascuno): nome · stato esatto · ultimo passo fatto · prossimo passo · cosa resta da provare.
F. DECISIONI PRESE: data, chi ha deciso, il perché in una riga; segnala quando una decisione ne rovescia una vecchia.
G. ACCESSI, COMANDI E PERCORSI: comandi esatti in un riquadro di codice, uno per riga, con a fianco cosa sono e da dove si lanciano.
H. PERSONE E CONVERSAZIONI APERTE: chi aspetta una risposta, cosa gli abbiamo detto, testi pronti non ancora mandati.
I. PROMEMORIA CON DATA.
L. LISTA DA FARE NON URGENTE e cose notate lasciate ferme.
M. TUTTO IL RESTO della chat che non sta nelle sezioni sopra: meglio un dettaglio in più che uno perso.

Alla fine, nella risposta, una sola riga: «Apri una chat nuova, allega il file e scrivi: riprendi da qui.»`

// Cosa la compattazione automatica deve conservare quando gli avvisi sono accesi.
const DA_CONSERVARE = `Conserva per esteso, senza riassumere: comandi, percorsi e accessi esatti; formati e frasi fisse che usiamo; l'elenco dei lavori aperti con stato e prossimo passo; le decisioni con data e motivo; le persone che aspettano una risposta e i testi pronti; i promemoria con data. Scrivi nel riassunto il percorso della trascrizione completa.`

let avvisato = 0

async function leggi($: EngineInterface): Promise<number | undefined> {
  try {
    return (await $.session.usage()).context.percent
  } catch {
    return undefined
  }
}

async function aggiorna($: EngineInterface): Promise<void> {
  if (!(await read($, attivo))) return
  const p = await leggi($)
  if (p === undefined) return
  await update($, percentuale, () => p)
  const icona = p >= URGENTE ? '🔴' : p >= AVVISO ? '🟠' : '🧠'
  $.ui.status(`${icona} contesto ${p}%`)
  if (p >= URGENTE && avvisato < URGENTE) {
    avvisato = URGENTE
    $.ui.toast(`🔴 Contesto al ${p}%: scrivi /passaggio adesso e apri una chat nuova.`)
  } else if (p >= AVVISO && avvisato < AVVISO) {
    avvisato = AVVISO
    $.ui.toast(`🟠 Contesto al ${p}%: è ora del passaggio di consegne. Scrivi /passaggio.`)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'avvisi',
      description: 'Spegne (o riaccende) gli avvisi sul contesto in questa chat',
    })
    await $.command.register({
      name: 'passaggio',
      description: 'Scrive il passaggio di consegne completo di questa chat, per ripartire in una chat nuova',
    })
    await aggiorna($)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    try { await aggiorna($) } catch { /* nessun dato */ }
    return done
  })

  on('command.run', { command: 'avvisi' }, async $ => {
    const ora = !(await read($, attivo))
    await update($, attivo, () => ora)
    if (!ora) {
      await update($, percentuale, () => null)
      $.ui.status(undefined)
      return { text: '🔕 Avvisi sul contesto spenti in questa chat. /avvisi per riaccenderli.' }
    }
    avvisato = 0
    const p = await leggi($)
    if (p !== undefined) await update($, percentuale, () => p)
    await aggiorna($)
    const dove = p === undefined ? '' : ` Adesso siamo al ${p}%.`
    return {
      text: `🧠 Avvisi sul contesto accesi.${dove} Ti avviso al ${AVVISO}% e al ${URGENTE}%; quando vuoi, /passaggio scrive il passaggio di consegne.`,
    }
  })

  on('command.run', { command: 'passaggio' }, async $ => {
    // Il prompt parte appena il comando ha finito: da qui non si può aspettare il turno.
    $.clock.after(300, () => {
      void $.prompt.submit({ text: PASSAGGIO, asUser: true })
    })
    return { text: '📝 Preparo il passaggio di consegne completo…' }
  })

  // L'app potrebbe non mostrare né la riga di stato né la striscia: a ogni messaggio
  // passo al modello la percentuale, così l'avviso arriva anche nella risposta.
  on('prompt.submit', async ($, e, next) => {
    if (!(await read($, attivo))) return next(e)
    const p = await leggi($)
    if (p === undefined) return next(e)
    const nota =
      p >= URGENTE
        ? `[mod contesto] Contesto al ${p}%. Avvisa in cima alla risposta, in una riga: «🔴 Contesto al ${p}%: scrivi /passaggio adesso e apri una chat nuova».`
        : p >= AVVISO
          ? `[mod contesto] Contesto al ${p}%. Avvisa in cima alla risposta, in una riga: «🟠 Contesto al ${p}%: è ora del passaggio di consegne, scrivi /passaggio».`
          : `[mod contesto] Contesto al ${p}%. Se ti chiedono a che punto è il contesto, rispondi con questo numero; altrimenti non dirlo.`
    return next({ ...e, context: [...(e.context ?? []), nota] })
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const p = await read($, percentuale)
    if (!(await read($, attivo)) || p === null || e.props.hasSurvey) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const icona = p >= URGENTE ? '🔴' : p >= AVVISO ? '🟠' : '🧠'
    const consiglio = p >= AVVISO ? ' · è ora di /passaggio' : ' · /passaggio per il passaggio di consegne'
    return (
      <Box>
        <Text dimColor={p < AVVISO}>
          {icona} contesto {p}%{consiglio}
        </Text>
      </Box>
    )
  })

  on('session.compact', async ($, e, next) => {
    if (e.agentId !== undefined || !(await read($, attivo))) return next(e)
    const instructions = e.instructions ? `${e.instructions}\n\n${DA_CONSERVARE}` : DA_CONSERVARE
    return next({ ...e, instructions })
  }).catch(($, e, next) => next(e))
}
