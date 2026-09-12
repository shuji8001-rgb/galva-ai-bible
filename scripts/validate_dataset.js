const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'constants', 'initialQuestions.ts');
const content = fs.readFileSync(filePath, 'utf8');

const prefix = 'export const INITIAL_QUESTIONS_MASTER: QuestionQueueItem[] = ';
const suffix = 'export const INITIAL_KNOWLEDGE_MASTER: KnowledgeRecord[] = ';

const pIndex = content.indexOf(prefix);
const sIndex = content.indexOf(suffix);

const jsonStr = content.substring(pIndex + prefix.length, sIndex).trim().replace(/;$/, '');
const list = JSON.parse(jsonStr);

console.log('=== 全' + list.length + '問の検証 ===');
const targetNos = [10, 31, 35, 51, 60, 62, 141, 142, 147];

targetNos.forEach(no => {
  const item = list.find(q => q.no === no);
  if (item) {
    console.log(`\n【No.${item.no}】 ${item.title}`);
    console.log(`  🚨 危険・絶対禁止: ${item.worker_summary.forbidden_action}`);
    console.log(`  ⚡ 即時対応処置:   ${item.worker_summary.immediate_action}`);
  }
});
