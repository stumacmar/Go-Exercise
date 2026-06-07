import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/food/route';

function mockFetch(impl: (url: string) => unknown) {
  return vi.fn(async (url: string) => {
    const body = impl(url);
    return {
      ok: true,
      status: 200,
      json: async () => body,
    } as unknown as Response;
  });
}

const sampleProduct = {
  status: 1,
  product: {
    code: '0123456789012',
    product_name: 'Test Greek Yoghurt',
    nutriments: {
      'energy-kcal_100g': 59,
      proteins_100g: 10,
      carbohydrates_100g: 3.6,
      fat_100g: 0.4,
    },
    serving_quantity: 150,
  },
};

beforeEach(() => {
  vi.restoreAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
});

function req(qs: string) {
  return new Request(`http://localhost/api/food?${qs}`);
}

describe('UAT: /api/food — Open Food Facts proxy', () => {
  it('UAT-095 barcode lookup returns the normalised product', async () => {
    vi.stubGlobal('fetch', mockFetch(() => sampleProduct));
    const res = await GET(req('barcode=0123456789012'));
    const data = await res.json();
    expect(data.found).toBe(true);
    expect(data.result.name).toBe('Test Greek Yoghurt');
    expect(data.result.calories_100).toBe(59);
    expect(data.result.protein_100).toBe(10);
    expect(data.result.serving_g).toBe(150);
  });

  it('UAT-096 barcode lookup hits the OFF v2 product endpoint', async () => {
    const f = mockFetch(() => sampleProduct);
    vi.stubGlobal('fetch', f);
    await GET(req('barcode=999'));
    expect(f).toHaveBeenCalled();
    expect((f.mock.calls[0][0] as string)).toContain('/api/v2/product/999.json');
  });

  it('UAT-097 OFF requests carry a descriptive User-Agent header', async () => {
    const f = mockFetch(() => sampleProduct);
    vi.stubGlobal('fetch', f);
    await GET(req('barcode=999'));
    const init = f.mock.calls[0][1] as RequestInit;
    const ua = (init.headers as Record<string, string>)['User-Agent'];
    expect(ua).toBeTruthy();
    expect(ua.toLowerCase()).toContain('reset');
  });

  it('UAT-098 unknown barcode returns a 404 found:false', async () => {
    vi.stubGlobal('fetch', mockFetch(() => ({ status: 0 })));
    const res = await GET(req('barcode=000'));
    expect(res.status).toBe(404);
    expect((await res.json()).found).toBe(false);
  });

  it('UAT-099 missing macro fields normalise to zero', async () => {
    vi.stubGlobal('fetch', mockFetch(() => ({ status: 1, product: { code: 'x', product_name: 'Bare', nutriments: {} } })));
    const data = await (await GET(req('barcode=x'))).json();
    expect(data.result.calories_100).toBe(0);
    expect(data.result.protein_100).toBe(0);
    expect(data.result.serving_g).toBeNull();
  });

  it('UAT-100 string nutriment values are parsed to numbers', async () => {
    vi.stubGlobal('fetch', mockFetch(() => ({ status: 1, product: { code: 'x', product_name: 'Str', nutriments: { 'energy-kcal_100g': '120', proteins_100g: '8.5' } } })));
    const data = await (await GET(req('barcode=x'))).json();
    expect(data.result.calories_100).toBe(120);
    expect(data.result.protein_100).toBe(8.5);
  });

  it('UAT-101 text search returns up to 10 normalised results', async () => {
    const products = Array.from({ length: 15 }, (_, i) => ({
      code: `c${i}`,
      product_name: `Food ${i}`,
      nutriments: { 'energy-kcal_100g': 100 + i },
    }));
    vi.stubGlobal('fetch', mockFetch(() => ({ products })));
    const data = await (await GET(req('q=oats'))).json();
    expect(data.found).toBe(true);
    expect(data.results.length).toBe(10);
    expect(data.results[0].name).toBe('Food 0');
  });

  it('UAT-102 text search hits the OFF search.pl endpoint with the query', async () => {
    const f = mockFetch(() => ({ products: [] }));
    vi.stubGlobal('fetch', f);
    await GET(req('q=greek+yoghurt'));
    expect((f.mock.calls[0][0] as string)).toContain('search.pl');
    expect((f.mock.calls[0][0] as string)).toContain('greek');
  });

  it('UAT-103 search with no matches returns found:false', async () => {
    vi.stubGlobal('fetch', mockFetch(() => ({ products: [] })));
    const data = await (await GET(req('q=zzz'))).json();
    expect(data.found).toBe(false);
  });

  it('UAT-104 search filters out nameless products', async () => {
    vi.stubGlobal('fetch', mockFetch(() => ({ products: [{ code: '1' }, { code: '2', product_name: 'Real' }] })));
    const data = await (await GET(req('q=x'))).json();
    expect(data.results).toHaveLength(1);
    expect(data.results[0].name).toBe('Real');
  });

  it('UAT-105 no query params returns a 400 error', async () => {
    const res = await GET(req(''));
    expect(res.status).toBe(400);
  });

  it('UAT-106 a network failure degrades gracefully to a 504 with a manual-entry hint', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network down');
    }));
    const res = await GET(req('barcode=123'));
    expect(res.status).toBe(504);
    const data = await res.json();
    expect(data.found).toBe(false);
    expect(data.error.toLowerCase()).toContain('manually');
  });

  it('UAT-107 a timeout (AbortError) reports a timeout message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      const e = new Error('aborted');
      e.name = 'AbortError';
      throw e;
    }));
    const data = await (await GET(req('q=slow'))).json();
    expect(data.error.toLowerCase()).toMatch(/timed out|manually/);
  });

  it('UAT-108 brand falls back as the name when product_name is absent', async () => {
    vi.stubGlobal('fetch', mockFetch(() => ({ status: 1, product: { code: 'b', brands: 'Acme', nutriments: {} } })));
    const data = await (await GET(req('barcode=b'))).json();
    expect(data.result.name).toBe('Acme');
  });
});
