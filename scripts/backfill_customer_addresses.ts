/**
 * 得意先マスターで住所・〒が空の会社を「販売顧客リスト.csv」から埋める。
 *
 * ・既に値が入っている得意先は絶対に上書きしない（空欄だけを埋める）
 * ・照合は コード完全一致 → 会社名完全一致 → 会社名を正規化して一致 の順
 * ・同名が複数ある等で一意に決まらないものは自動適用せず、一覧に出して人が判断する
 *
 * 既定は dry-run。実際に更新するときだけ --apply を付ける。
 *
 *   DATABASE_URL=... npx tsx scripts/backfill_customer_addresses.ts
 *   DATABASE_URL=... npx tsx scripts/backfill_customer_addresses.ts --apply
 */
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const prisma = new PrismaClient();

const CSV_FILE = process.env.CUSTOMER_CSV ?? '販売顧客リスト.csv';

/** 表記ゆれを吸収して会社名を突き合わせるためのキー */
const normalizeName = (name: string): string =>
    (name || '')
        .replace(/[\s　]/g, '')
        .replace(/[（）()]/g, '')
        .replace(/株式会社|有限会社|合同会社/g, '')
        .replace(/[㈱㈲]/g, '')
        .toLowerCase();

const isBlank = (value: string | null | undefined): boolean => !value || value.trim() === '';

interface CsvRow { code: string; name: string; postalCode: string; address: string; }

async function main() {
    const apply = process.argv.includes('--apply');
    const csvPath = path.resolve(process.cwd(), CSV_FILE);

    if (!fs.existsSync(csvPath)) {
        console.error(`CSV が見つかりません: ${csvPath}`);
        process.exitCode = 1;
        return;
    }

    console.log(`[${apply ? 'APPLY' : 'DRY-RUN'}] ${CSV_FILE} から得意先の住所・〒を補完します`);

    const records = parse(fs.readFileSync(csvPath), {
        columns: true,
        skip_empty_lines: true,
        trim: true
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as Record<string, any>[];

    const rows: CsvRow[] = records
        .map(r => ({
            code: String(r['コード'] ?? '').trim(),
            name: String(r['顧客名'] ?? '').trim(),
            postalCode: String(r['〒'] ?? '').trim(),
            address: String(r['住所'] ?? '').trim()
        }))
        .filter(r => r.name && (r.address || r.postalCode));

    const byCode = new Map<string, CsvRow>();
    const byName = new Map<string, CsvRow[]>();
    const byNormalized = new Map<string, CsvRow[]>();

    for (const row of rows) {
        if (row.code) byCode.set(row.code, row);
        byName.set(row.name, [...(byName.get(row.name) ?? []), row]);
        const key = normalizeName(row.name);
        byNormalized.set(key, [...(byNormalized.get(key) ?? []), row]);
    }

    const customers = await prisma.customer.findMany({
        select: { id: true, code: true, name: true, address: true, postalCode: true }
    });

    const targets = customers.filter(c => isBlank(c.address) || isBlank(c.postalCode));
    console.log(`得意先 ${customers.length} 件のうち、住所または〒が空なのは ${targets.length} 件`);

    const planned: { id: number; label: string; how: string; data: { address?: string; postalCode?: string } }[] = [];
    const ambiguous: string[] = [];
    const unmatched: string[] = [];

    for (const customer of targets) {
        const label = `${customer.code} ${customer.name}`;

        let match: CsvRow | undefined;
        let how = '';

        const byCodeRow = customer.code ? byCode.get(customer.code) : undefined;
        // コードが一致しても社名が別なら、別の会社の住所を入れてしまうので採用しない
        if (byCodeRow && normalizeName(byCodeRow.name) === normalizeName(customer.name)) {
            match = byCodeRow;
            how = 'コード一致';
        } else {
            const exact = byName.get(customer.name) ?? [];
            const normalized = byNormalized.get(normalizeName(customer.name)) ?? [];
            const candidates = exact.length > 0 ? exact : normalized;

            if (candidates.length === 1) {
                match = candidates[0];
                how = exact.length > 0 ? '会社名一致' : '会社名一致(正規化)';
            } else if (candidates.length > 1) {
                ambiguous.push(`${label} → 候補 ${candidates.length} 件: ${candidates.map(c => `${c.code} ${c.name}`).join(' / ')}`);
                continue;
            } else if (byCodeRow) {
                ambiguous.push(`${label} → コードは一致するが社名が違う（CSV: ${byCodeRow.code} ${byCodeRow.name}）`);
                continue;
            }
        }

        if (!match) {
            unmatched.push(label);
            continue;
        }

        // 空欄だけを埋める
        const data: { address?: string; postalCode?: string } = {};
        if (isBlank(customer.address) && match.address) data.address = match.address;
        if (isBlank(customer.postalCode) && match.postalCode) data.postalCode = match.postalCode;

        if (Object.keys(data).length === 0) {
            unmatched.push(`${label}（CSV 側も空欄）`);
            continue;
        }

        planned.push({ id: customer.id, label, how, data });
    }

    console.log(`\n--- 補完できる: ${planned.length} 件 ---`);
    for (const p of planned) {
        const parts = [
            p.data.postalCode ? `〒${p.data.postalCode}` : null,
            p.data.address ?? null
        ].filter(Boolean).join(' ');
        console.log(`  [${p.how}] ${p.label} → ${parts}`);
    }

    console.log(`\n--- 一意に決まらない（手作業で確認）: ${ambiguous.length} 件 ---`);
    ambiguous.forEach(line => console.log(`  ${line}`));

    console.log(`\n--- CSV に見つからない: ${unmatched.length} 件 ---`);
    unmatched.forEach(line => console.log(`  ${line}`));

    if (!apply) {
        console.log('\n※ dry-run のため更新していません。実行するには --apply を付けてください。');
        return;
    }

    let updated = 0;
    for (const p of planned) {
        await prisma.customer.update({ where: { id: p.id }, data: p.data });
        updated++;
    }
    console.log(`\n${updated} 件を更新しました。`);
}

main()
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
