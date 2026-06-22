const fs = require('fs');

let code = fs.readFileSync('src/pages/masters/SupplierMaster.tsx', 'utf8');

// Normalize line endings
code = code.replace(/\r\n/g, '\n');

const interfaceBlock = `interface Supplier {
    id: number;
    name: string;
    code: string | null;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    fax?: string | null;
    invoiceRegistrationNumber?: string | null;
    bankName?: string | null;
    branchName?: string | null;
    accountType?: string | null;
    accountNumber?: string | null;
    accountHolder?: string | null;
    paymentTerms?: string | null;
}`;

const newInterfaceBlock = `interface SupplierContact {
    id?: number;
    name: string;
    position: string | null;
    mobile: string | null;
}

interface Supplier {
    id: number;
    name: string;
    code: string | null;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    fax?: string | null;
    invoiceRegistrationNumber?: string | null;
    bankName?: string | null;
    branchName?: string | null;
    accountType?: string | null;
    accountNumber?: string | null;
    accountHolder?: string | null;
    paymentTerms?: string | null;
    representativeName?: string | null;
    representativePhone?: string | null;
    postalCode?: string | null;
    closingDate?: string | null;
    contacts?: SupplierContact[];
}`;

const formDataBlock = `    const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
        name: '',
        code: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        fax: '',
        invoiceRegistrationNumber: '',
        bankName: '',
        branchName: '',
        accountType: '',
        accountNumber: '',
        accountHolder: '',
        paymentTerms: ''
    });`;

const newFormDataBlock = `    const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
        name: '',
        code: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        fax: '',
        invoiceRegistrationNumber: '',
        bankName: '',
        branchName: '',
        accountType: '',
        accountNumber: '',
        accountHolder: '',
        paymentTerms: '',
        representativeName: '',
        representativePhone: '',
        postalCode: '',
        closingDate: '',
        contacts: []
    });`;

const openEditBlock = `    const openEdit = (supplier: Supplier) => {
        setEditingId(supplier.id);
        setFormData({
            name: supplier.name,
            code: supplier.code || '',
            contactPerson: supplier.contactPerson || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            fax: supplier.fax || '',
            invoiceRegistrationNumber: supplier.invoiceRegistrationNumber || '',
            bankName: supplier.bankName || '',
            branchName: supplier.branchName || '',
            accountType: supplier.accountType || '',
            accountNumber: supplier.accountNumber || '',
            accountHolder: supplier.accountHolder || '',
            paymentTerms: supplier.paymentTerms || ''
        });
        setIsModalOpen(true);
    };`;

const newOpenEditBlock = `    const openEdit = (supplier: Supplier) => {
        setEditingId(supplier.id);
        setFormData({
            name: supplier.name,
            code: supplier.code || '',
            contactPerson: supplier.contactPerson || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            fax: supplier.fax || '',
            invoiceRegistrationNumber: supplier.invoiceRegistrationNumber || '',
            bankName: supplier.bankName || '',
            branchName: supplier.branchName || '',
            accountType: supplier.accountType || '',
            accountNumber: supplier.accountNumber || '',
            accountHolder: supplier.accountHolder || '',
            paymentTerms: supplier.paymentTerms || '',
            representativeName: supplier.representativeName || '',
            representativePhone: supplier.representativePhone || '',
            postalCode: supplier.postalCode || '',
            closingDate: supplier.closingDate || '',
            contacts: supplier.contacts || []
        });
        setIsModalOpen(true);
    };`;

const openAddBlock = `    const openAdd = () => {
        setEditingId(null);
        setFormData({
            name: '',
            code: '',
            contactPerson: '',
            email: '',
            phone: '',
            address: '',
            fax: '',
            invoiceRegistrationNumber: '',
            bankName: '',
            branchName: '',
            accountType: '',
            accountNumber: '',
            accountHolder: '',
            paymentTerms: ''
        });
        setIsModalOpen(true);
    };`;

const newOpenAddBlock = `    const openAdd = () => {
        setEditingId(null);
        setFormData({
            name: '',
            code: '',
            contactPerson: '',
            email: '',
            phone: '',
            address: '',
            fax: '',
            invoiceRegistrationNumber: '',
            bankName: '',
            branchName: '',
            accountType: '',
            accountNumber: '',
            accountHolder: '',
            paymentTerms: '',
            representativeName: '',
            representativePhone: '',
            postalCode: '',
            closingDate: '',
            contacts: []
        });
        setIsModalOpen(true);
    };`;

const modalRegex = /<div className=\{styles\.modal\} style=\{\{ maxWidth: '600px' \}\}>([\s\S]*?)<form onSubmit=\{handleSubmit\} className=\{styles\.form\}>([\s\S]*?)<\/form>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\);\s*\}\s*;\s*export default SupplierMaster;/;

const newFormJSX = `
<div className={styles.modal} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className={styles.modalHeader}>
                            <h2>{editingId ? '仕入先編集' : '新規仕入先登録'}</h2>
                            <button type="button" className={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            
                            {/* --- 基本情報 --- */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#334155', borderBottom: '2px solid #cbd5e1', paddingBottom: '0.5rem' }}>基本情報</h3>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="仕入先コード"
                                        value={formData.code || ''}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="仕入先名"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="メールアドレス"
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="電話番号 (代表)"
                                        value={formData.phone || ''}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                    <Input
                                        label="FAX番号"
                                        value={formData.fax || ''}
                                        onChange={e => setFormData({ ...formData, fax: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="郵便番号"
                                        value={formData.postalCode || ''}
                                        onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                                        placeholder="例: 123-4567"
                                    />
                                </div>
                                <Input
                                    label="住所"
                                    value={formData.address || ''}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            {/* --- 代表者情報 --- */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#334155', borderBottom: '2px solid #cbd5e1', paddingBottom: '0.5rem' }}>代表者情報</h3>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="代表者名"
                                        value={formData.representativeName || ''}
                                        onChange={e => setFormData({ ...formData, representativeName: e.target.value })}
                                    />
                                    <Input
                                        label="代表者電話番号"
                                        value={formData.representativePhone || ''}
                                        onChange={e => setFormData({ ...formData, representativePhone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* --- 支払・口座情報 --- */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#334155', borderBottom: '2px solid #cbd5e1', paddingBottom: '0.5rem' }}>支払・口座情報</h3>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="インボイス登録番号"
                                        value={formData.invoiceRegistrationNumber || ''}
                                        onChange={e => setFormData({ ...formData, invoiceRegistrationNumber: e.target.value })}
                                        placeholder="T+13桁"
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
                                            締め日
                                        </label>
                                        <select
                                            value={formData.closingDate || ''}
                                            onChange={e => setFormData({ ...formData, closingDate: e.target.value })}
                                            style={{
                                                padding: '0.625rem',
                                                borderRadius: '0.375rem',
                                                border: '1px solid #d1d5db',
                                                fontSize: '0.9375rem',
                                                width: '100%',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <option value="">(未設定)</option>
                                            <option value="5">5日</option>
                                            <option value="10">10日</option>
                                            <option value="15">15日</option>
                                            <option value="20">20日</option>
                                            <option value="25">25日</option>
                                            <option value="99">末日</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="支払条件"
                                        value={formData.paymentTerms || ''}
                                        onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                                        placeholder="例: 月末締め翌月末払い"
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="銀行名"
                                        value={formData.bankName || ''}
                                        onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                    />
                                    <Input
                                        label="支店名"
                                        value={formData.branchName || ''}
                                        onChange={e => setFormData({ ...formData, branchName: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
                                            口座種別
                                        </label>
                                        <select
                                            value={formData.accountType || ''}
                                            onChange={e => setFormData({ ...formData, accountType: e.target.value })}
                                            style={{
                                                padding: '0.625rem',
                                                borderRadius: '0.375rem',
                                                border: '1px solid #d1d5db',
                                                fontSize: '0.9375rem',
                                                width: '100%',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <option value="">(未設定)</option>
                                            <option value="普通">普通</option>
                                            <option value="当座">当座</option>
                                        </select>
                                    </div>
                                    <Input
                                        label="口座番号"
                                        value={formData.accountNumber || ''}
                                        onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="口座名義"
                                        value={formData.accountHolder || ''}
                                        onChange={e => setFormData({ ...formData, accountHolder: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* --- 担当者情報 --- */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #cbd5e1', paddingBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', margin: 0 }}>担当者情報</h3>
                                    <Button 
                                        type="button" 
                                        variant="secondary" 
                                        icon={<Plus size={16} />}
                                        onClick={() => setFormData({ ...formData, contacts: [...(formData.contacts || []), { name: '', position: '', mobile: '' }] })}
                                        style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                                    >
                                        追加
                                    </Button>
                                </div>
                                
                                {(!formData.contacts || formData.contacts.length === 0) ? (
                                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>担当者は登録されていません。</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {formData.contacts.map((contact, index) => (
                                            <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '6px', backgroundColor: 'white' }}>
                                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                                                    <Input
                                                        label="名前"
                                                        value={contact.name}
                                                        onChange={e => {
                                                            const newContacts = [...formData.contacts!];
                                                            newContacts[index].name = e.target.value;
                                                            setFormData({ ...formData, contacts: newContacts });
                                                        }}
                                                        required
                                                    />
                                                    <Input
                                                        label="役職"
                                                        value={contact.position || ''}
                                                        onChange={e => {
                                                            const newContacts = [...formData.contacts!];
                                                            newContacts[index].position = e.target.value;
                                                            setFormData({ ...formData, contacts: newContacts });
                                                        }}
                                                    />
                                                    <Input
                                                        label="電話番号・携帯番号"
                                                        value={contact.mobile || ''}
                                                        onChange={e => {
                                                            const newContacts = [...formData.contacts!];
                                                            newContacts[index].mobile = e.target.value;
                                                            setFormData({ ...formData, contacts: newContacts });
                                                        }}
                                                    />
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const newContacts = formData.contacts!.filter((_, i) => i !== index);
                                                        setFormData({ ...formData, contacts: newContacts });
                                                    }}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', marginTop: '1.5rem' }}
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className={styles.formActions}>
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                    キャンセル
                                </Button>
                                <Button type="submit">保存</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierMaster;`;

if (!code.includes(interfaceBlock)) console.log("Missing interfaceBlock");
if (!code.includes(formDataBlock)) console.log("Missing formDataBlock");
if (!code.includes(openEditBlock)) console.log("Missing openEditBlock");
if (!code.includes(openAddBlock)) console.log("Missing openAddBlock");
if (!modalRegex.test(code)) console.log("Missing modal");

code = code.replace(interfaceBlock, newInterfaceBlock);
code = code.replace(formDataBlock, newFormDataBlock);
code = code.replace(openEditBlock, newOpenEditBlock);
code = code.replace(openAddBlock, newOpenAddBlock);
code = code.replace(modalRegex, newFormJSX);

fs.writeFileSync('src/pages/masters/SupplierMaster.tsx', code);
console.log("Updated SupplierMaster.tsx");
