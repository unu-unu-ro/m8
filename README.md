
# 8 Săptămâni prin Evanghelia după Marcu 📖

Acest site oferă un ghid simplu pentru citirea și discuția Evangheliei după Marcu pe parcursul a 8 săptămâni, în cadrul întâlnirilor unu-la-unu.  
Este inspirat de cartea [One-to-One Bible Reading](https://matthiasmedia.com/products/one-to-one-bible-reading) scrisă de David Helm, publicată de Matthias Media.

## 🔗 Accesează site-ul

[![Live](https://img.shields.io/badge/Vezi_live-m8.unu--unu.ro-brightgreen?style=for-the-badge)](https://m8.unu-unu.ro)

## ✨ Ce conține

- Întrebări clare, săptămână cu săptămână, pentru 8 pasaje din Evanghelia după Marcu
- **Română și engleză**: comutatorul **RO · EN** din colțul din dreapta-sus al paginii; alegerea se reține în browser. Poți trimite direct un link către o limbă: `https://m8.unu-unu.ro/?lang=en`
- Referința biblică a fiecărei săptămâni deschide pasajul pe bible.com (NTR pentru română, ESV pentru engleză)
- **Mod întunecat**: urmează implicit setarea sistemului; comutatorul din josul paginii o suprascrie
- Navigare între săptămâni din cronologia de sus, din butoanele „anterioară / următoare”, cu săgețile ← → de pe tastatură sau prin swipe pe telefon; săptămâna curentă se reține între vizite
- Design minimalist, tipografic, gândit pentru citit pe telefon și pe desktop

## 📄 Sursa conținutului

Planul de citire și întrebările sunt **extrase și adaptate** din cartea *One-to-One Bible Reading* de David Helm (© Matthias Media și Holy Trinity Church, 2011).  
Întrebările în engleză sunt cele din materialul original; cele în română sunt traducerea lor.  
Cartea poate fi achiziționată de pe [matthiasmedia.com](https://matthiasmedia.com/products/one-to-one-bible-reading).

## 💡 Sugestii de utilizare

- Programează întâlniri săptămânale cu un prieten
- Citiți împreună pasajele indicate din Evanghelia după Marcu
- Folosiți întrebările pentru reflecție, discuție și rugăciune

## 🛠️ Dezvoltare

Aplicație statică (HTML, CSS, JavaScript, fără dependențe), găzduită pe GitHub Pages.

```
index.html                  structura paginii
script.js                   încărcarea întrebărilor, limbă, temă, navigare
assets/style.css            stilurile
assets/intrebari.json       întrebările în română
assets/intrebari.en.json    întrebările în engleză
assets/intrebaricopii.json  set de întrebări adaptat pentru copii (7-12 ani), nefolosit încă în interfață
```

Pentru a rula local, servește directorul cu orice server static (de exemplu `npx serve .`); fișierele JSON se încarcă prin `fetch`, așa că deschiderea directă a `index.html` din sistemul de fișiere nu funcționează.

## 📬 Feedback

Ai idei de îmbunătățire sau întrebări? Deschide un issue sau trimite un pull request!

---

**Notă**: Acest site este un proiect necomercial cu scop educațional și spiritual.
