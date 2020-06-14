const express = require('express');
const app = express();

// Inicjalizuje localstorage.
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

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
    changePrice(newPrice: number) {
        this.actualPrice = newPrice
        this.pricesHistory.push(newPrice)
        let memes = JSON.parse(localStorage.getItem('memes'))
        for (var i = 0; i < memes.length; i++) {
            if (memes[i].id === this.id) {
                memes[i] = this
            }
        }
        localStorage.setItem('memes', JSON.stringify(memes))
    }
}

// Tworzy początkową listę memów.
let listOfMemes:Meme[];
listOfMemes = [ new Meme(10, 'Gold', [1000], 1000, 'https://i.redd.it/h7rplf9jt8y21.png'),
                new Meme(9, 'Platinum', [1100], 1100, 'http://www.quickmeme.com/img/90/90d3d6f6d527a64001b79f4e13bc61912842d4a5876d17c1f011ee519d69b469.jpg'),
                new Meme(8, 'Elite', [1200], 1200, 'https://i.imgflip.com/30zz5g.jpg')]

// Czyści localstorage, następnie umieszcza tam początkową listę memów.
localStorage.clear();
localStorage.setItem('memes', JSON.stringify(listOfMemes));

// Dodaje mema.
function addMeme(id, name, price, url) {
   let newMeme = new Meme(id, name, [price], price, url)
   let memes = JSON.parse(localStorage.getItem('memes'));
   memes.push(newMeme);
   localStorage.setItem('memes', JSON.stringify(memes));
}

// Wybiera 3 najdroższe memy z localstorage.
function getMostExpensive() {
    let memes = JSON.parse(localStorage.getItem('memes'));
    let price1 = 0
    let price2 = 0
    let price3 = 0
    let best1 = -1
    let best2 = -1
    let best3 = -1
    let result = [];
    for (var i=0; i<memes.length; i++) {
        let price = memes[i].actualPrice;
        if (price > price1) {
            price3 = price2
            price2 = price1
            price1 = price
            best3 = best2
            best2 = best1
            best1 = i
        } else if (price > price2) {
            price3 = price2
            price2 = price
            best3 = best2
            best2 = i
        } else if (price > price3) {
            price3 = price
            best3 = i
        }
    }
    if (best1 >= 0) {
        result.push(memes[best1])
    }
    if (best2 >= 0) {
        result.push(memes[best2])
    }
    if (best3 >= 0) {
        result.push(memes[best3])
    }
    return result
}

// Funkcja zwracająca mema o podanym id (z localstorage).
function getMeme(id) {
    let memes = JSON.parse(localStorage.getItem('memes'))
    let res = -1
    for (var i = 0; i < memes.length && res === (-1); i++) {
        if (memes[i].id === id) {
            res = i
        }
    }
    if (res < 0) {
        return null
    }
    let memeId = memes[res].id
    let memeName = memes[res].name
    let memeHistory = memes[res].pricesHistory
    let memePrice = memes[res].actualPrice
    let memeUrl = memes[res].url
    return new Meme(memeId, memeName, memeHistory, memePrice, memeUrl)
}

// Dodajemy czwartego mema, żeby zmiany cen memów mogły zmienić zawrtość listy wyświetlanej na stronie głównej.
addMeme(13, 'Weak but expensive', 2000, 'https://www.shutupandtakemymoney.com/wp-content/uploads/2020/03/when-you-find-out-your-nomal-daily-lifestyle-is-called-quarantine-meme.jpg');
    

app.set('view engine', 'pug');
app.get('/', function(req, res) {
    res.render('index', { title: 'Meme market', message: 'Hello there!', memes:  getMostExpensive()})
});

app.use(express.urlencoded({
    extended: true
    })); 
app.get('/meme/:memeId', function (req, res) {
       let meme = getMeme(parseInt(req.params.memeId));
       if (meme === null) {
           res.render('error', { text: 'No meme with such id'})
       } else {
           let list = meme.getHistory()
           res.render('history', { title: 'History of meme ' + meme.id, meme: meme, prices: list})
       }
})
app.post('/meme/:memeId', function (req, res) {
    let meme = getMeme(parseInt(req.params.memeId));
    let price = (req.body.price);
    if (parseInt(price) <= 0) {
        res.render('error', { text: 'Invalid price'})
    } else {
        meme.changePrice(parseInt(price));
        meme = getMeme(parseInt(req.params.memeId));
        let list = meme.getHistory();
        res.render('meme', { meme: meme })
    }
 })


app.listen(3000);