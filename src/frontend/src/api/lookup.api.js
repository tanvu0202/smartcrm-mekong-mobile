import { get } from './client.js';
import { toCenter, toTechnician, listOf } from './contract.js';

export async function listCenters() {
  return listOf(await get('/centers'), 'danh sách trung tâm').map(toCenter);
}

export async function listTechnicians({ centerId } = {}) {
  return listOf(await get('/technicians', { center_id: centerId }), 'danh sách kỹ thuật viên').map(toTechnician);
}
