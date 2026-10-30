/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextResponse } from 'next/server';
import { activeScanState } from '@/lib/db';

export async function POST() {
  activeScanState.stopped = true;
  activeScanState.isScanning = false;
  activeScanState.logs.push(
    `[${new Date().toLocaleTimeString('ru-RU')}] Сканирование принудительно остановлено пользователем.`
  );
  return NextResponse.json({ success: true, status: activeScanState });
}
