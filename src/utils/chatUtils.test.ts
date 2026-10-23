import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compactHistory,
  generateSessionTitle,
  groupSessionsByDate,
  parseSSELine,
  ChatMessage,
  ChatSession,
} from './chatUtils';

test('generateSessionTitle trims and limits length accurately', () => {
  assert.equal(generateSessionTitle('  halo bro! '), 'halo bro!');
  const longPrompt = 'This is an exceptionally long first prompt that exceeds forty-two characters by a wide margin';
  const title = generateSessionTitle(longPrompt);
  assert.ok(title.length <= 46);
  assert.ok(title.endsWith('...'));
  assert.equal(generateSessionTitle(''), 'Percakapan baru');
});

test('parseSSELine parses chunk, thought, and error payloads without swallowing errors', () => {
  const chunkEvent = parseSSELine('data: {"type":"chunk","text":"Halo! Ada yang bisa dibantu?"}');
  assert.deepEqual(chunkEvent, { type: 'chunk', text: 'Halo! Ada yang bisa dibantu?' });

  const errorEvent = parseSSELine('data: {"type":"error","error":"Model unavailable"}');
  assert.deepEqual(errorEvent, { type: 'error', error: 'Model unavailable' });

  const invalidLine = parseSSELine('event: ping');
  assert.equal(invalidLine, null);
});

test('compactHistory filters out error messages and keeps recent valid turns', () => {
  const msgs: ChatMessage[] = [
    { id: '1', role: 'user', content: 'Hi', timestamp: 100 },
    { id: '2', role: 'assistant', content: 'Failed', status: 'error', timestamp: 150 },
    { id: '3', role: 'assistant', content: 'Hello there!', status: 'complete', timestamp: 200 },
  ];
  const result = compactHistory(msgs, 1000, 5);
  assert.equal(result.length, 2);
  assert.equal(result[0].id, '1');
  assert.equal(result[1].id, '3');
});

test('compactHistory summarizes older messages when character limit is exceeded', () => {
  const msgs: ChatMessage[] = [
    { id: '1', role: 'user', content: 'a'.repeat(200), timestamp: 100 },
    { id: '2', role: 'assistant', content: 'b'.repeat(200), timestamp: 200 },
    { id: '3', role: 'user', content: 'c'.repeat(200), timestamp: 300 },
    { id: '4', role: 'assistant', content: 'd'.repeat(200), timestamp: 400 },
    { id: '5', role: 'user', content: 'e'.repeat(200), timestamp: 500 },
    { id: '6', role: 'assistant', content: 'f'.repeat(200), timestamp: 600 },
  ];

  const compacted = compactHistory(msgs, 500, 2);
  assert.equal(compacted.length, 3);
  assert.equal(compacted[0].role, 'user');
  assert.ok(compacted[0].content.includes('Ringkasan konteks percakapan sebelumnya'));
  assert.equal(compacted[1].id, '5');
  assert.equal(compacted[2].id, '6');
});

test('groupSessionsByDate properly sorts sessions into Today and Previous categories', () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayTimestamp = todayStart + 1000;
  const threeDaysAgo = todayStart - 3 * 24 * 3600 * 1000;
  const tenDaysAgo = todayStart - 10 * 24 * 3600 * 1000;

  const mockSessions: ChatSession[] = [
    {
      id: 's1',
      title: 'Session 1',
      createdAt: todayTimestamp,
      updatedAt: todayTimestamp,
      model: 'pro',
      mode: 'chat',
      thinkingLevel: 'low',
      searchGrounding: false,
      messages: [],
    },
    {
      id: 's2',
      title: 'Session 2',
      createdAt: threeDaysAgo,
      updatedAt: threeDaysAgo,
      model: 'pro',
      mode: 'chat',
      thinkingLevel: 'low',
      searchGrounding: false,
      messages: [],
    },
    {
      id: 's3',
      title: 'Session 3',
      createdAt: tenDaysAgo,
      updatedAt: tenDaysAgo,
      model: 'pro',
      mode: 'chat',
      thinkingLevel: 'low',
      searchGrounding: false,
      messages: [],
    },
  ];

  const grouped = groupSessionsByDate(mockSessions);
  assert.equal(grouped.Today.length, 1);
  assert.equal(grouped.Today[0].id, 's1');
  assert.equal(grouped['Previous 7 Days'].length, 1);
  assert.equal(grouped['Previous 7 Days'][0].id, 's2');
  assert.equal(grouped.Older.length, 1);
  assert.equal(grouped.Older[0].id, 's3');
});

import { detectImageStudioIntent } from './imageStudioUtils';

test('detectImageStudioIntent detects impressionist oil painting (Cat) and other Gemini image templates', () => {
  const catIntent = detectImageStudioIntent(
    'Ubah potret menjadi lukisan cat minyak impresionis bertekstur tebal dengan sapuan kuas ekspresif dan suasana jalanan kota yang cerah.',
    true
  );
  assert.equal(catIntent.isImageRequest, true);
  assert.equal(catIntent.styleId, 'paint');

  const sitcomIntent = detectImageStudioIntent(
    'Ubah subjek ini menjadi adegan pembuka sitkom TV era 80-an yang hangat dengan teks kuning "GUEST STAR" di bagian bawah. [Rasio aspek: 16:9]',
    true
  );
  assert.equal(sitcomIntent.isImageRequest, true);
  assert.equal(sitcomIntent.styleId, 'sitcom');
  assert.equal(sitcomIntent.aspectRatio, '16:9');
});

