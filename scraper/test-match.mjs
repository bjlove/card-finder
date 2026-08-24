// Regression test built from real Fanatics Collect listing titles pulled
// during development — catches the two real mismatches found that way
// (a raw substring match tagging "RayWave" as "Wave", and "Ref" abbreviations
// not matching a literal "refractor" check) from recurring.
import { readFileSync } from "node:fs";
import { matchParallel } from "./src/lib/matchParallel.js";

const { cards } = JSON.parse(readFileSync("./src/config/cards.json", "utf8"));
const parallels = cards[0].parallels;

const realTitles = [
  ["2022 Bowman Chrome Black Refractor Jacob Misiorowski PROSPECT AUTO /75 PSA 10", "Black Refractor (Jumbo)"],
  ["2022 Bowman Chrome DP Superfractor Jacob Misiorowski PROSPECT AUTO 1/1 PSA 10", "Superfractor"],
  ["2022 Bowman Chrome Sparkle Refractor Jacob Misiorowski PROSPECT AUTO /71 #CDA-JMI PSA 10 GEM", "Sparkle Refractor"],
  ["2022 Bowman Chrome Draft Jacob Misiorowski PROSPECT AUTO #CDA-JMI SGC 10 GEM MINT", null],
  ["2022 Bowman Chrome Draft Refractor Jacob Misiorowski PROSPECT #BDC-132 PSA 10 GEM MINT", "Refractor (base)"],
  ["2022 Bowman Chrome Aqua Lava Refractor Jacob Misiorowski PROSPECT AUTO /199 #CDAJMI BGS 9.5", "Aqua Lava Refractor"],
  ["2022 Bowman Chrome Draft Orange Refractor Jacob Misiorowski PROSPECT AUTO /25 SGC 10 GEM MINT", "Orange Refractor (Jumbo)"],
  ["2022 Bowman Draft Jacob Misiorowski PROSPECT #BD-132 SGC 9 MINT", null],
  ["2022 Bowman Chrome Red Wave Refractor Jacob Misiorowski PROSPECT AUTO DNA 10 /5 #CDA-JMI PSA 10", "Red Wave Refractor"],
  ["2022 Bowman Chrome Purple Refractor Jacob Misiorowski PROSPECT AUTO /250 PSA 10 GEM MINT", "Purple Refractor"],
  ["2022 Bowman Chrome Draft Blue Wave Refractor Jacob Misiorowski PROSPECT AUTO /150 PSA 10 GEM", "Blue Wave Refractor"],
  ["2022 Bowman Draft Chrome Black & White RayWave Ref Jacob Misiorowski PROSPECT #BDC-132 CGC 9.5", null],
  ["2022 Bowman Chrome Draft Green Ref Jacob Misiorowski PROSPECT AUTO /99 PSA 10 GEM MINT", "Green Refractor"],
  ["2022 Bowman Chrome Draft Picks Gold Refractor Jacob Misiorowski PROSPECT AUTO /50 PSA 10 GEM", "Gold Refractor"],
  ["2022 Bowman Chrome Orange Refractor Jacob Misiorowski PROSPECT AUTO /25 #CDA-JMI PSA 10 GEM", "Orange Refractor (Jumbo)"],
  ["2022 Bowman Chrome Draft Asia Refractor Jacob Misiorowski PROSPECT #BDC-132 SGC 9.5 MINT+", null],
  ["2022 Bowman Chrome Blue Refractor Jacob Misiorowski ROOKIE AUTO /150 PSA 10 GEM MINT", "Blue Refractor"],
  ["2022 Bowman Draft 1st Edition Blue Foil Jacob Misiorowski PROSPECT AUTO DNA 10 /150 PSA AUTH", null],
  ["2022 Bowman Chrome DP Gold Refractor Jacob Misiorowski PROSPECT AUTO /50 PSA 10 GEM MINT", "Gold Refractor"],
  ["2022 Bowman Draft Sky Blue Jacob Misiorowski PROSPECT /499 #BD-132 PSA 8 NM-MT", null],
];

let pass = 0;
for (const [title, expected] of realTitles) {
  const got = matchParallel(title, parallels);
  const ok = got === expected;
  if (ok) pass++;
  console.log(ok ? "PASS" : "FAIL", `expected=${expected ?? "null"} got=${got ?? "null"}`, "|", title);
}
console.log(`\n${pass}/${realTitles.length} passed`);
if (pass !== realTitles.length) process.exit(1);
