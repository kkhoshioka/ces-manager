const fs = require('fs');

let code = fs.readFileSync('src/pages/masters/SupplierMaster.tsx', 'utf8');
code = code.replace(/\r\n/g, '\n');

const interfaceBlock = `interface Supplier {
    id: number;
    name: string;
    code: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    fax?: string;
    invoiceRegistrationNumber?: string;

    bankName?: string;
    branchName?: string;
    accountType?: string;
    accountNumber?: string;
    accountHolder?: string;
    paymentTerms?: string;
    createdAt: string;
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
    code: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    fax?: string;
    invoiceRegistrationNumber?: string;

    bankName?: string;
    branchName?: string;
    accountType?: string;
    accountNumber?: string;
    accountHolder?: string;
    paymentTerms?: string;
    representativeName?: string | null;
    representativePhone?: string | null;
    postalCode?: string | null;
    closingDate?: string | null;
    contacts?: SupplierContact[];
    createdAt: string;
}`;

const modalRegex = /<div className=\{styles\.modal\}>([\s\S]*?)<form onSubmit=\{handleSave\} className=\{styles\.form\} style=\{\{ padding: '1\.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' \}\}>([\s\S]*?)<\/form>\s*<\/div>\s*<\/div >\s*\)\}\s*<\/div >\s*\);\s*\}\s*;\s*export default SupplierMaster;/;

const newFormJSX = `
<div className={styles.modal} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className={styles.modalHeader}>
                            <h2>{currentSupplier.id ? '仕入先編集' : '新規仕入先登録'}</h2>
                            <button type="button" className={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className={styles.form}>
                            
                            {/* --- 基本情報 --- */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#334155', borderBottom: '2px solid #cbd5e1', paddingBottom: '0.5rem' }}>基本情報</h3>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="仕入先コード"
                                        value={currentSupplier.code || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, code: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="仕入先名"
                                        value={currentSupplier.name || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="メールアドレス"
                                        type="email"
                                        value={currentSupplier.email || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, email: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="電話番号 (代表)"
                                        value={currentSupplier.phone || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })}
                                    />
                                    <Input
                                        label="FAX番号"
                                        value={currentSupplier.fax || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, fax: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="郵便番号"
                                        value={currentSupplier.postalCode || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, postalCode: e.target.value })}
                                        placeholder="例: 123-4567"
                                    />
                                </div>
                                <Input
                                    label="住所"
                                    value={currentSupplier.address || ''}
                                    onChange={e => setCurrentSupplier({ ...currentSupplier, address: e.target.value })}
                                />
                            </div>

                            {/* --- 代表者情報 --- */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#334155', borderBottom: '2px solid #cbd5e1', paddingBottom: '0.5rem' }}>代表者情報</h3>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="代表者名"
                                        value={currentSupplier.representativeName || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, representativeName: e.target.value })}
                                    />
                                    <Input
                                        label="代表者電話番号"
                                        value={currentSupplier.representativePhone || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, representativePhone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* --- 支払・口座情報 --- */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#334155', borderBottom: '2px solid #cbd5e1', paddingBottom: '0.5rem' }}>支払・口座情報</h3>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="インボイス登録番号"
                                        value={currentSupplier.invoiceRegistrationNumber || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, invoiceRegistrationNumber: e.target.value })}
                                        placeholder="T+13桁"
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
                                            締め日
                                        </label>
                                        <select
                                            value={currentSupplier.closingDate || ''}
                                            onChange={e => setCurrentSupplier({ ...currentSupplier, closingDate: e.target.value })}
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
                                        value={currentSupplier.paymentTerms || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, paymentTerms: e.target.value })}
                                        placeholder="例: 月末締め翌月末払い"
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="銀行名"
                                        value={currentSupplier.bankName || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, bankName: e.target.value })}
                                    />
                                    <Input
                                        label="支店名"
                                        value={currentSupplier.branchName || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, branchName: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
                                            口座種別
                                        </label>
                                        <select
                                            value={currentSupplier.accountType || ''}
                                            onChange={e => setCurrentSupplier({ ...currentSupplier, accountType: e.target.value })}
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
                                        value={currentSupplier.accountNumber || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, accountNumber: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="口座名義"
                                        value={currentSupplier.accountHolder || ''}
                                        onChange={e => setCurrentSupplier({ ...currentSupplier, accountHolder: e.target.value })}
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
                                        onClick={() => setCurrentSupplier({ ...currentSupplier, contacts: [...(currentSupplier.contacts || []), { name: '', position: '', mobile: '' }] })}
                                        style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                                    >
                                        追加
                                    </Button>
                                </div>
                                
                                {(!currentSupplier.contacts || currentSupplier.contacts.length === 0) ? (
                                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>担当者は登録されていません。</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {currentSupplier.contacts.map((contact, index) => (
                                            <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '6px', backgroundColor: 'white' }}>
                                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                                                    <Input
                                                        label="名前"
                                                        value={contact.name}
                                                        onChange={e => {
                                                            const newContacts = [...currentSupplier.contacts!];
                                                            newContacts[index].name = e.target.value;
                                                            setCurrentSupplier({ ...currentSupplier, contacts: newContacts });
                                                        }}
                                                        required
                                                    />
                                                    <Input
                                                        label="役職"
                                                        value={contact.position || ''}
                                                        onChange={e => {
                                                            const newContacts = [...currentSupplier.contacts!];
                                                            newContacts[index].position = e.target.value;
                                                            setCurrentSupplier({ ...currentSupplier, contacts: newContacts });
                                                        }}
                                                    />
                                                    <Input
                                                        label="電話番号・携帯番号"
                                                        value={contact.mobile || ''}
                                                        onChange={e => {
                                                            const newContacts = [...currentSupplier.contacts!];
                                                            newContacts[index].mobile = e.target.value;
                                                            setCurrentSupplier({ ...currentSupplier, contacts: newContacts });
                                                        }}
                                                    />
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const newContacts = currentSupplier.contacts!.filter((_, i) => i !== index);
                                                        setCurrentSupplier({ ...currentSupplier, contacts: newContacts });
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
                                <Button type="submit" icon={<Save size={16} />}>保存</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierMaster;`;

if (!code.includes(interfaceBlock)) console.log("Missing interface block");
if (!modalRegex.test(code)) console.log("Missing modal regex");

code = code.replace(interfaceBlock, newInterfaceBlock);
code = code.replace(modalRegex, newFormJSX);

fs.writeFileSync('src/pages/masters/SupplierMaster.tsx', code);
console.log("Updated SupplierMaster.tsx");
