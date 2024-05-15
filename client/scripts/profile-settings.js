$(function () {
  passwordVisibility();

  $("#username").on("blur", validateUsernameField);
  $("#change-username").on("submit", function (e) {
    e.preventDefault();
    if (validateUsername($("#username").val()) === null) {
      e.target.submit();
    } else validateUsernameField();
  });

  $("#password, #confirm-password").on("blur", validatePasswordForm);
  $("#change-password").on("submit", function (e) {
    e.preventDefault();
    if (
      validatePassword($("#password").val(), $("#confirm-password").val()) ===
      null
    ) {
      e.target.submit();
    } else validatePasswordForm();
  });

  $("#cancel-btn").on("click", function () {
    $("#initial-picture").show();
    $("#picture").val("");
    $("#preview-picture, #preview-control").hide();
  });

  $("#picture").on("change", function (e) {
    handleFileUpload(
      e.target.files[0],
      51200,
      ["image/jpeg", "image/webp", "image/png"],
      function (file) {
        let fileURL = URL.createObjectURL(file);
        $("#initial-picture").hide();
        $("#preview-control").show();
        $("#preview-picture")
          .show()
          .attr("src", fileURL)
          .off("load")
          .on("load", function (e) {
            URL.revokeObjectURL(fileURL);
          });
      }
    );
  });
});
