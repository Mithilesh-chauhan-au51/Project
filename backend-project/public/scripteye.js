
// eye symbol functon
const passwordField = document.querySelector("#password");
const passwordToggle = document.querySelector(".password-toggle");

passwordToggle.addEventListener("mousedown", function() {
    passwordToggle.classList.add("hide-password");
    passwordToggle.classList.remove("show-password");
    passwordField.setAttribute("type", "text");
});

passwordToggle.addEventListener("mouseup", function() {
    passwordToggle.classList.add("show-password");
    passwordToggle.classList.remove("hide-password");
    passwordField.setAttribute("type", "password");
});
   
