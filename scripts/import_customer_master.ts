/**
 * 「顧客マスターリスト.csv」（Excel の得意先リストを変換したもの）を得意先マスターに取り込む。
 *
 * ・マスターに無い会社は新規登録する
 * ・登録済みの会社は「空欄だけ」を CSV の値で補完する（既に入っている値は絶対に上書きしない）
 * ・照合は コード完全一致 → 会社名完全一致 → 会社名を正規化して一致 の順
 * ・同名が複数ある等で一意に決まらないものは自動適用せず、一覧に出して人が判断する
 *
 * 既定は dry-run。実際に書き込むときだけ --apply を付ける。
 *
 *   DATABASE_URL=... npx tsx scripts/import_customer_master.ts
 *   DATABASE_URL=... npx tsx scripts/import_customer_master.ts --apply
 *
 * --with-type を付けると、得意先種別が空の会社に区分（E/D/G/O/Z）由来の種別も入れる。
 */
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const prisma = new PrismaClient();

const CSV_FILE = process.env.CUSTOMER_CSV ?? '顧客マスターリスト.csv';

/** 区分（Excel のシート名）→ 得意先種別。--with-type のときだけ使う */
const TYPE_BY_SECTION: Record<string, string> = {
    E: 'ユーザー',
    D: 'ディーラー',
    G: '商社・貿易',
    O: 'リース・保険',
    Z: ''
};

/** 表記ゆれを吸収して会社名を突き合わせるためのキー */
const normalizeName = (name: string): string =>
    (name || '')
        .replace(/[\s　]/g, '')
        .replace(/[（）()]/g, '')
        .replace(/株式会社|有限会社|合同会社/g, '')
        .replace(/[㈱㈲]/g, '')
        .toLowerCase();

const isBlank = (value: string | null | undefined): boolean => !value || value.trim() === '';

interface CsvRow {
    code: string;
    section: string;
    /** 顧客名（営業所があれば「会社名 営業所」） */
    name: string;
    companyName: string;
    office: string;
    postalCode: string;
    address: string;
    position: string;
    personName: string;
    phone: string;
    fax: string;
    mobile: string;
    email: string;
    paymentTerms: string;
    invoiceRegistrationNumber: string;
    note: string;
}

/** 得意先に入れられる項目（担当者は CustomerContact 側で扱う） */
type CustomerFields = {
    code?: string;
    name?: string;
    type?: string;
    postalCode?: string;
    address?: string;
    phone?: string;
    fax?: string;
    email?: string;
    representativeName?: string;
    representativePhone?: string;
    contactPerson?: string;
    paymentTerms?: string;
    invoiceRegistrationNumber?: string;
};

/** 「代表者」欄は代表者、それ以外（担当者・所長など）は担当者として扱う */
const isRepresentative = (row: CsvRow): boolean => row.position === '' || row.position === '代表者';

const fieldsFromRow = (row: CsvRow, withType: boolean): CustomerFields => {
    const fields: CustomerFields = {
        postalCode: row.postalCode,
        address: row.address,
        phone: row.phone,
        fax: row.fax,
        email: row.email,
        paymentTerms: row.paymentTerms,
        invoiceRegistrationNumber: row.invoiceRegistrationNumber
    };

    if (isRepresentative(row)) {
        fields.representativeName = row.personName;
        fields.representativePhone = row.mobile;
    } else {
        fields.contactPerson = row.personName;
    }

    if (withType) fields.type = TYPE_BY_SECTION[row.section] ?? '';

    return fields;
};

/** 担当者（代表者以外）を CustomerContact として登録するか */
const contactFromRow = (row: CsvRow) => {
    if (isRepresentative(row)) return null;
    if (isBlank(row.personName)) return null;
    return {
        name: row.personName,
        position: row.position || null,
        mobile: row.mobile || null
    };
};

async function main() {
    const apply = process.argv.includes('--apply');
    const withType = process.argv.includes('--with-type');
    const csvPath = path.resolve(process.cwd(), CSV_FILE);

    if (!fs.existsSync(csvPath)) {
        console.error(`CSV が見つかりません: ${csvPath}`);
        process.exitCode = 1;
        return;
    }

    console.log(`[${apply ? 'APPLY' : 'DRY-RUN'}] ${CSV_FILE} を得意先マスターに取り込みます`);

    const records = parse(fs.readFileSync(csvPath), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as Record<string, any>[];

    const str = (value: unknown): string => String(value ?? '').trim();

    const rows: CsvRow[] = records
        .map(r => {
            const companyName = str(r['顧客名']);
            const office = str(r['営業所']);
            return {
                code: str(r['コード']),
                section: str(r['区分']),
                name: office ? `${companyName} ${office}` : companyName,
                companyName,
                office,
                postalCode: str(r['〒']),
                address: str(r['住所']),
                position: str(r['役職']),
                personName: str(r['担当者名']),
                phone: str(r['TEL']),
                fax: str(r['FAX']),
                mobile: str(r['携帯']),
                email: str(r['E-mail']),
                paymentTerms: str(r['支払条件']),
                invoiceRegistrationNumber: str(r['インボイス登録番号']),
                note: str(r['備考'])
            };
        })
        .filter(r => r.companyName);

    console.log(`CSV: ${rows.length} 件`);

    const customers = await prisma.customer.findMany({
        select: {
            id: true, code: true, name: true, type: true, postalCode: true, address: true,
            phone: true, fax: true, email: true, representativeName: true, representativePhone: true,
            contactPerson: true, paymentTerms: true, invoiceRegistrationNumber: true,
            contacts: { select: { id: true } }
        }
    });
    console.log(`得意先マスター: ${customers.length} 件`);

    type Customer = (typeof customers)[number];

    const byCode = new Map<string, Customer>();
    const byName = new Map<string, Customer[]>();
    const byNormalized = new Map<string, Customer[]>();
    for (const c of customers) {
        if (c.code) byCode.set(c.code, c);
        byName.set(c.name, [...(byName.get(c.name) ?? []), c]);
        const key = normalizeName(c.name);
        byNormalized.set(key, [...(byNormalized.get(key) ?? []), c]);
    }

    const creates: { row: CsvRow; fields: CustomerFields; note?: string }[] = [];
    const updates: { id: number; label: string; how: string; row: CsvRow; data: CustomerFields }[] = [];
    const unchanged: string[] = [];
    const ambiguous: string[] = [];
    const usedCustomerIds = new Map<number, string>();

    for (const row of rows) {
        const label = `${row.code} ${row.name}`;

        let match: Customer | undefined;
        let how = '';

        const codeMatch = row.code ? byCode.get(row.code) : undefined;
        // コードが一致しても社名が別なら、別の会社の情報を書き込んでしまうので採用しない
        const codeMatchIsSameCompany = codeMatch
            && (normalizeName(codeMatch.name) === normalizeName(row.name)
                || normalizeName(codeMatch.name) === normalizeName(row.companyName));

        if (codeMatch && codeMatchIsSameCompany) {
            match = codeMatch;
            how = 'コード一致';
        } else if (codeMatch) {
            ambiguous.push(`${label} → コード ${row.code} は既に別名の「${codeMatch.name}」が使用中`);
            continue;
        } else {
            const exact = byName.get(row.name) ?? [];
            const normalized = byNormalized.get(normalizeName(row.name)) ?? [];
            const candidates = exact.length > 0 ? exact : normalized;

            if (candidates.length === 1) {
                match = candidates[0];
                how = exact.length > 0 ? '会社名一致' : '会社名一致(正規化)';
            } else if (candidates.length > 1) {
                ambiguous.push(`${label} → 候補 ${candidates.length} 件: ${candidates.map(c => `${c.code} ${c.name}`).join(' / ')}`);
                continue;
            }
        }

        if (!match) {
            // 営業所付きの行は、本社名だけで登録済みのことがあるので気付けるようにしておく
            const sameCompany = row.office
                ? (byNormalized.get(normalizeName(row.companyName)) ?? [])
                : [];
            const note = sameCompany.length > 0
                ? `本社名で登録済み: ${sameCompany.map(c => `${c.code} ${c.name}`).join(' / ')}`
                : undefined;
            creates.push({ row, fields: fieldsFromRow(row, withType), note });
            continue;
        }

        const usedBy = usedCustomerIds.get(match.id);
        if (usedBy) {
            ambiguous.push(`${label} → 「${match.code} ${match.name}」は ${usedBy} と同じ得意先に一致（営業所ごとの登録が必要か要確認）`);
            continue;
        }
        usedCustomerIds.set(match.id, label);

        // 空欄だけを埋める
        const candidate = fieldsFromRow(row, withType);
        const data: CustomerFields = {};
        for (const [key, value] of Object.entries(candidate) as [keyof CustomerFields, string | undefined][]) {
            if (isBlank(value)) continue;
            if (!isBlank(match[key as keyof Customer] as string | null)) continue;
            data[key] = value;
        }

        const contact = contactFromRow(row);
        const needsContact = contact !== null && match.contacts.length === 0;

        if (Object.keys(data).length === 0 && !needsContact) {
            unchanged.push(`${label}（補完する項目なし）`);
            continue;
        }

        updates.push({ id: match.id, label: `${match.code} ${match.name}`, how, row, data });
    }

    console.log(`\n--- 新規登録: ${creates.length} 件 ---`);
    for (const c of creates) {
        console.log(`  ${c.row.code} ${c.row.name}${c.row.address ? ` / ${c.row.address}` : ''}${c.note ? `  ※${c.note}` : ''}`);
    }

    console.log(`\n--- 空欄を補完: ${updates.length} 件 ---`);
    for (const u of updates) {
        const filled = Object.entries(u.data).map(([k, v]) => `${k}=${v}`).join(', ');
        const contact = contactFromRow(u.row);
        const extra = contact ? ` +担当者(${contact.name})` : '';
        console.log(`  [${u.how}] ${u.label} → ${filled}${extra}`);
    }

    console.log(`\n--- 一意に決まらない（手作業で確認）: ${ambiguous.length} 件 ---`);
    ambiguous.forEach(line => console.log(`  ${line}`));

    console.log(`\n--- 変更なし: ${unchanged.length} 件 ---`);

    const notes = rows.filter(r => r.note);
    if (notes.length > 0) {
        console.log(`\n--- CSV の備考欄（自動では取り込まない）: ${notes.length} 件 ---`);
        notes.forEach(r => console.log(`  ${r.code} ${r.name}: ${r.note}`));
    }

    if (!apply) {
        console.log('\n※ dry-run のため書き込んでいません。実行するには --apply を付けてください。');
        return;
    }

    let created = 0;
    for (const c of creates) {
        const contact = contactFromRow(c.row);
        const data: Record<string, unknown> = { code: c.row.code, name: c.row.name };
        for (const [key, value] of Object.entries(c.fields)) {
            if (!isBlank(value)) data[key] = value;
        }
        if (contact) data.contacts = { create: [contact] };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prisma.customer.create({ data: data as any });
        created++;
    }

    let updated = 0;
    for (const u of updates) {
        const contact = contactFromRow(u.row);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = { ...u.data };
        if (contact) {
            const current = await prisma.customerContact.count({ where: { customerId: u.id } });
            if (current === 0) data.contacts = { create: [contact] };
        }
        await prisma.customer.update({ where: { id: u.id }, data });
        updated++;
    }

    console.log(`\n新規登録 ${created} 件 / 補完 ${updated} 件 を反映しました。`);
}

main()
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
