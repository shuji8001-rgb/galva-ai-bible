// 溶融亜鉛めっき 現場音声誤変換 ＆ 専門用語リアルタイム自動補正辞書

interface TermRule {
  pattern: RegExp;
  replacement: string;
}

export const GALVA_TERMINOLOGY_RULES: TermRule[] = [
  // 1. 酸洗・前処理（「酸洗い」「参戦」などの頻出誤変換）
  { pattern: /酸洗い?/g, replacement: '酸洗' },
  { pattern: /さんせん|参戦|三線|温泉|感染/g, replacement: '酸洗' },
  { pattern: /さんあらい|サンアライ/g, replacement: '酸洗' },
  { pattern: /さんせんそう|参戦層/g, replacement: '酸洗槽' },
  { pattern: /だっし|脱脂/g, replacement: '脱脂' },
  { pattern: /ふらっくす|ふらつく|リラックス|フラック/g, replacement: 'フラックス' },
  { pattern: /いんひびたー|インヒビター/g, replacement: 'インヒビター' },
  { pattern: /えっちんぐ|エッチング/g, replacement: 'エッチング' },
  { pattern: /ぴってぃんぐ|ピッティング/g, replacement: 'ピッティング（孔食）' },

  // 2. 外観欠陥・めっき特性
  { pattern: /ふめっき|不滅機|不明機|踏歴|目利き/g, replacement: '不めっき' },
  { pattern: /どろす|泥巣|ドレス|泥ス/g, replacement: 'ドロス' },
  { pattern: /ぼとむどろす|ボトムドロス/g, replacement: 'ボトムドロス' },
  { pattern: /とっぷどろす|トップドロス/g, replacement: 'トップドロス（灰）' },
  { pattern: /じんくりっち|人吉|信金率|前屈一致|ジンク/g, replacement: 'ジンクリッチ' },
  { pattern: /さんどりんど|サンドイッチ現象|三輪現象|サンドリン/g, replacement: 'サンドリン現象' },
  { pattern: /しろさび|白錆|白波|白壁/g, replacement: '白サビ' },
  { pattern: /つらら|吊ら|釣ら/g, replacement: 'ツララ' },
  { pattern: /たれ|誰|垂れ/g, replacement: 'タレ' },
  { pattern: /がらかけ|からかけ|柄掛け/g, replacement: 'ガラ掛け' },
  { pattern: /みるすけーる|ミルスケ|見る助|見過ごす/g, replacement: 'ミルスケール' },
  { pattern: /やけ|焼け|灰皿/g, replacement: 'ヤケ' },
  { pattern: /えるえむいー|LME/g, replacement: 'LME割れ' },
  { pattern: /すいそぜいか|水銀脆化/g, replacement: '水素脆化' },
  { pattern: /あんかーぱたーん/g, replacement: 'アンカーパターン' },
  { pattern: /だぶるでぃっぷ|二度漬け/g, replacement: 'ダブルディップ' },
  { pattern: /はいてん|配点/g, replacement: 'ハイテン材' },
  { pattern: /りんぎ|臨時|リンス/g, replacement: 'リンギ' },
  { pattern: /くろめーと|黒メート/g, replacement: 'クロメート' },
  { pattern: /タッチアップ|たっちあっぷ/g, replacement: 'タッチアップ' },
  { pattern: /すまった|スマット/g, replacement: 'スマット' },
  { pattern: /びすます|ビスマス/g, replacement: 'ビスマス' },

  // 3. 構造・穴・安全
  { pattern: /くうきぬきあな|空気抜き穴|空気穴/g, replacement: '空気抜き孔' },
  { pattern: /あえんぬきあな|亜鉛抜き穴|水抜き穴/g, replacement: '亜鉛抜き孔' },
  { pattern: /みっぺいぱいぷ|密閉パイプ/g, replacement: '密閉パイプ' },
  { pattern: /すいじょうきばくはつ|水蒸気爆発/g, replacement: '水蒸気爆発' },

  // 4. 膜厚・規格
  { pattern: /えいちでぃーぜっと|HDZ/g, replacement: 'HDZ' },
  { pattern: /えいちでぃーぜっとごじゅうご|HDZ55/g, replacement: 'HDZ55' },
  { pattern: /えいちでぃーぜっとよんじゅうご|HDZ45/g, replacement: 'HDZ45' },
  { pattern: /えいちでぃーぜっとさんじゅうご|HDZ35/g, replacement: 'HDZ35' },
  { pattern: /みくろん|ミクロン/g, replacement: 'μm' },
];

/**
 * 入力された音声テキストや手入力テキストにめっき専門用語辞書をリアルタイム適用する関数
 */
export function applyGalvaTerminology(text: string): string {
  if (!text) return text;
  let result = text;
  for (const rule of GALVA_TERMINOLOGY_RULES) {
    result = result.replace(rule.pattern, rule.replacement);
  }
  return result;
}
