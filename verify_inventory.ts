const API_BASE = 'http://localhost:3000/api';

async function verifyInventory() {
    try {
        console.log('--- Verifying Inventory ---');

        // 1. Create Product
        console.log('1. Creating Product...');
        const productRes = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: `PART_${Date.now()}`,
                name: 'Test Part Node',
                category: 'Engine',
                stockQuantity: 10,
                standardPrice: 5000,
                standardCost: 3000
            })
        });

        if (!productRes.ok) {
            console.error('Failed to create product:', await productRes.text());
            return;
        }
        const product = await productRes.json();
        console.log('Product created:', product);

        // 2. Verify Standard Cost
        if (Number(product.standardCost) === 3000) {
            console.log('SUCCESS: Standard Cost verified.');
        } else {
            console.error('FAILURE: Standard Cost mismatch.', product.standardCost);
        }

        // 3. Update Product (Low Stock)
        console.log('3. Updating Product (Low Stock)...');
        const updateRes = await fetch(`${API_BASE}/products/${product.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                stockQuantity: 3
            })
        });
        const updatedProduct = await updateRes.json();
        console.log('Product updated:', updatedProduct);

        if (updatedProduct.stockQuantity === 3) {
            console.log('SUCCESS: Stock updated.');
        }

        // 4. Delete Product
        console.log('4. Deleting Product...');
        const deleteRes = await fetch(`${API_BASE}/products/${product.id}`, {
            method: 'DELETE'
        });

        if (deleteRes.ok) {
            console.log('SUCCESS: Product deleted.');
        } else {
            console.error('FAILURE: Failed to delete product.');
        }

        // 5. Verify Deletion
        const checkRes = await fetch(`${API_BASE}/products`);
        const allProducts = await checkRes.json();
        const found = allProducts.find((p: any) => p.id === product.id);
        if (!found) {
            console.log('SUCCESS: Product confirmed deleted from list.');
        } else {
            console.error('FAILURE: Product still exists in list.');
        }

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verifyInventory();

export { };
