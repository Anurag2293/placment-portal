require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

const app = express();

// MiddleWare
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Constants
const ADMIN_USERNAME = 'admin@access';
const ADMIN_PASSWORD = '12345';

// Database
mongoose.connect("mongodb://localhost:27017/placementDB");

const studentSchema = new mongoose.Schema({
    rollNo: Number,
    password: String,
    name: String,
    CGPA: Number,
    phoneNumber: Number,
    branch: String,
    Gender: String,
    emailID: String
});

const companySchema = new mongoose.Schema({
    companyName: String,
    companyEmail: String,
    password: String,
    contactNumber: {
        type: Number,
        default: 000000
    },
    branches: {
        type: String,
        default: 'All Branches'
    },
    domain: {
        type: String,
        default: 'Software'
    },
    jobDescription: {
        type: String,
        default: 'fghkg'
    },
    gstNo: {
        type: String,
        default: 'ABCD12345'
    },
    status: {
        type: Number,
        default: 0
    }
})

const Student = mongoose.model("Student", studentSchema);
const Company = mongoose.model("Company", companySchema);

// Routes

app.get('/', (req, res)=>{
    res.render('home', {
        success:''
    });
});

app.get('/signup', (req, res) => {
    console.log(req.body);
    res.render('signup', {
        sameUsername:''
    });
});

app.post('/signup', (req, res) => {

    bcrypt.hash(req.body.password, saltRounds, (hashError, hash)=>{
        Student.findOne({ rollNo: req.body.rollNumber }, (findError, foundUser) => {
            if (findError) {
                console.log(findError);
            } else {
                if (foundUser) {
                    res.render("signup", {
                        sameUsername: "This username already exist. Try another or contact the owner if there is any problem."
                    });
                } else {
                    const newStudent = new Student({
                        rollNo: req.body.rollNumber,
                        password: hash,
                        name: req.body.name,
                        CGPA: req.body.cgpa,
                        phoneNumber: req.body.phoneNumber,
                        branch: req.body.branch,
                        Gender: req.body.gender,
                        emailID: req.body.email
                    });
                    newStudent.save((saveError) => {
                        if (saveError) {
                            console.log(saveError);
                        } else {
                            res.render("home", {
                                success: "Successfully registered."
                            });
                        }
                    });
                }
            }
        });
    });
})


app.post('/', (req, res) => {
    const enteredUsername = req.body.username;
    const enteredPassword = req.body.password;

    Student.findOne({ rollNo: enteredUsername }, (userFoundError, foundStud) => {
        if (userFoundError) {
            console.log(userFoundError);
            res.render('home', {
                success: "There was some error.😐 Try again!"
            });
        } else {
            if (foundStud) {
                bcrypt.compare(enteredPassword, foundStud.password, (compareError, result)=>{
                    if(result === true){
                        console.log("Correct Password");
                        res.render('student', {
                            name: foundStud.name
                        });
                    } else {
                        res.render('home', {
                            success: "Wrong Password.🤨 Try Again."
                        });
                    }
                });
            } else {
                res.render('home', {
                    success: "No such user found.😕"
                });
            }
        }
    });
});

app.get('/student/apply', (req, res) => {
    Company.find({status: 1}, (companiesfoundError, companies) => {
        if(companiesfoundError) {
            console.log(companiesfoundError);
        } else {
            res.render('apply', {
                companies: companies
            });
        }
    })


    // res.render('apply');
})

// Company
app.get('/company', (req, res) => {
    res.render('companyEntry', {
        companyMessage: ''
    });
})

app.post('/company', (req, res) => {
    const enteredUsername = req.body.username;
    const enteredPassword = req.body.password;

    Company.findOne({ companyEmail: enteredUsername }, (compFoundError, foundCompany) => {
        if (compFoundError) {
            console.log(compFoundError);
            res.render('home', {
                success: "There was some error.😐 Try again!"
            });
        } else {
            if (foundCompany) {
                bcrypt.compare(enteredPassword, foundCompany.password, (compareError, result)=>{
                    if(result === true){
                        console.log("Correct Password");
                        res.render('company', {
                            name: foundCompany.companyName,
                            status: foundCompany.status
                            // status: -1
                        });
                    } else {
                        res.render('home', {
                            success: "Wrong Password.🤨 Try Again."
                        });
                    }
                });
            } else {
                res.render('home', {
                    success: "No such company found.😕"
                });
            }
        }
    });
})

app.get('/company/signup', (req, res) => {
    res.render('companySignup');
})

app.post('/company/signup', (req, res) => {

    bcrypt.hash(req.body.password, saltRounds, (hashError, hash)=>{
        Company.findOne({ companyEmail: req.body.rollNumber }, (findError, foundCompany) => {
            if (findError) {
                console.log(findError);
            } else {
                if (foundCompany) {
                    res.render("signup", {
                        sameUsername: "This username already exist. Try another or contact the owner if there is any problem."
                    });
                } else {
                    const newCompany = new Company({
                        companyName: req.body.companyName,
                        companyEmail: req.body.companyEmail,
                        password: hash,
                    });
                    newCompany.save((saveError) => {
                        if (saveError) {
                            console.log(saveError);
                        } else {
                            res.render('companyEntry', {
                                companyMessage: "Successfully registered. Please login after sometime to check your Application Status"
                            });
                        }
                    });
                }
            }
        });
    });
});

// Admin
app.get('/admin', (req, res) => {
    res.render('adminEntry', {
        adminMessage: ''
    });
});

app.post('/admin', (req, res) => {
    const enteredUsername = req.body.adminUsername;
    const enteredPassword = req.body.adminPassword;

    if(enteredUsername === ADMIN_USERNAME && enteredPassword === ADMIN_PASSWORD){
        
        Company.find({status: 0}, (companiesfoundError, pendingCompanies) => {
            Company.find({status: -1}, (rejectfoundError, rejectedCompanies) =>{
                Company.find({status: 1}, (acceptedfoundError, acceptedCompanies) =>{
                    if(acceptedfoundError){
                        console.log(acceptedfoundError)
                    }else{
                        if(rejectfoundError){
                            console.log(rejectfoundError)
                        }else{
                            if(companiesfoundError) {
                                console.log(companiesfoundError);
                            } else {
                                res.render('admin', {
                                    pendingCompanies: pendingCompanies,
                                    rejectedCompanies: rejectedCompanies,
                                    acceptedCompanies: acceptedCompanies
                                });
                            }
                        }
                    }
                })
            })
        })
        
    }
    else{
        res.render('adminEntry', {
            adminMessage: 'Invalid Credentials! Please try Again.'
        });
    }

})

app.post('/admin/changes', async (req, res) => {
    console.log(req.body);
    const finalStatus = Number.parseInt(req.body.selection);
    const companyEmail = req.body.companyEmail;

    let doc = await Company.findOneAndUpdate({companyEmail: companyEmail}, {status: finalStatus});

    console.log(doc.status);

    Company.find({status: 0}, (companiesfoundError, pendingCompanies) => {
        Company.find({status: -1}, (rejectfoundError, rejectedCompanies) =>{
            Company.find({status: 1}, (acceptedfoundError, acceptedCompanies) =>{
                if(acceptedfoundError){
                    console.log(acceptedfoundError)
                }else{
                    if(rejectfoundError){
                        console.log(rejectfoundError)
                    }else{
                        if(companiesfoundError) {
                            console.log(companiesfoundError);
                        } else {
                            res.render('admin', {
                                pendingCompanies: pendingCompanies,
                                rejectedCompanies: rejectedCompanies,
                                acceptedCompanies: acceptedCompanies
                            });
                        }
                    }
                }
            })
        })
    })


})

app.listen(3000, ()=>{
    console.log("Server is running on port: http://localhost:3000/");
})