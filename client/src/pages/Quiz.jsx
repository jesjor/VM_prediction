import { useState, useEffect, useRef } from 'react'

const CATEGORIES = [
  { id: 'history',   emoji: '🏆', name: 'VM Historie',          color: '#8b5cf6', desc: 'Fra Uruguay 1930 til Qatar 2022' },
  { id: 'legends',   emoji: '⚽', name: 'Legender & Rekorder',  color: '#3b82f6', desc: 'De største spillere og rekorder' },
  { id: '9010',      emoji: '🎯', name: 'VM 1990–2010',          color: '#10b981', desc: 'Dine fødselsårtiers VM' },
  { id: '1026',      emoji: '🌍', name: 'VM 2010–2026',          color: '#f97316', desc: 'De seneste turneringer' },
  { id: 'funfacts',  emoji: '🤪', name: 'Fun Facts & Kuriøst',   color: '#ec4899', desc: 'Skøre statistikker og sjove fakta' },
  { id: 'kontrov',   emoji: '🧩', name: 'Regler & Kontrovers',   color: '#ef4444', desc: 'VAR, røde kort og drama' },
  { id: 'vm2026',    emoji: '🌐', name: 'VM 2026 Special',       color: '#06b6d4', desc: 'Alt om det aktuelle VM' },
]

const QUESTIONS = {
  history: [
    { q: 'Hvilket land var vært for det allerførste VM i 1930?', a: ['Uruguay', 'Brasilien', 'Italien'], correct: 0, fact: 'Uruguay vandt også turneringen og slog Argentina 4-2 i finalen.' },
    { q: 'Hvilken nation har vundet flest VM-titler?', a: ['Brasilien (5)', 'Tyskland (4)', 'Italien (4)'], correct: 0, fact: 'Brasilien er det eneste hold der har deltaget i ALLE VM-slutrunder.' },
    { q: 'I hvilket årti blev gult og rødt kort indført til VM?', a: ['1970\'erne', '1960\'erne', '1980\'erne'], correct: 0, fact: 'Kortene blev indført ved VM 1970 i Mexico. Den engelske dommer Ken Aston fik idéen fra trafiklys.' },
    { q: 'Hvad er den højeste sejr i VM-historien?', a: ['Ungarn 10–1 El Salvador (1982)', 'Tyskland 8–0 Saudi-Arabien (2002)', 'Jugoslav. 9–0 Zaire (1974)'], correct: 0, fact: 'Ungarn vandt 10-1 mod El Salvador ved VM 1982 i Spanien.' },
    { q: 'Hvilket VM var det første der blev vist i farve-TV?', a: ['Mexico 1970', 'England 1966', 'Vesttyskland 1974'], correct: 0, fact: 'VM 1970 i Mexico var det første der blev sendt i farve-TV globalt.' },
    { q: 'Hvem scorede det første mål i VM-historien?', a: ['Lucien Laurent (Frankrig)', 'Bert Patenaude (USA)', 'Pedro Cea (Uruguay)'], correct: 0, fact: 'Lucien Laurent scorede til 1-0 for Frankrig mod Mexico den 13. juli 1930.' },
    { q: 'Hvad var den berømte "Guds hånd"-kamp?', a: ['Argentina vs England, 1986', 'Argentina vs England, 1990', 'Brasilien vs England, 1986'], correct: 0, fact: 'Maradona scorede med hånden mod England i kvartfinalen i Mexico 1986. I samme kamp scorede han også "Århundredets mål".' },
    { q: 'Hvilken nation har spillet flest VM-finaler uden at vinde?', a: ['Holland (3 finaler, 0 titler)', 'Ungarn (2 finaler, 0 titler)', 'Tjekkiet (2 finaler, 0 titler)'], correct: 0, fact: 'Holland tabte finaler i 1974, 1978 og 2010 — aldrig vundet trods tre forsøg.' },
    { q: 'Hvornår var VM for første gang i Afrika?', a: ['Sydafrika 2010', 'Marokko 1994', 'Nigeria 2006'], correct: 0, fact: 'Sydafrika 2010 var det første VM på det afrikanske kontinent.' },
    { q: 'Hvad hedder VM-pokalen officielt?', a: ['FIFA World Cup Trophy', 'Jules Rimet Trophy', 'Golden Cup'], correct: 0, fact: 'Den nuværende pokal hedder "FIFA World Cup Trophy". Den originale pokal hed Jules Rimet Trophy og blev stjålet i Brasilien i 1983.' },
    { q: 'Hvilket land vandt VM 1934 og 1938 i træk?', a: ['Italien', 'Brasilien', 'Argentina'], correct: 0, fact: 'Italien under Vittorio Pozzo er det eneste hold der har forsvaret VM-titlen.' },
    { q: 'Hvornår opstod straffesparkskonkurrencer ved VM?', a: ['1982 i Spanien', '1978 i Argentina', '1986 i Mexico'], correct: 0, fact: 'Den første VM-straffesparksserie var Vesttyskland vs Frankrig i semifinalen ved VM 1982.' },
    { q: 'Hvilket hold tabte VM-finalen i 1950 på hjemmebane?', a: ['Brasilien (mod Uruguay)', 'Argentina (mod Uruguay)', 'Brasilien (mod Argentina)'], correct: 0, fact: 'Det kendes som "Maracanazo" — Uruguay vandt 2-1 for 200.000 tilskuere i Rio.' },
    { q: 'Hvor mange hold deltog ved det allerførste VM i 1930?', a: ['13 hold', '16 hold', '8 hold'], correct: 0, fact: 'Kun 13 nationer deltog, da mange europæiske lande boycottede pga. de lange skibsrejser til Uruguay.' },
    { q: 'I hvilken by stod den berømte VM-finale i 1966 da England vandt?', a: ['London (Wembley)', 'Manchester', 'Liverpool'], correct: 0, fact: 'England slog Vesttyskland 4-2 på Wembley. Geoff Hurst scorede hat-trick — stadig unik i VM-finaler.' },
  ],
  legends: [
    { q: 'Hvem har scoret flest mål i VM-historien?', a: ['Miroslav Klose (16 mål)', 'Ronaldo (15 mål)', 'Gerd Müller (14 mål)'], correct: 0, fact: 'Miroslav Klose scorede 16 VM-mål fordelt på fire turneringer (2002, 2006, 2010, 2014).' },
    { q: 'Hvem vandt Guldbolden (bedste spiller) ved VM 2022 i Qatar?', a: ['Lionel Messi', 'Kylian Mbappé', 'Luka Modrić'], correct: 0, fact: 'Messi vandt sin anden VM Guldbold og sin første VM-titel. Han scorede 7 mål og lavede 3 assists.' },
    { q: 'Hvem er den yngste målscorer i VM-historien?', a: ['Pelé (17 år, 1958)', 'Cesc Fàbregas (17 år, 2006)', 'Michael Owen (18 år, 1998)'], correct: 0, fact: 'Pelé scorede mod Wales i kvartfinalen ved VM 1958 som blot 17-årig.' },
    { q: 'Hvilken målmand holdt rent skur flest gange i VM-historien?', a: ['Peter Shilton (10 gange)', 'Fabien Barthez (8 gange)', 'Iker Casillas (9 gange)'], correct: 0, fact: 'Peter Shilton spillede 17 VM-kampe for England og holdt rent skur 10 gange.' },
    { q: 'Hvem scorede "Århundredets mål" ved VM 1986?', a: ['Diego Maradona', 'Michel Platini', 'Gary Lineker'], correct: 0, fact: 'Maradona drev bolden fra egen halvbane, løb forbi fem engelske spillere og scorede efter 11 sekunder.' },
    { q: 'Hvem er den eneste spiller der har vundet VM tre gange som aktiv?', a: ['Pelé (1958, 1962, 1970)', 'Ronaldo (2002, 2006, 2010)', 'Cafú (1994, 1998, 2002)'], correct: 0, fact: 'Pelé er den eneste der har vundet tre VM. Han scorede totalt 12 mål i VM-turneringer.' },
    { q: 'Hvem vandt VM Guldbolden i 1998 i Frankrig?', a: ['Ronaldo', 'Zinedine Zidane', 'Davor Šuker'], correct: 0, fact: 'Ronaldo vandt Guldbolden til trods for at Zidane scorede to hoveder i finalen og Frankrig vandt 3-0.' },
    { q: 'Hvem scorede flest mål ved ét enkelt VM?', a: ['Just Fontaine, 13 mål (1958)', 'Sándor Kocsis, 11 mål (1954)', 'Gerd Müller, 10 mål (1970)'], correct: 0, fact: 'Just Fontaines rekord på 13 mål ved VM 1958 i Sverige har stået uanfægtet i over 60 år.' },
    { q: 'Hvem var den første afrikanske spiller til at vinde VM?', a: ['Ingen — ingen afrikanskfødt spiller har vundet VM', 'Marcel Desailly (Frankrig 1998)', 'Patrick Vieira (Frankrig 1998)'], correct: 1, fact: 'Marcel Desailly er født i Ghana og vandt VM med Frankrig i 1998. Men teknisk set spillede han for Frankrig.' },
    { q: 'Hvad er rekorden for flest VM-deltagelser af én spiller?', a: ['5 VM (Lothar Matthäus, Antonio Carbajal)', '4 VM', '6 VM'], correct: 0, fact: 'Lothar Matthäus og Antonio Carbajal deltog begge ved 5 VM-slutrunder.' },
    { q: 'Hvem scorede et hat-trick i VM-finalen i 1966?', a: ['Geoff Hurst (England)', 'Bobby Charlton (England)', 'Helmut Haller (Vesttyskland)'], correct: 0, fact: 'Geoff Hurst er stadig den eneste spiller der har scoret hat-trick i en VM-finale.' },
    { q: 'Hvem er den eneste spiller med VM-guld som spiller OG manager?', a: ['Didier Deschamps (Frankrig)', 'Zinedine Zidane (Frankrig)', 'Franz Beckenbauer (Tyskland)'], correct: 2, fact: 'Franz Beckenbauer vandt VM som kaptajn i 1974 og som manager i 1990 — unik præstation.' },
    { q: 'Hvad hedder den officielle VM-topscorerpris?', a: ['Den Gyldne Støvle', 'Guldbolden', 'Den Gyldne Handske'], correct: 0, fact: 'Den Gyldne Støvle gives til VM\'s topscorer. Den Gyldne Handske gives til bedste målmand.' },
    { q: 'Ronaldo (Brasilien) scorede 15 VM-mål — men hvem assisterede flest?', a: ['Pelé (10 assists)', 'Cafú (8 assists)', 'Ronaldinho (7 assists)'], correct: 0, fact: 'Pelé har 10 registrerede assists i VM — flest nogensinde for en brasiliansk spiller.' },
    { q: 'Hvem er den ældste målscorer i VM-historien?', a: ['Roger Milla (Cameroun, 42 år i 1994)', 'Lothar Matthäus (38 år i 1998)', 'Hossam Hassan (34 år i 2006)'], correct: 0, fact: 'Roger Milla scorede mod Rusland ved VM 1994 som 42-årig og 39 dage gammel.' },
  ],
  '9010': [
    { q: 'Hvad er VM 1990 i Italien kendt som?', a: ['Det lavest-scorende VM nogensinde', 'Det VM med flest røde kort', 'Det første VM med VAR'], correct: 0, fact: 'VM 1990 er stadig det VM med færrest mål pr. kamp — gennemsnitligt kun 2,21 mål per kamp.' },
    { q: 'Hvem vandt VM 1994 i USA?', a: ['Brasilien (via straffespark)', 'Italien', 'Sverige'], correct: 0, fact: 'Brasilien vandt sin fjerde titel efter 0-0 mod Italien — Roberto Baggio brændte det afgørende straffespark.' },
    { q: 'Hvad skete der berømt ved VM 1998 i Frankrig natten før finalen?', a: ['Ronaldo fik et mystisk anfald', 'Zidane blev smidt ud af truppen', 'Frankrig-spillerne truede med strejke'], correct: 0, fact: 'Ronaldo fik kramper natten før finalen — han kom på holdet, men præsterede langt under niveau da Frankrig vandt 3-0.' },
    { q: 'Hvem scorede det berømte saksespark-mål for Tyrkiet ved VM 2002?', a: ['Ingen — Tyrkiet var aldrig i VM 2002', 'Hakan Şükür scorede det hurtigste mål', 'Tümer Metin'], correct: 1, fact: 'Hakan Şükür scorede efter kun 11 sekunder mod Sydkorea i bronzekampen — det hurtigste mål i VM-historien.' },
    { q: 'Hvad skete der med Zinedine Zidane i VM-finalen 2006?', a: ['Han headede Marco Materazzi og fik rødt kort', 'Han brændte et afgørende straffespark', 'Han scorede kampens eneste mål'], correct: 0, fact: 'Zidane headede Materazzi i brystet og fik sit karrieres sidstnævnte røde kort — i sin allersidste professionelle kamp.' },
    { q: 'Hvad vandt "Voodoo-holdet" Cameroun ved VM 1990?', a: ['Kvartfinalen (første afrikanske hold)', 'Semifinalen', 'Anden runde'], correct: 0, fact: 'Cameroun var det første afrikanske hold nogensinde at nå VM-kvartfinalen. Roger Milla var turneringens store stjerne.' },
    { q: 'Hvem satte rekord for hurtigste røde kort ved VM?', a: ['José Batista (Uruguay, 1986) — 56 sekunder', 'Zinedine Zidane (2006) — 1 minut', 'Giorgio Ferrini (1962) — 3 minutter'], correct: 0, fact: 'José Batista fra Uruguay fik rødt kort efter blot 56 sekunder mod Skotland ved VM 1986.' },
    { q: 'Hvilken nation kom overraskende på 4. plads ved VM 2002?', a: ['Sydkorea', 'Senegal', 'USA'], correct: 0, fact: 'Sydkorea eliminerede Portugal, Spanien og Tyskland på vej til semifinalen — en af VM-historiens største sensationer.' },
    { q: 'Hvad er "La Pausa" — et udtryk fra VM 1990?', a: ['Det spanske holds defensivtaktik', 'Rodrigo Ferrers fejring', 'Pausen i VM grundet vejr'], correct: 0, fact: 'La Pausa refererer til Spaniens ultra-defensive spilstil i 1990, der kritiseredes voldsomt.' },
    { q: 'Hvem vandt Den Gyldne Støvle ved VM 1994?', a: ['Hristo Stoichkov (Bulgarien) & Oleg Salenko (Rusland)', 'Romário (Brasilien)', 'Roberto Baggio (Italien)'], correct: 0, fact: 'Stoichkov og Salenko delte Den Gyldne Støvle med 6 mål hver. Salenko scorede 5 i én kamp mod Cameroun!' },
    { q: 'Hvad er "Wunderteam" i VM-sammenhæng?', a: ['Østrig i 1930\'erne — favoritter der ikke vandt VM', 'Ungarn i 1950\'erne', 'Holland i 1970\'erne'], correct: 0, fact: 'Hvad der beskrives som historiens stærkeste VM-hold der aldrig vandt: Ungarn 1954 tabte finalen til Vesttyskland.' },
    { q: 'Hvem scorede til 1-0 i VM-finalen 2006?', a: ['Zinedine Zidane (Frankrig) — straffespark', 'Marco Materazzi (Italien)', 'Thierry Henry (Frankrig)'], correct: 0, fact: 'Zidane scorede med en "Panenka" — chips midt i målet. Særligt ikonisk da han samme kamp fik rødt kort.' },
    { q: 'Hvad er rekorden for flest mål i én VM-kamp?', a: ['Oleg Salenko, 5 mål (Rusland vs Cameroun 1994)', 'Just Fontaine, 4 mål (1958)', 'Sándor Kocsis, 4 mål (1954)'], correct: 0, fact: 'Salenko scorede 5 mål i en enkelt kamp — og Cameroun tabte 1-6 til Rusland som allerede var ude.' },
    { q: 'Hvem vandt VM i Frankrig 1998?', a: ['Frankrig', 'Brasilien', 'Holland'], correct: 0, fact: 'Frankrig slog Brasilien 3-0 i finalen med to Zidane-hoveder. 1,5 millioner franskmænd fejrede på Champs-Élysées.' },
    { q: 'Hvad er "Phantom Goal"-skandalen fra VM 2010?', a: ['Lampards mål der ikke blev godkendt mod Tyskland', 'Carlos Tévez\'s offsidemål mod Mexico', 'Beide Lampard og Tévez'], correct: 2, fact: 'Begge hændelser skete ved VM 2010 — det accelererede indførslen af mållinjetekologi og siden VAR.' },
  ],
  '1026': [
    { q: 'Hvem vandt VM i Sydafrika 2010?', a: ['Spanien', 'Holland', 'Brasilien'], correct: 0, fact: 'Spanien vandt sin første VM-titel med Andres Iniesta\'s mål i overtiden — 1-0 mod Holland.' },
    { q: 'Hvad er "Vuvuzela" — berømt fra VM 2010?', a: ['Et plastikhorn sydafrikanske fans blæste i', 'En sydafrikansk maskot', 'Et instrument brugt til åbningsceremonien'], correct: 0, fact: 'Vuvuzela\'en skabte kontrovers over hele verden — spillere og kommentatorer klagede over støjen.' },
    { q: 'Hvem vandt VM i Brasilien 2014?', a: ['Tyskland', 'Argentina', 'Brasilien'], correct: 0, fact: 'Tyskland vandt 1-0 mod Argentina med Mario Götzes mål i forlænget spilletid.' },
    { q: 'Hvad kaldes Brasiliens 1-7 tab til Tyskland ved VM 2014?', a: ['"Das Mineirão" eller "Mineirazo"', '"Die Tragödie"', '"Seven-One"'], correct: 0, fact: 'Brasilien tabte 1-7 til Tyskland i semifinalen på hjemmebane — det er stadig den mest chokerende VM-semifinale nogensinde.' },
    { q: 'Hvem scorede flest mål ved VM 2014?', a: ['James Rodríguez (Colombia, 6 mål)', 'Thomas Müller (5 mål)', 'Lionel Messi (4 mål)'], correct: 0, fact: 'James Rodríguez vandt Den Gyldne Støvle med 6 mål og lavede turneringens mål med et saksespark mod Uruguay.' },
    { q: 'Hvem vandt VM i Rusland 2018?', a: ['Frankrig', 'Kroatien', 'Belgien'], correct: 0, fact: 'Frankrig vandt 4-2 mod Kroatien i finalen — med en selvscoring, et straffespark og mål af Pogba og Mbappé.' },
    { q: 'Hvad er rekorden for den yngste VM-vinder som nation?', a: ['Frankrig 2018 — gennemsnitsalder 26,1 år', 'Spanien 2010 — 26,5 år', 'Tyskland 2014 — 27,1 år'], correct: 0, fact: 'Frankrig 2018 var historiens yngste VM-vinder med et snit på 26,1 år. Mbappé var kun 19.' },
    { q: 'Hvem vandt VM i Qatar 2022?', a: ['Argentina', 'Frankrig', 'Marokko'], correct: 0, fact: 'Argentina vandt sin tredje VM-titel efter straffesparkskonkurrence mod Frankrig — 3-3 efter forlænget spilletid.' },
    { q: 'Hvad scorede Kylian Mbappé i VM-finalen 2022?', a: ['Hat-trick (tre mål)', 'To mål', 'Et mål'], correct: 0, fact: 'Mbappé scorede hat-trick i finalen — det andet nogensinde i en VM-finale efter Geoff Hurst i 1966.' },
    { q: 'Hvem var den overraskende semifinalist ved VM 2022?', a: ['Marokko', 'Senegal', 'Cameroun'], correct: 0, fact: 'Marokko var det første afrikanske (og arabiske) hold nogensinde at nå en VM-semifinale.' },
    { q: 'Hvad var kontroversielt ved VM i Qatar 2022?', a: ['Afholdelsestidspunkt (november-december) og menneskerettigheder', 'Kun 32 hold deltog', 'VAR blev ikke brugt'], correct: 0, fact: 'VM 2022 blev afholdt om vinteren for første gang og var omgærdet af debat om migrantarbejderes rettigheder.' },
    { q: 'Hvem scorede det hurtigste mål ved VM 2018?', a: ['Yerry Mina (Colombia)', 'Antoine Griezmann (Frankrig)', 'Olivier Giroud (Frankrig)'], correct: 0, fact: 'Mandzukić scorede det hurtigste selvmål i VM-historien allerede i 18. minut i finalen 2018.' },
    { q: 'Hvad var VM 2026\'s officielle slogan?', a: ['We Are 26', 'One World One Dream 26', 'The Beautiful Game'], correct: 0, fact: '"We Are 26" refererer til de 26 værtsstæder fordelt på USA, Canada og Mexico.' },
    { q: 'Hvilke tre lande er værtsnationer for VM 2026?', a: ['USA, Mexico og Canada', 'USA, Mexico og Brasilien', 'USA, Canada og Argentina'], correct: 0, fact: 'VM 2026 er første gang tre nationer er værtslande — og første gang siden 1994 at VM er i Nordamerika.' },
    { q: 'Hvor mange hold deltager ved VM 2026 for første gang?', a: ['48 hold', '32 hold', '64 hold'], correct: 0, fact: 'VM 2026 udvider fra 32 til 48 hold — den største udvidelse i turneringens historie.' },
  ],
  funfacts: [
    { q: 'Hvor mange bolde bruges i gennemsnit ved et VM?', a: ['Ca. 2.500 bolde', 'Ca. 500 bolde', 'Ca. 10.000 bolde'], correct: 0, fact: 'Adidas leverer ca. 2.500 officielle VM-bolde til hver turnering.' },
    { q: 'Hvad er den officielle VM-bold fra 2010 berømt for?', a: ['Jabulani — kritiseret for at flyve uforudsigeligt', 'Teamgeist — rekord for fleste mål', 'Brazuca — første runde bold'], correct: 0, fact: 'Jabulani-bolden fra VM 2010 fik kæmpe kritik fra målmænd og spillere for sin uforudsigelige flyvebane.' },
    { q: 'Hvad er det mærkeligste VM-maskot nogensinde ifølge fans?', a: ['Striker (USA 1994) — en hundhylend ulv', 'Fuleco (Brasilien 2014) — en bæltedyr', 'Willie (England 1966) — en løve med Union Jack'], correct: 0, fact: 'Striker (en antropomorf hund) fra VM 1994 er kåret som den mærkeligste maskot. Fuleco (2014) var faktisk elsket.' },
    { q: 'Hvad spiste England-spillerne til aftensmad aftenen INDEN VM-finalen 1966?', a: ['Steak og chips på hotellet', 'Fish & Chips', 'En stor bankethøjt'], correct: 0, fact: 'England-holdet spiste steak og chips på hotellet og så en forestilling med Engelbert Humperdinck aftenen før.' },
    { q: 'Hvor mange lande ansøgte om at afholde VM 2026 ud over USA/Mexico/Canada?', a: ['Kun ét alternativt bud (Marokko)', 'Tre alternative bud', 'Ingen alternativer'], correct: 0, fact: 'Marokko bød også på VM 2026 men tabte afstemningen 134-65 til den fælles nordamerikanske ansøgning.' },
    { q: 'Hvad er "Angsthasen-Tor" — et berømt VM-udtryk?', a: ['Mål scoret i panik — typisk utilsigtede mål', 'Tysklands taktik mod svage hold', 'En fejring der forbyder spillere at fejre'], correct: 0, fact: '"Angsthasenmål" (frygthanemål) bruges om mål der scores under pres — typisk om mål der rammer målmanden og falder ind.' },
    { q: 'Hvad scorer-rekord satte Oleg Salenko ved VM 1994?', a: ['5 mål i én kamp mod Cameroun', '4 mål i én kamp', 'Første russiske hat-trick i VM'], correct: 0, fact: 'Salenko scorede 5 mål i en enkelt VM-kamp — en rekord der har stået siden 1994.' },
    { q: 'Hvad er "La Ola" — berømt fra VM?', a: ['Mexicansk bølge-fejring der startede ved VM 1986', 'Argentinsk sang', 'Colombiansk dans på tribunen'], correct: 0, fact: '"La Ola" (bølgen) menes at have sin moderne oprindelse ved VM 1986 i Mexico — det spredtes herfra til hele verden.' },
    { q: 'Hvad vejede VM-pokalen fra 1930 til 1970 (Jules Rimet-pokalen)?', a: ['3,8 kg', '6,1 kg', '1,2 kg'], correct: 0, fact: 'Jules Rimet-pokalen vejede 3,8 kg og var lavet af forgyldt sterling sølv. Den nuværende pokal vejer 6,1 kg.' },
    { q: 'Hvem er den eneste målmand med hat-trick i VM?', a: ['Ingen — det er umuligt', 'Hugo Lloris (Frankrig)', 'René Higuita (Colombia)'], correct: 0, fact: 'En målmand kan teknisk set score fra sit eget felt — men ingen har scoret hat-trick. Higuita er berømt for sin "scorpionfejl".' },
    { q: 'Hvad er rekorden for flest tilskuere til én VM-kamp?', a: ['~200.000 (Brasilien vs Uruguay, 1950)', '~150.000 (Brasilien vs Spanien, 1950)', '~120.000 (England vs Vesttysk., 1966)'], correct: 0, fact: 'Maracanã-stadionet husede ~200.000 tilskuere til Brasiliens finale mod Uruguay i 1950 — en rekord der aldrig slås.' },
    { q: 'Hvad er det mærkeligste VM-kvalifikationssystem nogensinde?', a: ['USA 1994 — hverken USA eller Australien kvalificerede sig normalt', 'De første VM med ren invitation', 'VM 1950 hvor England nægtede at deltage'], correct: 1, fact: 'De første VM (1930, 1934, 1938) brugte invitationer frem for kvalifikation — FIFA valgte selv hvilke hold der kom med.' },
    { q: 'Hvad sker der hvis to hold står helt lige efter alle kriterier i gruppen?', a: ['Lodtrækning afgør placeringen', 'Begge går videre', 'Målscoreren tæller'], correct: 0, fact: 'I yderste konsekvens afgøres placeringer ved lodtrækning — det er faktisk sket ved VM.' },
    { q: 'Hvad er det unikke ved VM-boldene siden 2014?', a: ['De er lavet uden læder og er 100% syntetiske', 'De er lavet med GPS-chip', 'De kan ikke blive våde'], correct: 1, fact: 'VM-boldene siden 2014 (Brazuca) har en integreret chip der kan tracke position og rotation i realtid.' },
    { q: 'Hvad brugte Danmark revolutionerende ved VM 1986?', a: ['Den første "totaalfodbold" taktik i en VM-kamp', '"Danish Dynamite" — angrebsfodbold der scorede 9 mål mod Uruguay', '"Sweeper"-systemet'], correct: 1, fact: '"Danish Dynamite" scorede 6-1 mod Uruguay og 2-0 mod Vesttyskland i gruppen. Danmark tabte 1-5 til Spanien i 2. runde.' },
  ],
  kontrov: [
    { q: 'Hvad udløste VAR-systemet ved VM for første gang i historien?', a: ['VM 2018 i Rusland', 'VM 2014 i Brasilien', 'VM 2022 i Qatar'], correct: 0, fact: 'VAR (Video Assistant Referee) blev brugt første gang ved et VM i Rusland 2018.' },
    { q: 'Hvad er "Handshake-gate" fra VM 2014?', a: ['Suárez bed Chiellini — og fik 9 kampes karantæne', 'Neymar nægtede at give hånd til modstander', 'Zinedine Zidane nægtede at give hånd efter finalen'], correct: 0, fact: 'Luis Suárez bed Giorgio Chiellini i skulderen ved VM 2014 — hans tredje bid-hændelse i karrieren.' },
    { q: 'Hvad er "Phantom Goal"-kontroversen fra VM 2010?', a: ['Lampards skud krydsede mållinjen men mål godkendes ikke', 'Tevez\'s offsidemål', 'Begge hændelser'], correct: 2, fact: 'Begge hændelser i 2010 accelererede indførslen af mållinjetekologi. "Hawkeye" kom i Premier League 2012.' },
    { q: 'Hvad var kontroversielt ved "Guds hånd"-kampen i 1986 udover Maradona-målet?', a: ['Dommeren godkendte målet på trods af engelske protester', 'Kampen blev spillet efter politisk pres pga. Falklandskrigen', 'Begge faktorer'], correct: 2, fact: 'Kampen var ladet med politisk spænding efter Falklandskrigen (1982), og dommeren Ali Bennaceur godkendte målet.' },
    { q: 'Hvad er rekorden for flest røde kort i én VM-kamp?', a: ['4 røde kort (Portugal vs Holland, 2006)', '3 røde kort (flere kampe)', '5 røde kort (Kamerun vs Chile, 1998)'], correct: 0, fact: 'Portugal vs Holland i VM 2006 fik 4 røde kort og 16 gule — den mest kaotiske kamp i VM-historien.' },
    { q: 'Hvad skete der med argentineren Juan Sebastián Verón ved VM 2002?', a: ['Han spillede kun 22 minutter total pga. mislykket udtagnelse', 'Han scorede mod England men Argentina gik ud', 'Han brændte det afgørende straffespark'], correct: 0, fact: 'Verón, daværende verdens dyreste spiller, blev sat uden for truppen og fik kun 22 minutters spilletid.' },
    { q: 'Hvad er "Der Wüstenspringen" — kontroversielt fra VM 1982?', a: ['Vesttyskland vs Østrig — bevidst 1-0 sejr der sendte Algeriet ud', 'En spiller der løb ud på banen fra tilskuerrækkerne', 'Bombeangreb nær VM-stad.'], correct: 0, fact: 'Vesttyskland og Østrig spillede en kamp der begge hold vidste 1-0 ville sende begge videre — og Algeriet ud. Scandalekampen.' },
    { q: 'Hvad er "Simsimis Tur" — kontroversielt fra VM 1994?', a: ['Maradona taget i dopingmisbrug og sendt hjem', 'En fan løb på banen og kyssede Maradona', 'Argentina nægtet at spille'], correct: 0, fact: 'Maradona blev testet positiv for efedrin ved VM 1994 og udvist fra turneringen — hans karriere endte i skandale.' },
    { q: 'Hvad er kontroversen om "The Battle of Berne" (1954)?', a: ['Ungarn vs Brasilien — slagsmål fortsatte i omklædningsrum', 'England vs Argentina — politisk boykot', 'Frankrig vs Vesttysk. — spillere gik fra banen'], correct: 0, fact: 'Ungarn slog Brasilien 4-2 i en VM-kamp med 3 røde kort og slagsmål der fortsatte i omklædningsrummet bagefter.' },
    { q: 'Hvad er FIFA\'s officielle regl om \'hånd på bolden\'?', a: ['Hånden må ikke have "udvidet kroppen" eller bolden ramme en opadrettet arm', 'Enhver kontakt med hånden er frispark', 'Kun bevidst hånd er straffespark'], correct: 0, fact: 'VAR har gjort hånds-reglerne mere kontroversielle end nogensinde — "udvidet krop"-definitionen diskuteres stadig.' },
    { q: 'Hvad er "Neymar Rolling" — berømt fra VM 2018?', a: ['Neymar overdrev skader og rullede overdrevent på banen', 'En fejring efter mål', 'Brasiliens angrebsstrategi'], correct: 0, fact: 'Neymar blev verdensberømt for at rulle og holde på sig selv alt for dramatisk ved VM 2018 — det skabte memes globalt.' },
    { q: 'Hvad skete ved VM 2022 med spillet "8 minutter overtid"?', a: ['VAR forlængede kampe med op til 14 minutters tillægstid', 'FIFA beordrede min. 8 minutters tillægstid', 'England spillede 8 minutter i undertal'], correct: 0, fact: 'VM 2022 introducerede meget længere tillægstid (op til 14 min) for at kompensere for tidsspilde ved VAR og fejring.' },
    { q: 'Hvad er "Hand of God 2.0" — kontroversielt fra VM 2022?', a: ['Victor Osimhen scorede med hånden der ikke opdagedes', 'Gianluca Lapadula skød ind med albuen', 'Cyrus Christie headede med hånden'], correct: 0, fact: 'Adskillige hånd-mål diskuteredes ved VM 2022, men ingen opnåede samme ikoniske status som Maradonas.' },
    { q: 'Hvad er "Siuuu-gate" fra VM 2022?', a: ['Ronaldo mente han scorede mod Uruguay — VAR sagde nej', 'Ronaldo fejrede tidligt og Danmark scorede', 'Ronaldo nægtede at spille efter at blive substitueret'], correct: 0, fact: 'Ronaldo mente bolden ramte ham og scorede — VAR viste at Bruno Fernandes scorede. Ronaldo tog æren, men fik den ikke.' },
    { q: 'Hvad er den officielle tidsstraf for at time-waste ved VM 2026?', a: ['Gult kort efter 3 advarsler', 'Direkte gult kort første gang', 'Rødt kort ved gentagen forseelse'], correct: 1, fact: 'FIFA har strammet op på tidsspilde ved VM 2026 — direkte gult kort gives nu hurtigere for at forsinke genoptagelse.' },
  ],
  vm2026: [
    { q: 'Hvor afholdes VM-finalen i 2026?', a: ['MetLife Stadium, New Jersey/New York', 'SoFi Stadium, Los Angeles', 'Azteca Stadium, Mexico City'], correct: 0, fact: 'MetLife Stadium (kapacitet 82.500) huser VM 2026-finalen den 19. juli. Det er hjemmebane for New York Giants og Jets.' },
    { q: 'Hvad er VM 2026\'s officielle logo inspireret af?', a: ['En stiliseret "26" formet som trofæet', 'Et trofæ i solnedgang over tre lande', 'Tre landes flag flettet sammen'], correct: 0, fact: 'Logoet viser "26" i en stil der minder om VM-trofæet — designet med referencer til alle tre værtslande.' },
    { q: 'Hvad er det særlige ved det mexicanske Estadio Azteca ved VM 2026?', a: ['Det eneste stadion der har huset VM 3 gange (1970, 1986, 2026)', '2 VM (1970 og 1986)', 'VM debuterer der i 2026'], correct: 0, fact: 'Estadio Azteca er det eneste stadion der huser VM for tredje gang — 1970, 1986 og nu 2026.' },
    { q: 'Hvad er antallet af slutrundekampe ved VM 2026?', a: ['104 kampe', '64 kampe', '80 kampe'], correct: 0, fact: 'Udvidelsen fra 32 til 48 hold øger antallet af kampe fra 64 til 104 — en stigning på 62,5%.' },
    { q: 'Hvad er VM 2026\'s officielle bold?', a: ['Adidas Fussballliebe 2026', 'Nike Mercurial Strike', 'Puma Final 26'], correct: 0, fact: 'Adidas har leveret den officielle VM-bold siden 1970. "Fussballliebe" (kærlighed til fodbold) er den tyske boldserie.' },
    { q: 'Hvilken by i Canada er VM-vært i 2026?', a: ['Toronto og Vancouver', 'Kun Toronto', 'Montreal og Toronto'], correct: 0, fact: 'Både Toronto og Vancouver er canadiske værtsbyer. Toronto (BMO Field) og Vancouver (BC Place) huser kampe.' },
    { q: 'Hvad er den geografiske udstrækning af VM 2026?', a: ['Ca. 7.000 km fra Vancouver til Miami', 'Ca. 3.000 km', 'Ca. 10.000 km'], correct: 0, fact: 'VM 2026 spænder over ca. 7.000 km fra nord til syd — den største geografiske spredning i VM-historien.' },
    { q: 'Hvad er det nye format for gruppespillet ved VM 2026?', a: ['12 grupper à 4 hold — top 2 + 8 bedste 3\'ere går videre', '8 grupper à 6 hold', '16 grupper à 3 hold'], correct: 0, fact: 'VM 2026 har 12 grupper med 4 hold i hver. De to første plus de otte bedste tredjeplacerede (32 hold) fortsætter.' },
    { q: 'Hvilken by hoster flest VM 2026-kampe?', a: ['Los Angeles (SoFi Stadium)', 'New York (MetLife Stadium)', 'Dallas (AT&T Stadium)'], correct: 0, fact: 'Los Angeles hoster 8 kampe ved VM 2026 — det største antal for en enkelt by. Finalen spilles dog i New York/New Jersey.' },
    { q: 'Hvad er det ikoniske faktum om VM 2026 ift. USA\'s VM-fortid?', a: ['USA var vært i 1994 — nu igen 32 år senere', 'USA var aldrig vært tidligere', 'USA var vært i 1998 men ikke 1994'], correct: 0, fact: 'USA var sidst vært for VM i 1994 da Brasilien vandt. 32 år efter er USA vært igen — denne gang med Mexico og Canada.' },
    { q: 'Hvad er Estadio Aztecas kapacitet ved VM 2026?', a: ['Ca. 80.000 (reduceret fra 87.000)', '87.000', '105.000'], correct: 0, fact: 'Azteca har reduceret kapaciteten til ca. 80.000 for VM 2026 af FIFA-krav om siddepladser til alle tilskuere.' },
    { q: 'Hvad er VM 2026\'s officielle mascot?', a: ['Tezcat — en jaguar', 'Tico — en kaktus', 'Ale — en ørn'], correct: 0, fact: 'Tezcat er en stiliseret jaguar inspireret af den aztekiske gud Tezcatlipoca — symboliserer kraft og bevægelse.' },
    { q: 'Hvilke nye lande debuterer ved VM 2026?', a: ['Panama, Usbekistan og Haiti (bl.a.)', 'Ingen nye lande', 'Cuba og Jamaica'], correct: 0, fact: 'VM 2026\'s udvidelse til 48 hold giver plads til mange debutanter — Panama, Usbekistan og Haiti er bl.a. med.' },
    { q: 'Hvad er åbningskampen ved VM 2026?', a: ['Mexico vs (modstander) i Mexico City', 'USA vs Mexico i Los Angeles', 'Canada vs (modstander) i Toronto'], correct: 0, fact: 'Åbningskampen spilles på Estadio Azteca i Mexico City den 11. juni 2026 — en hyldest til mexicansk fodboldhistorie.' },
    { q: 'Hvad er den maximale rejsetid spillere kan have mellem værtsbyer?', a: ['Op til 6 timers flyrejse (Vancouver til Miami)', '2 timer (max)', '4 timer (max)'], correct: 0, fact: 'Hold kan i teorien rejse fra Vancouver til Miami — over 6 timer — fra en kamp til den næste. Det er logistisk udfordrende.' },
  ],
}

const STORAGE_KEY = 'vmquiz_highscores_v2'

function getScores() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function saveScore(name, catId, score, total) {
  const all = getScores()
  if (!all[name]) all[name] = {}
  if (!all[name][catId] || score > all[name][catId].score) {
    all[name][catId] = { score, total, date: new Date().toLocaleDateString('da-DK') }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

function Scoreboard({ onClose }) {
  const scores = getScores()
  const players = Object.entries(scores)
  if (players.length === 0) return (
    <div style={{textAlign:'center',padding:'3rem',color:'var(--text3)'}}>
      <div style={{fontSize:48,marginBottom:12}}>🏆</div>
      <div>Ingen scores endnu. Spil en quiz!</div>
      <button className="btn btn-primary" style={{marginTop:16}} onClick={onClose}>Tilbage</button>
    </div>
  )

  const totals = players.map(([name, cats]) => ({
    name,
    total: Object.values(cats).reduce((s,c) => s + c.score, 0),
    max: Object.values(cats).reduce((s,c) => s + c.total, 0),
    cats,
  })).sort((a,b) => b.total - a.total)

  return (
    <div>
      <div style={{padding:'1.25rem 0 1rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div className="page-title">🏆 Scoreboard</div>
          <div className="page-sub">Bedste resultater på denne enhed</div>
        </div>
        <button className="btn btn-sm" onClick={onClose}>← Tilbage</button>
      </div>
      {totals.map((p,i) => (
        <div key={p.name} className="card" style={{marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:800,color:i===0?'var(--gold)':i===1?'var(--text2)':i===2?'var(--text3)':'var(--text3)',minWidth:32}}>
              {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`}
            </div>
            <div style={{flex:1,fontWeight:600,fontSize:16}}>{p.name}</div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:800,color:'var(--gold)'}}>{p.total}</div>
              <div style={{fontSize:11,color:'var(--text3)'}}>af {p.max} mulige</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:6}}>
            {CATEGORIES.map(cat => {
              const s = p.cats[cat.id]
              if (!s) return <div key={cat.id} style={{fontSize:12,color:'var(--text3)',padding:'4px 8px',background:'var(--bg3)',borderRadius:6}}>{cat.emoji} {cat.name}: —</div>
              return (
                <div key={cat.id} style={{fontSize:12,padding:'4px 8px',background:'var(--bg3)',borderRadius:6,display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:'var(--text2)'}}>{cat.emoji} {cat.name}</span>
                  <span style={{fontWeight:600,color:s.score===s.total?'var(--green)':'var(--text)'}}>{s.score}/{s.total}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Quiz() {
  const [screen, setScreen] = useState('home') // home | name | category | playing | result | scoreboard
  const [playerName, setPlayerName] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [selectedCat, setSelectedCat] = useState(null)
  const [questions, setQuestions] = useState([])
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [chosen, setChosen] = useState(null)
  const [timeLeft, setTimeLeft] = useState(20)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef(null)

  function startTimer() {
    setTimeLeft(20)
    setTimerActive(true)
  }

  useEffect(() => {
    if (!timerActive) return
    if (timeLeft <= 0) {
      handleAnswer(null)
      return
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [timerActive, timeLeft])

  function shuffleArray(arr) {
    return [...arr].sort(() => Math.random() - 0.5)
  }

  function startQuiz(cat) {
    const qs = shuffleArray(QUESTIONS[cat.id]).slice(0, 15).map(q => {
      const opts = q.a.map((text, i) => ({ text, isCorrect: i === q.correct }))
      const shuffled = shuffleArray(opts)
      return { ...q, shuffledOpts: shuffled, correctShuffled: shuffled.findIndex(o => o.isCorrect) }
    })
    setSelectedCat(cat)
    setQuestions(qs)
    setQi(0)
    setScore(0)
    setChosen(null)
    setScreen('playing')
    setTimeout(startTimer, 100)
  }

  function handleAnswer(idx) {
    if (chosen !== null) return
    clearTimeout(timerRef.current)
    setTimerActive(false)
    setChosen(idx)
    if (idx !== null && questions[qi].shuffledOpts[idx].isCorrect) {
      setScore(s => s + 1)
    }
    setTimeout(() => {
      if (qi + 1 >= questions.length) {
        const finalScore = (idx !== null && questions[qi].shuffledOpts[idx].isCorrect) ? score + 1 : score
        saveScore(playerName, selectedCat.id, finalScore, questions.length)
        setScore(finalScore)
        setScreen('result')
      } else {
        setQi(i => i + 1)
        setChosen(null)
        startTimer()
      }
    }, 2200)
  }

  function getResultMsg(pct) {
    if (pct === 100) return { msg: 'Perfekt! Du er en sand VM-ekspert!', emoji: '🏆' }
    if (pct >= 80) return { msg: 'Fremragende! Du kender dit VM.', emoji: '⭐' }
    if (pct >= 60) return { msg: 'Godt gået! Solidt kendskab til VM.', emoji: '👏' }
    if (pct >= 40) return { msg: 'Ikke dårligt! Der er plads til forbedring.', emoji: '💪' }
    return { msg: 'Prøv igen — VM-historien er stor!', emoji: '📚' }
  }

  if (screen === 'scoreboard') return <Scoreboard onClose={() => setScreen('home')} />

  if (screen === 'home') return (
    <div>
      <div style={{padding:'1.25rem 0 1rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div className="page-title">⚽ VM Quiz</div>
          <div className="page-sub">Test din VM-viden — 15 spørgsmål pr. kategori</div>
        </div>
        <button className="btn btn-sm" onClick={() => setScreen('scoreboard')}>🏆 Scoreboard</button>
      </div>
      <div className="alert alert-info" style={{fontSize:13,marginBottom:16}}>
        20 sekunder pr. spørgsmål · 1 point pr. korrekt svar · Maks 15 point pr. kategori
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
        {CATEGORIES.map(cat => (
          <div key={cat.id}
            className="match-card"
            style={{cursor:'pointer',borderLeft:`3px solid ${cat.color}`,marginBottom:0}}
            onClick={() => { setScreen('name'); setSelectedCat(cat) }}
          >
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:28,flexShrink:0}}>{cat.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:15}}>{cat.name}</div>
                <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{cat.desc}</div>
              </div>
              <div style={{fontSize:12,color:'var(--text3)',flexShrink:0}}>15 spørgsmål →</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (screen === 'name') return (
    <div style={{maxWidth:420,margin:'3rem auto',padding:'0 1rem'}}>
      <div className="card">
        <div style={{fontSize:36,textAlign:'center',marginBottom:8}}>{selectedCat?.emoji}</div>
        <div style={{textAlign:'center',fontWeight:600,fontSize:18,marginBottom:4}}>{selectedCat?.name}</div>
        <div style={{textAlign:'center',fontSize:13,color:'var(--text3)',marginBottom:24}}>{selectedCat?.desc}</div>
        <div className="form-label">Dit navn (til scoreboard)</div>
        <input
          className="form-input"
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          onKeyDown={e => e.key==='Enter' && nameInput.trim() && (setPlayerName(nameInput.trim()), startQuiz(selectedCat))}
          placeholder={playerName || 'Dit navn'}
          autoFocus
          style={{marginBottom:12}}
        />
        <button className="btn btn-gold btn-full"
          onClick={() => { const n = nameInput.trim()||playerName; if(n){setPlayerName(n);startQuiz(selectedCat)} }}
          disabled={!nameInput.trim() && !playerName}
        >
          ▶ Start quiz
        </button>
        <button className="btn btn-sm btn-full" style={{marginTop:8}} onClick={() => setScreen('home')}>← Tilbage</button>
      </div>
    </div>
  )

  if (screen === 'playing' && questions.length > 0) {
    const q = questions[qi]
    const pct = (timeLeft / 20) * 100
    const timerColor = timeLeft <= 5 ? 'var(--red)' : timeLeft <= 10 ? 'var(--gold)' : 'var(--green)'

    return (
      <div style={{maxWidth:560,margin:'0 auto',padding:'1rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <span style={{fontSize:13,color:'var(--text3)'}}>{selectedCat?.emoji} {selectedCat?.name}</span>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700}}>
            {qi+1}/{questions.length} · <span style={{color:'var(--gold)'}}>{score} pt</span>
          </span>
        </div>

        {/* Progress bar */}
        <div style={{height:3,background:'var(--border)',borderRadius:2,marginBottom:4,overflow:'hidden'}}>
          <div style={{width:`${((qi)/questions.length)*100}%`,height:'100%',background:'var(--blue)',transition:'width .3s'}}/>
        </div>

        {/* Timer */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <div style={{flex:1,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
            <div style={{width:`${pct}%`,height:'100%',background:timerColor,transition:'width 1s linear'}}/>
          </div>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,color:timerColor,minWidth:28,textAlign:'right'}}>{timeLeft}</span>
        </div>

        {/* Question */}
        <div className="card" style={{marginBottom:12,minHeight:80,display:'flex',alignItems:'center'}}>
          <p style={{fontSize:16,fontWeight:500,margin:0,lineHeight:1.5}}>{q.q}</p>
        </div>

        {/* Options */}
        {q.shuffledOpts.map((opt, i) => {
          let bg = 'var(--bg2)', border = 'var(--border2)', color = 'var(--text)'
          if (chosen !== null) {
            if (opt.isCorrect) { bg = 'rgba(34,197,94,.15)'; border = 'var(--green)'; color = 'var(--green)' }
            else if (i === chosen && !opt.isCorrect) { bg = 'rgba(239,68,68,.15)'; border = 'var(--red)'; color = 'var(--red)' }
            else { color = 'var(--text3)' }
          }
          return (
            <button key={i} onClick={() => handleAnswer(i)} disabled={chosen !== null}
              style={{width:'100%',textAlign:'left',padding:'12px 16px',marginBottom:8,
                background:bg,border:`1.5px solid ${border}`,borderRadius:10,cursor:chosen!==null?'default':'pointer',
                color,fontSize:14,fontFamily:"inherit",transition:'all .2s',display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,minWidth:24,
                color:chosen!==null?(opt.isCorrect?'var(--green)':i===chosen?'var(--red)':'var(--text3)'):'var(--text3)'}}>
                {['A','B','C'][i]}
              </span>
              {opt.text}
              {chosen!==null && opt.isCorrect && <span style={{marginLeft:'auto'}}>✅</span>}
              {chosen!==null && i===chosen && !opt.isCorrect && <span style={{marginLeft:'auto'}}>❌</span>}
            </button>
          )
        })}

        {/* Fact after answer */}
        {chosen !== null && (
          <div style={{background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.3)',borderRadius:8,padding:'10px 14px',marginTop:4,fontSize:13,color:'var(--text2)',lineHeight:1.6}}>
            💡 {q.fact}
          </div>
        )}
      </div>
    )
  }

  if (screen === 'result') {
    const pct = Math.round((score / questions.length) * 100)
    const { msg, emoji } = getResultMsg(pct)
    const allScores = getScores()
    const myScores = allScores[playerName] || {}

    return (
      <div style={{maxWidth:480,margin:'0 auto',padding:'1rem'}}>
        <div style={{textAlign:'center',padding:'2rem 0 1.5rem'}}>
          <div style={{fontSize:56,marginBottom:8}}>{emoji}</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:52,fontWeight:800,color:'var(--gold)'}}>{score}/{questions.length}</div>
          <div style={{fontSize:14,color:'var(--text2)',marginTop:4}}>{msg}</div>
          <div style={{fontSize:13,color:'var(--text3)',marginTop:2}}>{pct}% korrekte svar</div>
        </div>

        {/* Category scores */}
        <div className="card" style={{marginBottom:12}}>
          <div className="section-title" style={{marginTop:0}}>Dine kategoriscores</div>
          {CATEGORIES.map(cat => {
            const s = myScores[cat.id]
            if (!s) return null
            const catPct = Math.round((s.score/s.total)*100)
            return (
              <div key={cat.id} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:18,flexShrink:0}}>{cat.emoji}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cat.name}</div>
                  <div style={{height:3,background:'var(--border)',borderRadius:2,marginTop:3,overflow:'hidden'}}>
                    <div style={{width:`${catPct}%`,height:'100%',background:cat.color,transition:'width .5s'}}/>
                  </div>
                </div>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,color:catPct===100?'var(--green)':catPct>=60?'var(--gold)':'var(--text2)',flexShrink:0}}>
                  {s.score}/{s.total}
                </span>
              </div>
            )
          })}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
          <button className="btn btn-primary" onClick={() => startQuiz(selectedCat)}>↺ Prøv igen</button>
          <button className="btn btn-gold" onClick={() => setScreen('home')}>Vælg kategori</button>
        </div>
        <button className="btn btn-sm btn-full" onClick={() => setScreen('scoreboard')}>🏆 Se scoreboard</button>
      </div>
    )
  }

  return null
}
