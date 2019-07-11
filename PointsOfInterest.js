const DButilsAzure = require('./DButils');
const FastPriorityQueue = require('fastpriorityqueue');

exports.getAllPoints = (req, res) => {
    DButilsAzure.execQuery("SELECT interestPointName, pointImage, categoryID, averageRank FROM interestPoints")
        .then(function (pointsRes) {
            var interestPointsDict = {};
            pointsRes.forEach(function (element) {
                pointDetails = [element["pointImage"], element["categoryID"], element["averageRank"]];
                interestPointsDict[element["interestPointName"]] = pointDetails;
            });
            res.send(JSON.stringify(interestPointsDict));
        })
        .catch(function (err) {
            console.log(err);
            res.send(err)
        })
};

exports.getPointProperties = (req, res) => {
    var interestPointsName = req.params.interestPointName;
    DButilsAzure.execQuery("SELECT * FROM interestPoints WHERE interestPointName = '" + interestPointsName + "'")
        .then(function (pointsRes) {
            var interestPointsDict = {};
            pointsRes.forEach(function (element) {
                pointDetails = [element["numOfViews"], element["description"], element["averageRank"], element["lastCriticId1"], element["lastCriticId2"]];
                interestPointsDict[element["interestPointName"]] = pointDetails;
            });
            res.send(JSON.stringify(interestPointsDict));
        })
        .catch(function (err) {
            console.log(err);
            res.status(400).send("invalid point name")
        })
};

exports.saveCritic = function (req, res) {
    var criticBool = false;
    var interestPointName = req.body.interestPointName;
    var userId = req.decoded.id;
    var rank = req.body.rank;
    var description = req.body.description;
    var date = new Date();
    date = date.getUTCFullYear() + '-' +
        ('00' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
        ('00' + date.getUTCDate()).slice(-2) + ' ' +
        ('00' + date.getUTCHours()).slice(-2) + ':' +
        ('00' + date.getUTCMinutes()).slice(-2) + ':' +
        ('00' + date.getUTCSeconds()).slice(-2);
    DButilsAzure.execQuery("SELECT interestPointID FROM interestPoints WHERE interestPointName = '" + interestPointName + "'")
        .then(function (pointRes) {
            var interestPointId = pointRes[0]["interestPointID"];
            DButilsAzure.execQuery("INSERT INTO critics ("
                + "interestPointID, "
                + "userID, "
                + "rank, "
                + "criticContent,"
                + "date)"
                + "VALUES (" +
                "'" + interestPointId + " '," +
                "'" + userId + " '," +
                "'" + rank + " '," +
                "'" + description + "'," +
                "'" + date + " '" + ");")
                .then(function (result) {
                    DButilsAzure.execQuery("SELECT rank FROM critics WHERE interestPointID = '" + interestPointId + "'")
                        .then(function (criticsRes) {
                            var count = 0;
                            var sum = 0;
                            criticsRes.forEach(function (element) {
                                sum = sum + element["rank"];
                                count += 1;
                            });
                            averageRank = sum / count;
                            DButilsAzure.execQuery("UPDATE interestPoints SET averageRank = '" + averageRank + "' WHERE interestPointID = '" + interestPointId + "'")
                                .then(function (result) {
                                    criticBool = true;
                                    res.send(JSON.stringify(criticBool));
                                })
                        })
                })
        })
        .catch(function (err) {
            console.log(err);
            res.send(err);
        });
};

exports.increaseViews = (req, res) => {
    var interestPointName = req.body.interestPointName
    var numOfViews = req.body.numOfViews + 1;
    DButilsAzure.execQuery("UPDATE interestPoints SET  numOfViews = '" + numOfViews + "'" + " WHERE interestPointName = '" + interestPointName + "'")
        .then(function () {
            res.send(true);
        })
        .catch(function (error) {
            console.log(error);
        })
}

exports.getCritics = (req, res) => {
    var interestPointName = req.params.interestPointName;
    DButilsAzure.execQuery("SELECT interestPointID FROM interestPoints WHERE interestPointName = '" + interestPointName + "'")
        .then(function (poiID) {
            DButilsAzure.execQuery("SELECT criticContent,date FROM critics WHERE interestPointID = '" + poiID[0].interestPointID + "'")
                .then(function (criticsRes) {
                    let critics = [];
                    criticsRes.forEach(obj => {
                        if (obj.criticContent != "") {
                            critics.push([obj.criticContent, obj.date])
                        }
                    })
                    res.send(JSON.stringify(critics));
                })
        })
        .catch(function (err) {
            console.log(err);
            res.status(400).send("invalid point name")
        })
}

exports.getRandomPopular = (req, res) => {
    DButilsAzure.execQuery("SELECT interestPointName, pointImage, averageRank FROM interestPoints WHERE averageRank > 3")
        .then(function (pointsRes) {
            let q = new FastPriorityQueue(function (a, b) {
                return a.averageRank > b.averageRank;
            });
            for (let i = 0; i < pointsRes.length; i++) {
                if (pointsRes[i].averageRank > 3.5)
                    q.add(pointsRes[i]);
            }
            let interestPointsDict = {};
            q.forEach(function (element) {
                interestPointsDict[element["interestPointName"]] = element["pointImage"];
            });
            res.send(JSON.stringify(interestPointsDict));
        })
        .catch(function (err) {
            console.log(err);
            res.send(err)
        });
};

exports.getPointByName = (req, res) => {
    interestPointName = req.params.interestPointName;
    DButilsAzure.execQuery("SELECT pointImage FROM interestPoints WHERE interestPointName = '" + interestPointName + "'")
        .then(function (interestPointRes) {
            var interestPointDict = {};
            interestPointDict[interestPointName] = interestPointRes[0]["pointImage"];
            res.send(JSON.stringify(interestPointDict));
        })
        .catch(function (err) {
            console.log(err);
            res.status(400).send("invalid point name")
        })
};

