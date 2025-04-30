# ATM Game Backend API

This project implements a simple backend system simulating an in-game ATM. Players can manage virtual balances through a RESTful API.

## Features

- Create a player
- Deposit money
- Withdraw money
- Transfer money to another player
- View balance
- View transaction history

## Tech Stack

- Express.js
- TypeScript
- PostgreSQL (native SQL queries)
- pg + dotenv

## Database Schema (PostgreSQL)

```sql
-- Table: players
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  balance NUMERIC DEFAULT 0 CHECK (balance >= 0)
);

-- Table: transactions
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id),
  type TEXT CHECK (type IN ('deposit', 'withdraw', 'transfer')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recipient_id INTEGER REFERENCES players(id)
);
```

## Local Setup

Clone the repo with SSH:
`git clone git@github.com:mezger75/atm-backend.git`

Install dependencies:
`npm install`

Create a .env file in the root:

```
DATABASE_URL=postgres://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/atm
PORT=3000
```

Start the server:
`npm run dev`

## API endpoints

### Create player

POST /create-player

```json
{ "username": "firstPlayer" }
```

### Deposit

POST /deposit

```json
{ "playerId": 1, "amount": 100 }
```

### Withdraw

POST /withdraw

```json
{ "playerId": 1, "amount": 50 }
```

### Transfer

POST /transfer

```json
{
  "fromPlayerId": 1,
  "toPlayerId": 2,
  "amount": 25
}
```

### Get balance

GET /balance/:playerId

/balance/1

### View transactions

GET /history/:playerId

/history/1
