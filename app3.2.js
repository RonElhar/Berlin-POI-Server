const express = require("express");
const bodyParser = require('body-parser');
const DButilsAzure = require('./DButils');
const app = express();

const users = require("./Users");
const categories = require("./Categories");
const interestPoints = require("./PointsOfInterest");
const cors = require('cors')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cors())

app.post('/login', users.login);//v

app.use('/private', users.authenticate);//v

app.get("/getAllCategories", categories.getCategories);//v

app.get("/getCategoryPoints/:categoryName", categories.getPointsOfCategory);//v

app.get("/getAllPoints", interestPoints.getAllPoints);//v

app.post("/increaseViews", interestPoints.increaseViews);//v

app.get("/getPointProperties/:interestPointName", interestPoints.getPointProperties);//V

app.get("/getPointByName/:interestPointName", interestPoints.getPointByName); ///V

app.get("/getRandomPopularPoints", interestPoints.getRandomPopular);//V

app.get("/getPointCritics/:interestPointName", interestPoints.getCritics);//V

app.get("/getCountries",users.getCountries)

app.post('/register', users.register);//V

app.post('/retrievePasswordQuestion', users.retrievePassQuest);//V

app.post('/retrievePassword', users.retrievePassword);//V

app.get("/private/getLastSavedPoints/", users.getLastSaved);//v

app.post('/private/saveFavouritePoints', users.saveFavourite);//v

app.get("/private/getUserFavouritePoints", users.getFavourite);//v

app.post('/private/saveCritic', interestPoints.saveCritic);//v

app.get("/private/getRecommendedPoints", users.getRecommended);//v

const port = process.env.PORT || 3000; //environment variable
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});












