// Shared copy for static Pages and the React source. Original Russian copy is retained.
const pairs = {
"Работа Чешуи":"Artwork by Cheshuya",
"Зажмите, чтобы притянуть частицы":"Hold to attract logo particles",
"Переход между зинами":"Zine navigation",
"видео":"video",
  "Недостаточно памяти": "Not Enough Memory",
  "Убежище": "Shelter",
  "Слои": "Layers",
  "Зин о практике уличного рисования. В издании собраны фотографии работ, созданных с 2018 по 2025 год, и описаны основные принципы работы с городским пространством.": "A zine about the practice of street drawing. It brings together photographs of works created between 2018 and 2025 and describes the main principles of working with urban space.",
  "Формат А5, 50 страниц, цветная печать. Тираж 50 экземпляров.": "A5 format, 50 pages, full-colour printing. Edition of 50 copies.",
  "Зин посвящён одному месту, где создавались рисунки с 2014 по 2019 год. Фотографии показывают, как за это время менялся стиль, а само пространство постепенно становилось архивом этих изменений.": "A zine devoted to a single place where drawings were made between 2014 and 2019. The photographs show how the style changed over that time, while the space gradually became an archive of those changes.",
  "Формат 210 × 210 мм. Тираж 50 экземпляров.": "210 × 210 mm format. Edition of 50 copies.",
  "Фотоальбом с подборкой уличных работ, созданных за два года. Издание документирует очередной этап практики и изменения в рисунках.": "A photo album featuring a selection of street works created over two years. The publication documents another stage of the practice and changes in the drawings.",
  "Формат 210 × 210 мм. Тираж 35 экземпляров.": "210 × 210 mm format. Edition of 35 copies.",
  "Работа с воспоминаниями через технику цианотипии. Каждый отпечаток получается немного другим из-за случайностей и особенностей процесса. Эти изменения перекликаются с тем, как воспоминания со временем теряют одни детали и приобретают другие.": "Working with memories through cyanotype. Each print turns out slightly different because of chance and the particularities of the process. These changes echo the way memories lose some details and acquire others over time.",
  "Футболка «Дом»": "Home T-shirt",
  "белая": "white",
  "чёрная": "black",
  "Шелкография · S, M, L, XL": "Screen printing · S, M, L, XL",
  "Поля присутствия": "Fields of Presence",
  "Уязвимое место": "Vulnerable Spot",
  "Реквием по ЖЭК-арту": "Requiem for Housing Estate Art",
  "Главная": "Home",
  "Печатные издания": "Printed editions",
  "Цианотипия": "Cyanotype",
  "Мерч": "Merch",
  "Выставки": "Exhibitions",
  "Объекты": "Objects",
  "Рисунки": "Graphics",
  "Вся графика": "All graphics",
  "Смотреть все": "View all",
  "Керамика": "Ceramics",
  "Металл": "Metal",
  "Корни": "Roots",
  "На бумаге": "On paper",
  "На холстах": "On canvas",
  "По дереву": "On wood",
  "Графика": "Graphics",
  "Серия работ": "Series of works",
  "Меню": "Menu",
  "Открыть меню": "Open menu",
  "Закрыть меню": "Close menu",
  "На главную": "Home",
  "Назад": "Back",
  "Вперёд": "Next",
  "Наверх": "Back to top",
  "Направления работы": "Areas of practice",
  "Галерея работ": "Artwork gallery",
  "Галерея объектов": "Object gallery",
  "Галерея изображений": "Image gallery",
  "Фотографии работ": "Artwork photographs",
  "Предыдущее фото": "Previous image",
  "Предыдущая фотография": "Previous image",
  "Предыдущее изображение": "Previous image",
  "Следующее фото": "Next image",
  "Следующая фотография": "Next image",
  "Следующее изображение": "Next image",
  "Предыдущий зин": "Previous zine",
  "Следующий зин": "Next zine",
  "Предыдущая выставка": "Previous exhibition",
  "Следующая выставка": "Next exhibition",
  "Предыдущий объект": "Previous object",
  "Следующий объект": "Next object",
  "Открыть изображение крупно": "Enlarge image",
  "Просмотр фотографий": "Photo viewer",
  "Просмотр работ": "Artwork viewer",
  "Просмотр цианотипий": "Cyanotype viewer",
  "Просмотр объектов": "Object viewer",
  "Просмотр рисунков": "Drawing viewer",
  "Увеличить фотографию": "Zoom in",
  "Сбросить масштаб": "Reset zoom",
  "Закрыть": "Close",
  "Загрузка…": "Loading…",
  "Не удалось загрузить фотографию": "Unable to load image",
  "Выбор изображения": "Choose image",
  "Видео": "Video",
  "Видео выставки": "Exhibition video",
  "Уличная работа": "Street artwork",
  "Уличная работа Чешуи": "Street artwork by Cheshuya",
  "Керамический объект": "Ceramic object",
  "Объект из металла": "Metal object",
  "Дуо-выставка, ДНИ, Москва, 2026": "Duo exhibition, DNI, Moscow, 2026",
  "Групповая выставка, Алматы, 2023": "Group exhibition, Almaty, 2023",
  "Групповая выставка, ISSMAG, Москва, 2022": "Group exhibition, ISSMAG, Moscow, 2022",
  "Групповая выставка, Музей ДПИ, Москва, 2022": "Group exhibition, Museum of Decorative Arts, Moscow, 2022",
  "Портал, 2024 | Серия отпечатков на бумаге": "Portal, 2024 | Series of prints on paper",
  "Графика и живопись: серии работ на бумаге, холстах и дереве.": "Graphics and painting: series of works on paper, canvas and wood.",
  "Серия рельефов «Водровь»": "Vodrov relief series",
  "Коллекция керамики": "Ceramics collection"
};
const reverse = Object.fromEntries(Object.entries(pairs).map(([ru,en]) => [en,ru]));
const patterns = [["^Зин · (\\d{4})$","Zine · $1","^Zine · (\\d{4})$","Зин · $1"],["^Выставка · (\\d{4})$","Exhibition · $1","^Exhibition · (\\d{4})$","Выставка · $1"],["^Изображение (\\d+)$","Image $1","^Image (\\d+)$","Изображение $1"],["^Цианотипия (\\d+)$","Cyanotype $1","^Cyanotype (\\d+)$","Цианотипия $1"],["^Открыть цианотипию (\\d+)$","Open cyanotype $1","^Open cyanotype (\\d+)$","Открыть цианотипию $1"],["^Открыть рисунок (\\d+)$","Open drawing $1","^Open drawing (\\d+)$","Открыть рисунок $1"],["^Серия (\\d+(?:\\.\\d+)?)$","Series $1","^Series (\\d+(?:\\.\\d+)?)$","Серия $1"]];
export function translateText(value, locale = "ru") {
  const text = String(value || "");
  const key = text.trim();
  const english = locale === "en";
  const direct = english ? pairs[key] : reverse[key];
  if (direct) return text.replace(key, direct);
  for (const [ru,en,back,original] of patterns) {
    const regex = new RegExp(english ? ru : back);
    if (regex.test(key)) return text.replace(key, key.replace(regex, english ? en : original));
  }
  const numbered = key.match(english ? /^(Керамика|Металл) № (\d+)$/ : /^(Ceramics|Metal) # (\d+)$/);
  if (numbered) return translateText(numbered[1], locale) + (english ? " # " : " № ") + numbered[2];
  const tokens = english
    ? [["Открыть фото: ","Open photo: "],["Открыть: ","Open: "],["Фотографии: ","Photos: "],["Зин «","Zine “"],["Объект · ","Object · "]]
    : [["Open photo: ","Открыть фото: "],["Open: ","Открыть: "],["Photos: ","Фотографии: "],["Zine “","Зин «"],["Object · ","Объект · "]];
  for (const [from,to] of tokens) if (key.startsWith(from)) {
    const rest = key.slice(from.length).replace(english ? /»$/ : /”$/, "");
    return to + translateText(rest, locale) + (from.includes("«") || from.includes("“") ? (english ? "”" : "»") : "");
  }

  if (key.includes("\n\n")) return key.split("\n\n").map(part => translateText(part, locale)).join("\n\n");
  const photo = key.match(/^(.*?) — (?:фото|photo) (\d+) (?:из|of) (\d+)$/);
  if (photo) return translateText(photo[1], locale) + (english ? " — photo " : " — фото ") + photo[2] + (english ? " of " : " из ") + photo[3];
  const drawing = key.match(/^(.*?), (?:серия|series) ([\d.]+), (?:работа|work) (\d+)$/);
  if (drawing) return translateText(drawing[1], locale) + (english ? ", series " : ", серия ") + drawing[2] + (english ? ", work " : ", работа ") + drawing[3];
  const image = key.match(/^(.*?), (?:изображение|image) (\d+)$/);
  if (image) return translateText(image[1], locale) + (english ? ", image " : ", изображение ") + image[2];
  if (key === "Выставка" || key === "Exhibition") return english ? "Exhibition" : "Выставка";
  if (key === "Зин" || key === "Zine") return english ? "Zine" : "Зин";
  const genericPhoto = key.match(/^(?:Работа Чешуи, фото|Artwork by Cheshuya, photo) (\d+)$/);
  if (genericPhoto) return (english ? "Artwork by Cheshuya, photo " : "Работа Чешуи, фото ") + genericPhoto[1];
  if (key.includes(" — ")) return key.split(" — ").map(part => part === "Чешуя" ? part : translateText(part, locale)).join(" — ");
  return text;
}
