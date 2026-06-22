const fs = require('fs');

let code = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

// 1. Move rental details into the main formGrid.
// It is originally located at:
//                                     </div>
//                                     
//                                     {/* Rental Details */}
//                                     {formType === 'rental' && (
//                                         <div className={styles.formGrid} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '0.5rem', border: '1px solid #a7f3d0' }}>
//                                             <Input
//                                                 ...

const searchBlock1 = `                                                    <span style={{ paddingTop: '1.5rem', fontWeight: 500, color: '#4b5563' }}>hr</span>
                                                </div>
                                            </>
                                        )}

                                    </div>
                                    
                                    {/* Rental Details */}
                                    {formType === 'rental' && (
                                        <div className={styles.formGrid} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '0.5rem', border: '1px solid #a7f3d0' }}>
                                            <Input
                                                label="貸出日"
                                                type="date"
                                                name="rentalStartDate"
                                                value={formState.rentalStartDate}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            <Input
                                                label="返却予定日"
                                                type="date"
                                                name="rentalEndDate"
                                                value={formState.rentalEndDate}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            <Input
                                                label="実際の返却日"
                                                type="date"
                                                name="actualReturnDate"
                                                value={formState.actualReturnDate}
                                                onChange={handleInputChange}
                                            />
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">レンタルステータス</label>
                                                <select
                                                    name="rentalStatus"
                                                    value={formState.rentalStatus}
                                                    onChange={handleInputChange}
                                                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                                >
                                                    <option value="reserved">予約中</option>
                                                    <option value="rented_out">貸出中</option>
                                                    <option value="returned">返却済</option>
                                                    <option value="cancelled">キャンセル</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    <div className={styles.summaryStats}>`;

const replaceBlock1 = `                                                    <span style={{ paddingTop: '1.5rem', fontWeight: 500, color: '#4b5563' }}>hr</span>
                                                </div>
                                            </>
                                        )}

                                        {formType === 'rental' && (
                                            <>
                                                <Input
                                                    label="貸出日"
                                                    type="date"
                                                    name="rentalStartDate"
                                                    value={formState.rentalStartDate}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                                <Input
                                                    label="返却予定日"
                                                    type="date"
                                                    name="rentalEndDate"
                                                    value={formState.rentalEndDate}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                                <Input
                                                    label="実際の返却日"
                                                    type="date"
                                                    name="actualReturnDate"
                                                    value={formState.actualReturnDate}
                                                    onChange={handleInputChange}
                                                />
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">レンタルステータス</label>
                                                    <select
                                                        name="rentalStatus"
                                                        value={formState.rentalStatus}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                                    >
                                                        <option value="reserved">予約中</option>
                                                        <option value="rented_out">貸出中</option>
                                                        <option value="returned">返却済</option>
                                                        <option value="cancelled">キャンセル</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    
                                    <div className={styles.summaryStats}>`;

code = code.replace(searchBlock1, replaceBlock1);

const searchBlock2 = `<div className={styles.summaryStats}>
                                        <div style={{ textAlign: 'right', fontSize: '1.05rem', color: '#64748b' }}>
                                            <div>自社工賃: {totals.categoryTotals.labor.sales.toLocaleString()}</div>
                                            <div>自社出張費: {totals.categoryTotals.travel.sales.toLocaleString()}</div>
                                            <div>部品・商品: {totals.categoryTotals.part.sales.toLocaleString()}</div>
                                            <div>外注費: {totals.categoryTotals.outsourcing.sales.toLocaleString()}</div>
                                        </div>`;

const replaceBlock2 = `<div className={styles.summaryStats}>
                                        <div style={{ textAlign: 'right', fontSize: '1.05rem', color: '#64748b' }}>
                                            {formType === 'rental' ? (
                                                <>
                                                    <div>自社在庫レンタル: {totals.categoryTotals.part.sales.toLocaleString()}</div>
                                                    <div>他社Wレンタル: {totals.categoryTotals.outsourcing.sales.toLocaleString()}</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div>自社工賃: {totals.categoryTotals.labor.sales.toLocaleString()}</div>
                                                    <div>自社出張費: {totals.categoryTotals.travel.sales.toLocaleString()}</div>
                                                    <div>部品・商品: {totals.categoryTotals.part.sales.toLocaleString()}</div>
                                                    <div>外注費: {totals.categoryTotals.outsourcing.sales.toLocaleString()}</div>
                                                </>
                                            )}
                                        </div>`;

code = code.replace(searchBlock2, replaceBlock2);

fs.writeFileSync('src/pages/Repairs.tsx', code);
console.log("Updated rental UI successfully.");
