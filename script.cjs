const fs = require('fs');
const path = 'api/_server/pdfService.ts';
let code = fs.readFileSync(path, 'utf8');

// For invoice and delivery note
const search1 = `                            ...((project.machineModel || project.serialNumber) ? [{ 
                                text: \`機種: \${project.machineModel || (project.serialNumber ? '型式不明' : '')}\${project.serialNumber ? \`\\nS/N : \${project.serialNumber}\` : ''}\`.trim(), 
                                fontSize: 9, 
                                margin: [0, 2, 0, 0] 
                            }] : []),`;

const replace1 = `                            ...((project.machineModel || project.serialNumber || project.hourMeter) ? [{ 
                                text: \`機種: \${project.machineModel || (project.serialNumber || project.hourMeter ? '型式不明' : '')}\${project.serialNumber ? \`\\nS/N : \${project.serialNumber}\` : ''}\${project.hourMeter ? \`\\nアワーメーター: \${project.hourMeter}\` : ''}\`.trim(), 
                                fontSize: 9, 
                                margin: [0, 2, 0, 0] 
                            }] : []),`;

code = code.split(search1).join(replace1);

// For quotation
const search2 = `    const machineInfo = (project.machineModel || project.serialNumber) 
        ? \`機種: \${project.machineModel || (project.serialNumber ? '型式不明' : '')}\${project.serialNumber ? \`\\nS/N : \${project.serialNumber}\` : ''}\`.trim()
        : null;`;

const replace2 = `    const machineInfo = (project.machineModel || project.serialNumber || project.hourMeter) 
        ? \`機種: \${project.machineModel || (project.serialNumber || project.hourMeter ? '型式不明' : '')}\${project.serialNumber ? \`\\nS/N : \${project.serialNumber}\` : ''}\${project.hourMeter ? \`\\nアワーメーター: \${project.hourMeter}\` : ''}\`.trim()
        : null;`;

code = code.split(search2).join(replace2);

fs.writeFileSync(path, code, 'utf8');
console.log('Done modifying pdfService.ts');
