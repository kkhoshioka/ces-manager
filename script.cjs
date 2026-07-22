const fs = require('fs');
const path = 'src/pages/Repairs.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Update systemSettings type and initial value
const typeSearch = `    const [systemSettings, setSystemSettings] = useState<{
        defaultLaborRate: number;
        defaultTravelTimeRate: number;
        defaultTravelDistanceRate: number;
    }>({ defaultLaborRate: 8000, defaultTravelTimeRate: 3000, defaultTravelDistanceRate: 50 });`;

const typeReplace = `    const [systemSettings, setSystemSettings] = useState<{
        defaultLaborRate: number;
        defaultTravelTimeRate: number;
        defaultTravelDistanceRate: number;
        defaultBaseTravelFee: number;
    }>({ defaultLaborRate: 8000, defaultTravelTimeRate: 3000, defaultTravelDistanceRate: 50, defaultBaseTravelFee: 0 });`;

code = code.replace(typeSearch, typeReplace);

// 2. Update systemSettings fetch
const fetchSearch = `                setSystemSettings({
                    defaultLaborRate: Number(data.defaultLaborRate) || 8000,
                    defaultTravelTimeRate: Number(data.defaultTravelTimeRate) || 3000,
                    defaultTravelDistanceRate: Number(data.defaultTravelDistanceRate) || 50
                });`;

const fetchReplace = `                setSystemSettings({
                    defaultLaborRate: Number(data.defaultLaborRate) || 8000,
                    defaultTravelTimeRate: Number(data.defaultTravelTimeRate) || 3000,
                    defaultTravelDistanceRate: Number(data.defaultTravelDistanceRate) || 50,
                    defaultBaseTravelFee: Number(data.defaultBaseTravelFee) || 0
                });`;

code = code.replace(fetchSearch, fetchReplace);

// 3. Remove <th>項目</th>
const thSearch = `                                    <th style={{ padding: '0.5rem', textAlign: 'left', width: '25%' }}>移動場所・区間</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'center', width: '15%' }}>項目</th>
                                </>`;
const thReplace = `                                    <th style={{ padding: '0.5rem', textAlign: 'left', width: '40%' }}>移動場所・区間</th>
                                </>`;

code = code.replace(thSearch, thReplace);

// 4. Change unit cost / total cost condition
const costHeaderSearch = `                            {(type !== 'travel' && type !== 'discount') && (
                                <>
                                    <th style={{ padding: '0.5rem', textAlign: 'right', minWidth: '95px', whiteSpace: 'nowrap' }}>原価単価</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'right', minWidth: '95px', whiteSpace: 'nowrap' }}>原価計</th>
                                </>
                            )}`;
const costHeaderReplace = `                            {(type !== 'discount') && (
                                <>
                                    <th style={{ padding: '0.5rem', textAlign: 'right', minWidth: '95px', whiteSpace: 'nowrap' }}>原価単価</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'right', minWidth: '95px', whiteSpace: 'nowrap' }}>原価計</th>
                                </>
                            )}`;

code = code.replace(costHeaderSearch, costHeaderReplace);

const costBodySearch = `                                            {(type !== 'travel' && type !== 'discount') && (
                                                <>
                                                    {/* Unit Cost */}
                                                    <td style={{ padding: '0.25rem' }}>
                                                        <Input
                                                            type="number"
                                                            value={detail.unitCost}
                                                            onChange={(e) => handleDetailChange(detail.originalIndex, 'unitCost', Number(e.target.value))}
                                                            style={{ textAlign: 'right' }}
                                                        />
                                                    </td>
                                                    {/* Total Cost */}
                                                    <td style={{ padding: '0.25rem' }}>
                                                        <Input
                                                            type="text"
                                                            value={Math.round(Number(detail.quantity) * Number(detail.unitCost)).toLocaleString()}
                                                            readOnly
                                                            disabled
                                                            style={{ textAlign: 'right', background: '#f8fafc', color: '#64748b' }}
                                                        />
                                                    </td>
                                                </>
                                            )}`;
const costBodyReplace = `                                            {(type !== 'discount') && (
                                                <>
                                                    {/* Unit Cost */}
                                                    <td style={{ padding: '0.25rem' }}>
                                                        <Input
                                                            type="number"
                                                            value={detail.unitCost}
                                                            onChange={(e) => handleDetailChange(detail.originalIndex, 'unitCost', Number(e.target.value))}
                                                            style={{ textAlign: 'right' }}
                                                        />
                                                    </td>
                                                    {/* Total Cost */}
                                                    <td style={{ padding: '0.25rem' }}>
                                                        <Input
                                                            type="text"
                                                            value={Math.round(Number(detail.quantity) * Number(detail.unitCost)).toLocaleString()}
                                                            readOnly
                                                            disabled
                                                            style={{ textAlign: 'right', background: '#f8fafc', color: '#64748b' }}
                                                        />
                                                    </td>
                                                </>
                                            )}`;

code = code.replace(costBodySearch, costBodyReplace);

// 5. Remove <td>項目</td> for type === travel
const tdSearch = `                                            {/* Fixed Item Label Column */}
                                            <td style={{ padding: '0.25rem', textAlign: 'center' }}>
                                                <span style={{
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 'bold',
                                                    color: '#475569',
                                                }}>
                                                    {detail.travelType === 'area' ? '地区指定' : (detail.travelType === 'time' ? '移動時間' : '移動距離')}
                                                </span>
                                            </td>`;

code = code.replace(tdSearch, "");

// 6. Update onChange and onBlur for travelType === 'area'
const onBlurSearch = `                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const match = travelExpenses.find(t => t.area === val);
                                                                if (match) {
                                                                    handleDetailChange(detail.originalIndex, 'description', val);
                                                                    handleDetailChange(detail.originalIndex, 'unitPrice', match.fee);
                                                                    handleDetailChange(detail.originalIndex, 'amountSales', match.fee * detail.quantity);
                                                                } else {
                                                                    handleDetailChange(detail.originalIndex, 'description', val);
                                                                }
                                                            }}
                                                            onBlur={async (e) => {
                                                                const val = e.target.value;
                                                                if (val && !travelExpenses.find(t => t.area === val)) {
                                                                    if (confirm(\`「\${val}」は出張費マスターに未登録です。マスターに追加しますか？\`)) {
                                                                        try {
                                                                            const res = await fetch(\`\${API_BASE_URL}/travel-expenses\`, {
                                                                                method: 'POST',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({ area: val, fee: detail.unitPrice || 0 })
                                                                            });
                                                                            if (res.ok) {
                                                                                const newExp = await res.json();
                                                                                setTravelExpenses(prev => [...prev, newExp]);
                                                                            }
                                                                        } catch (error) {
                                                                            console.error('Failed to create travel expense', error);
                                                                        }
                                                                    }
                                                                }
                                                            }}`;

const onBlurReplace = `                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const match = travelExpenses.find(t => t.area === val);
                                                                if (match) {
                                                                    handleDetailChange(detail.originalIndex, 'description', val);
                                                                    handleDetailChange(detail.originalIndex, 'unitPrice', match.fee);
                                                                    handleDetailChange(detail.originalIndex, 'amountSales', match.fee * detail.quantity);
                                                                    
                                                                    // Update unitCost as well if they want base cost to equal base fee
                                                                    handleDetailChange(detail.originalIndex, 'unitCost', match.fee);
                                                                } else {
                                                                    handleDetailChange(detail.originalIndex, 'description', val);
                                                                    if (val) {
                                                                        handleDetailChange(detail.originalIndex, 'unitPrice', systemSettings.defaultBaseTravelFee);
                                                                        handleDetailChange(detail.originalIndex, 'amountSales', systemSettings.defaultBaseTravelFee * detail.quantity);
                                                                        handleDetailChange(detail.originalIndex, 'unitCost', systemSettings.defaultBaseTravelFee);
                                                                    }
                                                                }
                                                            }}`;

code = code.replace(onBlurSearch, onBlurReplace);

fs.writeFileSync(path, code, 'utf8');
console.log('Update Repairs.tsx complete');
