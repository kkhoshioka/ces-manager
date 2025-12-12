-- Database Dump
-- Generated at: 2025-12-05T07:00:57.476Z

-- Customers
INSERT INTO Customer (id, code, name, address, phone, email, createdAt, updatedAt) VALUES (1, 'TEST_1764915322957', 'Test Customer Node', NULL, NULL, NULL, '2025-12-05T06:15:23.134Z', '2025-12-05T06:15:23.134Z');
INSERT INTO Customer (id, code, name, address, phone, email, createdAt, updatedAt) VALUES (2, 'DASH_TEST', 'Dashboard Test Client', NULL, NULL, NULL, '2025-12-05T06:53:30.753Z', '2025-12-05T06:53:30.753Z');

-- Products
INSERT INTO Product (id, code, name, category, standardPrice, standardCost, stockQuantity, createdAt, updatedAt) VALUES (3, 'M-DASH-1', 'New Car', '新車', 1000000, 800000, 0, '2025-12-05T06:53:30.776Z', '2025-12-05T06:53:30.776Z');
INSERT INTO Product (id, code, name, category, standardPrice, standardCost, stockQuantity, createdAt, updatedAt) VALUES (4, 'P-DASH-1', 'Part', '部品', 5000, 3000, 0, '2025-12-05T06:53:30.785Z', '2025-12-05T06:53:30.785Z');

-- CustomerMachines

-- Projects
INSERT INTO Project (id, customerId, customerMachineId, machineModel, serialNumber, orderDate, completionDate, status, totalAmount, notes, createdAt, updatedAt) VALUES (1, 1, NULL, 'PC200-8', '99999', NULL, NULL, 'received', 0, 'Test Project via Node', '2025-12-05T06:15:23.176Z', '2025-12-05T06:15:23.176Z');
INSERT INTO Project (id, customerId, customerMachineId, machineModel, serialNumber, orderDate, completionDate, status, totalAmount, notes, createdAt, updatedAt) VALUES (2, 2, NULL, 'Test Machine', '12345', NULL, '2025-12-05T06:53:30.789Z', 'completed', 0, NULL, '2025-12-05T06:53:30.808Z', '2025-12-05T06:53:30.808Z');

-- ProjectDetails
INSERT INTO ProjectDetail (id, projectId, productId, lineType, description, quantity, unitCost, unitPrice, amountCost, amountSales, outsourcingCost, createdAt, updatedAt) VALUES (1, 1, NULL, 'labor', 'Inspection', 1.5, 0, 8000, 0, 0, 0, '2025-12-05T06:15:23.176Z', '2025-12-05T06:15:23.176Z');
INSERT INTO ProjectDetail (id, projectId, productId, lineType, description, quantity, unitCost, unitPrice, amountCost, amountSales, outsourcingCost, createdAt, updatedAt) VALUES (2, 1, NULL, 'part', 'O-Ring', 2, 100, 500, 0, 0, 0, '2025-12-05T06:15:23.176Z', '2025-12-05T06:15:23.176Z');
INSERT INTO ProjectDetail (id, projectId, productId, lineType, description, quantity, unitCost, unitPrice, amountCost, amountSales, outsourcingCost, createdAt, updatedAt) VALUES (3, 2, 3, 'part', 'New Car Item', 1, 800000, 1000000, 0, 0, 0, '2025-12-05T06:53:30.808Z', '2025-12-05T06:53:30.808Z');
INSERT INTO ProjectDetail (id, projectId, productId, lineType, description, quantity, unitCost, unitPrice, amountCost, amountSales, outsourcingCost, createdAt, updatedAt) VALUES (4, 2, NULL, 'labor', 'Repair Labor', 5, 5000, 10000, 0, 0, 0, '2025-12-05T06:53:30.808Z', '2025-12-05T06:53:30.808Z');
INSERT INTO ProjectDetail (id, projectId, productId, lineType, description, quantity, unitCost, unitPrice, amountCost, amountSales, outsourcingCost, createdAt, updatedAt) VALUES (5, 2, 4, 'part', 'Spare Part', 2, 3000, 5000, 0, 0, 0, '2025-12-05T06:53:30.808Z', '2025-12-05T06:53:30.808Z');

-- ProjectPhotos

