/**
 * 2026年9月のお客様要望に伴う、データの整理。
 *
 * 1. 商品種別マスターの部門「部品・他」を「部品販売」に改称する
 *    （過去の明細もこの部門を参照しているため、集計表示がまとめて変わります）
 * 2. 部門「アタッチメント販売」「部品販売」が無ければ用意する
 * 3. 案件タイプ「整備案件(maintenance)」を「修理案件(repair)」に変換する
 *    （月例点検は修理案件と同じ扱いにするため）
 *
 * 既定は dry-run。件数だけ出して何も書き換えません。
 * 実際に更新するときだけ --apply を付けてください。
 *
 *   DATABASE_URL=... npx tsx scripts/apply_2026_09_customer_requests.ts
 *   DATABASE_URL=... npx tsx scripts/apply_2026_09_customer_requests.ts --apply
 */
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');

const OLD_SECTION = '部品・他';
const NEW_SECTION = '部品販売';
const REQUIRED_SECTIONS = ['アタッチメント販売', NEW_SECTION];

const log = (...args: unknown[]) => console.log(...args);

async function renamePartsSection() {
    log('\n── 1. 部門「部品・他」→「部品販売」 ─────────────');

    const oldOnes = await prisma.productCategory.findMany({ where: { section: OLD_SECTION } });
    if (oldOnes.length === 0) {
        log('  「部品・他」の種別はありません（改称済みか、もともと未使用）。');
        return;
    }

    log(`  対象の種別: ${oldOnes.length}件`);
    oldOnes.forEach(c => log(`    - ${c.code || '(コード無し)'} ${c.name}`));

    if (!APPLY) return;

    const result = await prisma.productCategory.updateMany({
        where: { section: OLD_SECTION },
        data: { section: NEW_SECTION }
    });
    log(`  → ${result.count}件を「${NEW_SECTION}」に改称しました。`);
}

async function ensureSections() {
    log('\n── 2. 部門「アタッチメント販売」「部品販売」の用意 ─────────────');

    for (const section of REQUIRED_SECTIONS) {
        const existing = await prisma.productCategory.count({ where: { section } });
        if (existing > 0) {
            log(`  「${section}」は既に${existing}件あります。`);
            continue;
        }

        log(`  「${section}」がありません。見出し用の種別を1件作ります。`);
        if (!APPLY) continue;

        // コードは他の部門と重複しない連番にする
        const prefix = section.includes('アタッチメント') ? 'A' : 'P';
        const sameprefix = await prisma.productCategory.findMany({
            where: { code: { startsWith: `${prefix}-` } },
            select: { code: true }
        });
        const numbers = sameprefix
            .map(c => Number(c.code?.match(/\d+$/)?.[0] ?? 0))
            .filter(n => !isNaN(n));
        const next = Math.max(0, ...numbers) + 1;

        await prisma.productCategory.create({
            data: {
                section,
                code: `${prefix}-${String(next).padStart(2, '0')}`,
                name: section.replace('販売', ''),
                sortOrder: 999
            }
        });
        log(`  → 「${section}」を作成しました。`);
    }
}

async function convertMaintenanceProjects() {
    log('\n── 3. 案件タイプ「整備案件」→「修理案件」 ─────────────');

    const targets = await prisma.project.findMany({
        where: { type: 'maintenance' },
        select: { id: true, projectNo: true, customer: { select: { name: true } } },
        orderBy: { id: 'asc' }
    });

    if (targets.length === 0) {
        log('  整備案件はありません。');
        return;
    }

    log(`  対象の案件: ${targets.length}件`);
    targets.slice(0, 30).forEach(p => log(`    - #${p.id} ${p.projectNo || '(No.無し)'} ${p.customer?.name || ''}`));
    if (targets.length > 30) log(`    ... ほか ${targets.length - 30}件`);

    if (!APPLY) return;

    const result = await prisma.project.updateMany({
        where: { type: 'maintenance' },
        data: { type: 'repair' }
    });
    log(`  → ${result.count}件を修理案件に変換しました。`);
}

async function main() {
    log(APPLY ? '=== 実行モード（データを更新します） ===' : '=== 確認モード（dry-run。何も更新しません） ===');

    await renamePartsSection();
    await ensureSections();
    await convertMaintenanceProjects();

    log(APPLY ? '\n完了しました。' : '\n確認のみ終了。実行する場合は --apply を付けてください。');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
