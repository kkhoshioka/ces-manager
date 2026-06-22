const fs = require('fs');

let code = fs.readFileSync('src/pages/masters/CustomerMaster.tsx', 'utf8');

// Update Customer interface
const oldInterface = `interface Customer {
    id: number;
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    type: string | null;
    fax?: string | null;
    invoiceRegistrationNumber?: string | null;
    invoiceMailingAddress?: string | null;
    paymentTerms?: string | null;
    contactPerson?: string | null;
    closingDate?: string | null;
}`;

const newInterface = `interface CustomerContact {
    id?: number;
    name: string;
    position: string | null;
    mobile: string | null;
}

interface Customer {
    id: number;
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    type: string | null;
    fax?: string | null;
    invoiceRegistrationNumber?: string | null;
    invoiceMailingAddress?: string | null;
    paymentTerms?: string | null;
    contactPerson?: string | null;
    closingDate?: string | null;
    representativeName?: string | null;
    representativePhone?: string | null;
    postalCode?: string | null;
    invoicePostalCode?: string | null;
    contacts?: CustomerContact[];
}`;
code = code.replace(oldInterface, newInterface);

// Update formData type and initial state
const oldState = `    const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
        code: '',
        name: '',
        address: '',
        phone: '',
        email: '',
        type: '',
        fax: '',
        invoiceRegistrationNumber: '',
        invoiceMailingAddress: '',
        paymentTerms: '',
        contactPerson: '',
        closingDate: ''
    });`;

const newState = `    const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
        code: '',
        name: '',
        address: '',
        phone: '',
        email: '',
        type: '',
        fax: '',
        invoiceRegistrationNumber: '',
        invoiceMailingAddress: '',
        paymentTerms: '',
        contactPerson: '',
        closingDate: '',
        representativeName: '',
        representativePhone: '',
        postalCode: '',
        invoicePostalCode: '',
        contacts: []
    });`;
code = code.replace(oldState, newState);

// Update openEdit
const oldOpenEdit = `    const openEdit = (customer: Customer) => {
        setEditingId(customer.id);
        setFormData({
            code: customer.code,
            name: customer.name,
            address: customer.address || '',
            phone: customer.phone || '',
            email: customer.email || '',
            type: customer.type || '',
            fax: customer.fax || '',
            invoiceRegistrationNumber: customer.invoiceRegistrationNumber || '',
            invoiceMailingAddress: customer.invoiceMailingAddress || '',
            paymentTerms: customer.paymentTerms || '',
            contactPerson: customer.contactPerson || '',
            closingDate: customer.closingDate || ''
        });
        setIsModalOpen(true);
    };`;

const newOpenEdit = `    const openEdit = (customer: Customer) => {
        setEditingId(customer.id);
        setFormData({
            code: customer.code,
            name: customer.name,
            address: customer.address || '',
            phone: customer.phone || '',
            email: customer.email || '',
            type: customer.type || '',
            fax: customer.fax || '',
            invoiceRegistrationNumber: customer.invoiceRegistrationNumber || '',
            invoiceMailingAddress: customer.invoiceMailingAddress || '',
            paymentTerms: customer.paymentTerms || '',
            contactPerson: customer.contactPerson || '',
            closingDate: customer.closingDate || '',
            representativeName: customer.representativeName || '',
            representativePhone: customer.representativePhone || '',
            postalCode: customer.postalCode || '',
            invoicePostalCode: customer.invoicePostalCode || '',
            contacts: customer.contacts || []
        });
        setIsModalOpen(true);
    };`;
code = code.replace(oldOpenEdit, newOpenEdit);

// Update openAdd
const oldOpenAdd = `    const openAdd = () => {
        setEditingId(null);
        setFormData({
            code: '',
            name: '',
            address: '',
            phone: '',
            email: '',
            type: '',
            fax: '',
            invoiceRegistrationNumber: '',
            invoiceMailingAddress: '',
            paymentTerms: '',
            contactPerson: '',
            closingDate: ''
        });
        setIsModalOpen(true);
    };`;

const newOpenAdd = `    const openAdd = () => {
        setEditingId(null);
        setFormData({
            code: '',
            name: '',
            address: '',
            phone: '',
            email: '',
            type: '',
            fax: '',
            invoiceRegistrationNumber: '',
            invoiceMailingAddress: '',
            paymentTerms: '',
            contactPerson: '',
            closingDate: '',
            representativeName: '',
            representativePhone: '',
            postalCode: '',
            invoicePostalCode: '',
            contacts: []
        });
        setIsModalOpen(true);
    };`;
code = code.replace(oldOpenAdd, newOpenAdd);

const modalFormStartRegex = /<div className=\{styles\.modal\} style=\{\{ maxWidth: '600px' \}\}>([\s\S]*?)<form onSubmit=\{handleSubmit\} className=\{styles\.form\}>([\s\S]*?)<\/form>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\);\s*\}\s*;\s*export default CustomerMaster;/;

const newFormCode = `
<div className={styles.modal} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className={styles.modalHeader}>
                            <h2>{editingId ? '顧客編集' : '新規顧客登録'}</h2>
                            <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            
                            {/* --- 基本情報 --- */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#334155' }}>基本情報</h3>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="顧客コード"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="顧客名"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="得意先種別"
                                        value={formData.type || ''}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        list="customer-types"
                                        placeholder="例: ユーザー, 修理業者"
                                    />
                                    <datalist id="customer-types">
                                        <option value="ユーザー" />
                                        <option value="修理業者" />
                                        <option value="機械メーカー" />
                                        <option value="レンタル会社" />
                                    </datalist>
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
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#334155' }}>代表者情報</h3>
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

                            {/* --- 請求情報 --- */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#334155' }}>請求情報</h3>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="インボイス登録番号"
                                        value={formData.invoiceRegistrationNumber || ''}
                                        onChange={e => setFormData({ ...formData, invoiceRegistrationNumber: e.target.value })}
                                        placeholder="T+13桁"
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
                                            締め日 (請求書発行用)
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
                                        label="請求書送付先郵便番号"
                                        value={formData.invoicePostalCode || ''}
                                        onChange={e => setFormData({ ...formData, invoicePostalCode: e.target.value })}
                                    />
                                </div>
                                <Input
                                    label="請求書送付先住所（住所と異なる場合）"
                                    value={formData.invoiceMailingAddress || ''}
                                    onChange={e => setFormData({ ...formData, invoiceMailingAddress: e.target.value })}
                                />
                            </div>

                            {/* --- 担当者情報 --- */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
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
                                                        label="携帯電話番号"
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

export default CustomerMaster;`;

code = code.replace(modalFormStartRegex, newFormCode);

fs.writeFileSync('src/pages/masters/CustomerMaster.tsx', code);
console.log("Updated CustomerMaster.tsx");
