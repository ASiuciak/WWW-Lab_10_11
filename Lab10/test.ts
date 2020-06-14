const sqlite = require('sqlite3').verbose();
const expr = require('express')
const ex = expr();

// Łączymy się z bazą.
let db1 = new sqlite.Database('memes.db');

class Meme{
    id: number;
    name: string;
    pricesHistory: Array<number>;
    actualPrice: number;
    url: string;
    constructor(id: number, name: string, history: number[], price: number, url: string) {
        this.id = id
        this.name = name
        this.pricesHistory = history
        this.actualPrice = price
        this.url = url
    }
    getHistory() {
        return this.pricesHistory.reverse()
    }
    set price(newPrice: number) {
        this.actualPrice = newPrice
    }
    getId () { return this.id }
    getName () { return this.name }
    getHis () { return this.pricesHistory }
    getPrice () { return this.actualPrice }
    getUrl () { return this.url }
    // Zmienia cenę mema - usuwa z bzay mema ze starą ceną, dodaje tego samego z nową ceną i zaktualizowaną historią.
    changePrice(newPrice: number) {
        db1.serialize(function() {
            var del = db1.prepare('DELETE FROM Memes WHERE id = ?')
            del.run(this.id)
            del.finalize()
            this.price = newPrice
            this.pricesHistory.push(newPrice);
            var insert = db1.run('INSERT INTO Memes VALUES (?,?,?,?,?)')
            insert.run(this.id, this.name, this.pricesHistory.toString(), this.price, this.url)
            insert.finalize()
        })
    }
}

class changePrice{
    id: number;
    oldPrice: number;
    newPrice: number;
    user: String;
    constructor(id: number, oP: number, nP: number, user: String) {
        this.id = id;
        this.oldPrice = oP;
        this.newPrice = nP;
        this.user = user;
    }
}

// Licznik wyświetlonych stron w jednej sesji
let pages = 0;
setInterval(function(){ pages = 0; }, 15 * 60000);

let users = []
let actualUser;

// Sprawdza, czy istniej już użytokwnik o danym loginie
function checkIfUserExists(name) {
    let found = -1
    for (var i = 0; i < users.length && found === -1; i++) {
        if (users[i]["name"] === name) {
            found = i;
        }
    }
    return found
}

// Przekształca historię cen zapisaną w bazie na tablicę liczb.
function getHistoryList(hisStr) {
    let strArr = hisStr.split(",");
    let res = []
    for (var i = 0; i < strArr.length; i++) {
        res.push(parseInt(strArr[i]))
    }
    return res
}

// Tworzy obiekt klasy Meme z rekordu z bazy Memes.
function getMeme(row) {
    return new Meme(parseInt(row["id"]), row["name"], getHistoryList(row["history"]), row["price"], row["url"])
}

// Tworzy obiekt klasy changePrice z rekordu z bazy Changes.
function getChangePrice(row) {
    return new changePrice(row["id"], row["oldPrice"], row["newPrice"], row["user"]);
}

// Pobiera z bazy 3 najdroższe memy.
function getTop3() {
    return new Promise(function(resolve, reject){
      db1.all(
          "SELECT id, name, history, price, url FROM Memes ORDER BY price DESC LIMIT 3", [], 
          function(err, rows){                                                
              if(rows === undefined){
                  reject(new Error("Error rows is undefined"));
              }else{
                  resolve(rows);
              }
          }
      )}
  )}

// Pobiera z bazy mema o danym id.
function getOne(id) {
    return new Promise(function(resolve, reject){
      db1.all(
          "SELECT id, name, history, price, url FROM Memes WHERE id = " + id, [], 
          function(err, rows){                                                
              if(rows === undefined){
                  reject(new Error("Error rows is undefined"));
              }else{
                  resolve(rows);
              }
          }
      )}
  )}


// Pobiera z bazy szczegółową historię zmian ceny mema o danym id.
function getPrices(id) {
    return new Promise(function(resolve, reject){
      db1.all(
          "SELECT memeId, oldPrice, newPrice, user FROM Changes WHERE memeId = " + id, [], 
          function(err, rows){                                                
              if(rows === undefined){
                  reject(new Error("Error rows is undefined"));
              }else{
                  resolve(rows);
              }
          }
      )}
  )}


ex.set('view engine', 'pug');
ex.use(expr.urlencoded({
    extended: true
    })); 
ex.get("/", function(req, res) {
    pages += 1
    getTop3().then(result => {
        let memes = []
        for (var i = 0; i < 3; i++) {
            memes.push(getMeme(result[i]))
        }
        if (actualUser === undefined) {
            res.render('index', { title: 'Meme market', message: 'Hello there', memes: memes, pages: pages})
        } else {
            res.render('logged', { title: 'Meme market', message: 'Hello there', memes: memes, pages: pages, actualUser: actualUser})
        }
        
    })
})

ex.post("/", function(req, res) {
    getTop3().then(result => {
        let memes = []
        for (var i = 0; i < 3; i++) {
            memes.push(getMeme(result[i]))
        }
        let out = req.body.out

        // Sprawdzamy, czy wejście nastąpiło z formularza wylogowania
        if (out != undefined) {
            actualUser = undefined
            res.render('index', { title: 'Meme market', message: 'Hello there', memes: memes, pages: pages})
        } else {
            let name = req.body.user
            let passwd = req.body.password
            let num = checkIfUserExists(name)

            /* Sprawdzamy, czy użytkownik o danej nazwie istnieje, jeśli tak, pozwalamy zalogować się tylko
               w przypadku podania dobrego hasła. */
            if (num >= 0) {
                if (users[num]["password"] === passwd) {
                    actualUser = name
                    res.render('logged', { title: 'Meme market', message: 'Hello there', memes: memes, pages: pages, actualUser: actualUser})
                } else {
                    res.render('index', { title: 'Meme market', message: 'Hello there', memes: memes, pages: pages})
                } 
            } else {
                let usr = { name: name, password: passwd}
                users.push(usr)
                actualUser = name;
                res.render('logged', { title: 'Meme market', message: 'Hello there', memes: memes, pages: pages, actualUser: actualUser})
            }
        }
    })
})

ex.get("/meme/:memeId", function(req, res) {
    pages += 1
    getOne(req.params.memeId).then(result => {
        let meme = getMeme(result[0]);
        if (meme === undefined || meme === null) {
            res.render('error', { text: 'No meme with such id'})
        } else {
            let list = meme.getHistory()

            // Wyświetlamy odpowiednią wersję strony w zależności od tego, czy jest jakiś zalogowany użytkownik.
            if (actualUser === undefined) {
                res.render('historyDisabled', { title: 'History of meme ' + meme.id, meme: meme, prices: list, pages: pages})
            }
            res.render('history', { title: 'History of meme ' + meme.id, meme: meme, prices: list, pages: pages})
        }
    })
})

ex.post("/meme/:memeId", function(req, res) {
    pages += 1
    getOne(req.params.memeId).then(result => {
        let meme = getMeme(result[0]);
        if (meme === undefined || meme === null) {
            res.render('error', { text: 'No meme with such id'})
        } else {
            var update = db1.prepare('UPDATE Memes SET history = ?, price = ? WHERE id = ?')
            let his = meme.getHis()
            his.push(req.body.price)
            update.run(his.toString(), req.body.price, meme.getId())
            update.finalize()
            var change = db1.prepare('INSERT INTO Changes VALUES (?,?,?,?)')
            change.run(meme.getId(), meme.getPrice(), req.body.price, actualUser)
            change.finalize()
            meme.actualPrice = req.body.price
            res.render('meme', { meme: meme, pages: pages })
        }
    }).catch(() => {
        console.error("Cant find meme")
    })
})

ex.get("/meme/:memeId/changes", function(req, res) {
    pages += 1
    getPrices(req.params.memeId).then(result => {
        let list = []
        let finish = false;
        let i = 0;
        while (!finish) {
            if (result[i] != null && result[i] != undefined) {
                list.push(getChangePrice(result[0]));
            } else {
                finish = true;
            }
            i++;
        }
        if (list === undefined || list === null) {
            res.render('error', { text: 'No meme with such id'})
        } else {
            res.render('prices', {text: 'History of meme ' + req.params.memeId, list: list, pages: pages})
        }
    })
})


ex.listen(3000);

