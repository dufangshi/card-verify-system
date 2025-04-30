import { pool } from '../config/db';
import bcrypt from 'bcrypt';

interface UserRecord {
  user_id: number;
  username: string;
  password_hash: string;
  role_id: number;
  created_at: Date;
  last_login: Date | null;
}

export class UserDAO {
  static async getUserByUsername(username: string): Promise<UserRecord | null> {
    const query = `
      SELECT * FROM users WHERE username = $1
    `;
    const { rows } = await pool.query(query, [username]);
    return rows[0] || null;
  }

  static async updateLastLogin(userId: number): Promise<void> {
    const query = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `;
    await pool.query(query, [userId]);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  static async getUserById(userId: number) {
    const query = `
      SELECT user_id, username, role_id, parent_id, created_at, last_login
      FROM users
      WHERE user_id = $1
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows[0] || null;
  }
}