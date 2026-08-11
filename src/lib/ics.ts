export interface IcsEvent {
  uid: string;
  date: string; // YYYY-MM-DD, all-day event
  title: string;
}

// 진짜 webcal:// 구독(캘린더 앱이 주기적으로 다시 불러오는 라이브 피드)은 유저별
// 서버 엔드포인트가 있어야 하는데, 워치리스트는 로컬에만 있다 (§2-3) - 서버에
// 보내는 순간 "서버는 누가 뭘 보는지 모른다" 원칙이 깨진다. 그래서 지금은 현재
// 워치리스트 기준 스냅샷을 한 번 내보내는 방식으로 구현 - 캘린더 앱에 가져오기만
// 하면 되고, 계정도 서버 저장도 필요 없다.
export function buildIcs(events: IcsEvent[]): string {
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//K-STOCKREPLAY//KO', 'CALSCALE:GREGORIAN'];
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@k-stockreplay.pe.kr`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${e.date.replace(/-/g, '')}`,
      `SUMMARY:${e.title.replace(/([,;])/g, '\\$1')}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(filename: string, events: IcsEvent[]): void {
  const blob = new Blob([buildIcs(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
