# 🥩✨ Kurban Traceability — Backend & Hyperledger Fabric Ledger

A modern e-traceability system for Qurban, combining a **Node.js/Express backend** with a **Hyperledger Fabric blockchain ledger**. Every lifecycle stage — from farm registration to carcass distribution — is permanently recorded on-chain.

---

## 🚀 Key Features

- **Immutable Ledger** — All critical events are recorded permanently on Fabric
- **Dual-Layer Architecture**

  - **On-Chain:** Hyperledger Fabric for audit & trust
  - **Off-Chain:** PostgreSQL for fast querying

- **Role-Based Authorization** with Fabric CA identities

---

## 🛠️ Requirements

Install these before starting:

- **Docker** ≥ `4.42.1`
- **Docker Compose**
- **Node.js** `18.20.8`
- **NPM**
- **Git**
- **PostgreSQL 18**

---

# ⚙️ Full Project Setup (Hyperledger Fabric + PostgreSQL + Backend)

Follow these steps **in order**.

---

# 1️⃣ Clone the Repository

```bash
git clone https://github.com/lusi-kuraisin/kurban-blockchain.git
cd kurban-blockchain/
```

---

# 2️⃣ Start Hyperledger Fabric Network

Go to test-network:

```bash
cd blockchain/test-network
```

### 2.1 Clean & Start Network

```bash
./network.sh down
./network.sh up -ca -s couchdb
```

### 2.2 Create Channel

```bash
./network.sh createChannel -c mychannel
```

### 2.3 Deploy Chaincode

```bash
./network.sh deployCC \
  -ccn kurban \
  -ccp ../chaincode/kurban \
  -ccl javascript
```

---

# 3️⃣ Sync Fabric Certificates (Required for Backend)

Still inside `test-network`:

```bash
cp -f "./organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
"../../server/certs/orderer-tls-ca.pem"

cp -f "./organizations/peerOrganizations/org1.example.com/ca/ca.org1.example.com-cert.pem" \
"../../server/certs/org1-peer-ca.crt"

cp -f "./organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem" \
"../../server/certs/org1-tls-ca.pem"
```

---

# 4️⃣ PostgreSQL 18 Setup (Before Running Backend)

## 4.1 Install PostgreSQL 18

### macOS

```bash
brew install postgresql@18
brew services start postgresql@18
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Check:

```bash
psql --version
```

---

## 4.2 Create Database + User

```bash
sudo -u postgres psql
```

Inside psql:

```sql
CREATE DATABASE kurban_db;
CREATE USER kurban_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE kurban_db TO kurban_user;
\q
```

---

## 4.3 Configure `.env` (inside `/server`)

```
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kurban_db
DB_USER=kurban_user
DB_PASS=your_password
```

---

## 4.4 Run Database Migrations

Move to backend:

```bash
cd ../../server
```

Install Dependencies

```bash
npm install
```

Run migrations:

```bash
npx sequelize db:migrate
```

---

# 5️⃣ Run Backend API

## 5.1 Enroll Fabric Admin

```bash
node scripts/enrollAdmin.js
```

## 5.2 Start Server

```bash
npm run dev
```

Your API is now running at:

```
http://localhost:<PORT>
```

---

# 🗂 Project Structure

| Path                           | Description                                    |
| ------------------------------ | ---------------------------------------------- |
| `blockchain/`                  | Full Hyperledger Fabric network config         |
| `blockchain/chaincode/kurban/` | Smart Contract (KurbanContract.js)             |
| `server/`                      | Backend API (Express + Sequelize + Fabric SDK) |
| `server/models/`               | Database models                                |
| `server/controllers/`          | API business logic                             |
| `server/routes/`               | HTTP routes                                    |
| `server/scripts/`              | Utility scripts (e.g., enrollAdmin.js)         |
| `server/invoke.js`             | Fabric interaction module                      |

---
