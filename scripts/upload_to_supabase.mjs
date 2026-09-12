import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = 'https://vdyhsqiqngukimuqulmb.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkeWhzcWlxbmd1a2ltdXF1bG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDY5OTEsImV4cCI6MjEwNDc4Mjk5MX0.fl3EJ4hdjuylGgYmO2JG8_NHwX0umFA4hKw6n-PpGh4';
const supabase = createClient(url, key);

async function main() {
  console.log('Reading initialQuestions.ts in ガルバ...');
  const fileContent = fs.readFileSync(path.resolve('./constants/initialQuestions.ts'), 'utf-8');
  
  const qMatch = fileContent.match(/export const INITIAL_QUESTIONS_MASTER:\s*QuestionQueueItem\[\]\s*=\s*(\[[\s\S]*?\]);/);
  const kMatch = fileContent.match(/export const INITIAL_KNOWLEDGE_MASTER:\s*KnowledgeRecord\[\]\s*=\s*(\[[\s\S]*?\]);/);

  const questions = JSON.parse(qMatch[1]);
  const rawKnowledge = JSON.parse(kMatch[1]);

  console.log('Parsed ' + questions.length + ' questions and ' + rawKnowledge.length + ' knowledge records.');

  // Clean knowledge records to match DB columns
  const cleanKnowledge = rawKnowledge.map((k) => ({
    id: k.id,
    question_id: k.question_id,
    category_id: k.category_id || 'CAT-1',
    question_title: k.question_title,
    original_question: k.original_question,
    refined_problem: k.refined_problem,
    has_voice_answer: k.has_voice_answer ?? true,
    ai_standard_answer: k.ai_standard_answer,
    phenomenon: k.phenomenon,
    cause: k.cause,
    action_and_criteria: k.action_and_criteria,
    prevention: k.prevention,
    key_terminology: k.key_terminology || [],
    full_transcript: k.full_transcript,
    audio_url: k.audio_url || null,
    images: k.images || [],
    worker_summary: k.worker_summary || null,
    cause_category: k.cause_category || null,
    action_category: k.action_category || null,
    created_at: k.created_at || new Date().toISOString(),
    updated_at: k.updated_at || new Date().toISOString()
  }));

  // Upload questions
  for (let i = 0; i < questions.length; i += 25) {
    const chunk = questions.slice(i, i + 25);
    const { error } = await supabase.from('questions_queue').upsert(chunk);
    if (error) console.error('Error uploading question chunk:', error);
    else console.log('Uploaded questions: ' + (i + chunk.length) + ' / ' + questions.length);
  }

  // Upload knowledge
  for (let i = 0; i < cleanKnowledge.length; i += 25) {
    const chunk = cleanKnowledge.slice(i, i + 25);
    const { error } = await supabase.from('knowledge_records').upsert(chunk);
    if (error) console.error('Error uploading knowledge chunk:', error);
    else console.log('Uploaded knowledge: ' + (i + chunk.length) + ' / ' + cleanKnowledge.length);
  }

  console.log('🎉 Galva Bible Seeding successfully completed!');
}

main().catch(console.error);
