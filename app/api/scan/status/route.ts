/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextResponse } from 'next/server';
import { activeScanState } from '@/lib/db';

export async function GET() {
  return NextResponse.json(activeScanState);
}
