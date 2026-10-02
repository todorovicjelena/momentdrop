# MomentDrop - ukratko

## O čemu je sajt

Aplikacija za deljenje fotografija/video snimaka sa događaja (venčanja, krštenja, rođendani, žurke) - gosti skeniraju QR kod na stolu i šalju slike direktno sa telefona kroz browser, bez instaliranja ičega i bez pravljenja naloga. Domaćin (vlasnik događaja) posle skida celu galeriju.

Freemium model: besplatno do 60 fajlova/14 dana čuvanja, plaćeni planovi (Standard/Premium) za veće događaje i duže čuvanje.

## Tehnologije i zašto

| Tehnologija | Za šta | Zašto baš to |
|---|---|---|
| **Next.js 16** (App Router, Turbopack, Server Actions) | Ceo framework - stranice, ruta, backend logika | Jedan projekat pokriva i frontend i backend (Server Actions umesto posebnog API-ja), brz dev server (Turbopack) |
| **React 19** | UI biblioteka | Ide uz Next.js, najnovija verzija sa boljim async/transition podrškom (npr. za SR/EN prekidač) |
| **TypeScript** | Tipizacija celog koda | Hvata greške pre nego što stignu do korisnika (npr. da srpski i engleski prevod imaju iste ključeve) |
| **Tailwind CSS v4** | Stilizovanje | Brzo pisanje stilova direktno u komponentama, bez posebnih CSS fajlova |
| **Supabase** (Postgres + Auth + RLS) | Baza podataka, prijava (uključujući Google login) | Sve u jednom - baza i autentifikacija zajedno, RLS (Row Level Security) štiti da svako vidi samo svoje podatke |
| **Cloudflare R2** (preko `@aws-sdk/client-s3`) | Skladištenje fotografija/videa | S3-kompatibilan storage, ali jeftiniji (nema naplate za "izlazni" saobraćaj kad neko preuzima fajlove) |
| **Lemon Squeezy** | Naplata Standard/Premium planova | Stripe ne podržava prodavce iz Srbije - Lemon Squeezy jeste (Merchant of Record, oni se brinu o porezima) |
| **browser-image-compression** | Sažimanje slika u browseru pre slanja | Brži upload za gosta, manje mesta na storage-u |
| **client-zip** | Pravljenje ZIP-a galerije za preuzimanje | Radi direktno u browseru, bez opterećenja servera |
| **qrcode** | Generisanje QR koda za svaki događaj | Gost skenira i odmah je na stranici za slanje slika |
| **shadcn / @base-ui/react** | Osnovne UI komponente (dijalozi, dugmad...) | Gotovi, pristupačni (accessibility) building blok-ovi koje onda stilizujem po svom dizajnu |
| **sonner** | Toast obaveštenja | Standardna, laka biblioteka za "uspešno sačuvano" poruke i slično |
| **lucide-react** | Ikonice | Konzistentan set ikonica kroz ceo sajt |

Kratko rečeno: Next.js/React/TypeScript su "kostur" celog sajta, Supabase i R2 su gde se čuvaju podaci i fajlovi, Lemon Squeezy je naplata, a ostatak su manje, specijalizovane biblioteke za konkretne zadatke (kompresija slika, ZIP, QR kod) da ne moram sve to da pišem od nule.

## Kompresija slika - šta se tačno čuva i skida

Nema posebnog "originala" koji se negde čuva u punoj rezoluciji - kompresovana verzija je ono što se i čuva i kasnije skida.

Konkretno (`src/lib/uploads.ts` + `src/hooks/use-guest-uploads.ts`):

- Slika se pre slanja smanji u browseru gosta na **maksimalno 2500px** po dužoj strani, kvalitet **80%**, do **4MB**.
- Ta ista (već smanjena) datoteka ide na R2 storage - i to je tačno ono što domaćin kasnije preuzima kroz ZIP download.
- Jedini izuzetak: **HEIC/HEIF** fajlovi (iPhone-ov format) se šalju bez kompresije, jer većina browsera ne ume da ih dekodira/ponovo enkodira - ti prolaze u originalnoj veličini kakvu telefon snimi.

Zašto je ovo OK: 2500px je i dalje sasvim dovoljno za štampanje standardnih veličina fotografija i deljenje na društvenim mrežama - cilj kompresije nije da "osiromaši" sliku, nego da gostu na mobilnom internetu (npr. na venčanju gde je signal slab) upload bude brz i da se ne troši nepotrebno prostora na storage-u za rezoluciju koju niko neće primetiti.

## Ideje za budućnost (nije urađeno, samo zapisano)

### Albumi

Dve moguće varijante:

1. **Automatski, po vremenu** - galerija se sama deli na sekcije (npr. "Ceremonija", "Večera", "Žurka") na osnovu kad su fotografije poslate, bez ikakvog unosa od strane gosta ili domaćina. Domaćin bi mogao da podesi granice vremena pri kreiranju događaja.
2. **Ručni albumi, svaki sa svojim QR kodom** - domaćin napravi album (npr. "Dvorište", "Glavni sto"), dobije poseban QR/link za njega, i sve što se pošalje kroz taj link automatski ide u taj album - bez da gost bira album iz menija pri slanju (što bi usporilo upload).

Varijanta 2 se prirodnije uklapa u postojeći sistem (svaki event već ima QR kod) i ne usporava gosta pri slanju - to je trenutni favorit ako se ovo bude radilo.

### Digitalna pozivnica + RSVP

Mnogi konkurenti (The Knot, Zola, WithJoy...) nude digitalnu pozivnicu i RSVP kao deo paketa. Kod nas bi radilo ovako - **mi ne šaljemo ništa** (nema mejl/SMS servisa, nema troška slanja), samo pravimo stranicu koju domaćin deli sam, isto kao što već deli QR kod/link za slanje slika:

- Nova javna stranica, npr. `/event/[slug]/pozivnica` (isti obrazac kao `/event/[slug]` za upload - javna, bez naloga).
- Prikazuje detalje događaja (naslov, datum, lokacija, raspored), uz postojeću brending pozadinu.
- RSVP forma ispod: ime, "Dolazim / Ne dolazim", broj osoba, napomena (alergije, poruka).
- Domaćin vidi odgovore u dashboard-u (nova tabela u bazi, isti obrazac kao `uploads`).
- Domaćin deli stranicu sam (WhatsApp, Viber, SMS, mejl) - kao i danas sa linkom za slike.

Realan obim posla: jedna nova tabela, jedna nova javna stranica, jedan novi prikaz u dashboard-u. Prirodan dodatak postojećem sistemu, ne novi proizvod.
