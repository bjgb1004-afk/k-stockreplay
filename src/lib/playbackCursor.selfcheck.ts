import assert from 'node:assert/strict';
import { clampCursor, stepForward, stepBackward, isAtEnd } from './playbackCursor';

// 정상 범위
assert.equal(clampCursor(30, 100), 30);
// 상한 초과 -> 상한으로
assert.equal(clampCursor(200, 100), 100);
// 하한 미만 -> 최소 1
assert.equal(clampCursor(0, 100), 1);
// 빈 데이터셋 -> 0
assert.equal(clampCursor(5, 0), 0);

// 한 칸 전진
assert.equal(stepForward(5, 10), 6);
// 끝에서는 더 못 감
assert.equal(stepForward(10, 10), 10);

// 한 칸 후진
assert.equal(stepBackward(5), 4);
// 처음에서는 더 못 감
assert.equal(stepBackward(1), 1);

assert.equal(isAtEnd(10, 10), true);
assert.equal(isAtEnd(9, 10), false);

console.log('OK: playbackCursor selfcheck passed');
