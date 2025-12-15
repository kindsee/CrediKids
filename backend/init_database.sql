-- CrediKids Database Schema
-- Versión: 1.0
-- Descripción: Script completo para crear la estructura de base de datos

-- ============================================
-- CREAR BASE DE DATOS
-- ============================================
CREATE DATABASE IF NOT EXISTS credikids_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE credikids_db;

-- ============================================
-- TABLA: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nick VARCHAR(100) NOT NULL UNIQUE,
    figure VARCHAR(10) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    access_code VARCHAR(255) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nick (nick),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: icons
-- ============================================
CREATE TABLE IF NOT EXISTS icons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: tasks
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_type VARCHAR(20) NOT NULL,
    base_value INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_task_type (task_type),
    INDEX idx_is_active (is_active),
    INDEX idx_created_by (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: task_assignments
-- ============================================
CREATE TABLE IF NOT EXISTS task_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancelled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_task_user (task_id, user_id),
    INDEX idx_assigned_date (assigned_date),
    INDEX idx_user_date (user_id, assigned_date),
    INDEX idx_is_completed (is_completed),
    INDEX idx_is_cancelled (is_cancelled),
    UNIQUE KEY unique_task_user_date (task_id, user_id, assigned_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: task_completions
-- ============================================
CREATE TABLE IF NOT EXISTS task_completions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL UNIQUE,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completion_notes TEXT,
    validation_score INT,
    validation_notes TEXT,
    credits_awarded INT DEFAULT 0,
    validated_by_id INT,
    validated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES task_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (validated_by_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_assignment (assignment_id),
    INDEX idx_validated_by (validated_by_id),
    INDEX idx_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: task_proposals
-- ============================================
CREATE TABLE IF NOT EXISTS task_proposals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    proposed_reward INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    user_id INT NOT NULL,
    reviewed_by_id INT,
    reviewed_at DATETIME,
    review_notes TEXT,
    final_title VARCHAR(200),
    final_description TEXT,
    final_reward INT,
    created_task_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_reviewed_by (reviewed_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: rewards
-- ============================================
CREATE TABLE IF NOT EXISTS rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(200),
    credit_cost INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    stock INT,
    created_by_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_is_active (is_active),
    INDEX idx_created_by (created_by_id),
    INDEX idx_credit_cost (credit_cost)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: reward_redemptions
-- ============================================
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reward_id INT NOT NULL,
    user_id INT NOT NULL,
    credits_spent INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    approved_by_id INT,
    approved_at DATETIME,
    rejection_reason TEXT,
    redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_reward (reward_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_approved_by (approved_by_id),
    INDEX idx_redeemed_at (redeemed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: bonuses
-- ============================================
CREATE TABLE IF NOT EXISTS bonuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    credits INT NOT NULL,
    description VARCHAR(500),
    given_by_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (given_by_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_given_by (given_by_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DATOS INICIALES: Iconos
-- ============================================
INSERT INTO icons (code, image_url, is_active) VALUES
('pato', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f986.png', TRUE),
('ancla', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2693.png', TRUE),
('vaso', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f964.png', TRUE),
('dinosaurio', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f995.png', TRUE),
('estrella', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2b50.png', TRUE),
('corazon', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2764.png', TRUE),
('arbol', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f333.png', TRUE),
('pelota', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/26bd.png', TRUE),
('sol', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2600.png', TRUE),
('luna', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f319.png', TRUE),
('nube', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2601.png', TRUE),
('rayo', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/26a1.png', TRUE),
('fuego', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f525.png', TRUE),
('agua', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f4a7.png', TRUE),
('tierra', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f30d.png', TRUE),
('flor', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f33c.png', TRUE),
('mariposa', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f98b.png', TRUE),
('pez', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f41f.png', TRUE),
('avion', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2708.png', TRUE),
('cohete', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f680.png', TRUE),
('coche', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f697.png', TRUE),
('bici', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f6b2.png', TRUE),
('tren', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f686.png', TRUE),
('barco', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/26f5.png', TRUE),
('pizza', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f355.png', TRUE)
ON DUPLICATE KEY UPDATE code=code;

-- ============================================
-- INFORMACIÓN
-- ============================================
-- Base de datos creada exitosamente
-- Tablas: 9
-- Iconos iniciales: 25
-- 
-- Siguiente paso: Crear usuario administrador
-- Ejecutar: python create_admin.py
-- ============================================
