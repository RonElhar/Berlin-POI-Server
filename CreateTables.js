const Points = require('./PointsOfInterestDictionary');
const DButilsAzure = require('./DButils');

var createTables = "CREATE TABLE categories "
    + "(categoryID INTEGER NOT NULL PRIMARY KEY, "
    + "categoryName VARCHAR(20) NOT NULL); "
    + "CREATE TABLE interestPoints "
    + "(interestPointID INTEGER NOT NULL PRIMARY KEY, "
    + "interestPointName VARCHAR(20) NOT NULL, "
    + "categoryID INTEGER NOT NULL, "
    + "numOfViews INTEGER NOT NULL, "
    + "description VARCHAR(200) NOT NULL, "
    + "averageRank INTEGER NOT NULL, "
    + "lastCriticId1 INTEGER NOT NULL, "
    + "lastCriticId2 INTEGER NOT NULL); "
    + "CREATE TABLE critics "
    + "(interestPointID INTEGER NOT NULL, "
    + "userID INTEGER NOT NULL, "
    + "rank INTEGER NOT NULL, "
    + "criticContent VARCHAR(150) NOT NULL, "
    + "primary key (interestPointID, userId)); "
    + "CREATE TABLE users "
    + "(userId INTEGER NOT NULL PRIMARY KEY, "
    + "userName VARCHAR(8) NOT NULL, "
    + "password VARCHAR(10) NOT NULL, "
    + "firstName VARCHAR(20) NOT NULL, "
    + "lastName VARCHAR(20) NOT NULL, "
    + "country VARCHAR(20) NOT NULL, "
    + "city VARCHAR(20) NOT NULL, "
    + "email VARCHAR(20) NOT NULL, "
    + "lastPointSavedId1 INTEGER NOT NULL, "
    + "lastPointSavedId2 INTEGER NOT NULL); "
    + "CREATE TABLE usersInterestCategories "
    + "(categoryID INTEGER NOT NULL, "
    + "userId INTEGER NOT NULL, "
    + "primary key (categoryID, userId)); "
    + "CREATE TABLE usersVerificationQuestions "
    + "(question VARCHAR(20) NOT NULL, "
    + "answer VARCHAR(20) NOT NULL, "
    + "userId INTEGER NOT NULL, "
    + "primary key (question, userId)); "
    + "CREATE TABLE userRecommendedPoints "
    + "(interestPointID INTEGER NOT NULL, "
    + "userId INTEGER NOT NULL, "
    + "primary key (interestPointID, userId)); "
    + "CREATE TABLE userSavedPoints "
    + "(interestPointID INTEGER NOT NULL, "
    + "userId INTEGER NOT NULL, "
    + "primary key (interestPointID, userId));";

function createAll() {
    DButilsAzure.execQuery(createTables)
        .then(function (result) {
            res.send(result)
        })
        .catch(function (err) {
            console.log(err);
            res.send(err)
        })
}
// functions for our use(insert categories and interest Points
function insertCategories() {
    var insertCategoryTable = "INSERT INTO categories ("
        + "categoryID, "
        + "categoryName)"
        + "VALUES ("
        + "'1', "
        + " 'Museums'),"
        + "("
        + "'2', "
        + "'Restaurants'),"
        + "("
        + "'3', "
        + "'Shopping centers'),"
        + "("
        + "'4', "
        + "'Night clubs');";
    DButilsAzure.execQuery(insertCategoryTable)
        .then(function (result) {
            res.send(result)
        })
        .catch(function (err) {
            console.log(err);
            res.send(err)
        })
}

function insertPoints() {
    for (var i = 4; i < 5; i++) {
        DButilsAzure.execQuery("INSERT INTO interestPoints ("
            + "interestPointID, "
            + "categoryID, "
            + "interestPointName, "
            // + "numOfViews, "
            + "description, "
            // + "averageRank, "
            // + "lastCriticId1, "
            // + "lastCriticId2, "
            + "pointImage)"
            + "VALUES (" +
            "'" + Points.POI[i].interestPointID + "'," +
            "'" + Points.POI[i].categoryID + "'," +
            "'" + Points.POI[i].interestPointName + "'," +
            "'" + Points.POI[i].description + "'," +
            "'" + Points.POI[i].pointImage + "');")
            .then(function (result) {
                res.send(result)
            })
            .catch(function (err) {
                console.log(err);
                res.send(err)
            })
    }
}