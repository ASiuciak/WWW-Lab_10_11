const sql3 = require('sqlite3').verbose();

let db2 = new sql3.Database('memes.db', (err)=>{
    if (err) {
        console.log('failed to create database')
    }
})

db2.serialize(function(){
    db2.run("CREATE TABLE Changes (memeId INT, oldPrice INT, newPrice INT, user TEXT)");
});

db2.close()