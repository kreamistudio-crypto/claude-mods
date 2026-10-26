# contesto

Due comandi per le chat lunghe, in qualsiasi chat e su qualsiasi argomento.

- Appena caricato, il plugin accende gli avvisi sul contesto in quella chat; `/avvisi` li spegne (e li riaccende se lo riscrivi). Mostra la percentuale del contesto usato e avvisa al 55% (🟠, è ora del passaggio) e al 65% (🔴, fallo adesso). Se l'app non mostra la riga di stato, l'avviso arriva in cima alla risposta.
- `/passaggio` scrive il passaggio di consegne completo di quella chat in un file .md (come lavoriamo, cose da fare subito, stato, lavori aperti, decisioni, comandi, persone, promemoria e tutto il resto), da allegare in una chat nuova scrivendo «riprendi da qui».

Con gli avvisi accesi, anche la compattazione automatica conserva per esteso comandi, decisioni e lavori aperti.

## Installazione

```
/plugin install contesto --marketplace kreamistudio-crypto/claude-mods
```

Rispondi `y` per aggiungere il marketplace, poi scegli lo scope utente.

Nell'app Claude (dove `/plugin` non esiste) si carica con la skill «contesto»: in una chat scrivi `/contesto`, poi accetta «Turn on the mods».
