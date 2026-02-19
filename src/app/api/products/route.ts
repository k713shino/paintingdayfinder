import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ACCESS_KEY = process.env.PAAPI_ACCESS_KEY!;
const SECRET_KEY = process.env.PAAPI_SECRET_KEY!;
const PARTNER_TAG = process.env.PAAPI_PARTNER_TAG!;

const HOST = 'webservices.amazon.co.jp';
const REGION = 'us-west-2';
const PATH = '/paapi5/getitems';
const SERVICE = 'ProductAdvertisingAPI';

const ASINS = [
  'B0DLW4S914', // ガラスヤスリ
  'B0013ES7KW', // Mr.うすめ液
  'B0CN8W5TV9', // マスキングテープ
  'B0FT81W68Y', // Mr.サーフェイサー
  'B07L4QNZVF', // SwitchBot 温湿度計
  'B0BNM9WPWT', // 面相筆
];

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
  const kDate = hmac('AWS4' + key, dateStamp);
  const kRegion = hmac(kDate, regionName);
  const kService = hmac(kRegion, serviceName);
  return hmac(kService, 'aws4_request');
}

function buildAuthHeader(payload: string): Record<string, string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = hash(payload);

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${HOST}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems\n`;

  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';

  const canonicalRequest = ['POST', PATH, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, hash(canonicalRequest)].join('\n');

  const signingKey = getSignatureKey(SECRET_KEY, dateStamp, REGION, SERVICE);
  const signature = hmac(signingKey, stringToSign).toString('hex');

  return {
    'content-encoding': 'amz-1.0',
    'content-type': 'application/json; charset=utf-8',
    host: HOST,
    'x-amz-date': amzDate,
    'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
    Authorization:
      `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

export async function GET() {
  const payload = JSON.stringify({
    ItemIds: ASINS,
    PartnerTag: PARTNER_TAG,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.co.jp',
    Resources: ['Images.Primary.Medium', 'ItemInfo.Title', 'Offers.Listings.Price'],
  });

  const headers = buildAuthHeader(payload);

  try {
    const apiRes = await fetch(`https://${HOST}${PATH}`, {
      method: 'POST',
      headers,
      body: payload,
      next: { revalidate: 3600 }, // 1時間キャッシュ
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error('PA-API error:', text);
      return NextResponse.json({ error: 'PA-API request failed' }, { status: 500 });
    }

    const data = await apiRes.json();
    const items = data.ItemsResult?.Items ?? [];

    const products = items.map((item: any) => ({
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue ?? '',
      image: item.Images?.Primary?.Medium?.URL ?? '',
      price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount ?? null,
      url: `https://www.amazon.co.jp/dp/${item.ASIN}?tag=${PARTNER_TAG}`,
    }));

    return NextResponse.json({ products }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
