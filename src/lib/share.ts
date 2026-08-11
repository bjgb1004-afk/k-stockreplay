// 진짜 "링크"(다른 사람이 열면 내 리포트가 보이는 URL)는 서버에 리포트를 저장하고
// 렌더링하는 백엔드가 있어야 하는데, 워치리스트는 로컬에만 있다 (§2-3). 그래서
// 텍스트 리포트를 네이티브 공유 시트(Web Share API)로 공유하거나, 지원 안 하면
// 클립보드로 복사하는 방식으로 구현 - 새 서버 없이 정직하게 되는 범위.
export async function shareReport(title: string, text: string): Promise<'shared' | 'copied'> {
  if (navigator.share) {
    await navigator.share({ title, text });
    return 'shared';
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}
