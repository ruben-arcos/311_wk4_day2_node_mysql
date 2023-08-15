const mysql = require("mysql");
const db = require("../sql/connection");
const { handleSQLError } = require("../sql/error");

const getAllUsers = (req, res) => {
  // SELECT ALL USERS
  let sql =
    "select first_name, last_name, address, city, county, state, zip, phone1, phone2, email ";
  sql +=
    "from users u join usersAddress ua on u.id = ua.user_id join usersContact uc on u.id = uc.user_id";

  // new format
  db.query(sql, (err, rows) => {
    if (err) {
      console.log("getAllUsers query failed", err);
      res.sendStatus(500); //it was a server's fault
    } else {
      return res.json(rows);
    }
  });

  // older syntax
  // db.query("SELECT * FROM users", (err, rows) => {
  //   if (err) return handleSQLError(res, err)
  //   return res.json(rows);
  // })
};

const getUserById = (req, res) => {
  // SELECT USERS WHERE ID = <REQ PARAMS ID>
  // users/id:
  //put the requested path id into a variable

  let id = req.params.id; //this will get whatever is sent from the front-end form in the id text field

  let params = [id] // you can have more than one ? in your query, and they have to be in order of use in the query

  //check for valid id
  if (!id) {
    res.sendStatus(400); //their fault. didn't send a valid id
    return; //and stop. no reason to execute any more code
  }

  // this is a bad way to do a query!!! - with the id (or any request param) concatenated to the string
  // why? 
  // and what if i add and drop table users
  // this is called a sql injection attack
        // let sql =
        //   "select first_name, last_name, address, city, county, state, zip, phone1, phone2, email ";
        // sql +=
        //   "from users u join usersAddress ua on u.id = ua.user_id join usersContact uc on u.id = uc.user_id";
        // sql += "where u.id = " + id + " and drop table users"

// instead we use parameterized sql statements

let sql = "select first_name, last_name, address, city, county, state, zip, phone1, phone2, email ";
sql += "from users u join usersAddress ua on u.id = ua.user_id join usersContact uc on u.id = uc.user_id";
// like this if we had more than one param sql += "where u.id = ? and first_name = ?" remember always in order of use in query
sql += "where u.id = ?";

// the ? is a dynamic value that is restricted to a query parameter
// the query parameter isn't combined with the main query until AFTER the query has been parsed
//so there's no way the parameter can introduce unintended syntax

db.query(sql, params, (err, rows) => {
  if(err) {
    console.log("getUserById query failed", err):
    res.sendStatus(500) // it was our fault
  } else {
    // we got results, but we got more than one row
    if(rows.length > 1) {
      console.log("Returned more than 1 row for id ", id)
      res.sendStatus(500) // server's fault, data integrity error
    } else if (rows.length === 0) {
      //res.send(null) // don't send anything back
      // OR
      res.status(null).send('User not found')
    }
  }
})

 

  // WHAT GOES IN THE BRACKETS
  // sql = mysql.format(sql, [])

  // pool.query(sql, (err, rows) => {
  //   if (err) return handleSQLError(res, err)
  //   return res.json(rows);
  // })
};

const createUser = (req, res) => {
  // INSERT INTO USERS FIRST AND LAST NAME
  let sql = "QUERY GOES HERE";
  // WHAT GOES IN THE BRACKETS
  sql = mysql.format(sql, []);

  pool.query(sql, (err, results) => {
    if (err) return handleSQLError(res, err);
    return res.json({ newId: results.insertId });
  });
};

const updateUserById = (req, res) => {
  // UPDATE USERS AND SET FIRST AND LAST NAME WHERE ID = <REQ PARAMS ID>
  let sql = "";
  // WHAT GOES IN THE BRACKETS
  sql = mysql.format(sql, []);

  pool.query(sql, (err, results) => {
    if (err) return handleSQLError(res, err);
    return res.status(204).json();
  });
};

const deleteUserByFirstName = (req, res) => {
  // DELETE FROM USERS WHERE FIRST NAME = <REQ PARAMS FIRST_NAME>
  let sql = "";
  // WHAT GOES IN THE BRACKETS
  sql = mysql.format(sql, []);

  pool.query(sql, (err, results) => {
    if (err) return handleSQLError(res, err);
    return res.json({ message: `Deleted ${results.affectedRows} user(s)` });
  });
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUserById,
  deleteUserByFirstName,
};
