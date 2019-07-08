const DButilsAzure = require('./DButils');


exports.getPointsOfCategory = function (req, res) {
    var categoryName = req.params.categoryName;
    DButilsAzure.execQuery("SELECT categoryID FROM categories WHERE categoryName = '" + categoryName + "'")
        .then(function (categoryRes) {
            var categoryId = categoryRes[0]["categoryID"];
            DButilsAzure.execQuery("SELECT interestPointName, pointImage FROM interestPoints WHERE categoryID = '" + categoryId + "'")
                .then(function (pointsRes) {
                    var interestPointsDict = {};
                    pointsRes.forEach(function (element) {
                        interestPointsDict[element["interestPointName"]] = element["pointImage"];
                    });
                    res.send(JSON.stringify(interestPointsDict));
                })
        })
        .catch(function (err) {
            console.log(err);
            res.status(400).send("Invalid category name")
        })
};

exports.getCategories = function (req, res) {
    DButilsAzure.execQuery("SELECT * FROM categories")
        .then(function (categoriesRes) {
            var categoriesDict = {};
            categoriesRes.forEach(function (element) {
                categoriesDict[element["categoryName"]] = element["categoryID"];
            });
            res.send(JSON.stringify(categoriesDict));
        })
        .catch(function (err) {
            console.log(err);
            res.send(err)
        })
};