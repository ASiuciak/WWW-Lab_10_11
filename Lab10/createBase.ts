const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('memes.db', (err)=>{
    if (err) {
        console.log('failed to create database')
    }
})

db.serialize(function(){
    db.run("CREATE TABLE Memes (id INT, name TEXT, history TEXT, price INT, url TEXT)");

    var stmt = db.prepare("INSERT INTO Memes VALUES (?,?,?,?,?)")
    var id = 10
    var name = "Gold"
    var his = [1000].toString()
    var price = 1000
    var url = 'https://i.redd.it/h7rplf9jt8y21.png'
    stmt.run(id, name, his, price, url)

    id = 9
    name = "Platinum"
    his = [1100].toString()
    price = 1100
    url = 'http://www.quickmeme.com/img/90/90d3d6f6d527a64001b79f4e13bc61912842d4a5876d17c1f011ee519d69b469.jpg'
    stmt.run(id, name, his, price, url)

    id = 8
    name = "Elite"
    his = [1200].toString()
    price = 1200
    url = 'https://i.imgflip.com/30zz5g.jpg'
    stmt.run(id, name, his, price, url)


    id = 13
    name = "Weak but expensive"
    his = [2000].toString()
    price = 2000
    url = 'https://www.shutupandtakemymoney.com/wp-content/uploads/2020/03/when-you-find-out-your-nomal-daily-lifestyle-is-called-quarantine-meme.jpg'
    stmt.run(id, name, his, price, url)
    stmt.finalize()

    db.each("SELECT id, name, history, price, url FROM Memes", function(err, row) {
        console.log(row.id + " " + row.name + " " + row.history + " " + row.price + " " + row.url)
    })
});

db.close()