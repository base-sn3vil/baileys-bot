const fs = require('fs');
const path = require('path');

const balanceFile = path.join(__dirname, '../data/balances.json');

// Ensure file exists
if (!fs.existsSync(balanceFile)) {
    fs.writeFileSync(balanceFile, JSON.stringify({}));
}

function readBalances() {
    const raw = fs.readFileSync(balanceFile);
    return JSON.parse(raw);
}

function writeBalances(data) {
    fs.writeFileSync(balanceFile, JSON.stringify(data, null, 2));
}

function getBalance(userId) {
    const balances = readBalances();
    return balances[userId] || 0;
}

function setBalance(userId, amount) {
    const balances = readBalances();
    balances[userId] = amount;
    writeBalances(balances);
}

function addBalance(userId, amount) {
    const balances = readBalances();
    balances[userId] = (balances[userId] || 0) + amount;
    writeBalances(balances);
}

function deductBalance(userId, amount) {
    const balances = readBalances();
    if ((balances[userId] || 0) >= amount) {
        balances[userId] -= amount;
        writeBalances(balances);
        return true;
    }
    return false;
}

module.exports = {
    getBalance,
    setBalance,
    addBalance,
    deductBalance
};
