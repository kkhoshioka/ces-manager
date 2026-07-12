const fs = require('fs');
const path = 'src/pages/dashboard/SupplierMonthlyReport.tsx';
let data = fs.readFileSync(path, 'utf8');

const startIdx = data.indexOf("<div style={{ backgroundColor: '#f1f5f9', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>");
const endStr = "</div>\r\n                        <div className={styles.modalFooter}";
const endIdx = data.indexOf(endStr);

if (startIdx === -1) { console.log('start not found'); process.exit(1); }
if (endIdx === -1) { console.log('end not found'); process.exit(1); }

const replacement = `<div style={{ backgroundColor: '#f1f5f9', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#334155', margin: 0 }}>明細情報</h4>
                                    {!purchaseForm.id && (
                                        <Button variant="ghost" onClick={addItem} size="sm" icon={<Plus size={16} />}>明細を追加</Button>
                                    )}
                                </div>
                                {purchaseForm.items.map((item, index) => (
                                    <div key={item.id || index} style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem', position: 'relative' }}>
                                        {purchaseForm.items.length > 1 && (
                                            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                                {!purchaseForm.id && (
                                                    <button type="button" onClick={() => copyItem(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '4px' }} title="行をコピー">
                                                        <Copy size={16} />
                                                    </button>
                                                )}
                                                {!purchaseForm.id && (
                                                    <button type="button" onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }} title="削除">
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                            <div className={styles.formGroup}>
                                                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>カテゴリ</label>
                                                <select value={item.category} onChange={e => handleItemChange(index, 'category', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                                    <option value="仕入販売">仕入販売</option>
                                                    <option value="外注費">外注費</option>
                                                    <option value="在庫">在庫</option>
                                                    <option value="その他">その他</option>
                                                </select>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>部門</label>
                                                <select value={item.department} onChange={e => handleItemChange(index, 'department', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                                    <option value="">-</option>
                                                    {Array.from(new Set(categoriesList.map(c => c.section))).map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
                                                </select>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>種別</label>
                                                <select value={item.productCategoryId || ''} onChange={e => {
                                                    const val = e.target.value ? Number(e.target.value) : null;
                                                    const cat = categoriesList.find(c => c.id === val);
                                                    handleItemChange(index, 'productCategoryId', val);
                                                    handleItemChange(index, 'type', cat ? cat.name : '');
                                                }} disabled={!item.department} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                                    <option value="">-</option>
                                                    {categoriesList.filter(c => c.section === item.department).map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                                            <div className={styles.formGroup}>
                                                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>品番</label>
                                                <input type="text" value={item.partNumber} onChange={e => handleItemChange(index, 'partNumber', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>品名・内容</label>
                                                <input type="text" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                            <div className={styles.formGroup}>
                                                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>数量</label>
                                                <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>単価</label>
                                                <input type="number" value={item.unitCost} onChange={e => handleItemChange(index, 'unitCost', Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} />
                                            </div>
                                        </div>
                                        
                                        <div style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', padding: '1rem', borderRadius: '6px' }}>
                                            <h5 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', margin: '0 0 0.75rem 0' }}>プロジェクト・在庫 紐付け</h5>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                                <div className={styles.formGroup}>
                                                    <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>案件に紐付け</label>
                                                    <Select
                                                        options={projectsList.map(p => {
                                                            const contentSnippet = p.notes ? (p.notes.length > 12 ? p.notes.substring(0, 12) + '...' : p.notes) : '-';
                                                            return {
                                                                value: p.id,
                                                                label: \`\${new Date(p.orderDate || p.createdAt).toLocaleDateString()} / \${p.customer?.name} / \${p.machineModel || '不明'} / \${contentSnippet}\`
                                                            };
                                                        })}
                                                        value={item.projectId ? {
                                                            value: item.projectId,
                                                            label: (() => {
                                                                const p = projectsList.find(proj => proj.id === item.projectId);
                                                                if (!p) return \`ID: \${item.projectId}\`;
                                                                const contentSnippet = p.notes ? (p.notes.length > 12 ? p.notes.substring(0, 12) + '...' : p.notes) : '-';
                                                                return \`\${new Date(p.orderDate || p.createdAt).toLocaleDateString()} / \${p.customer?.name} / \${p.machineModel || '不明'} / \${contentSnippet}\`;
                                                            })()
                                                        } : null}
                                                        onChange={(selectedOption) => handleItemChange(index, 'projectId', selectedOption ? selectedOption.value : '')}
                                                        isDisabled={!!item.productId}
                                                        isClearable
                                                        placeholder="キーワードで案件を検索・選択..."
                                                        noOptionsMessage={() => "案件が見つかりません"}
                                                        menuPosition="fixed"
                                                        menuPortalTarget={document.body}
                                                        styles={{
                                                            control: (base) => ({
                                                                ...base,
                                                                borderColor: '#cbd5e1',
                                                                backgroundColor: !!item.productId ? '#f1f5f9' : '#fff',
                                                                minHeight: '38px',
                                                                borderRadius: '4px',
                                                                boxShadow: 'none',
                                                                '&:hover': {
                                                                    borderColor: '#94a3b8'
                                                                }
                                                            }),
                                                            menuPortal: (base) => ({ ...base, zIndex: 9999 })
                                                        }}
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>在庫機材に紐付け (入庫)</label>
                                                    <Select
                                                        options={productsList.map(p => ({
                                                            value: p.id,
                                                            label: \`\${p.name} (在庫: \${p.stockQuantity})\`
                                                        }))}
                                                        value={item.productId ? {
                                                            value: item.productId,
                                                            label: (() => {
                                                                const p = productsList.find(prod => prod.id === item.productId);
                                                                if (!p) return \`ID: \${item.productId}\`;
                                                                return \`\${p.name} (在庫: \${p.stockQuantity})\`;
                                                            })()
                                                        } : null}
                                                        onChange={(selectedOption) => handleItemChange(index, 'productId', selectedOption ? selectedOption.value : '')}
                                                        isDisabled={!!item.projectId}
                                                        isClearable
                                                        placeholder="キーワードで在庫機材を検索・選択..."
                                                        noOptionsMessage={() => "在庫機材が見つかりません"}
                                                        menuPosition="fixed"
                                                        menuPortalTarget={document.body}
                                                        styles={{
                                                            control: (base) => ({
                                                                ...base,
                                                                borderColor: '#cbd5e1',
                                                                backgroundColor: !!item.projectId ? '#f1f5f9' : '#fff',
                                                                minHeight: '38px',
                                                                borderRadius: '4px',
                                                                boxShadow: 'none',
                                                                '&:hover': {
                                                                    borderColor: '#94a3b8'
                                                                }
                                                            }),
                                                            menuPortal: (base) => ({ ...base, zIndex: 9999 })
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {!purchaseForm.id && (
                                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                        <Button variant="ghost" onClick={addItem} icon={<Plus size={16} />}>明細をさらに追加</Button>
                                    </div>
                                )}
                            </div>\r\n`;

data = data.substring(0, startIdx) + replacement + data.substring(endIdx);
fs.writeFileSync(path, data, 'utf8');
console.log('Replaced');
