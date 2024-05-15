function noop() {}

function isStrEmpty(str) {
  return str.trim().length === 0;
}

function validateUsername(username) {
  const pattern = /^[a-z0-9]{3,20}$/;

  if (isStrEmpty(username)) {
    return "Username is required";
  } else if (!pattern.test(username)) {
    return "Username must be between 3 and 20 characters long, and contain only lowercase letters and numbers.";
  }

  return null;
}

function validatePassword(password, confirmPassword) {
  const pattern = /^[a-zA-Z0-9]{8,20}$/;

  if (isStrEmpty(password)) {
    return "Password is requied";
  } else if (!pattern.test(password)) {
    return "Password must be between 8 and 20 characters long, and contain only letters and numbers.";
  } else {
    if (password !== confirmPassword) {
      return "Passwords don't match.";
    }
    return null;
  }
}

function validateUsernameField() {
  const $inp = $("#username");
  const errMsg = validateUsername($inp.val());

  if (errMsg) {
    $inp.addClass("is-invalid").next().text(errMsg).show();
  } else {
    $inp.removeClass("is-invalid").next().hide();
  }
}

function validatePasswordForm() {
  const $password = $("#password");
  const $confirmPassword = $("#confirm-password");
  const errMsg = validatePassword($password.val(), $confirmPassword.val());

  if (errMsg) {
    $([$password, $confirmPassword]).addClass("is-invalid");
    $password.parent().next().text(errMsg).show();
  } else {
    $([$password, $confirmPassword]).removeClass("is-invalid");
    $password.parent().next().hide();
  }
}

function passwordVisibility() {
  $("#show-password").on("change", function (e) {
    $("#password, #confirm-password, #old-password").attr("type", function () {
      return e.target.checked ? "text" : "password";
    });
  });
}

function handleFileUpload(
  file = null,
  maxSize = 0,
  supportedMIME = [],
  onSuccess = noop
) {
  const maxSizeHuman = maxSize / 1024 + "kb";

  if (file) {
    if (supportedMIME.indexOf(file.type) === -1) {
      return alert(
        "Unsupported MIME type. Supported types: " + supportedMIME.join(", ")
      );
    } else if (file.size > maxSize) {
      return alert("File should be less than " + maxSizeHuman);
    } else {
      onSuccess(file);
    }
  }
}
