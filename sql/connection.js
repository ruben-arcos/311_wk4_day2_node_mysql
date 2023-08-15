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

// mysql doesn't include a method that handles promises, just callbacks
// the database doesn't care. it's just receiving queries, it processes what the query says, and returning results
// if we want to use promises, we either find a modules that handles mysql promises (and learn to use it)
// or we can build our own middleware function that does it for us

// basic wrapper promise if you just want to convert a callback to a promise
// we'll use this when be build our authorization project

// a built-in just for us
connection.queryPromise = (sql, params) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, rows) => {
      if(err) {
        reject(err);
      } else {
        resolve(rows);
      }
    })
  })
};

// go farther, and if you want to process the results of your promise and return the results
// you want to make a blocking function that always returns an err or rows

// this is were async and await come to play.
// this is middleware function
connection.querySync = async (sql, params) => {
  let promise = new Promise((resolve, reject) => {
    console.log("Executing query", sql)
    connection.query(sql, params, (err, results) => {
      if(err) {
        console.log("rejecting");
        return reject(err)
      } else {
        console.log("resolving")
        return resolve(results)
      }
    })
  })

  let results = await promise.then((results) => {
    console.log("results ", results);
    return results;
  }).catch((err) => {
    throw err;
  }) 
  return results;
}

// making an async call to test the connection
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
