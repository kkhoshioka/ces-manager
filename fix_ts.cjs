const fs = require('fs');
let f = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

// 1. Revert types for categories, suppliers, travelExpenses
f = f.replace(
    'const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);\n    const [suppliers, setSuppliers] = useState<{ id: number, name: string }[]>([]);\n    const [inventoryParts, setInventoryParts] = useState<Part[]>([]);\n    const [travelExpenses, setTravelExpenses] = useState<{ name: string, standardPrice: number }[]>([]);',
    'const [categories, setCategories] = useState<ProductCategory[]>([]);\n    const [suppliers, setSuppliers] = useState<Supplier[]>([]);\n    const [inventoryParts, setInventoryParts] = useState<Part[]>([]);\n    const [travelExpenses, setTravelExpenses] = useState<any[]>([]);'
);

// 2. Add internalRep to the resets
f = f.replace(
    /customerContactName: '',\s*machineModel: '',/g,
    "customerContactName: '',\n            internalRep: '',\n            machineModel: '',"
);

// Look for the snapshot assignment in loadProjectToForm
// It's around line 1132
f = f.replace(
    /customerContactName: project\.customerContactName \|\| '',\s*machineModel:/g,
    "customerContactName: project.customerContactName || '',\n                internalRep: project.internalRep || '',\n                machineModel:"
);

fs.writeFileSync('src/pages/Repairs.tsx', f);
