-- CES Repair Management System Database Schema
-- Generated based on requirements for Customers, Products, and Outsourcing/Project Details

-- 1. Customers Master (得意先マスタ)
-- Stores basic customer information.
CREATE TABLE Customers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '得意先コード',
    name VARCHAR(255) NOT NULL COMMENT '得意先名',
    address TEXT COMMENT '住所',
    phone VARCHAR(20) COMMENT '電話番号',
    email VARCHAR(255) COMMENT 'メールアドレス',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='得意先マスタ';

-- 2. Products/Services Master (商品・サービスマスタ)
-- Stores products, services, repair types, etc.
CREATE TABLE Products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '商品コード',
    name VARCHAR(255) NOT NULL COMMENT '商品・サービス名',
    category VARCHAR(50) COMMENT 'カテゴリ (例: 部品, 修理, 外注, レンタル)',
    standard_price DECIMAL(12, 2) DEFAULT 0 COMMENT '標準売価',
    standard_cost DECIMAL(12, 2) DEFAULT 0 COMMENT '標準原価',
    stock_quantity INT DEFAULT 0 COMMENT '在庫数 (将来用)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='商品・サービスマスタ';

-- 3. Owned Machines Master (所持機械マスタ)
-- Stores machines owned by customers.
-- Links customers to specific machine instances (Model + Serial).
CREATE TABLE CustomerMachines (
    id SERIAL PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL COMMENT '所有者(得意先ID)',
    machine_model VARCHAR(255) NOT NULL COMMENT '機種',
    serial_number VARCHAR(255) NOT NULL COMMENT '機番/シリアル',
    purchase_date DATE COMMENT '購入日',
    notes TEXT COMMENT '備考 (過去の修理履歴などはProjectsテーブルから参照)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES Customers(id),
    UNIQUE KEY unique_machine (machine_model, serial_number) COMMENT '機種と機番の組み合わせは一意'
) COMMENT='所持機械マスタ';

-- 4. Projects Header (案件ヘッダ)
-- Represents a single repair or sales project. Corresponds to the header info in "外注費.csv".
CREATE TABLE Projects (
    id SERIAL PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL COMMENT '得意先ID',
    customer_machine_id BIGINT UNSIGNED COMMENT '所持機械ID (修理対象の機械)',
    
    -- Snapshot fields (optional, but good for history if master changes)
    machine_model VARCHAR(255) COMMENT '機種 (スナップショット)',
    serial_number VARCHAR(255) COMMENT '機番 (スナップショット)',
    
    order_date DATE COMMENT '受注日',
    completion_date DATE COMMENT '完了日',
    status VARCHAR(50) DEFAULT 'received' COMMENT 'ステータス (received, diagnosing, in_progress, completed, delivered)',
    total_amount DECIMAL(12, 2) DEFAULT 0 COMMENT '合計請求額',
    notes TEXT COMMENT '備考',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES Customers(id),
    FOREIGN KEY (customer_machine_id) REFERENCES CustomerMachines(id)
) COMMENT='案件ヘッダ';

-- 5. Project Details (案件明細)
-- Detailed line items for each project (Labor, Parts, Outsourcing).
-- Corresponds to the detailed rows in "外注費.csv".
CREATE TABLE ProjectDetails (
    id SERIAL PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL COMMENT '案件ID',
    product_id BIGINT UNSIGNED COMMENT '商品ID (マスタにある場合)',
    
    line_type VARCHAR(20) NOT NULL COMMENT '明細区分 (labor:工賃, part:部品, outsourcing:外注費, other:その他)',
    description VARCHAR(255) NOT NULL COMMENT '明細内容/品名',
    
    quantity DECIMAL(10, 2) DEFAULT 1 COMMENT '数量',
    unit_cost DECIMAL(12, 2) DEFAULT 0 COMMENT '単価(原価)',
    unit_price DECIMAL(12, 2) DEFAULT 0 COMMENT '単価(売価)',
    
    amount_cost DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED COMMENT '金額(原価)',
    amount_sales DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED COMMENT '金額(売価)',
    
    outsourcing_cost DECIMAL(12, 2) DEFAULT 0 COMMENT '外注費 (line_type=outsourcingの場合のコスト)',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id)
) COMMENT='案件明細';

-- 6. Project Photos (案件写真)
-- Stores photos associated with a project (e.g., damage photos, completion photos).
CREATE TABLE ProjectPhotos (
    id SERIAL PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL COMMENT '案件ID',
    file_path VARCHAR(255) NOT NULL COMMENT 'ファイルパス/URL',
    file_name VARCHAR(255) NOT NULL COMMENT '元のファイル名',
    description TEXT COMMENT '写真の説明 (例: 破損箇所, 修理後)',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE
) COMMENT='案件写真';
