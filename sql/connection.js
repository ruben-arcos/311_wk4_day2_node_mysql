require("dotenv").config();

const mysql = require("mysql");

// new way

//define the connection
let connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
});

// make an async call to test the connection
/**
 * use basic syntax of the mysql module query
 *
 * execute the query and handle the result
 * connection.query(sql, callback)
 * sql - query code you want to run - select * from wherever
 * callback - does what you want to do with the results
 */

// let sql = "select now()";
// let callback = (err, rows) => {
//   // make the connection
//   if (err) {
//     // not truthy, so a connection wasn't made
//     console.log("could not connect to database", err);
//   } else {
//     // it is truthy, so the query executed and we show the results of the query
//     console.log("connection made", rows);
//   }
// };

// make the connection
connection.connect();

// making async call to test the connection
connection.query("select now()", (err, rows) => {
  if(err) {
    console.log("Connection not successful", err)
  } else {
    console.log("Connected, ", rows)
  }
})

module.exports = connection;


/************************************************************/

// class based connection

// class Connection {
//   constructor() {
//     if (!this.pool) {
//       console.log('creating connection...')
//       this.pool = mysql.createPool({
//         connectionLimit: 100,
//         host: process.env.DB_HOST,
//         user: process.env.DB_USER,
//         password: process.env.DB_PWD,
//         database: process.env.DB_NAME
//       })

//       return this.pool
//     }

//     return this.pool
//   }
// }

// const instance = new Connection()

// module.exports = instance;
