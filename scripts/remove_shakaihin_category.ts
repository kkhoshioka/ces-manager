/**
 * 「機械部品」部門の種別「社外品」を削除する。
 *
 * 部門・種別は ProductCategory テーブルのデータなので、コードではなく DB を直接直す必要がある。
 * 既定は dry-run（対象と参照件数を表示するだけ）。実際に削除するときだけ --apply を付ける。
 *
 *   DATABASE_URL=... npx tsx scripts/remove_shakaihin_category.ts
 *   DATABASE_URL=... npx tsx scripts/remove_shakaihin_category.ts --apply
 */
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const TARGET_SECTION = '機械部品';
const TARGET_NAME = '社外品';

async function main() {
    const apply = process.argv.includes('--apply');
    console.log(`[${apply ? 'APPLY' : 'DRY-RUN'}] 「${TARGET_SECTION}」部門の種別「${TARGET_NAME}」を削除します`);

    const targets = await prisma.productCategory.findMany({
        where: { section: TARGET_SECTION, name: TARGET_NAME }
    });

    if (targets.length === 0) {
        console.log('対象の種別は見つかりませんでした。すでに削除済みの可能性があります。');
        return;
    }

    let blocked = false;

    for (const category of targets) {
        const [detailCount, productCount, machineCount] = await Promise.all([
            prisma.projectDetail.count({ where: { productCategoryId: category.id } }),
            prisma.product.count({ where: { categoryId: category.id } }),
            prisma.customerMachine.count({ where: { productCategoryId: category.id } })
        ]);

        console.log(
            `\n対象: id=${category.id} code=${category.code ?? '-'} ${category.section} / ${category.name}\n` +
            `  参照: 案件明細 ${detailCount} 件 / 商品 ${productCount} 件 / 顧客機材 ${machineCount} 件`
        );

        if (detailCount + productCount + machineCount > 0) {
            blocked = true;
            console.log('  → 使用中のため削除しません。先に該当データの種別を付け替えてください。');

            const details = await prisma.projectDetail.findMany({
                where: { productCategoryId: category.id },
                select: { id: true, projectId: true, description: true },
                take: 50
            });
            for (const d of details) {
                console.log(`     案件明細 id=${d.id} project=${d.projectId} ${d.description}`);
            }
            if (detailCount > details.length) {
                console.log(`     ... ほか ${detailCount - details.length} 件`);
            }
            continue;
        }

        if (!apply) {
            console.log('  → 削除できます（--apply を付けると実行します）');
            continue;
        }

        await prisma.productCategory.delete({ where: { id: category.id } });
        console.log('  → 削除しました');
    }

    if (blocked) {
        console.log('\n使用中の種別があるため、一部を削除していません。');
        process.exitCode = 1;
    }
}

main()
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
