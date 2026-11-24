// One file per language; scripts/bundle.mjs inlines them back into a single object literal at build, which
// scripts/i18n-split.mjs then splits per language (English stays in the bundle).
import fr from "./fr.js";
import en from "./en.js";
import de from "./de.js";
import es from "./es.js";
import it from "./it.js";
import nl from "./nl.js";
import pt from "./pt.js";
import pl from "./pl.js";
import ro from "./ro.js";
import da from "./da.js";
import sv from "./sv.js";
import bg from "./bg.js";
import ru from "./ru.js";
import uk from "./uk.js";
import hu from "./hu.js";
import sk from "./sk.js";
import cs from "./cs.js";
import sl from "./sl.js";
import lv from "./lv.js";
import el from "./el.js";
import sr from "./sr.js";
import srLatn from "./sr-Latn.js";

export var CarburantsI18n = {
  fr: fr.CarburantsI18n,
  en: en.CarburantsI18n,
  de: de.CarburantsI18n,
  es: es.CarburantsI18n,
  it: it.CarburantsI18n,
  nl: nl.CarburantsI18n,
  pt: pt.CarburantsI18n,
  pl: pl.CarburantsI18n,
  ro: ro.CarburantsI18n,
  da: da.CarburantsI18n,
  sv: sv.CarburantsI18n,
  bg: bg.CarburantsI18n,
  ru: ru.CarburantsI18n,
  uk: uk.CarburantsI18n,
  hu: hu.CarburantsI18n,
  sk: sk.CarburantsI18n,
  cs: cs.CarburantsI18n,
  sl: sl.CarburantsI18n,
  lv: lv.CarburantsI18n,
  el: el.CarburantsI18n,
  sr: sr.CarburantsI18n,
  'sr-Latn': srLatn.CarburantsI18n,
};

export var CarburantsMapI18n = {
  fr: fr.CarburantsMapI18n,
  en: en.CarburantsMapI18n,
  de: de.CarburantsMapI18n,
  es: es.CarburantsMapI18n,
  it: it.CarburantsMapI18n,
  nl: nl.CarburantsMapI18n,
  pt: pt.CarburantsMapI18n,
  pl: pl.CarburantsMapI18n,
  ro: ro.CarburantsMapI18n,
  da: da.CarburantsMapI18n,
  sv: sv.CarburantsMapI18n,
  bg: bg.CarburantsMapI18n,
  ru: ru.CarburantsMapI18n,
  uk: uk.CarburantsMapI18n,
  hu: hu.CarburantsMapI18n,
  sk: sk.CarburantsMapI18n,
  cs: cs.CarburantsMapI18n,
  sl: sl.CarburantsMapI18n,
  lv: lv.CarburantsMapI18n,
  el: el.CarburantsMapI18n,
  sr: sr.CarburantsMapI18n,
  'sr-Latn': srLatn.CarburantsMapI18n,
};
