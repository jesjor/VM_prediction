import { useState, useEffect, useRef } from 'react'
import api from '../api'

const CATEGORIES = [
  { id: 'history',  emoji: '🏆', name: 'VM Historie',         color: '#8b5cf6', desc: 'Fra Uruguay 1930 til Qatar 2022' },
  { id: 'legends',  emoji: '⚽', name: 'Legender & Rekorder', color: '#3b82f6', desc: 'De største spillere og rekorder' },
  { id: '9010',     emoji: '🎯', name: 'VM 1990–2010',         color: '#10b981', desc: 'Dine fødselsårtiers VM' },
  { id: '1026',     emoji: '🌍', name: 'VM 2010–2026',         color: '#f97316', desc: 'De seneste turneringer' },
  { id: 'funfacts', emoji: '🤪', name: 'Fun Facts & Kuriøst',  color: '#ec4899', desc: 'Skøre statistikker og sjove fakta' },
  { id: 'kontrov',  emoji: '🧩', name: 'Regler & Kontrovers',  color: '#ef4444', desc: 'VAR, røde kort og drama' },
  { id: 'vm2026',   emoji: '🌐', name: 'VM 2026 Special',      color: '#06b6d4', desc: 'Alt om det aktuelle VM' },
]

const QUESTIONS = {
  history: [
    { q: 'Hvilket land var vært for det allerførste VM i 1930?', a: ['Uruguay','Brasilien','Italien'], correct: 0, fact: 'Uruguay vandt også turneringen og slog Argentina 4-2 i finalen.' },
    { q: 'Hvilken nation har vundet flest VM-titler?', a: ['Brasilien (5)','Tyskland (4)','Italien (4)'], correct: 0, fact: 'Brasilien er det eneste hold der har deltaget i ALLE VM-slutrunder.' },
    { q: 'I hvilken årti blev gult og rødt kort indført til VM?', a: ['1970\'erne','1960\'erne','1980\'erne'], correct: 0, fact: 'Kortene kom ved VM 1970 i Mexico. Dommeren Ken Aston fik idéen fra trafiklys.' },
    { q: 'Hvad er den højeste sejr i VM-historien?', a: ['Ungarn 10–1 El Salvador (1982)','Tyskland 8–0 Saudi-Arabien','Jugoslav. 9–0 Zaire (1974)'], correct: 0, fact: 'Ungarn vandt 10-1 mod El Salvador ved VM 1982 i Spanien.' },
    { q: 'Hvem scorede det første mål i VM-historien?', a: ['Lucien Laurent (Frankrig)','Bert Patenaude (USA)','Pedro Cea (Uruguay)'], correct: 0, fact: 'Lucien Laurent scorede til 1-0 for Frankrig mod Mexico den 13. juli 1930.' },
    { q: 'Hvad var den berømte "Guds hånd"-kamp?', a: ['Argentina vs England, 1986','Argentina vs England, 1990','Brasilien vs England, 1986'], correct: 0, fact: 'Maradona scorede med hånden mod England i kvartfinalen i Mexico 1986. Han scorede også "Århundredets mål" i samme kamp.' },
    { q: 'Hvilken nation har spillet flest VM-finaler uden at vinde?', a: ['Holland (3 finaler, 0 titler)','Ungarn (2 finaler, 0 titler)','Portugal (2 finaler, 0 titler)'], correct: 0, fact: 'Holland tabte finaler i 1974, 1978 og 2010 — aldrig vundet trods tre forsøg.' },
    { q: 'Hvornår var VM for første gang i Afrika?', a: ['Sydafrika 2010','Marokko 1994','Nigeria 2006'], correct: 0, fact: 'Sydafrika 2010 var det første VM på det afrikanske kontinent.' },
    { q: 'Hvad hedder VM-pokalen officielt?', a: ['FIFA World Cup Trophy','Jules Rimet Trophy','Golden Cup'], correct: 0, fact: 'Den nuværende pokal hedder "FIFA World Cup Trophy". Den originale pokal hed Jules Rimet Trophy.' },
    { q: 'Hvilket land vandt VM 1934 og 1938 i træk?', a: ['Italien','Brasilien','Argentina'], correct: 0, fact: 'Italien under Vittorio Pozzo er det eneste hold der har forsvaret VM-titlen.' },
    { q: 'Hvornår opstod straffesparkskonkurrencer ved VM?', a: ['1982 i Spanien','1978 i Argentina','1986 i Mexico'], correct: 0, fact: 'Den første VM-straffesparksserie var Vesttyskland vs Frankrig i semifinalen ved VM 1982.' },
    { q: 'Hvilket hold tabte VM-finalen i 1950 på hjemmebane?', a: ['Brasilien (mod Uruguay)','Argentina (mod Uruguay)','Brasilien (mod Argentina)'], correct: 0, fact: 'Det kendes som "Maracanazo" — Uruguay vandt 2-1 for 200.000 tilskuere i Rio.' },
    { q: 'Hvor mange hold deltog ved det allerførste VM i 1930?', a: ['13 hold','16 hold','8 hold'], correct: 0, fact: 'Kun 13 nationer deltog, da mange europæiske lande boycottede pga. de lange skibsrejser.' },
    { q: 'Hvad var VM 1970 i Mexico det første VM til?', a: ['Vises i farve-TV globalt','Brug af røde kort','Brug af substitutter'], correct: 0, fact: 'VM 1970 var det første i farve-TV og det første med substitutter og røde/gule kort.' },
    { q: 'I hvilken by stod VM-finalen i 1966 da England vandt?', a: ['London (Wembley)','Manchester','Liverpool'], correct: 0, fact: 'England slog Vesttyskland 4-2 på Wembley. Geoff Hurst scorede hat-trick — stadig unik i VM-finaler.' },
  ],
  legends: [
    { q: 'Hvem har scoret flest mål i VM-historien?', a: ['Miroslav Klose (16 mål)','Ronaldo Brasilien (15 mål)','Gerd Müller (14 mål)'], correct: 0, fact: 'Miroslav Klose scorede 16 VM-mål fordelt på fire turneringer (2002, 2006, 2010, 2014).' },
    { q: 'Hvem vandt Guldbolden ved VM 2022 i Qatar?', a: ['Lionel Messi','Kylian Mbappé','Luka Modrić'], correct: 0, fact: 'Messi vandt sin anden VM Guldbold og sin første VM-titel med 7 mål og 3 assists.' },
    { q: 'Hvem er den yngste målscorer i VM-historien?', a: ['Pelé (17 år, 1958)','Cesc Fàbregas (17 år, 2006)','Michael Owen (18 år, 1998)'], correct: 0, fact: 'Pelé scorede mod Wales i kvartfinalen ved VM 1958 som blot 17-årig.' },
    { q: 'Hvem scorede "Århundredets mål" ved VM 1986?', a: ['Diego Maradona','Michel Platini','Gary Lineker'], correct: 0, fact: 'Maradona drev bolden fra egen halvbane, løb forbi fem engelske spillere og scorede efter 11 sekunder.' },
    { q: 'Hvem er den eneste spiller der har vundet VM tre gange?', a: ['Pelé (1958, 1962, 1970)','Ronaldo (2002, 2006, 2010)','Cafú (1994, 1998, 2002)'], correct: 0, fact: 'Pelé er den eneste der har vundet tre VM. Han scorede totalt 12 mål i VM-turneringer.' },
    { q: 'Hvem scorede flest mål ved ét enkelt VM?', a: ['Just Fontaine, 13 mål (1958)','Sándor Kocsis, 11 mål (1954)','Gerd Müller, 10 mål (1970)'], correct: 0, fact: 'Just Fontaines rekord på 13 mål ved VM 1958 i Sverige har stået i over 60 år.' },
    { q: 'Hvad er rekorden for flest VM-deltagelser af én spiller?', a: ['5 VM (Lothar Matthäus & Carbajal)','4 VM','6 VM'], correct: 0, fact: 'Lothar Matthäus og Antonio Carbajal deltog begge ved 5 VM-slutrunder.' },
    { q: 'Hvem scorede hat-trick i VM-finalen i 1966?', a: ['Geoff Hurst (England)','Bobby Charlton (England)','Helmut Haller (Vesttyskland)'], correct: 0, fact: 'Geoff Hurst er stadig den eneste spiller der har scoret hat-trick i en VM-finale.' },
    { q: 'Hvem er den eneste spiller med VM-guld som spiller OG manager?', a: ['Franz Beckenbauer (Tyskland)','Didier Deschamps (Frankrig)','Zinedine Zidane (Frankrig)'], correct: 0, fact: 'Franz Beckenbauer vandt VM som kaptajn i 1974 og som manager i 1990.' },
    { q: 'Hvem er den ældste målscorer i VM-historien?', a: ['Roger Milla (42 år, 1994)','Lothar Matthäus (38 år, 1998)','Hossam Hassan (34 år, 2006)'], correct: 0, fact: 'Roger Milla scorede mod Rusland ved VM 1994 som 42 år og 39 dage gammel.' },
    { q: 'Hvem vandt VM Guldbolden i 1998 i Frankrig?', a: ['Ronaldo (Brasilien)','Zinedine Zidane','Davor Šuker'], correct: 0, fact: 'Ronaldo vandt Guldbolden til trods for at Frankrig vandt 3-0 med to Zidane-hoveder i finalen.' },
    { q: 'Hvad hedder den officielle VM-topscorerpris?', a: ['Den Gyldne Støvle','Guldbolden','Den Gyldne Handske'], correct: 0, fact: 'Den Gyldne Støvle gives til VM\'s topscorer. Den Gyldne Handske gives til bedste målmand.' },
    { q: 'Hvem scorede hat-trick i VM-finalen 2022?', a: ['Kylian Mbappé (Frankrig)','Lionel Messi (Argentina)','Olivier Giroud (Frankrig)'], correct: 0, fact: 'Mbappé scorede hat-trick i finalen — det andet nogensinde i en VM-finale efter Geoff Hurst i 1966.' },
    { q: 'Hvem er topscorer i en enkelt VM-kamp med 5 mål?', a: ['Oleg Salenko (Rusland, 1994)','Eusébio (Portugal, 1966)','Gerd Müller (Tyskland, 1970)'], correct: 0, fact: 'Oleg Salenko scorede 5 mål mod Cameroun ved VM 1994 — en rekord der har stået siden.' },
    { q: 'Hvem scorede det hurtigste hat-trick i VM-historien?', a: ['László Kiss (Ungarn, 7 min, 1982)','Hakan Şükür (bare hurtigste mål)','Gerd Müller (1974)'], correct: 0, fact: 'László Kiss scorede hat-trick på 7 minutter for Ungarn mod El Salvador ved VM 1982.' },
  ],
  '9010': [
    { q: 'Hvad er VM 1990 i Italien mest kendt som?', a: ['Det lavest-scorende VM nogensinde','Det VM med flest røde kort','Det første VM med VAR'], correct: 0, fact: 'VM 1990 er stadig det VM med færrest mål pr. kamp — gennemsnitligt kun 2,21 mål per kamp.' },
    { q: 'Hvem vandt VM 1994 i USA?', a: ['Brasilien (via straffespark)','Italien','Sverige'], correct: 0, fact: 'Brasilien vandt sin fjerde titel — Roberto Baggio brændte det afgørende straffespark.' },
    { q: 'Hvad skete der med Zinedine Zidane i VM-finalen 2006?', a: ['Han headede Marco Materazzi og fik rødt kort','Han brændte et afgørende straffespark','Han scorede kampens eneste mål'], correct: 0, fact: 'Zidane headede Materazzi i brystet og fik rødt kort — i sin allersidste professionelle kamp.' },
    { q: 'Hvem satte rekord for hurtigste røde kort ved VM?', a: ['José Batista (Uruguay, 1986) — 56 sek.','Zinedine Zidane (2006) — 1 min','Giorgio Ferrini (1962) — 3 min'], correct: 0, fact: 'José Batista fra Uruguay fik rødt kort efter blot 56 sekunder mod Skotland ved VM 1986.' },
    { q: 'Hvilken nation kom overraskende på 4. plads ved VM 2002?', a: ['Sydkorea','Senegal','USA'], correct: 0, fact: 'Sydkorea eliminerede Portugal, Spanien og Tyskland på vej til semifinalen.' },
    { q: 'Hvem vandt Den Gyldne Støvle ved VM 1994?', a: ['Stoichkov & Salenko (begge 6 mål)','Romário (Brasilien)','Roberto Baggio (Italien)'], correct: 0, fact: 'Stoichkov og Salenko delte prisen med 6 mål hver. Salenko scorede 5 i én kamp!' },
    { q: 'Hvem scorede det hurtigste mål i VM-historien?', a: ['Hakan Şükür (Tyrkiet) — 11 sek., 2002','Bryan Robson (England) — 27 sek., 1982','Davide Gualtieri — 8 sek. (VM-kvali)'], correct: 0, fact: 'Hakan Şükür scorede til 1-0 for Tyrkiet mod Sydkorea i bronzekampen ved VM 2002 efter blot 11 sekunder.' },
    { q: 'Hvem vandt VM i Frankrig 1998?', a: ['Frankrig','Brasilien','Holland'], correct: 0, fact: 'Frankrig slog Brasilien 3-0 i finalen med to Zidane-hoveder. 1,5 millioner franskmænd fejrede.' },
    { q: 'Hvad skete berømt med Ronaldo natten inden VM-finalen 1998?', a: ['Han fik et mystisk krampeanfald','Han skændtes med manageren','Han var skadet fra semifinalen'], correct: 0, fact: 'Ronaldo fik kramper natten før finalen og præsterede langt under niveau da Frankrig vandt 3-0.' },
    { q: 'Hvem vandt VM 2010 i Sydafrika?', a: ['Spanien','Holland','Brasilien'], correct: 0, fact: 'Spanien vandt sin første VM-titel — Andres Iniesta scorede i overtiden mod Holland. 1-0.' },
    { q: 'Hvad er "Phantom Goal"-kontroversen fra VM 2010?', a: ['Lampards skud krydsede linjen — ikke godkendt','Tevez\'s offsidemål mod Mexico','Begge hændelser'], correct: 2, fact: 'Begge hændelser i 2010 accelererede indførslen af mållinjetekologi og siden VAR.' },
    { q: 'Hvem vandt VM 2006 i Tyskland?', a: ['Italien','Frankrig','Portugal'], correct: 0, fact: 'Italien vandt sin fjerde VM-titel via straffespark mod Frankrig efter 1-1 efter forlænget spilletid.' },
    { q: 'Hvad slog Danmark Uruguy med ved VM 1986 i "Danish Dynamite"?', a: ['6-1','4-1','3-0'], correct: 0, fact: '"Danish Dynamite" scorede 6-1 mod Uruguay — inden 1-5 til Spanien i 2. runde.' },
    { q: 'Hvad er "Maracanazo"?', a: ['Uruguay vandt 2-1 over Brasilien på Maracanã i 1950','Brasiliens sejr over Uruguay i 1970','Maradonas mål i 1986'], correct: 0, fact: '"Maracanazo" er det chokerende 2-1 tab for Brasilien til Uruguay foran 200.000 hjemmefans i 1950.' },
    { q: 'Hvem var Cameruns store stjerne ved VM 1990 — "Indomitable Lions"?', a: ['Roger Milla','Samuel Eto\'o','Patrick Mboma'], correct: 0, fact: 'Roger Milla scorede 4 mål ved VM 1990 og fejrede hvert mål med en dans om hjørneflaget.' },
  ],
  '1026': [
    { q: 'Hvem scorede flest mål ved VM 2014?', a: ['James Rodríguez (Colombia, 6 mål)','Thomas Müller (5 mål)','Lionel Messi (4 mål)'], correct: 0, fact: 'James Rodríguez vandt Den Gyldne Støvle med 6 mål, inkl. et saksespark mod Uruguay.' },
    { q: 'Hvad hedder Brasiliens 1-7 tab til Tyskland ved VM 2014?', a: ['"Das Mineirão" / "Mineirazo"','"Die Tragödie"','"Seven-One"'], correct: 0, fact: 'Brasilien tabte 1-7 til Tyskland i semifinalen på hjemmebane — den mest chokerende VM-semifinale nogensinde.' },
    { q: 'Hvem vandt VM 2014 i Brasilien?', a: ['Tyskland','Argentina','Brasilien'], correct: 0, fact: 'Tyskland vandt 1-0 mod Argentina med Mario Götzes mål i forlænget spilletid.' },
    { q: 'Hvem vandt VM 2018 i Rusland?', a: ['Frankrig','Kroatien','Belgien'], correct: 0, fact: 'Frankrig vandt 4-2 mod Kroatien i finalen med mål af bl.a. Pogba og den 19-årige Mbappé.' },
    { q: 'Hvem vandt VM 2022 i Qatar?', a: ['Argentina','Frankrig','Marokko'], correct: 0, fact: 'Argentina vandt via straffespark mod Frankrig — 3-3 efter forlænget spilletid.' },
    { q: 'Hvem var den overraskende semifinalist ved VM 2022?', a: ['Marokko','Senegal','Cameroun'], correct: 0, fact: 'Marokko var det første afrikanske og arabiske hold nogensinde at nå en VM-semifinale.' },
    { q: 'Hvem vandt Den Gyldne Støvle ved VM 2022?', a: ['Kylian Mbappé (8 mål)','Lionel Messi (7 mål)','Olivier Giroud (4 mål)'], correct: 0, fact: 'Mbappé vandt Den Gyldne Støvle med 8 mål i Qatar — på trods af at Frankrig tabte finalen.' },
    { q: 'Hvilke tre lande er værtsnationer for VM 2026?', a: ['USA, Mexico og Canada','USA, Mexico og Brasilien','USA, Canada og Argentina'], correct: 0, fact: 'VM 2026 er første gang tre nationer er værtslande og første gang siden 1994 i Nordamerika.' },
    { q: 'Hvor mange hold deltager ved VM 2026?', a: ['48 hold','32 hold','64 hold'], correct: 0, fact: 'VM 2026 udvider fra 32 til 48 hold — den største udvidelse i turneringens historie.' },
    { q: 'Hvor afholdes VM 2026-finalen?', a: ['MetLife Stadium, New York/New Jersey','SoFi Stadium, Los Angeles','Azteca, Mexico City'], correct: 0, fact: 'MetLife Stadium huser finalen den 19. juli 2026 med plads til over 82.000 tilskuere.' },
    { q: 'Hvad er unikt ved Estadio Azteca ved VM 2026?', a: ['3. gang det huser VM (1970, 1986, 2026)','2. gang (1986 og 2026)','VM-debut i 2026'], correct: 0, fact: 'Estadio Azteca er det eneste stadion der huser VM for tredje gang.' },
    { q: 'Hvad er VM 2026\'s officielle maskot?', a: ['Tezcat — en stiliseret jaguar','Tico — en kaktus','Ale — en ørn'], correct: 0, fact: 'Tezcat er en stiliseret jaguar inspireret af den aztekiske gud Tezcatlipoca.' },
    { q: 'Hvad var kontroversielt ved VM i Qatar 2022?', a: ['Vinter-afholdelse og menneskerettigheder','Kun 32 hold deltog','VAR blev ikke brugt'], correct: 0, fact: 'VM 2022 var historiens første vinter-VM og omgærdet af debat om migrantarbejderes rettigheder.' },
    { q: 'Hvad er det nye gruppeformat ved VM 2026?', a: ['12 grupper à 4 hold — top 2 + 8 bedste 3\'ere videre','8 grupper à 6 hold','16 grupper à 3 hold'], correct: 0, fact: 'VM 2026 har 12 grupper med 4 hold. Top 2 + de 8 bedste tredjepladser fortsætter.' },
    { q: 'Hvem scorede det berømte saksespark-mål for Colombia ved VM 2014?', a: ['James Rodríguez (mod Uruguay)','Falcao (mod Grækenland)','Cuadrado (mod Japan)'], correct: 0, fact: 'James Rodríguez scorede et fantastisk saksespark mod Uruguay i 2. runde — kåret til VM 2014\'s mål.' },
  ],
  funfacts: [
    { q: 'Hvad er den officielle VM-bold fra 2010 berømt for?', a: ['Jabulani — kritiseret for uforudsigelig flyvebane','Teamgeist — rekord for mål','Brazuca — første runde bold'], correct: 0, fact: 'Jabulani-bolden fra VM 2010 fik massiv kritik fra målmænd for sin usædvanlige flyvebane.' },
    { q: 'Hvad er rekorden for flest tilskuere til én VM-kamp?', a: ['~200.000 (Brasilien vs Uruguay, 1950)','~150.000 (Brasilien vs Spanien, 1950)','~120.000 (England vs Vesttysk., 1966)'], correct: 0, fact: 'Maracanã husede ~200.000 tilskuere til "finalen" mod Uruguay i 1950 — en rekord der aldrig slås.' },
    { q: 'Hvad er "Roger Millas" mest ikoniske fejring?', a: ['Dans om hjørneflaget','Saksespark fejring','Kysse bolden'], correct: 0, fact: 'Roger Millas dans om hjørneflaget ved VM 1990 er en af VM-historiens mest ikoniske fejringer.' },
    { q: 'Hvad vejede Jules Rimet-trofæet?', a: ['3,8 kg','6,1 kg (nuværende)','1,2 kg'], correct: 0, fact: 'Jules Rimet-trofæet vejede 3,8 kg og var forgyldt sterling sølv. Det nuværende trofæ vejer 6,1 kg.' },
    { q: 'Hvad er "La Ola" — berømt fra VM?', a: ['Mexicansk bølge-fejring fra VM 1986','Argentinsk sang','Colombiansk dans på tribunen'], correct: 0, fact: '"La Ola" (bølgen) menes at have sin moderne oprindelse ved VM 1986 i Mexico.' },
    { q: 'Hvad er VM 2026\'s geografiske udstrækning fra nord til syd?', a: ['Ca. 7.000 km (Vancouver til Miami)','Ca. 3.000 km','Ca. 4.500 km'], correct: 0, fact: 'VM 2026 spænder over ca. 7.000 km — den største geografiske spredning i VM-historien.' },
    { q: 'Hvad er det mærkeligste VM-maskot ifølge fans?', a: ['Striker (USA 1994) — en hund','Fuleco (Brasilien 2014) — bæltedyr','Willie (England 1966) — løve'], correct: 0, fact: 'Striker var en antropomorf hund og er kåret som den mærkeligste VM-maskot nogensinde.' },
    { q: 'Hvad er det maksimale antal spillere på en VM-trup siden 2022?', a: ['26 spillere','23 spillere','25 spillere'], correct: 0, fact: 'FIFA udvidede VM-trupperne fra 23 til 26 spillere fra VM 2022 — pga. COVID-19-erfaringer.' },
    { q: 'Hvad bruger FIFA-dommere til at markere fri-spark-afstand?', a: ['Vanishing spray — forsvindende spray','En snor på 9,15m','Kegler fra sidelinjen'], correct: 0, fact: 'Vanishing spray (forsvindende spray) blev indført ved VM 2014 — det forsvinder efter 60 sekunder.' },
    { q: 'Hvad er rekorden for flest solgte VM-billetter (én turnering)?', a: ['USA 1994 — 3,6 millioner','Brasilien 2014 — 3,4 millioner','Frankrig 1998 — 2,8 millioner'], correct: 0, fact: 'VM 1994 i USA satte rekord med 3,6 millioner tilskuere — stadig rekord for gennemsnit pr. kamp.' },
    { q: 'Hvad er Oleg Salenkos unikke rekord fra VM 1994?', a: ['5 mål i én VM-kamp','Første russiske hat-trick','Hurtigste mål i VM 1994'], correct: 0, fact: 'Oleg Salenko scorede 5 mål i en enkelt kamp mod Cameroun — en rekord der stadig står.' },
    { q: 'Hvad er "Neymar Rolling" — berømt fra VM 2018?', a: ['Neymar overdrev skader og rullede dramatisk','En ny fejring efter mål','Brasiliens angrebsstrategi'], correct: 0, fact: 'Neymar rullede og holdt på sig selv alt for dramatisk ved VM 2018 — det skabte memes globalt.' },
    { q: 'Hvad er det unikke ved VM-boldene siden 2014?', a: ['Integreret elektronisk chip til tracking','Lavet uden lim — kun syet','Første bold designet af computere'], correct: 0, fact: 'VM-boldene siden Brazuca (2014) har en integreret chip der tracker position og rotation i realtid.' },
    { q: 'Hvad er VM\'s mest ikoniske nationalsang at fejre med?', a: ['L\'Hymne national (Frankrig) — La Marseillaise','God Save the King (England)','Goles, Goles (Argentina)'], correct: 0, fact: 'La Marseillaise er kåret som VM\'s mest ikoniske nationalsang af FIFA-studier.' },
    { q: 'Hvad er "vuvuzela" berømt fra?', a: ['VM 2010 i Sydafrika — plastikhorn','VM 2006 i Tyskland — elektronisk tromme','VM 2014 i Brasilien — sambafløjte'], correct: 0, fact: 'Vuvuzela-hornene ved VM 2010 skabte kontrovers — spillere og kommentatorer klagede over støjen.' },
  ],
  kontrov: [
    { q: 'Hvad udløste VAR-systemet ved VM første gang?', a: ['VM 2018 i Rusland','VM 2014 i Brasilien','VM 2022 i Qatar'], correct: 0, fact: 'VAR (Video Assistant Referee) blev brugt første gang ved et VM i Rusland 2018.' },
    { q: 'Hvad er "Handshake-gate" fra VM 2014?', a: ['Suárez bed Chiellini — 9 kampes karantæne','Neymar nægtede håndtryk','Zidane nægtede håndtryk efter finalen'], correct: 0, fact: 'Luis Suárez bed Giorgio Chiellini i skulderen ved VM 2014 — hans tredje bid-hændelse i karrieren.' },
    { q: 'Hvad er rekorden for flest røde kort i én VM-kamp?', a: ['4 røde kort (Portugal vs Holland, 2006)','3 røde kort','5 røde kort'], correct: 0, fact: 'Portugal vs Holland i VM 2006 fik 4 røde kort og 16 gule — den mest kaotiske kamp i VM-historien.' },
    { q: 'Hvad er "Der Disgrace of Gijón" (1982)?', a: ['Vesttyskland vs Østrig — bevidst 1-0 der sendte Algeriet ud','Vesttyskland vs Frankrig — kontrovers. domm.','Argentina vs England — Falkland-drama'], correct: 0, fact: '"Sjammeriet i Gijón" — Vesttyskland og Østrig spillede 1-0 der sendte begge videre og Algeriet ud.' },
    { q: 'Hvad er "Maradona-dopingskandalen" fra VM 1994?', a: ['Positiv for efedrin — udvist fra turneringen','Anklaget for bestikkelse','Nægtet at aflægge dopingprøve'], correct: 0, fact: 'Maradona testede positiv for efedrin ved VM 1994 og blev udvist — karrieren endte i skandale.' },
    { q: 'Hvad er "The Battle of Berne" fra VM 1954?', a: ['Ungarn vs Brasilien — slagsmål i omklædningsrum','England vs Argentina — boykot','Frankrig vs Vesttysk. — spillere gik fra banen'], correct: 0, fact: 'Ungarn slog Brasilien 4-2 med 3 røde kort og slagsmål der fortsatte i omklædningsrummet.' },
    { q: 'Hvad skete kontroversielt med Ronaldo i finalen 1998?', a: ['Mystisk anfald natten inden — spillede alligevel dårligt','Han nægtede at spille','Han scorede selvmål'], correct: 0, fact: 'Ronaldo fik kramper natten inden finalen men spillede — Frankrig vandt 3-0.' },
    { q: 'Hvad er "Frank Lampard-hændelsen" fra VM 2010?', a: ['Hans skud krydset linjen — men mål godkendes ikke mod Tyskland','Han scorede med hånden','Dommeren annullerede fejlagtigt'], correct: 0, fact: 'Lampards skud krydset klart mållinjen mod Tyskland — men dommeren godkendte det ikke. 4-1 til Tyskland.' },
    { q: 'Hvad er "Siuuu-gate" fra VM 2022?', a: ['Ronaldo mente han scorede mod Uruguay — VAR sagde nej','Ronaldo fejrede for tidligt','Ronaldo nægtede substitution'], correct: 0, fact: 'Ronaldo mente bolden ramte ham mod Uruguay — VAR viste Bruno Fernandes scorede.' },
    { q: 'Hvad er den officielle regel om "handball" der skaber mest kontrovers?', a: ['"Udvidet krop" — armen i unaturlig position','Enhver kontakt er frispark','Kun bevidst hånd er straffe'], correct: 0, fact: '"Udvidet krop"-definitionen er den mest diskuterede regel i moderne fodbold.' },
    { q: 'Hvad er den mest kontroversielle VM-afgørelse ifølge FIFA selv?', a: ['"Guds hånd" (Maradona, 1986)','Englands mål i finalen 1966 (over linje?)','Italiens eliminering i 2002'], correct: 0, fact: 'FIFA anerkender "Guds hånd" som den mest kontroversielle VM-hændelse nogensinde.' },
    { q: 'Hvad udløste FIFA\'s indføring af mållinjetekologi?', a: ['Lampard-hændelsen i 2010 og lignende fejl','Maradona-hændelsen i 1986','En rapport fra 2008'], correct: 0, fact: 'Lampards "mål" mod Tyskland ved VM 2010 tvang FIFA til at handle — Hawkeye kom i PL 2012.' },
    { q: 'Hvad er "VAR" en forkortelse for?', a: ['Video Assistant Referee','Video Assisted Review','Visual Assistance Recording'], correct: 0, fact: 'VAR = Video Assistant Referee. Systemet bruges til at kontrollere mål, røde kort, straffe og forvekslet identitet.' },
    { q: 'Hvad er kontroversen om Juan Sebastián Verón ved VM 2002?', a: ['Verdens dyreste spiller fik kun 22 minutters spilletid','Positiv for doping','Anklaget for kampfixing'], correct: 0, fact: 'Verón, daværende verdens dyreste spiller, fik kun 22 minutters spilletid ved VM 2002.' },
    { q: 'Hvad er "Heysel-effekten" på VM-stadioner?', a: ['Sikkerhedsseparation af fans indført efter 1985','En FIFA-regel om stadionudgang','En specifik billetsystem'], correct: 0, fact: 'Efter Heysel (1985) og Hillsborough (1989) indførte FIFA strenge separationskrav for hjemme- og bortefans.' },
  ],
  vm2026: [
    { q: 'Hvor afholdes VM 2026-finalen?', a: ['MetLife Stadium, New York/New Jersey','SoFi Stadium, Los Angeles','Azteca Stadium, Mexico City'], correct: 0, fact: 'MetLife Stadium huser VM 2026-finalen den 19. juli med kapacitet til 82.500+ tilskuere.' },
    { q: 'Hvad er antallet af slutrundekampe ved VM 2026?', a: ['104 kampe','64 kampe','80 kampe'], correct: 0, fact: 'Udvidelsen fra 32 til 48 hold øger antallet af kampe fra 64 til 104.' },
    { q: 'Hvad er det nye gruppeformat ved VM 2026?', a: ['12 grupper à 4 hold — top 2 + 8 bedste 3\'ere videre','8 grupper à 6 hold','16 grupper à 3 hold'], correct: 0, fact: 'VM 2026 har 12 grupper med 4 hold. Top 2 + de 8 bedste tredjepladser (32 hold totalt) fortsætter.' },
    { q: 'Hvilke to canadiske byer huser VM 2026-kampe?', a: ['Toronto og Vancouver','Kun Toronto','Montreal og Toronto'], correct: 0, fact: 'Både Toronto (BMO Field) og Vancouver (BC Place) huser kampe ved VM 2026.' },
    { q: 'Hvad er det særlige ved Estadio Azteca ved VM 2026?', a: ['Eneste stadion der huser VM 3 gange (1970, 1986, 2026)','2 VM (1986 og 2026)','VM-debut i 2026'], correct: 0, fact: 'Estadio Azteca er det eneste stadion der huser VM for tredje gang — 1970, 1986 og 2026.' },
    { q: 'Hvad er VM 2026\'s officielle maskot?', a: ['Tezcat — stiliseret jaguar','Tico — en kaktus','Ale — en ørn'], correct: 0, fact: 'Tezcat er en stiliseret jaguar inspireret af den aztekiske gud Tezcatlipoca — symboliserer kraft og bevægelse.' },
    { q: 'Hvornår spilles åbningskampen ved VM 2026?', a: ['11. juni 2026 på Azteca i Mexico City','13. juni i New York','11. juni i Los Angeles'], correct: 0, fact: 'Åbningskampen spilles den 11. juni 2026 på Estadio Azteca.' },
    { q: 'Hvad er USA\'s VM-fortid som vært?', a: ['USA var vært i 1994 — 32 år til 2026','USA var aldrig vært tidligere','USA var vært i 1998'], correct: 0, fact: 'USA var sidst vært i 1994 da Brasilien vandt. 32 år efter vender VM tilbage.' },
    { q: 'Hvad er VM 2026\'s slogan?', a: ['We Are 26','One World One Dream 26','The Beautiful Game Returns'], correct: 0, fact: '"We Are 26" refererer til de 26 VM-værtsstæder fordelt på USA, Canada og Mexico.' },
    { q: 'Hvilken by hoster flest VM 2026-kampe?', a: ['Los Angeles (8 kampe)','New York/New Jersey (finale)','Dallas (7 kampe)'], correct: 0, fact: 'Los Angeles (SoFi Stadium) hoster 8 kampe — flest af alle VM 2026-byer.' },
    { q: 'Hvad er den geografiske udstrækning af VM 2026?', a: ['Ca. 7.000 km (Vancouver til Miami)','Ca. 3.000 km','Ca. 4.500 km'], correct: 0, fact: 'VM 2026 spænder over ca. 7.000 km — den største geografiske spredning i VM-historien.' },
    { q: 'Hvad er det ikoniske ved USA\'s VM-arv inden 2026?', a: ['USA nåede kvartfinalen i 2002 og slog Portugal 3-2','USA vandt VM i 1994 som vært','USA har ikke deltaget siden 2014'], correct: 0, fact: 'USA slog Portugal 3-2 og nåede kvartfinalen ved VM 2002 — det bedste resultat nogensinde.' },
    { q: 'Hvad er Azteca Stadiums kapacitet ved VM 2026?', a: ['Ca. 80.000 (reduceret fra 87.000)','87.000 (fuld kapacitet)','105.000'], correct: 0, fact: 'Azteca har reduceret til ca. 80.000 siddepladser for VM 2026 for at opfylde FIFA\'s krav.' },
    { q: 'Hvad er VM 2026\'s startdato?', a: ['11. juni 2026','15. juni 2026','1. juni 2026'], correct: 0, fact: 'VM 2026 starter den 11. juni 2026 på Estadio Azteca i Mexico City.' },
    { q: 'Hvad er VM 2026-finalens dato?', a: ['19. juli 2026','25. juli 2026','15. juli 2026'], correct: 0, fact: 'VM 2026-finalen spilles den 19. juli 2026 på MetLife Stadium i New Jersey.' },
  ],
}

const ALL_QUESTIONS = Object.entries(QUESTIONS).flatMap(([catId, qs]) => qs.map(q => ({ ...q, catId })))
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

function shuffleArray(arr) { return [...arr].sort(() => Math.random() - 0.5) }

export default function Quiz() {
  const [screen, setScreen] = useState('home')
  const [participant, setParticipant] = useState(null)
  const [pin, setPin] = useState('')
  const [selectedCat, setSelectedCat] = useState(null)
  const [isRandom, setIsRandom] = useState(false)
  const [forPoints, setForPoints] = useState(true)
  const [questions, setQuestions] = useState([])
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [chosen, setChosen] = useState(null)
  const [timeLeft, setTimeLeft] = useState(20)
  const [timerActive, setTimerActive] = useState(false)
  const [myScores, setMyScores] = useState({})
  const [leaderboard, setLeaderboard] = useState([])
  const [showAnswers, setShowAnswers] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('vm2026_participant')
    if (saved) {
      try {
        const { participant: p, pin: savedPin } = JSON.parse(saved)
        setParticipant(p); setPin(savedPin)
        loadMyScores(p.id)
      } catch {}
    }
  }, [])

  function loadMyScores(id) {
    api.get(`/participants/${id}/quiz-scores`)
      .then(r => { const map = {}; r.data.forEach(s => { map[s.category] = s }); setMyScores(map) })
      .catch(() => {})
  }

  function loadLeaderboard() {
    api.get('/participants/quiz-scores/leaderboard').then(r => setLeaderboard(r.data)).catch(() => {})
  }

  useEffect(() => {
    if (!timerActive) return
    if (timeLeft <= 0) { handleAnswer(null); return }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [timerActive, timeLeft])

  function prepareQuestions(rawQs) {
    return rawQs.map(q => {
      const opts = q.a.map((text, i) => ({ text, isCorrect: i === q.correct }))
      return { ...q, shuffledOpts: shuffleArray(opts) }
    })
  }

  function startQuiz(cat, random = false, points = true) {
    let rawQs
    if (random) {
      rawQs = shuffleArray(ALL_QUESTIONS).slice(0, 20)
    } else {
      rawQs = shuffleArray(QUESTIONS[cat.id]).slice(0, 15)
    }
    setSelectedCat(cat)
    setIsRandom(random)
    setForPoints(points)
    setQuestions(prepareQuestions(rawQs))
    setQi(0); setScore(0); setChosen(null); setShowAnswers(false)
    setScreen('playing')
    setTimeout(() => { setTimeLeft(20); setTimerActive(true) }, 100)
  }

  function handleAnswer(idx) {
    if (chosen !== null) return
    clearTimeout(timerRef.current); setTimerActive(false); setChosen(idx)
    const correct = idx !== null && questions[qi].shuffledOpts[idx].isCorrect
    if (correct) setScore(s => s + 1)

    // 4 seconds to read answer (was 2.2s)
    setTimeout(() => {
      const newQi = qi + 1
      if (newQi >= questions.length) {
        const finalScore = correct ? score + 1 : score
        // Save to server only if for points and not random
        if (participant && forPoints && !isRandom && selectedCat) {
          api.put(`/participants/${participant.id}/quiz-scores/${selectedCat.id}`, {
            pin, score: finalScore, total: questions.length
          }).then(() => loadMyScores(participant.id)).catch(() => {})
        }
        setScore(finalScore)
        setScreen('result')
      } else {
        setQi(newQi); setChosen(null)
        setTimeLeft(20); setTimerActive(true)
      }
    }, 4000)
  }

  // Computed
  const totalScore = Object.values(myScores).reduce((s, c) => s + c.score, 0)
  const totalPossible = Object.values(myScores).reduce((s, c) => s + c.total, 0)

  // ── HOME ──────────────────────────────────────────────────────────────
  if (screen === 'home') return (
    <div>
      <div style={{padding:'1.25rem 0 1rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div className="page-title">⚽ VM Quiz</div>
          <div className="page-sub">Test din VM-viden — 15 spørgsmål pr. kategori</div>
        </div>
        <button className="btn btn-sm" onClick={()=>{loadLeaderboard();setScreen('leaderboard')}}>🏆 Leaderboard</button>
      </div>

      {participant ? (
        <div className="card" style={{marginBottom:12,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:600}}>{participant.name}</div>
            <div style={{fontSize:12,color:'var(--text3)'}}>{Object.keys(myScores).length} af {CATEGORIES.length} kategorier gennemført</div>
          </div>
          {totalPossible > 0 && (
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:800,color:'var(--gold)'}}>{totalScore}</div>
              <div style={{fontSize:11,color:'var(--text3)'}}>af {totalPossible} quizpoint</div>
            </div>
          )}
        </div>
      ) : (
        <div className="alert alert-warn" style={{fontSize:13,marginBottom:12}}>
          Log ind under "Mine gæt" for at gemme dine quizscores på leaderboardet.
        </div>
      )}

      {/* Random quiz banner */}
      <div style={{background:'rgba(245,197,24,.08)',border:'1px solid rgba(245,197,24,.3)',borderRadius:10,padding:'12px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}
        onClick={() => startQuiz(null, true, false)}>
        <span style={{fontSize:28}}>🎲</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:600,fontSize:15}}>Random Quiz — 20 spørgsmål på tværs</div>
          <div style={{fontSize:12,color:'var(--text3)'}}>Blander alle kategorier · Kun for sjov · Ingen point</div>
        </div>
        <span style={{color:'var(--gold)',fontWeight:600,fontSize:14}}>Start →</span>
      </div>

      <div className="alert alert-info" style={{fontSize:13,marginBottom:12}}>
        20 sek. pr. spørgsmål · 1 point pr. korrekt · Kun første gennemførelse tæller
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
        {CATEGORIES.map(cat => {
          const s = myScores[cat.id]
          const done = s?.completed_once
          return (
            <div key={cat.id} className="match-card"
              style={{cursor:'pointer',borderLeft:`3px solid ${cat.color}`,marginBottom:0,opacity:1}}
              onClick={() => startQuiz(cat, false, !done)}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:28,flexShrink:0}}>{cat.emoji}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontWeight:600,fontSize:15}}>{cat.name}</span>
                    {done && <span className="badge badge-green" style={{fontSize:10}}>✓ Gennemført</span>}
                  </div>
                  <div style={{fontSize:12,color:'var(--text3)',marginTop:1}}>{cat.desc}</div>
                  {done && <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>Spil igen for sjov — ingen nye point</div>}
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  {s ? (
                    <>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,
                        color:s.score===s.total?'var(--green)':s.score>=s.total*0.7?'var(--gold)':'var(--text2)'}}>{s.score}/{s.total}</div>
                      <div style={{fontSize:10,color:'var(--text3)'}}>score</div>
                    </>
                  ) : (
                    <div style={{fontSize:12,color:'var(--text3)'}}>Ikke spillet</div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  // ── LEADERBOARD ───────────────────────────────────────────────────────
  if (screen === 'leaderboard') {
    const MEDALS = ['🥇','🥈','🥉']
    return (
      <div>
        <div style={{padding:'1.25rem 0 1rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><div className="page-title">🏆 Quiz Leaderboard</div><div className="page-sub">Bedste samlede quiz-score</div></div>
          <button className="btn btn-sm" onClick={()=>setScreen('home')}>← Tilbage</button>
        </div>
        {leaderboard.length === 0
          ? <div className="card empty">Ingen scores endnu — vær den første!</div>
          : leaderboard.map((p, i) => (
            <div key={p.id} className="card" style={{marginBottom:8}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:800,color:i<3?'var(--gold)':'var(--text3)',minWidth:32}}>
                  {i<3?MEDALS[i]:`${i+1}.`}
                </div>
                <div style={{flex:1,fontWeight:600}}>{p.name}</div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,color:'var(--gold)'}}>{p.total_score}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>{p.categories_played} kat. · af {p.total_possible} mulige</div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:5}}>
                {CATEGORIES.map(cat => {
                  const s = p.cat_scores?.find(c => c.category === cat.id)
                  return (
                    <div key={cat.id} style={{fontSize:12,padding:'3px 8px',background:'var(--bg3)',borderRadius:6,display:'flex',justifyContent:'space-between',gap:4}}>
                      <span style={{color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cat.emoji} {cat.name}</span>
                      <span style={{fontWeight:600,flexShrink:0,color:s?s.score===s.total?'var(--green)':'var(--text)':'var(--text3)'}}>{s?`${s.score}/${s.total}`:'—'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        }
      </div>
    )
  }

  // ── PLAYING ───────────────────────────────────────────────────────────
  if (screen === 'playing' && questions.length > 0) {
    const q = questions[qi]
    const pct = (timeLeft / 20) * 100
    const timerColor = timeLeft <= 5 ? 'var(--red)' : timeLeft <= 10 ? 'var(--gold)' : 'var(--green)'
    const catInfo = q.catId ? CAT_MAP[q.catId] : selectedCat

    return (
      <div style={{maxWidth:560,margin:'0 auto',padding:'1rem'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:14,color:'var(--text3)'}}>{isRandom?'🎲 Random':catInfo?.emoji+' '+catInfo?.name}</span>
            {!forPoints && <span className="badge badge-gray" style={{fontSize:10}}>Kun for sjov</span>}
            {forPoints && <span className="badge badge-gold" style={{fontSize:10}}>Point tæller</span>}
          </div>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700}}>
            {qi+1}/{questions.length} · <span style={{color:'var(--gold)'}}>{score} pt</span>
          </span>
        </div>

        {/* Progress */}
        <div style={{height:3,background:'var(--border)',borderRadius:2,marginBottom:4,overflow:'hidden'}}>
          <div style={{width:`${(qi/questions.length)*100}%`,height:'100%',background:'var(--blue)',transition:'width .3s'}}/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <div style={{flex:1,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
            <div style={{width:`${pct}%`,height:'100%',background:timerColor,transition:'width 1s linear'}}/>
          </div>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,color:timerColor,minWidth:28,textAlign:'right'}}>{timeLeft}</span>
        </div>

        {/* Category badge for random */}
        {isRandom && catInfo && (
          <div style={{fontSize:11,color:'var(--text3)',marginBottom:6,display:'flex',alignItems:'center',gap:4}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:catInfo.color,display:'inline-block'}}/>
            {catInfo.name}
          </div>
        )}

        {/* Question */}
        <div className="card" style={{marginBottom:12,minHeight:80,display:'flex',alignItems:'center'}}>
          <p style={{fontSize:16,fontWeight:500,margin:0,lineHeight:1.5}}>{q.q}</p>
        </div>

        {/* Options */}
        {q.shuffledOpts.map((opt, i) => {
          let bg='var(--bg2)', border='var(--border2)', color='var(--text)'
          if (chosen !== null) {
            if (opt.isCorrect) { bg='rgba(34,197,94,.15)'; border='var(--green)'; color='var(--green)' }
            else if (i===chosen&&!opt.isCorrect) { bg='rgba(239,68,68,.15)'; border='var(--red)'; color='var(--red)' }
            else color='var(--text3)'
          }
          return (
            <button key={i} onClick={()=>handleAnswer(i)} disabled={chosen!==null}
              style={{width:'100%',textAlign:'left',padding:'12px 16px',marginBottom:8,
                background:bg,border:`1.5px solid ${border}`,borderRadius:10,
                cursor:chosen!==null?'default':'pointer',color,fontSize:14,fontFamily:'inherit',
                display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,minWidth:24,
                color:chosen!==null?(opt.isCorrect?'var(--green)':i===chosen?'var(--red)':'var(--text3)'):'var(--text3)'}}>
                {['A','B','C'][i]}
              </span>
              {opt.text}
              {chosen!==null&&opt.isCorrect&&<span style={{marginLeft:'auto'}}>✅</span>}
              {chosen!==null&&i===chosen&&!opt.isCorrect&&<span style={{marginLeft:'auto'}}>❌</span>}
            </button>
          )
        })}

        {/* Fact — 4 seconds to read */}
        {chosen!==null&&(
          <div style={{background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.3)',borderRadius:8,padding:'10px 14px',fontSize:13,color:'var(--text2)',lineHeight:1.6}}>
            💡 {q.fact}
          </div>
        )}
      </div>
    )
  }

  // ── RESULT ────────────────────────────────────────────────────────────
  if (screen === 'result') {
    const pct = Math.round((score / questions.length) * 100)
    const msgs = [[100,'🏆','Perfekt! Du er en sand VM-ekspert!'],[80,'⭐','Fremragende! Du kender dit VM.'],[60,'👏','Godt gået! Solidt VM-kendskab.'],[40,'💪','Ikke dårligt! Der er plads til forbedring.'],[0,'📚','Prøv igen — VM-historien er stor!']]
    const [,emoji,msg] = msgs.find(([t])=>pct>=t)

    return (
      <div style={{maxWidth:480,margin:'0 auto',padding:'1rem'}}>
        <div style={{textAlign:'center',padding:'2rem 0 1.5rem'}}>
          <div style={{fontSize:56,marginBottom:8}}>{emoji}</div>
          {isRandom && <div style={{marginBottom:4}}><span className="badge badge-gray">🎲 Random Quiz — ingen point</span></div>}
          {!forPoints && !isRandom && <div style={{marginBottom:4}}><span className="badge badge-gray">Kun for sjov — ingen point</span></div>}
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:52,fontWeight:800,color:'var(--gold)'}}>{score}/{questions.length}</div>
          <div style={{fontSize:14,color:'var(--text2)',marginTop:4}}>{msg}</div>
        </div>

        {/* Show all answers toggle */}
        <button className="btn btn-sm btn-full" style={{marginBottom:12}}
          onClick={()=>setShowAnswers(a=>!a)}>
          {showAnswers ? '🙈 Skjul svar' : '📖 Vis alle korrekte svar'}
        </button>

        {showAnswers && (
          <div className="card" style={{marginBottom:12}}>
            <div className="section-title" style={{marginTop:0}}>Alle svar</div>
            {questions.map((q, i) => {
              const correctOpt = q.shuffledOpts.find(o => o.isCorrect)
              return (
                <div key={i} style={{padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <div style={{fontSize:13,fontWeight:500,marginBottom:3}}>{i+1}. {q.q}</div>
                  <div style={{fontSize:13,color:'var(--green)'}}>✅ {correctOpt?.text}</div>
                  <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>💡 {q.fact}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Category scores */}
        {participant && !isRandom && Object.keys(myScores).length > 0 && (
          <div className="card" style={{marginBottom:12}}>
            <div className="section-title" style={{marginTop:0}}>
              Dine quizscores — samlet {Object.values(myScores).reduce((s,c)=>s+c.score,0)} point
            </div>
            {CATEGORIES.map(cat => {
              const s = myScores[cat.id]
              if (!s) return (
                <div key={cat.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:'1px solid var(--border)',opacity:.4}}>
                  <span style={{fontSize:16,flexShrink:0}}>{cat.emoji}</span>
                  <span style={{flex:1,fontSize:13,color:'var(--text3)'}}>{cat.name}</span>
                  <span style={{fontSize:12,color:'var(--text3)'}}>Ikke spillet</span>
                </div>
              )
              const cp = Math.round((s.score/s.total)*100)
              return (
                <div key={cat.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                  <span style={{fontSize:16,flexShrink:0}}>{cat.emoji}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cat.name}</div>
                    <div style={{height:3,background:'var(--border)',borderRadius:2,marginTop:3,overflow:'hidden'}}>
                      <div style={{width:`${cp}%`,height:'100%',background:cat.color}}/>
                    </div>
                  </div>
                  <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,
                    color:cp===100?'var(--green)':cp>=60?'var(--gold)':'var(--text2)',flexShrink:0}}>
                    {s.score}/{s.total}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
          <button className="btn btn-primary" onClick={()=>startQuiz(selectedCat, isRandom, false)}>
            ↺ {isRandom ? 'Ny random' : 'Prøv igen (for sjov)'}
          </button>
          <button className="btn btn-gold" onClick={()=>setScreen('home')}>Vælg kategori</button>
        </div>
        <button className="btn btn-sm btn-full" onClick={()=>{loadLeaderboard();setScreen('leaderboard')}}>
          🏆 Se quiz leaderboard
        </button>
      </div>
    )
  }

  return null
}
