import React from 'react';
import type { CustomerMachine } from '../../types/customer';
import { format } from 'date-fns';

interface PrintableMachineListProps {
    machines: CustomerMachine[];
    printTitle: string;
}

const PrintableMachineList: React.FC<PrintableMachineListProps> = ({ machines, printTitle }) => {
    return (
        <div className="printable-container" style={{ display: 'none' }}>
            <style>
                {`
                @media print {
                    /* Hide everything else */
                    body * {
                        visibility: hidden;
                    }
                    /* Show only printable container */
                    .printable-container, .printable-container * {
                        visibility: visible;
                    }
                    .printable-container {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        color: black;
                        font-family: sans-serif;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 9pt; /* High density */
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 2px 4px; /* Minimal padding for density */
                        word-break: break-all;
                    }
                    th {
                        background-color: #f0f0f0 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        text-align: left;
                        font-weight: bold;
                    }
                    h2 {
                        font-size: 14pt;
                        margin: 0 0 10px 0;
                        text-align: center;
                    }
                    .print-header {
                        display: flex;
                        justify-content: space-between;
                        font-size: 9pt;
                        margin-bottom: 5px;
                    }
                    /* Force page breaks for headers if needed */
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    tr { page-break-inside: avoid; }
                }
                `}
            </style>
            
            <h2>{printTitle || '機材台帳'}</h2>
            <div className="print-header">
                <span>出力日: {format(new Date(), 'yyyy/MM/dd HH:mm')}</span>
                <span>総件数: {machines.length}件</span>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th style={{ width: '15%' }}>顧客名</th>
                        <th style={{ width: '18%' }}>機種名(モデル)</th>
                        <th style={{ width: '15%' }}>シリアルNo</th>
                        <th style={{ width: '12%' }}>アワーメーター</th>
                        <th style={{ width: '12%' }}>次回点検期限</th>
                        <th style={{ width: '28%' }}>備考</th>
                    </tr>
                </thead>
                <tbody>
                    {machines.map((machine, idx) => (
                        <tr key={machine.id || idx}>
                            <td>{machine.customer?.name || ''}</td>
                            <td>{machine.machineModel || ''}</td>
                            <td>{machine.serialNumber || ''}</td>
                            <td>{machine.hourMeter || ''}</td>
                            <td>{machine.nextInspectionDate ? format(new Date(machine.nextInspectionDate), 'yyyy/MM/dd') : ''}</td>
                            <td>{machine.notes || ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PrintableMachineList;
