import { NextResponse } from 'next/server';
import type { FoodResult } from '@/lib/types';

// Open Food Facts politely asks for a descriptive User-Agent.
const UA = 'Reset-HealthDashboard/1.0 (personal health tracker)';
const TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      cache: 'no-store',
    });
  } finally {
    clearTimeout(id);
  }
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

interface OffNutriments {
  ['energy-kcal_100g']?: number | string;
  ['proteins_100g']?: number | string;
  ['carbohydrates_100g']?: number | string;
  ['fat_100g']?: number | string;
}

interface OffProduct {
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  code?: string;
  nutriments?: OffNutriments;
  serving_quantity?: number | string;
}

function normalise(p: OffProduct, fallbackBarcode: string | null): FoodResult {
  const n = p.nutriments ?? {};
  const name =
    p.product_name || p.product_name_en || p.brands || 'Unknown product';
  const serving = num(p.serving_quantity);
  return {
    name: name.trim(),
    barcode: p.code ?? fallbackBarcode,
    calories_100: num(n['energy-kcal_100g']),
    protein_100: num(n['proteins_100g']),
    carbs_100: num(n['carbohydrates_100g']),
    fat_100: num(n['fat_100g']),
    serving_g: serving > 0 ? serving : null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get('barcode');
  const q = searchParams.get('q');

  try {
    // --- Barcode lookup --------------------------------------------------
    if (barcode) {
      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
        barcode,
      )}.json`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error(`OFF ${res.status}`);
      const data = (await res.json()) as { status?: number; product?: OffProduct };
      if (data.status !== 1 || !data.product) {
        return NextResponse.json(
          { found: false, message: 'No product found for that barcode.' },
          { status: 404 },
        );
      }
      return NextResponse.json({
        found: true,
        result: normalise(data.product, barcode),
      });
    }

    // --- Text search -----------------------------------------------------
    if (q) {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        q,
      )}&search_simple=1&action=process&json=1&page_size=10`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error(`OFF ${res.status}`);
      const data = (await res.json()) as { products?: OffProduct[] };
      const results = (data.products ?? [])
        .filter((p) => (p.product_name || p.product_name_en))
        .map((p) => normalise(p, p.code ?? null))
        .slice(0, 10);
      return NextResponse.json({ found: results.length > 0, results });
    }

    return NextResponse.json(
      { error: 'Provide a `barcode` or `q` query parameter.' },
      { status: 400 },
    );
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      {
        found: false,
        error: aborted
          ? 'Open Food Facts timed out. You can still add this food manually.'
          : 'Could not reach Open Food Facts. You can still add this food manually.',
      },
      { status: 504 },
    );
  }
}
