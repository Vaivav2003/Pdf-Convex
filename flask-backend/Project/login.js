const RegistrationForm = document.getElementById("registration");

RegistrationForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const obj_json = {
        username : name,
        email : email,
        password : password
    };

    const j = JSON.stringify(obj_json);

    registration(j);
})


function registration(jsonString) {
    
    fetch("http://127.0.0.1:5000/registration", {
        method : 'POST',
        headers : {
            'Content-Type' : 'application/json'
        },
        body : jsonString
    }).then((response) => {
        if(!response.ok){
            throw new Error("Registration Unsuccessful");
        }
        return response.json();
    }).then((data) => {
        console.log(data);
    }).catch((e) => {
        console.error(`Error : ${e}`);
    });
}


const LoginForm = document.getElementById("login");

LoginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("Lemail").value;
    const password = document.getElementById("Lpassword").value;

    const obj_json = {
        email : email,
        password : password
    };

    const j = JSON.stringify(obj_json);

    login(j);
});

function login(jsonString){
    fetch("http://127.0.0.1:5000/login", {
        method : 'POST',
        headers : {
            'Content-Type' : 'application/json'
        },
        credentials : 'include',
        body : jsonString
    }).then((response) => {
        if(!response.ok){
            throw new Error("Login Unsuccessful");
        }
        return response.json();
    }).then((data) => {
        console.log(data);
    }).catch((e) => {
        console.error(`Error : ${e}`);
    });
}

const UploadForm = document.getElementById("upload");

UploadForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const form = event.target;
    const formdata = new FormData(form);
    console.log(formdata);

    fetch("http://127.0.0.1:5000/upload", {
        method : 'POST',
        credentials : 'include',
        body : formdata
    }).then((response) => {
        if(!response.ok){
            throw new Error("Upload Unsuccessful");
        }
        return response.json();
    }).then((data) => {
        console.log(data);
    }).catch((e) => {
        console.error(`Error : ${e}`);
    });
});


const getButton = document.getElementById("get_pdf");

getButton.addEventListener("click", (event) => {

    fetch("http://127.0.0.1:5000/download/1")
    .then((response) => {
        console.log(response);
        return response.blob();
    }).then((pdf_file) => {
            const url = URL.createObjectURL(pdf_file) //creating url for blob object
            window.open(`${url}`, "_blank");
    }).catch((e) => {
        console.error(`Error : ${e}`);
    })
})


const QuestionForm = document.getElementById("ques");

QuestionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const question = document.getElementById("question").value;

    const obj_json = {
        question : question,
    };

    const j = JSON.stringify(obj_json);

    fetch("http://127.0.0.1:5000/question", {
        method : 'POST',
        headers : {
            'Content-Type' : 'application/json'
        },
        credentials : 'include',
        body : j
    }).then((response) => {
        if(!response.ok){
            throw new Error("Fetch Unsuccessful");
        }
        return response.json();
    }).then((data) => {
        console.log(data);
    }).catch((e) => {
        console.error(`Error : ${e}`);
    });
});


const SelectForm = document.getElementById("select");

SelectForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const form = event.target;
    const formdata = new FormData(form);
    console.log(formdata);

    fetch("http://127.0.0.1:5000/selected", {
        method : 'POST',
        credentials : 'include',
        body : formdata
    }).then((response) => {
        if(!response.ok){
            throw new Error("Selection Unsuccessful");
        }
        return response.json();
    }).then((data) => {
        console.log(data);
    }).catch((e) => {
        console.error(`Error : ${e}`);
    });
});