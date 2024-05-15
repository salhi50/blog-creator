$(function () {
  passwordVisibility();

  $("#username").on("blur", validateUsernameField);
  $("#password, #confirm-password").on("blur", validatePasswordForm);

  $("form").on("submit", function (e) {
    e.preventDefault();
    if (
      validateUsername($("#username").val()) === null &&
      validatePassword($("#password").val(), $("#confirm-password").val()) ===
        null
    ) {
      e.target.submit();
    } else {
      validateUsernameField();
      validatePasswordForm();
    }
  });
});
