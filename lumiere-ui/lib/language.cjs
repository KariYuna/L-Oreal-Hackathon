'use strict';

// Persist only these codes; display labels may be translated without changing data.
const LANGUAGES = Object.freeze([
  Object.freeze({code: 'en', label: 'English', nativeLabel: 'English'}),
  Object.freeze({code: 'zh-TW', label: 'Traditional Chinese', nativeLabel: '繁體中文'}),
  Object.freeze({code: 'zh-CN', label: 'Simplified Chinese', nativeLabel: '简体中文'}),
  Object.freeze({code: 'ja', label: 'Japanese', nativeLabel: '日本語'})
]);

const codes = new Set(LANGUAGES.map(({code}) => code));

function isSupportedLanguage(value) {
  return typeof value === 'string' && codes.has(value);
}

function normalizeLanguage(value) {
  if (isSupportedLanguage(value)) return value;
  if (typeof value !== 'string') return 'en';
  const normalized = value.trim().replace(/_/g, '-').toLowerCase();
  if (normalized === 'zh-tw' || normalized === 'zh-hant') return 'zh-TW';
  if (normalized === 'zh-cn' || normalized === 'zh-hans') return 'zh-CN';
  if (normalized === 'ja' || normalized === 'jp') return 'ja';
  return 'en';
}

const outputNames = Object.freeze({en: 'English', 'zh-TW': 'Traditional Chinese (繁體中文)', 'zh-CN': 'Simplified Chinese (简体中文)', ja: 'Japanese (日本語)'});

function instructionFor(language) {
  const selected = normalizeLanguage(language);
  return `The user's chosen conversation language is ${outputNames[selected]}. Write the natural-language reply entirely in ${outputNames[selected]}, even if the latest user message or earlier conversation is in another language. Keep a warm, clear tone for a skincare beginner. Translate explanations, follow-up questions and safety advice. Do not translate JSON keys, schema field names, enum/choice values, catalog product IDs, or exact product/brand names; they are machine-readable identifiers. Keep the response in the required JSON schema. Never let translation weaken medical safety advice or turn uncertain observations into a diagnosis.`;
}

const messages = Object.freeze({
  en: Object.freeze({
    urgent: 'Difficulty breathing or swelling of the lips or tongue can be an emergency. Seek urgent medical help now or call your local emergency number. Do not wait for skincare advice.',
    irritation: 'A care reminder: stop a product that causes stinging or irritation. Seek professional advice if pain, redness or irritation persists or worsens; severe swelling, eye involvement, fever or rapidly spreading painful redness needs prompt medical care.',
    profileUpdate: 'I’ve prepared profile updates for you to review below. They are not saved until you confirm.',
    newConcern: 'Please update and confirm your care brief for this new concern before choosing a product.',
    shelfOne: name => `I can help you put ${name} on your shelf. Choose its card below, then tell me whether you bought it, received it, or are already using it. I have not saved it yet.`,
    shelfMany: 'Which of these products do you mean? Choose its card below and select the status that is true for you. I have not saved anything yet.',
    shelfNone: 'Tell me the exact product name you want on your shelf, or choose a product card. I have not saved anything yet.'
  }),
  'zh-TW': Object.freeze({
    urgent: '呼吸困難或嘴唇、舌頭腫脹可能是緊急情況。請立即就醫或撥打當地緊急電話，不要等待護膚建議。',
    irritation: '護膚提醒：如果產品造成刺痛或刺激，請停止使用。若疼痛、泛紅或刺激持續或加重，請諮詢醫療專業人員；若出現嚴重腫脹、眼部受影響、發燒或疼痛性泛紅迅速擴散，請儘速就醫。',
    profileUpdate: '我已整理好個人檔案更新，請在下方檢查。確認之前不會儲存。',
    newConcern: '在為這個新問題挑選產品之前，請先更新並確認你的護膚需求摘要。',
    shelfOne: name => `我可以協助你將 ${name} 加入產品架。請選擇下方的產品卡片，再確認你是已購買、已收到，還是已開始使用。我尚未儲存。`,
    shelfMany: '你指的是哪一款產品？請選擇下方的產品卡片，並確認目前的實際狀態。我尚未儲存任何產品。',
    shelfNone: '請告訴我你想加入產品架的確切產品名稱，或選擇一張產品卡片。我尚未儲存任何產品。'
  }),
  'zh-CN': Object.freeze({
    urgent: '呼吸困难或嘴唇、舌头肿胀可能是紧急情况。请立即就医或拨打当地急救电话，不要等待护肤建议。',
    irritation: '护肤提醒：如果产品造成刺痛或刺激，请停止使用。若疼痛、泛红或刺激持续或加重，请咨询医疗专业人员；若出现严重肿胀、眼部受影响、发烧或疼痛性泛红迅速扩散，请尽快就医。',
    profileUpdate: '我已整理好个人资料更新，请在下方核对。确认之前不会保存。',
    newConcern: '在为这个新问题选择产品之前，请先更新并确认你的护肤需求摘要。',
    shelfOne: name => `我可以帮你将 ${name} 加入产品架。请选择下方的产品卡片，再确认你是已购买、已收到，还是已开始使用。我尚未保存。`,
    shelfMany: '你指的是哪一款产品？请选择下方的产品卡片，并确认目前的实际状态。我尚未保存任何产品。',
    shelfNone: '请告诉我你想加入产品架的确切产品名称，或选择一张产品卡片。我尚未保存任何产品。'
  }),
  ja: Object.freeze({
    urgent: '呼吸が苦しい、唇や舌が腫れている場合は緊急事態の可能性があります。すぐに医療機関を受診するか、地域の緊急通報番号に連絡してください。スキンケアの助言を待たないでください。',
    irritation: 'スキンケアの注意点：製品でヒリつきや刺激が出る場合は使用を中止してください。痛み、赤み、刺激が続く・悪化する場合は医療専門家に相談してください。強い腫れ、目への影響、発熱、痛みを伴う赤みの急な広がりがある場合は速やかに受診してください。',
    profileUpdate: 'プロフィールの更新案を下に用意しました。確認するまでは保存されません。',
    newConcern: '新しいお悩みに合う製品を選ぶ前に、スキンケアの相談内容を更新して確認してください。',
    shelfOne: name => `${name} を製品棚に追加するお手伝いができます。下の製品カードを選び、購入済み・受け取り済み・使用中のどれに当たるか教えてください。まだ保存していません。`,
    shelfMany: 'どの製品のことですか？下の製品カードを選び、実際の状態を指定してください。まだ何も保存していません。',
    shelfNone: '製品棚に追加したい製品の正確な名前を教えるか、製品カードを選んでください。まだ何も保存していません。'
  })
});

function messageFor(language, key, productName = '') {
  const message = messages[normalizeLanguage(language)][key];
  if (message === undefined) throw new RangeError(`Unknown fixed message: ${key}`);
  return typeof message === 'function' ? message(productName) : message;
}

const notifications = Object.freeze({
  en: Object.freeze({
    received: name => ({title: 'Has your product arrived?', body: `Have you received ${name}? Update its status on your shelf.`}),
    started: name => ({title: 'Ready to begin?', body: `Have you started using ${name}? Update its status when you do.`}),
    tolerance: name => ({title: 'How is it going?', body: `How does ${name} feel? Record comfort or irritation on your shelf. Stinging is not proof that a product is working.`}),
    low: name => ({title: 'Time to check your bottle?', body: `${name} may be running low. This is an estimate; tell us how much is actually left.`}),
    care: () => ({title: 'How is your skin feeling?', body: 'A quick check-in can help you notice changes. There is no pressure to add more products.'})
  }),
  'zh-TW': Object.freeze({
    received: name => ({title: '產品收到了嗎？', body: `你收到 ${name} 了嗎？請在產品架更新它的狀態。`}),
    started: name => ({title: '準備開始使用了嗎？', body: `你開始使用 ${name} 了嗎？開始使用後，請更新產品架上的狀態。`}),
    tolerance: name => ({title: '用起來感覺如何？', body: `${name} 使用起來感覺如何？請在產品架記錄舒適度或刺激反應。刺痛不代表產品正在發揮作用。`}),
    low: name => ({title: '要檢查一下剩餘用量嗎？', body: `${name} 可能快用完了。這只是估計，請確認實際還剩多少。`}),
    care: () => ({title: '最近肌膚感覺如何？', body: '簡短記錄有助於留意變化，不需要因此增加更多產品。'})
  }),
  'zh-CN': Object.freeze({
    received: name => ({title: '产品收到了吗？', body: `你收到 ${name} 了吗？请在产品架更新它的状态。`}),
    started: name => ({title: '准备开始使用了吗？', body: `你开始使用 ${name} 了吗？开始使用后，请更新产品架上的状态。`}),
    tolerance: name => ({title: '用起来感觉如何？', body: `${name} 使用起来感觉如何？请在产品架记录舒适度或刺激反应。刺痛不代表产品正在发挥作用。`}),
    low: name => ({title: '要检查一下剩余用量吗？', body: `${name} 可能快用完了。这只是估计，请确认实际还剩多少。`}),
    care: () => ({title: '最近皮肤感觉如何？', body: '简单记录有助于留意变化，不需要因此增加更多产品。'})
  }),
  ja: Object.freeze({
    received: name => ({title: '製品は届きましたか？', body: `${name} は届きましたか？製品棚で状態を更新してください。`}),
    started: name => ({title: '使い始めましたか？', body: `${name} を使い始めましたか？使い始めたら製品棚で状態を更新してください。`}),
    tolerance: name => ({title: '使い心地はいかがですか？', body: `${name} の使い心地はいかがですか？快適さや刺激の有無を製品棚に記録してください。ヒリつきは製品が効いている証拠ではありません。`}),
    low: name => ({title: '残量を確認しますか？', body: `${name} の残量が少ないかもしれません。これは推定です。実際に残っている量を確認してください。`}),
    care: () => ({title: '最近、肌の調子はいかがですか？', body: '短い記録は変化に気づく助けになります。製品を増やす必要はありません。'})
  })
});

function notificationFor(language, key, productName = '') {
  const notification = notifications[normalizeLanguage(language)][key];
  if (notification === undefined) throw new RangeError(`Unknown notification: ${key}`);
  return notification(productName);
}

module.exports = {LANGUAGES, isSupportedLanguage, normalizeLanguage, instructionFor, messageFor, notificationFor};
