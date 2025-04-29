import { Request, Response } from 'express';
import { pool } from '../db';

export const createPlayer = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { username } = req.body;
  if (!username) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  try {
    const result = await pool.query(
      'INSERT INTO players (username, balance) VALUES ($1, $2) RETURNING id',
      [username, 0]
    );
    res.status(201).json({ playerId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Player creation failed', details: err });
  }
};

export const deposit = async (req: Request, res: Response): Promise<void> => {
  const { playerId, amount } = req.body;
  if (!playerId || amount <= 0) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  try {
    await pool.query('BEGIN');

    await pool.query(
      'UPDATE players SET balance = balance + $1 WHERE id = $2',
      [amount, playerId]
    );

    await pool.query(
      `INSERT INTO transactions (player_id, type, amount) VALUES ($1, 'deposit', $2)`,
      [playerId, amount]
    );

    await pool.query('COMMIT');
    res.json({ message: 'Deposit successful' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: 'Deposit failed', details: err });
  }
};

export const withdraw = async (req: Request, res: Response): Promise<void> => {
  const { playerId, amount } = req.body;
  if (!playerId || amount <= 0) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT balance FROM players WHERE id = $1',
      [playerId]
    );

    const balance = result.rows[0]?.balance;
    if (balance === undefined) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    if (balance < amount) {
      res.status(400).json({ error: 'Insufficient funds' });
      return;
    }

    await pool.query('BEGIN');

    await pool.query(
      'UPDATE players SET balance = balance - $1 WHERE id = $2',
      [amount, playerId]
    );

    await pool.query(
      `INSERT INTO transactions (player_id, type, amount) VALUES ($1, 'withdraw', $2)`,
      [playerId, amount]
    );

    await pool.query('COMMIT');
    res.json({ message: 'Withdraw successful' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: 'Withdraw failed', details: err });
  }
};

export const getBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  const playerId = parseInt(req.params.playerId);
  if (!playerId) {
    res.status(400).json({ error: 'Invalid player ID' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT balance FROM players WHERE id = $1',
      [playerId]
    );
    if (!result.rows.length) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    res.json({ balance: result.rows[0].balance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch balance', details: err });
  }
};

export const getHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const playerId = parseInt(req.params.playerId);
  if (!playerId) {
    res.status(400).json({ error: 'Invalid player ID' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE player_id = $1 ORDER BY timestamp DESC',
      [playerId]
    );

    res.json({ history: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history', details: err });
  }
};

export const transfer = async (req: Request, res: Response): Promise<void> => {
  const { fromPlayerId, toPlayerId, amount } = req.body;
  if (!fromPlayerId || !toPlayerId || amount <= 0) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }
  if (fromPlayerId === toPlayerId) {
    res.status(400).json({ error: 'Cannot transfer to self' });
    return;
  }

  try {
    const sender = await pool.query(
      'SELECT balance FROM players WHERE id = $1',
      [fromPlayerId]
    );
    const receiver = await pool.query('SELECT id FROM players WHERE id = $1', [
      toPlayerId,
    ]);

    if (!sender.rows.length || !receiver.rows.length) {
      res.status(404).json({ error: 'One or both players not found' });
      return;
    }

    if (sender.rows[0].balance < amount) {
      res.status(400).json({ error: 'Insufficient funds' });
      return;
    }

    await pool.query('BEGIN');

    await pool.query(
      'UPDATE players SET balance = balance - $1 WHERE id = $2',
      [amount, fromPlayerId]
    );

    await pool.query(
      'UPDATE players SET balance = balance + $1 WHERE id = $2',
      [amount, toPlayerId]
    );

    await pool.query(
      `INSERT INTO transactions (player_id, type, amount, recipient_id)
       VALUES ($1, 'transfer', $2, $3)`,
      [fromPlayerId, amount, toPlayerId]
    );

    await pool.query('COMMIT');
    res.json({ message: 'Transfer successful' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: 'Transfer failed', details: err });
  }
};
