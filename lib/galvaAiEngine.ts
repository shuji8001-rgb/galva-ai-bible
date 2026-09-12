import { CategoryId, AiStandardAnswer, WorkerSummary, QuestionQueueItem, KnowledgeRecord } from '../types';

export interface RefinedAiResult {
  title: string;
  refinedQuestion: string;
  detectedCategory: CategoryId;
  aiStandardAnswer: AiStandardAnswer;
  keyCheckPoints: string[];
  suggestedCriteria: string;
  workerSummary: WorkerSummary;
  causeCategory: string;
  actionCategory: string;
}

interface TopicRule {
  keywords: string[];
  category: CategoryId;
  causeCategory: string;
  actionCategory: string;
  verdict: WorkerSummary['verdict_ok_ng'];
  getTitle: (text: string) => string;
  getRefinedQuestion: (text: string) => string;
  theory: string;
  standardCriteria: string;
  checkPoints: string[];
  immediateAction: string;
  forbiddenAction: string;
}

const TOPIC_RULES: TopicRule[] = [
  // 1. レーザー切断端面・黒皮・ミルスケール・酸化皮膜
  {
    keywords: ['レーザー', 'ミルスケール', '黒皮', '酸化皮膜', '酸化膜', 'スケール', '切断端面', '黒ずみ', '端面'],
    category: 'CAT-1',
    causeCategory: '前処理薬品・洗浄',
    actionCategory: '手ケレン研磨',
    verdict: 'NG（手直し必須）',
    getTitle: () => '【品管確認】レーザー切断端面・強固な酸化皮膜の酸洗不良と研磨手直し基準',
    getRefinedQuestion: (text) =>
      `現場にて「${text}」の事象が発生しています。レーザー切断端面の高温酸化被膜（強固なFeO/Fe3O4スケール）は通常の塩酸酸洗（15%）では溶解除去が困難です。酸濃度や浸漬時間を延長するよりもディスクグラインダー等による物理的ケレン（素地露出）を先行させるべきか、またJIS H 8641規格上の合否判断とタッチアップ基準について教えてください。`,
    theory:
      'レーザー切断時の超高温酸化により形成される黒皮酸化被膜（Fe3O4/FeO）は緻密で酸洗液が浸透しません。酸洗時間を過度に延長すると健全母材が過酸洗（肌荒れ・水素脆化）を起こすため、物理的研磨による素地露出が必須です。',
    standardCriteria:
      'JIS H 8641: 不めっき部分は原則NG。軽微な端面欠陥（10cm²以下かつ全表面積0.5%以下）は、ディスクサンダーで金属光沢が出るまで黒皮を除去し、JIS K 5553規定のジンクリッチペイント（乾燥塗膜亜鉛末80%以上）でタッチアップ補修。',
    checkPoints: [
      '端面黒皮の残存範囲・金属光沢の有無確認',
      '酸洗液の濃度（10〜15%）および鉄分濃度（120g/L以下）の確認',
      'タッチアップ補修可能範囲（全表面積0.5%以下）の超過有無',
    ],
    immediateAction:
      '① 酸洗槽から引き上げ水洗後、ディスクグラインダー（#60〜#120）で端面の黒皮を完全に研削\n② 健全な鋼材素地（金属光沢）を出した上で再度脱脂・酸洗・フラックス工程を通す',
    forbiddenAction:
      '酸化皮膜が残ったまま「めっき槽で溶けるだろう」と亜鉛浴へ投入すること（100%不めっき・手戻りになります）',
  },

  // 2. 油分・切削油・脱脂不良・油膜はじき
  {
    keywords: ['油', '切削油', 'グリス', '脱脂', '油膜', 'はじき', 'オイル', '油汚れ'],
    category: 'CAT-1',
    causeCategory: '前処理薬品・洗浄',
    actionCategory: '酸洗・前処理手直し',
    verdict: 'NG（手直し必須）',
    getTitle: () => '【品管確認】切削油・加工油の脱脂残りによる酸洗はじきと不めっき防止策',
    getRefinedQuestion: (text) =>
      `現場にて「${text}」の不具合が見られます。鋼材表面に残存する加工油・防錆油が脱脂工程で落ち切らず、酸洗液をはじいて不めっきが発生しています。脱脂液の温度・濃度管理基準および現場での緊急脱脂処置について教えてください。`,
    theory:
      '鉱物油や極圧添加剤を含む切削油は水溶性脱脂剤では乳化・けん化しにくく、鋼材表面に油膜として残留します。この油膜が酸洗液の接触を遮断し、Fe-Zn合金層の形成を完全に妨げます。',
    standardCriteria:
      'JIS H 8641: 素地清浄度不良に起因する不めっきは合格不可。全数脱脂再処理または溶剤拭き取り・再酸洗による完全な素地調整が必須。',
    checkPoints: [
      '水洗槽引上げ時の水膜破断（ウォーターブレイク）テストによる油膜残存確認',
      'アルカリ脱脂槽の液温（60〜70℃）および遊離アルカリ濃度',
      '特定鋼管・型鋼内部の残油の有無',
    ],
    immediateAction:
      '① 油分付着箇所を有機溶剤または高濃度アルカリ洗浄剤で局所拭き取り\n② 脱脂槽の温度を65℃以上に昇温し、浸漬時間を1.5倍に延長して再脱脂を実施',
    forbiddenAction:
      '脱脂不良のまま酸洗槽へ投入すること（酸洗槽全体に油膜が浮上拡散し槽全体が汚染されます）',
  },

  // 3. ドロス付着・底ドロス巻上げ・灰噛み・ザラつき
  {
    keywords: ['ドロス', '灰', 'ザラザラ', 'ザラつき', 'ブツ', '突起', '底ドロス', '浮遊ドロス', '酸化灰', '灰噛み'],
    category: 'CAT-2',
    causeCategory: '温度・浸漬操作',
    actionCategory: '手ケレン研磨',
    verdict: 'NG（手直し必須）',
    getTitle: () => '【品管確認】亜鉛浴ドロス・酸化灰の表面付着・ザラつきの判定と手直し基準',
    getRefinedQuestion: (text) =>
      `現場にて「${text}」の相談があります。製品表面に硬質な粒状突起（ドロス・灰噛み）が付着しており、外観不良および相手部材との干渉が懸念されます。JIS外観基準に基づく許容限界と、グラインダー・ヤスリによる除去基準を教えてください。`,
    theory:
      '亜鉛浴中のFe（鉄）とZn（亜鉛）が化合して生じるFe-Zn結晶（ドロス: FeZn13等）は比重が重く浴底に沈降しますが、浸漬・引上げ時の急激な対流や治具の接触で巻き上がり製品表面に固着します。',
    standardCriteria:
      'JIS H 8641: 使用上有害なドロス付着・トゲ・突起は不合格。平滑性を損なうドロスはスクレーパーやフラットヤスリで母材めっき層を傷つけずに削り落とす。',
    checkPoints: [
      'ドロス突起の高さ・鋭利さ（手袋を引っ掛ける危険バリの有無）',
      '亜鉛浴温の適正範囲（445℃〜455℃）および直近の底ドロス掻き出し履歴',
      '浸漬・引上げクレーンの昇降速度（急激な巻き上げの有無）',
    ],
    immediateAction:
      '① ハンドヤスリまたは皮スキ（スクレーパー）で突起状ドロスを削り落とし平滑化\n② 浴面の酸化灰を確実にスキミング（灰掻き）してから製品を引き上げる',
    forbiddenAction:
      'グラインダーで深削りして下地鉄を露出させること（防錆被膜が消失し再めっきが必要になります）',
  },

  // 4. タレ・ツララ・亜鉛溜まり・液抜け不良
  {
    keywords: ['タレ', 'ツララ', 'つらら', '溜まり', 'バリ', '液だまり', '液抜け', '水抜き', '引き上げ', '溜り'],
    category: 'CAT-2',
    causeCategory: '構造設計・開口孔',
    actionCategory: '手ケレン研磨',
    verdict: 'NG（手直し必須）',
    getTitle: () => '【品管確認】亜鉛タレ・ツララ・余剰亜鉛溜まりの除去基準と吊り角度改善',
    getRefinedQuestion: (text) =>
      `現場にて「${text}」が発生しています。部材の下端や開口部周辺にツララ状の凝固亜鉛や肉厚なタレが残留しています。現場での除去作業手順（ヤスリ・バーナー加熱）および次回ロットでの治具吊り角度・引上げ速度の改善策を教えてください。`,
    theory:
      '部材を引き上げる際、部材表面の溶融亜鉛が自重で流れ落ちる速度よりも引き上げ速度が速い場合、または浸漬角度が水平に近いため液切れが悪い箇所に余剰亜鉛が凝固してタレ・ツララを形成します。',
    standardCriteria:
      'JIS H 8641: 組み立て・ボルト締結や美観に影響を与える有害なタレ・ツララは除去必須。平滑に削り落として製品寸法・納まりを確保すること。',
    checkPoints: [
      'ボルト接合面やスプライスプレート等の接触面にタレがないか',
      '吊り治具の傾斜角度（最低15度〜30度以上の傾斜が必要）',
      'クレーン引上げ速度（毎分1.5m〜2.5m程度の定速性）',
    ],
    immediateAction:
      '① 平ヤスリまたは真鍮ハンマーによる軽打でツララ・バリを除去\n② 厚いタレはプロパントーチで部分加温（200〜300℃）して軟化させながらスクレーパーで均す',
    forbiddenAction:
      '酸素アセチレンバーナーで強加熱してめっき層を焼き切ること（亜鉛が酸化揮発して不めっきになります）',
  },

  // 5. 白サビ・白さび・雨濡れ・保管湿気・クロメート
  {
    keywords: ['白サビ', '白さび', '白錆', '白い粉', '雨', '結露', '保管', 'クロメート', '変色', '雨濡れ'],
    category: 'CAT-3',
    causeCategory: '冷却・保管環境',
    actionCategory: '許容合格',
    verdict: 'OK（合格/許容）',
    getTitle: () => '【品管確認】製品保管中の白サビ（塩基性炭酸亜鉛）発生と客先説明・処置基準',
    getRefinedQuestion: (text) =>
      `現場にて「${text}」について相談があります。屋外ヤード保管中やトラック輸送中に雨水・湿気で製品表面に白い粉状の白サビが発生しました。JIS規格上の防錆性能への影響、客先への品質説明基準、および現場での清掃・タッチアップ要否を教えてください。`,
    theory:
      'めっき直後の活性な亜鉛表面に雨水や結露水が滞留し、二酸化炭素（CO2）の供給が遮断された環境下で水酸化亜鉛［Zn(OH)2］が急速に生成される現象です。通気が確保されれば保護性のある塩基性炭酸亜鉛に転換し、亜鉛層の消耗はごく微量です。',
    standardCriteria:
      'JIS H 8641: 白サビの発生自体は初期の自然現象であり、規定膜厚が確保されている限り原則「合格（許容）」。膜厚が著しく減少している重度腐食部のみタッチアップ対象。',
    checkPoints: [
      '電磁膜厚計による白サビ発生部の残存膜厚測定（JIS規格値以上か）',
      '部材同士の密着保管（通風不良・リンギ間隔）の状態確認',
      '赤サビ（地肌腐食）への進行がないかの目視確認',
    ],
    immediateAction:
      '① ワイヤーブラシまたはスコッチブライトで白い粉末を軽くブラッシング除去\n② 製品間にリンギ（角材）を挟み、通気性と水はけを確保した保管レイアウトに変更',
    forbiddenAction:
      '白サビを不良品と早合点して自己判断で酸洗槽へ戻すこと（健全なめっき層を丸ごと溶かしてしまいます）',
  },

  // 6. エア抜き穴・密閉パイプ・ガス抜き・爆発危険
  {
    keywords: ['穴', 'エア抜き', '空気穴', 'ガス抜き', '亜鉛抜き', '密閉', 'パイプ', '爆発', '閉塞', '穴径'],
    category: 'CAT-5',
    causeCategory: '構造設計・開口孔',
    actionCategory: '追加開口・加熱矯正',
    verdict: '危険（作業即停止）',
    getTitle: () => '【緊急安全確認】密閉構造パイプ・エア抜き穴不足による水蒸気爆発防止基準',
    getRefinedQuestion: (text) =>
      `現場にて「${text}」の重大安全確認です。鋼管・角パイプ・ボックス部材の端部や仕口部に適切なエア抜き孔・亜鉛抜き孔が開いていない疑いがあります。450℃の亜鉛浴浸漬時の水蒸気爆発事故防止のための開口基準と現場追加穴あけ指示を教えてください。`,
    theory:
      '密閉構造の部材を450℃の溶融亜鉛浴に浸漬すると、前処理で内部に侵入した水分が一瞬で気化して約1,700倍に膨張します。逃げ場のない内圧により鋼材が破裂し、高温の溶融亜鉛が周囲数十メートルに飛散する重大災害となります。',
    standardCriteria:
      'JIS H 8641・安全衛生規則: 密閉構造物のめっきは絶対禁止。部材断面寸法の最低10%〜15%以上の開口孔を、最上部（空気抜き）と最下部（亜鉛流入・流出）の対角位置に必ず設けること。',
    checkPoints: [
      'パイプ内部の完全導通・対角開口の有無（φ10mm〜φ25mm以上）',
      '仕口ダイアフラム・スプライスプレート裏の隠れ密閉空間の有無',
      '前処理液が内部に残留したまま亜鉛槽へ向かっていないか',
    ],
    immediateAction:
      '① 該当部材のクレーン搬送を即座に停止し、浸漬禁止の赤タグを掲示\n② ボール盤またはホルソーで対角最端部に規定径以上の開口孔を追加工',
    forbiddenAction:
      '「少しの隙間があるから大丈夫」と未確認のまま密閉部材を亜鉛槽に沈めること（人命に関わる爆発事故になります）',
  },

  // 7. ヤケ・灰色めっき・サンドリン鋼・高Si鋼・低Si鋼
  {
    keywords: ['ヤケ', '焼け', '灰色', 'グレー', 'つや消し', 'サンドリン', 'シリコン', 'si', '変色', '黒っぽい'],
    category: 'CAT-2',
    causeCategory: '鋼材成分・溶接異物',
    actionCategory: '許容合格',
    verdict: 'OK（合格/許容）',
    getTitle: () => '【品管確認】サンドリン現象（高Si鋼）による灰色めっき（ヤケ）の判定基準',
    getRefinedQuestion: (text) =>
      `現場にて「${text}」が発生しています。銀白色の金属光沢が出ず、暗灰色・マットな梨地外観（ヤケ）になっています。鋼材成分（Si・P）によるサンドリン反応のメカニズム、JIS規格上の合否判定、および防錆性能についての客先説明基準を教えてください。`,
    theory:
      '鋼材中のケイ素（Si）含有量が0.04〜0.14%または0.25%以上（サンドリン領域）の場合、Fe-Zn合金層の成長が異常に促進され、表面の純亜鉛層（η層）を突き破って合金層（ζ層）が最表面まで露出するため灰色に見えます。',
    standardCriteria:
      'JIS H 8641: 灰色めっき（ヤケ）は外観上の色の違いに過ぎず、めっき皮膜の密着性および膜厚が規定値を満たしていれば「合格品」。耐食性は通常光沢品と同等以上。',
    checkPoints: [
      '電磁膜厚計での膜厚測定（十分な付着量・厚みが確保されているか）',
      '密着性試験（ハンマー打撃試験で剥離や浮きがないか）',
      'ミルシート（鋼材検査証明書）のSi・P成分値の確認',
    ],
    immediateAction:
      '① 膜厚計で膜厚がJIS基準（HDZ 55等）以上であることを実測記録\n② 客先提出用の「灰色外観・サンドリン現象に関する品質適合説明書」を作成',
    forbiddenAction:
      '光沢を出すために酸洗槽へ戻して再めっきすること（同じ母材であれば再度灰色になり母材を無駄に消耗します）',
  },

  // 8. 膜厚不足・膜厚過大・JIS H 8641規格判定・HDZ
  {
    keywords: ['膜厚', 'hdz', 'jis h 8641', '付着量', '電磁', 'マイクロメーター', 'ミクロン', 'μm', '薄い', '厚すぎる'],
    category: 'CAT-6',
    causeCategory: '測定手法・規格判定',
    actionCategory: '規格再検査・証明書発行',
    verdict: '判定要注意（膜厚測定要）',
    getTitle: () => '【品管確認】JIS H 8641（HDZ 35/45/55）膜厚測定基準と合否判定ライン',
    getRefinedQuestion: (text) =>
      `現場にて「${text}」について測定・判定の相談があります。指定されたHDZ規格（付着量・平均膜厚）に対する電磁膜厚計の正しい測定方法、測定点数、合否判定基準、および公差外れ時の是正措置について教えてください。`,
    theory:
      '溶融亜鉛めっきの耐用年数は付着量（膜厚）に正比例します。膜厚は鋼材の板厚、化学成分、浴温、浸漬時間によって決定され、JIS H 8641では部材種別・板厚ごとに最低膜厚・平均膜厚が厳格に規定されています。',
    standardCriteria:
      'JIS H 8641 基準：\n・HDZ 35（板厚3.2mm未満）: 平均49μm以上\n・HDZ 45（板厚3.2mm〜6.0mm未満）: 平均63μm以上\n・HDZ 55（板厚6.0mm以上）: 平均76μm以上（局所最低68μm）',
    checkPoints: [
      '1箇所あたり3点以上の測定平均値の算出',
      'エッジ部（端面5mm以内）を避けた平坦部での測定実施',
      '標準校正ピースによる膜厚計のゼロ点・キャリブレーション確認',
    ],
    immediateAction:
      '① 基準に従い製品の主要5箇所以上で各3点測定を行い平均値を算出\n② 膜厚不足部がある場合は追加浸漬または再めっきの判定を行う',
    forbiddenAction:
      '校正していない膜厚計で端面バリの上から測定して合否を判定すること（誤判定の元になります）',
  },

  // 9. 溶接ビード・スパッタ・スラグ・ピンホール
  {
    keywords: ['溶接', 'スパッタ', 'スラグ', 'フラックス焼け', 'ビード', 'ピット', 'ピンホール', 'ブローホール'],
    category: 'CAT-1',
    causeCategory: '鋼材成分・溶接異物',
    actionCategory: '手ケレン研磨',
    verdict: 'NG（手直し必須）',
    getTitle: () => '【品管確認】溶接ビード周辺のスラグ・スパッタ残存による不めっき対策',
    getRefinedQuestion: (text) =>
      `現場にて「${text}」が発生しています。溶接ビードや止端部に残ったガラス状スラグ・スパッタが酸洗で落ちず、溶接部周りに点状の不めっきが発生しています。前処理前の機械的除去（チッピング）基準と手直し手順を教えてください。`,
    theory:
      '被覆アーク溶接やフラックス入りワイヤ溶接で生じるスラグ（ケイ酸塩ガラス質）は塩酸・硫酸では全く溶解しません。亜鉛との金属結合が遮断され、溶接線に沿って黒い不めっきが露出します。',
    standardCriteria:
      'JIS H 8641: 溶接欠陥部・スラグ残存による不めっきは不合格。チッピングハンマー・ニードルタガネ・グラインダー等で機械的に完全除去し、タッチアップまたは再めっき。',
    checkPoints: [
      '溶接止端部のアンダーカットおよびスラグ噛み込みの有無',
      'スパッタ付着の除去状態（ノズル・サンダー掛け）',
      '溶接ピンホール内部への前処理液の残留有無',
    ],
    immediateAction:
      '① ニードルタガネまたはディスクサンダーで溶接止端部のスラグ・スパッタを完全研削除去\n② 欠陥部が軽微なら規定ジンクリッチペイント（JIS K 5553）でタッチアップ',
    forbiddenAction:
      'スラグが付いたまま「酸洗で溶ける」と前処理ラインへ流すこと（確実に溶接線全体が不めっきになります）',
  },

  // 10. 歪み・熱変形・焼き曲がり・反り
  {
    keywords: ['歪み', '歪', '変形', '曲がり', '反り', 'ねじれ', '熱変形', '熱影響'],
    category: 'CAT-5',
    causeCategory: '温度・浸漬操作',
    actionCategory: '追加開口・加熱矯正',
    verdict: '判定要注意（膜厚測定要）',
    getTitle: () => '【品管確認】亜鉛浴浸漬時の熱応力による部材歪み・曲がりの矯正基準',
    getRefinedQuestion: (text) =>
      `現場にて「${text}」の相談です。薄板と厚板の複合構造物や非対称断面部材が450℃の亜鉛浴浸漬熱で歪み・反りを生じました。許容公差の確認と、油圧プレス・線状加熱による現場矯正手順を教えてください。`,
    theory:
      '常温から450℃の亜鉛浴へ急速に浸漬される際、板厚差や溶接残留応力のアンバランスによって熱膨張差が生じ、鋼材の降伏点低下とともに塑性変形（熱歪み）が発生します。',
    standardCriteria:
      '建築鉄骨精度検査基準・JASS 6: 部材全長に対する曲がり許容差（L/1000以下等）に準拠。矯正時にめっき皮膜の剥離・クラックを生じさせないこと。',
    checkPoints: [
      '水糸・レーザーレベルによる反り・ねじれ量の三次元実測',
      '薄板部と厚板部の接合部の溶接割れ・めっきクラックの有無',
      '治具吊り点のバランスおよび浸漬速度の適正性',
    ],
    immediateAction:
      '① 定盤上で部材の変形量を測定し、油圧ジャッキまたはプレス機で徐々に加圧矯正\n② 矯正後は曲げ部周辺のめっき層に剥離がないか打診・目視検査を実施',
    forbiddenAction:
      'めっき表面をガスバーナーで赤熱（600℃以上）させて急冷すること（亜鉛層が蒸発・酸化し防錆性が壊滅します）',
  },

  // 11. タッチアップ・ジンクリッチペイント・補修塗装
  {
    keywords: ['タッチアップ', '補修', 'ジンクリッチ', 'スプレー', 'ペンキ', '塗装', 'jis k 5553', '手直し'],
    category: 'CAT-6',
    causeCategory: '測定手法・規格判定',
    actionCategory: 'ジンクリッチ補修',
    verdict: 'OK（合格/許容）',
    getTitle: () => '【品管確認】JIS H 8641準拠のジンクリッチペイント（JIS K 5553）補修施工基準',
    getRefinedQuestion: (text) =>
      `現場にて「${text}」について補修手順の確認です。微小な不めっきや現場キズに対するJIS規格準拠のタッチアップ塗料仕様、下地処理（ケレン）、塗膜厚管理、許容面積基準について教えてください。`,
    theory:
      '高濃度亜鉛末塗料（ジンクリッチペイント）は乾燥塗膜中に80%以上の高純度亜鉛粉末を含み、母材鉄に対して溶融亜鉛めっきと同等の電気化学的犠牲防食作用を発揮します。',
    standardCriteria:
      'JIS H 8641 規定：\n・補修対象：単一欠陥10cm²以下かつ全表面積の0.5%以下\n・補修塗料：JIS K 5553（1種または2種）高濃度亜鉛末塗料\n・補修塗膜厚：母材めっき規格厚と同等以上（通常100μm以上推奨）',
    checkPoints: [
      '下地処理（サンドペーパー#80〜#120またはワイヤーブラシで赤サビ・油分完全除去）',
      '使用塗料の缶に「JIS K 5553適合品」の明記があるか',
      '補修面積が製品全表面積の0.5%以内（または10cm²以下）に収まっているか',
    ],
    immediateAction:
      '① 補修箇所をディスクサンダーまたはサンドペーパーで素地金属光沢が出るまで研磨\n② JIS K 5553適合の高濃度ジンクリッチ塗料を2回塗り重ね、乾燥膜厚100μm以上を確保',
    forbiddenAction:
      '市販の銀色ラッカースプレー（アルミ粉塗料等）で色合わせだけして誤魔化すこと（犠牲防食が効かず早期赤サビになります）',
  },
];

/**
 * 現場テキストから最適なトピックルールを抽出し、高精度なAI具体化＆仮解説データを生成
 */
export function generateRefinedGalvaData(rawText: string, categoryId?: CategoryId | 'AUTO' | string): RefinedAiResult {
  const text = (rawText || '').trim();
  const lowerText = text.toLowerCase();

  // 1. ルールベースによる最適マッチング
  let matchedRule: TopicRule | null = null;
  let maxScore = 0;

  for (const rule of TOPIC_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        score += kw.length; // 長いキーワードほど高スコア
      }
    }
    if (score > maxScore) {
      maxScore = score;
      matchedRule = rule;
    }
  }

  // カテゴリ指定がある場合のカテゴリ優先
  if (!matchedRule && categoryId && categoryId !== 'AUTO') {
    matchedRule = TOPIC_RULES.find((r) => r.category === categoryId) || null;
  }

  // 2. マッチしたルールに基づいて動的データを生成
  if (matchedRule && maxScore > 0) {
    const finalCat = (categoryId && categoryId !== 'AUTO' ? categoryId : matchedRule.category) as CategoryId;
    const title = matchedRule.getTitle(text);
    const refinedQuestion = matchedRule.getRefinedQuestion(text);

    return {
      title,
      refinedQuestion,
      detectedCategory: finalCat,
      aiStandardAnswer: {
        theory: matchedRule.theory,
        standard_criteria: matchedRule.standardCriteria,
        points_to_check: matchedRule.checkPoints,
      },
      keyCheckPoints: matchedRule.checkPoints,
      suggestedCriteria: matchedRule.standardCriteria,
      workerSummary: {
        summary_phenomenon: `${text.slice(0, 22) || '現場確認事象'}に関する品質確認`,
        verdict_ok_ng: matchedRule.verdict,
        immediate_action: matchedRule.immediateAction,
        forbidden_action: matchedRule.forbiddenAction,
      },
      causeCategory: matchedRule.causeCategory,
      actionCategory: matchedRule.actionCategory,
    };
  }

  // 3. マッチしない場合のセマンティック動的フォールバック
  const clean = text || '現場でのめっき品質・作業確認メモ';
  const shortTitle = clean.length > 25 ? clean.slice(0, 25) + '…' : clean;
  let detectedCat: CategoryId = (categoryId && categoryId !== 'AUTO' ? categoryId : 'CAT-4') as CategoryId;

  if (categoryId === 'AUTO' || !categoryId) {
    if (lowerText.includes('酸') || lowerText.includes('油') || lowerText.includes('黒皮') || lowerText.includes('錆')) detectedCat = 'CAT-1';
    else if (lowerText.includes('ドロス') || lowerText.includes('タレ') || lowerText.includes('温度') || lowerText.includes('灰')) detectedCat = 'CAT-2';
    else if (lowerText.includes('白サビ') || lowerText.includes('保管') || lowerText.includes('雨')) detectedCat = 'CAT-3';
    else if (lowerText.includes('穴') || lowerText.includes('パイプ') || lowerText.includes('歪み') || lowerText.includes('爆発')) detectedCat = 'CAT-5';
    else if (lowerText.includes('膜厚') || lowerText.includes('jis') || lowerText.includes('検査') || lowerText.includes('測定')) detectedCat = 'CAT-6';
  }

  return {
    title: `【品管確認】${shortTitle}の要因分析と手直し基準`,
    refinedQuestion: `村上本部長、現場にて「${clean}」の現象が確認されました。JIS H 8641（溶融亜鉛めっき）技術基準に照らした発生メカニズムと、現場での見極めポイント、および具体的な手直し手順について教えてください。`,
    detectedCategory: detectedCat,
    aiStandardAnswer: {
      theory: `【標準理論】「${clean}」に関して、鋼材表面状態、前処理薬品（脱脂・酸洗・フラックス）、または亜鉛浴浸漬条件（450℃浴温・引上げ速度）によるFe-Zn相互拡散反応の挙動を確認する必要があります。`,
      standard_criteria: `JIS H 8641: 軽微な表面欠陥はディスク研磨の上でJIS K 5553規定ジンクリッチペイントによるタッチアップ補修。密着不良や大面積の不めっきは酸剥離再めっき。`,
      points_to_check: [
        '欠陥箇所の発生範囲・母材素地状態の確認',
        '前処理槽の温度・濃度および浸漬時間の確認',
        '膜厚計による実測値とJIS規格値（HDZ 35/45/55）の照合',
      ],
    },
    keyCheckPoints: ['素地表面状態', '膜厚測定値', '母材密着性'],
    suggestedCriteria: 'JIS H 8641 外観基準および膜厚管理基準',
    workerSummary: {
      summary_phenomenon: `${shortTitle}の現場確認`,
      verdict_ok_ng: clean.includes('穴') || clean.includes('爆発') ? '危険（作業即停止）' : '判定要注意（膜厚測定要）',
      immediate_action: '① 該当箇所の欠陥範囲を目視・膜厚実測\n② 軽微ならJIS K 5553ジンクリッチ補修、重度なら品管（三浦）または本部長へ報告',
      forbidden_action: '自己判断で未補修のまま次工程や出荷ヤードへ回すこと',
    },
    causeCategory: '前処理薬品・洗浄',
    actionCategory: '酸洗・前処理手直し',
  };
}
