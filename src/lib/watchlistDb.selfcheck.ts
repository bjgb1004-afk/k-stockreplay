import assert from 'node:assert/strict';
import { withMarketDefault } from './watchlistDb';

// market 필드가 아예 없는 옛날 레코드 -> KR로 기본값
const legacy = withMarketDefault({ local_id: 'a', ticker: '005930', companyName: '삼성전자', updated_at: '2026-01-01', thesis: '' });
assert.equal(legacy.market, 'KR');

// market이 이미 있으면 그대로
const us = withMarketDefault({ local_id: 'b', ticker: 'AAPL', companyName: 'Apple', updated_at: '2026-01-01', thesis: '', market: 'US' });
assert.equal(us.market, 'US');

console.log('OK: watchlistDb selfcheck passed');
