/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextResponse } from 'next/server';
import { loadLeads, calculateDashboardStats } from '@/lib/db';

export async function GET() {
  const leads = loadLeads();
  const stats = calculateDashboardStats(leads);
  return NextResponse.json(stats);
}
