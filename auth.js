function login() {

    const pass = document.getElementById("password").value;

    if (pass === "05204") {

        localStorage.setItem("auth", "true");

        window.location.href = "index.html";

    } else {

        document.getElementById("error").innerText = "Wrong password";

    }


}

function logout() {

    localStorage.removeItem("auth");

    window.location.href = "login.html";

}

