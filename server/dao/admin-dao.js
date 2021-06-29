'use strict';

const { Admin } = require("../model/model");

const sqlite = require("sqlite3");
const db = new sqlite.Database('surveys.db', (err) => { if (err) throw err; });

const bcrypt = require('bcrypt');


// DAO operations for validating users

function getAdmin(username, password) {
    return new Promise((resolve, reject) => {
        const sql = ` SELECT * 
                      FROM admin 
                      WHERE username = ?`;
        db.get(sql, [username], (err, row) => {
            if (err)
                reject(err); // DB error
            else if (row === undefined)
                resolve(false); // user not found
            else {
                bcrypt.compare(password, row.phash).then(result => {
                    if (result) { // password matches
                        const user = { id: row.adID, username: row.username }
                        resolve(user);

                    } else
                        resolve(false); // password not matching
                })
            }
        });
    });
};

function getAdminById(adID) {
    return new Promise((resolve, reject) => {
        const sql = ` SELECT * 
                      FROM admin 
                      WHERE adID = ?`;
        db.get(sql, [adID], (err, row) => {
            if (err)
                reject(err);
            else if (row === undefined)
                resolve({ error: 'Admin not found.' });
            else {
                // by default, the local strategy looks for "username": not to create confusion in server.js, we can create an object with that property
                const user = { id: row.adID, username: row.username }
                resolve(user);

            }
        });
    });
};


const adminDAO = { getAdmin, getAdminById };
module.exports = { adminDAO };
