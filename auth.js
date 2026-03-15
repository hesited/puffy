const users = {
    'migushika': 'Ste06695',
    'hesited': 'heS204095@'
};

function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (users[username] && users[username] === password) {
        localStorage.setItem("auth", "true");
        localStorage.setItem("currentUser", username);
        window.location.href = "index.html";
    } else {
        document.getElementById("error").innerText = "Неверный логин или пароль";
    }
}

function logout() {
    localStorage.removeItem("auth");
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}

