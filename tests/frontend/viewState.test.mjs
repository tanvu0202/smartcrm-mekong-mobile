// Kiểm thử logic của DataState: bốn trạng thái loading / error / empty / ready và thứ tự ưu tiên.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveViewState } from '../../src/frontend/src/lib/viewState.js';

test('đang tải → loading, kể cả khi đã có dữ liệu cũ (tải lại)', () => {
  assert.equal(resolveViewState({ loading: true, error: null, data: null }), 'loading');
  assert.equal(resolveViewState({ loading: true, error: null, data: [1] }), 'loading');
});
test('có lỗi → error, ưu tiên hơn empty (backend sập không được hiện "chưa có phiếu")', () => {
  assert.equal(resolveViewState({ loading: false, error: new Error('x'), data: null }), 'error');
  assert.equal(resolveViewState({ loading: false, error: new Error('x'), data: [] }), 'error');
});
test('mảng rỗng / null → empty (biên)', () => {
  assert.equal(resolveViewState({ loading: false, error: null, data: [] }), 'empty');
  assert.equal(resolveViewState({ loading: false, error: null, data: null }), 'empty');
});
test('có dữ liệu → ready; đối tượng đơn lẻ không bị coi là rỗng', () => {
  assert.equal(resolveViewState({ loading: false, error: null, data: [1] }), 'ready');
  assert.equal(resolveViewState({ loading: false, error: null, data: { id: 1 } }), 'ready');
});
test('isEmpty tùy biến được dùng khi truyền vào', () => {
  assert.equal(resolveViewState({ loading: false, error: null, data: { items: [] }, isEmpty: (d) => d.items.length === 0 }), 'empty');
});
