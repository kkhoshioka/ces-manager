const API_BASE = 'http://localhost:3000/api';

async function verifyInventoryCategories() {
    try {
        console.log('--- Verifying Inventory Categories ---');

        // 1. Create a Category
        console.log('1. Creating Test Category...');
        const categoryRes = await fetch(`${API_BASE}/product-categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                section: 'TEST_SECTION',
                name: 'Test Category',
                code: `CAT_${Date.now()}`
            })
        });

        if (!categoryRes.ok) {
            console.error('Failed to create category:', await categoryRes.text());
            return;
        }
        const category = await categoryRes.json();
        console.log('Category created:', category.id);

        // 2. Create Product with Category
        console.log('2. Creating Product with Category...');
        const productRes = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: `PART_CAT_${Date.now()}`,
                name: 'Test Part API',
                stockQuantity: 5,
                standardPrice: 1000,
                standardCost: 500,
                categoryId: category.id
            })
        });

        if (!productRes.ok) {
            console.error('Failed to create product:', await productRes.text());
            return;
        }
        const product = await productRes.json();
        console.log('Product created:', product.id);

        // 3. Verify Product has Category (Backend fetch)
        console.log('3. Verifying Product Fetch...');
        const fetchRes = await fetch(`${API_BASE}/products`);
        const allProducts = await fetchRes.json();
        const found = allProducts.find((p: any) => p.id === product.id);

        if (found && found.productCategory && found.productCategory.id === category.id) {
            console.log('SUCCESS: Product correctly linked to Category.');
            console.log('Category Section:', found.productCategory.section);

            if (found.productCategory.section === 'TEST_SECTION') {
                console.log('SUCCESS: Section is correct.');
            } else {
                console.error('FAILURE: Section mismatch.', found.productCategory.section);
            }

        } else {
            console.error('FAILURE: Product not linked to category correctly.', found);
        }

        // 4. Cleanup
        console.log('4. Cleaning up...');
        await fetch(`${API_BASE}/products/${product.id}`, { method: 'DELETE' });
        await fetch(`${API_BASE}/product-categories/${category.id}`, { method: 'DELETE' });
        console.log('Cleanup complete.');

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verifyInventoryCategories();
export { };
