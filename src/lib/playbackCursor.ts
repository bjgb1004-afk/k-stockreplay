export function clampCursor(cursor: number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(Math.max(cursor, 1), length);
}

export function stepForward(cursor: number, length: number): number {
  return clampCursor(cursor + 1, length);
}

// 데이터셋이 비어 있을 때는 호출되지 않는다 - ReplayPlayback이 rows.length === 0일 때
// 컨트롤 자체를 렌더링하지 않으므로, 여기서 length를 따로 받아 0을 반환할 필요가 없다.
export function stepBackward(cursor: number): number {
  return Math.max(cursor - 1, 1);
}

export function isAtEnd(cursor: number, length: number): boolean {
  return cursor >= length;
}
