const pool = require('../config/database'); // Путь к вашей конфигурации БД

class User {
    static async findByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }

    static async create(email, passwordHash) {
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, balance) VALUES ($1, $2, $3) RETURNING *',
            [email, passwordHash, 1000.00]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async updateBalance(userId, amount) {
        const result = await pool.query(
            'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance',
            [amount, userId]
        );
        return result.rows[0].balance;
    }
}

// ✅ КОРРЕКТНЫЙ ЭКСПОРТ
module.exports = User;