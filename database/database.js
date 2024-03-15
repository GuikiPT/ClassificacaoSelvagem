const colors = require('colors/safe');
const Database = require('better-sqlite3')(__dirname + '/database.db');
const mysql = require('mysql2/promise');
const schedule = require('node-schedule');
const hooker = require('../functions/hooker');
const fs = require('fs');

let mysqlConnection;

async function syncData(client) {
  const sqliteDB = Database;
  try {
    const rows = sqliteDB.prepare('SELECT * FROM cbp').all();
    for (const row of rows) {
      await mysqlConnection.query(`CREATE TABLE IF NOT EXISTS cbp (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        guildId VARCHAR(254),
        userId VARCHAR(254),
        playerName VARCHAR(254),
        points INT(254),
        wins INT(254),
        bonus INT(254),
        team VARCHAR(254)
      );`);
      await mysqlConnection.query(
        'REPLACE INTO cbp (id, guildId, userId, playerName, points, wins, bonus, team) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [row.id, row.guildId, row.userId, row.playerName, row.points, row.wins, row.bonus, row.team]
      );
    }
    console.log('Sucessfully synced');
  } catch (error) {
    await hooker.commandErrorHooker(client, 'database.js', 'Error while syncing databases', error);
    console.error(colors.red(error.stack || error));
  }
}

async function establishMySQLConnection(client) {
  try {
    mysqlConnection = await mysql.createConnection({
      host: process.env.MysqlHost,
      port: process.env.MysqlPort,
      user: process.env.MysqlUser,
      password: process.env.MysqlPassword,
      database: process.env.MysqlDatabase,
      ssl: {
        ca: fs.readFileSync(__dirname + '/certs/ca-cert.pem'),
      },
    });
  } catch (error) {
    await hooker.commandErrorHooker(client, 'database.js', 'Connecting to mysql database.', error);
    console.error(colors.red(error.stack || error));
  }
}

function closeMySQLConnection(client) {
  if (mysqlConnection) {
    mysqlConnection.end();
  }
}

module.exports = async function (client) {
  try {
    const sql = `CREATE TABLE IF NOT EXISTS cbp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guildId VARCHAR(254),
      userId VARCHAR(254),
      playerName VARCHAR(254),
      points INT(254),
      wins INT(254),
      bonus INT(254),
      team VARCHAR(254)
    );`;

    process.on('exit', () => {
      closeMySQLConnection(client);
    });

    await Database.exec(sql);
    schedule.scheduleJob('*/30 * * * * *', async () => {
      await establishMySQLConnection(client);
      console.log('Syncing data to online database');
      await syncData(client);
      await closeMySQLConnection(client);
    });
  } catch (error) {
    await hooker.commandErrorHooker(client, 'database.js', undefined, error);
    console.error(colors.red(error.stack || error));
  }
};	
