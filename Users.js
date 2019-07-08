const jwt = require("jsonwebtoken");
const secret = "GRproject";
const DButilsAzure = require('./DButils');
const fs = require('fs');
const xml2js = require('xml2js');

const FastPriorityQueue = require('fastpriorityqueue');


exports.authenticate = function (req, res, next) {
    const token = req.header("x-auth-token");
    // no token
    if (!token) res.status(401).send("Access denied. No token provided.");
    // verify token
    try {
        const decoded = jwt.verify(token, secret);
        req.decoded = decoded;
        next(); //move on to the actual function
    } catch (exception) {
        res.status(400).send("Invalid token.");
    }
};

exports.login = function (req, res) {
    // Prepare output in JSON format
    var userName = req.body.userName;
    var password = req.body.password;
    DButilsAzure.execQuery("SELECT userId FROM users WHERE userName ='" + userName + "' AND password = '" + password + "'")
        .then(function (idRes) {
                payload = {id: idRes[0]["userId"], name: userName, admin: false};
                options = {expiresIn: "1d"};
                const token = jwt.sign(payload, secret, options);
                res.send(token);
            }
        ).catch(function (err) {
        console.log(err);
        res.status(400).send("Invalid user name or password")
    });
};

function alphanumeric(inputtxt) {
    var letters = /^[0-9a-zA-Z]+$/;
    if (inputtxt.match(letters)) {
        return true;
    } else {
        return false;
    }
}

function alpha(inputtxt) {
    var letters = /^[a-zA-Z]+$/;
    if (inputtxt.match(letters)) {
        return true;
    } else {
        return false;
    }
}

function parseXml(filePath) {
    const parser = new xml2js.Parser();
    let xmlString = fs.readFileSync(filePath, "utf8");
    let res = null;
    parser.parseString(xmlString, function (error, result) {
        if (result != null) {
            res = result;
        }
        else{
        console.log(error)
        }
    })
    return res
}

exports.getCountries = function(req,res){
    var countries = parseXml("countries.xml");
    countries = countries["Countries"]["Country"];
    if (countries!=null){
    res.send(JSON.stringify(countries));
    }
}

exports.register = function (req, res) {
    var registerBool = false;
    var userName = req.body.userName;
    if (userName.length < 3 || userName.length > 8 || !alpha(userName)) {
        res.status(400).send("Invalid user name (3 to 8 chars only letters)")
        return;
    }
    var password = req.body.password;
    if (password.length < 5 || password.length > 10 || !alphanumeric(password)) {
        res.status(400).send("Invalid password (5-10 chars only digits or letters)");
        console.log(res);
        return;
    }
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var city = req.body.city;
    var country = req.body.country;
    var country_exist = false;
    var countries = parseXml("countries.xml");
    countries = countries["Countries"]["Country"];
    for (let i = 0; i < countries.length; i++) {
        console.log(countries[i]["Name"][0]);
        if (countries[i]["Name"][0] === country) {
            country_exist = true;
        }
    }
    if (!country_exist) {
        res.status(400).send("Country doesn't exist: " + country);
        console.log(res);
        return;
    }
    var email = req.body.email;
    var lastPointSavedId1 = 0;
    var lastPointSavedId2 = 0;
    if (req.body.interestCategories == null || req.body.verificationQuestion == null || req.body.verificationAnswer == null) {
        res.status(400).send("Missing register fields");
        console.log(res);
        return;
    }
    var interestCategories = req.body.interestCategories;
    var verificationQuestion = req.body.verificationQuestion;
    if (verificationQuestion.length < 2) {
        console.log(res);
        res.status(400).send("Missing register fields");

    }
    var verificationAnswer = req.body.verificationAnswer;
    let userName_exist = false;
    DButilsAzure.execQuery("SELECT userId FROM users WHERE userName = '"+userName+"'")
        .then(function (res) {
            if (res!=null){
                userName_exist = true;
            }
        });
    if (userName_exist){
        console.log(res);
        res.status(400).send("User name is taken");
        return;
    }
    const query = "INSERT INTO users ("
    + "userName, "
    + "password, "
    + "firstName, "
    + "lastName, "
    + "city, "
    + "country, "
    + "email, "
    + "lastPointSavedId1, "
    + "lastPointSavedId2)"
    + "VALUES (" +
    "'" + userName + "'," +
    "'" + password + "'," +
    "'" + firstName + "'," +
    "'" + lastName + "'," +
    "'" + city + "'," +
    "'" + country + "'," +
    "'" + email + "'," +
    "'" + lastPointSavedId1 + "'," +
    "'" + lastPointSavedId2 + "');"
    DButilsAzure.execQuery(query)
        .then(function (result) {
            DButilsAzure.execQuery("SELECT userId FROM users WHERE userName = '" + userName + "'")
                .then(function (userRes) {
                    let q = "SELECT categoryID FROM categories WHERE";
                    let i = 0;
                    for (; i < interestCategories.length - 1; i++) {
                        q += " categoryName = '" + interestCategories[i] + "' OR";
                    }
                    q += " categoryName = '" + interestCategories[i] + "'";
                    DButilsAzure.execQuery(q)
                        .then(function (categoryRes) {
                            categoryRes.forEach(function (qElement) {
                                var categoryId = qElement["categoryID"];
                                DButilsAzure.execQuery("INSERT INTO usersInterestCategories ("
                                    + "categoryID, "
                                    + "userId)"
                                    + "VALUES (" +
                                    "'" + categoryId + " '," +
                                    "'" + userRes[0].userId + "');")
                            })
                        });
                    var ind = 0;
                    verificationQuestion.forEach(function (qElement) {
                        DButilsAzure.execQuery("INSERT INTO usersVerificationQuestions ("
                            + "question, "
                            + "answer, "
                            + "userId)"
                            + "VALUES (" +
                            "'" + qElement + " '," +
                            "'" + verificationAnswer[ind] + " '," +
                            "'" + userRes[0].userId + "');");
                        ind++;
                    })

                }).then(function (result) {
                registerBool = true;
                res.send(JSON.stringify(registerBool))
            })
                .catch(function (err) {
                    console.log(err);
                    res.status(400).send(err);
                });
        })
        .catch(function (err) {
            console.log(err);
            res.status(400).send("Invalid register field");
        });
};

exports.retrievePassQuest = function (req, res) {
    var userName = req.body.userName;
    DButilsAzure.execQuery("SELECT userId FROM users WHERE userName = '" + userName + "'")
        .then(function (userRes) {
            var userId = userRes[0]["userId"];
            DButilsAzure.execQuery("SELECT question FROM usersVerificationQuestions WHERE userId = '" + userId + "'")
                .then(function (verificationQuestionsRes) {
                    var verificationQuestionsDict = {};
                    verificationQuestionsRes.forEach(function (element) {
                        verificationQuestionsDict[userName] = element["question"];
                    });
                    res.send(JSON.stringify(verificationQuestionsDict));
                })
        })
        .catch(function (err) {
            console.log(err);
            res.status(400).send("Invalid user name");
        })
};

exports.retrievePassword = function (req, res) {
    var userName = req.body.userName;
    var question = req.body.question;
    var answer = req.body.answer;
    DButilsAzure.execQuery("SELECT userId FROM users WHERE userName = '" + userName + "'")
        .then(function (userRes) {
            var userId = userRes[0]["userId"];
            DButilsAzure.execQuery("SELECT question, answer FROM usersVerificationQuestions WHERE userId = '" + userId + "'")
                .then(function (verificationQuestionsRes) {
                    var verificationQuestionsDict = {};
                    verificationQuestionsRes.forEach(function (element) {
                        verificationQuestionsDict[element["question"]] = element["answer"];
                    });
                    if (verificationQuestionsDict[question] == answer + " ")
                    {
                        DButilsAzure.execQuery("SELECT password FROM users WHERE userName = '" + userName + "'")
                            .then(function (passRes) {
                                res.send(JSON.stringify(passRes[0]["password"]));
                            })
                    }
                    else {
                        res.send(JSON.stringify("Wrong answer, can't retrive password"));
                    }
                })
        })
        .catch(function (err) {
            console.log(err);
            res.status(400).send("Invalid user name");
        })
};

exports.getLastSaved = (req, res) => {
    var userId = req.decoded.id;
    DButilsAzure.execQuery("SELECT lastPointSavedId1, lastPointSavedId2 FROM users WHERE userId = '" + userId + "'")
        .then(function (userRes) {
            var lastPointSavedId1 = userRes[0]["lastPointSavedId1"];
            var lastPointSavedId2 = userRes[0]["lastPointSavedId2"];
            DButilsAzure.execQuery("SELECT interestPointName, pointImage FROM interestPoints WHERE interestPointID = '" + lastPointSavedId1 + "' OR interestPointID = '" + lastPointSavedId2 + "'")
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
            res.status(400).send("No saved Points");
        })
};

exports.saveFavourite = function (req, res) {
    var saveBool = false;
    var userId = req.decoded.id;
    var interestPointNames = req.body.interestPointNames;
    interestPointNames.forEach(function (pElement) {
        DButilsAzure.execQuery("SELECT interestPointID FROM interestPoints WHERE interestPointName = '" + pElement + "'")
            .then(function (interestPointRes) {
                var interestPointId = interestPointRes[0]["interestPointID"];
                DButilsAzure.execQuery("INSERT INTO userSavedPoints ("
                    + "interestPointID, "
                    + "userId)"
                    + "VALUES (" +
                    "'" + interestPointId + " '," +
                    "'" + userId + "');")
            })
            .catch(function (err) {
                console.log(err);
                res.status(400).send("no such point");
            });
    });
    var lastSavedPoint1 = interestPointNames.slice(-1)[0];
    if (interestPointNames.length > 1) {
        var lastSavedPoint2 = interestPointNames.slice(-2)[0];
        DButilsAzure.execQuery("SELECT interestPointID FROM interestPoints WHERE interestPointName = '" + lastSavedPoint1 + "' OR interestPointName = '" + lastSavedPoint2 + "'")
            .then(function (savedInterestPointRes) {
                var lastSavedPointId1 = savedInterestPointRes[0]["interestPointID"];
                var lastSavedPointId2 = savedInterestPointRes[1]["interestPointID"];
                DButilsAzure.execQuery("UPDATE users SET lastPointSavedId1 = '" + lastSavedPointId1 + "' WHERE userId = '" + userId + "'")
                    .then(function (result) {
                        DButilsAzure.execQuery("UPDATE users SET lastPointSavedId2 = '" + lastSavedPointId2 + "' WHERE userId = '" + userId + "'")
                            .then(function (result) {
                                saveBool = true;
                                res.send(JSON.stringify(saveBool));
                            })
                    })
            })
            .catch(function (err) {
                console.log(err);
                res.status(400).send("invalid favourite");
            });
    } else {
        DButilsAzure.execQuery("SELECT interestPointID FROM interestPoints WHERE interestPointName = '" + lastSavedPoint1 + "'")
            .then(function (savedInterestPointRes) {
                var lastSavedPointId1 = savedInterestPointRes[0]["interestPointID"];
                DButilsAzure.execQuery("SELECT lastPointSavedId1 FROM users WHERE userId = '" + userId + "'")
                    .then(function (savedInterestPoint2Res) {
                        if (savedInterestPoint2Res[0]["lastPointSavedId1"] != null) {
                            var lastSavedPointId2 = savedInterestPoint2Res[0]["lastPointSavedId1"];
                            DButilsAzure.execQuery("UPDATE users SET lastPointSavedId1 = '" + lastSavedPointId1 + "' WHERE userId = '" + userId + "'")
                                .then(function (result) {
                                    DButilsAzure.execQuery("UPDATE users SET lastPointSavedId2 = '" + lastSavedPointId2 + "' WHERE userId = '" + userId + "'")
                                        .then(function (result) {
                                            saveBool = true;
                                            res.send(JSON.stringify(saveBool));
                                        })
                                })
                        } else {
                            DButilsAzure.execQuery("UPDATE users SET lastPointSavedId1 = '" + lastSavedPointId1 + "' WHERE userId = '" + userId + "'")
                                .then(function (result) {
                                    saveBool = true;
                                    res.send(JSON.stringify(saveBool));
                                })
                        }
                    })
            })
            .catch(function (err) {
                console.log(err);
                res.status(400).send("invalid favourite");
            });
    }
};

exports.getFavourite = (req, res) => {
    var userId = req.decoded.id;
    var interestPointsDict = {};
    DButilsAzure.execQuery("SELECT interestPointID FROM userSavedPoints WHERE userId = '" + userId + "'")
        .then(function (pointsRes) {
            var query = "SELECT interestPointName, pointImage, categoryID, averageRank FROM interestPoints WHERE interestPointID = '" + pointsRes[0]["interestPointID"] + "'";
            pointsRes.forEach(function (element) {
                if (element !== pointsRes[0]) {
                    query += " OR interestPointID = '" + element["interestPointID"] + "'";
                }
            });
            DButilsAzure.execQuery(query)
                .then(function (pointsDetailsRes) {
                    pointsDetailsRes.forEach(function (element) {
                        pointDetails = [element["pointImage"], element["categoryID"], element["averageRank"]];
                        interestPointsDict[element["interestPointName"]] = pointDetails;
                    });
                    res.send(JSON.stringify(interestPointsDict));
                })
        })
        .catch(function (err) {
            console.log(err);
            res.status(400).send("no favourites");
        })
};

exports.getRecommended = (req, res) => {
    let userId = req.decoded.id;
    DButilsAzure.execQuery("SELECT categoryID FROM usersInterestCategories WHERE userId = '" + userId + "'")
        .then(function (interestCategories) {
            let query = "SELECT interestPointName, pointImage FROM interestPoints WHERE ";
            let i = 0;
            for (; i < interestCategories.length - 1; i++) {
                query += "categoryID = '" + String(interestCategories[i].categoryID) + "' OR ";
            }
            query += "categoryID = '" + String(interestCategories[i].categoryID) + "'";
            DButilsAzure.execQuery(query)
                .then(function (pointsRes) {
                        let q = new FastPriorityQueue(function (a, b) {
                            return a.averageRank > b.averageRank;
                        });
                        for (let i = 0; i < pointsRes.length; i++) {
                            q.add(pointsRes[i]);
                        }
                        let interestPointsDict = {};
                        q.forEach(function (element) {
                            interestPointsDict[element["interestPointName"]] = element["pointImage"];
                        });
                        res.send(JSON.stringify(interestPointsDict));
                        // res.send(JSON.stringify(pointsRes));
                    }
                ).catch(function (err) {
                console.log(err);
                res.send(err)
            })
        })
        .catch(function (err) {
            console.log(err);
            res.send(err)
        })
};


