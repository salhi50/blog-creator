$(function () {
  $("#cancel-btn").on("click", function () {
    $("#preview-thumbnail").hide();
    $("#thumbnail").val("");
    $("#thumbnail-form").show();
  });

  $("#change-btn").on("click", function () {
    $("#thumbnail").trigger("click");
  });

  $("#thumbnail").on("change", function (e) {
    handleFileUpload(
      e.target.files[0],
      102400,
      ["image/jpeg", "image/png", "image/webp"],
      function (file) {
        let fileURL = URL.createObjectURL(file);
        $("#preview-thumbnail").show();
        $("#preview-thumbnail img")
          .attr("src", fileURL)
          .off("load")
          .on("load", function () {
            URL.revokeObjectURL(fileURL);
          });
        $("#thumbnail-form").hide();
      }
    );
  });
});
